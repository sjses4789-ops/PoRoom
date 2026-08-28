"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { DailyRecord } from "@/lib/records";
import { characterSrc } from "@/lib/characters";
import { setDailyChars } from "@/lib/rooms";
import { todayKst } from "@/lib/time";
import { useTodayCharsSync } from "./today-chars-sync";
import type { Member } from "./room-view";

// 글자수는 결국 방의 데이터가 아니라 개인 당사자의 데이터라서, 이
// 패널이 받는 dailyRecords는 이 방뿐 아니라 그 이용자가 기록을 남긴
// 모든 방을 합친 것이다 — 오늘 날짜 수정 시 "이 방 자신의 몫"을
// 구분해내려면 각 행이 어느 방에서 난 기록인지(roomId)가 필요하다.
export type PersonalDailyRecord = DailyRecord & { roomId: string };

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
  dailyRecords: PersonalDailyRecord[];
}) {
  const t = useTranslations("room.roomRecordsPanel");
  const tCommon = useTranslations("room.common");
  const todayCharsSync = useTodayCharsSync();
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
      // 같은 날짜라도 여러 방에서 나눠 기록했을 수 있어(개인 데이터라
      // 방을 합쳐 보여주므로), 그 날의 합계를 보여준다.
      const total = selfRecords
        .filter((r) => r.date === dateKey)
        .reduce((sum, r) => sum + r.chars, 0);
      values[dateKey] = total > 0 ? String(total) : "";
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
    // setDailyChars는 "이 방"에서의 그 날짜 기록만 덮어쓴다 — 표시는
    // 여러 방을 합친 값이라도, 수정은 항상 지금 있는 이 방의 몫만
    // 바뀐다(다른 방에서 같은 날 기록한 몫은 그대로 둔다).
    const existing = dailyRecords.find(
      (r) => r.userId === selfId && r.date === dateKey && r.roomId === roomId
    );
    const previousOwnChars = existing?.chars ?? 0;
    setEditBusyDate(dateKey);
    const result = await setDailyChars(roomId, dateKey, chars);
    setEditBusyDate(null);
    if (result && "error" in result) return;

    setDailyRecordsState((prev) => {
      const rest = prev.filter(
        (r) => !(r.userId === selfId && r.date === dateKey && r.roomId === roomId)
      );
      if (chars <= 0) return rest;
      return [
        ...rest,
        { userId: selfId, date: dateKey, chars, focusMinutes: existing?.focusMinutes ?? 0, roomId },
      ];
    });

    // 오늘 날짜를 수정했다면, 방 탭에 떠 있는 "글자수 기록" 표시도 같은
    // 변화량만큼 즉시 반영되도록 알린다.
    if (dateKey === todayKst()) {
      todayCharsSync?.notifyTodayDelta(chars - previousOwnChars);
    }
  };

  const recordsByUser = useMemo(() => {
    const map = new Map<string, PersonalDailyRecord[]>();
    for (const r of dailyRecords) {
      const list = map.get(r.userId) ?? [];
      list.push(r);
      map.set(r.userId, list);
    }
    return map;
  }, [dailyRecords]);

  // 같은 날짜라도 여러 방에서 나눠 기록됐을 수 있어(개인 데이터라 방을
  // 합쳐 보여주므로), 하나만 찾지 않고 그 날짜의 모든 방 몫을 합산한다.
  const lookup = (userId: string, dateKey: string) => {
    const rows = (recordsByUser.get(userId) ?? []).filter((r) => r.date === dateKey);
    if (rows.length === 0) return undefined;
    return {
      chars: rows.reduce((s, r) => s + r.chars, 0),
      focusMinutes: rows.reduce((s, r) => s + r.focusMinutes, 0),
    };
  };

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
      // 그날 이 방에서도 직접 기록한 게 있는지 — 있으면 "입장 후" 데이터로
      // 본다(다른 방 몫도 같이 있어도 마찬가지). 이 방 몫이 전혀 없고
      // 다른 방에서만 기록됐다면 "입장 전" 데이터로 구분해 흐리게 표시한다.
      const ownedByThisRoom = (recordsByUser.get(userId) ?? []).some(
        (row) => row.date === dateKey && row.roomId === roomId
      );
      return { chars: r?.chars ?? 0, minutes: r?.focusMinutes ?? 0, ownedByThisRoom };
    }
    const monthPrefix = `${year}-${pad2(col)}`;
    const rows = (recordsByUser.get(userId) ?? []).filter((r) =>
      r.date.startsWith(monthPrefix)
    );
    return {
      chars: rows.reduce((s, r) => s + r.chars, 0),
      minutes: rows.reduce((s, r) => s + r.focusMinutes, 0),
      ownedByThisRoom: true,
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

  // 표의 참여자 행 순서 — DB에서 멤버 목록을 정렬 없이 가져오다 보니
  // 탭을 다시 열 때마다(서버 재조회 때마다) 순서가 들쭉날쭉했다. 실제
  // 기록 데이터(출석률)로 순서를 매겨 데이터가 바뀌지 않는 한 순서도
  // 그대로 유지되도록 한다 — 월/연도 전환이나 이 패널 안에서의 수정
  // 같은 로컬 상호작용으로는 재정렬되지 않는다.
  const attendanceRateById = useMemo(() => {
    const dates = dailyRecords.filter((r) => r.chars > 0).map((r) => r.date);
    const rateById = new Map<string, number>();
    if (dates.length === 0) return rateById;

    const minDate = dates.reduce((min, d) => (d < min ? d : min), dates[0]);
    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(
      1,
      Math.round((new Date(`${todayKst()}T00:00:00Z`).getTime() - new Date(`${minDate}T00:00:00Z`).getTime()) / dayMs) + 1
    );

    const attendedByUser = new Map<string, Set<string>>();
    for (const r of dailyRecords) {
      if (r.chars <= 0) continue;
      const set = attendedByUser.get(r.userId) ?? new Set<string>();
      set.add(r.date);
      attendedByUser.set(r.userId, set);
    }
    for (const [userId, set] of attendedByUser) {
      rateById.set(userId, set.size / totalDays);
    }
    return rateById;
  }, [dailyRecords]);

  // 출석률이 가장 높은 참여자가 맨 위, 낮을수록 아래로 가도록 내림차순.
  const sortedMembers = [...members].sort(
    (a, b) => (attendanceRateById.get(b.id) ?? 0) - (attendanceRateById.get(a.id) ?? 0)
  );

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
            {sortedMembers.map((member) => {
              const total = totalFor(member.id);
              const rowBorder = "border-b-2 border-neutral-300 dark:border-neutral-600";
              // 합계보다 옅은 색으로, 날짜별 글자수 칸이 합계 칸과
              // 뚜렷이 구분되도록 한다.
              const dataCellBg = "bg-neutral-50 dark:bg-neutral-800/50";
              // 이 방에 입장하기 전, 다른 방에서만 기록된 날은 훨씬 더
              // 흐리게 표시해 입장 전/후 데이터를 시각적으로 구분한다.
              const preJoinCellBg = "bg-neutral-50/40 dark:bg-neutral-800/20";
              return (
                <tr key={member.id}>
                  <td
                    className={`sticky left-0 z-10 whitespace-nowrap border-r border-neutral-100 bg-white px-2 py-2 font-medium text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white ${rowBorder}`}
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
                      const isPreJoin = hasData && !cell.ownedByThisRoom;
                      return (
                        <td
                          key={c}
                          title={isPreJoin ? t("preJoinCellTitle") : undefined}
                          className={`px-1 py-2 text-center ${rowBorder} ${
                            hasData ? (isPreJoin ? preJoinCellBg : dataCellBg) : ""
                          }`}
                        >
                          {hasData ? (
                            <div className="flex flex-col leading-tight">
                              <span className={isPreJoin ? "text-neutral-400 dark:text-neutral-500" : "text-neutral-800 dark:text-neutral-100"}>
                                {cell.chars.toLocaleString()}{tCommon("charUnit")}
                              </span>
                              <span className="text-neutral-400 dark:text-neutral-500">{cell.minutes}{tCommon("minuteUnit")}</span>
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
