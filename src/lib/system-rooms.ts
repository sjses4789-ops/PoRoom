"use server";

import { createClient } from "@/lib/supabase/server";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export type SystemRoomKind = "deadline" | "dawn";

const SYSTEM_ROOM_CAPACITY = 30;
const SYSTEM_ROOM_NAME: Record<SystemRoomKind, string> = {
  deadline: "마감방",
  dawn: "새벽방",
};

export type JoinSystemRoomResult = { error: string } | { roomId: string };

export async function joinSystemRoom(
  kind: SystemRoomKind
): Promise<JoinSystemRoomResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const name = SYSTEM_ROOM_NAME[kind];

  const { data: existingRoom } = await supabase
    .from("rooms")
    .select("id")
    .eq("name", name)
    .eq("is_system", true)
    .maybeSingle<{ id: string }>();

  let roomId = existingRoom?.id ?? null;

  if (!roomId) {
    const { data: created, error } = await supabase
      .from("rooms")
      .insert({
        name,
        invite_code: generateInviteCode(),
        owner_id: user.id,
        goal_chars: 0,
        goal_minutes: 0,
        record_visibility: "shared",
        join_type: "open",
        capacity: SYSTEM_ROOM_CAPACITY,
        is_system: true,
      })
      .select("id")
      .single();

    if (error) {
      // likely a race with someone else creating it at the same moment —
      // fall back to looking it up again.
      const { data: retry } = await supabase
        .from("rooms")
        .select("id")
        .eq("name", name)
        .eq("is_system", true)
        .maybeSingle<{ id: string }>();
      if (!retry) return { error: "방 생성에 실패했습니다. 다시 시도해주세요." };
      roomId = retry.id;
    } else {
      roomId = created.id;
    }
  }

  if (!roomId) return { error: "방 생성에 실패했습니다. 다시 시도해주세요." };

  const { data: myMembership } = await supabase
    .from("room_members")
    .select("room_id")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (myMembership) return { roomId };

  const { count } = await supabase
    .from("room_members")
    .select("*", { count: "exact", head: true })
    .eq("room_id", roomId);

  if ((count ?? 0) >= SYSTEM_ROOM_CAPACITY) {
    return { error: `${name} 정원(${SYSTEM_ROOM_CAPACITY}명)이 가득 찼습니다.` };
  }

  const { error: joinError } = await supabase
    .from("room_members")
    .insert({ room_id: roomId, user_id: user.id });

  if (joinError && joinError.code !== "23505") {
    return { error: joinError.message };
  }

  return { roomId };
}
