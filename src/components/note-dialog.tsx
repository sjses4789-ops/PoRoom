"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { NOTE_MAX_LENGTH } from "@/lib/notes-limits";

// 쪽지 쓰기 팝업 — onSubmit이 오류 문구를 돌려주면 그대로 보여 주고, 성공하면 보냈다는 안내를 보여 준다.
export function NoteDialog({
  targetName,
  onSubmit,
  onClose,
}: {
  targetName: string;
  onSubmit: (content: string) => Promise<string | null>;
  onClose: () => void;
}) {
  const t = useTranslations("notes.compose");
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!content.trim() || pending) return;
    setPending(true);
    setError(null);
    const message = await onSubmit(content);
    setPending(false);
    if (message) setError(message);
    else setSent(true);
  };

  return (
    <>
      <div onClick={() => !pending && onClose()} className="fixed inset-0 z-50 bg-neutral-900/40" />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 z-[60] flex w-[min(24rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-md border border-neutral-300 bg-white p-5 text-left shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title", { name: targetName })}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        </div>

        {sent ? (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">{t("sent")}</p>
            <button
              type="button"
              onClick={onClose}
              className="self-end rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
            >
              {t("close")}
            </button>
          </>
        ) : (
          <>
            <textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={NOTE_MAX_LENGTH}
              rows={6}
              placeholder={t("placeholder")}
              className="resize-none rounded-md border border-neutral-200 px-2.5 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>
                {content.length} / {NOTE_MAX_LENGTH}
              </span>
              {error && <span className="text-red-500">{error}</span>}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending || !content.trim()}
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
              >
                {pending ? t("sending") : t("send")}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
