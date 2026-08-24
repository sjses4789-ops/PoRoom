"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";
import { isRoomTag } from "@/lib/room-tags";
import { checkDailyMilestones } from "@/lib/system-challenges";
import { todayKst } from "@/lib/time";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export type ActionResult = { error: string } | null;

export type RecordVisibility = "shared" | "private" | "free";
export type JoinType = "invite" | "open";

export async function createRoom(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "neutral");
  const tags = formData.getAll("tags").map(String).filter(isRoomTag);
  const recordVisibility = String(
    formData.get("recordVisibility") ?? "shared"
  ) as RecordVisibility;
  const joinType = String(formData.get("joinType") ?? "invite") as JoinType;

  if (!name) return { error: "방 이름을 입력해주세요." };
  if (!["shared", "private", "free"].includes(recordVisibility)) {
    return { error: "잘못된 기록 공개 설정입니다." };
  }
  if (!["invite", "open"].includes(joinType)) {
    return { error: "잘못된 입장 방식 설정입니다." };
  }

  let roomId: string | null = null;

  for (let attempt = 0; attempt < 5 && !roomId; attempt++) {
    const inviteCode = generateInviteCode();
    const { data: room, error } = await supabase
      .from("rooms")
      .insert({
        name,
        invite_code: inviteCode,
        owner_id: user.id,
        color,
        tags,
        record_visibility: recordVisibility,
        join_type: joinType,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") continue; // invite_code collision, retry
      return { error: error.message };
    }

    roomId = room.id;
  }

  if (!roomId) {
    return { error: "초대코드 생성에 실패했습니다. 다시 시도해주세요." };
  }

  await supabase
    .from("room_members")
    .insert({ room_id: roomId, user_id: user.id });

  await supabase.from("room_event_categories").insert([
    { room_id: roomId, name: "공모전", color: "amber", created_by: user.id },
    { room_id: roomId, name: "출판사 투고", color: "blue", created_by: user.id },
    { room_id: roomId, name: "출간", color: "rose", created_by: user.id },
    { room_id: roomId, name: "기타", color: "neutral", created_by: user.id },
  ]);

  redirect(`/room/${roomId}`);
}

export async function joinRoomByCode(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  if (!code) return { error: "초대코드를 입력해주세요." };

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id")
    .eq("invite_code", code)
    .maybeSingle();

  if (roomError) return { error: roomError.message };
  if (!room) return { error: "존재하지 않는 초대코드입니다." };

  const { error: joinError } = await supabase
    .from("room_members")
    .insert({ room_id: room.id, user_id: user.id });

  if (joinError && joinError.code !== "23505") {
    return { error: joinError.message };
  }

  redirect(`/room/${room.id}`);
}

export async function joinOpenRoom(roomId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: room } = await supabase
    .from("rooms")
    .select("id,join_type")
    .eq("id", roomId)
    .maybeSingle<{ id: string; join_type: JoinType }>();

  if (!room || room.join_type !== "open") return;

  await supabase
    .from("room_members")
    .insert({ room_id: roomId, user_id: user.id });

  redirect(`/room/${roomId}`);
}

export async function leaveRoom(roomId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: room } = await supabase
    .from("rooms")
    .select("owner_id,is_system")
    .eq("id", roomId)
    .maybeSingle<{ owner_id: string; is_system: boolean }>();

  await supabase
    .from("room_members")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", user.id);

  // 마감방/새벽반은 상시방이라 인원이 0이 되어도 삭제하거나 방장을
  // 이전하지 않는다.
  if (room && !room.is_system) {
    const { data: remaining } = await supabase
      .from("room_members")
      .select("user_id")
      .eq("room_id", roomId)
      .returns<{ user_id: string }[]>();

    if (!remaining || remaining.length === 0) {
      await supabase.from("rooms").delete().eq("id", roomId);
    } else if (room.owner_id === user.id) {
      const next = remaining[Math.floor(Math.random() * remaining.length)];
      await supabase
        .from("rooms")
        .update({ owner_id: next.user_id })
        .eq("id", roomId);
    }
  }

  revalidatePath("/main");
}

