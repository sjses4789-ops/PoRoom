"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/rooms";
import { ensureChallengeTodos } from "@/lib/system-challenges";
import { todayKst, kstDatePlusDays } from "@/lib/time";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export type ChallengeMetric = "chars" | "minutes";
export type ChallengeVisibility = "open" | "private";
export type ChallengeStartMode = "manual" | "full";

export async function createChallenge(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const title = String(formData.get("title") ?? "").trim();
  const metric = String(formData.get("metric") ?? "chars") as ChallengeMetric;
  const visibility = String(
    formData.get("visibility") ?? "open"
  ) as ChallengeVisibility;
  const durationDays = Number(formData.get("durationDays") ?? 7);
  const color = String(formData.get("color") ?? "").trim() || null;
  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const capacity = capacityRaw ? Number(capacityRaw) : null;
  const startModeRaw = String(formData.get("startMode") ?? "manual") as ChallengeStartMode;

  if (!title) return { error: "대결 이름을 입력해주세요." };
  if (!["chars", "minutes"].includes(metric)) {
    return { error: "잘못된 기준입니다." };
  }
  if (!["open", "private"].includes(visibility)) {
    return { error: "잘못된 공개 설정입니다." };
  }
  if (!Number.isFinite(durationDays) || durationDays < 1) {
    return { error: "대결 기간을 선택해주세요." };
  }
  if (capacity !== null && (!Number.isFinite(capacity) || capacity < 2)) {
    return { error: "인원은 2명 이상으로 설정해주세요." };
  }
  if (!["manual", "full"].includes(startModeRaw)) {
    return { error: "잘못된 시작 시점입니다." };
  }
  // 정원이 무제한이면 "다 찼을 때"라는 기준 자체가 없으므로 무조건 수동
  // 시작으로 취급한다.
  const startMode: ChallengeStartMode = capacity === null ? "manual" : startModeRaw;

  let challengeId: string | null = null;
  const wantsCode = visibility === "private";

  // 대결은 만들자마자 시작하지 않는다 — 참여자가 모인 뒤 방장이 직접
  // "시작"을 눌러야 그 시점부터 duration_days만큼의 기간이 계산된다
  // (startChallenge 참고). 그래서 start_date/end_date는 아직 비워둔다.
  for (let attempt = 0; attempt < 5 && !challengeId; attempt++) {
    const { data: challenge, error } = await supabase
      .from("challenges")
      .insert({
        title,
        type: "user",
        metric,
        visibility,
        invite_code: wantsCode ? generateInviteCode() : null,
        duration_days: durationDays,
        color,
        capacity,
        start_mode: startMode,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      if (wantsCode && error.code === "23505") continue; // code collision, retry
      return { error: error.message };
    }
    challengeId = challenge.id;
  }

  if (!challengeId) {
    return { error: "대결 생성에 실패했습니다. 다시 시도해주세요." };
  }

  await supabase
    .from("challenge_participants")
    .insert({ challenge_id: challengeId, user_id: user.id });

  revalidatePath("/compete");
  redirect("/compete");
}

export type JoinChallengeResult = { error: string } | { ok: true };

// 방장이 "인원이 다 찼을 때" 모드를 골랐다면, 정원이 채워지는 순간
// 참여자가 직접 "시작" 버튼을 누르지 않아도 자동으로 시작 처리한다.
// startChallenge와 동일한 시작일/종료일 계산을 공유한다.
async function autoStartIfFull(
  supabase: Awaited<ReturnType<typeof createClient>>,
  challenge: {
    id: string;
    kind: string | null;
    capacity: number | null;
    started_at: string | null;
    start_mode: string;
    duration_days: number;
  }
) {
  if (
    challenge.kind ||
    challenge.started_at ||
    challenge.start_mode !== "full" ||
    challenge.capacity == null
  ) {
    return;
  }

  const { count } = await supabase
    .from("challenge_participants")
    .select("*", { count: "exact", head: true })
    .eq("challenge_id", challenge.id);
  if ((count ?? 0) < challenge.capacity) return;

  const startDate = todayKst();
  const endDate = kstDatePlusDays(challenge.duration_days - 1, startDate);
  await supabase
    .from("challenges")
    .update({ start_date: startDate, end_date: endDate, started_at: new Date().toISOString() })
    .eq("id", challenge.id);
}

export async function joinChallenge(challengeId: string): Promise<JoinChallengeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id,end_date,kind,capacity,started_at,start_mode,duration_days")
    .eq("id", challengeId)
    .maybeSingle<{
      id: string;
      end_date: string | null;
      kind: string | null;
      capacity: number | null;
      started_at: string | null;
      start_mode: string;
      duration_days: number;
    }>();

  if (!challenge) return { error: "존재하지 않는 대결입니다." };

  const today = todayKst();
  if (challenge.end_date && today > challenge.end_date) {
    return { error: "이미 종료된 대결입니다." };
  }

  // 챌린지(kind가 있는 시스템 챌린지)는 정원 제한이 없다. 1:1형 대결은
  // 방장이 설정한 capacity가 있을 때만 그 인원으로 막는다.
  if (!challenge.kind && challenge.capacity != null) {
    const { count } = await supabase
      .from("challenge_participants")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", challengeId);
    if ((count ?? 0) >= challenge.capacity) {
      return { error: `정원(${challenge.capacity}명)이 가득 찼습니다.` };
    }
  }

  const { error } = await supabase
    .from("challenge_participants")
    .insert({ challenge_id: challengeId, user_id: user.id });

  if (error && error.code !== "23505") return { error: error.message };

  if (challenge.kind) {
    await ensureChallengeTodos(supabase, user.id);
    revalidatePath("/main");
  } else {
    await autoStartIfFull(supabase, challenge);
  }

  revalidatePath(`/compete/${challengeId}`);
  revalidatePath("/compete");
  return { ok: true };
}

