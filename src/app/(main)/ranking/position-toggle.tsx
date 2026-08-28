"use client";

import { useTranslations } from "next-intl";

// 다크모드 토글(theme-toggle.tsx)과 같은 트랙+움직이는 알약 모양으로,
// 랭킹을 웹소설 작가/웹툰 작가 기준으로 바꿔 보는 스위치.
export function PositionToggle({
  value,
  onChange,
}: {
  value: "novelist" | "webtoon";
  onChange: (next: "novelist" | "webtoon") => void;
}) {
  const t = useTranslations("ranking.positionToggle");
  const isWebtoon = value === "webtoon";

  return (
    <button
      type="button"
      onClick={() => onChange(isWebtoon ? "novelist" : "webtoon")}
      aria-pressed={isWebtoon}
      aria-label={t("aria")}
      title={t("aria")}
      className="relative flex h-6 w-[92px] shrink-0 items-center rounded-full border border-neutral-300 bg-neutral-100 p-0.5 text-[10px] font-medium transition dark:border-neutral-600 dark:bg-neutral-800"
    >
      <span
        className={`absolute top-0.5 h-5 w-[44px] rounded-full bg-white shadow transition-transform duration-200 dark:bg-neutral-950 ${
          isWebtoon ? "translate-x-[44px]" : "translate-x-0"
        }`}
      />
      <span
        className={`relative z-10 flex-1 text-center transition-colors ${
          isWebtoon ? "text-neutral-400" : "text-neutral-900 dark:text-white"
        }`}
      >
        {t("novelist")}
      </span>
      <span
        className={`relative z-10 flex-1 text-center transition-colors ${
          isWebtoon ? "text-neutral-900 dark:text-white" : "text-neutral-400"
        }`}
      >
        {t("webtoon")}
      </span>
    </button>
  );
}