export async function touchLastSeen(roomId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("room_members")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("user_id", user.id);
}

export async function updateShareRecords(roomId: string, share: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("room_members")
    .update({ share_records: share })
    .eq("room_id", roomId)
    .eq("user_id", user.id);

  revalidatePath(`/room/${roomId}`);
}

export async function toggleFavoriteRoom(roomId: string, favorite: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("room_members")
    .update({ is_favorite: favorite })
    .eq("room_id", roomId)
    .eq("user_id", user.id);

  revalidatePath("/main");
}

export async function recordChars(
  roomId: string,
  delta: number,
  dateOverride?: string
) {
  if (delta === 0) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const date = dateOverride ?? todayKst();
  const { data: existing } = await supabase
    .from("daily_records")
    .select("id,chars")
    .eq("user_id", user.id)
    .eq("room_id", roomId)
    .eq("record_date", date)
    .maybeSingle<{ id: string; chars: number }>();

  if (existing) {
    await supabase
      .from("daily_records")
      .update({
        chars: existing.chars + delta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("daily_records").insert({
      user_id: user.id,
      room_id: roomId,
      record_date: date,
      chars: delta,
      focus_minutes: 0,
    });
  }

  await logActivity(roomId, "chars_added", delta);

  // 오늘(모든 방 합산) 글자수가 5천자/1만자 챌린지 문턱을 이번 기록으로
  // 새로 넘겼다면, 참여 중인 챌린지에 성공 공지 피드를 남긴다.
  const { data: dayRows } = await supabase
    .from("daily_records")
    .select("chars")
    .eq("user_id", user.id)
    .eq("record_date", date)
    .returns<{ chars: number }[]>();
  const newTotal = (dayRows ?? []).reduce((sum, r) => sum + r.chars, 0);
  await checkDailyMilestones(supabase, user.id, date, newTotal - delta, newTotal);

  revalidatePath(`/room/${roomId}`);
  revalidatePath("/main");
}

export async function recordFocusMinutes(
  roomId: string,
  delta: number,
  dateOverride?: string
) {
  if (delta <= 0) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const date = dateOverride ?? todayKst();
  const { data: existing } = await supabase
    .from("daily_records")
    .select("id,focus_minutes")
    .eq("user_id", user.id)
    .eq("room_id", roomId)
    .eq("record_date", date)
    .maybeSingle<{ id: string; focus_minutes: number }>();

  if (existing) {
    await supabase
      .from("daily_records")
      .update({
        focus_minutes: existing.focus_minutes + delta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("daily_records").insert({
      user_id: user.id,
      room_id: roomId,
      record_date: date,
      chars: 0,
      focus_minutes: delta,
    });
  }

  await logActivity(roomId, "focus_recorded", delta);

  revalidatePath(`/room/${roomId}`);
  revalidatePath("/main");
}

// recordFocusMinutes와 동일한 방식으로 휴식 분을 하루 단위로 누적한다 —
// [개인] 페이지의 뽀모도로 통계(누적 휴식시간)에서 사용.
export async function recordBreakMinutes(
  roomId: string,
  delta: number,
  dateOverride?: string
) {
  if (delta <= 0) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const date = dateOverride ?? todayKst();
  const { data: existing } = await supabase
    .from("daily_records")
    .select("id,break_minutes")
    .eq("user_id", user.id)
    .eq("room_id", roomId)
    .eq("record_date", date)
    .maybeSingle<{ id: string; break_minutes: number }>();

  if (existing) {
    await supabase
      .from("daily_records")
      .update({
        break_minutes: existing.break_minutes + delta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("daily_records").insert({
      user_id: user.id,
      room_id: roomId,
      record_date: date,
      chars: 0,
      break_minutes: delta,
    });
  }
}
