"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { setPosition, type ProfilePosition } from "@/lib/profile";

const POSITIONS: ProfilePosition[] = ["novelist", "webtoon"];

export function PositionButton({
  initialPosition,
}: {
  initialPosition: ProfilePosition | null;
}) {
  const t = useTranslations("me.positionButton");
  const [open, setOpen] = useState(false);
  const [position, setLocalPosition] = useState(initialPosition);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {t("trigger")}
        {position && <span className="ml-1 text-neutral-400">({t(`position.${position}`)})</span>}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 bg-neutral-900/30"
          />
          <div className="fixed left-1/2 top-1/2 z-20 w-[min(20rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-neutral-300 bg-white p-5 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {t("title")}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {POSITIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setLocalPosition(p);
                    setOpen(false);
                    startTransition(() => {
                      setPosition(p);
                    });
                  }}
                  className={`rounded-md border-2 px-3 py-2.5 text-left text-sm font-medium transition ${
                    position === p
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                      : "border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  }`}
                >
                  {t(`position.${p}`)}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-neutral-400">{t("hint")}</p>
          </div>
        </>
      )}
    </div>
  );
}