export async function joinChallengeByCode(
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

  const { data: challenge, error } = await supabase
    .from("challenges")
    .select("id,end_date,kind,capacity,started_at,start_mode,duration_days")
    .eq("invite_code", code)
    .maybeSingle<{
      id: string;
      end_date: string | null;
      kind: string | null;
      capacity: number | null;
      started_at: string | null;
      start_mode: string;
      duration_days: number;
    }>();

  if (error) return { error: error.message };
  if (!challenge) return { error: "존재하지 않는 초대코드입니다." };

  const today = todayKst();
  if (challenge.end_date && today > challenge.end_date) {
    return { error: "이미 종료된 대결입니다." };
  }

  if (challenge.capacity != null) {
    const { count } = await supabase
      .from("challenge_participants")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", challenge.id);
    if ((count ?? 0) >= challenge.capacity) {
      return { error: `정원(${challenge.capacity}명)이 가득 찼습니다.` };
    }
  }

  const { error: joinError } = await supabase
    .from("challenge_participants")
    .insert({ challenge_id: challenge.id, user_id: user.id });

  if (joinError && joinError.code !== "23505") {
    return { error: joinError.message };
  }

  await autoStartIfFull(supabase, challenge);

  revalidatePath(`/compete/${challenge.id}`);
  revalidatePath("/compete");
  redirect("/compete");
}

// 방장이 직접 눌러야 그 순간부터 duration_days만큼의 기간이 확정된다 —
// 참여자가 모이기 전까지는 대결이 진행되지 않는다.
export async function startChallenge(challengeId: string): Promise<JoinChallengeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id,created_by,kind,started_at,duration_days")
    .eq("id", challengeId)
    .maybeSingle<{
      id: string;
      created_by: string;
      kind: string | null;
      started_at: string | null;
      duration_days: number;
    }>();

  if (!challenge) return { error: "존재하지 않는 대결입니다." };
  if (challenge.created_by !== user.id) return { error: "권한이 없습니다." };
  if (challenge.kind) return { error: "시스템 챌린지는 별도로 관리됩니다." };
  if (challenge.started_at) return { error: "이미 시작된 대결입니다." };

  const { count } = await supabase
    .from("challenge_participants")
    .select("*", { count: "exact", head: true })
    .eq("challenge_id", challengeId);
  if ((count ?? 0) < 2) {
    return { error: "참여자가 2명 이상 모이면 시작할 수 있습니다." };
  }

  const startDate = todayKst();
  const endDate = kstDatePlusDays(challenge.duration_days - 1, startDate);

  const { error } = await supabase
    .from("challenges")
    .update({ start_date: startDate, end_date: endDate, started_at: new Date().toISOString() })
    .eq("id", challengeId);
  if (error) return { error: error.message };

  revalidatePath(`/compete/${challengeId}`);
  revalidatePath("/compete");
  return { ok: true };
}

export type ChallengeSettingsUpdate = {
  title?: string;
  color?: string | null;
  capacity?: number | null;
  durationDays?: number;
};

// 대결 이름/색상/인원/기간 수정 — 방장만 가능(RLS로도 강제됨). 이미
// 시작된 대결의 기간을 바꾸면 종료일도 새 기간에 맞춰 다시 계산한다.
export async function updateChallengeSettings(
  challengeId: string,
  updates: ChallengeSettingsUpdate
): Promise<JoinChallengeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id,created_by,started_at,start_date,start_mode")
    .eq("id", challengeId)
    .maybeSingle<{
      id: string;
      created_by: string;
      started_at: string | null;
      start_date: string | null;
      start_mode: string;
    }>();

  if (!challenge) return { error: "존재하지 않는 대결입니다." };
  if (challenge.created_by !== user.id) return { error: "권한이 없습니다." };

  const patch: Record<string, unknown> = {};

  if (updates.title !== undefined) {
    const title = updates.title.trim();
    if (!title) return { error: "대결 이름을 입력해주세요." };
    patch.title = title;
  }
  if (updates.color !== undefined) patch.color = updates.color;
  if (updates.capacity !== undefined) {
    if (updates.capacity !== null && updates.capacity < 2) {
      return { error: "인원은 2명 이상으로 설정해주세요." };
    }
    patch.capacity = updates.capacity;
    // 인원 제한을 무제한으로 풀면 "다 찼을 때 시작" 기준 자체가 사라지므로
    // 수동 시작으로 되돌린다.
    if (updates.capacity === null && challenge.start_mode === "full") {
      patch.start_mode = "manual";
    }
  }
  if (updates.durationDays !== undefined) {
    if (!Number.isFinite(updates.durationDays) || updates.durationDays < 1) {
      return { error: "대결 기간을 선택해주세요." };
    }
    patch.duration_days = updates.durationDays;
    if (challenge.started_at && challenge.start_date) {
      patch.end_date = kstDatePlusDays(updates.durationDays - 1, challenge.start_date);
    }
  }

  const { error } = await supabase.from("challenges").update(patch).eq("id", challengeId);
  if (error) return { error: error.message };

  revalidatePath(`/compete/${challengeId}`);
  revalidatePath("/compete");
  return { ok: true };
}
