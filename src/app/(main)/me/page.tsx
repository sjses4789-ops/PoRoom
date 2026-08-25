import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { inPeriod, inRange } from "@/lib/records";
import { computeStreakDays, attendedDatesFromLogs } from "@/lib/attendance";
import { todayKst, dateInTimezone } from "@/lib/time";
import { NicknameForm } from "@/components/nickname-form";
import { PageAdRail } from "@/components/page-ad-rail";
import { GoalPanel, type PeriodGoal, type PeriodProgress } from "./goal-panel";
import { CharacterSection } from "./character-section";
import { DeleteAccountButton } from "./delete-account-button";
import { AttendanceCalendar } from "./attendance-calendar";
import { ChallengeRecordPanel } from "./challenge-record-panel";
import { SystemChallengeRecordPanel } from "./system-challenge-record-panel";
import { RankingStatusPanel } from "./ranking-status-panel";
import { WorksPanel } from "./works-panel";
import { PomodoroStatsPanel } from "./pomodoro-stats-panel";
import { TodoList, type Todo } from "@/components/todo-list";
import { ImportBackupButton } from "./import-backup-button";
import { ensureChallengeTodos, type SystemChallengeKind } from "@/lib/system-challenges";
import {
  computeWinLossByUser,
  computeChallengeScoreByUser,
  type UserChallengeRow as GlobalUserChallengeRow,
} from "@/lib/challenge-rankings";

const SYSTEM_CHALLENGE_KINDS: SystemChallengeKind[] = ["daily5k", "daily10k", "monthly_draft"];

type MyRoomRow = {
  room_id: string;
  rooms: { name: string; is_system: boolean } | null;
};
type MemberRow = { room_id: string; user_id: string };
type RecordRow = { room_id: string; user_id: string; record_date: string; chars: number };
type GlobalRecordRow = {
  user_id: string;
  record_date: string;
  chars: number;
  focus_minutes: number;
  break_minutes: number;
};
type GoalRow = {
  period: "month" | "year";
  target_chars: number;
  target_minutes: number;
};
type ChallengeParticipantRow = { challenge_id: string; user_id: string | null };
type ChallengeRow = {
  id: string;
  type: "user" | "room";
  metric: "chars" | "minutes";
  start_date: string;
  end_date: string;
  kind: SystemChallengeKind | null;
};

