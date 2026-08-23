function pad2(n: number) {
  return String(n).padStart(2, "0");
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// PoRoom is a Korean app, so "오늘"/"이번 주"/"이번 달" always mean Korea
// Standard Time (UTC+9) — not the server's local time, and not raw UTC
// (Date#toISOString() is UTC, which lags KST by 9 hours: a user checking
// the site at, say, 00:30 KST would otherwise still see "today" as the
// previous UTC day, since UTC midnight only arrives at 09:00 KST).
export function todayKst(date = new Date()): string {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

// activity_logs.created_at처럼 timestamptz 컬럼을 "KST 기준 하루"로 범위
// 조회할 때 쓴다 — `${date}T00:00:00.000Z`처럼 그냥 Z를 붙이면 그 날짜를
// UTC 하루로 취급해버려 KST와 9시간 어긋난다.
export function kstDatePlusDays(days: number, from = todayKst()): string {
  const [y, m, d] = from.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function kstDayRangeUtc(dateKst: string) {
  return {
    startUtc: new Date(`${dateKst}T00:00:00+09:00`).toISOString(),
    endUtc: new Date(`${dateKst}T23:59:59.999+09:00`).toISOString(),
  };
}

export function toLocalDateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// A work session that starts late at night (23:00+) and keeps running past
// midnight is still logged against the day it started, up until 01:00 —
// otherwise every new calendar day resets which daily_records row writes
// land in.
export function effectiveRecordDate(sessionStartMs: number, now = new Date()) {
  if (now.getHours() < 1) {
    const sessionStart = new Date(sessionStartMs);
    const startedYesterday = toLocalDateKey(sessionStart) !== toLocalDateKey(now);
    if (startedYesterday && sessionStart.getHours() >= 23) {
      return toLocalDateKey(sessionStart);
    }
  }
  return toLocalDateKey(now);
}

export function formatRelativeTime(iso: string | null): string | null {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}
