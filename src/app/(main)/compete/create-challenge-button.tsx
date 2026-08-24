"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { createChallenge } from "@/lib/challenges";
import type { ActionResult } from "@/lib/rooms";
import { kstDatePlusDays } from "@/lib/time";

export default function CreateChallengeButton() {
  const t = useTranslations("compete.createChallengeButton");
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createChallenge,
    null
  );

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700"
      >
        {t("trigger")}
      </button>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 bg-neutral-900/20"
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-20 flex max-h-[85vh] w-[min(20rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 overflow-y-auto rounded-md border border-neutral-300 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <form action={formAction} className="flex flex-col gap-3">
            <input
              name="title"
              placeholder={t("namePlaceholder")}
              className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
            />

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                {t("metricLabel")}
              </span>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="radio"
                    name="metric"
                    value="chars"
                    defaultChecked
                    className="accent-neutral-900"
                  />
                  {t("metricChars")}
                </label>
                <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="radio"
                    name="metric"
                    value="minutes"
                    className="accent-neutral-900"
                  />
                  {t("metricMinutes")}
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                {t("visibilityLabel")}
              </span>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="radio"
                    name="visibility"
                    value="open"
                    defaultChecked
                    className="accent-neutral-900"
                  />
                  {t("visibilityOpen")}
                </label>
                <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    className="accent-neutral-900"
                  />
                  {t("visibilityPrivate")}
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                name="startDate"
                type="date"
                defaultValue={kstDatePlusDays(0)}
                className="w-1/2 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700 outline-none focus:border-neutral-400"
              />
              <input
                name="endDate"
                type="date"
                defaultValue={kstDatePlusDays(7)}
                className="w-1/2 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700 outline-none focus:border-neutral-400"
              />
            </div>

            <p className="text-[12px] text-neutral-400">
              {t("hint")}
            </p>

            {state?.error && (
              <p className="text-xs text-red-500">{state.error}</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
            >
              {pending ? t("creating") : t("create")}
            </button>
          </form>
          </div>
        </>
      )}
    </>
  );
}
