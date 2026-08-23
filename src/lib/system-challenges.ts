import type { SupabaseClient } from "@supabase/supabase-js";

export type SystemChallengeKind = "daily5k" | "daily10k" | "monthly_draft";

export const SYSTEM_CHALLENGE_CAPACITY = 50;

export const SYSTEM_CHALLENGE_META: Record<
  SystemChallengeKind,
  { title: string; resetLabel: string; dailyTarget?: number }
> = {
  daily5k: { title: "매일 5천자 쓰기 챌린지", resetLabel: "매주 월요일 리셋", dailyTarget: 5000 },
  daily10k: { title: "매일 1만자 쓰기 챌린지", resetLabel: "매주 월요일 리셋", dailyTarget: 10000 },
  monthly_draft: { title: "매 달 초단 1완고 챌린지", resetLabel: "매 달 1일 리셋" },
};

export function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function challengeWindow(kind: SystemChallengeKind, today: string) {
  const [y, m, d] = today.split("-").map(Number);
  if (kind === "monthly_draft") {
    const start = `${y}-${pad2(m)}-01`;
    const end = new Date(Date.UTC(y, m, 0)); // last day of this month
    return { start, end: end.toISOString().slice(0, 10) };
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekday = date.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = (weekday + 6) % 7;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) };
}

/** kind 챌린지 행을 찾거나(없으면) 만들고, 주/월 경계를 넘었으면 기간을 새로 갱신한다. */
export async function ensureSystemChallenge(
  supabase: SupabaseClient,
  kind: SystemChallengeKind,
  creatorId: string
): Promise<string | null> {
  const today = todayUtc();
  const window = challengeWindow(kind, today);
  const meta = SYSTEM_CHALLENGE_META[kind];

  const { data: existing } = await supabase
    .from("challenges")
    .select("id,start_date,end_date")
    .eq("kind", kind)
    .maybeSingle<{ id: string; start_date: string; end_date: string }>();

  if (existing) {
    if (existing.start_date !== window.start || existing.end_date !== window.end) {
      await supabase
        .from("challenges")
        .update({ start_date: window.start, end_date: window.end })
        .eq("id", existing.id);
    }
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("challenges")
    .insert({
      type: "user",
      metric: "chars",
      title: meta.title,
      kind,
      visibility: "open",
      start_date: window.start,
      end_date: window.end,
      created_by: creatorId,
    })
    .select("id")
    .single();

  if (error || !created) {
    // 동시에 다른 요청이 먼저 만들었을 가능성 — 다시 조회.
    const { data: retry } = await supabase
      .from("challenges")
      .select("id")
      .eq("kind", kind)
      .maybeSingle<{ id: string }>();
    return retry?.id ?? null;
  }

  return created.id;
}

async function alreadyLoggedToday(
  supabase: SupabaseClient,
  userId: string,
  type: string,
  date: string
) {
  const { data } = await supabase
    .from("activity_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .gte("created_at", `${date}T00:00:00.000Z`)
    .lte("created_at", `${date}T23:59:59.999Z`)
    .limit(1);
  return (data ?? []).length > 0;
}

/**
 * 오늘 글자수 총합이 5천자/1만자 문턱을 이번 기록으로 새로 넘겼는지 확인하고,
 * 해당 챌린지 참여자라면 공지 피드용 activity_log를 남긴다.
 */
export async function checkDailyMilestones(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  previousTotal: number,
  newTotal: number
) {
  const checks: { threshold: number; kind: SystemChallengeKind; type: string }[] = [
    { threshold: 5000, kind: "daily5k", type: "milestone_5k" },
    { threshold: 10000, kind: "daily10k", type: "milestone_10k" },
  ];

  for (const c of checks) {
    if (previousTotal >= c.threshold || newTotal < c.threshold) continue;

    const { data: challenge } = await supabase
      .from("challenges")
      .select("id")
      .eq("kind", c.kind)
      .maybeSingle<{ id: string }>();
    if (!challenge) continue;

    const { data: participant } = await supabase
      .from("challenge_participants")
      .select("id")
      .eq("challenge_id", challenge.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!participant) continue;

    if (await alreadyLoggedToday(supabase, userId, c.type, date)) continue;

    await supabase
      .from("activity_logs")
      .insert({ user_id: userId, room_id: null, type: c.type, amount: newTotal });
  }
}

