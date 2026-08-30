"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export type DailyAmountPoint = { date: string; chars: number };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

const STEP_X = 44;
const CHART_HEIGHT = 150;
const LINE_COLOR = "#f97316";

// 웹툰 작가의 [개인] 페이지 "작업량 통계" — 웹소설처럼 작품별로 컷수를
// 나누어 기록하지 않고(방에서 컷수를 입력할 때 작품 선택 없이 바로
// daily_records에 쌓인다), 하루/월/연 단위로 합산한 컷수를 그대로
// 그래프로 보여준다.
export function WorkAmountChart({ records }: { records: DailyAmountPoint[] }) {
  const t = useTranslations("me.workAmountChart");
  const [period, setPeriod] = useState<"day" | "month" | "year">("day");

  const now = new Date();
  const [refYear, setRefYear] = useState(now.getFullYear());
  const [refMonth, setRefMonth] = useState(now.getMonth());
  const isCurrentRefMonth = refYear === now.getFullYear() && refMonth === now.getMonth();
  const isCurrentRefYear = refYear === now.getFullYear();

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
  const goPrevYear = () => setRefYear((y) => y - 1);
  const goNextYear = () => {
    if (!isCurrentRefYear) setRefYear((y) => y + 1);
  };

  const periodSelector = (
    <div className="flex items-center gap-1">
      {(
        [
          { key: "day" as const, label: t("periodDay") },
          { key: "month" as const, label: t("periodMonth") },
          { key: "year" as const, label: t("periodYear") },
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

  let buckets: { key: string; label: string }[];
  if (period === "day") {
    const daysInMonth = new Date(refYear, refMonth + 1, 0).getDate();
    buckets = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return { key: `${refYear}-${pad2(refMonth + 1)}-${pad2(day)}`, label: `${refMonth + 1}/${day}` };
    });
  } else if (period === "month") {
    buckets = Array.from({ length: 12 }, (_, m) => ({
      key: `${refYear}-${pad2(m + 1)}`,
      label: t("monthLabel", { month: m + 1 }),
    }));
  } else {
    // 최근 6년(올해 포함)을 고정 범위로 보여준다 — 매년 대상 연도가 늘어날
    // 만큼의 서비스 기간이 아직 쌓이지 않았으므로, 별도 이전/다음 탐색
    // 없이도 충분하다.
    const startYear = now.getFullYear() - 5;
    buckets = Array.from({ length: 6 }, (_, i) => {
      const year = startYear + i;
      return { key: `${year}`, label: t("yearLabel", { year }) };
    });
  }

  const dataByBucket = buckets.map((b) => {
    const value = records
      .filter((r) => (period === "day" ? r.date === b.key : r.date.startsWith(b.key)))
      .reduce((sum, r) => sum + r.chars, 0);
    return { ...b, value };
  });

  const maxVal = Math.max(1, ...dataByBucket.map((d) => d.value));
  const chartWidth = STEP_X * buckets.length;
  const yFor = (v: number) => CHART_HEIGHT - 20 - (v / maxVal) * (CHART_HEIGHT - 40);
  const xFor = (i: number) => i * STEP_X + STEP_X / 2;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</h2>
      <div className="flex flex-wrap items-center gap-2">
        {periodSelector}
        {period !== "year" && (
          <div className="ml-auto flex items-center gap-1 text-[12px] text-neutral-500 dark:text-neutral-400">
            <button
              type="button"
              onClick={period === "day" ? goPrevMonth : goPrevYear}
              aria-label={period === "day" ? t("prevMonth") : t("prevYear")}
              className="rounded-md px-1.5 py-1 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {"<"}
            </button>
            <span className="min-w-[3rem] text-center font-medium text-neutral-700 dark:text-neutral-200">
              {period === "day" ? t("monthLabel", { month: refMonth + 1 }) : t("yearLabel", { year: refYear })}
            </span>
            <button
              type="button"
              onClick={period === "day" ? goNextMonth : goNextYear}
              disabled={period === "day" ? isCurrentRefMonth : isCurrentRefYear}
              aria-label={period === "day" ? t("nextMonth") : t("nextYear")}
              className="rounded-md px-1.5 py-1 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-neutral-800"
            >
              {">"}
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto pb-1">
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
            points={dataByBucket.map((d, i) => `${xFor(i)},${yFor(d.value)}`).join(" ")}
            fill="none"
            stroke={LINE_COLOR}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {dataByBucket.map((d, i) => (
            <g key={d.key}>
              <circle cx={xFor(i)} cy={yFor(d.value)} r={2.5} fill={LINE_COLOR} />
              {d.value > 0 && (
                <text
                  x={xFor(i)}
                  y={yFor(d.value) - 6}
                  textAnchor="middle"
                  className="fill-neutral-500 dark:fill-neutral-400"
                  fontSize={9}
                >
                  {d.value.toLocaleString()}
                </text>
              )}
            </g>
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
  );
}
