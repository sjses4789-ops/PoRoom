"use client";

import { useActionState, useState } from "react";
import { saveGoal } from "@/lib/goals";
import type { ActionResult } from "@/lib/rooms";
import GoalBar from "./goal-bar";

export type PeriodGoal = { targetChars: number; targetMinutes: number };
export type PeriodProgress = { chars: number; minutes: number };

const PERIODS = [
  { key: "month" as const, label: "이번 달" },
  { key: "year" as const, label: "올해" },
];

export function GoalPanel({
  goals,
  progress,
}: {
  goals: Record<"month" | "year", PeriodGoal>;
  progress: Record<"month" | "year", PeriodProgress>;
}) {
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    saveGoal,
    null
  );

  const goal = goals[period];
  const prog = progress[period];

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 dark:bg-neutral-900">
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

      <div className="flex flex-col gap-3">
        <GoalBar
          label="글자수 목표"
          current={prog.chars}
          target={goal.targetChars}
          unit="자"
        />
        <GoalBar
          label="시간 목표"
          current={prog.minutes}
          target={goal.targetMinutes}
          unit="분"
        />
      </div>

      <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <input type="hidden" name="period" value={period} />
        <label className="flex flex-1 flex-col gap-1 text-[12px] text-neutral-500">
          목표 글자수
          <input
            name="targetChars"
            type="number"
            min={0}
            defaultValue={goal.targetChars}
            key={`${period}-chars-${goal.targetChars}`}
            className="rounded-md border border-neutral-200 px-2 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-[12px] text-neutral-500">
          목표 시간(분)
          <input
            name="targetMinutes"
            type="number"
            min={0}
            defaultValue={goal.targetMinutes}
            key={`${period}-minutes-${goal.targetMinutes}`}
            className="rounded-md border border-neutral-200 px-2 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
      </form>
      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
    </div>
  );
}
