"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getTodosForDate, type TodoHistoryItem } from "@/lib/todos";
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

  useEffect(() => {
    let cancelled = false;
    getTodosForDate(date).then((result) => {
      if (cancelled) return;
      setItems(result);
      setLoadedDate(date);
    });
    return () => {
      cancelled = true;
    };
  }, [date]);

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
                <span
                  aria-hidden
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] leading-none ${
                    item.completed
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-neutral-300 dark:border-neutral-600"
                  }`}
                >
                  {item.completed ? "✓" : ""}
                </span>
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
