// 웹(src/lib/time.ts)과 같은 규칙 — 기록 날짜는 기기(로컬) 기준이고, 23시 이후 시작한 세션은 새벽 1시까지
// 시작한 날의 기록으로 남긴다. "오늘"(랭킹·집계)은 항상 한국 시간(KST) 기준이다.
String pad2(int n) => n.toString().padLeft(2, '0');

String toLocalDateKey(DateTime d) =>
    '${d.year}-${pad2(d.month)}-${pad2(d.day)}';

String effectiveRecordDate(DateTime sessionStart, [DateTime? nowArg]) {
  final now = nowArg ?? DateTime.now();
  if (now.hour < 1) {
    final startedYesterday =
        toLocalDateKey(sessionStart) != toLocalDateKey(now);
    if (startedYesterday && sessionStart.hour >= 23) {
      return toLocalDateKey(sessionStart);
    }
  }
  return toLocalDateKey(now);
}

String formatClock(int totalSeconds) {
  final s = totalSeconds < 0 ? 0 : totalSeconds;
  return '${pad2(s ~/ 60)}:${pad2(s % 60)}';
}

String todayKst([DateTime? date]) {
  final base = (date ?? DateTime.now()).toUtc().add(const Duration(hours: 9));
  return '${base.year}-${pad2(base.month)}-${pad2(base.day)}';
}
