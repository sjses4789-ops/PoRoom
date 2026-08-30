"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { ROOM_TAGS, translateRoomTag } from "@/lib/room-tags";
import { paletteDot, paletteCard } from "@/lib/palette";
import { toggleFavoriteRoom } from "@/lib/rooms";
import Link from "next/link";
import CreateRoomButton from "./create-room-button";
import InviteCodeButton from "./invite-code-button";
import RoomCard, { type RoomListItem } from "./room-card";

// 검색 버튼(돋보기) 아이콘 — 이모지 대신 직접 그려서 다크모드에서도
// currentColor로 자연스럽게 색이 맞도록 한다.
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden fill="none">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
      <line x1="15.5" y1="15.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

type NewRoomRow = {
  id: string;
  name: string;
  color: string;
  tags: string[] | null;
  join_type: "invite" | "open";
  target_position: "novelist" | "webtoon" | null;
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
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-neutral-200/60 transition hover:border-neutral-300 dark:border-neutral-700/60 dark:hover:border-neutral-600 ${paletteCard(room.color)}`}
    >
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
          <span className="min-w-0 truncate font-medium text-neutral-900 dark:text-white">{room.name}</span>
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          {room.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/60 px-1.5 py-0.5 text-[11px] text-neutral-600 dark:bg-black/20 dark:text-neutral-300"
            >
              {translateRoomTag(tTags, tag)}
            </span>
          ))}
          <span className="ml-auto whitespace-nowrap text-[12px] text-neutral-500 dark:text-neutral-400">
            {t("membersSuffix", { count: room.memberCount })}
          </span>
        </span>
      </Link>
    </div>
  );
}

export function MainRoomLists({
  initialRooms,
  selfPosition,
}: {
  initialRooms: RoomListItem[];
  selfPosition: "novelist" | "webtoon";
}) {
  const t = useTranslations("main.roomLists");
  const tTags = useTranslations("tags");
  const tRoomCard = useTranslations("main.roomCard");
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

  // "공개방"/"비공개방"은 방 생성·설정에서 쓰는 ROOM_TAGS와는 별개다 —
  // 오로지 이 검색 화면에서만 방의 join_type으로 거르기 위한 것이라, 방
  // 태그 목록에 섞지 않고 별도 필터 상태로 관리한다.
  const [joinTypeFilter, setJoinTypeFilter] = useState<"open" | "invite" | null>(null);
  // 방 생성 시 고르는 "입장 가능 직업"(target_position) 기준 필터 —
  // 이것도 ROOM_TAGS와는 별개의 검색 전용 필터다.
  const [targetPositionFilter, setTargetPositionFilter] = useState<
    "novelist" | "webtoon" | null
  >(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const openSearch = () => {
    setSearchOpen(true);
    // 방금 열린 input에 포커스를 주기 위해, 렌더링이 반영된 다음 프레임에
    // focus를 건다.
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setAppliedSearch("");
  };

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
                    targetPosition: row.target_position,
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
  // 검색어(방 이름 부분 일치)와 공개/비공개 필터는 태그 필터와 AND로 겹쳐진다.
  const normalizedSearch = appliedSearch.trim().toLowerCase();
  const isFiltering =
    selectedTags.size > 0 ||
    joinTypeFilter !== null ||
    targetPositionFilter !== null ||
    normalizedSearch !== "";
  const allRooms = rooms
    .filter(
      (r) =>
        (selectedTags.size === 0 ||
          Array.from(selectedTags).every((t) => r.tags.includes(t))) &&
        (joinTypeFilter === null || r.joinType === joinTypeFilter) &&
        (targetPositionFilter === null || r.targetPosition === targetPositionFilter) &&
        (normalizedSearch === "" || r.name.toLowerCase().includes(normalizedSearch))
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
          {(selectedTags.size > 0 ||
            joinTypeFilter !== null ||
            targetPositionFilter !== null ||
            appliedSearch !== "") && (
            <button
              onClick={() => {
                setSelectedTags(new Set());
                setJoinTypeFilter(null);
                setTargetPositionFilter(null);
                closeSearch();
              }}
              className="rounded-full border border-neutral-300 bg-neutral-200 px-2 py-0.5 text-[12px] text-neutral-600 transition hover:bg-neutral-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
            >
              {t("reset")}
            </button>
          )}
          {(["open", "invite"] as const).map((jt) => (
            <button
              key={jt}
              onClick={() => setJoinTypeFilter((prev) => (prev === jt ? null : jt))}
              className={`rounded-full border px-2 py-0.5 text-[12px] transition ${
                joinTypeFilter === jt
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              {jt === "open" ? tRoomCard("joinTypeOpen") : tRoomCard("joinTypeInvite")}
            </button>
          ))}
          {(["novelist", "webtoon"] as const).map((tp) => (
            <button
              key={tp}
              onClick={() => setTargetPositionFilter((prev) => (prev === tp ? null : tp))}
              className={`rounded-full border px-2 py-0.5 text-[12px] transition ${
                targetPositionFilter === tp
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              {tp === "novelist" ? tRoomCard("targetNovelist") : tRoomCard("targetWebtoon")}
            </button>
          ))}
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

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <h2 className="shrink-0 text-sm font-semibold text-neutral-900 dark:text-white">
              {t("allRooms")}
            </h2>
            <button
              type="button"
              onClick={() => (searchOpen ? closeSearch() : openSearch())}
              aria-label={t("searchToggle")}
              aria-pressed={searchOpen}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition ${
                searchOpen
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              }`}
            >
              <SearchIcon />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setAppliedSearch(searchQuery.trim());
                else if (e.key === "Escape") closeSearch();
              }}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchToggle")}
              tabIndex={searchOpen ? 0 : -1}
              // 돋보기를 누르면 오른쪽으로 입력창이 길어지면서 나타나도록
              // width를 트랜지션한다. 닫혀있을 땐 폭 0으로 숨기되 DOM에서는
              // 제거하지 않아 애니메이션이 매끄럽다.
              className={`min-w-0 rounded-full border bg-white px-2.5 py-0.5 text-[12px] text-neutral-700 outline-none transition-all duration-200 placeholder:text-neutral-400 focus:border-neutral-400 dark:bg-neutral-900 dark:text-neutral-200 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 ${
                searchOpen
                  ? "w-40 border-neutral-200 opacity-100 sm:w-48 dark:border-neutral-700"
                  : "w-0 border-transparent px-0 opacity-0"
              }`}
            />
          </div>
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
            {isFiltering ? t("noRoomsMatch") : t("noRoomsYet")}
          </p>
        ) : (
          // 태그 개수에 따라 카드 높이가 제각각이라, 일반 grid로 배치하면
          // 같은 줄의 카드끼리 높이를 맞추느라 짧은 카드 아래에 큰 빈
          // 여백이 생긴다(줄이 맞을 필요는 없다고 하셔서) — 세로로 빈틈
          // 없이 차곡차곡 쌓이는 다단(칼럼) 레이아웃으로 바꾼다. 태그는
          // 그대로 다 보여주고, 카드 높이가 다른 채로 세로 간격만 없앤다.
          <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
            {allRooms.map((room) => (
              <div key={room.id} className="mb-3 break-inside-avoid">
                <RoomCard room={room} selfPosition={selfPosition} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
