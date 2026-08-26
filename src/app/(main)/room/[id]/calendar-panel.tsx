"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { createEvent, celebrateEvent, updateEvent, deleteEvent } from "@/lib/room-events";
import { paletteDot, paletteCard } from "@/lib/palette";

export type EventCategory = { id: string; name: string; color: string };

export type RoomEvent = {
  id: string;
  title: string;
  eventDate: string; // YYYY-MM-DD
  memo: string | null;
  // 출간 카테고리 일정은 항상 익명이라 서버에서부터 null로 내려온다.
  authorName: string | null;
  categoryId: string | null;
  celebrationCount: number;
  selfCelebrated: boolean;
  // 작성자 본인이거나 방장/부방장이면 true — 서버에서 이미 판정해서
  // 내려준다(출간 일정 익명성이 깨지지 않도록 created_by 자체는
  // 클라이언트에 보내지 않는다).
  canModify: boolean;
};

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function toDateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function CalendarPanel({
  roomId,
  initialEvents,
  categories,
}: {
  roomId: string;
  initialEvents: RoomEvent[];
  categories: EventCategory[];
}) {
  const t = useTranslations("room.calendarPanel");
  const tCommon = useTranslations("room.common");
  const [events, setEvents] = useState<RoomEvent[]>(initialEvents);
  // 이 패널은 탭을 옮겨도 마운트가 풀리지 않아서, 새로 받은 initialEvents를
  // 그냥 두면 다른 사람이 추가/수정한 일정이 반영되지 않는다 — 탭을 다시
  // 열 때(page.tsx가 router.refresh()로 새로 렌더링될 때) prop 참조가
  // 바뀌면 그 최신 값으로 다시 맞춘다.
  const [syncedInitialEvents, setSyncedInitialEvents] = useState(initialEvents);
  if (initialEvents !== syncedInitialEvents) {
    setSyncedInitialEvents(initialEvents);
    setEvents(initialEvents);
  }
  const today = new Date();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMemo, setEditMemo] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, RoomEvent[]>();
    for (const e of events) {
      const list = map.get(e.eventDate) ?? [];
      list.push(e);
      map.set(e.eventDate, list);
    }
    return map;
  }, [events]);

  const upcoming = useMemo(
    () =>
      [...events]
        .filter((e) => e.eventDate >= todayKey)
        .sort((a, b) => a.eventDate.localeCompare(b.eventDate)),
    [events, todayKey]
  );

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const goMonth = (delta: number) => {
    let y = viewYear;
    let m = viewMonth + delta;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewYear(y);
    setViewMonth(m);
  };

  const submitEvent = async () => {
    if (!selectedDate) return;
    if (!title.trim()) {
      setError(t("titleRequiredError"));
      return;
    }
    setPending(true);
    setError(null);
    const result = await createEvent(
      roomId,
      title,
      selectedDate,
      memo,
      categoryId || null
    );
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    const category = result.categoryId ? categoryMap.get(result.categoryId) : null;
    const isAnnouncement = category?.name === "출간";
    setEvents((prev) => [
      ...prev,
      {
        ...result,
        authorName: isAnnouncement ? null : tCommon("self"),
        celebrationCount: 0,
        selfCelebrated: false,
        canModify: true,
      },
    ]);
    setTitle("");
    setMemo("");
    setCategoryId("");
  };

  const startEdit = (e: RoomEvent) => {
    setEditingEventId(e.id);
    setEditTitle(e.title);
    setEditMemo(e.memo ?? "");
    setEditCategoryId(e.categoryId ?? "");
    setEditError(null);
  };

  const submitEdit = async (eventId: string) => {
    if (!editTitle.trim()) {
      setEditError(t("titleRequiredError"));
      return;
    }
    setEditPending(true);
    setEditError(null);
    const result = await updateEvent(
      roomId,
      eventId,
      editTitle,
      selectedDate!,
      editMemo,
      editCategoryId || null
    );
    setEditPending(false);
    if ("error" in result) {
      setEditError(result.error);
      return;
    }
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              title: editTitle.trim(),
              memo: editMemo.trim() || null,
              categoryId: editCategoryId || null,
            }
          : e
      )
    );
    setEditingEventId(null);
  };

  const removeEvent = async (eventId: string) => {
    if (!window.confirm(t("deleteEventConfirm"))) return;
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    await deleteEvent(roomId, eventId);
  };

  const celebrate = async (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId && !e.selfCelebrated
          ? { ...e, celebrationCount: e.celebrationCount + 1, selfCelebrated: true }
          : e
      )
    );
    await celebrateEvent(roomId, eventId);
  };

  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) ?? [] : [];

  return (
    <div className="grid grid-cols-1 gap-4 overflow-hidden rounded-sm border border-neutral-400 p-4 lg:grid-cols-[220px_1fr] dark:border-neutral-600">
      <div className="flex flex-col gap-2 lg:border-r lg:border-neutral-100 lg:pr-4 dark:lg:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("upcomingTitle")}</h2>
        {upcoming.length === 0 ? (
          <p className="text-xs text-neutral-400">{t("noUpcoming")}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {upcoming.map((e) => {
              const category = e.categoryId ? categoryMap.get(e.categoryId) : null;
              const isAnnouncement = category?.name === "출간";
              return (
                <li
                  key={e.id}
                  className={`rounded-md px-2.5 py-2 text-xs ${
                    category ? paletteCard(category.color) : "bg-neutral-50 dark:bg-neutral-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex min-w-0 items-center gap-1.5">
                      {category && (
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${paletteDot(category.color)}`} />
                      )}
                      <span className="min-w-0 truncate font-medium text-neutral-900 dark:text-white">
                        {e.title}
                      </span>
                    </div>
                    {isAnnouncement && (
                      <button
                        onClick={() => celebrate(e.id)}
                        disabled={e.selfCelebrated}
                        className="shrink-0 rounded-full border border-rose-200 px-1.5 py-0.5 text-[11px] font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-70 dark:border-rose-900/50 dark:text-rose-400"
                      >
                        🎉 {e.celebrationCount}
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 text-neutral-400">
                    {e.eventDate === todayKey ? t("today") : e.eventDate}
                    {category ? ` · ${category.name}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <button onClick={() => goMonth(-1)} className="rounded-md px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              ←
            </button>
            <span className="font-medium text-neutral-900 dark:text-white">
              {t("monthHeader", { year: viewYear, month: viewMonth + 1 })}
            </span>
            <button onClick={() => goMonth(1)} className="rounded-md px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-400">
          {WEEKDAY_KEYS.map((w) => (
            <div key={w} className="py-1">
              {t(`weekday.${w}`)}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateKey = toDateKey(viewYear, viewMonth, day);
            const dayEvents = eventsByDate.get(dateKey) ?? [];
            const isSelected = dateKey === selectedDate;
            const isToday = dateKey === todayKey;
            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                className={`flex flex-col items-center gap-0.5 rounded-md py-1.5 text-sm transition ${
                  isSelected
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : isToday
                      ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                      : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                }`}
              >
                <span>{day}</span>
                <span className="flex gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => {
                    const category = e.categoryId ? categoryMap.get(e.categoryId) : null;
                    return (
                      <span
                        key={e.id}
                        className={`h-1 w-1 rounded-full ${
                          isSelected
                            ? "bg-white"
                            : category
                              ? paletteDot(category.color)
                              : "bg-emerald-500"
                        }`}
                      />
                    );
                  })}
                </span>
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <div className="flex flex-col gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <h3 className="text-xs font-medium text-neutral-500">{t("eventsForDate", { date: selectedDate })}</h3>
            {selectedEvents.length === 0 ? (
              <p className="text-xs text-neutral-400">{t("noEventsForDate")}</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {selectedEvents.map((e) => {
                  const category = e.categoryId ? categoryMap.get(e.categoryId) : null;
                  const isAnnouncement = category?.name === "출간";
                  const isEditing = editingEventId === e.id;
                  return (
                    <li
                      key={e.id}
                      className="flex flex-col gap-1.5 rounded-md bg-neutral-50 px-3 py-2 text-sm dark:bg-neutral-800"
                    >
                      {isEditing ? (
                        <div className="flex flex-col gap-1.5">
                          <input
                            value={editTitle}
                            onChange={(ev) => setEditTitle(ev.target.value)}
                            placeholder={t("titlePlaceholder")}
                            className="rounded-md border border-neutral-200 px-2 py-1 text-sm text-neutral-900 dark:border-neutral-700 dark:text-white outline-none focus:border-neutral-400"
                          />
                          <input
                            value={editMemo}
                            onChange={(ev) => setEditMemo(ev.target.value)}
                            placeholder={t("memoPlaceholder")}
                            className="rounded-md border border-neutral-200 px-2 py-1 text-sm text-neutral-900 dark:border-neutral-700 dark:text-white outline-none focus:border-neutral-400"
                          />
                          {categories.length > 0 && (
                            <select
                              value={editCategoryId}
                              onChange={(ev) => setEditCategoryId(ev.target.value)}
                              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-700 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-black dark:text-neutral-100"
                            >
                              <option value="">{t("noCategory")}</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          )}
                          {editError && <p className="text-xs text-red-500">{editError}</p>}
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => submitEdit(e.id)}
                              disabled={editPending}
                              className="rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                            >
                              {editPending ? t("saving") : t("save")}
                            </button>
                            <button
                              onClick={() => setEditingEventId(null)}
                              className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700"
                            >
                              {t("cancel")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex min-w-0 items-center gap-1.5">
                              {category && (
                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${paletteDot(category.color)}`} />
                              )}
                              <span className="min-w-0 truncate font-medium text-neutral-900 dark:text-white">
                                {e.title}
                              </span>
                            </div>
                            {isAnnouncement && (
                              <button
                                onClick={() => celebrate(e.id)}
                                disabled={e.selfCelebrated}
                                className="shrink-0 rounded-full border border-rose-200 px-1.5 py-0.5 text-[11px] font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-70 dark:border-rose-900/50 dark:text-rose-400"
                              >
                                🎉 {e.celebrationCount}
                              </button>
                            )}
                          </div>
                          {e.memo && <span className="text-xs text-neutral-500">{e.memo}</span>}
                          <div className="flex items-center justify-between gap-1.5">
                            {e.authorName ? (
                              <span className="text-[12px] text-neutral-400">{e.authorName}</span>
                            ) : (
                              <span />
                            )}
                            {e.canModify && (
                              <div className="flex shrink-0 gap-2 text-[11px] text-neutral-400">
                                <button
                                  onClick={() => startEdit(e)}
                                  className="hover:text-neutral-700 dark:hover:text-neutral-200"
                                >
                                  {t("edit")}
                                </button>
                                <button onClick={() => removeEvent(e.id)} className="hover:text-red-500">
                                  {t("delete")}
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("titlePlaceholder")}
                className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
              />
              <input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder={t("memoPlaceholder")}
                className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
              />
              {categories.length > 0 && (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-sm text-neutral-700 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-black dark:text-neutral-100"
                >
                  <option value="">{t("noCategory")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                onClick={submitEvent}
                disabled={pending}
                className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
              >
                {pending ? t("adding") : t("addEvent")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
