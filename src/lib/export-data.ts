import { createClient } from "@/lib/supabase/server";
import { inRange } from "@/lib/records";
import { todayKst } from "@/lib/time";
import { computeWinLossByUser, computeChallengeScoreByUser } from "@/lib/challenge-rankings";
import { SYSTEM_CHALLENGE_META, type SystemChallengeKind } from "@/lib/system-challenges";

const SYSTEM_CHALLENGE_KINDS: SystemChallengeKind[] = ["daily5k", "daily10k", "monthly_draft"];

type GlobalRecordRow = {
  user_id: string;
  record_date: string;
  chars: number;
  focus_minutes: number;
};
type ChallengeRow = {
  id: string;
  type: "user" | "room";
  metric: "chars" | "minutes" | "achievement";
  title: string;
  start_date: string | null;
  end_date: string | null;
  kind: SystemChallengeKind | null;
};
type ParticipantRow = { challenge_id: string; user_id: string | null };

export type ExportBundle = {
  userName: string;
  joinDate: string;
  today: string;
  works: { id: string; title: string }[];
  workDailyChars: { workId: string; workTitle: string; date: string; chars: number }[];
  monthlyChars: { month: string; chars: number }[];
  monthlyPomodoro: { month: string; focusMinutes: number; sessionCount: number }[];
  goals: {
    period: "month" | "year";
    label: string;
    targetChars: number;
    progressChars: number;
    targetMinutes: number;
    progressMinutes: number;
  }[];
  todos: { date: string; content: string }[];
  ranking: {
    thisMonth: string;
    rooms: { name: string; rank: number; memberCount: number }[];
    overallRank: number;
    totalUsers: number;
    duelRank: number | null;
    duelTotal: number;
    challengeScore: number;
  };
  duels: {
    title: string;
    metric: "chars" | "minutes";
    start: string;
    end: string;
    status: "진행 중" | "승" | "패" | "무";
    myValue: number;
    bestOpponentValue: number;
  }[];
  systemChallenges: {
    kind: SystemChallengeKind;
    title: string;
    joined: boolean;
    successCount: number;
  }[];
};

