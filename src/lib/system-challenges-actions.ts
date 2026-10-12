"use server";

import { revalidatePath } from "next/cache";
import { err } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { ensureSystemChallenge } from "@/lib/system-challenges";
import { todayKst, kstDayRangeUtc } from "@/lib/time";

export type MarkDraftDoneResult = { error: string } | { ok: true };

export async function markDraftDone(): Promise<MarkDraftDoneResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await err("loginRequired") };

  const challengeId = await ensureSystemChallenge(supabase, "monthly_draft", user.id);
  if (!challengeId) return { error: await err("challengeLoadFailed") };

  const { data: participant } = await supabase
    .from("challenge_participants")
    .select("id")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!participant) return { error: await err("joinChallengeFirst") };

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
    return { error: await err("draftAlreadyDone") };
  }

  await supabase
    .from("activity_logs")
    .insert({ user_id: user.id, room_id: null, type: "draft_done", amount: null });

  revalidatePath("/compete");
  revalidatePath(`/compete/${challengeId}`);
  return { ok: true };
}
