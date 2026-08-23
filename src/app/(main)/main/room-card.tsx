"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { joinOpenRoom } from "@/lib/rooms";
import { paletteDot, paletteBg } from "@/lib/palette";
import { createClient } from "@/lib/supabase/client";

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

const JOIN_TYPE_LABEL: Record<RoomListItem["joinType"], string> = {
  invite: "비공개방",
  open: "공개방",
};

function RoomCardBody({ room }: { room: RoomListItem }) {
  // 방 색상은 항상 옅은 파스텔이라, 카드 배경으로 쓰면 텍스트는 테마와
  // 무관하게 항상 어두운 색으로 유지해야 읽힌다.
  return (
    <div
      className={`flex flex-col gap-2 overflow-hidden rounded-lg border border-neutral-200/60 p-4 transition hover:border-neutral-300 ${paletteBg(room.color)}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium text-neutral-900">
          <span className={`h-2 w-2 shrink-0 rounded-full ${paletteDot(room.color)}`} />
          {room.name}
        </span>
        <span className="shrink-0 whitespace-nowrap text-xs text-neutral-500">
          {room.memberCount}명 참여중
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600">
        <span className="rounded border border-neutral-300 px-1.5 py-0.5 text-[11px] text-neutral-500">
          {JOIN_TYPE_LABEL[room.joinType]}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[12px] text-neutral-600">
        <span>누적 {room.allTimeChars.toLocaleString()}자</span>
        <span>이번 달 {room.monthChars.toLocaleString()}자</span>
      </div>
      {room.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {room.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/60 px-1.5 py-0.5 text-[11px] text-neutral-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

async function roomStillExists(roomId: string) {
  const supabase = createClient();
  const { data } = await supabase.from("rooms").select("id").eq("id", roomId).maybeSingle();
  return !!data;
}

export default function RoomCard({ room }: { room: RoomListItem }) {
  const [joining, setJoining] = useState(false);
  const router = useRouter();

  if (room.isMember) {
    return (
      <Link
        href={`/room/${room.id}`}
        onClick={async (e) => {
          e.preventDefault();
          if (await roomStillExists(room.id)) {
            router.push(`/room/${room.id}`);
          } else {
            window.alert("이미 삭제된 방입니다.");
          }
        }}
      >
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
            if (await roomStillExists(room.id)) {
              await joinOpenRoom(room.id);
            } else {
              window.alert("이미 삭제된 방입니다.");
            }
            setJoining(false);
          }}
          className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          {joining ? "입장 중..." : "입장하기"}
        </button>
      </div>
    );
  }

  return <RoomCardBody room={room} />;
}
