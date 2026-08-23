"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { recordFocusMinutes } from "@/lib/rooms";
import { logActivity } from "@/lib/activity";
import { effectiveRecordDate } from "@/lib/time";
import type { Phase } from "./room/[id]/use-pomodoro";

type ActiveRoom = { id: string; name: string } | null;

type PomodoroContextValue = {
  activeRoomId: string | null;
  activeRoomName: string | null;
  phase: Phase | "idle";
  running: boolean;
  started: boolean;
  remainingSeconds: number;
  elapsedFraction: number;
  accumulatedFocusSeconds: number;
  focusMinutes: number;
  breakMinutes: number;
  setFocusMinutes: (n: number) => void;
  setBreakMinutes: (n: number) => void;
  start: (room: { id: string; name: string }, initialFocusSeconds: number) => void;
  pause: () => void;
  reset: () => void;
};

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

// 방 페이지를 벗어나도(=이 프로바이더가 걸려있는 (main) 레이아웃 자체는
// 계속 살아있으므로) 뽀모도로가 멈추지 않고 계속 흘러가도록, 타이머
// 상태와 매분 서버 기록 로직을 방 페이지 트리 바깥(레이아웃)으로 끌어올렸다.
export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [activeRoom, setActiveRoom] = useState<ActiveRoom>(null);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<Phase>("focus");
  const [tickingSeconds, setTickingSeconds] = useState(25 * 60);
  const [accumulatedFocusSeconds, setAccumulatedFocusSeconds] = useState(0);

  const remainingRef = useRef(tickingSeconds);
  const sessionStartRef = useRef(0);
  const lastFlushedMinutesRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const next = remainingRef.current - 1;
      if (next > 0) {
        remainingRef.current = next;
        setTickingSeconds(next);
        if (phase === "focus") setAccumulatedFocusSeconds((s) => s + 1);
        return;
      }
      const nextPhase: Phase = phase === "focus" ? "break" : "focus";
      const nextDuration = (nextPhase === "focus" ? focusMinutes : breakMinutes) * 60;
      remainingRef.current = nextDuration;
      setPhase(nextPhase);
      setTickingSeconds(nextDuration);
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase, focusMinutes, breakMinutes]);

  useEffect(() => {
    if (!activeRoom) return;
    const currentMinutes = Math.floor(accumulatedFocusSeconds / 60);
    if (currentMinutes > lastFlushedMinutesRef.current) {
      const delta = currentMinutes - lastFlushedMinutesRef.current;
      lastFlushedMinutesRef.current = currentMinutes;
      recordFocusMinutes(activeRoom.id, delta, effectiveRecordDate(sessionStartRef.current));
    }
  }, [accumulatedFocusSeconds, activeRoom]);

  const doStart = useCallback(
    (room: { id: string; name: string }, initialFocusSeconds: number) => {
      const isNewRoom = activeRoom?.id !== room.id;
      if (isNewRoom || !started) {
        const duration = (phase === "focus" ? focusMinutes : breakMinutes) * 60;
        remainingRef.current = duration;
        setTickingSeconds(duration);
      }
      if (isNewRoom) {
        setActiveRoom(room);
        setAccumulatedFocusSeconds(initialFocusSeconds);
        lastFlushedMinutesRef.current = Math.floor(initialFocusSeconds / 60);
        sessionStartRef.current = Date.now();
      }
      if (isNewRoom || !started) {
        setStarted(true);
        logActivity(room.id, "session_start");
      }
      setRunning(true);
    },
    [activeRoom, started, phase, focusMinutes, breakMinutes]
  );

  const pause = useCallback(() => {
    setRunning(false);
    if (activeRoom) logActivity(activeRoom.id, "session_end");
  }, [activeRoom]);

  const reset = useCallback(() => {
    if (activeRoom && started) logActivity(activeRoom.id, "session_end");
    setRunning(false);
    setStarted(false);
    setPhase("focus");
    const duration = focusMinutes * 60;
    remainingRef.current = duration;
    setTickingSeconds(duration);
    setActiveRoom(null);
    setAccumulatedFocusSeconds(0);
    lastFlushedMinutesRef.current = 0;
  }, [activeRoom, started, focusMinutes]);

  const phaseDuration = (phase === "focus" ? focusMinutes : breakMinutes) * 60;
  const remainingSeconds = started ? tickingSeconds : phaseDuration;
  const elapsedFraction = started ? 1 - tickingSeconds / phaseDuration : 0;
  const displayPhase: Phase | "idle" = started ? phase : "idle";

  const value: PomodoroContextValue = {
    activeRoomId: activeRoom?.id ?? null,
    activeRoomName: activeRoom?.name ?? null,
    phase: displayPhase,
    running,
    started,
    remainingSeconds,
    elapsedFraction,
    accumulatedFocusSeconds,
    focusMinutes,
    breakMinutes,
    setFocusMinutes,
    setBreakMinutes,
    start: doStart,
    pause,
    reset,
  };

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}

export function usePomodoroContext() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoroContext must be used within PomodoroProvider");
  return ctx;
}
