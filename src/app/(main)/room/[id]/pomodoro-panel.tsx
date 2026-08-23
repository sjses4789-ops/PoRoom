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
  onChangeFocus: (v: number) => void;
  onChangeBreak: (v: number) => void;
  started: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
}) {
  const color = PHASE_COLOR[phase];
  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const ss = String(remainingSeconds % 60).padStart(2, "0");
  const label =
    phase === "idle" ? "대기 중" : !running ? "일시정지" : phase === "focus" ? "집중 중" : "휴식 중";

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
      <div className="flex flex-col items-center gap-2">
        <PomodoroDonut
          progress={elapsedFraction}
          color={color}
          size={140}
          strokeWidth={20}
          label={`${mm}:${ss}`}
        />
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
      </div>

      <div className="flex items-center justify-center gap-4">
        <label className="flex flex-col items-center gap-1 text-[12px] text-neutral-500">
          집중(분)
          <input
            type="number"
            min={1}
            value={focusMinutes}
            disabled={started}
            onChange={(e) => onChangeFocus(Number(e.target.value) || 1)}
            className="w-14 rounded-md border border-neutral-200 px-1.5 py-1 text-center text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400 disabled:bg-neutral-50"
          />
        </label>
        <label className="flex flex-col items-center gap-1 text-[12px] text-neutral-500">
          휴식(분)
          <input
            type="number"
            min={1}
            value={breakMinutes}
            disabled={started}
            onChange={(e) => onChangeBreak(Number(e.target.value) || 1)}
            className="w-14 rounded-md border border-neutral-200 px-1.5 py-1 text-center text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400 disabled:bg-neutral-50"
          />
        </label>
      </div>

      <div className="flex w-full gap-2">
        {!running ? (
          <button
            onClick={start}
            className="flex-1 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700"
          >
            {started ? "재개" : "시작"}
          </button>
        ) : (
          <button
            onClick={pause}
            className="flex-1 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            일시정지
          </button>
        )}
        <button
          onClick={reset}
          className="flex-1 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          초기화
        </button>
      </div>
    </div>
  );
}
