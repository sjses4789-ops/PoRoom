"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { joinChallenge } from "@/lib/challenges";
import {
  SYSTEM_CHALLENGE_CAPACITY,
  SYSTEM_CHALLENGE_META,
  type SystemChallengeKind,
} from "@/lib/system-challenges";

export function OpenSystemChallengeCard({
  id,
  kind,
  startDate,
  endDate,
  participantCount,
}: {
  id: string;
  kind: SystemChallengeKind;
  startDate: string;
  endDate: string;
  participantCount: number;
}) {
  const t = useTranslations("compete.openSystemChallengeCard");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meta = SYSTEM_CHALLENGE_META[kind];

  return (
    <div className="flex flex-col gap-2 overflow-hidden rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="min-w-0 truncate text-sm font-medium text-neutral-900 dark:text-white">
          {meta.title}
        </span>
        <span className="shrink-0 whitespace-nowrap text-xs text-neutral-400">
          {t("participantsSuffix", {
            count: participantCount,
            capacity: SYSTEM_CHALLENGE_CAPACITY,
          })}
        </span>
      </div>
      <p className="text-[12px] text-neutral-400">
        {t("metaLine", { startDate, endDate, resetLabel: meta.resetLabel })}
        {meta.dailyTarget &&
          t("dailyTargetSuffix", { target: meta.dailyTarget.toLocaleString() })}
      </p>
      <button
        disabled={joining || joined}
        onClick={async () => {
          setJoining(true);
          setError(null);
          const result = await joinChallenge(id);
          setJoining(false);
          if ("error" in result) {
            setError(result.error);
            return;
          }
          setJoined(true);
        }}
        className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {joined ? t("joined") : joining ? t("joining") : t("join")}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
