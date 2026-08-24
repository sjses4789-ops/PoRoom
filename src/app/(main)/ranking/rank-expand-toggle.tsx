"use client";

import { useTranslations } from "next-intl";

export function RankExpandToggle({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("ranking.page");
  return (
    <button
      onClick={onToggle}
      className="self-start text-xs font-medium text-neutral-500 underline decoration-dotted transition hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
    >
      {expanded ? t("collapse") : t("expand")}
    </button>
  );
}
