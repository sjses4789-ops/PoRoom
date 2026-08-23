import { createClient } from "@/lib/supabase/server";
import { computeStreakDays } from "@/lib/attendance";
import { todayKst } from "@/lib/time";
import { ensureChallengeTodos } from "@/lib/system-challenges";
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
  is_system: boolean;
  created_at: string;
};

type GlobalRecordRow = {
  room_id: string | null;
  user_id: string;
  record_date: string;
  chars: number;
};
type TodoRow = { id: string; content: string };

const SYSTEM_ROOM_CAPACITY = 30;

export default async function MainPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = todayKst();
  const monthPrefix = today.slice(0, 7);
  const [todayYear, todayMonth] = today.split("-").map(Number);

  // 참여 중인 챌린지가 있으면 "매일 5천자 쓰기" 같은 항목을 할 일
  // 목록에 오늘치로 채워둔다 (없을 때만 추가되므로 매일 방문할 때마다
  // 자연스럽게 새로 나타난다).
  await ensureChallengeTodos(supabase, user!.id);

  const [
    { data: rooms },
    { data: allMemberships },
    { data: myMemberships },
    { data: globalRecords },
    { data: myGoalRows },
    { count: totalUsers },
    { data: todoRows },
  ] = await Promise.all([
    supabase
      .from("rooms")
      .select("id,name,invite_code,color,tags,join_type,is_system,created_at")
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
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase
      .from("todos")
      .select("id,content")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: true })
      .returns<TodoRow[]>(),
  ]);

  const memberCountMap = new Map<string, number>();
  for (const m of allMemberships ?? []) {
    memberCountMap.set(m.room_id, (memberCountMap.get(m.room_id) ?? 0) + 1);
  }
  const myRoomIdSet = new Set((myMemberships ?? []).map((m) => m.room_id));
  const favoriteMap = new Map((myMemberships ?? []).map((m) => [m.room_id, m.is_favorite]));

  const allTimeCharsByRoom = new Map<string, number>();
  const monthCharsByRoom = new Map<string, number>();
  let selfTodayChars = 0;
  const selfAttendedDates = new Set<string>();

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
  const myMonthChars = monthCharsByUser.get(user!.id) ?? 0;
  const overallRank =
    1 + Array.from(monthCharsByUser.values()).filter((c) => c > myMonthChars).length;

  // 대시보드는 "이번 달 목표 대비 진행률"도 보여줘야 해서, 방과 무관하게
  // 내 기록만 다시 한 번 걸러낸다 (오늘의 글자수 / 이번 달 진행 글자수 /
  // 출석일).
  const { data: myRecords } = await supabase
    .from("daily_records")
    .select("record_date,chars,focus_minutes")
    .eq("user_id", user!.id)
    .returns<{ record_date: string; chars: number; focus_minutes: number }[]>();

  let monthProgressChars = 0;
  const allAttendedDates = new Set<string>();
  for (const r of myRecords ?? []) {
    if (r.record_date === today) selfTodayChars += r.chars;
    if (r.chars > 0 || r.focus_minutes > 0) allAttendedDates.add(r.record_date);
    if (r.record_date.startsWith(monthPrefix)) {
      monthProgressChars += r.chars;
      if (r.chars > 0 || r.focus_minutes > 0) selfAttendedDates.add(r.record_date);
    }
  }
  const streakDays = computeStreakDays(allAttendedDates, today);

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
    <div className="grid grid-cols-2 gap-3">
      <section className="flex h-full flex-col items-stretch justify-between gap-3 rounded-lg border border-neutral-200/60 bg-[#faf3f3] px-3 py-4 text-center dark:border-neutral-800 dark:bg-[#231a1a]">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-neutral-900 dark:text-white">마감방</p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            정원 30명 · 상시 오픈방
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
          <p className="text-sm font-medium text-neutral-900 dark:text-white">새벽방</p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            정원 30명 · 상시 오픈방
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
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
        <MainDashboard
          todayChars={selfTodayChars}
          year={todayYear}
          month={todayMonth - 1}
          attendedDates={selfAttendedDates}
          streakDays={streakDays}
          monthGoalChars={myGoalRows?.target_chars ?? 0}
          monthProgressChars={monthProgressChars}
          initialTodos={todoRows ?? []}
          overallRank={overallRank}
          totalUsers={totalUsers ?? 0}
        />
        {systemRoomSection}
      </div>

      <MainRoomLists initialRooms={roomItems} />
    </div>
  );
}
