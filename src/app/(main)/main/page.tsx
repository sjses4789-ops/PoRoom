import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { PageAdRail } from "@/components/page-ad-rail";
import { computeStreakDays, attendedDatesFromLogs } from "@/lib/attendance";
import { todayKst, dateInTimezone } from "@/lib/time";
import { ensureChallengeTodos, isTodoRowActive } from "@/lib/system-challenges";
import { SystemRoomButton } from "./system-room-buttons";
import { MainRoomLists } from "./main-room-lists";
import { MainDashboard } from "./main-dashboard";
import { type RoomListItem } from "./room-card";

type RoomRow = {
  id: string;
  name: string;
  invite_code: string;
  color: string;
  tags: string[];
  join_type: "invite" | "open";
  target_position: string | null;
  is_system: boolean;
  created_at: string;
};

type GlobalRecordRow = {
  room_id: string | null;
  user_id: string;
  record_date: string;
  chars: number;
};
type TodoRow = { id: string; content: string; for_date: string | null };

const SYSTEM_ROOM_CAPACITY = 50;

export default async function MainPage() {
  const supabase = await createClient();
  const t = await getTranslations("main.systemRooms");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = todayKst();
  const monthPrefix = today.slice(0, 7);

  // 참여 중인 챌린지가 있으면 "매일 5천자 쓰기" 같은 항목을 할 일
  // 목록에 오늘치로 채워둔다 (없을 때만 추가되므로 매일 방문할 때마다
  // 자연스럽게 새로 나타난다). 아래 배치와 동시에 진행시키고, todos를
  // 읽기 직전에만 완료를 기다린다 — todos 조회는 이 작업 결과에
  // 실제로 의존하므로 그것만은 순서를 지켜야 한다.
  const ensureTodosPromise = ensureChallengeTodos(supabase, user!.id);

  const [
    { data: rooms },
    { data: allMemberships },
    { data: myMemberships },
    { data: globalRecords },
    { data: myGoalRows },
    { data: allUserPositions },
    { data: myProfile },
    { data: myAttendanceLogs },
  ] = await Promise.all([
    supabase
      .from("rooms")
      .select("id,name,invite_code,color,tags,join_type,target_position,is_system,created_at")
      .order("created_at", { ascending: false })
      .returns<RoomRow[]>(),
    supabase.from("room_members").select("room_id").returns<
      { room_id: string }[]
    >(),
    supabase
      .from("room_members")
      .select("room_id,is_favorite")
      .eq("user_id", user!.id)
      .returns<{ room_id: string; is_favorite: boolean }[]>(),
    // daily_records is globally readable (RLS opened up for ranking) — used
    // here to total each room's all-time/this-month char counts, and each
    // user's this-month total for the personal ranking summary.
    supabase
      .from("daily_records")
      .select("room_id,user_id,record_date,chars")
      .returns<GlobalRecordRow[]>(),
    supabase
      .from("goals")
      .select("target_chars")
      .eq("user_id", user!.id)
      .eq("period", "month")
      .maybeSingle<{ target_chars: number }>(),
    // "이번 달 랭킹"을 웹소설 작가는 웹소설 작가끼리, 웹툰 작가는 웹툰
    // 작가끼리로 좁혀야 해서(글자수/컷수는 단위가 다름) 전체 사용자의
    // 직업을 한 번에 가져온다.
    supabase.from("users").select("id,position").returns<{ id: string; position: string | null }[]>(),
    supabase
      .from("users")
      .select("timezone,position")
      .eq("id", user!.id)
      .maybeSingle<{ timezone: string | null; position: string | null }>(),
    // 출석일은 나라별 자정 기준으로 계산해야 해서, KST로 이미 고정된
    // daily_records 대신 실제 시각이 남는 activity_logs를 쓴다.
    supabase
      .from("activity_logs")
      .select("type,created_at")
      .eq("user_id", user!.id)
      .in("type", ["chars_added", "focus_recorded"])
      .returns<{ type: string; created_at: string }[]>(),
  ]);

  await ensureTodosPromise;
  const { data: todoRows } = await supabase
    .from("todos")
    .select("id,content,for_date")
    .eq("user_id", user!.id)
    .is("completed_at", null)
    .order("created_at", { ascending: true })
    .returns<TodoRow[]>();
  const visibleTodos = (todoRows ?? [])
    .filter((r) => isTodoRowActive(r, today))
    .map((r) => ({ id: r.id, content: r.content }));

  const memberCountMap = new Map<string, number>();
  for (const m of allMemberships ?? []) {
    memberCountMap.set(m.room_id, (memberCountMap.get(m.room_id) ?? 0) + 1);
  }
  const myRoomIdSet = new Set((myMemberships ?? []).map((m) => m.room_id));
  const favoriteMap = new Map((myMemberships ?? []).map((m) => [m.room_id, m.is_favorite]));

  const allTimeCharsByRoom = new Map<string, number>();
  const monthCharsByRoom = new Map<string, number>();
  let selfTodayChars = 0;

  const monthCharsByUser = new Map<string, number>();
  for (const r of globalRecords ?? []) {
    if (r.room_id) {
      allTimeCharsByRoom.set(r.room_id, (allTimeCharsByRoom.get(r.room_id) ?? 0) + r.chars);
      if (r.record_date.startsWith(monthPrefix)) {
        monthCharsByRoom.set(r.room_id, (monthCharsByRoom.get(r.room_id) ?? 0) + r.chars);
      }
    }
    if (r.record_date.startsWith(monthPrefix)) {
      monthCharsByUser.set(r.user_id, (monthCharsByUser.get(r.user_id) ?? 0) + r.chars);
    }
  }
  const selfPosition: "novelist" | "webtoon" = myProfile?.position === "webtoon" ? "webtoon" : "novelist";
  const positionById = new Map((allUserPositions ?? []).map((u) => [u.id, u.position]));
  const isSamePosition = (userId: string) =>
    (positionById.get(userId) === "webtoon" ? "webtoon" : "novelist") === selfPosition;

  const myMonthChars = monthCharsByUser.get(user!.id) ?? 0;
  // 글자수(웹소설)와 컷수(웹툰)는 단위가 달라 같은 직업끼리만 비교한다.
  const monthCharsBySamePosition = Array.from(monthCharsByUser.entries()).filter(([uid]) =>
    isSamePosition(uid)
  );
  const overallRank =
    1 + monthCharsBySamePosition.filter(([, c]) => c > myMonthChars).length;
  const totalUsers = (allUserPositions ?? []).filter((u) => isSamePosition(u.id)).length;

  // 대시보드는 "이번 달 목표 대비 진행률"도 보여줘야 해서, 방과 무관하게
  // 내 기록만 다시 한 번 걸러낸다 (오늘의 글자수 / 이번 달 진행 글자수 /
  // 출석일).
  const { data: myRecords } = await supabase
    .from("daily_records")
    .select("record_date,chars,focus_minutes")
    .eq("user_id", user!.id)
    .returns<{ record_date: string; chars: number; focus_minutes: number }[]>();

  let monthProgressChars = 0;
  for (const r of myRecords ?? []) {
    if (r.record_date === today) selfTodayChars += r.chars;
    if (r.record_date.startsWith(monthPrefix)) {
      monthProgressChars += r.chars;
    }
  }

  // 출석일은 KST가 아니라 각자(브라우저에서 감지해 저장한) 시간대의
  // 자정 기준으로 센다 — 다른 계산(이번 달 목표 진행률/랭킹 등)은
  // 여전히 한국 시간 기준을 유지한다.
  const userTimezone = myProfile?.timezone ?? null;
  const userToday = dateInTimezone(new Date(), userTimezone);
  const [userTodayYear, userTodayMonth] = userToday.split("-").map(Number);
  const allAttendedDates = attendedDatesFromLogs(myAttendanceLogs ?? [], userTimezone);
  const userMonthPrefix = userToday.slice(0, 7);
  const selfAttendedDates = new Set(
    Array.from(allAttendedDates).filter((d) => d.startsWith(userMonthPrefix))
  );
  const streakDays = computeStreakDays(allAttendedDates, userToday);

  // 마감방/새벽반은 위쪽 전용 버튼으로 입장하는 상시 시스템 방이라
  // 일반 방 목록에는 노출하지 않는다.
  const roomItems: RoomListItem[] = (rooms ?? [])
    .filter((r) => !r.is_system)
    .map((r) => ({
      id: r.id,
      name: r.name,
      memberCount: memberCountMap.get(r.id) ?? 0,
      color: r.color,
      tags: r.tags,
      joinType: r.join_type,
      targetPosition: r.target_position === "novelist" || r.target_position === "webtoon"
        ? r.target_position
        : null,
      isMember: myRoomIdSet.has(r.id),
      isFavorite: favoriteMap.get(r.id) ?? false,
      inviteCode: myRoomIdSet.has(r.id) ? r.invite_code : undefined,
      createdAt: r.created_at,
      allTimeChars: allTimeCharsByRoom.get(r.id) ?? 0,
      monthChars: monthCharsByRoom.get(r.id) ?? 0,
    }));

  const systemRoomCounts: Record<string, number> = {};
  for (const r of rooms ?? []) {
    if (r.is_system) systemRoomCounts[r.name] = memberCountMap.get(r.id) ?? 0;
  }

  const systemRoomSection = (
    <div className="grid grid-cols-1 gap-3">
      <section className="flex h-full flex-col items-stretch justify-between gap-3 rounded-lg border border-neutral-200/60 bg-[#faf3f3] px-3 py-4 text-center dark:border-neutral-800 dark:bg-[#231a1a]">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-neutral-900 dark:text-white">{t("deadline")}</p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {t("capacityHint", { capacity: SYSTEM_ROOM_CAPACITY })}
          </p>
        </div>
        <SystemRoomButton
          kind="deadline"
          count={systemRoomCounts["마감방"] ?? 0}
          capacity={SYSTEM_ROOM_CAPACITY}
        />
      </section>
      <section className="flex h-full flex-col items-stretch justify-between gap-3 rounded-lg border border-neutral-200/60 bg-[#f2f3f9] px-3 py-4 text-center dark:border-neutral-800 dark:bg-[#1a1c26]">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-neutral-900 dark:text-white">{t("dawn")}</p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {t("capacityHint", { capacity: SYSTEM_ROOM_CAPACITY })}
          </p>
        </div>
        <SystemRoomButton
          kind="dawn"
          count={systemRoomCounts["새벽방"] ?? 0}
          capacity={SYSTEM_ROOM_CAPACITY}
        />
      </section>
    </div>
  );

  return (
    <PageAdRail>
    <div className="flex flex-col gap-10">
      {/* 마감방/새벽방 칸은 고정 폭으로 둬서, 랜딩 폭이 늘어나면 그만큼
          내 현황 쪽(1fr)이 전부 넓어지도록 한다. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_220px]">
        <MainDashboard
          todayChars={selfTodayChars}
          year={userTodayYear}
          month={userTodayMonth - 1}
          attendedDates={selfAttendedDates}
          streakDays={streakDays}
          monthGoalChars={myGoalRows?.target_chars ?? 0}
          monthProgressChars={monthProgressChars}
          initialTodos={visibleTodos}
          overallRank={overallRank}
          totalUsers={totalUsers ?? 0}
          selfPosition={selfPosition}
        />
        {systemRoomSection}
      </div>

      <MainRoomLists initialRooms={roomItems} />
    </div>
    </PageAdRail>
  );
}
