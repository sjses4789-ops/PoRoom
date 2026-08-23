"use client";

import { useState } from "react";
import { inPeriod, type Period } from "@/lib/records";
import { RANK_STYLE } from "@/lib/rank-style";

export type RankingRecord = {
  roomId: string | null;
  userId: string;
  date: string;
  chars: number;
  minutes: number;
};

const SCOPES = [
  { key: "room" as const, label: "방 기준 전체 랭킹" },
  { key: "user" as const, label: "개인 기준 전체 랭킹" },
];

const PERIODS: { key: Period; label: string }[] = [
  { key: "day", label: "일별" },
  { key: "month", label: "월별" },
  { key: "year", label: "연별" },
];

export default function RankingTabs({
  records,
  roomNames,
  userNames,
  today,
  selfId,
}: {
  records: RankingRecord[];
  roomNames: Record<string, string>;
  userNames: Record<string, string>;
  today: string;
  selfId: string;
}) {
  const [scope, setScope] = useState<"room" | "user">("room");
  const [period, setPeriod] = useState<Period>("month");

  // 방이 삭제된(room_id가 비워진) 기록은 개인 기준 랭킹엔 그대로 반영되고
  // 방 기준 랭킹에서만 제외된다 — 더는 존재하지 않는 방이라서.
  const filtered = records.filter(
    (r) => inPeriod(r.date, period, today) && (scope !== "room" || r.roomId)
  );
  const totals = new Map<string, { chars: number; minutes: number }>();
  for (const r of filtered) {
    const key = (scope === "room" ? r.roomId : r.userId)!;
    const t = totals.get(key) ?? { chars: 0, minutes: 0 };
    t.chars += r.chars;
    t.minutes += r.minutes;
    totals.set(key, t);
  }

  const nameMap = scope === "room" ? roomNames : userNames;
  const rows = Array.from(totals.entries())
    .map(([key, t]) => ({
      key,
      name: nameMap[key] ?? "알 수 없음",
      ...t,
    }))
    .sort((a, b) => b.chars - a.chars)
    .slice(0, 100)
    .map((r, i) => ({ rank: i + 1, ...r }));

  // 상단 탭(방/개인) 선택과 무관하게, 하단 고정바는 항상 "개인 기준"
  // 전체 순위에서 나의 위치를 보여준다.
  const periodFiltered = records.filter((r) => inPeriod(r.date, period, today));
  const userTotals = new Map<string, number>();
  for (const r of periodFiltered) {
    userTotals.set(r.userId, (userTotals.get(r.userId) ?? 0) + r.chars);
  }
  const rankedUsers = Array.from(userTotals.entries()).sort((a, b) => b[1] - a[1]);
  const selfIndex = rankedUsers.findIndex(([userId]) => userId === selfId);
  const selfRank = selfIndex >= 0 ? selfIndex + 1 : null;
  const selfTotalUsers = rankedUsers.length;
  const selfPercentile =
    selfRank !== null && selfTotalUsers > 0
      ? Math.max(1, Math.round((selfRank / selfTotalUsers) * 100))
      : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 border-b border-neutral-100">
          {SCOPES.map((s) => (
            <button
              key={s.key}
              onClick={() => setScope(s.key)}
              className={`px-4 py-2 text-sm font-medium transition ${
                scope === s.key
                  ? "border-b-2 border-neutral-900 text-neutral-900 dark:text-white"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-md px-2.5 py-1.5 text-[12px] font-medium transition ${
                period === p.key
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-400 hover:bg-neutral-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-neutral-400">
          해당 기간에 집계된 기록이 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="text-xs text-neutral-400">
              <th className="w-14 py-2 font-medium">순위</th>
              <th className="py-2 font-medium">
                {scope === "room" ? "방 이름" : "이름"}
              </th>
              <th className="py-2 text-right font-medium">글자수</th>
              <th className="py-2 text-right font-medium">작업시간</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const style = RANK_STYLE[r.rank];
              return (
                <tr
                  key={r.key}
                  className={`border-t border-neutral-100 ${style?.row ?? ""}`}
                >
                  <td className="py-2.5">
                    <span className={`inline-flex items-center gap-1 ${style?.rankText ?? "text-neutral-500"}`}>
                      {style?.icon && <span aria-hidden>{style.icon}</span>}
                      {r.rank}
                    </span>
                  </td>
                  <td className={`py-2.5 font-medium ${style?.nameText ?? "text-neutral-900 dark:text-white"}`}>
                    {r.name}
                  </td>
                  <td className="py-2.5 text-right text-neutral-600">
                    {r.chars.toLocaleString()}자
                  </td>
                  <td className="py-2.5 text-right text-neutral-600">
                    {r.minutes.toLocaleString()}분
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-200 bg-white/95 px-4 py-2.5 text-center text-xs backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
        {selfRank !== null ? (
          <span className="font-medium text-neutral-700 dark:text-neutral-200">
            내 순위 (개인 기준, {PERIODS.find((p) => p.key === period)?.label}): {selfRank}위 /{" "}
            {selfTotalUsers}명
            {selfPercentile !== null && (
              <span className="text-neutral-400 dark:text-neutral-500"> (상위 {selfPercentile}%)</span>
            )}
          </span>
        ) : (
          <span className="text-neutral-400">해당 기간에 내 기록이 아직 없어요.</span>
        )}
      </div>
    </div>
  );
}
