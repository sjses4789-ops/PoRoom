"use client";

import { useState } from "react";

export type RoomMeta = { id: string; name: string; memberCount: number };
export type RoomMemberRow = { room_id: string; user_id: string };
export type RoomRecordRow = { room_id: string; user_id: string; record_date: string; chars: number };
export type GlobalRecordRow = { user_id: string; record_date: string; chars: number };

function monthPrefix(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function RankingStatusPanel({
  selfId,
  rooms,
  roomMembers,
  roomRecords,
  globalRecords,
  totalUsers,
}: {
  selfId: string;
  rooms: RoomMeta[];
  roomMembers: RoomMemberRow[];
  roomRecords: RoomRecordRow[];
  globalRecords: GlobalRecordRow[];
  totalUsers: number;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const prefix = monthPrefix(year, month);

  const goPrev = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const goNext = () => {
    if (isCurrentMonth) return;
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const monthRoomRecords = roomRecords.filter((r) => r.record_date.startsWith(prefix));
  const roomRanks = rooms.map((room) => {
    const members = roomMembers.filter((m) => m.room_id === room.id);
    const charsByUser = new Map<string, number>();
    for (const r of monthRoomRecords) {
      if (r.room_id !== room.id) continue;
      charsByUser.set(r.user_id, (charsByUser.get(r.user_id) ?? 0) + r.chars);
    }
    const totals = members.map((m) => charsByUser.get(m.user_id) ?? 0);
    const myChars = charsByUser.get(selfId) ?? 0;
    const rank = 1 + totals.filter((c) => c > myChars).length;
    return { id: room.id, name: room.name, memberCount: room.memberCount, rank };
  });

  const monthGlobalRecords = globalRecords.filter((r) => r.record_date.startsWith(prefix));
  const overallCharsByUser = new Map<string, number>();
  for (const r of monthGlobalRecords) {
    overallCharsByUser.set(r.user_id, (overallCharsByUser.get(r.user_id) ?? 0) + r.chars);
  }
  const myOverallChars = overallCharsByUser.get(selfId) ?? 0;
  const overallRank =
    1 + Array.from(overallCharsByUser.values()).filter((c) => c > myOverallChars).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
          랭킹 현황
        </h2>
        <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goPrev}
          className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-500 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          ◀
        </button>
        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-200">
          {year}년 {month + 1}월
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={isCurrentMonth}
          className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-500 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          ▶
        </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">방 기준</p>
          {roomRanks.length === 0 ? (
            <p className="mt-1 text-sm text-neutral-400">입장한 방 없음</p>
          ) : (
            <ul className="mt-1 flex flex-col gap-2">
              {roomRanks.map((room) => (
                <li key={room.id} className="flex flex-col gap-1">
                  <span className="w-fit rounded-full bg-neutral-100 px-2.5 py-1 text-sm font-medium text-neutral-900 dark:bg-neutral-800 dark:text-white">
                    {room.name}
                  </span>
                  <span className="pl-1 text-xs text-neutral-500 dark:text-neutral-400">
                    내 {room.rank}위 / {room.memberCount}명
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">전체 기준</p>
          <p className="mt-1 text-sm text-neutral-900 dark:text-white">
            전체 {overallRank}위 / {totalUsers}명
          </p>
        </div>
      </div>
    </div>
  );
}
