"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureSystemChallenge } from "@/lib/system-challenges";
import { todayKst, kstDayRangeUtc } from "@/lib/time";

export type MarkDraftDoneResult = { error: string } | { ok: true };

export async function markDraftDone(): Promise<MarkDraftDoneResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const challengeId = await ensureSystemChallenge(supabase, "monthly_draft", user.id);
  if (!challengeId) return { error: "챌린지를 불러오지 못했습니다." };

  const { data: participant } = await supabase
    .from("challenge_participants")
    .select("id")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!participant) return { error: "먼저 챌린지에 참여해주세요." };

  const today = todayKst();
  const monthStart = `${today.slice(0, 7)}-01`;
  const { data: existing } = await supabase
    .from("activity_logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", "draft_done")
    .gte("created_at", kstDayRangeUtc(monthStart).startUtc)
    .limit(1);
  if ((existing ?? []).length > 0) {
    return { error: "이미 이번 달 초단 완고를 기록했습니다." };
  }

  await supabase
    .from("activity_logs")
    .insert({ user_id: user.id, room_id: null, type: "draft_done", amount: null });

  revalidatePath("/compete");
  revalidatePath(`/compete/${challengeId}`);
  return { ok: true };
}
