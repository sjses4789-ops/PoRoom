// 웹(src/lib/time.ts)과 같은 규칙 — 기록 날짜는 기기(로컬) 기준이고, 23시 이후 시작한
// 세션은 새벽 1시까지 시작한 날의 기록으로 남긴다.
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toLocalDateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

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

export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
}

// "오늘"은 항상 한국 시간(KST) 기준(웹 src/lib/time.ts의 todayKst와 동일) — 랭킹·집계가 이 날짜를 쓴다.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
export function todayKst(date = new Date()): string {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}
