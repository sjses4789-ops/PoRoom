"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { getTodosForDate, setTodoCompleted, type TodoHistoryItem } from "@/lib/todos";
import { todayKst, kstDatePlusDays } from "@/lib/time";

export function TodoHistoryPopover({ onClose }: { onClose: () => void }) {
  const t = useTranslations("common.todo");
  const [date, setDate] = useState(todayKst());
  const [items, setItems] = useState<TodoHistoryItem[]>([]);
  // 로딩 여부를 별도 상태로 안 두고, 마지막으로 받아온 결과가 지금
  // 보고 있는 날짜 것인지로 판단한다 — effect 안에서 동기적으로
  // setState를 부르지 않기 위함.
  const [loadedDate, setLoadedDate] = useState<string | null>(null);
  const loading = loadedDate !== date;

  // 한 번 불러온 날짜는 캐시해뒀다가 다시 그 날짜로 돌아오면 곧바로
  // 보여준다 — 옆 날짜(어제/내일)도 미리 가져와둬서, 화살표로 넘길 때
  // 대부분 기다림 없이 바로 나타나게 한다.
  const cacheRef = useRef(new Map<string, TodoHistoryItem[]>());

  const fetchAndCache = (d: string) => {
    if (cacheRef.current.has(d)) return Promise.resolve(cacheRef.current.get(d)!);
    return getTodosForDate(d).then((result) => {
      cacheRef.current.set(d, result);
      return result;
    });
  };

  useEffect(() => {
    let cancelled = false;

    // 캐시에 있으면 기다림 없이 바로 보여준다.
    const cached = cacheRef.current.get(date);
    if (cached) {
      setItems(cached);
      setLoadedDate(date);
    } else {
      fetchAndCache(date).then((result) => {
        if (cancelled) return;
        setItems(result);
        setLoadedDate(date);
      });
    }

    // 이전/다음 날짜를 미리 받아둔다(실패해도 조용히 무시 — 어차피
    // 그 날짜로 넘어갈 때 다시 시도된다).
    fetchAndCache(kstDatePlusDays(-1, date)).catch(() => {});
    fetchAndCache(kstDatePlusDays(1, date)).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [date]);

  const toggleItem = (item: TodoHistoryItem) => {
    const next = !item.completed;
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, completed: next } : it)));
    // 캐시된 이 날짜 스냅샷도 같이 갱신해둬야, 다른 날짜를 봤다 돌아와도
    // 체크한 상태가 유지된다.
    cacheRef.current.set(
      date,
      (cacheRef.current.get(date) ?? items).map((it) =>
        it.id === item.id ? { ...it, completed: next } : it
      )
    );
    setTodoCompleted(item.id, next);
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-10 bg-neutral-900/20" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed left-1/2 top-1/2 z-20 flex max-h-[80vh] w-[min(22rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 overflow-y-auto rounded-md border border-neutral-300 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setDate((d) => kstDatePlusDays(-1, d))}
            aria-label={t("prevDate")}
            className="rounded-md px-2 py-1 text-sm text-neutral-500 transition hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            ←
          </button>
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">{date}</p>
          <button
            type="button"
            onClick={() => setDate((d) => kstDatePlusDays(1, d))}
            aria-label={t("nextDate")}
            className="rounded-md px-2 py-1 text-sm text-neutral-500 transition hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            →
          </button>
        </div>

        {loading ? (
          <p className="py-4 text-center text-xs text-neutral-400">···</p>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-xs text-neutral-400">{t("historyEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleItem(item)}
                  aria-label={item.completed ? t("historyMarkIncomplete") : t("historyMarkComplete")}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] leading-none transition ${
                    item.completed
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-neutral-300 hover:border-neutral-400 dark:border-neutral-600 dark:hover:border-neutral-500"
                  }`}
                >
                  {item.completed ? "✓" : ""}
                </button>
                <span
                  className={`min-w-0 flex-1 truncate text-xs ${
                    item.completed
                      ? "text-neutral-400 line-through dark:text-neutral-600"
                      : "text-neutral-700 dark:text-neutral-200"
                  }`}
                >
                  {item.content}
                </span>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-1 self-end rounded-md border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          {t("historyClose")}
        </button>
      </div>
    </>
  );
}
