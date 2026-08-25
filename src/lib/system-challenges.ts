import type { SupabaseClient } from "@supabase/supabase-js";
import { todayKst, kstDayRangeUtc } from "@/lib/time";

export type SystemChallengeKind = "daily5k" | "daily10k" | "monthly_draft";

export const SYSTEM_CHALLENGE_META: Record<
  SystemChallengeKind,
  { title: string; resetLabel: string; dailyTarget?: number }
> = {
  daily5k: { title: "매일 5천자 쓰기 챌린지", resetLabel: "매주 월요일 리셋", dailyTarget: 5000 },
  daily10k: { title: "매일 1만자 쓰기 챌린지", resetLabel: "매주 월요일 리셋", dailyTarget: 10000 },
  monthly_draft: { title: "매 달 초단 1완고 챌린지", resetLabel: "매 달 1일 리셋" },
};

// 챌린지 목록 카드가 전부 같은 색이라 구분이 어렵다는 피드백 — 종류별로
// 옅은 파스텔을 다르게 준다(관리자 임시 이벤트는 별도로 항상 빨간
// 계열을 쓰므로 여기 포함하지 않음, open/joined-system-challenge-card
// 참고).
export const SYSTEM_CHALLENGE_CARD_BG: Record<SystemChallengeKind, string> = {
  daily5k: "bg-[#fdf6e3] dark:bg-[#2a2410]",
  daily10k: "bg-[#eaf7ef] dark:bg-[#122a1c]",
  monthly_draft: "bg-[#f2effa] dark:bg-[#211c2e]",
};

const CHALLENGE_TODO_CONTENT: Record<SystemChallengeKind, string> = {
  daily5k: "(챌린지) 5천자 쓰기",
  daily10k: "(챌린지) 1만자 쓰기",
  monthly_draft: "(챌린지) 초단 완고 치기",
};

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
  const today = todayKst();
  const window = challengeWindow(kind, today);
  const meta = SYSTEM_CHALLENGE_META[kind];

  const { data: existing } = await supabase
    .from("challenges")
    .select("id,start_date,end_date")
    .eq("kind", kind)
    .maybeSingle<{ id: string; start_date: string; end_date: string }>();

  if (existing) {
    if (existing.start_date !== window.start || existing.end_date !== window.end) {
      // 새 주/달로 넘어가는 리셋 — 참여 여부도 함께 초기화해서, 지난
      // 기간에 참여했더라도 이번 기간엔 다시 참여해야 하도록 한다.
      await supabase
        .from("challenges")
        .update({ start_date: window.start, end_date: window.end })
        .eq("id", existing.id);
      await supabase.from("challenge_participants").delete().eq("challenge_id", existing.id);
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

/**
 * 참여 중인 시스템 챌린지마다 "(챌린지) 매일 5천자 쓰기" 같은 항목을 할
 * 일 목록에 자동으로 넣어준다 — 하루(초단 완고는 그 달) 단위로 다시
 * 나타나야 하므로 for_date로 이미 오늘치가 있는지 확인 후 없을 때만
 * 추가한다. 지난 날짜/달의 항목은 먼저 정리(삭제)하고, 사용자가 이미
 * 지운(todo_dismissals) 조합은 오늘/이번 달치라도 다시 만들지 않는다.
 */
export async function ensureChallengeTodos(supabase: SupabaseClient, userId: string) {
  const today = todayKst();
  const monthStart = `${today.slice(0, 7)}-01`;

  const { data: participantRows } = await supabase
    .from("challenge_participants")
    .select("challenge_id")
    .eq("user_id", userId)
    .returns<{ challenge_id: string }[]>();
  const challengeIds = (participantRows ?? []).map((r) => r.challenge_id);
  if (!challengeIds.length) return;

  const { data: challengeRows } = await supabase
    .from("challenges")
    .select("kind")
    .in("id", challengeIds)
    .not("kind", "is", null)
    .returns<{ kind: SystemChallengeKind }[]>();
  if (!challengeRows?.length) return;

  // 어차피 다음 날/다음 달이 되면 새 항목이 추가되므로, 지난 날짜(매일)나
  // 지난 달(초단 완고)의 자동 생성 항목은 지금 정리해서 목록에 쌓이지
  // 않게 한다.
  const dailyContents = [CHALLENGE_TODO_CONTENT.daily5k, CHALLENGE_TODO_CONTENT.daily10k];
  await supabase
    .from("todos")
    .delete()
    .eq("user_id", userId)
    .in("content", dailyContents)
    .lt("for_date", today);
  await supabase
    .from("todos")
    .delete()
    .eq("user_id", userId)
    .eq("content", CHALLENGE_TODO_CONTENT.monthly_draft)
    .lt("for_date", monthStart);

  const wanted = challengeRows.map((c) => ({
    content: CHALLENGE_TODO_CONTENT[c.kind],
    forDate: c.kind === "monthly_draft" ? monthStart : today,
  }));

  // 오늘치(초단 완고는 이번 달치)가 이미 있는지, 혹은 사용자가 이미
  // 지웠는지(todo_dismissals) 한 번씩의 쿼리로 확인한 뒤, 둘 다 아닌
  // 것만 추가한다 — 종류별로 왕복하지 않는다.
  const forDates = [...new Set(wanted.map((w) => w.forDate))];
  const [{ data: existingRows }, { data: dismissedRows }] = await Promise.all([
    supabase
      .from("todos")
      .select("content,for_date")
      .eq("user_id", userId)
      .in("for_date", forDates)
      .returns<{ content: string; for_date: string }[]>(),
    supabase
      .from("todo_dismissals")
      .select("content,for_date")
      .eq("user_id", userId)
      .in("for_date", forDates)
      .returns<{ content: string; for_date: string }[]>(),
  ]);
  const existingSet = new Set((existingRows ?? []).map((r) => `${r.content}|${r.for_date}`));
  const dismissedSet = new Set((dismissedRows ?? []).map((r) => `${r.content}|${r.for_date}`));

  const toInsert = wanted
    .filter((w) => !existingSet.has(`${w.content}|${w.forDate}`))
    .filter((w) => !dismissedSet.has(`${w.content}|${w.forDate}`))
    .map((w) => ({ user_id: userId, content: w.content, for_date: w.forDate, todo_date: today }));

  if (toInsert.length) {
    await supabase.from("todos").insert(toInsert);
  }
}

async function alreadyLoggedToday(
  supabase: SupabaseClient,
  userId: string,
  type: string,
  date: string
) {
  const { startUtc, endUtc } = kstDayRangeUtc(date);
  const { data } = await supabase
    .from("activity_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .gte("created_at", startUtc)
    .lte("created_at", endUtc)
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

