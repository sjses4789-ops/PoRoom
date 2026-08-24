"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RANK_STYLE } from "@/lib/rank-style";
import { RankExpandToggle } from "./rank-expand-toggle";

export type TypingRankingRow = {
  rank: number;
  userId: string;
  name: string;
  cpm: number;
};

const VISIBLE_LIMIT = 10;

export function TypingRanking({ rows }: { rows: TypingRankingRow[] }) {
  const t = useTranslations("ranking.typingRanking");
  const [expanded, setExpanded] = useState(false);
  const visibleRows = expanded ? rows : rows.slice(0, VISIBLE_LIMIT);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center border-b border-neutral-100 pb-2">
        <span className="px-1 text-sm font-medium text-neutral-900 dark:text-white">
          {t("heading")}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-neutral-400">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[240px] text-left text-sm">
            <thead>
              <tr className="text-xs text-neutral-400">
                <th className="w-14 py-2 font-medium">{t("colRank")}</th>
                <th className="py-2 font-medium">{t("colName")}</th>
                <th className="py-2 text-right font-medium">{t("colCpm")}</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r) => {
                const style = RANK_STYLE[r.rank];
                return (
                  <tr
                    key={r.userId}
                    className={`border-t border-neutral-100 ${style?.row ?? ""}`}
                  >
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 ${style?.rankText ?? "text-neutral-500"}`}
                      >
                        {style?.icon && <span aria-hidden>{style.icon}</span>}
                        {r.rank}
                      </span>
                    </td>
                    <td className={`py-2.5 font-medium ${style?.nameText ?? "text-neutral-900 dark:text-white"}`}>
                      {r.name}
                    </td>
                    <td className="py-2.5 text-right text-neutral-600 dark:text-neutral-300">
                      {t("cpmSuffix", { count: r.cpm })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > VISIBLE_LIMIT && (
        <RankExpandToggle expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
      )}
    </div>
  );
}
