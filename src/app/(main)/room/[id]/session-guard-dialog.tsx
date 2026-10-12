"use client";

import { useTranslations } from "next-intl";

// 같은 계정이 다른 브라우저/기기에서 같은 방에 동시에 접속하는 경우를 막는 안내창.
//  - duplicate: 내가 나중에 들어온 쪽 — "이 화면에서 계속"을 고르면 먼저 접속해 있던 쪽이 밀려난다.
//  - takenOver: 내가 먼저 접속해 있었는데 다른 곳에서 이어받은 쪽 — 이 화면은 더 쓸 수 없다.
export function SessionGuardDialog({
  kind,
  onContinue,
  onLeave,
}: {
  kind: "duplicate" | "takenOver";
  onContinue: () => void;
  onLeave: () => void;
}) {
  const t = useTranslations("room.sessionGuard");
  const duplicate = kind === "duplicate";

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-neutral-900/60" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-guard-title"
        className="fixed left-1/2 top-1/2 z-[80] flex w-[min(24rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-lg border border-neutral-300 bg-white p-5 text-left shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
      >
        <p id="session-guard-title" className="text-sm font-semibold text-neutral-900 dark:text-white">
          ⚠️ {duplicate ? t("duplicateTitle") : t("takenOverTitle")}
        </p>
        <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {duplicate ? t("duplicateBody") : t("takenOverBody")}
        </p>
        {duplicate && <p className="text-[12px] text-neutral-400">{t("continueHint")}</p>}
        <div className="mt-1 flex flex-col gap-2">
          {duplicate && (
            <button
              type="button"
              onClick={onContinue}
              className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {t("continueHere")}
            </button>
          )}
          <button
            type="button"
            onClick={onLeave}
            className="rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {duplicate ? t("leave") : t("ok")}
          </button>
        </div>
      </div>
    </>
  );
}
