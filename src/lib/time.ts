function pad2(n: number) {
  return String(n).padStart(2, "0");
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
