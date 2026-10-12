import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchAllPages } from "@/lib/paginate";
import { todayKst } from "@/lib/time";
import { computeChallengeScoreByUser } from "@/lib/challenge-rankings";

// 모바일 앱의 [랭킹] 화면용 — 웹 랭킹 페이지(ranking/page.tsx, ranking-tabs.tsx)와 같은 규칙으로 서버에서 집계해
// 필요한 만큼만 돌려준다(앱이 전체 기록을 내려받지 않도록). 앱은 "Authorization: Bearer <로그인 토큰>"을 보낸다.
//   GET /api/app/ranking?scope=user|room&period=day|month|year&date=YYYY-MM-DD&position=novelist|webtoon

const ROW_CAP = 100;
type Period = "day" | "month" | "year";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// 기준 날짜가 속한 일/월/연의 시작·끝 날짜(YYYY-MM-DD).
function periodRange(period: Period, date: string): { start: string; end: string } {
  const [y, m, d] = date.split("-").map(Number);
  if (period === "day") return { start: date, end: date };
  if (period === "month") {
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return { start: `${y}-${pad2(m)}-01`, end: `${y}-${pad2(m)}-${pad2(last)}` };
  }
  void d;
  return { start: `${y}-01-01`, end: `${y}-12-31` };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") === "room" ? "room" : "user";
  const rawPeriod = url.searchParams.get("period");
  const period: Period = rawPeriod === "day" || rawPeriod === "year" ? rawPeriod : "month";
  const today = todayKst();
  const dateParam = url.searchParams.get("date") ?? "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) && dateParam <= today ? dateParam : today;
  const rawPosition = url.searchParams.get("position");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const selfId = user?.id ?? null;
  const { start, end } = periodRange(period, date);

  type Rec = { room_id: string | null; user_id: string; chars: number; focus_minutes: number };
  const [records, typingRows, milestoneRows, adminEvents] = await Promise.all([
    fetchAllPages<Rec>((from, to) =>
      supabase
        .from("daily_records")
        .select("room_id,user_id,chars,focus_minutes")
        .gte("record_date", start)
        .lte("record_date", end)
        .order("record_date")
        .order("user_id")
        .order("room_id")
        .range(from, to)
        .returns<Rec[]>()
    ),
    fetchAllPages<{ user_id: string; cpm: number }>((from, to) =>
      supabase
        .from("typing_scores")
        .select("user_id,cpm")
        .order("cpm", { ascending: false })
        .order("user_id")
        .range(from, to)
        .returns<{ user_id: string; cpm: number }[]>()
    ),
    fetchAllPages<{ user_id: string; type: string }>((from, to) =>
      supabase
        .from("activity_logs")
        .select("user_id,type")
        .in("type", ["milestone_1k", "milestone_5k", "milestone_10k", "draft_done"])
        .order("created_at")
        .order("user_id")
        .range(from, to)
        .returns<{ user_id: string; type: string }[]>()
    ),
    supabase
      .from("challenges")
      .select("id")
      .eq("is_admin_event", true)
      .eq("metric", "achievement")
      .returns<{ id: string }[]>(),
  ]);

  const adminIds = (adminEvents.data ?? []).map((c) => c.id);
  const { data: adminAchieved } = adminIds.length
    ? await supabase
        .from("challenge_participants")
        .select("user_id")
        .in("challenge_id", adminIds)
        .eq("achieved", true)
        .returns<{ user_id: string | null }[]>()
    : { data: [] as { user_id: string | null }[] };

  const challengeScore = computeChallengeScoreByUser(milestoneRows, adminAchieved ?? []);

  // 이름·직업·방 정보는 화면에 나올 사람/방만 가져온다.
  const bestCpm = new Map<string, number>();
  for (const r of typingRows) bestCpm.set(r.user_id, Math.max(bestCpm.get(r.user_id) ?? 0, r.cpm));
  const userIds = new Set<string>([
    ...records.map((r) => r.user_id),
    ...bestCpm.keys(),
    ...challengeScore.keys(),
    ...(selfId ? [selfId] : []),
  ]);
  const roomIds = Array.from(new Set(records.map((r) => r.room_id).filter((v): v is string => !!v)));

  const [users, rooms] = await Promise.all([
    fetchAllPages<{ id: string; name: string | null; position: string | null }>((from, to) =>
      supabase
        .from("users")
        .select("id,name,position")
        .in("id", Array.from(userIds))
        .order("id")
        .range(from, to)
        .returns<{ id: string; name: string | null; position: string | null }[]>()
    ),
    roomIds.length
      ? fetchAllPages<{ id: string; name: string; target_position: string | null }>((from, to) =>
          supabase
            .from("rooms")
            .select("id,name,target_position")
            .in("id", roomIds)
            .order("id")
            .range(from, to)
            .returns<{ id: string; name: string; target_position: string | null }[]>()
        )
      : Promise.resolve([] as { id: string; name: string; target_position: string | null }[]),
  ]);

  const userName = new Map(users.map((u) => [u.id, u.name ?? ""]));
  const userPos = new Map(users.map((u) => [u.id, u.position === "webtoon" ? "webtoon" : "novelist"] as const));
  const selfPosition = selfId ? (userPos.get(selfId) ?? "novelist") : "novelist";
  const position = rawPosition === "webtoon" || rawPosition === "novelist" ? rawPosition : selfPosition;
  const roomMeta = new Map(rooms.map((r) => [r.id, r]));

  // 같은 chars 컬럼이 직업마다 다른 단위(글자수/컷수)라서 한 번에 한 직업만 보여 준다(웹과 같은 규칙).
  const totals = new Map<string, { chars: number; minutes: number }>();
  for (const r of records) {
    if (scope === "room") {
      if (!r.room_id) continue;
      const target = roomMeta.get(r.room_id)?.target_position ?? null;
      if (target !== null && target !== position) continue;
    } else if ((userPos.get(r.user_id) ?? "novelist") !== position) {
      continue;
    }
    const key = (scope === "room" ? r.room_id : r.user_id)!;
    const t = totals.get(key) ?? { chars: 0, minutes: 0 };
    t.chars += r.chars;
    t.minutes += r.focus_minutes;
    totals.set(key, t);
  }
  const ranked = Array.from(totals.entries())
    .map(([key, t]) => ({
      key,
      name: (scope === "room" ? roomMeta.get(key)?.name : userName.get(key)) ?? "",
      chars: t.chars,
      minutes: t.minutes,
    }))
    .sort((a, b) => b.chars - a.chars)
    .map((r, i) => ({ rank: i + 1, ...r }));
  const rows = ranked.slice(0, ROW_CAP);

  // 내 위치는 방/개인 탭과 무관하게 "개인 기준" 순위로 보여 준다(웹의 하단 고정 바와 같다).
  const personTotals = new Map<string, number>();
  for (const r of records) {
    if ((userPos.get(r.user_id) ?? "novelist") !== position) continue;
    personTotals.set(r.user_id, (personTotals.get(r.user_id) ?? 0) + r.chars);
  }
  const personRanked = Array.from(personTotals.entries()).sort((a, b) => b[1] - a[1]);
  const myIndex = selfId ? personRanked.findIndex(([id]) => id === selfId) : -1;
  const me =
    myIndex === -1 || !selfId
      ? null
      : { rank: myIndex + 1, chars: personRanked[myIndex][1], total: personRanked.length };

  const typing = Array.from(bestCpm.entries())
    .filter(([id]) => (userPos.get(id) ?? "novelist") === position)
    .map(([id, cpm]) => ({ key: id, name: userName.get(id) ?? "", cpm }))
    .sort((a, b) => b.cpm - a.cpm)
    .slice(0, ROW_CAP)
    .map((r, i) => ({ rank: i + 1, ...r }));

  const challenge = Array.from(challengeScore.entries())
    .filter(([id]) => (userPos.get(id) ?? "novelist") === position)
    .map(([id, score]) => ({ key: id, name: userName.get(id) ?? "", score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, ROW_CAP)
    .map((r, i) => ({ rank: i + 1, ...r }));

  return NextResponse.json({
    scope,
    period,
    date,
    today,
    position,
    selfId,
    unit: position === "webtoon" ? "cut" : "char",
    overall: rows,
    me,
    typing,
    challenge,
  });
}
