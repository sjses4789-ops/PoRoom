import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import RankingTabs, { type RankingRecord } from "./ranking-tabs";
import { WinLossRanking, type WinLossRow } from "./win-loss-ranking";
import { ChallengeRanking, type ChallengeRankingRow } from "./challenge-ranking";
import { TypingRanking, type TypingRankingRow } from "./typing-ranking";
import { todayKst } from "@/lib/time";
import { PageAdRail } from "@/components/page-ad-rail";
import {
  computeWinLossByUser,
  computeChallengeScoreByUser,
  type UserChallengeRow,
} from "@/lib/challenge-rankings";

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
  const t = await getTranslations("ranking.page");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: dailyRecords },
    { data: rooms },
    { data: users },
    { data: userChallenges },
    { data: milestoneLogs },
  ] = await Promise.all([
    supabase
      .from("daily_records")
      .select("room_id,user_id,record_date,chars,focus_minutes")
      .returns<DailyRecordRow[]>(),
    supabase.from("rooms").select("id,name").returns<RoomRow[]>(),
    supabase.from("users").select("id,name,email").returns<UserRow[]>(),
    // 대결 승패 랭킹: 종료된 개인 간(1:1 이상) 대결에서 기간 내 값이 가장
    // 높은 참가자가 승, 나를 포함해 공동 1위면 무, 그 외엔 패 — 이걸 볼 수
    // 있는 모든 대결(RLS상 공개방이거나 내가 참여한 대결)에 대해 집계한다.
    supabase
      .from("challenges")
      .select("id,metric,start_date,end_date")
      .eq("type", "user")
      .returns<UserChallengeRow[]>(),
    // 챌린지 랭킹: 매일 5천자·매일 1만자·초단 완고 성공(milestone_5k/
    // milestone_10k/draft_done) 횟수를 종류 구분 없이 동일하게 합산해서
    // 집계한다. 위 조회들과 서로 무관해서 같은 배치로 함께 보낸다.
    supabase
      .from("activity_logs")
      .select("user_id,type")
      .in("type", ["milestone_5k", "milestone_10k", "draft_done"])
      .returns<{ user_id: string; type: string }[]>(),
  ]);

  // 관리자가 만든 "달성 여부" 임시 이벤트는 마일스톤 로그 대신
  // challenge_participants.achieved 자가 신고로 성공 여부를 판단한다.
  const { data: adminAchievementChallenges } = await supabase
    .from("challenges")
    .select("id")
    .eq("is_admin_event", true)
    .eq("metric", "achievement")
    .returns<{ id: string }[]>();
  const adminAchievementIds = (adminAchievementChallenges ?? []).map((c) => c.id);
  const { data: adminAchievedRows } = adminAchievementIds.length
    ? await supabase
        .from("challenge_participants")
        .select("user_id")
        .in("challenge_id", adminAchievementIds)
        .eq("achieved", true)
        .returns<{ user_id: string | null }[]>()
    : { data: [] as { user_id: string | null }[] };

  const { data: typingScoreRows } = await supabase
    .from("typing_scores")
    .select("user_id,cpm")
    .returns<{ user_id: string; cpm: number }[]>();

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
    .map(([userId, rec]) => ({ userId, name: userNames[userId] ?? t("unknownUser"), ...rec }))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
    .slice(0, 20)
    .map((r, i) => ({ rank: i + 1, ...r }));

  const challengeScoreByUser = computeChallengeScoreByUser(
    milestoneLogs ?? [],
    adminAchievedRows ?? []
  );

  const challengeRankingRows: ChallengeRankingRow[] = Array.from(
    challengeScoreByUser.entries()
  )
    .map(([userId, score]) => ({
      userId,
      name: userNames[userId] ?? t("unknownUser"),
      score,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((r, i) => ({ rank: i + 1, ...r }));

  const bestCpmByUser = new Map<string, number>();
  for (const r of typingScoreRows ?? []) {
    bestCpmByUser.set(r.user_id, Math.max(bestCpmByUser.get(r.user_id) ?? 0, r.cpm));
  }
  const typingRankingRows: TypingRankingRow[] = Array.from(bestCpmByUser.entries())
    .map(([userId, cpm]) => ({ userId, name: userNames[userId] ?? t("unknownUser"), cpm }))
    .sort((a, b) => b.cpm - a.cpm)
    .slice(0, 20)
    .map((r, i) => ({ rank: i + 1, ...r }));

  return (
    <PageAdRail>
    <div className="flex flex-col gap-10 pb-14">
      <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
        {t("title")}
      </h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <RankingTabs
          records={records}
          roomNames={roomNames}
          userNames={userNames}
          today={today}
          selfId={user!.id}
        />
        <WinLossRanking rows={winLossRows} />
        <ChallengeRanking rows={challengeRankingRows} />
        <TypingRanking rows={typingRankingRows} />
      </div>
    </div>
    </PageAdRail>
  );
}
