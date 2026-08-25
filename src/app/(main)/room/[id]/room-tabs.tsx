"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const TAB_KEYS = ["room", "records", "calendar", "poll", "board"] as const;

type TabKey = (typeof TAB_KEYS)[number];

// "새 글" 배지가 붙는 탭들 — 각 탭을 마지막으로 연 시각을 로컬에 저장해두고,
// 그 이후에 생성된 항목 수를 배지로 보여준다.
const BADGE_TAB_KEYS = ["calendar", "poll", "board"] as const;
type BadgeTabKey = (typeof BADGE_TAB_KEYS)[number];

function seenStorageKey(roomId: string, key: BadgeTabKey) {
  return `poroom:tab-seen:${roomId}:${key}`;
}

function countNewer(createdAts: string[], seenAt: number | undefined) {
  if (seenAt === undefined) return 0;
  return createdAts.filter((iso) => new Date(iso).getTime() > seenAt).length;
}

export function RoomTabs({
  roomId,
  room,
  records,
  calendar,
  poll,
  board,
  calendarCreatedAts = [],
  pollCreatedAts = [],
  boardCreatedAts = [],
  isSystemRoom = false,
}: {
  roomId: string;
  room: ReactNode;
  records: ReactNode;
  calendar: ReactNode;
  poll: ReactNode;
  board: ReactNode;
  calendarCreatedAts?: string[];
  pollCreatedAts?: string[];
  boardCreatedAts?: string[];
  // 마감방/새벽방은 상시 오픈된 대규모 공용방이라, 방장/부방장 개념이나
  // 개인 일정·투표·게시판이 의미가 없다 — 방 탭 하나만 보여준다.
  isSystemRoom?: boolean;
}) {
  const t = useTranslations("room.roomTabs");
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("room");
  const [seenAt, setSeenAt] = useState<Partial<Record<BadgeTabKey, number>>>({});

  // 탭별 "마지막으로 연 시각"을 로컬스토리지(외부 시스템)에서 읽어와 최초
  // 1회 동기화한다 — 처음 방문하는 탭이면 지금 시각을 저장해서, 이미 있던
  // 글들은 "새 글"로 세지 않는다. 마운트 시 한 번만 외부 상태를 읽어와
  // 반영하는 정당한 경우라 규칙이 스스로 인정하는 예외에 해당한다.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const initial: Partial<Record<BadgeTabKey, number>> = {};
    for (const key of BADGE_TAB_KEYS) {
      const storageKey = seenStorageKey(roomId, key);
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        initial[key] = Number(stored);
      } else {
        const now = Date.now();
        window.localStorage.setItem(storageKey, String(now));
        initial[key] = now;
      }
    }
    setSeenAt(initial);
  }, [roomId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const unreadCountFor = (key: TabKey): number => {
    if (key === "calendar") return countNewer(calendarCreatedAts, seenAt.calendar);
    if (key === "poll") return countNewer(pollCreatedAts, seenAt.poll);
    if (key === "board") return countNewer(boardCreatedAts, seenAt.board);
    return 0;
  };

  if (isSystemRoom) {
    return <div className="flex flex-col gap-4">{room}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 overflow-x-auto border-b border-neutral-100 dark:border-neutral-800">
        {TAB_KEYS.map((key) => {
          const unread = unreadCountFor(key);
          return (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                if ((BADGE_TAB_KEYS as readonly string[]).includes(key)) {
                  const badgeKey = key as BadgeTabKey;
                  const now = Date.now();
                  window.localStorage.setItem(seenStorageKey(roomId, badgeKey), String(now));
                  setSeenAt((prev) => ({ ...prev, [badgeKey]: now }));
                }
                // 기록/캘린더/투표/게시판은 매번 최신 데이터를 보여줘야 해서,
                // 탭을 열 때마다 서버 데이터를 다시 가져온다. router.refresh()는
                // 현재 마운트된 클라이언트 상태(채팅 메시지, 뽀모도로 진행 등)는
                // 그대로 둔 채 서버 컴포넌트 쪽 props만 최신으로 갱신한다.
                router.refresh();
              }}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-2 text-sm font-medium transition ${
                tab === key
                  ? "border-b-2 border-neutral-900 text-neutral-900 dark:border-white dark:text-white"
                  : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              }`}
            >
              {t(key)}
              {unread > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-300 px-1 text-[10px] font-bold text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
          );
        })}
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
