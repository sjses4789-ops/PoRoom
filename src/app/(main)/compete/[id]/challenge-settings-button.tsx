"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateChallengeSettings } from "@/lib/challenges";
import { PALETTE, paletteDot } from "@/lib/palette";

const DURATION_OPTIONS = [3, 7, 14, 30] as const;

export function ChallengeSettingsButton({
  challengeId,
  currentTitle,
  currentColor,
  currentCapacity,
  currentDurationDays,
  started,
}: {
  challengeId: string;
  currentTitle: string;
  currentColor: string | null;
  currentCapacity: number | null;
  currentDurationDays: number;
  started: boolean;
}) {
  const t = useTranslations("compete.challengeSettingsButton");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [color, setColor] = useState<string>(currentColor ?? PALETTE[0].key);
  const [capacity, setCapacity] = useState(currentCapacity != null ? String(currentCapacity) : "");
  const [durationDays, setDurationDays] = useState(currentDurationDays);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setPending(true);
    setError(null);
    const result = await updateChallengeSettings(challengeId, {
      title,
      color,
      capacity: capacity.trim() ? Number(capacity) : null,
      durationDays,
    });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {t("trigger")}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-10 bg-neutral-900/20" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-20 flex max-h-[85vh] w-[min(20rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 overflow-y-auto rounded-md border border-neutral-300 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
          >
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</p>

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                {t("nameLabel")}
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                {t("colorLabel")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PALETTE.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setColor(p.key)}
                    title={p.label}
                    className={`h-6 w-6 rounded-full ${paletteDot(p.key)} transition ${
                      color === p.key
                        ? "ring-2 ring-neutral-900 ring-offset-2"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                {t("capacityLabel")}
              </span>
              <input
                type="number"
                min={2}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                {t("durationLabel")}
              </span>
              <div className="flex gap-3">
                {DURATION_OPTIONS.map((d) => (
                  <label
                    key={d}
                    className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300"
                  >
                    <input
                      type="radio"
                      checked={durationDays === d}
                      onChange={() => setDurationDays(d)}
                      className="accent-neutral-900"
                    />
                    {t("durationDays", { count: d })}
                  </label>
                ))}
              </div>
              {started && <p className="text-[11px] text-amber-600">{t("durationHintStarted")}</p>}
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className="rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {pending ? t("saving") : t("save")}
            </button>
          </div>
        </>
      )}
    </>
  );
}
