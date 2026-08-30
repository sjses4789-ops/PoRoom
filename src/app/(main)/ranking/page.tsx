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
type RoomRow = { id: string; name: string; target_position: string | null };
type UserRow = { id: string; name: string | null; email: string; position: string | null };

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
    { data: adminAchievementChallenges },
    { data: typingScoreRows },
  ] = await Promise.all([
    supabase
      .from("daily_records")
      .select("room_id,user_id,record_date,chars,focus_minutes")
      .returns<DailyRecordRow[]>(),
    supabase.from("rooms").select("id,name,target_position").returns<RoomRow[]>(),
    supabase.from("users").select("id,name,email,position").returns<UserRow[]>(),
    // 대결 승패 랭킹: 종료된 개인 간(1:1 이상) 대결에서 기간 내 값이 가장
    // 높은 참가자가 승, 나를 포함해 공동 1위면 무, 그 외엔 패 — 이걸 볼 수
    // 있는 모든 대결(RLS상 공개방이거나 내가 참여한 대결)에 대해 집계한다.
    // kind가 있는 건 매일 5천자 등 참여자가 수십 명씩 몰리는 시스템
    // 챌린지라 type='user'를 같이 쓰더라도(1:1 대결과 구분이 안 되면)
    // 주/월 경계가 막 지나 갱신되기 직전 그 다인원 챌린지가 통째로 "대결"
    // 취급되어 승패 집계가 오염된다 — 반드시 제외해야 한다.
    supabase
      .from("challenges")
      .select("id,metric,start_date,end_date")
      .eq("type", "user")
      .is("kind", null)
      .returns<UserChallengeRow[]>(),
    // 챌린지 랭킹: 매일 5천자·매일 1만자·초단 완고 성공(milestone_5k/
    // milestone_10k/draft_done) 횟수를 종류 구분 없이 동일하게 합산해서
    // 집계한다. 위 조회들과 서로 무관해서 같은 배치로 함께 보낸다.
    supabase
      .from("activity_logs")
      .select("user_id,type")
      .in("type", ["milestone_5k", "milestone_10k", "draft_done"])
      .returns<{ user_id: string; type: string }[]>(),
    // 관리자가 만든 "달성 여부" 임시 이벤트는 마일스톤 로그 대신
    // challenge_participants.achieved 자가 신고로 성공 여부를 판단한다 —
    // 이 조회 자체는 위 배치와 서로 무관하므로 같이 보낸다.
    supabase
      .from("challenges")
      .select("id")
      .eq("is_admin_event", true)
      .eq("metric", "achievement")
      .returns<{ id: string }[]>(),
    supabase
      .from("typing_scores")
      .select("user_id,cpm")
      .returns<{ user_id: string; cpm: number }[]>(),
  ]);

  const adminAchievementIds = (adminAchievementChallenges ?? []).map((c) => c.id);
  const { data: adminAchievedRows } = adminAchievementIds.length
    ? await supabase
        .from("challenge_participants")
        .select("user_id")
        .in("challenge_id", adminAchievementIds)
        .eq("achieved", true)
        .returns<{ user_id: string | null }[]>()
    : { data: [] as { user_id: string | null }[] };

  const roomNames: Record<string, string> = {};
  // 방 기준 랭킹을 웹소설/웹툰으로 전환할 때, 방 자체가 어느 직업
  // 대상으로 설정돼 있는지(또는 '누구나')로 어느 방이 보일지 정한다.
  const roomTargetPositions: Record<string, "novelist" | "webtoon" | null> = {};
  for (const r of rooms ?? []) {
    roomNames[r.id] = r.name;
    roomTargetPositions[r.id] =
      r.target_position === "novelist" || r.target_position === "webtoon" ? r.target_position : null;
  }
  const userNames: Record<string, string> = {};
  const userPositions: Record<string, "novelist" | "webtoon"> = {};
  for (const u of users ?? []) {
    userNames[u.id] = u.name || u.email;
    userPositions[u.id] = u.position === "webtoon" ? "webtoon" : "novelist";
  }
  const selfPosition = userPositions[user!.id] ?? "novelist";

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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-sm border border-neutral-400 p-4 dark:border-neutral-600">
          <RankingTabs
            records={records}
            roomNames={roomNames}
            userNames={userNames}
            userPositions={userPositions}
            roomTargetPositions={roomTargetPositions}
            defaultPosition={selfPosition}
            today={today}
            selfId={user!.id}
          />
        </div>
        <div className="overflow-hidden rounded-sm border border-neutral-400 p-4 dark:border-neutral-600">
          <WinLossRanking
            rows={winLossRows}
            userPositions={userPositions}
            defaultPosition={selfPosition}
          />
        </div>
        <div className="overflow-hidden rounded-sm border border-neutral-400 p-4 dark:border-neutral-600">
          <ChallengeRanking
            rows={challengeRankingRows}
            userPositions={userPositions}
            defaultPosition={selfPosition}
          />
        </div>
        <div className="overflow-hidden rounded-sm border border-neutral-400 p-4 dark:border-neutral-600">
          <TypingRanking
            rows={typingRankingRows}
            userPositions={userPositions}
            defaultPosition={selfPosition}
          />
        </div>
      </div>
    </div>
    </PageAdRail>
  );
}
