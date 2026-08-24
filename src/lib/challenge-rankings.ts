import { inRange } from "@/lib/records";

// 챌린지 랭킹 점수: 챌린지 종류별로 난이도가 다르므로 성공 횟수를 그냥
// 더하지 않고 가중치를 매겨서 합산한다.
export const CHALLENGE_SCORE_WEIGHTS = {
  milestone_5k: 1,
  milestone_10k: 2,
  draft_done: 5,
  admin_event: 7,
} as const;

export type MilestoneLogRow = { user_id: string; type: string };
export type AdminAchievedRow = { user_id: string | null };

export function computeChallengeScoreByUser(
  milestoneLogs: MilestoneLogRow[],
  adminAchievedRows: AdminAchievedRow[]
): Map<string, number> {
  const scoreByUser = new Map<string, number>();
  const add = (userId: string, points: number) => {
    scoreByUser.set(userId, (scoreByUser.get(userId) ?? 0) + points);
  };

  for (const l of milestoneLogs) {
    const weight = CHALLENGE_SCORE_WEIGHTS[l.type as keyof typeof CHALLENGE_SCORE_WEIGHTS];
    if (weight) add(l.user_id, weight);
  }
  for (const r of adminAchievedRows) {
    if (r.user_id) add(r.user_id, CHALLENGE_SCORE_WEIGHTS.admin_event);
  }

  return scoreByUser;
}

export type UserChallengeRow = {
  id: string;
  metric: "chars" | "minutes";
  start_date: string;
  end_date: string;
};
export type ChallengeParticipantRow = { challenge_id: string; user_id: string | null };
export type GlobalRecordRow = {
  user_id: string;
  record_date: string;
  chars: number;
  focus_minutes: number;
};

export type WinLossRecord = { wins: number; losses: number; draws: number };

// 종료된 개인 간(1:1 이상) 대결에서 기간 내 값이 가장 높은 참가자가 승,
// 나를 포함해 공동 1위면 무, 그 외엔 패 — /ranking과 [개인] 페이지가
// 똑같은 규칙으로 집계해야 해서 공용으로 뺐다.
export function computeWinLossByUser(
  completedChallenges: UserChallengeRow[],
  participants: ChallengeParticipantRow[],
  records: GlobalRecordRow[]
): Map<string, WinLossRecord> {
  const winLossByUser = new Map<string, WinLossRecord>();
  for (const c of completedChallenges) {
    const rows = participants.filter((p) => p.challenge_id === c.id && p.user_id);
    if (rows.length < 2) continue;

    const values = rows.map((r) => {
      const matching = records.filter(
        (rec) => rec.user_id === r.user_id && inRange(rec.record_date, c.start_date, c.end_date)
      );
      const value = matching.reduce(
        (sum, rec) => sum + (c.metric === "chars" ? rec.chars : rec.focus_minutes),
        0
      );
      return { userId: r.user_id!, value };
    });

    const maxValue = Math.max(...values.map((v) => v.value));
    const leaders = values.filter((v) => v.value === maxValue).length;

    for (const v of values) {
      const entry = winLossByUser.get(v.userId) ?? { wins: 0, losses: 0, draws: 0 };
      if (v.value !== maxValue) entry.losses++;
      else if (leaders > 1) entry.draws++;
      else entry.wins++;
      winLossByUser.set(v.userId, entry);
    }
  }
  return winLossByUser;
}
