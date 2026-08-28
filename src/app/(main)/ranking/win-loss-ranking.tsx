"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { RANK_STYLE } from "@/lib/rank-style";
import { RankExpandToggle } from "./rank-expand-toggle";
import { PositionToggle } from "./position-toggle";

export type WinLossRow = {
  rank: number;
  userId: string;
  name: string;
  wins: number;
  losses: number;
  draws: number;
};

const VISIBLE_LIMIT = 10;

export function WinLossRanking({
  rows: allRows,
  userPositions,
  defaultPosition,
}: {
  rows: WinLossRow[];
  userPositions: Record<string, "novelist" | "webtoon">;
  defaultPosition: "novelist" | "webtoon";
}) {
  const t = useTranslations("ranking.winLossRanking");
  const [expanded, setExpanded] = useState(false);
  const [position, setPosition] = useState(defaultPosition);
  // 선택한 직업의 사용자만 남기고, 순위를 다시 1부터 매긴다.
  const rows = useMemo(
    () =>
      allRows
        .filter((r) => (userPositions[r.userId] ?? "novelist") === position)
        .map((r, i) => ({ ...r, rank: i + 1 })),
    [allRows, userPositions, position]
  );
  const visibleRows = expanded ? rows : rows.slice(0, VISIBLE_LIMIT);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
        <span className="px-1 text-sm font-medium text-neutral-900 dark:text-white">
          {t("heading")}
        </span>
        <PositionToggle value={position} onChange={setPosition} />
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-neutral-400">
          {t("empty")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="text-xs text-neutral-400">
                <th className="w-14 py-2 font-medium">{t("colRank")}</th>
                <th className="py-2 font-medium">{t("colName")}</th>
                <th className="py-2 text-right font-medium">{t("colWins")}</th>
                <th className="py-2 text-right font-medium">{t("colLosses")}</th>
                <th className="py-2 text-right font-medium">{t("colDraws")}</th>
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
                    <td className="py-2.5 text-right text-emerald-600">{r.wins}</td>
                    <td className="py-2.5 text-right text-red-500">{r.losses}</td>
                    <td className="py-2.5 text-right text-neutral-400">{r.draws}</td>
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
