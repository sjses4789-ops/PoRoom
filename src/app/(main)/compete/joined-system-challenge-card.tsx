import Link from "next/link";
import type { SystemChallengeKind } from "@/lib/system-challenges";
import { SYSTEM_CHALLENGE_META } from "@/lib/system-challenges";

export function JoinedSystemChallengeCard({
  id,
  kind,
  startDate,
  endDate,
  myTodayChars,
  draftDoneThisMonth,
}: {
  id: string;
  kind: SystemChallengeKind;
  startDate: string;
  endDate: string;
  myTodayChars: number;
  draftDoneThisMonth: boolean;
}) {
  const meta = SYSTEM_CHALLENGE_META[kind];

  return (
    <Link
      href={`/compete/${id}`}
      className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 transition hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-medium text-neutral-900 dark:text-white">
          {meta.title}
        </span>
        <span className="shrink-0 text-[12px] text-neutral-400">{meta.resetLabel}</span>
      </div>
      <p className="text-[12px] text-neutral-400">
        {startDate} ~ {endDate}
      </p>

      {meta.dailyTarget ? (
        <div className="flex flex-col gap-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className={`h-full rounded-full ${
                myTodayChars >= meta.dailyTarget ? "bg-emerald-500" : "bg-neutral-900 dark:bg-white"
              }`}
              style={{ width: `${Math.min(100, (myTodayChars / meta.dailyTarget) * 100)}%` }}
            />
          </div>
          <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
            오늘 {myTodayChars.toLocaleString()} / {meta.dailyTarget.toLocaleString()}자
          </span>
        </div>
      ) : (
        <span
          className={`self-start rounded-full px-2 py-0.5 text-[12px] font-medium ${
            draftDoneThisMonth
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
              : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
          }`}
        >
          {draftDoneThisMonth ? "이번 달 초단 완고 ✅" : "이번 달 미완고"}
        </span>
      )}
    </Link>
  );
}