export default async function MePage() {
  const t = await getTranslations("me.page");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 서로 의존하지 않는 조회는 한 번에 병렬로 보내서 왕복 횟수를 줄인다 —
  // [개인] 페이지 전환이 느리다는 피드백의 대부분은 이 페이지가 필요한
  // 쿼리들을 순차적으로(하나씩 기다렸다가 다음 것) 보내고 있던 게 원인.
  const [{ data: myProfile }, { data: myRoomRowsRaw }, { data: myChallengeRows }] =
    await Promise.all([
      supabase
        .from("users")
        .select("name,character_id,timezone")
        .eq("id", user.id)
        .maybeSingle<{ name: string | null; character_id: string | null; timezone: string | null }>(),
      supabase
        .from("room_members")
        .select("room_id,rooms(name,is_system)")
        .eq("user_id", user.id)
        .returns<MyRoomRow[]>(),
      supabase
        .from("challenge_participants")
        .select("challenge_id")
        .eq("user_id", user.id)
        .returns<{ challenge_id: string }[]>(),
    ]);

  // 마감방/새벽반은 상시 시스템 방이라 "입장한 방 목록"/"방 기준" 랭킹에서
  // 제외한다.
  const myRoomRows = (myRoomRowsRaw ?? []).filter((r) => !r.rooms?.is_system);
  const myRoomIds = myRoomRows.map((r) => r.room_id);
  const myChallengeIds = (myChallengeRows ?? []).map((r) => r.challenge_id);

  // 결과가 필요 없는(할 일 목록에 반영만 되면 되는) 작업이라, await하지
  // 않고 아래 큰 Promise.all과 동시에 진행시킨 뒤 todos를 읽기 직전에만
  // 완료를 기다린다.
  const ensureTodosPromise = ensureChallengeTodos(supabase, user.id);

  const [
    { data: membersOfMyRooms },
    { data: recordsInMyRooms },
    { data: allRecords },
    { count: totalUsers },
    { data: goalRows },
    { data: myChallenges },
    { data: myChallengeParticipants },
    { data: allUserChallenges },
    { data: globalMilestoneLogs },
    { data: workRows },
    { data: workRecordRows },
    { data: workEntryRows },
    { data: pomodoroSessionLogs },
    { data: siteTimeRows },
    { data: myAttendanceLogs },
    { data: dailyGoalRows },
  ] = await Promise.all([
    myRoomIds.length
      ? supabase
          .from("room_members")
          .select("room_id,user_id")
          .in("room_id", myRoomIds)
          .returns<MemberRow[]>()
      : Promise.resolve({ data: [] as MemberRow[] }),
    myRoomIds.length
      ? supabase
          .from("daily_records")
          .select("room_id,user_id,record_date,chars")
          .in("room_id", myRoomIds)
          .returns<RecordRow[]>()
      : Promise.resolve({ data: [] as RecordRow[] }),
    supabase
      .from("daily_records")
      .select("user_id,record_date,chars,focus_minutes,break_minutes")
      .returns<GlobalRecordRow[]>(),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase
      .from("goals")
      .select("period,target_chars,target_minutes")
      .eq("user_id", user.id)
      .returns<GoalRow[]>(),
    myChallengeIds.length
      ? supabase
          .from("challenges")
          .select("id,type,metric,start_date,end_date,kind")
          .in("id", myChallengeIds)
          .returns<ChallengeRow[]>()
      : Promise.resolve({ data: [] as ChallengeRow[] }),
    myChallengeIds.length
      ? supabase
          .from("challenge_participants")
          .select("challenge_id,user_id")
          .in("challenge_id", myChallengeIds)
          .returns<ChallengeParticipantRow[]>()
      : Promise.resolve({ data: [] as ChallengeParticipantRow[] }),
    // 대결 랭킹/챌린지 랭킹은 전체 유저를 대상으로 내 순위를 매겨야 해서,
    // "type=user" 대결과 마일스톤 로그는 나로 한정하지 않고 전체를 가져온다.
    supabase
      .from("challenges")
      .select("id,metric,start_date,end_date")
      .eq("type", "user")
      .returns<GlobalUserChallengeRow[]>(),
    supabase
      .from("activity_logs")
      .select("user_id,type")
      .in("type", ["milestone_5k", "milestone_10k", "draft_done"])
      .returns<{ user_id: string; type: string }[]>(),
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
      .from("work_record_entries")
      .select("work_id,delta,created_at")
      .eq("user_id", user.id)
      .returns<{ work_id: string; delta: number; created_at: string }[]>(),
    // 뽀모도로 통계(하단 패널)의 "일별 횟수"는 뽀모도로를 (재)시작할 때마다
    // 남는 session_start 로그로 센다.
    supabase
      .from("activity_logs")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("type", "session_start")
      .returns<{ created_at: string }[]>(),
    supabase
      .from("site_time_logs")
      .select("record_date,seconds")
      .eq("user_id", user.id)
      .returns<{ record_date: string; seconds: number }[]>(),
    // 출석일은 나라별 자정 기준으로 계산해야 해서, KST로 이미 고정된
    // daily_records 대신 실제 시각이 남는 activity_logs를 쓴다.
    supabase
      .from("activity_logs")
      .select("type,created_at")
      .eq("user_id", user.id)
      .in("type", ["chars_added", "focus_recorded"])
      .returns<{ type: string; created_at: string }[]>(),
    // "오늘" 목표 현황 탭에서 과거 날짜를 넘겨봐도 그 날짜에 실제로
    // 적용되던 목표치를 보여주기 위해, 전체 이력을 한 번에 가져와
    // 클라이언트에서 날짜별로 계산한다.
    supabase
      .from("daily_char_goals")
      .select("effective_date,target_chars")
      .eq("user_id", user.id)
      .order("effective_date", { ascending: true })
      .returns<{ effective_date: string; target_chars: number }[]>(),
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

  const memberCountByRoom = new Map<string, number>();
  for (const m of membersOfMyRooms ?? []) {
    memberCountByRoom.set(m.room_id, (memberCountByRoom.get(m.room_id) ?? 0) + 1);
  }

  const myRooms = (myRoomRows ?? []).map((r) => ({
    id: r.room_id,
    name: r.rooms?.name ?? t("unknownRoom"),
    memberCount: memberCountByRoom.get(r.room_id) ?? 0,
  }));

  const today = todayKst();
  const myGlobalRecords = (allRecords ?? []).filter((r) => r.user_id === user.id);

  // 출석일은 KST가 아니라 각자(브라우저에서 감지해 저장한) 시간대의
  // 자정 기준으로 센다 — 다른 계산(목표 진행률/랭킹 등)은 여전히
  // 한국 시간 기준을 유지한다.
  const userTimezone = myProfile?.timezone ?? null;
  const userToday = dateInTimezone(new Date(), userTimezone);
  const [userTodayYear, userTodayMonth] = userToday.split("-").map(Number);
  const myMilestoneLogs = (globalMilestoneLogs ?? []).filter((l) => l.user_id === user.id);

  // 대결 랭킹(전체 유저 대상 승패 순위)을 위해 종료된 모든 개인 대결의
  // 참가자가 필요하다 — 아래 배치와 동시에 진행시키고, todos를 기다릴 때
  // 함께 기다린다.
  const completedUserChallenges = (allUserChallenges ?? []).filter((c) => c.end_date < today);
  const completedChallengeIds = completedUserChallenges.map((c) => c.id);
  const allParticipantsPromise = completedChallengeIds.length
    ? supabase
        .from("challenge_participants")
        .select("challenge_id,user_id")
        .in("challenge_id", completedChallengeIds)
        .returns<ChallengeParticipantRow[]>()
    : Promise.resolve({ data: [] as ChallengeParticipantRow[] });

  const attendedDates = attendedDatesFromLogs(myAttendanceLogs ?? [], userTimezone);
  const streakDays = computeStreakDays(attendedDates, userToday);

  // 종료된 개인 간(1:1 이상) 대결의 승/패/무를 집계한다 — 기간 내 값이
  // 가장 높은 참가자가 승, 나 포함 공동 1위면 무, 그 외엔 패.
  let wins = 0;
  let losses = 0;
  let draws = 0;
  for (const c of myChallenges ?? []) {
    if (c.type !== "user" || c.end_date >= today) continue;
    const rows = (myChallengeParticipants ?? []).filter(
      (p) => p.challenge_id === c.id && p.user_id
    );
    if (rows.length < 2) continue;
    const values = rows.map((r) => {
      const matching = (allRecords ?? []).filter(
        (rec) => rec.user_id === r.user_id && inRange(rec.record_date, c.start_date, c.end_date)
      );
      const value = matching.reduce(
        (sum, rec) => sum + (c.metric === "chars" ? rec.chars : rec.focus_minutes),
        0
      );
      return { userId: r.user_id!, value };
    });
    const myValue = values.find((v) => v.userId === user.id)?.value ?? 0;
    const maxValue = Math.max(...values.map((v) => v.value));
    const leaders = values.filter((v) => v.value === maxValue).length;
    if (myValue !== maxValue) losses++;
    else if (leaders > 1) draws++;
    else wins++;
  }

  const systemChallengeJoined = Object.fromEntries(
    SYSTEM_CHALLENGE_KINDS.map((kind) => [
      kind,
      (myChallenges ?? []).some((c) => c.kind === kind),
    ])
  ) as Record<SystemChallengeKind, boolean>;

  const systemChallengeSuccessCounts: Record<SystemChallengeKind, number> = {
    daily5k: myMilestoneLogs.filter((l) => l.type === "milestone_5k").length,
    daily10k: myMilestoneLogs.filter((l) => l.type === "milestone_10k").length,
    monthly_draft: myMilestoneLogs.filter((l) => l.type === "draft_done").length,
  };

  const computeProgress = (period: "month" | "year"): PeriodProgress => {
    const rows = myGlobalRecords.filter((r) => inPeriod(r.record_date, period, today));
    return {
      chars: rows.reduce((sum, r) => sum + r.chars, 0),
      minutes: rows.reduce((sum, r) => sum + r.focus_minutes, 0),
    };
  };

  const pomodoroSessions = (pomodoroSessionLogs ?? []).map((r) => ({
    date: todayKst(new Date(r.created_at)),
  }));
  const pomodoroMinutes = myGlobalRecords.map((r) => ({
    date: r.record_date,
    focusMinutes: r.focus_minutes,
    breakMinutes: r.break_minutes,
  }));
  const siteTime = (siteTimeRows ?? []).map((r) => ({
    date: r.record_date,
    seconds: r.seconds,
  }));

  const works = workRows ?? [];
  const workRecords = (workRecordRows ?? []).map((r) => ({
    workId: r.work_id,
    date: r.record_date,
    chars: r.chars,
  }));
  const workEntries = (workEntryRows ?? []).map((r) => ({
    workId: r.work_id,
    delta: r.delta,
    createdAt: r.created_at,
  }));

  const [, { data: allChallengeParticipants }] = await Promise.all([
    ensureTodosPromise,
    allParticipantsPromise,
  ]);
  const { data: todoRows } = await supabase
    .from("todos")
    .select("id,content")
    .eq("user_id", user.id)
    .is("completed_at", null)
    .order("created_at", { ascending: true })
    .returns<Todo[]>();
  const todos = todoRows ?? [];

  // 대결 랭킹: /ranking과 동일한 규칙(computeWinLossByUser)으로 전체 유저의
  // 승/패/무를 집계한 뒤, 그 안에서 내 순위를 찾는다.
  const winLossByUser = computeWinLossByUser(
    completedUserChallenges,
    allChallengeParticipants ?? [],
    allRecords ?? []
  );
  const winLossRanked = Array.from(winLossByUser.entries()).sort(
    (a, b) => b[1].wins - a[1].wins || a[1].losses - b[1].losses
  );
  const winLossRankIndex = winLossRanked.findIndex(([uid]) => uid === user.id);
  const winLossRank = winLossRankIndex === -1 ? null : winLossRankIndex + 1;
  const winLossTotal = winLossRanked.length;

  // 챌린지 랭킹: 종류별 가중치(5천자 1점·1만자 2점·초단 5점·관리자 이벤트
  // 7점)로 합산한 점수 전체 순위 중 내 순위를 찾는다 — /ranking과 동일한
  // 규칙을 공유한다.
  const challengeScoreByUser = computeChallengeScoreByUser(
    globalMilestoneLogs ?? [],
    adminAchievedRows ?? []
  );
  const challengeRanked = Array.from(challengeScoreByUser.entries()).sort(
    (a, b) => b[1] - a[1]
  );
  const challengeRankIndex = challengeRanked.findIndex(([uid]) => uid === user.id);
  const challengeRank = challengeRankIndex === -1 ? null : challengeRankIndex + 1;
  const challengeTotal = challengeRanked.length;

  const goalMap = new Map((goalRows ?? []).map((g) => [g.period, g]));
  const buildGoal = (period: "month" | "year"): PeriodGoal => {
    const row = goalMap.get(period);
    return {
      targetChars: row?.target_chars ?? 0,
      targetMinutes: row?.target_minutes ?? 0,
    };
  };

  const goals: Record<"month" | "year", PeriodGoal> = {
    month: buildGoal("month"),
    year: buildGoal("year"),
  };
  const progress: Record<"month" | "year", PeriodProgress> = {
    month: computeProgress("month"),
    year: computeProgress("year"),
  };

  // "오늘" 탭(및 상단 화살표로 넘겨보는 다른 날짜)은 서버 왕복 없이
  // 클라이언트에서 바로 계산할 수 있도록, 날짜별 합계와 일일 목표 이력을
  // 그대로 내려보낸다.
  const dailyRecordsByDate = new Map<string, { chars: number; minutes: number }>();
  for (const r of myGlobalRecords) {
    const entry = dailyRecordsByDate.get(r.record_date) ?? { chars: 0, minutes: 0 };
    entry.chars += r.chars;
    entry.minutes += r.focus_minutes;
    dailyRecordsByDate.set(r.record_date, entry);
  }
  const dailyRecordPoints = Array.from(dailyRecordsByDate.entries()).map(([date, v]) => ({
    date,
    chars: v.chars,
    minutes: v.minutes,
  }));
  const dailyGoalPoints = (dailyGoalRows ?? []).map((g) => ({
    effectiveDate: g.effective_date,
    targetChars: g.target_chars,
  }));

  return (
    <PageAdRail>
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
        {t("title")}
      </h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("accountInfo")}</h2>
        <div className="grid grid-cols-1 divide-y divide-neutral-400 overflow-hidden rounded-md border border-neutral-400 dark:divide-neutral-600 dark:border-neutral-600 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex flex-col justify-between p-4 text-sm">
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-neutral-900 dark:text-white">{myProfile?.name ?? t("noNickname")}</span>
              <span className="text-neutral-500">{user.email}</span>
              <span className="text-[12px] text-neutral-400">
                {t("joinDate", { date: user.created_at.slice(0, 10).replace(/-/g, ".") })}
              </span>
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                <a
                  href="/api/export/excel"
                  className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {t("exportExcel")}
                </a>
                <a
                  href="/api/export/backup"
                  className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {t("backup")}
                </a>
                <ImportBackupButton />
              </div>
            </div>
            <div className="mt-3 flex justify-center">
              <DeleteAccountButton />
            </div>
          </div>
          <CharacterSection initialCharacterId={myProfile?.character_id ?? null} />
          <div className="p-4">
            <h3 className="mb-2 text-xs font-semibold text-neutral-500">
              {t("changeNickname")}
            </h3>
            <NicknameForm
              defaultValue={myProfile?.name ?? ""}
              redirectTo="/me"
              submitLabel={t("changeNicknameSubmit")}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="grid grid-cols-1 divide-y divide-neutral-400 overflow-hidden rounded-md border border-neutral-400 dark:divide-neutral-600 dark:border-neutral-600 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex flex-col gap-3 p-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("attendance")}</h2>
            <AttendanceCalendar
              year={userTodayYear}
              month={userTodayMonth - 1}
              attendedDates={attendedDates}
              streakDays={streakDays}
            />
          </div>
          <div className="flex flex-col gap-3 p-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("todo")}</h2>
            <TodoList initialTodos={todos} />
          </div>
          <div className="flex flex-col gap-3 p-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              {t("goalStatus")}
            </h2>
            <GoalPanel
              goals={goals}
              progress={progress}
              dailyRecords={dailyRecordPoints}
              dailyGoals={dailyGoalPoints}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="grid grid-cols-1 divide-y divide-neutral-400 overflow-hidden rounded-md border border-neutral-400 dark:divide-neutral-600 dark:border-neutral-600 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
          <div className="p-4">
            <RankingStatusPanel
              selfId={user.id}
              rooms={myRooms}
              roomMembers={membersOfMyRooms ?? []}
              roomRecords={recordsInMyRooms ?? []}
              globalRecords={allRecords ?? []}
              totalUsers={totalUsers ?? 0}
              winLossRank={winLossRank}
              winLossTotal={winLossTotal}
              challengeRank={challengeRank}
              challengeTotal={challengeTotal}
            />
          </div>
          <div className="flex flex-col gap-3 p-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("competeStatus")}</h2>
            <p className="text-xs text-neutral-500">{t("competeStatusSubtitle")}</p>
            <ChallengeRecordPanel wins={wins} losses={losses} draws={draws} />
          </div>
          <div className="flex flex-col gap-3 p-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("challengeRecord")}</h2>
            <p className="text-xs text-neutral-500">{t("challengeRecordSubtitle")}</p>
            <SystemChallengeRecordPanel
              joined={systemChallengeJoined}
              successCounts={systemChallengeSuccessCounts}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <WorksPanel works={works} records={workRecords} entries={workEntries} />
      </section>

      <section className="flex flex-col gap-3">
        <PomodoroStatsPanel sessions={pomodoroSessions} minutes={pomodoroMinutes} siteTime={siteTime} />
      </section>
    </div>
    </PageAdRail>
  );
}
