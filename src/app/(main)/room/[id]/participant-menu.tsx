"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { REPORT_MAX_LENGTH } from "@/lib/safety-limits";

export type MenuTarget = { id: string; name: string; x: number; y: number };

// 참여자 카드를 우클릭했을 때 뜨는 작은 메뉴 — 차단/차단 해제, 신고(, 방장이면 방에서 내보내기).
export function ParticipantContextMenu({
  target,
  isBlocked,
  canKick,
  onNote,
  onToggleBlock,
  onReport,
  onKick,
  onClose,
}: {
  target: MenuTarget;
  isBlocked: boolean;
  canKick: boolean;
  onNote: () => void;
  onToggleBlock: () => void;
  onReport: () => void;
  onKick: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("room.participantMenu");
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: target.x, top: target.y });

  // 화면 밖으로 나가지 않게 위치를 맞춘다.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const left = Math.min(target.x, window.innerWidth - rect.width - 8);
    const top = Math.min(target.y, window.innerHeight - rect.height - 8);
    setPos({ left: Math.max(8, left), top: Math.max(8, top) });
  }, [target.x, target.y]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  const itemClass =
    "block w-full px-3 py-2 text-left text-xs text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800";

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div
        ref={ref}
        role="menu"
        style={{ left: pos.left, top: pos.top }}
        className="fixed z-50 min-w-[9rem] overflow-hidden rounded-md border border-neutral-300 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
      >
        <p className="truncate border-b border-neutral-100 px-3 py-1.5 text-[11px] font-medium text-neutral-400 dark:border-neutral-800">
          {target.name}
        </p>
        <button type="button" role="menuitem" className={itemClass} onClick={onNote}>
          {t("note")}
        </button>
        <button type="button" role="menuitem" className={itemClass} onClick={onToggleBlock}>
          {isBlocked ? t("unblock") : t("block")}
        </button>
        <button type="button" role="menuitem" className={itemClass} onClick={onReport}>
          {t("report")}
        </button>
        {canKick && (
          <button
            type="button"
            role="menuitem"
            className={`${itemClass} text-red-500 dark:text-red-400`}
            onClick={onKick}
          >
            {t("kick")}
          </button>
        )}
      </div>
    </>
  );
}

// 신고 안내창 — 신고 이유를 적어 보낸다. onSubmit이 오류 문구를 돌려주면 그대로 보여 준다.
export function ReportDialog({
  targetName,
  onSubmit,
  onClose,
}: {
  targetName: string;
  onSubmit: (reason: string) => Promise<string | null>;
  onClose: () => void;
}) {
  const t = useTranslations("room.reportDialog");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!reason.trim() || pending) return;
    setPending(true);
    setError(null);
    const message = await onSubmit(reason);
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
        className="fixed left-1/2 top-1/2 z-[60] flex w-[min(24rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-md border border-neutral-300 bg-white p-5 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
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
            <p className="text-[12px] text-neutral-400">{t("hint")}</p>
            <textarea
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={REPORT_MAX_LENGTH}
              rows={5}
              placeholder={t("placeholder")}
              className="resize-none rounded-md border border-neutral-200 px-2.5 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>
                {reason.length} / {REPORT_MAX_LENGTH}
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
                disabled={pending || !reason.trim()}
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
              >
                {pending ? t("sending") : t("submit")}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
