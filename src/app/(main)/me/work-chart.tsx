"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { WORK_LINE_COLORS as LINE_COLORS } from "@/lib/work-colors";
import { setWorkRecordChars } from "@/lib/works";

export type WorkMeta = { id: string; title: string };
export type WorkRecordPoint = { workId: string; date: string; chars: number };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

const STEP_X = 44;
const CHART_HEIGHT = 150;

export function WorkChart({
  works,
  records,
  onRecordsChange,
}: {
  works: WorkMeta[];
  records: WorkRecordPoint[];
  onRecordsChange: (updater: (prev: WorkRecordPoint[]) => WorkRecordPoint[]) => void;
}) {
  const t = useTranslations("me.workChart");
  const [period, setPeriod] = useState<"day" | "month">("day");
  const [editing, setEditing] = useState(false);
  // null = 전체보기(모든 작품 합계) — 작품 목록 패널을 없애면서, 특정
  // 작품만 보고 싶을 땐 이 드롭다운으로 고른다.
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  if (works.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</h2>
        <p className="text-xs text-neutral-400">
          {t("noWorks")}
        </p>
      </div>
    );
  }

  const activeIndex = selectedId ? works.findIndex((w) => w.id === selectedId) : -1;
  const activeWork = activeIndex >= 0 ? works[activeIndex] : null;
  const activeColor = activeWork ? LINE_COLORS[activeIndex % LINE_COLORS.length] : "currentColor";

  const workSelect = (
    <select
      value={selectedId ?? ""}
      onChange={(e) => {
        setSelectedId(e.target.value || null);
        setEditing(false);
      }}
      className="min-w-0 rounded-md border border-neutral-200 bg-white px-2 py-1 text-[12px] text-neutral-700 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
    >
      <option value="">{t("allWorks")}</option>
      {works.map((w) => (
        <option key={w.id} value={w.id}>
          {w.title}
        </option>
      ))}
    </select>
  );

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</h2>
        {workSelect}
      </div>
      {activeWork && (
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          title={editing ? t("backToChart") : t("editTitle")}
          className="shrink-0 rounded-md px-1.5 py-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          {editing ? "📈" : "✎"}
        </button>
      )}
    </div>
  );

  if (editing && activeWork) {
    return (
      <div className="flex flex-col gap-3">
        {header}
        <WorkRecordsEditTable
          workId={activeWork.id}
          records={records}
          onRecordsChange={onRecordsChange}
        />
      </div>
    );
  }

  const periodSelector = (
    <div className="flex items-center gap-1">
      {(
        [
          { key: "day" as const, label: t("periodDay") },
          { key: "month" as const, label: t("periodMonth") },
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

  // 선택한 달(일별) 또는 선택한 연도(월별) 전체를 보여준다.
  const buckets: { key: string; label: string }[] = [];
  if (period === "day") {
    const daysInMonth = new Date(refYear, refMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      buckets.push({
        key: `${refYear}-${pad2(refMonth + 1)}-${pad2(day)}`,
        label: `${refMonth + 1}/${day}`,
      });
    }
  } else {
    for (let m = 0; m < 12; m++) {
      buckets.push({
        key: `${refYear}-${pad2(m + 1)}`,
        label: t("monthLabel", { month: m + 1 }),
      });
    }
  }

  const dataByBucket = buckets.map((b) => {
    const value = records
      .filter(
        (r) =>
          (selectedId ? r.workId === selectedId : true) &&
          (period === "day" ? r.date === b.key : r.date.startsWith(b.key))
      )
      .reduce((sum, r) => sum + r.chars, 0);
    return { ...b, value };
  });

  const maxVal = Math.max(1, ...dataByBucket.map((d) => d.value));
  const chartWidth = STEP_X * buckets.length;
  const yFor = (v: number) => CHART_HEIGHT - 20 - (v / maxVal) * (CHART_HEIGHT - 40);
  const xFor = (i: number) => i * STEP_X + STEP_X / 2;

  return (
    <div className="flex flex-col gap-3">
      {header}
      <div className="flex flex-wrap items-center gap-2">
        {periodSelector}
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
            stroke={activeColor}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {dataByBucket.map((d, i) => (
            <g key={d.key}>
              <circle cx={xFor(i)} cy={yFor(d.value)} r={2.5} fill={activeColor} />
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

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function WorkRecordsEditTable({
  workId,
  records,
  onRecordsChange,
}: {
  workId: string;
  records: WorkRecordPoint[];
  onRecordsChange: (updater: (prev: WorkRecordPoint[]) => WorkRecordPoint[]) => void;
}) {
  const t = useTranslations("me.workChart");
  const [busyDate, setBusyDate] = useState<string | null>(null);
  const [newDate, setNewDate] = useState(todayIso());
  const [newChars, setNewChars] = useState("");

  const rows = records
    .filter((r) => r.workId === workId)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  const save = async (date: string, chars: number) => {
    setBusyDate(date);
    const result = await setWorkRecordChars(workId, date, chars);
    setBusyDate(null);
    if (result && "error" in result) return;

    onRecordsChange((prev) => {
      const rest = prev.filter((r) => !(r.workId === workId && r.date === date));
      if (chars <= 0) return rest;
      return [...rest, { workId, date, chars }];
    });
  };

  const addNew = async () => {
    const chars = Math.max(0, Math.floor(Number(newChars)) || 0);
    if (!newDate || chars <= 0) return;
    await save(newDate, chars);
    setNewChars("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 dark:text-white"
        />
        <input
          type="number"
          min={0}
          value={newChars}
          onChange={(e) => setNewChars(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addNew()}
          placeholder={t("charsPlaceholder")}
          className="w-20 min-w-0 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 dark:text-white"
        />
        <button
          type="button"
          onClick={addNew}
          disabled={busyDate === newDate}
          className="shrink-0 rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {t("add")}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-neutral-400">{t("noEntries")}</p>
      ) : (
        <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
          {rows.map((r) => (
            <li key={r.date} className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
                {r.date}
              </span>
              <input
                type="number"
                min={0}
                defaultValue={r.chars}
                key={`${r.date}-${r.chars}`}
                onBlur={(e) => {
                  const value = Math.max(0, Math.floor(Number(e.target.value)) || 0);
                  if (value !== r.chars) save(r.date, value);
                }}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                disabled={busyDate === r.date}
                className="min-w-0 flex-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 disabled:opacity-50 dark:text-white"
              />
              <button
                type="button"
                onClick={() => save(r.date, 0)}
                disabled={busyDate === r.date}
                title={t("deleteEntryTitle")}
                className="shrink-0 text-neutral-300 transition hover:text-red-500 disabled:opacity-50 dark:text-neutral-600"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
