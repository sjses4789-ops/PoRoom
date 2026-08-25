"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { joinOpenRoom } from "@/lib/rooms";
import { paletteDot, paletteBgFaded } from "@/lib/palette";
import { translateRoomTag } from "@/lib/room-tags";

export type RoomListItem = {
  id: string;
  name: string;
  memberCount: number;
  color: string;
  tags: string[];
  joinType: "invite" | "open";
  isMember: boolean;
  isFavorite?: boolean;
  inviteCode?: string;
  createdAt: string;
  allTimeChars: number;
  monthChars: number;
};

function RoomCardBody({ room }: { room: RoomListItem }) {
  const t = useTranslations("main.roomCard");
  const tTags = useTranslations("tags");
  const joinTypeLabel = room.joinType === "invite" ? t("joinTypeInvite") : t("joinTypeOpen");
  // 방 색상은 항상 옅은 파스텔이라, 카드 배경으로 쓰면 텍스트는 테마와
  // 무관하게 항상 어두운 색으로 유지해야 읽힌다. 색을 30% 투명도로만
  // 얹기 위해, 바탕은 테마와 무관하게 항상 흰색으로 고정해두고(다크
  // 모드 배경 위에 그대로 얹으면 옅은 색이 어둡게 섞여버려 텍스트
  // 대비가 오히려 나빠진다) 그 위에 색상을 30% 투명도로 겹친다.
  return (
    <div className="relative overflow-hidden rounded-lg border border-neutral-200/60 bg-white transition hover:border-neutral-300">
      <div className={`pointer-events-none absolute inset-0 ${paletteBgFaded(room.color)}`} />
      <div className="relative flex flex-col gap-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium text-neutral-900">
          <span className={`h-2 w-2 shrink-0 rounded-full ${paletteDot(room.color)}`} />
          {room.name}
        </span>
        <span className="shrink-0 whitespace-nowrap text-xs text-neutral-500">
          {t("membersJoined", { count: room.memberCount })}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600">
        <span className="rounded border border-neutral-300 px-1.5 py-0.5 text-[11px] text-neutral-500">
          {joinTypeLabel}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[12px] text-neutral-600">
        <span>{t("allTimeChars", { count: room.allTimeChars.toLocaleString() })}</span>
        <span>{t("monthChars", { count: room.monthChars.toLocaleString() })}</span>
      </div>
      {room.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {room.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/60 px-1.5 py-0.5 text-[11px] text-neutral-600"
            >
              {translateRoomTag(tTags, tag)}
            </span>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default function RoomCard({ room }: { room: RoomListItem }) {
  const t = useTranslations("main.roomCard");
  const [joining, setJoining] = useState(false);

  if (room.isMember) {
    return (
      <Link href={`/room/${room.id}`}>
        <RoomCardBody room={room} />
      </Link>
    );
  }

  if (room.joinType === "open") {
    return (
      <div className="flex flex-col gap-2">
        <RoomCardBody room={room} />
        <button
          disabled={joining}
          onClick={async () => {
            setJoining(true);
            await joinOpenRoom(room.id);
            setJoining(false);
          }}
          className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          {joining ? t("joining") : t("join")}
        </button>
      </div>
    );
  }

  return <RoomCardBody room={room} />;
}
