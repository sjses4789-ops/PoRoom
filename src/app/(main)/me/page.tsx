import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { inPeriod, inRange } from "@/lib/records";
import { computeStreakDays } from "@/lib/attendance";
import { NicknameForm } from "@/components/nickname-form";
import { GoalPanel, type PeriodGoal, type PeriodProgress } from "./goal-panel";
import { CharacterSection } from "./character-section";
import { AttendanceCalendar } from "./attendance-calendar";
import { ChallengeRecordPanel } from "./challenge-record-panel";
import { SystemChallengeRecordPanel } from "./system-challenge-record-panel";
import { RankingStatusPanel } from "./ranking-status-panel";
import { WorkChart } from "./work-chart";
import { TodoList, type Todo } from "@/components/todo-list";
import type { SystemChallengeKind } from "@/lib/system-challenges";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: myProfile } = await supabase
    .from("users")
    .select("name,character_id")
    .eq("id", user.id)
    .maybeSingle<{ name: string | null; character_id: string | null }>();

  const { data: myRoomRowsRaw } = await supabase
    .from("room_members")
    .select("room_id,rooms(name,is_system)")
    .eq("user_id", user.id)
    .returns<MyRoomRow[]>();

  // 마감방/새벽반은 상시 시스템 방이라 "입장한 방 목록"/"방 기준" 랭킹에서
  // 제외한다.
  const myRoomRows = (myRoomRowsRaw ?? []).filter((r) => !r.rooms?.is_system);
  const myRoomIds = myRoomRows.map((r) => r.room_id);

  const { data: myChallengeRows } = await supabase
    .from("challenge_participants")
    .select("challenge_id")
    .eq("user_id", user.id)
    .returns<{ challenge_id: string }[]>();
  const myChallengeIds = (myChallengeRows ?? []).map((r) => r.challenge_id);

  const [
    { data: membersOfMyRooms },
    { data: recordsInMyRooms },
    { data: allRecords },
    { count: totalUsers },
    { data: goalRows },
    { data: myChallenges },
    { data: myChallengeParticipants },
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
      .select("user_id,record_date,chars,focus_minutes")
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
  ]);

  const memberCountByRoom = new Map<string, number>();
  for (const m of membersOfMyRooms ?? []) {
    memberCountByRoom.set(m.room_id, (memberCountByRoom.get(m.room_id) ?? 0) + 1);
  }

  const myRooms = (myRoomRows ?? []).map((r) => ({
    id: r.room_id,
    name: r.rooms?.name ?? "알 수 없는 방",
    memberCount: memberCountByRoom.get(r.room_id) ?? 0,
  }));

  const today = new Date().toISOString().slice(0, 10);
  const myGlobalRecords = (allRecords ?? []).filter((r) => r.user_id === user.id);

  const attendedDates = new Set(
    myGlobalRecords
      .filter((r) => r.chars > 0 || r.focus_minutes > 0)
      .map((r) => r.record_date)
  );
  const streakDays = computeStreakDays(attendedDates, today);
  const now = new Date();

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

  const { data: milestoneLogs } = await supabase
    .from("activity_logs")
    .select("type")
    .eq("user_id", user.id)
    .in("type", ["milestone_5k", "milestone_10k", "draft_done"])
    .returns<{ type: string }[]>();
  const systemChallengeSuccessCounts: Record<SystemChallengeKind, number> = {
    daily5k: (milestoneLogs ?? []).filter((l) => l.type === "milestone_5k").length,
    daily10k: (milestoneLogs ?? []).filter((l) => l.type === "milestone_10k").length,
    monthly_draft: (milestoneLogs ?? []).filter((l) => l.type === "draft_done").length,
  };

  const computeProgress = (period: "month" | "year"): PeriodProgress => {
    const rows = myGlobalRecords.filter((r) => inPeriod(r.record_date, period, today));
    return {
      chars: rows.reduce((sum, r) => sum + r.chars, 0),
      minutes: rows.reduce((sum, r) => sum + r.focus_minutes, 0),
    };
  };

  const [{ data: workRows }, { data: workRecordRows }, { data: workEntryRows }] =
    await Promise.all([
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
    ]);
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

  const { data: todoRows } = await supabase
    .from("todos")
    .select("id,content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .returns<Todo[]>();
  const todos = todoRows ?? [];

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

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
        개인
      </h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">계정 정보</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-neutral-200 p-4 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-neutral-900 dark:text-white">{myProfile?.name ?? "닉네임 없음"}</span>
              <span className="text-neutral-500">{user.email}</span>
              <span className="text-[12px] text-neutral-400">
                가입일 {user.created_at.slice(0, 10).replace(/-/g, ".")}
              </span>
            </div>
          </div>
          <CharacterSection initialCharacterId={myProfile?.character_id ?? null} />
          <div className="rounded-lg border border-neutral-200 p-4">
            <h3 className="mb-2 text-xs font-semibold text-neutral-500">
              닉네임 변경
            </h3>
            <NicknameForm
              defaultValue={myProfile?.name ?? ""}
              redirectTo="/me"
              submitLabel="변경"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">출석일</h2>
            <div className="rounded-lg border border-neutral-200 p-3">
              <AttendanceCalendar
                year={now.getFullYear()}
                month={now.getMonth()}
                attendedDates={attendedDates}
                streakDays={streakDays}
              />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">할 일</h2>
            <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800 dark:bg-neutral-900">
              <TodoList initialTodos={todos} />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              목표 현황
            </h2>
            <GoalPanel goals={goals} progress={progress} />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            <RankingStatusPanel
              selfId={user.id}
              rooms={myRooms}
              roomMembers={membersOfMyRooms ?? []}
              roomRecords={recordsInMyRooms ?? []}
              globalRecords={allRecords ?? []}
              totalUsers={totalUsers ?? 0}
            />
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">대결 현황</h2>
            <div className="rounded-lg border border-neutral-200 p-4">
              <p className="text-xs text-neutral-500">종료된 개인 대결</p>
              <ChallengeRecordPanel wins={wins} losses={losses} draws={draws} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">챌린지 기록</h2>
            <div className="rounded-lg border border-neutral-200 p-4">
              <p className="text-xs text-neutral-500">시스템 챌린지 참여/성공</p>
              <SystemChallengeRecordPanel
                joined={systemChallengeJoined}
                successCounts={systemChallengeSuccessCounts}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <WorkChart works={works} records={workRecords} entries={workEntries} />
        </div>
      </section>
    </div>
  );
}
