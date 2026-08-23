"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { DailyRecord } from "@/lib/records";
import { rowColorByIndex } from "@/lib/palette";
import { characterSrc } from "@/lib/characters";
import type { Member } from "./room-view";

type Mode = "month" | "year";

// left-to-right podium spread: 10th, 8th, 6th, 4th, 2nd, 1st, 3rd, 5th,
// 7th, 9th place (1st dead center, alternating outward by rank).
const PODIUM_ORDER = [9, 7, 5, 3, 1, 0, 2, 4, 6, 8];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function RoomRecordsPanel({
  members,
  dailyRecords,
}: {
  members: Member[];
  dailyRecords: DailyRecord[];
}) {
  const now = new Date();
  const [mode, setMode] = useState<Mode>("month");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const goPrev = () => {
    if (mode === "year") {
      setYear((y) => y - 1);
      return;
    }
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (mode === "year") {
      setYear((y) => y + 1);
      return;
    }
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const recordsByUser = useMemo(() => {
    const map = new Map<string, DailyRecord[]>();
    for (const r of dailyRecords) {
      const list = map.get(r.userId) ?? [];
      list.push(r);
      map.set(r.userId, list);
    }
    return map;
  }, [dailyRecords]);

  const lookup = (userId: string, dateKey: string) =>
    (recordsByUser.get(userId) ?? []).find((r) => r.date === dateKey);

  const columns =
    mode === "month"
      ? Array.from(
          { length: new Date(year, month + 1, 0).getDate() },
          (_, i) => i + 1
        )
      : Array.from({ length: 12 }, (_, i) => i + 1);

  const cellFor = (userId: string, col: number) => {
    if (mode === "month") {
      const dateKey = `${year}-${pad2(month + 1)}-${pad2(col)}`;
      const r = lookup(userId, dateKey);
      return { chars: r?.chars ?? 0, minutes: r?.focusMinutes ?? 0 };
    }
    const monthPrefix = `${year}-${pad2(col)}`;
    const rows = (recordsByUser.get(userId) ?? []).filter((r) =>
      r.date.startsWith(monthPrefix)
    );
    return {
      chars: rows.reduce((s, r) => s + r.chars, 0),
      minutes: rows.reduce((s, r) => s + r.focusMinutes, 0),
    };
  };

  const totalFor = (userId: string) => {
    const rows = (recordsByUser.get(userId) ?? []).filter((r) =>
      mode === "month" ? r.date.startsWith(`${year}-${pad2(month + 1)}`) : r.date.startsWith(`${year}-`)
    );
    return {
      chars: rows.reduce((s, r) => s + r.chars, 0),
      minutes: rows.reduce((s, r) => s + r.focusMinutes, 0),
    };
  };

  const top10 = members
    .filter((m) => m.recordsVisible)
    .map((m) => ({ member: m, chars: totalFor(m.id).chars }))
    .filter((r) => r.chars > 0)
    .sort((a, b) => b.chars - a.chars)
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">방 기록</h2>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {(
              [
                { key: "month" as const, label: "월별" },
                { key: "year" as const, label: "연별" },
              ]
            ).map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`rounded-md px-2.5 py-1.5 text-[12px] font-medium transition ${
                  mode === m.key
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-300">
            <button onClick={goPrev} className="rounded-md px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              ←
            </button>
            <span className="min-w-[80px] text-center font-medium text-neutral-900 dark:text-white">
              {mode === "month" ? `${year}년 ${month + 1}월` : `${year}년`}
            </span>
            <button onClick={goNext} className="rounded-md px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              →
            </button>
          </div>
        </div>
      </div>

      {top10.length > 0 && (
        <div className="flex flex-wrap items-end justify-center gap-2 py-2 sm:gap-3">
          {PODIUM_ORDER.filter((idx) => idx < top10.length).map((idx) => {
            const rank = idx + 1;
            const { member, chars } = top10[idx];
            const isFirst = rank === 1;
            const src = characterSrc(member.characterId);
            const size = isFirst ? 72 : 52;
            return (
              <div key={member.id} className="flex flex-col items-center gap-1">
                <div className="relative">
                  {isFirst && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xl" aria-hidden>
                      👑
                    </span>
                  )}
                  <div
                    className="overflow-hidden rounded-full border-2 border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
                    style={{ width: size, height: size }}
                  >
                    {src ? (
                      <Image src={src} alt="" width={size} height={size} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-300">🙂</div>
                    )}
                  </div>
                  <span
                    className={`absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                      rank === 1 ? "bg-amber-500" : rank === 2 ? "bg-neutral-400" : rank === 3 ? "bg-orange-500" : "bg-neutral-300"
                    }`}
                  >
                    {rank}
                  </span>
                </div>
                <span
                  className={`max-w-[80px] truncate font-medium text-neutral-900 dark:text-white ${
                    isFirst ? "text-sm" : "text-xs"
                  }`}
                >
                  {member.name}
                </span>
                <span className="text-[11px] text-neutral-400">{chars.toLocaleString()}자</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-separate border-spacing-0 text-left text-xs">
          <thead>
            <tr className="text-neutral-400">
              <th className="sticky left-0 z-10 bg-white px-2 py-2 font-medium dark:bg-neutral-900">
                참여자
              </th>
              {columns.map((c) => (
                <th key={c} className="min-w-[64px] px-1 py-2 text-center font-medium">
                  {mode === "month" ? `${c}일` : `${c}월`}
                </th>
              ))}
              <th className="min-w-[80px] px-2 py-2 text-center font-medium">합계</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, i) => {
              const rowBg = rowColorByIndex(i);
              const total = totalFor(member.id);
              return (
                <tr key={member.id} className="border-b border-neutral-100">
                  <td
                    className={`sticky left-0 z-10 whitespace-nowrap border-r border-neutral-100 px-2 py-2 font-medium text-neutral-900 dark:border-neutral-700 ${rowBg}`}
                  >
                    {member.name}
                  </td>
                  {!member.recordsVisible ? (
                    <td colSpan={columns.length} className="px-2 py-2 text-center text-neutral-300 dark:text-neutral-600">
                      기록 비공개
                    </td>
                  ) : (
                    columns.map((c) => {
                      const cell = cellFor(member.id, c);
                      const hasData = cell.chars > 0 || cell.minutes > 0;
                      return (
                        <td
                          key={c}
                          className={`px-1 py-2 text-center ${hasData ? rowBg : ""}`}
                        >
                          {hasData ? (
                            <div className="flex flex-col leading-tight">
                              <span className="text-neutral-800">
                                {cell.chars.toLocaleString()}자
                              </span>
                              <span className="text-neutral-400">{cell.minutes}분</span>
                            </div>
                          ) : (
                            <span className="text-neutral-200 dark:text-neutral-700">–</span>
                          )}
                        </td>
                      );
                    })
                  )}
                  <td className={`px-2 py-2 text-center font-medium ${rowBg}`}>
                    {member.recordsVisible ? (
                      <div className="flex flex-col leading-tight">
                        <span className="text-neutral-900">
                          {total.chars.toLocaleString()}자
                        </span>
                        <span className="text-neutral-500">{total.minutes}분</span>
                      </div>
                    ) : (
                      <span className="text-neutral-300 dark:text-neutral-600">–</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
