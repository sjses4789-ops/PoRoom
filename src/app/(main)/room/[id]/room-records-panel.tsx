"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { DailyRecord } from "@/lib/records";
import { characterSrc } from "@/lib/characters";
import { setDailyChars } from "@/lib/rooms";
import type { Member } from "./room-view";

type Mode = "month" | "year";

// left-to-right podium spread: 10th, 8th, 6th, 4th, 2nd, 1st, 3rd, 5th,
// 7th, 9th place (1st dead center, alternating outward by rank).
const PODIUM_ORDER = [9, 7, 5, 3, 1, 0, 2, 4, 6, 8];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function RoomRecordsPanel({
  roomId,
  selfId,
  members,
  dailyRecords: initialDailyRecords,
}: {
  roomId: string;
  selfId: string;
  members: Member[];
  dailyRecords: DailyRecord[];
}) {
  const t = useTranslations("room.roomRecordsPanel");
  const tCommon = useTranslations("room.common");
  const now = new Date();
  const [mode, setMode] = useState<Mode>("month");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const [dailyRecords, setDailyRecordsState] = useState(initialDailyRecords);
  // 이 패널은 탭을 옮겨도 마운트가 풀리지 않아서, 새로 받은
  // initialDailyRecords를 반영하려면 프롭 참조가 바뀔 때 로컬 상태를
  // 동기화해줘야 한다(다른 방 패널들과 동일한 패턴).
  const [syncedInitialRecords, setSyncedInitialRecords] = useState(initialDailyRecords);
  if (initialDailyRecords !== syncedInitialRecords) {
    setSyncedInitialRecords(initialDailyRecords);
    setDailyRecordsState(initialDailyRecords);
  }

  const [editOpen, setEditOpen] = useState(false);
  const [editYear, setEditYear] = useState(now.getFullYear());
  const [editMonth, setEditMonth] = useState(now.getMonth()); // 0-indexed
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [editBusyDate, setEditBusyDate] = useState<string | null>(null);

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

  const editDaysInMonth = new Date(editYear, editMonth + 1, 0).getDate();

  const openEdit = () => {
    const selfRecords = dailyRecords.filter((r) => r.userId === selfId);
    const values: Record<string, string> = {};
    for (let d = 1; d <= editDaysInMonth; d++) {
      const dateKey = `${editYear}-${pad2(editMonth + 1)}-${pad2(d)}`;
      const found = selfRecords.find((r) => r.date === dateKey);
      values[dateKey] = found && found.chars > 0 ? String(found.chars) : "";
    }
    setEditValues(values);
    setEditOpen(true);
  };

  const editGoPrev = () => {
    if (editMonth === 0) {
      setEditMonth(11);
      setEditYear((y) => y - 1);
    } else {
      setEditMonth((m) => m - 1);
    }
  };

  const editGoNext = () => {
    if (editMonth === 11) {
      setEditMonth(0);
      setEditYear((y) => y + 1);
    } else {
      setEditMonth((m) => m + 1);
    }
  };

  const saveEditRow = async (dateKey: string) => {
    const chars = Math.max(0, Math.floor(Number(editValues[dateKey])) || 0);
    setEditBusyDate(dateKey);
    const result = await setDailyChars(roomId, dateKey, chars);
    setEditBusyDate(null);
    if (result && "error" in result) return;

    setDailyRecordsState((prev) => {
      const rest = prev.filter((r) => !(r.userId === selfId && r.date === dateKey));
      if (chars <= 0) return rest;
      const existing = prev.find((r) => r.userId === selfId && r.date === dateKey);
      return [
        ...rest,
        { userId: selfId, date: dateKey, chars, focusMinutes: existing?.focusMinutes ?? 0 },
      ];
    });
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
    <div className="flex flex-col gap-3 overflow-hidden rounded-sm border border-neutral-400 p-4 dark:border-neutral-600">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</h2>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {(
              [
                { key: "month" as const, label: t("month") },
                { key: "year" as const, label: t("year") },
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
              {mode === "month"
                ? t("yearMonth", { year, month: month + 1 })
                : t("yearOnly", { year })}
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
                <span className="text-[11px] text-neutral-400">{chars.toLocaleString()}{tCommon("charUnit")}</span>
              </div>
            );
          })}
        </div>
      )}

      {top10.length > 0 && <hr className="border-neutral-200 dark:border-white" />}

      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-separate border-spacing-0 text-left text-xs">
          <thead>
            <tr className="text-neutral-400">
              <th className="sticky left-0 z-10 bg-white px-2 py-2 font-medium dark:bg-neutral-900">
                {t("participant")}
              </th>
              <th className="min-w-[80px] px-2 py-2 text-center font-medium">{t("total")}</th>
              {columns.map((c) => (
                <th key={c} className="min-w-[64px] px-1 py-2 text-center font-medium">
                  {mode === "month" ? t("dayColumn", { day: c }) : t("monthColumn", { month: c })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const total = totalFor(member.id);
              const rowBorder = "border-b-2 border-neutral-300 dark:border-neutral-600";
              // 합계보다 옅은 색으로, 날짜별 글자수 칸이 합계 칸과
              // 뚜렷이 구분되도록 한다.
              const dataCellBg = "bg-neutral-50 dark:bg-neutral-800/50";
              return (
                <tr key={member.id}>
                  <td
                    className={`sticky left-0 z-10 whitespace-nowrap border-r border-neutral-100 bg-white px-2 py-2 font-medium text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 ${rowBorder}`}
                  >
                    <span className="flex items-center gap-1">
                      {member.name}
                      {member.id === selfId && (
                        <button
                          type="button"
                          onClick={openEdit}
                          title={t("editRecordsTitle")}
                          className="shrink-0 text-neutral-400 transition hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200"
                        >
                          ✎
                        </button>
                      )}
                    </span>
                  </td>
                  <td className={`bg-neutral-100 px-2 py-2 text-center font-medium dark:bg-neutral-800 ${rowBorder}`}>
                    {member.recordsVisible ? (
                      <div className="flex flex-col leading-tight">
                        <span className="text-neutral-900 dark:text-white">
                          {total.chars.toLocaleString()}{tCommon("charUnit")}
                        </span>
                        <span className="text-neutral-500 dark:text-neutral-400">{total.minutes}{tCommon("minuteUnit")}</span>
                      </div>
                    ) : (
                      <span className="text-neutral-300 dark:text-neutral-600">–</span>
                    )}
                  </td>
                  {!member.recordsVisible ? (
                    <td
                      colSpan={columns.length}
                      className={`px-2 py-2 text-center text-neutral-300 dark:text-neutral-600 ${rowBorder}`}
                    >
                      {tCommon("recordsPrivate")}
                    </td>
                  ) : (
                    columns.map((c) => {
                      const cell = cellFor(member.id, c);
                      const hasData = cell.chars > 0 || cell.minutes > 0;
                      return (
                        <td key={c} className={`px-1 py-2 text-center ${rowBorder} ${hasData ? dataCellBg : ""}`}>
                          {hasData ? (
                            <div className="flex flex-col leading-tight">
                              <span className="text-neutral-800">
                                {cell.chars.toLocaleString()}{tCommon("charUnit")}
                              </span>
                              <span className="text-neutral-400">{cell.minutes}{tCommon("minuteUnit")}</span>
                            </div>
                          ) : (
                            <span className="text-neutral-200 dark:text-neutral-700">–</span>
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editOpen && (
        <>
          <div
            onClick={() => setEditOpen(false)}
            className="fixed inset-0 z-10 bg-neutral-900/20"
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-20 flex max-h-[80vh] w-[min(20rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 overflow-hidden rounded-md border border-neutral-300 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {t("editRecordsTitle")}
              </p>
              <button
                onClick={() => setEditOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
              <button
                onClick={editGoPrev}
                className="rounded-md px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                ←
              </button>
              <span className="min-w-[80px] text-center font-medium text-neutral-900 dark:text-white">
                {t("yearMonth", { year: editYear, month: editMonth + 1 })}
              </span>
              <button
                onClick={editGoNext}
                className="rounded-md px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                →
              </button>
            </div>
            <ul className="flex flex-col gap-1 overflow-y-auto">
              {Array.from({ length: editDaysInMonth }, (_, i) => i + 1).map((d) => {
                const dateKey = `${editYear}-${pad2(editMonth + 1)}-${pad2(d)}`;
                return (
                  <li key={dateKey} className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
                      {t("dayColumn", { day: d })}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={editValues[dateKey] ?? ""}
                      onChange={(e) =>
                        setEditValues((prev) => ({ ...prev, [dateKey]: e.target.value }))
                      }
                      onBlur={() => saveEditRow(dateKey)}
                      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                      disabled={editBusyDate === dateKey}
                      placeholder="0"
                      className="min-w-0 flex-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 disabled:opacity-50 dark:text-white"
                    />
                    <span className="shrink-0 text-[11px] text-neutral-400">{tCommon("charUnit")}</span>
                  </li>
                );
              })}
            </ul>
            <p className="text-[11px] text-neutral-400">{t("editRecordsHint")}</p>
          </div>
        </>
      )}
    </div>
  );
}
