"use client";

import { useTranslations } from "next-intl";
import type { Member } from "./room-view";

export function WhisperTargetPicker({
  members,
  selfId,
  onPick,
  onOff,
  onClose,
}: {
  members: Member[];
  selfId: string;
  onPick: (userId: string) => void;
  onOff: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("room.chatPanel");
  const others = members.filter((m) => m.id !== selfId);

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-10 bg-neutral-900/20" />
      <div className="fixed left-1/2 top-1/2 z-20 w-[min(16rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-md border border-neutral-300 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
        <p className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
          {t("whisperPickTitle")}
        </p>
        <div className="flex flex-col gap-1">
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
                className="rounded-md px-2.5 py-1.5 text-left text-sm text-neutral-800 transition hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {m.name}
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
