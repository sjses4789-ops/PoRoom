import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function JoinedSystemChallengeCard({
  id,
  title,
  subLabel,
  startDate,
  endDate,
  myTodayChars,
  dailyTarget,
  draftDoneThisMonth,
  bgClass,
  isAdminEvent,
}: {
  id: string;
  title: string;
  subLabel: string;
  startDate: string;
  endDate: string;
  myTodayChars: number;
  dailyTarget?: number;
  draftDoneThisMonth?: boolean;
  /** 종류별로 다른 파스텔 채움색 — 카드끼리 구분되도록 호출부에서 정해서 넘긴다. */
  bgClass: string;
  isAdminEvent: boolean;
}) {
  const t = await getTranslations("compete.joinedSystemChallengeCard");

  return (
    <Link
      href={`/compete/${id}`}
      className={`flex flex-col gap-2 rounded-lg border p-4 transition ${
        isAdminEvent
          ? "border-red-200/60 hover:border-red-300 dark:border-red-900/60 dark:hover:border-red-800"
          : "border-neutral-200/60 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600"
      } ${bgClass}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-medium text-neutral-900 dark:text-white">
          {title}
        </span>
        <span className="shrink-0 text-[12px] text-neutral-400">{subLabel}</span>
      </div>
      <p className="text-[12px] text-neutral-400">
        {startDate} ~ {endDate}
      </p>

      {dailyTarget ? (
        <div className="flex flex-col gap-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className={`h-full rounded-full ${
                myTodayChars >= dailyTarget ? "bg-emerald-500" : "bg-neutral-900 dark:bg-white"
              }`}
              style={{ width: `${Math.min(100, (myTodayChars / dailyTarget) * 100)}%` }}
            />
          </div>
          <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
            {t("todayProgress", {
              today: myTodayChars.toLocaleString(),
              target: dailyTarget.toLocaleString(),
            })}
          </span>
        </div>
      ) : draftDoneThisMonth !== undefined ? (
        <span
          className={`self-start rounded-full px-2 py-0.5 text-[12px] font-medium ${
            draftDoneThisMonth
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
              : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
          }`}
        >
          {draftDoneThisMonth ? t("doneThisMonth") : t("notDoneThisMonth")}
        </span>
      ) : null}
    </Link>
  );
}
