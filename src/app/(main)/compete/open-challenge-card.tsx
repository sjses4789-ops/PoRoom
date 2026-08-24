"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { joinChallenge } from "@/lib/challenges";

export function OpenChallengeCard({
  id,
  title,
  metric,
  startDate,
  endDate,
  participantCount,
}: {
  id: string;
  title: string;
  metric: "chars" | "minutes";
  startDate: string;
  endDate: string;
  participantCount: number;
}) {
  const t = useTranslations("compete.openChallengeCard");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2 overflow-hidden rounded-lg border border-neutral-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="min-w-0 truncate text-sm font-medium text-neutral-900 dark:text-white">
          {title}
        </span>
        <span className="shrink-0 whitespace-nowrap text-xs text-neutral-400">
          {t("participantsSuffix", { count: participantCount })}
        </span>
      </div>
      <p className="text-[12px] text-neutral-400">
        {t("metaLine", {
          startDate,
          endDate,
          metric: metric === "chars" ? t("metricChars") : t("metricMinutes"),
        })}
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
        className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {joined ? t("joined") : joining ? t("joining") : t("join")}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
