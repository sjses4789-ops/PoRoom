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
