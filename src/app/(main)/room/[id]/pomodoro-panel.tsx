import { useTranslations } from "next-intl";
import { PomodoroDonut } from "./pomodoro-donut";
import type { Phase } from "./use-pomodoro";

const PHASE_COLOR: Record<Phase | "idle", string> = {
  focus: "#c17b7b",
  break: "#7b93c1",
  idle: "#d4d4d4",
};

export function PomodoroPanel({
  phase,
  running,
  remainingSeconds,
  elapsedFraction,
  focusMinutes,
  breakMinutes,
  focusSessionCount,
  onChangeFocus,
  onChangeBreak,
  started,
  start,
  pause,
  reset,
}: {
  phase: Phase | "idle";
  running: boolean;
  remainingSeconds: number;
  elapsedFraction: number;
  focusMinutes: number;
  breakMinutes: number;
  focusSessionCount: number;
  onChangeFocus: (v: number) => void;
  onChangeBreak: (v: number) => void;
  started: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
}) {
  const t = useTranslations("room.pomodoroPanel");
  const color = PHASE_COLOR[phase];
  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const ss = String(remainingSeconds % 60).padStart(2, "0");
  const label = t(
    phase === "idle" ? "status.idle" : !running ? "status.paused" : `status.${phase}`
  );

  return (
    <div className="flex flex-col items-center gap-4 overflow-hidden rounded-sm border border-neutral-400 p-6 dark:border-neutral-600">
      <div className="flex flex-col items-center gap-2">
        <PomodoroDonut
          progress={elapsedFraction}
          color={color}
          size={140}
          strokeWidth={20}
          label={`${mm}:${ss}`}
          subLabel={focusSessionCount > 0 ? t("focusCount", { count: focusSessionCount }) : undefined}
        />
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
      </div>

      <div className="flex items-end justify-center gap-2">
        <label className="flex flex-col items-center gap-1 text-[12px] text-neutral-500">
          {t("focusLabel")}
          <input
            type="number"
            min={1}
            value={focusMinutes}
            disabled={started}
            onChange={(e) => onChangeFocus(Number(e.target.value) || 1)}
            className="w-14 rounded-md border border-neutral-200 bg-white px-1.5 py-1 text-center text-sm text-neutral-900 outline-none focus:border-neutral-400 disabled:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:disabled:bg-neutral-800 dark:disabled:text-neutral-300"
          />
        </label>
        <label className="flex flex-col items-center gap-1 text-[12px] text-neutral-500">
          {t("breakLabel")}
          <input
            type="number"
            min={1}
            value={breakMinutes}
            disabled={started}
            onChange={(e) => onChangeBreak(Number(e.target.value) || 1)}
            className="w-14 rounded-md border border-neutral-200 bg-white px-1.5 py-1 text-center text-sm text-neutral-900 outline-none focus:border-neutral-400 disabled:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:disabled:bg-neutral-800 dark:disabled:text-neutral-300"
          />
        </label>
        <div className="flex gap-1.5">
          {!running ? (
            <button
              onClick={start}
              aria-label={started ? t("resume") : t("start")}
              title={started ? t("resume") : t("start")}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 text-sm text-white transition hover:bg-neutral-700"
            >
              ▶
            </button>
          ) : (
            <button
              onClick={pause}
              aria-label={t("pause")}
              title={t("pause")}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-sm text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              ❚❚
            </button>
          )}
          <button
            onClick={reset}
            aria-label={t("reset")}
            title={t("reset")}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-sm text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            ↺
          </button>
        </div>
      </div>
    </div>
  );
}
