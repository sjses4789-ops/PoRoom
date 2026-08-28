"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// this is a free-text status the user picks or types (not a fixed enum
// used elsewhere in the app), so unlike room tags we store and broadcast
// the actual translated label the user saw and picked, in their locale.
const NOVELIST_PRESET_KEYS = [
  "brainstorming",
  "drafting",
  "revising",
  "proofreading",
  "research",
  "resting",
  "away",
] as const;

// 웹툰 작가는 집필 단계 대신 만화 제작 공정 단계를 고른다.
const WEBTOON_PRESET_KEYS = [
  "idea",
  "webtoonResearch",
  "storyboard",
  "background",
  "sketch",
  "inking",
  "coloring",
  "postEdit",
  "finishing",
] as const;

export function WorkStatusPicker({
  current,
  onChange,
  onPastelBg = false,
  position = "novelist",
}: {
  current: string | null;
  onChange: (status: string | null) => void;
  // true when the picker sits on a fixed-light work-status pastel card
  // background, which stays light regardless of theme.
  onPastelBg?: boolean;
  position?: "novelist" | "webtoon";
}) {
  const t = useTranslations("room.workStatusPicker");
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState(current ?? "");
  const presetKeys = position === "webtoon" ? WEBTOON_PRESET_KEYS : NOVELIST_PRESET_KEYS;

  const choose = (status: string | null) => {
    onChange(status);
    setOpen(false);
    setCustomMode(false);
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] font-medium transition hover:bg-neutral-50 dark:border-neutral-600 dark:hover:bg-neutral-800 ${
          onPastelBg ? "text-neutral-600" : "text-neutral-600 dark:text-neutral-300"
        }`}
      >
        {current ?? t("setStatus")}
      </button>

      {open && (
        <>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            className="fixed inset-0 z-10 bg-neutral-900/20"
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-20 w-[min(16rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-md border border-neutral-300 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
          >
            {!customMode ? (
              <div className="flex flex-col gap-1">
                {current && (
                  <button
                    onClick={() => choose(null)}
                    className="rounded-md px-2 py-1.5 text-left text-xs text-neutral-400 hover:bg-neutral-50"
                  >
                    {t("clearStatus")}
                  </button>
                )}
                {presetKeys.map((key) => {
                  const label = t(`presets.${key}`);
                  return (
                    <button
                      key={key}
                      onClick={() => choose(label)}
                      className={`rounded-md px-2 py-1.5 text-left text-xs transition ${
                        current === label
                          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                          : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCustomMode(true)}
                  className="rounded-md px-2 py-1.5 text-left text-xs text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {t("customInput")}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  autoFocus
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customText.trim()) {
                      choose(customText.trim());
                    }
                  }}
                  maxLength={20}
                  placeholder={t("customPlaceholder")}
                  className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={() => customText.trim() && choose(customText.trim())}
                    className="flex-1 rounded-md bg-neutral-900 px-2 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                  >
                    {t("confirm")}
                  </button>
                  <button
                    onClick={() => setCustomMode(false)}
                    className="flex-1 rounded-md border border-neutral-200 px-2 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    {t("cancel")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
