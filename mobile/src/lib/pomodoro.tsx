import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { rpc } from "./api";
import { effectiveRecordDate } from "./time";
import { syncPomodoroNotifications } from "./pomodoro-notifications";

export type Phase = "focus" | "break";
export type ActiveRoom = { id: string; name: string } | null;

type PomodoroContextValue = {
  activeRoom: ActiveRoom;
  phase: Phase | "idle";
  running: boolean;
  started: boolean;
  remainingSeconds: number;
  elapsedFraction: number;
  phaseDurationSeconds: number;
  focusMinutes: number;
  breakMinutes: number;
  focusSessionCount: number;
  accumulatedFocusSeconds: number;
  setFocusMinutes: (n: number) => void;
  setBreakMinutes: (n: number) => void;
  start: (room: { id: string; name: string }) => void;
  pause: () => void;
  reset: () => void;
};

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

// 웹(src/app/(main)/pomodoro-context.tsx)과 같은 방식의 타이머를 앱이 직접 돌린다.
// 틱마다 "1초 지났다"고 가정하지 않고 진짜 시계(Date.now())로 지난 시간을 계산해서
// 따라잡기 때문에, 앱이 잠깐 멈췄다 돌아와도 시간이 어긋나지 않는다.
// 집중/휴식 시간은 1분이 찰 때마다 웹과 같은 서버 로직(recordFocusMinutes 등)으로 기록한다.
export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [activeRoom, setActiveRoom] = useState<ActiveRoom>(null);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<Phase>("focus");
  const [tickingSeconds, setTickingSeconds] = useState(25 * 60);
  const [accumulatedFocusSeconds, setAccumulatedFocusSeconds] = useState(0);
  const [accumulatedBreakSeconds, setAccumulatedBreakSeconds] = useState(0);
  const [focusSessionCount, setFocusSessionCount] = useState(0);

  const remainingRef = useRef(tickingSeconds);
  const phaseRef = useRef<Phase>("focus");
  const focusMinutesRef = useRef(focusMinutes);
  const breakMinutesRef = useRef(breakMinutes);
  const lastTickAtRef = useRef(0);
  const sessionStartRef = useRef(0);
  const flushedFocusRef = useRef(0);
  const flushedBreakRef = useRef(0);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    focusMinutesRef.current = focusMinutes;
  }, [focusMinutes]);
  useEffect(() => {
    breakMinutesRef.current = breakMinutes;
  }, [breakMinutes]);

  const catchUp = useCallback(() => {
    const now = Date.now();
    const elapsedMs = now - lastTickAtRef.current;
    lastTickAtRef.current = now - (elapsedMs % 1000);
    let elapsedSec = Math.floor(elapsedMs / 1000);
    if (elapsedSec <= 0) return;

    let localPhase = phaseRef.current;
    let localRemaining = remainingRef.current;
    let focusDelta = 0;
    let breakDelta = 0;
    let sessionDelta = 0;
    let transitioned = false;

    while (elapsedSec > 0) {
      if (elapsedSec < localRemaining) {
        if (localPhase === "focus") focusDelta += elapsedSec;
        else breakDelta += elapsedSec;
        localRemaining -= elapsedSec;
        elapsedSec = 0;
      } else {
        if (localPhase === "focus") focusDelta += localRemaining;
        else breakDelta += localRemaining;
        elapsedSec -= localRemaining;
        const next: Phase = localPhase === "focus" ? "break" : "focus";
        localPhase = next;
        localRemaining = (next === "focus" ? focusMinutesRef.current : breakMinutesRef.current) * 60;
        transitioned = true;
        if (next === "focus") sessionDelta += 1;
      }
    }

    remainingRef.current = localRemaining;
    phaseRef.current = localPhase;
    setTickingSeconds(localRemaining);
    if (focusDelta > 0) setAccumulatedFocusSeconds((s) => s + focusDelta);
    if (breakDelta > 0) setAccumulatedBreakSeconds((s) => s + breakDelta);
    if (sessionDelta > 0) setFocusSessionCount((c) => c + sessionDelta);
    if (transitioned) setPhase(localPhase);
  }, []);

  useEffect(() => {
    if (!running) return;
    lastTickAtRef.current = Date.now();
    const id = setInterval(catchUp, 1000);
    return () => clearInterval(id);
  }, [running, catchUp]);

  // 앱이 다시 앞으로 오면 곧바로 따라잡는다.
  useEffect(() => {
    if (!running) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") catchUp();
    });
    return () => sub.remove();
  }, [running, catchUp]);

  // 1분이 찰 때마다 서버에 기록(웹과 동일한 recordFocusMinutes/recordBreakMinutes).
  useEffect(() => {
    if (!activeRoom) return;
    const minutes = Math.floor(accumulatedFocusSeconds / 60);
    if (minutes > flushedFocusRef.current) {
      const delta = minutes - flushedFocusRef.current;
      flushedFocusRef.current = minutes;
      rpc("recordFocusMinutes", activeRoom.id, delta, effectiveRecordDate(sessionStartRef.current));
    }
  }, [accumulatedFocusSeconds, activeRoom]);

  useEffect(() => {
    if (!activeRoom) return;
    const minutes = Math.floor(accumulatedBreakSeconds / 60);
    if (minutes > flushedBreakRef.current) {
      const delta = minutes - flushedBreakRef.current;
      flushedBreakRef.current = minutes;
      rpc("recordBreakMinutes", activeRoom.id, delta, effectiveRecordDate(sessionStartRef.current));
    }
  }, [accumulatedBreakSeconds, activeRoom]);

  // 타이머 상태가 바뀔 때(시작/일시정지/단계 전환/시간 설정 변경) 알림을 다시 예약한다 —
  // 앱이 백그라운드에 가도 운영체제가 정해진 시각에 "집중 끝/휴식 끝"을 알려준다.
  useEffect(() => {
    syncPomodoroNotifications({
      type: "pomodoro",
      running,
      phase,
      remainingSeconds: remainingRef.current,
      focusMinutes,
      breakMinutes,
      roomName: activeRoom?.name ?? null,
    }).catch(() => {});
  }, [running, phase, focusMinutes, breakMinutes, activeRoom]);

  const start = useCallback(
    (room: { id: string; name: string }) => {
      const isNewRoom = activeRoom?.id !== room.id;
      if (isNewRoom || !started) {
        const duration = (phase === "focus" ? focusMinutes : breakMinutes) * 60;
        remainingRef.current = duration;
        setTickingSeconds(duration);
      }
      if (isNewRoom) {
        setActiveRoom(room);
        setAccumulatedFocusSeconds(0);
        setAccumulatedBreakSeconds(0);
        flushedFocusRef.current = 0;
        flushedBreakRef.current = 0;
        sessionStartRef.current = Date.now();
      }
      if (isNewRoom || !started) {
        setStarted(true);
        setFocusSessionCount((c) => c + 1);
      }
      setRunning(true);
    },
    [activeRoom, started, phase, focusMinutes, breakMinutes]
  );

  const pause = useCallback(() => setRunning(false), []);

  const reset = useCallback(() => {
    setRunning(false);
    setStarted(false);
    setPhase("focus");
    phaseRef.current = "focus";
    const duration = focusMinutes * 60;
    remainingRef.current = duration;
    setTickingSeconds(duration);
    setActiveRoom(null);
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);
    flushedFocusRef.current = 0;
    flushedBreakRef.current = 0;
    setFocusSessionCount(0);
  }, [focusMinutes]);

  const phaseDurationSeconds = (phase === "focus" ? focusMinutes : breakMinutes) * 60;
  const remainingSeconds = started ? tickingSeconds : phaseDurationSeconds;
  const elapsedFraction = started ? 1 - tickingSeconds / phaseDurationSeconds : 0;

  const value: PomodoroContextValue = {
    activeRoom,
    phase: started ? phase : "idle",
    running,
    started,
    remainingSeconds,
    elapsedFraction,
    phaseDurationSeconds,
    focusMinutes,
    breakMinutes,
    focusSessionCount,
    accumulatedFocusSeconds,
    setFocusMinutes,
    setBreakMinutes,
    start,
    pause,
    reset,
  };
  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoro must be used within PomodoroProvider");
  return ctx;
}
