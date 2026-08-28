"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { createChallenge } from "@/lib/challenges";
import type { ActionResult } from "@/lib/rooms";
import { PALETTE, paletteDot } from "@/lib/palette";

const DURATION_OPTIONS = [3, 7, 14, 30] as const;

export default function CreateChallengeButton() {
  const t = useTranslations("compete.createChallengeButton");
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState<string>(PALETTE[0].key);
  const [capacity, setCapacity] = useState("");
  const [startMode, setStartMode] = useState<"manual" | "full">("manual");
  const [targetPosition, setTargetPosition] = useState<"novelist" | "webtoon" | "">("");
  const [metric, setMetric] = useState<"chars" | "minutes">("chars");
  const hasCapacity = capacity.trim() !== "";
  // 글자수/컷수는 직업마다 단위가 달라서, "모두"(대상 제한 없음)로는
  // 집중 시간 기준만 고를 수 있다.
  const charsMetricDisabled = targetPosition === "";
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createChallenge,
    null
  );

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700"
      >
        {t("trigger")}
      </button>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 bg-neutral-900/20"
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-20 flex max-h-[85vh] w-[min(20rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 overflow-y-auto rounded-md border border-neutral-300 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <form action={formAction} className="flex flex-col gap-3">
            <input
              name="title"
              placeholder={t("namePlaceholder")}
              className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
            />

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                {t("targetPositionLabel")}
              </span>
              <input type="hidden" name="targetPosition" value={targetPosition} />
              <div className="flex gap-3">
                {(
                  [
                    { value: "", label: t("targetPositionAny") },
                    { value: "novelist", label: t("targetPositionNovelist") },
                    { value: "webtoon", label: t("targetPositionWebtoon") },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300"
                  >
                    <input
                      type="radio"
                      checked={targetPosition === opt.value}
                      onChange={() => {
                        setTargetPosition(opt.value);
                        // "모두"로 바꾸면 글자수/컷수는 고를 수 없으니
                        // 집중 시간으로 자동 전환한다.
                        if (opt.value === "") setMetric("minutes");
                      }}
                      className="accent-neutral-900"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                {t("metricLabel")}
              </span>
              <div className="flex gap-3">
                <label
                  className={`flex items-center gap-1.5 text-xs ${
                    charsMetricDisabled
                      ? "text-neutral-300 dark:text-neutral-600"
                      : "text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="metric"
                    value="chars"
                    checked={metric === "chars"}
                    disabled={charsMetricDisabled}
                    onChange={() => setMetric("chars")}
                    className="accent-neutral-900"
                  />
                  {targetPosition === "webtoon" ? t("metricCuts") : t("metricChars")}
                </label>
                <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="radio"
                    name="metric"
                    value="minutes"
                    checked={metric === "minutes"}
                    onChange={() => setMetric("minutes")}
                    className="accent-neutral-900"
                  />
                  {t("metricMinutes")}
                </label>
              </div>
              {charsMetricDisabled && (
                <p className="text-[11px] text-neutral-400">{t("metricCharsDisabledHint")}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                {t("visibilityLabel")}
              </span>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="radio"
                    name="visibility"
                    value="open"
                    defaultChecked
                    className="accent-neutral-900"
                  />
                  {t("visibilityOpen")}
                </label>
                <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    className="accent-neutral-900"
                  />
                  {t("visibilityPrivate")}
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                {t("durationLabel")}
              </span>
              <div className="flex gap-3">
                {DURATION_OPTIONS.map((d, i) => (
                  <label
                    key={d}
                    className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300"
                  >
                    <input
                      type="radio"
                      name="durationDays"
                      value={d}
                      defaultChecked={i === 1}
                      className="accent-neutral-900"
                    />
                    {t("durationDays", { count: d })}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                {t("colorLabel")}
              </span>
              <input type="hidden" name="color" value={color} />
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

            <input
              name="capacity"
              type="number"
              min={2}
              value={capacity}
              onChange={(e) => {
                const v = e.target.value;
                setCapacity(v);
                if (v.trim() === "") setStartMode("manual");
              }}
              placeholder={t("capacityPlaceholder")}
              className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
            />

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                {t("startModeLabel")}
              </span>
              <input type="hidden" name="startMode" value={startMode} />
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="radio"
                    checked={startMode === "manual"}
                    onChange={() => setStartMode("manual")}
                    className="accent-neutral-900"
                  />
                  {t("startModeManual")}
                </label>
                <label
                  className={`flex items-center gap-1.5 text-xs ${
                    hasCapacity
                      ? "text-neutral-700 dark:text-neutral-300"
                      : "text-neutral-300 dark:text-neutral-600"
                  }`}
                >
                  <input
                    type="radio"
                    checked={startMode === "full"}
                    disabled={!hasCapacity}
                    onChange={() => setStartMode("full")}
                    className="accent-neutral-900"
                  />
                  {t("startModeFull")}
                </label>
              </div>
              {!hasCapacity && (
                <p className="text-[11px] text-neutral-400">{t("startModeFullDisabledHint")}</p>
              )}
            </div>

            <p className="text-[12px] text-neutral-400">
              {t("hint")}
            </p>

            {state?.error && (
              <p className="text-xs text-red-500">{state.error}</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
            >
              {pending ? t("creating") : t("create")}
            </button>
          </form>
          </div>
        </>
      )}
    </>
  );
}
