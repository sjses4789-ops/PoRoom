"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

const TAB_KEYS = ["room", "records", "calendar", "poll", "board"] as const;

type TabKey = (typeof TAB_KEYS)[number];

export function RoomTabs({
  room,
  records,
  calendar,
  poll,
  board,
}: {
  room: ReactNode;
  records: ReactNode;
  calendar: ReactNode;
  poll: ReactNode;
  board: ReactNode;
}) {
  const t = useTranslations("room.roomTabs");
  const [tab, setTab] = useState<TabKey>("room");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 overflow-x-auto border-b border-neutral-100 dark:border-neutral-800">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium transition ${
              tab === key
                ? "border-b-2 border-neutral-900 text-neutral-900 dark:border-white dark:text-white"
                : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            }`}
          >
            {t(key)}
          </button>
        ))}
      </div>

      {/* every tab stays mounted so realtime chat/presence connections in
          the 방 tab don't drop just because another tab is being viewed */}
      <div className={tab === "room" ? "" : "hidden"}>{room}</div>
      <div className={tab === "records" ? "" : "hidden"}>{records}</div>
      <div className={tab === "calendar" ? "" : "hidden"}>{calendar}</div>
      <div className={tab === "poll" ? "" : "hidden"}>{poll}</div>
      <div className={tab === "board" ? "" : "hidden"}>{board}</div>
    </div>
  );
}
