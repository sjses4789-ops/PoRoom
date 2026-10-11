"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

// 내가 차단한 참여자 목록 — 차단한 사람은 참여자 목록에서 숨겨지므로, 여기서 차단을 풀 수 있다.
export function BlockedListDialog({
  members,
  onUnblock,
  onClose,
}: {
  members: { id: string; name: string }[];
  onUnblock: (id: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations("room.participantMenu");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-neutral-900/40" />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 z-[60] flex max-h-[80vh] w-[min(22rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-md border border-neutral-300 bg-white p-5 text-left shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">{t("blockedListTitle")}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        </div>
        <p className="text-[12px] text-neutral-400">{t("blockedListHint")}</p>
        <ul className="flex flex-col gap-1.5 overflow-y-auto">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700"
            >
              <span className="min-w-0 truncate text-neutral-800 dark:text-neutral-200">{m.name}</span>
              <button
                type="button"
                onClick={() => onUnblock(m.id)}
                className="shrink-0 rounded-md border border-neutral-200 px-2.5 py-1 text-xs text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {t("unblock")}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
