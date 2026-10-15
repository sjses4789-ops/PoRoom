import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchAllPages } from "@/lib/paginate";
import { computeStreakDays, getMyAttendedDates } from "@/lib/attendance";
import { dateInTimezone, todayKst } from "@/lib/time";
import { ensureChallengeTodos, isTodoRowActive } from "@/lib/system-challenges";

// 앱(데스크탑·모바일)의 [포룸] 화면용 — 웹 [포룸] 페이지(main/page.tsx)와 같은 규칙으로 서버에서 계산해 한 번에 돌려준다
// (앱이 전체 기록을 내려받지 않도록). "Authorization: Bearer <로그인 토큰>"을 보낸다.
//   GET /api/app/home

const SYSTEM_ROOM_CAPACITY = 50;

type RoomRow = {
  id: string;
  name: string;
  color: string;
  tags: string[];
  join_type: "invite" | "open";
  target_position: string | null;
  is_system: boolean;
  created_at: string;
};
type GlobalRecordRow = { room_id: string | null; user_id: string; record_date: string; chars: number };

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const selfId = user.id;

  const today = todayKst();
  const monthPrefix = today.slice(0, 7);
  const ensureTodosPromise = ensureChallengeTodos(supabase, selfId);

  const [rooms, memberships, myMemberships, records, goalRow, positions, profile] = await Promise.all([
    supabase
      .from("rooms")
      .select("id,name,color,tags,join_type,target_position,is_system,created_at")
      .order("created_at", { ascending: false })
      .returns<RoomRow[]>(),
    supabase.from("room_members").select("room_id").returns<{ room_id: string }[]>(),
    supabase
      .from("room_members")
      .select("room_id,is_favorite")
      .eq("user_id", selfId)
      .returns<{ room_id: string; is_favorite: boolean }[]>(),
    fetchAllPages<GlobalRecordRow>((from, to) =>
      supabase
        .from("daily_records")
        .select("room_id,user_id,record_date,chars")
        .order("record_date")
        .order("user_id")
        .order("room_id")
        .range(from, to)
        .returns<GlobalRecordRow[]>()
    ),
    supabase.from("goals").select("target_chars").eq("user_id", selfId).eq("period", "month").maybeSingle<{ target_chars: number }>(),
    supabase.from("users").select("id,position").returns<{ id: string; position: string | null }[]>(),
    supabase
      .from("users")
      .select("timezone,position")
      .eq("id", selfId)
      .maybeSingle<{ timezone: string | null; position: string | null }>(),
  ]);

  await ensureTodosPromise;
  const { data: todoRows } = await supabase
    .from("todos")
    .select("id,content,for_date")
    .eq("user_id", selfId)
    .is("completed_at", null)
    .order("created_at", { ascending: true })
    .returns<{ id: string; content: string; for_date: string | null }[]>();
  const todos = (todoRows ?? []).filter((r) => isTodoRowActive(r, today)).map((r) => ({ id: r.id, content: r.content }));

  const memberCount = new Map<string, number>();
  for (const m of memberships.data ?? []) memberCount.set(m.room_id, (memberCount.get(m.room_id) ?? 0) + 1);
  const mine = new Set((myMemberships.data ?? []).map((m) => m.room_id));
  const favorite = new Map((myMemberships.data ?? []).map((m) => [m.room_id, m.is_favorite]));

  const myRoomIds = Array.from(mine);
  const { data: codeRows } = myRoomIds.length
    ? await supabase.from("rooms").select("id,invite_code").in("id", myRoomIds).returns<{ id: string; invite_code: string }[]>()
    : { data: [] as { id: string; invite_code: string }[] };
  const inviteCode = new Map((codeRows ?? []).map((r) => [r.id, r.invite_code]));

  const allTimeByRoom = new Map<string, number>();
  const monthByRoom = new Map<string, number>();
  const monthByUser = new Map<string, number>();
  let todayChars = 0;
  let monthProgress = 0;
  for (const r of records) {
    if (r.room_id) {
      allTimeByRoom.set(r.room_id, (allTimeByRoom.get(r.room_id) ?? 0) + r.chars);
      if (r.record_date.startsWith(monthPrefix)) monthByRoom.set(r.room_id, (monthByRoom.get(r.room_id) ?? 0) + r.chars);
    }
    if (r.record_date.startsWith(monthPrefix)) {
      monthByUser.set(r.user_id, (monthByUser.get(r.user_id) ?? 0) + r.chars);
      if (r.user_id === selfId) monthProgress += r.chars;
    }
    if (r.user_id === selfId && r.record_date === today) todayChars += r.chars;
  }

  const selfPosition: "novelist" | "webtoon" = profile.data?.position === "webtoon" ? "webtoon" : "novelist";
  const positionById = new Map((positions.data ?? []).map((u) => [u.id, u.position]));
  const samePosition = (id: string) => (positionById.get(id) === "webtoon" ? "webtoon" : "novelist") === selfPosition;
  const myMonthChars = monthByUser.get(selfId) ?? 0;
  const overallRank = 1 + Array.from(monthByUser.entries()).filter(([uid, c]) => samePosition(uid) && c > myMonthChars).length;
  const totalUsers = (positions.data ?? []).filter((u) => samePosition(u.id)).length;

  const timezone = profile.data?.timezone ?? null;
  const userToday = dateInTimezone(new Date(), timezone);
  const attended = await getMyAttendedDates(supabase, selfId, timezone);
  attended.add(userToday); // poroom에 들어와 있는 것 자체가 오늘 출석
  const streakDays = computeStreakDays(attended, userToday);

  const roomItems = (rooms.data ?? [])
    .filter((r) => !r.is_system)
    .map((r) => ({
      id: r.id,
      name: r.name,
      memberCount: memberCount.get(r.id) ?? 0,
      color: r.color,
      tags: r.tags ?? [],
      joinType: r.join_type,
      targetPosition: r.target_position === "novelist" || r.target_position === "webtoon" ? r.target_position : null,
      isMember: mine.has(r.id),
      isFavorite: favorite.get(r.id) ?? false,
      inviteCode: inviteCode.get(r.id) ?? null,
      createdAt: r.created_at,
      allTimeChars: allTimeByRoom.get(r.id) ?? 0,
      monthChars: monthByRoom.get(r.id) ?? 0,
    }));

  const systemRooms: Record<string, { count: number; isMember: boolean }> = {
    deadline: { count: 0, isMember: false },
    dawn: { count: 0, isMember: false },
  };
  for (const r of rooms.data ?? []) {
    if (!r.is_system) continue;
    const key = r.name === "마감방" ? "deadline" : r.name === "새벽방" ? "dawn" : null;
    if (key) systemRooms[key] = { count: memberCount.get(r.id) ?? 0, isMember: mine.has(r.id) };
  }

  const [year, month] = userToday.split("-").map(Number);
  return NextResponse.json({
    ok: true,
    position: selfPosition,
    rooms: roomItems,
    systemRooms: { ...systemRooms, capacity: SYSTEM_ROOM_CAPACITY },
    dashboard: {
      todayChars,
      monthGoalChars: goalRow.data?.target_chars ?? 0,
      monthProgressChars: monthProgress,
      overallRank,
      totalUsers,
      streakDays,
      year,
      month, // 1~12
      attendedDates: Array.from(attended).filter((d) => d.startsWith(userToday.slice(0, 7))),
      todos,
    },
  });
}
