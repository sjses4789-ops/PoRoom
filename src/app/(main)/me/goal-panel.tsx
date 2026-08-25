"use client";

import { useActionState, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { saveGoal } from "@/lib/goals";
import { setDailyCharGoal } from "@/lib/daily-goal";
import type { ActionResult } from "@/lib/rooms";
import { todayKst, kstDatePlusDays } from "@/lib/time";
import GoalBar from "./goal-bar";

export type PeriodGoal = { targetChars: number; targetMinutes: number };
export type PeriodProgress = { chars: number; minutes: number };
export type DailyRecordPoint = { date: string; chars: number; minutes: number };
export type DailyGoalPoint = { effectiveDate: string; targetChars: number };

type Period = "day" | "month" | "year";

function shiftYearMonth(ym: string, deltaMonths: number): string {
  const [y, m] = ym.split("-").map(Number);
  const total = y * 12 + (m - 1) + deltaMonths;
  const newY = Math.floor(total / 12);
  const newM = (total % 12) + 1;
  return `${newY}-${String(newM).padStart(2, "0")}`;
}

function sumProgress(points: DailyRecordPoint[]): PeriodProgress {
  return points.reduce(
    (acc, r) => ({ chars: acc.chars + r.chars, minutes: acc.minutes + r.minutes }),
    { chars: 0, minutes: 0 }
  );
}

export function GoalPanel({
  goals,
  progress,
  dailyRecords,
  dailyGoals,
}: {
  goals: Record<"month" | "year", PeriodGoal>;
  progress: Record<"month" | "year", PeriodProgress>;
  dailyRecords: DailyRecordPoint[];
  dailyGoals: DailyGoalPoint[];
}) {
  const t = useTranslations("me.goalPanel");
  const PERIODS: { key: Period; label: string }[] = [
    { key: "day", label: t("periodDay") },
    { key: "month", label: t("periodMonth") },
    { key: "year", label: t("periodYear") },
  ];
  const [period, setPeriod] = useState<Period>("month");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    saveGoal,
    null
  );

  const today = todayKst();
  const thisMonth = today.slice(0, 7);
  const thisYear = Number(today.slice(0, 4));

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(thisMonth);
  const [selectedYear, setSelectedYear] = useState(thisYear);

  const [dayGoalInput, setDayGoalInput] = useState("");
  const [dayGoalPending, setDayGoalPending] = useState(false);
  const [dayGoalOverride, setDayGoalOverride] = useState<number | null>(null);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, DailyRecordPoint>();
    for (const r of dailyRecords) map.set(r.date, r);
    return map;
  }, [dailyRecords]);

  const sortedDailyGoals = useMemo(
    () => [...dailyGoals].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate)),
    [dailyGoals]
  );

  const resolveDailyGoalChars = (date: string) => {
    let target = 0;
    for (const g of sortedDailyGoals) {
      if (g.effectiveDate <= date) target = g.targetChars;
      else break;
    }
    return target;
  };

  const isToday = selectedDate === today;
  const isCurrentMonth = selectedMonth === thisMonth;
  const isCurrentYear = selectedYear === thisYear;

  const dayTargetChars =
    isToday && dayGoalOverride !== null ? dayGoalOverride : resolveDailyGoalChars(selectedDate);
  const dayProgress = recordsByDate.get(selectedDate) ?? { date: selectedDate, chars: 0, minutes: 0 };

  const monthProgress = isCurrentMonth
    ? progress.month
    : sumProgress(dailyRecords.filter((r) => r.date.startsWith(selectedMonth)));
  const yearProgress = isCurrentYear
    ? progress.year
    : sumProgress(dailyRecords.filter((r) => r.date.startsWith(String(selectedYear))));

  const dateLabel =
    period === "day" ? selectedDate : period === "month" ? selectedMonth : String(selectedYear);

  const goPrev = () => {
    if (period === "day") setSelectedDate((d) => kstDatePlusDays(-1, d));
    else if (period === "month") setSelectedMonth((m) => shiftYearMonth(m, -1));
    else setSelectedYear((y) => y - 1);
  };
  const goNext = () => {
    if (period === "day") setSelectedDate((d) => kstDatePlusDays(1, d));
    else if (period === "month") setSelectedMonth((m) => shiftYearMonth(m, 1));
    else setSelectedYear((y) => y + 1);
  };

  const saveDayGoal = async () => {
    const value = Math.max(0, Math.floor(Number(dayGoalInput)) || 0);
    setDayGoalPending(true);
    await setDailyCharGoal(value);
    setDayGoalPending(false);
    setDayGoalOverride(value);
    setDayGoalInput("");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-md px-2.5 py-1.5 text-[12px] font-medium transition ${
                period === p.key
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1 text-[12px] text-neutral-500 dark:text-neutral-400">
          <button
            type="button"
            onClick={goPrev}
            aria-label={t("prevDate")}
            className="rounded-md px-1.5 py-1 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            ←
          </button>
          <span className="min-w-[5.5rem] text-center font-medium text-neutral-700 dark:text-neutral-200">
            {dateLabel}
          </span>
          <button
            type="button"
            onClick={goNext}
            aria-label={t("nextDate")}
            className="rounded-md px-1.5 py-1 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            →
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {period === "day" ? (
          <GoalBar
            label={t("charsGoalLabel")}
            current={dayProgress.chars}
            target={dayTargetChars}
            unit={t("charsUnit")}
          />
        ) : (
          <>
            <GoalBar
              label={t("charsGoalLabel")}
              current={period === "month" ? monthProgress.chars : yearProgress.chars}
              target={goals[period].targetChars}
              unit={t("charsUnit")}
            />
            <GoalBar
              label={t("timeGoalLabel")}
              current={period === "month" ? monthProgress.minutes : yearProgress.minutes}
              target={goals[period].targetMinutes}
              unit={t("minutesUnit")}
            />
          </>
        )}
      </div>

      {period === "day" ? (
        isToday ? (
          <div className="flex items-end gap-2">
            <label className="flex w-24 shrink-0 flex-col gap-1 text-[12px] text-neutral-500">
              {t("charsFieldLabel")}
              <input
                type="number"
                min={0}
                value={dayGoalInput}
                onChange={(e) => setDayGoalInput(e.target.value)}
                placeholder={String(dayTargetChars || "")}
                className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
              />
            </label>
            <button
              type="button"
              onClick={saveDayGoal}
              disabled={dayGoalPending}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
            >
              {dayGoalPending ? t("saving") : t("save")}
            </button>
          </div>
        ) : (
          <p className="text-[12px] text-neutral-400">{t("notCurrentHint")}</p>
        )
      ) : (period === "month" && isCurrentMonth) || (period === "year" && isCurrentYear) ? (
        <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="period" value={period} />
          <label className="flex w-20 shrink-0 flex-col gap-1 text-[12px] text-neutral-500">
            {t("charsFieldLabel")}
            <input
              name="targetChars"
              type="number"
              min={0}
              defaultValue={goals[period].targetChars}
              key={`${period}-chars-${goals[period].targetChars}`}
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
            />
          </label>
          <label className="flex w-16 shrink-0 flex-col gap-1 text-[12px] text-neutral-500">
            {t("minutesFieldLabel")}
            <input
              name="targetMinutes"
              type="number"
              min={0}
              defaultValue={goals[period].targetMinutes}
              key={`${period}-minutes-${goals[period].targetMinutes}`}
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
          >
            {pending ? t("saving") : t("save")}
          </button>
        </form>
      ) : (
        <p className="text-[12px] text-neutral-400">{t("notCurrentHint")}</p>
      )}
      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
    </div>
  );
}
