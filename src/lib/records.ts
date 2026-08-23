export type DailyRecord = {
  userId: string;
  date: string; // YYYY-MM-DD
  chars: number;
  focusMinutes: number;
};

export function sumTotals(records: DailyRecord[], userId: string) {
  return records
    .filter((r) => r.userId === userId)
    .reduce(
      (acc, r) => ({
        chars: acc.chars + r.chars,
        focusMinutes: acc.focusMinutes + r.focusMinutes,
      }),
      { chars: 0, focusMinutes: 0 }
    );
}

export type Period = "day" | "month" | "year";

export function inPeriod(date: string, period: Period, today: string) {
  if (period === "day") return date === today;
  if (period === "month") return date.slice(0, 7) === today.slice(0, 7);
  return date.slice(0, 4) === today.slice(0, 4);
}

export function inRange(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

export function aggregateByMember(
  records: DailyRecord[],
  userIds: string[],
  period: Period,
  today: string
) {
  const filtered = records.filter((r) => inPeriod(r.date, period, today));
  return userIds.map((userId) => {
    const rows = filtered.filter((r) => r.userId === userId);
    return {
      userId,
      chars: rows.reduce((sum, r) => sum + r.chars, 0),
      focusMinutes: rows.reduce((sum, r) => sum + r.focusMinutes, 0),
      attendanceDays: new Set(
        rows.filter((r) => r.chars > 0 || r.focusMinutes > 0).map((r) => r.date)
      ).size,
    };
  });
}
