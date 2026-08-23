const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function AttendanceCalendar({
  year,
  month,
  attendedDates,
  streakDays,
}: {
  year: number;
  month: number; // 0-indexed, like Date#getMonth()
  attendedDates: Set<string>;
  streakDays?: number;
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const dateKey = (day: number) => `${year}-${pad2(month + 1)}-${pad2(day)}`;

  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const attendedCount = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(
    (d) => attendedDates.has(dateKey(d))
  ).length;

  return (
    <div className="mx-auto flex w-full max-w-[220px] flex-col gap-1.5">
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-neutral-400 dark:text-neutral-500">
        {WEEKDAY_LABELS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) =>
          day === null ? (
            <span key={i} />
          ) : (
            <span
              key={i}
              className={`flex aspect-square items-center justify-center rounded text-[11px] ${
                attendedDates.has(dateKey(day))
                  ? "bg-emerald-500 font-medium text-white"
                  : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
              }`}
            >
              {day}
            </span>
          )
        )}
      </div>
      <p className="text-center text-sm font-medium text-neutral-600 dark:text-neutral-300">
        이번 달 출석 {attendedCount}일
      </p>
      {streakDays !== undefined && (
        <p className="text-center text-xs font-medium text-amber-600 dark:text-amber-400">
          🔥 연속 출석 {streakDays}일
        </p>
      )}
    </div>
  );
}
