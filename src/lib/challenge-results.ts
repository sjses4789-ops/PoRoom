import type { createClient } from "@/lib/supabase/server";
import { fetchAllPages } from "@/lib/paginate";
import { inRange } from "@/lib/records";
import { todayKst } from "@/lib/time";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// 기간이 끝난 대결·이벤트 챌린지에서 "내" 결과 — 종료 목록 카드, 알림(벨), [개인] 완주 뱃지가 같이 쓴다.
//  - 대결(duel): 기록(글자수/작업시간) 1등이면 승리(success). 혼자뿐이거나 기록이 0이면 승리로 치지 않는다.
//  - 이벤트(event): 달성 여부 방식은 "달성 표시"가 곧 완주, 글자수/작업시간 방식은 기간 중 기록을 남겼으면 완주.
export type ChallengeResult = {
  id: string;
  title: string;
  kind: "duel" | "event";
  metric: "chars" | "minutes" | "achievement";
  targetPosition: "novelist" | "webtoon" | null;
  startDate: string;
  endDate: string;
  /** 동점은 같은 순위. 달성 여부 방식은 순위가 없다(null). */
  rank: number | null;
  total: number;
  /** 내 기록(글자수/컷수는 chars, 작업시간은 분). 달성 여부 방식은 0. */
  value: number;
  success: boolean;
  /** 달성 여부 방식에서 달성한 참여자 수. */
  achievedCount: number;
};

type ChallengeRow = {
  id: string;
  title: string;
  metric: "chars" | "minutes" | "achievement";
  start_date: string | null;
  end_date: string | null;
  is_admin_event: boolean;
  target_position: string | null;
};
type ParticipantRow = { challenge_id: string; user_id: string | null; achieved: boolean | null };
type RecordRow = { user_id: string; record_date: string; chars: number; focus_minutes: number };

export async function getMyChallengeResults(supabase: Supabase, userId: string): Promise<ChallengeResult[]> {
  const today = todayKst();

  const { data: mine } = await supabase
    .from("challenge_participants")
    .select("challenge_id")
    .eq("user_id", userId)
    .returns<{ challenge_id: string }[]>();
  const myIds = Array.from(new Set((mine ?? []).map((r) => r.challenge_id)));
  if (myIds.length === 0) return [];

  const { data: challengeRows } = await supabase
    .from("challenges")
    .select("id,title,metric,start_date,end_date,is_admin_event,target_position")
    .in("id", myIds)
    .is("kind", null)
    .lt("end_date", today)
    .returns<ChallengeRow[]>();
  const challenges = (challengeRows ?? []).filter((c) => c.start_date && c.end_date);
  if (challenges.length === 0) return [];

  const ids = challenges.map((c) => c.id);
  const { data: participantRows } = await supabase
    .from("challenge_participants")
    .select("challenge_id,user_id,achieved")
    .in("challenge_id", ids)
    .returns<ParticipantRow[]>();
  const participants = (participantRows ?? []).filter((p): p is ParticipantRow & { user_id: string } => Boolean(p.user_id));

  const userIds = Array.from(new Set(participants.map((p) => p.user_id)));
  const from = challenges.map((c) => c.start_date as string).sort()[0];
  const records = userIds.length
    ? await fetchAllPages<RecordRow>((a, b) =>
        supabase
          .from("daily_records")
          .select("user_id,record_date,chars,focus_minutes")
          .in("user_id", userIds)
          .gte("record_date", from)
          .order("record_date")
          .order("user_id")
          .order("room_id")
          .range(a, b)
          .returns<RecordRow[]>()
      )
    : [];

  const results: ChallengeResult[] = [];
  for (const c of challenges) {
    const rows = participants.filter((p) => p.challenge_id === c.id);
    const valueOf = (uid: string) =>
      records
        .filter((r) => r.user_id === uid && inRange(r.record_date, c.start_date as string, c.end_date as string))
        .reduce((sum, r) => sum + (c.metric === "chars" ? r.chars : r.focus_minutes), 0);

    const kind: ChallengeResult["kind"] = c.is_admin_event ? "event" : "duel";
    const me = rows.find((r) => r.user_id === userId);
    if (!me) continue;

    let rank: number | null = null;
    let value = 0;
    let success = false;
    const achievedCount = rows.filter((r) => r.achieved).length;

    if (c.metric === "achievement") {
      success = Boolean(me.achieved);
    } else {
      const values = rows.map((r) => valueOf(r.user_id as string));
      value = valueOf(userId);
      rank = 1 + values.filter((v) => v > value).length;
      success = kind === "duel" ? rank === 1 && value > 0 && rows.length >= 2 : value > 0;
    }

    results.push({
      id: c.id,
      title: c.title,
      kind,
      metric: c.metric,
      targetPosition: c.target_position === "novelist" || c.target_position === "webtoon" ? c.target_position : null,
      startDate: c.start_date as string,
      endDate: c.end_date as string,
      rank,
      total: rows.length,
      value,
      success,
      achievedCount,
    });
  }
  return results.sort((a, b) => b.endDate.localeCompare(a.endDate));
}
