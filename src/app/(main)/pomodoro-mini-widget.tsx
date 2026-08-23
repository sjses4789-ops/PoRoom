"use client";

import { usePathname, useRouter } from "next/navigation";
import { usePomodoroContext } from "./pomodoro-context";

const PHASE_COLOR: Record<"focus" | "break", string> = {
  focus: "#c17b7b",
  break: "#7b93c1",
};

export function PomodoroMiniWidget() {
  const pomodoro = usePomodoroContext();
  const pathname = usePathname();
  const router = useRouter();

  if (!pomodoro.activeRoomId || !pomodoro.started) return null;
  if (pomodoro.activeRoomIsSystem) return null;
  if (pathname === `/room/${pomodoro.activeRoomId}`) return null;

  const mm = String(Math.floor(pomodoro.remainingSeconds / 60)).padStart(2, "0");
  const ss = String(pomodoro.remainingSeconds % 60).padStart(2, "0");
  const phase = pomodoro.phase === "break" ? "break" : "focus";
  const phaseLabel = pomodoro.phase === "focus" ? "집중 중" : "휴식 중";

  return (
    <button
      onClick={() => router.push(`/room/${pomodoro.activeRoomId}`)}
      className="fixed bottom-4 right-4 z-40 flex items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-2.5 shadow-lg transition hover:shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${pomodoro.running ? "animate-pulse" : ""}`}
        style={{ backgroundColor: PHASE_COLOR[phase] }}
      />
      <span className="flex flex-col items-start leading-tight">
        <span className="max-w-[10rem] truncate text-[11px] text-neutral-400">
          {pomodoro.activeRoomName} · {phaseLabel}
        </span>
        <span className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-white">
          {mm}:{ss}
        </span>
      </span>
    </button>
  );
}
