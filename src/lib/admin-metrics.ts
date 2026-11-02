import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllPages } from "@/lib/paginate";
import { SUSPICIOUS_DAILY_CHARS } from "@/lib/record-limits";
import { kstDatePlusDays, todayKst } from "@/lib/time";

export type DayCount = { date: string; count: number };
export type SuspiciousRecord = { userId: string; roomId: string; date: string; chars: number };
export type AdminMetrics = {
  totalUsers: number;
  signups: DayCount[]; // 최근 14일 가입자 수
  dau: DayCount[]; // 최근 14일 접속(출석) 인원
  newUsers7d: number;
  newUsers7dJoinedRoom: number; // 최근 7일 가입자 중 방에 한 번이라도 들어간 사람
  suspicious: SuspiciousRecord[];
};

const DAYS = 14;

function lastDays(): string[] {
  const today = todayKst();
  return Array.from({ length: DAYS }, (_, i) => kstDatePlusDays(i - (DAYS - 1), today));
}

// 서비스 키로 RLS를 건너뛰고 서비스 전체 지표를 모은다 — 관리자 페이지에서만 부른다(호출 전에 관리자 확인 필수).
// 서비스 키가 없으면 null.
export async function loadAdminMetrics(): Promise<AdminMetrics | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const days = lastDays();
  const since = days[0];
  const sevenAgo = kstDatePlusDays(-6);

  const [{ count: totalUsers }, users, attendance, memberships, records] = await Promise.all([
    admin.from("users").select("id", { count: "exact", head: true }),
    fetchAllPages<{ id: string; created_at: string }>((from, to) =>
      admin
        .from("users")
        .select("id,created_at")
        .gte("created_at", `${since}T00:00:00+09:00`)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to)
    ),
    fetchAllPages<{ user_id: string; day: string }>((from, to) =>
      admin
        .from("attendance_days")
        .select("user_id,day")
        .gte("day", since)
        .order("day", { ascending: true })
        .order("user_id", { ascending: true })
        .range(from, to)
    ),
    fetchAllPages<{ user_id: string; room_id: string }>((from, to) =>
      admin
        .from("room_members")
        .select("user_id,room_id")
        .gte("joined_at", `${sevenAgo}T00:00:00+09:00`)
        .order("room_id", { ascending: true })
        .order("user_id", { ascending: true })
        .range(from, to)
    ),
    fetchAllPages<{ id: string; user_id: string; room_id: string; record_date: string; chars: number }>((from, to) =>
      admin
        .from("daily_records")
        .select("id,user_id,room_id,record_date,chars")
        .gte("record_date", kstDatePlusDays(-30))
        .gte("chars", SUSPICIOUS_DAILY_CHARS)
        .order("id", { ascending: true })
        .range(from, to)
    ),
  ]);

  const kstDay = (iso: string) => todayKst(new Date(iso));

  const signupMap = new Map<string, number>();
  for (const u of users) signupMap.set(kstDay(u.created_at), (signupMap.get(kstDay(u.created_at)) ?? 0) + 1);

  const dauMap = new Map<string, Set<string>>();
  for (const a of attendance) {
    const set = dauMap.get(a.day) ?? new Set<string>();
    set.add(a.user_id);
    dauMap.set(a.day, set);
  }

  const recent = users.filter((u) => kstDay(u.created_at) >= sevenAgo);
  const joinedIds = new Set(memberships.map((m) => m.user_id));

  return {
    totalUsers: totalUsers ?? 0,
    signups: days.map((date) => ({ date, count: signupMap.get(date) ?? 0 })),
    dau: days.map((date) => ({ date, count: dauMap.get(date)?.size ?? 0 })),
    newUsers7d: recent.length,
    newUsers7dJoinedRoom: recent.filter((u) => joinedIds.has(u.id)).length,
    suspicious: records
      .sort((a, b) => b.chars - a.chars)
      .slice(0, 50)
      .map((r) => ({ userId: r.user_id, roomId: r.room_id, date: r.record_date, chars: r.chars })),
  };
}
