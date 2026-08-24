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
