"use client";

import { useTranslations } from "next-intl";
import type { Member } from "./room-view";

// 귓속말 상대 목록(왼쪽)과 사진 첨부 메뉴(오른쪽)가 있는 팝업.
export function WhisperTargetPicker({
  members,
  selfId,
  onPick,
  onOff,
  onClose,
  onAttach,
}: {
  members: Member[];
  selfId: string;
  onPick: (userId: string) => void;
  onOff: () => void;
  onClose: () => void;
  onAttach: () => void;
}) {
  const t = useTranslations("room.chatPanel");
  const others = members.filter((m) => m.id !== selfId);

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-10 bg-neutral-900/20" />
      <div className="fixed left-1/2 top-1/2 z-20 flex w-[min(24rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-md border border-neutral-300 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
        <div className="min-w-0 flex-1 p-3">
          <p className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {t("whisperPickTitle")}
          </p>
          <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            <button
              type="button"
              onClick={onOff}
              className="rounded-md px-2.5 py-1.5 text-left text-sm text-neutral-500 transition hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              {t("whisperOff")}
            </button>
            {others.length === 0 ? (
              <p className="px-2.5 py-1.5 text-xs text-neutral-400">{t("whisperNoOthers")}</p>
            ) : (
              others.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onPick(m.id)}
                  className="truncate rounded-md px-2.5 py-1.5 text-left text-sm text-neutral-800 transition hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  {m.name}
                </button>
              ))
            )}
          </div>
        </div>
        <div className="w-32 shrink-0 border-l border-neutral-200 p-3 dark:border-neutral-700">
          <p className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t("attachMenuTitle")}</p>
          <button
            type="button"
            onClick={onAttach}
            className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left text-sm text-neutral-800 transition hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <span aria-hidden>📷</span>
            {t("attachPhoto")}
          </button>
        </div>
      </div>
    </>
  );
}
