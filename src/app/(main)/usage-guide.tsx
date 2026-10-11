"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

const ITEMS = [
  { key: "main", image: "/howto/main.webp", width: 960, height: 480 },
  { key: "room", image: "/howto/room.webp", width: 960, height: 771 },
  { key: "feed", image: "/howto/feed.webp", width: 960, height: 480 },
  { key: "compete", image: "/howto/compete.webp", width: 960, height: 480 },
  { key: "ranking", image: "/howto/ranking.webp", width: 960, height: 480 },
  { key: "rest", image: "/howto/rest.webp", width: 960, height: 480 },
] as const;

type ItemKey = (typeof ITEMS)[number]["key"];

// 푸터의 "이용 가이드"를 누르면 뜨는 안내창 — [포룸]·[방]·[피드]·[도전]·[랭킹]·[휴식]의 사용법을 실제 화면
// 사진과 함께 설명한다.
function UsageGuideModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("usageGuide");
  const [active, setActive] = useState<ItemKey>("main");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const item = ITEMS.find((i) => i.key === active) ?? ITEMS[0];
  const steps = t.raw(`items.${item.key}.steps`) as string[];

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-neutral-900/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="fixed left-1/2 top-1/2 z-[60] flex max-h-[90vh] w-[min(56rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-neutral-300 bg-white text-left text-sm text-neutral-900 shadow-xl dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-3 dark:border-neutral-800">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</h2>
            <p className="text-[11px] font-normal text-neutral-400">{t("subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="shrink-0 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-neutral-100 px-5 py-2.5 dark:border-neutral-800">
          {ITEMS.map((i) => (
            <button
              key={i.key}
              type="button"
              onClick={() => setActive(i.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                active === i.key
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              {t(`items.${i.key}.tab`)}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{t(`items.${item.key}.title`)}</h3>
            <p className="mt-1 text-[13px] font-normal text-neutral-500 dark:text-neutral-400">
              {t(`items.${item.key}.intro`)}
            </p>
          </div>
          <Image
            src={item.image}
            alt={t(`items.${item.key}.title`)}
            width={item.width}
            height={item.height}
            sizes="(min-width: 896px) 840px, 100vw"
            className="h-auto w-full rounded-md border border-neutral-200 dark:border-neutral-700"
          />
          <ul className="flex flex-col gap-2.5 text-[13px] font-normal leading-relaxed text-neutral-700 dark:text-neutral-300">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-neutral-400" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
          <p className="border-t border-neutral-100 pt-3 text-[12px] font-normal text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <Link href="/guide" className="underline hover:text-neutral-900 dark:hover:text-white">
              {t("writerGuideLink")}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

// 푸터에 놓는 "이용 가이드" 링크 — 누르면 사용 방법 안내창이 뜬다.
export function UsageGuideFooterLink({ label, className }: { label: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      {open && <UsageGuideModal onClose={() => setOpen(false)} />}
    </>
  );
}
