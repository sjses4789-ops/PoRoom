"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function PosterViewButton({ imageUrl }: { imageUrl: string }) {
  const t = useTranslations("compete.posterViewButton");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {t("trigger")}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-10 bg-neutral-900/60" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-20 flex max-h-[85vh] w-[min(32rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-2 overflow-y-auto rounded-md border border-neutral-300 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</span>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>
            {/* 관리자가 올린 임의 크기 공모전 공고 이미지라 next/image의
                고정 비율 최적화 대신 원본 비율 그대로 보여준다. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={t("title")} className="w-full rounded-md" />
          </div>
        </>
      )}
    </>
  );
}
