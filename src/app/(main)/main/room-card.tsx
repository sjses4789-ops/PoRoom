"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { joinOpenRoom } from "@/lib/rooms";
import { paletteDot, paletteCard } from "@/lib/palette";
import { translateRoomTag } from "@/lib/room-tags";

export type RoomListItem = {
  id: string;
  name: string;
  memberCount: number;
  color: string;
  tags: string[];
  joinType: "invite" | "open";
  targetPosition: "novelist" | "webtoon" | null;
  isMember: boolean;
  isFavorite?: boolean;
  inviteCode?: string;
  createdAt: string;
  allTimeChars: number;
  monthChars: number;
};

function RoomCardBody({
  room,
  joinSlot,
}: {
  room: RoomListItem;
  // "입장하기" 버튼 — 카드 박스 바깥이 아니라 안쪽 하단 오른쪽 구석에
  // 넣기 위해 슬롯으로 받는다.
  joinSlot?: React.ReactNode;
}) {
  const t = useTranslations("main.roomCard");
  const tTags = useTranslations("tags");
  const joinTypeLabel = room.joinType === "invite" ? t("joinTypeInvite") : t("joinTypeOpen");
  return (
    <div
      className={`overflow-hidden rounded-lg border border-neutral-200/60 transition hover:border-neutral-300 dark:border-neutral-700/60 dark:hover:border-neutral-600 ${paletteCard(room.color)}`}
    >
      <div className="flex flex-col gap-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium text-neutral-900 dark:text-white">
          <span className={`h-2 w-2 shrink-0 rounded-full ${paletteDot(room.color)}`} />
          {room.name}
        </span>
        <span className="shrink-0 whitespace-nowrap text-xs text-neutral-500 dark:text-neutral-400">
          {t("membersJoined", { count: room.memberCount })}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600 dark:text-neutral-300">
        <span className="rounded border border-neutral-300 px-1.5 py-0.5 text-[11px] text-neutral-500 dark:border-neutral-600 dark:text-neutral-400">
          {joinTypeLabel}
        </span>
        {room.targetPosition && (
          <span className="rounded border border-neutral-300 px-1.5 py-0.5 text-[11px] text-neutral-500 dark:border-neutral-600 dark:text-neutral-400">
            {room.targetPosition === "webtoon" ? t("targetWebtoon") : t("targetNovelist")}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-[12px] text-neutral-600 dark:text-neutral-300">
        <span>{t("allTimeChars", { count: room.allTimeChars.toLocaleString() })}</span>
        <span>{t("monthChars", { count: room.monthChars.toLocaleString() })}</span>
      </div>
      {room.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {room.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/60 px-1.5 py-0.5 text-[11px] text-neutral-600 dark:bg-black/20 dark:text-neutral-300"
            >
              {translateRoomTag(tTags, tag)}
            </span>
          ))}
        </div>
      )}
      {joinSlot && <div className="flex justify-end">{joinSlot}</div>}
      </div>
    </div>
  );
}

export default function RoomCard({
  room,
  selfPosition,
}: {
  room: RoomListItem;
  selfPosition: "novelist" | "webtoon";
}) {
  const t = useTranslations("main.roomCard");
  const [joining, setJoining] = useState(false);
  const mismatched = room.targetPosition !== null && room.targetPosition !== selfPosition;

  if (room.isMember) {
    return (
      <Link href={`/room/${room.id}`}>
        <RoomCardBody room={room} />
      </Link>
    );
  }

  if (room.joinType === "open") {
    const joinButton = (
      <button
        type="button"
        disabled={joining}
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (mismatched) {
            window.alert(
              room.targetPosition === "webtoon" ? t("webtoonOnlyAlert") : t("novelistOnlyAlert")
            );
            return;
          }
          setJoining(true);
          await joinOpenRoom(room.id);
          setJoining(false);
        }}
        // 직업이 안 맞는 방은 버튼을 아예 못 누르게 막기보다(왜 안 되는지
        // 모르고 답답해할 수 있어서), 흐리게 "비활성화된 것처럼" 보이게만
        // 하고 눌렀을 때 이유를 알림창으로 알려준다.
        className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
          mismatched
            ? "cursor-not-allowed bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
            : "bg-neutral-900 text-white hover:bg-neutral-700"
        }`}
      >
        {joining ? t("joining") : t("join")}
      </button>
    );
    return <RoomCardBody room={room} joinSlot={joinButton} />;
  }

  return <RoomCardBody room={room} />;
}
