import type { createClient } from "@/lib/supabase/server";
import { fetchAllPages } from "@/lib/paginate";
import { dateInTimezone } from "@/lib/time";

// 방에서 글자수를 입력하거나(chars_added) 집중 시간이 기록될 때마다
// (focus_recorded) activity_logs에 실제 시각(UTC)이 남는다 — 이걸
// 사용자의 시간대로 다시 변환해서 "그 사람 기준 오늘 출석했는가"를
// 계산한다. daily_records.record_date는 이미 KST로 고정 저장돼서
// 다른 시간대로 재해석할 수 없기 때문에 여기서는 쓰지 않는다.
export function attendedDatesFromLogs(
  logs: { type: string; created_at: string }[],
  timezone: string | null
): Set<string> {
  const dates = new Set<string>();
  for (const log of logs) {
    if (log.type !== "chars_added" && log.type !== "focus_recorded") continue;
    dates.add(dateInTimezone(new Date(log.created_at), timezone));
  }
  return dates;
}

export function computeStreakDays(attendedDates: Set<string>, today: string): number {
  const [y, m, day] = today.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, day));
  if (!attendedDates.has(today)) {
    d.setUTCDate(d.getUTCDate() - 1);
  }
  let streak = 0;
  while (attendedDates.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return streak;
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

// 내 출석 날짜(각자 시간대의 자정 기준) — DB 함수(0074)로 날짜 목록만 받는다. 함수가 아직 없으면(0074 실행 전) 예전처럼
// 로그를 페이지로 나눠 끝까지 읽어서 계산한다(한 번에 1000행까지만 오므로 나눠 읽지 않으면 최근 날이 빠진다).
export async function getMyAttendedDates(
  supabase: Supabase,
  userId: string,
  timezone: string | null
): Promise<Set<string>> {
  const { data, error } = await supabase.rpc("my_attendance_dates", { p_tz: timezone ?? "Asia/Seoul" });
  if (!error && Array.isArray(data)) {
    return new Set((data as unknown[]).map((d) => String(d).slice(0, 10)));
  }

  const logs = await fetchAllPages<{ type: string; created_at: string }>((from, to) =>
    supabase
      .from("activity_logs")
      .select("type,created_at")
      .eq("user_id", userId)
      .in("type", ["chars_added", "focus_recorded"])
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)
      .returns<{ type: string; created_at: string }[]>()
  );
  const dates = attendedDatesFromLogs(logs, timezone);
  // 접속해서 남긴 출석(0075)도 합친다 — 테이블이 없으면 빈 결과다.
  const { data: visits } = await supabase
    .from("attendance_days")
    .select("day")
    .eq("user_id", userId)
    .returns<{ day: string }[]>();
  for (const v of visits ?? []) dates.add(String(v.day).slice(0, 10));
  return dates;
}
