"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export type PomodoroSessionRow = { date: string };
export type PomodoroMinuteRow = { date: string; focusMinutes: number; breakMinutes: number };
export type SiteTimeRow = { date: string; seconds: number };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatMinutes(totalMinutes: number, unitHour: string, unitMinute: string) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours <= 0) return `${minutes}${unitMinute}`;
  return `${hours}${unitHour} ${minutes}${unitMinute}`;
}

const STEP_X = 44;
const CHART_HEIGHT = 120;
const FOCUS_COLOR = "#c17b7b";
const BREAK_COLOR = "#7b93c1";

export function PomodoroStatsPanel({
  sessions,
  minutes,
  siteTime,
}: {
  sessions: PomodoroSessionRow[];
  minutes: PomodoroMinuteRow[];
  siteTime: SiteTimeRow[];
}) {
  const t = useTranslations("me.pomodoroStats");
  const [period, setPeriod] = useState<"day" | "month">("day");
  const [hoverCount, setHoverCount] = useState<number | null>(null);
  const [hoverMinutes, setHoverMinutes] = useState<number | null>(null);

  const now = new Date();
  const [refYear, setRefYear] = useState(now.getFullYear());
  const [refMonth, setRefMonth] = useState(now.getMonth());
  const isCurrentRefMonth = refYear === now.getFullYear() && refMonth === now.getMonth();

  const goPrevMonth = () => {
    if (refMonth === 0) {
      setRefYear((y) => y - 1);
      setRefMonth(11);
    } else {
      setRefMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (isCurrentRefMonth) return;
    if (refMonth === 11) {
      setRefYear((y) => y + 1);
      setRefMonth(0);
    } else {
      setRefMonth((m) => m + 1);
    }
  };

  const buckets: { key: string; label: string }[] = [];
  if (period === "day") {
    // 선택한 달의 날짜 전부를 보여준다(이전엔 항상 "오늘까지 최근
    // 14일"만 보여줘서 다른 달을 돌아볼 방법이 없었음).
    const daysInMonth = new Date(refYear, refMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      buckets.push({
        key: `${refYear}-${pad2(refMonth + 1)}-${pad2(day)}`,
        label: `${refMonth + 1}/${day}`,
      });
    }
  } else {
    // 선택한 달을 기준으로 끝나는 최근 12개월.
    for (let i = 11; i >= 0; i--) {
      const d = new Date(refYear, refMonth - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`,
        label: t("monthLabel", { month: d.getMonth() + 1 }),
      });
    }
  }

  const inBucket = (date: string, key: string) =>
    period === "day" ? date === key : date.startsWith(key);

  const dataByBucket = buckets.map((b) => {
    const count = sessions.filter((s) => inBucket(s.date, b.key)).length;
    const focusMinutes = minutes
      .filter((m) => inBucket(m.date, b.key))
      .reduce((sum, m) => sum + m.focusMinutes, 0);
    const breakMinutes = minutes
      .filter((m) => inBucket(m.date, b.key))
      .reduce((sum, m) => sum + m.breakMinutes, 0);
    return { ...b, count, focusMinutes, breakMinutes };
  });

  const periodTotalFocus = dataByBucket.reduce((sum, d) => sum + d.focusMinutes, 0);
  const periodTotalBreak = dataByBucket.reduce((sum, d) => sum + d.breakMinutes, 0);
  const periodTotalSiteSeconds = buckets.reduce(
    (sum, b) =>
      sum + siteTime.filter((s) => inBucket(s.date, b.key)).reduce((s, r) => s + r.seconds, 0),
    0
  );
  // 체류시간 추적은 이 기능을 배포한 시점부터만 쌓이는데, 집중시간
  // (daily_records.focus_minutes)은 그보다 훨씬 이전 기록도 남아있다.
  // 그래서 기간 전체 집중시간을 그대로 분자로 쓰면 "체류 기록이 없는
  // 과거 날짜의 집중시간"까지 섞여 비율이 비정상적으로 높게(심하면
  // 100%로 고정) 나온다 — 체류시간이 실제로 기록된 날짜의 집중시간만
  // 분자로 써서 같은 날짜끼리 공정하게 비교한다.
  const trackedDates = new Set(
    buckets.flatMap((b) => siteTime.filter((s) => inBucket(s.date, b.key)).map((s) => s.date))
  );
  const comparableFocusMinutes = minutes
    .filter((m) => trackedDates.has(m.date))
    .reduce((sum, m) => sum + m.focusMinutes, 0);
  const focusVsSiteRatio =
    periodTotalSiteSeconds > 0
      ? Math.min(100, Math.round(((comparableFocusMinutes * 60) / periodTotalSiteSeconds) * 100))
      : null;

  const maxCount = Math.max(1, ...dataByBucket.map((d) => d.count));
  const maxMinutes = Math.max(1, ...dataByBucket.flatMap((d) => [d.focusMinutes, d.breakMinutes]));
  const chartWidth = STEP_X * buckets.length;
  const xFor = (i: number) => i * STEP_X + STEP_X / 2;
  const countBarHeight = (v: number) => (v / maxCount) * (CHART_HEIGHT - 20);
  const minuteYFor = (v: number) => CHART_HEIGHT - (v / maxMinutes) * (CHART_HEIGHT - 8) - 4;

  const periodSelector = (
    <div className="flex items-center gap-1">
      {(
        [
          { key: "day" as const, label: t("byDay") },
          { key: "month" as const, label: t("byMonth") },
        ]
      ).map((p) => (
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
  );

  const monthNav = (
    <div className="flex items-center gap-1 text-[12px] text-neutral-500 dark:text-neutral-400">
      <button
        type="button"
        onClick={goPrevMonth}
        aria-label={t("prevMonth")}
        className="rounded-md px-1.5 py-1 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        {"<"}
      </button>
      <span className="min-w-[3.5rem] text-center font-medium text-neutral-700 dark:text-neutral-200">
        {t("monthLabel", { month: refMonth + 1 })}
      </span>
      <button
        type="button"
        onClick={goNextMonth}
        disabled={isCurrentRefMonth}
        aria-label={t("nextMonth")}
        className="rounded-md px-1.5 py-1 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-neutral-800"
      >
        {">"}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</h2>
        {monthNav}
        {periodSelector}
      </div>

      <div className="grid grid-cols-1 divide-y divide-neutral-400 overflow-hidden rounded-md border border-neutral-400 dark:divide-neutral-600 dark:border-neutral-600 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <div className="p-4">
          <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">{t("sessionCount")}</p>
          <div className="relative overflow-x-auto pb-1">
            {hoverCount !== null && dataByBucket[hoverCount] && (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] whitespace-nowrap text-neutral-700 shadow-md dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                style={{ left: xFor(hoverCount), top: CHART_HEIGHT - 16 - countBarHeight(dataByBucket[hoverCount].count) - 4 }}
              >
                {dataByBucket[hoverCount].label} · {t("sessionCountTooltip", { count: dataByBucket[hoverCount].count })}
              </div>
            )}
            <svg
              viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
              width={chartWidth}
              height={CHART_HEIGHT}
              className="block"
            >
              {dataByBucket.map((d, i) => (
                <rect
                  key={d.key}
                  x={xFor(i) - 10}
                  y={CHART_HEIGHT - 16 - countBarHeight(d.count)}
                  width={20}
                  height={countBarHeight(d.count)}
                  rx={3}
                  fill="#c17b7b"
                />
              ))}
              <line
                x1={0}
                y1={CHART_HEIGHT - 16}
                x2={chartWidth}
                y2={CHART_HEIGHT - 16}
                stroke="currentColor"
                strokeWidth={1}
                className="text-neutral-200 dark:text-neutral-700"
              />
              {dataByBucket.map((d, i) => (
                <rect
                  key={`hover-${d.key}`}
                  x={i * STEP_X}
                  y={0}
                  width={STEP_X}
                  height={CHART_HEIGHT}
                  fill="transparent"
                  onMouseEnter={() => setHoverCount(i)}
                  onMouseLeave={() => setHoverCount((v) => (v === i ? null : v))}
                />
              ))}
            </svg>
            <div className="flex" style={{ width: chartWidth }}>
              {buckets.map((b) => (
                <span
                  key={b.key}
                  className="shrink-0 text-center text-[10px] text-neutral-400"
                  style={{ width: STEP_X }}
                >
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-2 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FOCUS_COLOR }} />
              {t("focusMinutes")}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BREAK_COLOR }} />
              {t("breakMinutes")}
            </span>
          </div>
          <div className="relative overflow-x-auto pb-1">
            {hoverMinutes !== null && dataByBucket[hoverMinutes] && (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] whitespace-nowrap text-neutral-700 shadow-md dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                style={{
                  left: xFor(hoverMinutes),
                  top: Math.min(minuteYFor(dataByBucket[hoverMinutes].focusMinutes), minuteYFor(dataByBucket[hoverMinutes].breakMinutes)) - 4,
                }}
              >
                <p className="font-medium">{dataByBucket[hoverMinutes].label}</p>
                <p>{t("focusMinutes")} {formatMinutes(dataByBucket[hoverMinutes].focusMinutes, t("hourUnit"), t("minuteUnit"))}</p>
                <p>{t("breakMinutes")} {formatMinutes(dataByBucket[hoverMinutes].breakMinutes, t("hourUnit"), t("minuteUnit"))}</p>
              </div>
            )}
            <svg
              viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
              width={chartWidth}
              height={CHART_HEIGHT}
              className="block"
            >
              <line
                x1={0}
                y1={CHART_HEIGHT - 4}
                x2={chartWidth}
                y2={CHART_HEIGHT - 4}
                stroke="currentColor"
                strokeWidth={1}
                className="text-neutral-200 dark:text-neutral-700"
              />
              <polyline
                points={dataByBucket.map((d, i) => `${xFor(i)},${minuteYFor(d.focusMinutes)}`).join(" ")}
                fill="none"
                stroke={FOCUS_COLOR}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <polyline
                points={dataByBucket.map((d, i) => `${xFor(i)},${minuteYFor(d.breakMinutes)}`).join(" ")}
                fill="none"
                stroke={BREAK_COLOR}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {dataByBucket.map((d, i) => (
                <rect
                  key={`hover-${d.key}`}
                  x={i * STEP_X}
                  y={0}
                  width={STEP_X}
                  height={CHART_HEIGHT}
                  fill="transparent"
                  onMouseEnter={() => setHoverMinutes(i)}
                  onMouseLeave={() => setHoverMinutes((v) => (v === i ? null : v))}
                />
              ))}
            </svg>
            <div className="flex" style={{ width: chartWidth }}>
              {buckets.map((b) => (
                <span
                  key={b.key}
                  className="shrink-0 text-center text-[10px] text-neutral-400"
                  style={{ width: STEP_X }}
                >
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-neutral-400 overflow-hidden rounded-md border border-neutral-400 dark:divide-neutral-600 dark:border-neutral-600 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-4 text-center">
          <p className="text-[12px] text-neutral-500 dark:text-neutral-400">{t("totalFocus")}</p>
          <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
            {formatMinutes(periodTotalFocus, t("hourUnit"), t("minuteUnit"))}
          </p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[12px] text-neutral-500 dark:text-neutral-400">{t("totalBreak")}</p>
          <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
            {formatMinutes(periodTotalBreak, t("hourUnit"), t("minuteUnit"))}
          </p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[12px] text-neutral-500 dark:text-neutral-400">{t("focusVsSiteTime")}</p>
          <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
            {focusVsSiteRatio === null ? t("noSiteTimeData") : `${focusVsSiteRatio}%`}
          </p>
        </div>
      </div>
    </div>
  );
}