export async function buildExportBundle(): Promise<ExportBundle | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const today = todayKst();

  const [
    { data: myProfile },
    { data: myRoomRowsRaw },
    { data: myChallengeParticipantRows },
    { data: works },
    { data: workRecords },
    { data: allRecords },
    { count: totalUsers },
    { data: goalRows },
    { data: todoRows },
    { data: sessionLogs },
    { data: milestoneLogs },
  ] = await Promise.all([
    supabase.from("users").select("name").eq("id", user.id).maybeSingle<{ name: string | null }>(),
    supabase
      .from("room_members")
      .select("room_id,rooms(name,is_system)")
      .eq("user_id", user.id)
      .returns<{ room_id: string; rooms: { name: string; is_system: boolean } | null }[]>(),
    supabase
      .from("challenge_participants")
      .select("challenge_id")
      .eq("user_id", user.id)
      .returns<{ challenge_id: string }[]>(),
    supabase
      .from("works")
      .select("id,title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .returns<{ id: string; title: string }[]>(),
    supabase
      .from("work_records")
      .select("work_id,record_date,chars")
      .eq("user_id", user.id)
      .returns<{ work_id: string; record_date: string; chars: number }[]>(),
    supabase
      .from("daily_records")
      .select("user_id,record_date,chars,focus_minutes")
      .returns<GlobalRecordRow[]>(),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase
      .from("goals")
      .select("period,target_chars,target_minutes")
      .eq("user_id", user.id)
      .returns<{ period: "month" | "year"; target_chars: number; target_minutes: number }[]>(),
    supabase
      .from("todos")
      .select("content,for_date,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .returns<{ content: string; for_date: string | null; created_at: string }[]>(),
    supabase
      .from("activity_logs")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("type", "session_start")
      .returns<{ created_at: string }[]>(),
    supabase
      .from("activity_logs")
      .select("type,created_at")
      .eq("user_id", user.id)
      .in("type", ["milestone_5k", "milestone_10k", "draft_done"])
      .returns<{ type: string; created_at: string }[]>(),
  ]);

  const myRoomRows = (myRoomRowsRaw ?? []).filter((r) => !r.rooms?.is_system);
  const myRoomIds = myRoomRows.map((r) => r.room_id);
  const myChallengeIds = (myChallengeParticipantRows ?? []).map((r) => r.challenge_id);

  const [
    { data: membersOfMyRooms },
    { data: roomRecords },
    { data: myChallenges },
    { data: myChallengeParticipants },
    { data: allUserChallenges },
    { data: adminAchievementChallenges },
  ] = await Promise.all([
    myRoomIds.length
      ? supabase.from("room_members").select("room_id,user_id").in("room_id", myRoomIds).returns<
          { room_id: string; user_id: string }[]
        >()
      : Promise.resolve({ data: [] as { room_id: string; user_id: string }[] }),
    myRoomIds.length
      ? supabase
          .from("daily_records")
          .select("room_id,user_id,record_date,chars")
          .in("room_id", myRoomIds)
          .returns<{ room_id: string; user_id: string; record_date: string; chars: number }[]>()
      : Promise.resolve({ data: [] as { room_id: string; user_id: string; record_date: string; chars: number }[] }),
    myChallengeIds.length
      ? supabase
          .from("challenges")
          .select("id,type,metric,title,start_date,end_date,kind")
          .in("id", myChallengeIds)
          .returns<ChallengeRow[]>()
      : Promise.resolve({ data: [] as ChallengeRow[] }),
    myChallengeIds.length
      ? supabase
          .from("challenge_participants")
          .select("challenge_id,user_id")
          .in("challenge_id", myChallengeIds)
          .returns<ParticipantRow[]>()
      : Promise.resolve({ data: [] as ParticipantRow[] }),
    supabase
      .from("challenges")
      .select("id,metric,start_date,end_date")
      .eq("type", "user")
      .returns<{ id: string; metric: "chars" | "minutes"; start_date: string; end_date: string }[]>(),
    supabase
      .from("challenges")
      .select("id")
      .eq("is_admin_event", true)
      .eq("metric", "achievement")
      .returns<{ id: string }[]>(),
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

  const completedUserChallenges = (allUserChallenges ?? []).filter((c) => c.end_date < today);
  const completedChallengeIds = completedUserChallenges.map((c) => c.id);
  const { data: allChallengeParticipants } = completedChallengeIds.length
    ? await supabase
        .from("challenge_participants")
        .select("challenge_id,user_id")
        .in("challenge_id", completedChallengeIds)
        .returns<ParticipantRow[]>()
    : { data: [] as ParticipantRow[] };

  // ---- 월별 글자수 / 뽀모도로 통계 ----
  const myRecords = (allRecords ?? []).filter((r) => r.user_id === user.id);
  const monthKeys = new Set<string>();
  for (const r of myRecords) monthKeys.add(r.record_date.slice(0, 7));
  for (const l of sessionLogs ?? []) monthKeys.add(todayKst(new Date(l.created_at)).slice(0, 7));
  const sortedMonths = Array.from(monthKeys).sort();

  const monthlyChars = sortedMonths.map((month) => ({
    month,
    chars: myRecords.filter((r) => r.record_date.startsWith(month)).reduce((s, r) => s + r.chars, 0),
  }));
  const monthlyPomodoro = sortedMonths.map((month) => ({
    month,
    focusMinutes: myRecords
      .filter((r) => r.record_date.startsWith(month))
      .reduce((s, r) => s + r.focus_minutes, 0),
    sessionCount: (sessionLogs ?? []).filter((l) => todayKst(new Date(l.created_at)).startsWith(month))
      .length,
  }));

  // ---- 작품별 글자수 (일자별 피벗) ----
  const workTitleById = new Map((works ?? []).map((w) => [w.id, w.title]));
  const workDailyChars = (workRecords ?? []).map((r) => ({
    workId: r.work_id,
    workTitle: workTitleById.get(r.work_id) ?? "(삭제된 작품)",
    date: r.record_date,
    chars: r.chars,
  }));

  // ---- 목표 현황 ----
  const goalMap = new Map((goalRows ?? []).map((g) => [g.period, g]));
  const inPeriodChars = (period: "month" | "year") =>
    myRecords
      .filter((r) => (period === "month" ? r.record_date.slice(0, 7) === today.slice(0, 7) : r.record_date.slice(0, 4) === today.slice(0, 4)))
      .reduce((s, r) => s + r.chars, 0);
  const inPeriodMinutes = (period: "month" | "year") =>
    myRecords
      .filter((r) => (period === "month" ? r.record_date.slice(0, 7) === today.slice(0, 7) : r.record_date.slice(0, 4) === today.slice(0, 4)))
      .reduce((s, r) => s + r.focus_minutes, 0);
  const goals: ExportBundle["goals"] = (["month", "year"] as const).map((period) => {
    const row = goalMap.get(period);
    return {
      period,
      label: period === "month" ? "이번 달" : "올해",
      targetChars: row?.target_chars ?? 0,
      progressChars: inPeriodChars(period),
      targetMinutes: row?.target_minutes ?? 0,
      progressMinutes: inPeriodMinutes(period),
    };
  });

  // ---- 할 일 ----
  const todos = (todoRows ?? []).map((t) => ({
    date: t.for_date ?? t.created_at.slice(0, 10),
    content: t.content,
  }));

  // ---- 랭킹 정보(이번 달 기준) ----
  const monthPrefix = today.slice(0, 7);
  const monthRoomRecords = (roomRecords ?? []).filter((r) => r.record_date.startsWith(monthPrefix));
  const rankingRooms = myRoomRows.map((r) => {
    const members = (membersOfMyRooms ?? []).filter((m) => m.room_id === r.room_id);
    const charsByUser = new Map<string, number>();
    for (const rec of monthRoomRecords) {
      if (rec.room_id !== r.room_id) continue;
      charsByUser.set(rec.user_id, (charsByUser.get(rec.user_id) ?? 0) + rec.chars);
    }
    const totals = members.map((m) => charsByUser.get(m.user_id) ?? 0);
    const myChars = charsByUser.get(user.id) ?? 0;
    const rank = 1 + totals.filter((c) => c > myChars).length;
    return { name: r.rooms?.name ?? "알 수 없는 방", rank, memberCount: members.length };
  });

  const monthGlobalRecords = (allRecords ?? []).filter((r) => r.record_date.startsWith(monthPrefix));
  const overallCharsByUser = new Map<string, number>();
  for (const r of monthGlobalRecords) {
    overallCharsByUser.set(r.user_id, (overallCharsByUser.get(r.user_id) ?? 0) + r.chars);
  }
  const myOverallChars = overallCharsByUser.get(user.id) ?? 0;
  const overallRank = 1 + Array.from(overallCharsByUser.values()).filter((c) => c > myOverallChars).length;

  const winLossByUser = computeWinLossByUser(
    completedUserChallenges,
    allChallengeParticipants ?? [],
    allRecords ?? []
  );
  const winLossRanked = Array.from(winLossByUser.entries()).sort(
    (a, b) => b[1].wins - a[1].wins || a[1].losses - b[1].losses
  );
  const winLossRankIndex = winLossRanked.findIndex(([uid]) => uid === user.id);
  const duelRank = winLossRankIndex === -1 ? null : winLossRankIndex + 1;
  const duelTotal = winLossRanked.length;

  // activity_logs RLS는 내 로그와, 나와 진행 중인 챌린지를 같이 하는
  // 사람의 로그만 읽게 허용한다 — 전체 유저의 마일스톤 로그를 모을 수
  // 없어 전체 순위는 계산하지 않고, 내 점수만 계산해서 보여준다.
  const challengeScoreByUser = computeChallengeScoreByUser(
    (milestoneLogs ?? []).map((l) => ({ user_id: user.id, type: l.type })),
    (adminAchievedRows ?? []).filter((r) => r.user_id === user.id)
  );
  const challengeScore = challengeScoreByUser.get(user.id) ?? 0;

  // ---- 대결 현황 ----
  const duels: ExportBundle["duels"] = (myChallenges ?? [])
    .filter((c) => c.type === "user")
    .map((c) => {
      const rows = (myChallengeParticipants ?? []).filter((p) => p.challenge_id === c.id && p.user_id);
      const values = rows.map((r) => {
        const value = (allRecords ?? [])
          .filter(
            (rec) =>
              rec.user_id === r.user_id &&
              c.start_date &&
              c.end_date &&
              inRange(rec.record_date, c.start_date, c.end_date)
          )
          .reduce((sum, rec) => sum + (c.metric === "minutes" ? rec.focus_minutes : rec.chars), 0);
        return { userId: r.user_id!, value };
      });
      const myValue = values.find((v) => v.userId === user.id)?.value ?? 0;
      const others = values.filter((v) => v.userId !== user.id);
      const bestOpponentValue = others.length ? Math.max(...others.map((v) => v.value)) : 0;
      const ended = c.end_date ? c.end_date < today : false;
      let status: "진행 중" | "승" | "패" | "무" = "진행 중";
      if (ended && values.length >= 2) {
        const maxValue = Math.max(...values.map((v) => v.value));
        const leaders = values.filter((v) => v.value === maxValue).length;
        status = myValue !== maxValue ? "패" : leaders > 1 ? "무" : "승";
      }
      return {
        title: c.title,
        metric: c.metric === "minutes" ? "minutes" : "chars",
        start: c.start_date ?? "-",
        end: c.end_date ?? "-",
        status,
        myValue,
        bestOpponentValue,
      };
    });

  // ---- 챌린지 기록(반복 챌린지) ----
  const myMilestoneLogs = milestoneLogs ?? [];
  const successCountFor = (kind: SystemChallengeKind) => {
    const type = kind === "daily5k" ? "milestone_5k" : kind === "daily10k" ? "milestone_10k" : "draft_done";
    return myMilestoneLogs.filter((l) => l.type === type).length;
  };
  const systemChallenges: ExportBundle["systemChallenges"] = SYSTEM_CHALLENGE_KINDS.map((kind) => ({
    kind,
    title: SYSTEM_CHALLENGE_META[kind].title,
    joined: (myChallenges ?? []).some((c) => c.kind === kind),
    successCount: successCountFor(kind),
  }));

  return {
    userName: myProfile?.name ?? "(닉네임 없음)",
    joinDate: user.created_at.slice(0, 10),
    today,
    works: works ?? [],
    workDailyChars,
    monthlyChars,
    monthlyPomodoro,
    goals,
    todos,
    ranking: {
      thisMonth: monthPrefix,
      rooms: rankingRooms,
      overallRank,
      totalUsers: totalUsers ?? 0,
      duelRank,
      duelTotal,
      challengeScore,
    },
    duels,
    systemChallenges,
  };
}

export type BackupBundle = {
  exportedAt: string;
  userId: string;
  userName: string;
  works: unknown;
  workRecords: unknown;
  workRecordEntries: unknown;
  dailyRecords: unknown;
  todos: unknown;
  goals: unknown;
  challenges: unknown;
  challengeParticipation: unknown;
};

export async function buildBackupDump(): Promise<BackupBundle | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const [
    { data: myProfile },
    { data: works },
    { data: workRecords },
    { data: workRecordEntries },
    { data: dailyRecords },
    { data: todos },
    { data: goals },
    { data: myParticipation },
  ] = await Promise.all([
    supabase.from("users").select("name").eq("id", user.id).maybeSingle<{ name: string | null }>(),
    supabase.from("works").select("id,title,last_current_chars,created_at").eq("user_id", user.id),
    supabase.from("work_records").select("work_id,record_date,chars").eq("user_id", user.id),
    supabase.from("work_record_entries").select("work_id,delta,current_chars,created_at").eq("user_id", user.id),
    supabase
      .from("daily_records")
      .select("room_id,record_date,chars,focus_minutes,break_minutes")
      .eq("user_id", user.id),
    supabase.from("todos").select("content,for_date,created_at").eq("user_id", user.id),
    supabase.from("goals").select("period,target_chars,target_minutes").eq("user_id", user.id),
    supabase.from("challenge_participants").select("challenge_id,achieved").eq("user_id", user.id),
  ]);

  const challengeIds = (myParticipation ?? []).map((p) => p.challenge_id);
  const { data: challenges } = challengeIds.length
    ? await supabase
        .from("challenges")
        .select("id,type,metric,title,start_date,end_date,kind")
        .in("id", challengeIds)
    : { data: [] };

  return {
    exportedAt: new Date().toISOString(),
    userId: user.id,
    userName: myProfile?.name ?? "(닉네임 없음)",
    works: works ?? [],
    workRecords: workRecords ?? [],
    workRecordEntries: workRecordEntries ?? [],
    dailyRecords: dailyRecords ?? [],
    todos: todos ?? [],
    goals: goals ?? [],
    challenges: challenges ?? [],
    challengeParticipation: myParticipation ?? [],
  };
}
