"use client";

import { useState } from "react";
import { WORK_LINE_COLORS as LINE_COLORS } from "@/lib/work-colors";

export type WorkMeta = { id: string; title: string };
export type WorkRecordPoint = { workId: string; date: string; chars: number };
export type WorkEntryPoint = { workId: string; delta: number; createdAt: string };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatEntryDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const STEP_X = 44;
const CHART_HEIGHT = 140;

export function WorkChart({
  works,
  records,
  entries,
}: {
  works: WorkMeta[];
  records: WorkRecordPoint[];
  entries: WorkEntryPoint[];
}) {
  const [period, setPeriod] = useState<"entry" | "day" | "month">("day");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const header = (
    <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">작품별 글자수</h2>
  );

  if (works.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {header}
        <p className="text-xs text-neutral-400">
          등록된 작품이 없습니다. 오른쪽 작품 목록에서 추가해보세요.
        </p>
      </div>
    );
  }

  const periodSelector = (
    <div className="flex items-center gap-1">
      {(
        [
          { key: "entry" as const, label: "입력 기준" },
          { key: "day" as const, label: "일자별" },
          { key: "month" as const, label: "월별" },
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

  const workLegend = (
    <div className="flex flex-wrap gap-1.5">
      {works.map((w, i) => (
        <button
          key={w.id}
          type="button"
          onClick={() => setSelectedId((v) => (v === w.id ? null : w.id))}
          className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] transition ${
            selectedId === w.id
              ? "border-neutral-900 dark:border-white"
              : "border-transparent text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
          }`}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }}
          />
          {w.title}
        </button>
      ))}
    </div>
  );

  if (period === "entry") {
    const activeWorkIndex = Math.max(0, works.findIndex((w) => w.id === (selectedId ?? works[0]?.id)));
    const activeWork = works[activeWorkIndex] ?? works[0];
    const activeColor = LINE_COLORS[activeWorkIndex % LINE_COLORS.length];
    const workEntries = entries
      .filter((e) => e.workId === activeWork?.id)
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    const maxAbs = Math.max(1, ...workEntries.map((e) => Math.abs(e.delta)));
    const chartWidth = Math.max(STEP_X, STEP_X * workEntries.length);
    const zeroY = CHART_HEIGHT / 2;
    const halfHeight = CHART_HEIGHT / 2 - 8;
    const xFor = (i: number) => i * STEP_X + STEP_X / 2;
    const yFor = (delta: number) => zeroY - (delta / maxAbs) * halfHeight;

    return (
      <div className="flex flex-col gap-3">
        {header}
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
            {activeWork?.title}의 입력별 변동
          </span>
          {periodSelector}
        </div>

        {workEntries.length === 0 ? (
          <p className="text-xs text-neutral-400">아직 입력 기록이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto pb-1">
            <svg
              viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
              width={chartWidth}
              height={CHART_HEIGHT}
              className="block"
            >
              <line
                x1={0}
                y1={zeroY}
                x2={chartWidth}
                y2={zeroY}
                stroke="currentColor"
                strokeWidth={1}
                className="text-neutral-200 dark:text-neutral-700"
              />
              <polyline
                points={workEntries.map((e, i) => `${xFor(i)},${yFor(e.delta)}`).join(" ")}
                fill="none"
                stroke={activeColor}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {workEntries.map((e, i) => (
                <circle
                  key={i}
                  cx={xFor(i)}
                  cy={yFor(e.delta)}
                  r={3}
                  fill={e.delta >= 0 ? activeColor : "#ef4444"}
                />
              ))}
            </svg>
            <div className="flex" style={{ width: chartWidth }}>
              {workEntries.map((e, i) => (
                <span
                  key={i}
                  className="shrink-0 text-center text-[10px] text-neutral-400"
                  style={{ width: STEP_X }}
                >
                  {formatEntryDate(e.createdAt)}
                </span>
              ))}
            </div>
          </div>
        )}

        {workLegend}
      </div>
    );
  }

  const now = new Date();
  const buckets: { key: string; label: string }[] = [];
  if (period === "day") {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      buckets.push({
        key: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
      });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`,
        label: `${d.getMonth() + 1}월`,
      });
    }
  }

  const dataByBucket = buckets.map((b) => {
    const perWork = works.map((w) =>
      records
        .filter(
          (r) =>
            r.workId === w.id &&
            (period === "day" ? r.date === b.key : r.date.startsWith(b.key))
        )
        .reduce((sum, r) => sum + r.chars, 0)
    );
    return { ...b, perWork };
  });

  const maxVal = Math.max(1, ...dataByBucket.flatMap((d) => d.perWork));
  const chartWidth = STEP_X * buckets.length;
  const yFor = (v: number) => CHART_HEIGHT - (v / maxVal) * (CHART_HEIGHT - 8) - 4;
  const xFor = (i: number) => i * STEP_X + STEP_X / 2;

  return (
    <div className="flex flex-col gap-3">
      {header}
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-neutral-500 dark:text-neutral-400">기준</span>
        {periodSelector}
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
          {works.map((w, wi) => (
            <polyline
              key={w.id}
              points={dataByBucket.map((d, bi) => `${xFor(bi)},${yFor(d.perWork[wi])}`).join(" ")}
              fill="none"
              stroke={LINE_COLORS[wi % LINE_COLORS.length]}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {works.map((w, wi) =>
            dataByBucket.map((d, bi) => (
              <circle
                key={`${w.id}-${bi}`}
                cx={xFor(bi)}
                cy={yFor(d.perWork[wi])}
                r={2.5}
                fill={LINE_COLORS[wi % LINE_COLORS.length]}
              />
            ))
          )}
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

      {workLegend}
    </div>
  );
}
