"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { recordFocusMinutes, recordBreakMinutes } from "@/lib/rooms";
import { logActivity } from "@/lib/activity";
import { effectiveRecordDate } from "@/lib/time";
import { playFocusStartChime, playBreakStartChime } from "@/lib/pomodoro-sound";
import type { Phase } from "./room/[id]/use-pomodoro";

type ActiveRoom = { id: string; name: string; isSystemRoom: boolean } | null;

type PomodoroContextValue = {
  activeRoomId: string | null;
  activeRoomName: string | null;
  // 마감방/새벽방은 미니 팝업으로 노출되는 대상에서 제외한다.
  activeRoomIsSystem: boolean;
  phase: Phase | "idle";
  running: boolean;
  started: boolean;
  remainingSeconds: number;
  elapsedFraction: number;
  accumulatedFocusSeconds: number;
  focusSessionCount: number;
  focusMinutes: number;
  breakMinutes: number;
  setFocusMinutes: (n: number) => void;
  setBreakMinutes: (n: number) => void;
  start: (
    room: { id: string; name: string; isSystemRoom: boolean },
    initialFocusSeconds: number
  ) => void;
  pause: () => void;
  reset: () => void;
  /** 탭을 닫거나 방을 나가기 직전처럼, 다음 정기 반영을 기다릴 수 없을
   * 때 지금까지 쌓인 시간을 즉시 서버에 반영한다. */
  flushPending: () => void;
};

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

// 뽀모도로 진행 중에 새로고침해도 진행 상황이 그대로 유지되도록,
// 상태가 바뀔 때마다 localStorage에 스냅샷을 남기고 마운트 시 복원한다.
export const POMODORO_STORAGE_KEY = "poroom:pomodoro-state";
const STORAGE_KEY = POMODORO_STORAGE_KEY;

type StoredPomodoroState = {
  activeRoom: ActiveRoom;
  focusMinutes: number;
  breakMinutes: number;
  running: boolean;
  started: boolean;
  phase: Phase;
  tickingSeconds: number;
  accumulatedFocusSeconds: number;
  accumulatedBreakSeconds: number;
  focusSessionCount: number;
  lastFlushedMinutes: number;
  lastFlushedBreakMinutes: number;
  sessionStart: number;
};

