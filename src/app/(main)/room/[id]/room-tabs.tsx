"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const TAB_KEYS = ["room", "records", "calendar", "poll", "board"] as const;

type TabKey = (typeof TAB_KEYS)[number];

export function RoomTabs({
  room,
  records,
  calendar,
  poll,
  board,
  isSystemRoom = false,
}: {
  room: ReactNode;
  records: ReactNode;
  calendar: ReactNode;
  poll: ReactNode;
  board: ReactNode;
  // 마감방/새벽방은 상시 오픈된 대규모 공용방이라, 방장/부방장 개념이나
  // 개인 일정·투표·게시판이 의미가 없다 — 방 탭 하나만 보여준다.
  isSystemRoom?: boolean;
}) {
  const t = useTranslations("room.roomTabs");
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("room");

  if (isSystemRoom) {
    return <div className="flex flex-col gap-4">{room}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 overflow-x-auto border-b border-neutral-100 dark:border-neutral-800">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              // 기록/캘린더/투표/게시판은 매번 최신 데이터를 보여줘야 해서,
              // 탭을 열 때마다 서버 데이터를 다시 가져온다. router.refresh()는
              // 현재 마운트된 클라이언트 상태(채팅 메시지, 뽀모도로 진행 등)는
              // 그대로 둔 채 서버 컴포넌트 쪽 props만 최신으로 갱신한다.
              router.refresh();
            }}
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
