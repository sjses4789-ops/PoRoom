import { createClient } from "@/lib/supabase/server";
import RankingTabs, { type RankingRecord } from "./ranking-tabs";
import { WinLossRanking, type WinLossRow } from "./win-loss-ranking";
import { ChallengeRanking, type ChallengeRankingRow } from "./challenge-ranking";
import { todayKst } from "@/lib/time";
import { PageAdRail } from "@/components/page-ad-rail";
import { computeWinLossByUser, type UserChallengeRow } from "@/lib/challenge-rankings";

type DailyRecordRow = {
  room_id: string | null;
  user_id: string;
  record_date: string;
  chars: number;
  focus_minutes: number;
};
type RoomRow = { id: string; name: string };
type UserRow = { id: string; name: string | null; email: string };

type ParticipantRow = { challenge_id: string; user_id: string | null };

export default async function RankingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: dailyRecords }, { data: rooms }, { data: users }] =
    await Promise.all([
      supabase
        .from("daily_records")
        .select("room_id,user_id,record_date,chars,focus_minutes")
        .returns<DailyRecordRow[]>(),
      supabase.from("rooms").select("id,name").returns<RoomRow[]>(),
      supabase.from("users").select("id,name,email").returns<UserRow[]>(),
    ]);

  const roomNames: Record<string, string> = {};
  for (const r of rooms ?? []) roomNames[r.id] = r.name;
  const userNames: Record<string, string> = {};
  for (const u of users ?? []) userNames[u.id] = u.name || u.email;

  const records: RankingRecord[] = (dailyRecords ?? []).map((r) => ({
    roomId: r.room_id,
    userId: r.user_id,
    date: r.record_date,
    chars: r.chars,
    minutes: r.focus_minutes,
  }));

  const today = todayKst();

  // 대결 승패 랭킹: 종료된 개인 간(1:1 이상) 대결에서 기간 내 값이 가장
  // 높은 참가자가 승, 나를 포함해 공동 1위면 무, 그 외엔 패 — 이걸 볼 수
  // 있는 모든 대결(RLS상 공개방이거나 내가 참여한 대결)에 대해 집계한다.
  const { data: userChallenges } = await supabase
    .from("challenges")
    .select("id,metric,start_date,end_date")
    .eq("type", "user")
    .returns<UserChallengeRow[]>();

  const completedChallenges = (userChallenges ?? []).filter((c) => c.end_date < today);
  const completedIds = completedChallenges.map((c) => c.id);

  const { data: challengeParticipants } = completedIds.length
    ? await supabase
        .from("challenge_participants")
        .select("challenge_id,user_id")
        .in("challenge_id", completedIds)
        .returns<ParticipantRow[]>()
    : { data: [] as ParticipantRow[] };

  const winLossByUser = computeWinLossByUser(
    completedChallenges,
    challengeParticipants ?? [],
    dailyRecords ?? []
  );

  const winLossRows: WinLossRow[] = Array.from(winLossByUser.entries())
    .map(([userId, rec]) => ({ userId, name: userNames[userId] ?? "알 수 없음", ...rec }))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
    .slice(0, 20)
    .map((r, i) => ({ rank: i + 1, ...r }));

  // 챌린지 랭킹: 매일 5천자·매일 1만자·초단 완고 성공(milestone_5k/
  // milestone_10k/draft_done) 횟수를 종류 구분 없이 동일하게 합산해서
  // 집계한다.
  const { data: milestoneLogs } = await supabase
    .from("activity_logs")
    .select("user_id")
    .in("type", ["milestone_5k", "milestone_10k", "draft_done"])
    .returns<{ user_id: string }[]>();

  const challengeSuccessByUser = new Map<string, number>();
  for (const l of milestoneLogs ?? []) {
    challengeSuccessByUser.set(l.user_id, (challengeSuccessByUser.get(l.user_id) ?? 0) + 1);
  }

  const challengeRankingRows: ChallengeRankingRow[] = Array.from(
    challengeSuccessByUser.entries()
  )
    .map(([userId, successCount]) => ({
      userId,
      name: userNames[userId] ?? "알 수 없음",
      successCount,
    }))
    .sort((a, b) => b.successCount - a.successCount)
    .slice(0, 20)
    .map((r, i) => ({ rank: i + 1, ...r }));

  return (
    <PageAdRail>
    <div className="flex flex-col gap-10 pb-14">
      <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
        랭킹
      </h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr_1fr]">
        <RankingTabs
          records={records}
          roomNames={roomNames}
          userNames={userNames}
          today={today}
          selfId={user!.id}
        />
        <WinLossRanking rows={winLossRows} />
        <ChallengeRanking rows={challengeRankingRows} />
      </div>
    </div>
    </PageAdRail>
  );
}