function readStoredPomodoro(): StoredPomodoroState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredPomodoroState;
  } catch {
    return null;
  }
}

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
  const [accumulatedBreakSeconds, setAccumulatedBreakSeconds] = useState(0);
  // 집중을 "새로" 시작할 때마다(수동 시작이든, 휴식이 끝나고 자동으로
  // 다음 집중으로 넘어가든) 1씩 늘어난다. 일시정지 후 재개는 새 집중이
  // 아니라서 세지 않는다.
  const [focusSessionCount, setFocusSessionCount] = useState(0);
  // 새로고침 직후 저장된 상태를 복원하는 동안에는(마운트 첫 렌더가
  // 아직 기본값일 때) 저장 effect가 그 기본값을 스냅샷으로 덮어써
  // 지워버리면 안 된다 — ref가 아니라 state로 둬서, 복원이 실제로
  // 반영된 "다음" 렌더에서만 저장 effect가 true를 보게 한다(같은
  // 커밋 안에서 ref를 미리 true로 바꿔버리면 activeRoom은 아직
  // 기본값인 채로 저장 effect가 돌아버리는 문제가 있었다).
  const [hydrated, setHydrated] = useState(false);

  const remainingRef = useRef(tickingSeconds);
  const sessionStartRef = useRef(0);
  const lastFlushedMinutesRef = useRef(0);
  const lastFlushedBreakMinutesRef = useRef(0);

  // 뽀모도로 진행 중에 새로고침해도 이어지도록, 마운트 시(클라이언트에서만)
  // localStorage에 저장된 스냅샷을 읽어 복원한다. 서버 렌더링 시점엔
  // localStorage가 없어 이 값을 미리 알 수 없으므로, 초기 state는 항상
  // 기본값으로 두고 hydration 이후 이 effect에서 한 번만 덮어쓴다
  // (그래야 서버/클라이언트 첫 렌더 결과가 어긋나는 hydration mismatch가
  // 생기지 않는다).
  /* eslint-disable react-hooks/set-state-in-effect -- this is a one-time
     restore of client-only persisted state (localStorage) after mount,
     which is exactly the "subscribe to an external system" case the rule
     itself carves out; consolidating these into a single state atom would
     mean rewriting every setter call throughout this file's carefully
     tuned ref-mirrored interval logic for no behavioral benefit. */
  useEffect(() => {
    const restored = readStoredPomodoro();
    if (restored) {
      setActiveRoom(restored.activeRoom);
      setFocusMinutes(restored.focusMinutes);
      setBreakMinutes(restored.breakMinutes);
      setRunning(restored.running);
      setStarted(restored.started);
      setPhase(restored.phase);
      setTickingSeconds(restored.tickingSeconds);
      remainingRef.current = restored.tickingSeconds;
      setAccumulatedFocusSeconds(restored.accumulatedFocusSeconds);
      setAccumulatedBreakSeconds(restored.accumulatedBreakSeconds);
      setFocusSessionCount(restored.focusSessionCount ?? 0);
      lastFlushedMinutesRef.current = restored.lastFlushedMinutes;
      lastFlushedBreakMinutesRef.current = restored.lastFlushedBreakMinutes;
      sessionStartRef.current = restored.sessionStart;
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // phase/focusMinutes/breakMinutes를 인터벌 effect의 의존성에 넣으면
  // 집중↔휴식이 바뀔 때마다(=phase가 바뀔 때마다) setInterval이 해체되고
  // 다시 생성된다 — 일시정지/초기화 전까지 끊김 없이 자동으로 반복돼야
  // 하는데, 이 재생성 타이밍에 문제가 생기면 자동 전환이 멈춘 것처럼
  // 보일 수 있었다. ref로 최신 값을 들고 있고, 인터벌 자체는 running이
  // 바뀔 때만 새로 만들어서 phase 전환 중에는 절대 해체되지 않게 한다.
  const phaseRef = useRef(phase);
  const focusMinutesRef = useRef(focusMinutes);
  const breakMinutesRef = useRef(breakMinutes);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    focusMinutesRef.current = focusMinutes;
  }, [focusMinutes]);
  useEffect(() => {
    breakMinutesRef.current = breakMinutes;
  }, [breakMinutes]);

  // 브라우저는 백그라운드(다른 탭/다른 프로그램이 포커스된) 탭의
  // setInterval을 강하게 스로틀링한다(심하면 1분에 한 번 정도로만
  // 실행) — 예전엔 "틱이 한 번 울릴 때마다 무조건 1초 지난 것"으로
  // 계산해서, 백그라운드에 있는 동안 실제 시간보다 훨씬 느리게(또는
  // 거의 안) 흘러가는 버그가 있었다. 이제는 매 틱마다 "진짜 시계
  // (Date.now())로 실제 몇 초가 지났는지"를 계산해서 그만큼을 한 번에
  // 따라잡는다 — 초 단위로 반복하지 않고, 지난 시간 동안 몇 번의
  // 집중/휴식 전환이 있었는지만 계산하므로 아무리 오래 백그라운드에
  // 있었어도 가볍다.
  // 0으로 시작해도 무방하다 — 실제 값은 아래 인터벌 시작 effect에서
  // running이 true가 될 때마다(렌더 중이 아니라 effect 안에서) 채운다.
  const lastTickAtRef = useRef(0);

  const catchUp = useCallback(() => {
    const now = Date.now();
    const elapsedMs = now - lastTickAtRef.current;
    // 1초 미만의 나머지는 버리지 않고 다음 번 계산을 위해 남겨둔다.
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
        const nextPhase: Phase = localPhase === "focus" ? "break" : "focus";
        localPhase = nextPhase;
        localRemaining =
          (nextPhase === "focus" ? focusMinutesRef.current : breakMinutesRef.current) * 60;
        transitioned = true;
        if (nextPhase === "focus") sessionDelta += 1;
      }
    }

    remainingRef.current = localRemaining;
    phaseRef.current = localPhase;
    setTickingSeconds(localRemaining);
    if (focusDelta > 0) setAccumulatedFocusSeconds((s) => s + focusDelta);
    if (breakDelta > 0) setAccumulatedBreakSeconds((s) => s + breakDelta);
    if (sessionDelta > 0) setFocusSessionCount((c) => c + sessionDelta);
    if (transitioned) {
      setPhase(localPhase);
      // 다른 프로그램을 보고 있어도 전환을 알아챌 수 있도록 알림음을
      // 준다 — 백그라운드에 있던 동안 여러 번 전환됐어도(따라잡기라서)
      // 지금 도달한 마지막 전환에 대해서만 한 번 울린다.
      if (localPhase === "focus") playFocusStartChime();
      else playBreakStartChime();
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    lastTickAtRef.current = Date.now();
    const id = setInterval(catchUp, 1000);
    return () => clearInterval(id);
  }, [running, catchUp]);

  // 탭이 다시 보이거나 창이 다시 포커스를 받는 순간 곧바로 따라잡는다 —
  // 안 그러면 브라우저가 여전히 스로틀링을 유지하는 짧은 시간 동안
  // 화면이 실제 시간을 못 따라온 채로 남아있을 수 있다.
  useEffect(() => {
    if (!running) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") catchUp();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [running, catchUp]);

  // 새로고침해도 진행 상황이 이어지도록, 관련 상태가 바뀔 때마다
  // localStorage에 그대로 스냅샷을 남긴다 — 위 hydrate effect가 아직
  // 복원을 끝내기 전(state가 기본값인 첫 렌더) 이 effect가 먼저 돌면
  // 방금 읽어들인 저장값을 기본값(activeRoom=null)으로 덮어써 지워버릴
  // 수 있으므로, 복원이 끝나기 전까지는 아무것도 쓰지 않는다.
  useEffect(() => {
    if (!hydrated) return;
    if (!activeRoom) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const snapshot: StoredPomodoroState = {
      activeRoom,
      focusMinutes,
      breakMinutes,
      running,
      started,
      phase,
      tickingSeconds,
      accumulatedFocusSeconds,
      accumulatedBreakSeconds,
      focusSessionCount,
      lastFlushedMinutes: lastFlushedMinutesRef.current,
      lastFlushedBreakMinutes: lastFlushedBreakMinutesRef.current,
      sessionStart: sessionStartRef.current,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [
    hydrated,
    activeRoom,
    focusMinutes,
    breakMinutes,
    running,
    started,
    phase,
    tickingSeconds,
    accumulatedFocusSeconds,
    accumulatedBreakSeconds,
    focusSessionCount,
  ]);

  useEffect(() => {
    if (!activeRoom) return;
    const currentMinutes = Math.floor(accumulatedFocusSeconds / 60);
    if (currentMinutes > lastFlushedMinutesRef.current) {
      const delta = currentMinutes - lastFlushedMinutesRef.current;
      lastFlushedMinutesRef.current = currentMinutes;
      recordFocusMinutes(activeRoom.id, delta, effectiveRecordDate(sessionStartRef.current));
    }
  }, [accumulatedFocusSeconds, activeRoom]);

  useEffect(() => {
    if (!activeRoom) return;
    const currentMinutes = Math.floor(accumulatedBreakSeconds / 60);
    if (currentMinutes > lastFlushedBreakMinutesRef.current) {
      const delta = currentMinutes - lastFlushedBreakMinutesRef.current;
      lastFlushedBreakMinutesRef.current = currentMinutes;
      recordBreakMinutes(activeRoom.id, delta, effectiveRecordDate(sessionStartRef.current));
    }
  }, [accumulatedBreakSeconds, activeRoom]);

  const doStart = useCallback(
    (
      room: { id: string; name: string; isSystemRoom: boolean },
      initialFocusSeconds: number
    ) => {
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
        setAccumulatedBreakSeconds(0);
        lastFlushedBreakMinutesRef.current = 0;
        sessionStartRef.current = Date.now();
      }
      if (isNewRoom || !started) {
        setStarted(true);
        logActivity(room.id, "session_start");
        // 일시정지 후 재개(started가 이미 true)는 새 집중이 아니라서
        // 세지 않는다 — 여기 들어왔다는 건 처음 시작하거나 초기화 후
        // 다시 시작하는 경우뿐이고, reset()이 phase를 항상 "focus"로
        // 되돌려두므로 이 시점의 phase는 항상 "focus"다.
        setFocusSessionCount((c) => c + 1);
        playFocusStartChime();
      }
      setRunning(true);
    },
    [activeRoom, started, phase, focusMinutes, breakMinutes]
  );

  // 매분 단위로 흘러가는 정기 반영(위 두 useEffect)은 "이번 분이 다
  // 채워졌을 때"만 서버에 쓴다 — 탭을 닫거나 방을 나가는 순간엔 아직
  // 안 채워진 분(수십 초)이 그냥 버려진다. 여기서는 그 남은 시간을
  // 반올림해서 마지막으로 한 번 더 반영한다. 방을 나가는 경우엔
  // 특히 중요한데, room_members 탈퇴 후에는(RLS가 멤버만 기록을
  // 쓸 수 있게 막아서) 더 이상 그 방으로는 아무것도 못 쓰기 때문에
  // 나가기 "전에" 호출해야 한다.
  const flushPending = useCallback(() => {
    if (!activeRoom) return;
    const focusMinutesNow = Math.round(accumulatedFocusSeconds / 60);
    if (focusMinutesNow > lastFlushedMinutesRef.current) {
      const delta = focusMinutesNow - lastFlushedMinutesRef.current;
      lastFlushedMinutesRef.current = focusMinutesNow;
      recordFocusMinutes(activeRoom.id, delta, effectiveRecordDate(sessionStartRef.current));
    }
    const breakMinutesNow = Math.round(accumulatedBreakSeconds / 60);
    if (breakMinutesNow > lastFlushedBreakMinutesRef.current) {
      const delta = breakMinutesNow - lastFlushedBreakMinutesRef.current;
      lastFlushedBreakMinutesRef.current = breakMinutesNow;
      recordBreakMinutes(activeRoom.id, delta, effectiveRecordDate(sessionStartRef.current));
    }
  }, [activeRoom, accumulatedFocusSeconds, accumulatedBreakSeconds]);

  // 이벤트 리스너 자체는 한 번만 등록하고, 매번 최신 flushPending을
  // 가리키는 ref를 통해 부른다.
  const flushPendingRef = useRef(flushPending);
  useEffect(() => {
    flushPendingRef.current = flushPending;
  }, [flushPending]);

  useEffect(() => {
    const flushIfHidden = () => {
      if (document.visibilityState === "hidden") flushPendingRef.current();
    };
    const flushOnPageHide = () => flushPendingRef.current();
    document.addEventListener("visibilitychange", flushIfHidden);
    window.addEventListener("pagehide", flushOnPageHide);
    return () => {
      document.removeEventListener("visibilitychange", flushIfHidden);
      window.removeEventListener("pagehide", flushOnPageHide);
    };
  }, []);

  // 같은 브라우저에서 탭을 두 개 이상 열어두면(예: 방 탭 하나, 다른
  // 페이지 탭 하나) 각 탭이 이 프로바이더를 따로 갖고 있어서, 한쪽
  // 탭에서 시작/일시정지/초기화해도 다른 탭에는 반영되지 않고 새로고침
  // 전까지 계속 어긋난 채로 남는다 — localStorage의 storage 이벤트로
  // 다른 탭의 변경을 감지해 즉시 같은 상태로 맞춘다.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const restored = readStoredPomodoro();
      if (!restored) {
        setActiveRoom(null);
        setRunning(false);
        setStarted(false);
        return;
      }
      setActiveRoom(restored.activeRoom);
      setFocusMinutes(restored.focusMinutes);
      setBreakMinutes(restored.breakMinutes);
      setRunning(restored.running);
      setStarted(restored.started);
      setPhase(restored.phase);
      setTickingSeconds(restored.tickingSeconds);
      remainingRef.current = restored.tickingSeconds;
      setAccumulatedFocusSeconds(restored.accumulatedFocusSeconds);
      setAccumulatedBreakSeconds(restored.accumulatedBreakSeconds);
      setFocusSessionCount(restored.focusSessionCount ?? 0);
      lastFlushedMinutesRef.current = restored.lastFlushedMinutes;
      lastFlushedBreakMinutesRef.current = restored.lastFlushedBreakMinutes;
      sessionStartRef.current = restored.sessionStart;
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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
    setAccumulatedBreakSeconds(0);
    lastFlushedBreakMinutesRef.current = 0;
    setFocusSessionCount(0);
    window.localStorage.removeItem(STORAGE_KEY);
  }, [activeRoom, started, focusMinutes]);

  const phaseDuration = (phase === "focus" ? focusMinutes : breakMinutes) * 60;
  const remainingSeconds = started ? tickingSeconds : phaseDuration;
  const elapsedFraction = started ? 1 - tickingSeconds / phaseDuration : 0;
  const displayPhase: Phase | "idle" = started ? phase : "idle";

  const value: PomodoroContextValue = {
    activeRoomId: activeRoom?.id ?? null,
    activeRoomName: activeRoom?.name ?? null,
    activeRoomIsSystem: activeRoom?.isSystemRoom ?? false,
    phase: displayPhase,
    running,
    started,
    remainingSeconds,
    elapsedFraction,
    accumulatedFocusSeconds,
    focusSessionCount,
    focusMinutes,
    breakMinutes,
    setFocusMinutes,
    setBreakMinutes,
    start: doStart,
    pause,
    reset,
    flushPending,
  };

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}

export function usePomodoroContext() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoroContext must be used within PomodoroProvider");
  return ctx;
}
