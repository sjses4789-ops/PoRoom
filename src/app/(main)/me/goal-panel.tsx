"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { saveGoal } from "@/lib/goals";
import type { ActionResult } from "@/lib/rooms";
import GoalBar from "./goal-bar";

export type PeriodGoal = { targetChars: number; targetMinutes: number };
export type PeriodProgress = { chars: number; minutes: number };

export function GoalPanel({
  goals,
  progress,
}: {
  goals: Record<"month" | "year", PeriodGoal>;
  progress: Record<"month" | "year", PeriodProgress>;
}) {
  const t = useTranslations("me.goalPanel");
  const PERIODS = [
    { key: "month" as const, label: t("periodMonth") },
    { key: "year" as const, label: t("periodYear") },
  ];
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    saveGoal,
    null
  );

  const goal = goals[period];
  const prog = progress[period];

  return (
    <div className="flex flex-col gap-4 border border-neutral-400 p-4 dark:border-neutral-600">
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
          label={t("charsGoalLabel")}
          current={prog.chars}
          target={goal.targetChars}
          unit={t("charsUnit")}
        />
        <GoalBar
          label={t("timeGoalLabel")}
          current={prog.minutes}
          target={goal.targetMinutes}
          unit={t("minutesUnit")}
        />
      </div>

      <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <input type="hidden" name="period" value={period} />
        <label className="flex w-20 shrink-0 flex-col gap-1 text-[12px] text-neutral-500">
          {t("charsFieldLabel")}
          <input
            name="targetChars"
            type="number"
            min={0}
            defaultValue={goal.targetChars}
            key={`${period}-chars-${goal.targetChars}`}
            className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
          />
        </label>
        <label className="flex w-16 shrink-0 flex-col gap-1 text-[12px] text-neutral-500">
          {t("minutesFieldLabel")}
          <input
            name="targetMinutes"
            type="number"
            min={0}
            defaultValue={goal.targetMinutes}
            key={`${period}-minutes-${goal.targetMinutes}`}
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
      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
    </div>
  );
}
