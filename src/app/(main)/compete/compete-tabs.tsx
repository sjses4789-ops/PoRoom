"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

export function CompeteTabs({ duel, challenge }: { duel: ReactNode; challenge: ReactNode }) {
  const t = useTranslations("compete.page");
  const [tab, setTab] = useState<"duel" | "challenge">("duel");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 border-b border-neutral-100 dark:border-neutral-800">
        {(["duel", "challenge"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === key
                ? "border-b-2 border-neutral-900 text-neutral-900 dark:border-white dark:text-white"
                : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            }`}
          >
            {t(key === "duel" ? "duelTab" : "challengeTab")}
          </button>
        ))}
      </div>
      <div className={tab === "duel" ? "" : "hidden"}>{duel}</div>
      <div className={tab === "challenge" ? "" : "hidden"}>{challenge}</div>
    </div>
  );
}
