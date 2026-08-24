"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createAdminChallengeEvent } from "@/lib/admin";
import type { ActionResult } from "@/lib/rooms";
import { kstDatePlusDays } from "@/lib/time";

export function AdminEventForm() {
  const t = useTranslations("admin");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createAdminChallengeEvent,
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 border border-neutral-400 p-4 dark:border-neutral-600">
      <input
        name="title"
        placeholder={t("eventNamePlaceholder")}
        className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
      />
      <div className="flex gap-3">
        <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
          <input type="radio" name="metric" value="chars" defaultChecked className="accent-neutral-900" />
          {t("metricChars")}
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
          <input type="radio" name="metric" value="minutes" className="accent-neutral-900" />
          {t("metricMinutes")}
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
          <input type="radio" name="metric" value="achievement" className="accent-neutral-900" />
          {t("metricAchievement")}
        </label>
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
      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {pending ? t("creating") : t("createEvent")}
      </button>
    </form>
  );
}
