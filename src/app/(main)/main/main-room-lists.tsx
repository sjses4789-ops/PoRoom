"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { ROOM_TAGS, translateRoomTag } from "@/lib/room-tags";
import { paletteDot, paletteBgFaded } from "@/lib/palette";
import { toggleFavoriteRoom } from "@/lib/rooms";
import Link from "next/link";
import CreateRoomButton from "./create-room-button";
import InviteCodeButton from "./invite-code-button";
import RoomCard, { type RoomListItem } from "./room-card";

type NewRoomRow = {
  id: string;
  name: string;
  color: string;
  tags: string[] | null;
  join_type: "invite" | "open";
  is_system: boolean;
  created_at: string;
};

type SortMode = "chars" | "members" | "created";
type SortDirection = "asc" | "desc";

function MyRoomCard({
  room,
  onToggleFavorite,
}: {
  room: RoomListItem;
  onToggleFavorite: (roomId: string, next: boolean) => void;
}) {
  const t = useTranslations("main.roomLists");
  const tTags = useTranslations("tags");
  // room-card.tsx와 동일한 이유로, 바탕은 항상 흰색으로 고정하고 그 위에
  // 방 색상을 30% 투명도로만 겹친다(다크 모드 배경 위에 옅은 파스텔을
  // 그대로 얹으면 색이 어둡게 섞여 텍스트 대비가 나빠지기 때문).
  return (
    <div className="relative overflow-hidden rounded-lg border border-neutral-200/60 bg-white transition hover:border-neutral-300">
      <div className={`pointer-events-none absolute inset-0 -z-10 ${paletteBgFaded(room.color)}`} />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite(room.id, !room.isFavorite);
        }}
        aria-label={room.isFavorite ? t("favoriteRemove") : t("favoriteAdd")}
        title={room.isFavorite ? t("favoriteRemove") : t("favoriteAdd")}
        className="absolute right-2 top-2 z-10 text-base leading-none text-amber-500 transition hover:scale-110"
      >
        {room.isFavorite ? "⭐" : "☆"}
      </button>
      <Link
        href={`/room/${room.id}`}
        className="flex flex-col gap-1.5 px-3 py-2.5 pr-8 text-sm"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={`h-2 w-2 shrink-0 rounded-full ${paletteDot(room.color)}`} />
          <span className="min-w-0 truncate font-medium text-neutral-900">{room.name}</span>
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          {room.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/60 px-1.5 py-0.5 text-[11px] text-neutral-600"
            >
              {translateRoomTag(tTags, tag)}
            </span>
          ))}
          <span className="ml-auto whitespace-nowrap text-[12px] text-neutral-500">
            {t("membersSuffix", { count: room.memberCount })}
          </span>
        </span>
      </Link>
    </div>
  );
}

export function MainRoomLists({ initialRooms }: { initialRooms: RoomListItem[] }) {
  const t = useTranslations("main.roomLists");
  const tTags = useTranslations("tags");
  const SORT_OPTIONS: { key: SortMode; label: string }[] = [
    { key: "chars", label: t("sortChars") },
    { key: "members", label: t("sortMembers") },
    { key: "created", label: t("sortCreated") },
  ];
  const [rooms, setRooms] = useState(initialRooms);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<SortMode>("chars");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [openPopover, setOpenPopover] = useState<"create" | "invite" | null>(null);

  const handleSortClick = (key: SortMode) => {
    if (sortMode === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortMode(key);
      setSortDir("asc");
    }
  };

  // pick up server-refreshed data too (e.g. returning here after creating
  // or leaving a room ourselves triggers a revalidation).
  const [synced, setSynced] = useState(initialRooms);
  if (initialRooms !== synced) {
    setSynced(initialRooms);
    setRooms(initialRooms);
  }

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("main-rooms")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rooms", filter: "is_system=eq.false" },
        (payload) => {
          const row = payload.new as NewRoomRow;
          setRooms((prev) =>
            prev.some((r) => r.id === row.id)
              ? prev
              : [
                  ...prev,
                  {
                    id: row.id,
                    name: row.name,
                    memberCount: 1,
                    color: row.color,
                    tags: row.tags ?? [],
                    joinType: row.join_type,
                    isMember: false,
                    createdAt: row.created_at,
                    allTimeChars: 0,
                    monthChars: 0,
                  },
                ]
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "rooms" },
        (payload) => {
          const row = payload.old as { id?: string };
          if (row.id) setRooms((prev) => prev.filter((r) => r.id !== row.id));
        }
      )
      .on("broadcast", { event: "room-deleted" }, ({ payload }) => {
        const { roomId } = payload as { roomId: string };
        setRooms((prev) => prev.filter((r) => r.id !== roomId));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const toggleFavorite = (roomId: string, next: boolean) => {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, isFavorite: next } : r)));
    toggleFavoriteRoom(roomId, next);
  };

  const myRooms = rooms
    .filter((r) => r.isMember)
    .sort((a, b) => Number(b.isFavorite ?? false) - Number(a.isFavorite ?? false));

  const sortFn = (a: RoomListItem, b: RoomListItem) => {
    const mul = sortDir === "asc" ? 1 : -1;
    if (sortMode === "members") return mul * (a.memberCount - b.memberCount);
    if (sortMode === "created") return mul * a.createdAt.localeCompare(b.createdAt);
    return mul * (a.allTimeChars - b.allTimeChars);
  };

  // "전체/추천 방"은 내가 이미 입장한 방을 포함해 생성된 모든 방을 보여준다
  // (별도 요청: "생성되어있는 방의 전체 목록이 나타나도록").
  // 태그를 2개 이상 고르면, 그 태그를 전부 가진 방만 보여준다(AND 조건).
  const allRooms = rooms
    .filter(
      (r) =>
        selectedTags.size === 0 ||
        Array.from(selectedTags).every((t) => r.tags.includes(t))
    )
    .sort(sortFn);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t("myRooms")}
        </h2>
        <div className="flex gap-1.5">
          <CreateRoomButton
            open={openPopover === "create"}
            onToggle={() => setOpenPopover((v) => (v === "create" ? null : "create"))}
          />
          <InviteCodeButton
            open={openPopover === "invite"}
            onToggle={() => setOpenPopover((v) => (v === "invite" ? null : "invite"))}
          />
        </div>
        {myRooms.length === 0 ? (
          <p className="text-xs text-neutral-400">{t("noMyRooms")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {myRooms.map((room) => (
              <MyRoomCard key={room.id} room={room} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.size > 0 && (
            <button
              onClick={() => setSelectedTags(new Set())}
              className="rounded-full border border-neutral-300 px-2 py-0.5 text-[12px] text-neutral-500 transition hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              {t("reset")}
            </button>
          )}
          {ROOM_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`rounded-full border px-2 py-0.5 text-[12px] transition ${
                selectedTags.has(tag)
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              {translateRoomTag(tTags, tag)}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {t("allRooms")}
          </h2>
          <div className="flex gap-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleSortClick(opt.key)}
                className={`rounded-md px-2 py-1 text-[12px] font-medium transition ${
                  sortMode === opt.key
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {opt.label}
                {sortMode === opt.key && (sortDir === "asc" ? " ▲" : " ▼")}
              </button>
            ))}
          </div>
        </div>

        {allRooms.length === 0 ? (
          <p className="text-xs text-neutral-400">
            {selectedTags.size > 0 ? t("noRoomsMatch") : t("noRoomsYet")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
