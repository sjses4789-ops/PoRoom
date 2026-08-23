"use client";

import { useEffect, useRef, useState } from "react";
import { usePomodoroContext } from "../../pomodoro-context";
import { useRoomPresence } from "./use-room-presence";
import { useLiveMembers } from "./use-live-members";
import { ParticipantCard, type ParticipantData } from "./participant-card";
import { ChatPanel, type ChatMessage, type LatestNotice } from "./chat-panel";
import { PomodoroPanel } from "./pomodoro-panel";
import { CharInput, type WorkItem } from "./char-input";
import { sumTotals, type DailyRecord } from "@/lib/records";
import { recordChars, touchLastSeen, type RecordVisibility } from "@/lib/rooms";
import { effectiveRecordDate, toLocalDateKey } from "@/lib/time";

export type Member = {
  id: string;
  name: string;
  characterId: string | null;
  chatColor: string | null;
  recordsVisible: boolean;
  lastSeenLabel: string | null;
};

const LAST_SEEN_HEARTBEAT_MS = 30000;

export function RoomView({
  roomId,
  roomName,
  selfId,
  selfName,
  members: initialMembers,
  recordVisibility,
  capacity,
  initialMessages,
  latestNotice,
  dailyRecords,
  selfTodayChars,
  selfTodayFocusMinutes,
  selfTodayGlobalChars,
  selfTodayGoalChars,
  initialWorks,
}: {
  roomId: string;
  roomName: string;
  selfId: string;
  selfName: string;
  members: Member[];
  recordVisibility: RecordVisibility;
  capacity: number | null;
  initialMessages: ChatMessage[];
  latestNotice: LatestNotice | null;
  dailyRecords: DailyRecord[];
  selfTodayChars: number;
  selfTodayFocusMinutes: number;
  selfTodayGlobalChars: number;
  selfTodayGoalChars: number;
  initialWorks: WorkItem[];
}) {
  const members = useLiveMembers(roomId, selfId, initialMembers, recordVisibility);
  const pomodoro = usePomodoroContext();
  const isActiveRoom = pomodoro.activeRoomId === roomId;

  const [chars, setChars] = useState(selfTodayChars);
  const [todayChars, setTodayChars] = useState(selfTodayGlobalChars);
  const { reportTyping, getStatus, getWorkStatus, setWorkStatus } = useRoomPresence(
    roomId,
    selfId,
    selfName
  );

  // any keystroke anywhere on the room page counts as activity, not just
  // the chat/char inputs — a browser tab can't see keystrokes made in
  // other apps though, only within this page.
  useEffect(() => {
    window.addEventListener("keydown", reportTyping);
    return () => window.removeEventListener("keydown", reportTyping);
  }, [reportTyping]);

  useEffect(() => {
    touchLastSeen(roomId);
    const id = setInterval(() => touchLastSeen(roomId), LAST_SEEN_HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [roomId]);

  // when this page mounted — used only for the char-input day-rollover
  // grace window below (the pomodoro's own session start lives in the
  // pomodoro provider now, since it persists across page navigation).
  const sessionStartRef = useRef(0);
  const lastCheckedDateRef = useRef("");

  useEffect(() => {
    sessionStartRef.current = Date.now();
    lastCheckedDateRef.current = toLocalDateKey(new Date());
  }, []);

  // the displayed "오늘 글자수" resets when the calendar day rolls over,
  // unless this session falls inside that late-night grace window above.
  useEffect(() => {
    const id = setInterval(() => {
      const currentDateKey = toLocalDateKey(new Date());
      if (currentDateKey === lastCheckedDateRef.current) return;
      lastCheckedDateRef.current = currentDateKey;
      if (effectiveRecordDate(sessionStartRef.current) === currentDateKey) {
        setChars(0);
        setTodayChars(0);
      }
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const addChars = (n: number) => {
    setChars((c) => c + n);
    setTodayChars((c) => c + n);
    recordChars(roomId, n, effectiveRecordDate(sessionStartRef.current));
  };

  const handleStart = () => pomodoro.start({ id: roomId, name: roomName }, selfTodayFocusMinutes * 60);
  const handlePause = () => pomodoro.pause();
  const handleReset = () => pomodoro.reset();

  // 이 방이 현재 전역으로 실행 중인 뽀모도로의 주인이 아니면(다른 방에서
  // 시작했거나 아직 아무 방에서도 시작 안 했으면) 이 방에서는 항상 대기
  // 상태로 보여준다 — "시작"을 누르면 그 순간 이 방이 새로 주인이 된다.
  const displayPhase = isActiveRoom ? pomodoro.phase : "idle";
  const displayRunning = isActiveRoom && pomodoro.running;
  const displayStarted = isActiveRoom && pomodoro.started;
  const displayRemainingSeconds = isActiveRoom
    ? pomodoro.remainingSeconds
    : pomodoro.focusMinutes * 60;
  const displayElapsedFraction = isActiveRoom ? pomodoro.elapsedFraction : 0;
  const displayAccumulatedFocusMinutes = isActiveRoom
    ? pomodoro.accumulatedFocusSeconds / 60
    : selfTodayFocusMinutes;

  const otherMembers = members.filter((m) => m.id !== selfId);
  const selfMember = members.find((m) => m.id === selfId);

  const participants: ParticipantData[] = [
    {
      id: selfId,
      name: selfName,
      isSelf: true,
      characterId: selfMember?.characterId ?? null,
      phase: displayPhase,
      focusMinutes: pomodoro.focusMinutes,
      breakMinutes: pomodoro.breakMinutes,
      elapsedFraction: displayElapsedFraction,
      accumulatedFocusMinutes: displayAccumulatedFocusMinutes,
      accumulatedChars: chars,
      presence: getStatus(selfId),
      recordsVisible: true,
      lastSeenLabel: null,
      workStatus: getWorkStatus(selfId),
    },
    ...otherMembers.map((m) => {
      const totals = sumTotals(dailyRecords, m.id);
      return {
        id: m.id,
        name: m.name,
        characterId: m.characterId,
        phase: "idle" as const,
        elapsedFraction: 0,
        focusMinutes: 25,
        breakMinutes: 5,
        accumulatedFocusMinutes: totals.focusMinutes,
        accumulatedChars: totals.chars,
        presence: getStatus(m.id),
        recordsVisible: m.recordsVisible,
        lastSeenLabel: m.lastSeenLabel,
        workStatus: getWorkStatus(m.id),
      };
    }),
  ];

  const onlineCount = participants.filter((p) => p.presence !== "offline").length;
  const [noticeOpen, setNoticeOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr_260px]">
        <div className="h-[420px] lg:order-1 lg:h-[560px]">
          <ChatPanel
            roomId={roomId}
            selfId={selfId}
            members={members}
            initialMessages={initialMessages}
            onActivity={reportTyping}
          />
        </div>

        <div className="flex flex-col gap-3 lg:order-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <span aria-hidden className="text-neutral-400">
                👥
              </span>
              <span className="shrink-0 text-sm font-semibold text-neutral-900 dark:text-white">
                참여자 목록
              </span>
              <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-sm font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                {members.length}/{capacity ?? members.length}명
              </span>
            </div>
            {latestNotice && (
              <button
                type="button"
                onClick={() => setNoticeOpen(true)}
                className="flex min-w-0 items-center gap-1 text-xs text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              >
                <span className="shrink-0 text-amber-500" aria-hidden>
                  📌
                </span>
                <span className="min-w-0 truncate">{latestNotice.title}</span>
              </button>
            )}
          </div>

          {noticeOpen && latestNotice && (
            <>
              <div
                onClick={() => setNoticeOpen(false)}
                className="fixed inset-0 z-10 bg-neutral-900/20"
              />
              <div
                onClick={(e) => e.stopPropagation()}
                className="fixed left-1/2 top-1/2 z-20 max-h-[80vh] w-[min(28rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-neutral-300 bg-white p-5 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-[12px] font-medium text-amber-600 dark:text-amber-400">
                      📌 공지사항
                    </span>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {latestNotice.title}
                    </h3>
                    <span className="text-[12px] text-neutral-400">
                      {latestNotice.authorName}
                    </span>
                  </div>
                  <button
                    onClick={() => setNoticeOpen(false)}
                    className="shrink-0 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  >
                    ✕
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-300">
                  {latestNotice.content}
                </p>
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
            {participants.map((p) => (
              <ParticipantCard
                key={p.id}
                data={p}
                onChangeWorkStatus={p.isSelf ? setWorkStatus : undefined}
              />
            ))}
          </div>
          <p className="text-[12px] text-neutral-400">
            현재 접속 중 {onlineCount}명
          </p>
        </div>

        <div className="flex flex-col gap-4 lg:order-3">
          <PomodoroPanel
            phase={displayPhase}
            running={displayRunning}
            remainingSeconds={displayRemainingSeconds}
            elapsedFraction={displayElapsedFraction}
            focusMinutes={pomodoro.focusMinutes}
            breakMinutes={pomodoro.breakMinutes}
            onChangeFocus={pomodoro.setFocusMinutes}
            onChangeBreak={pomodoro.setBreakMinutes}
            started={displayStarted}
            start={handleStart}
            pause={handlePause}
            reset={handleReset}
          />
          <CharInput
            todayChars={todayChars}
            todayGoalChars={selfTodayGoalChars}
            initialWorks={initialWorks}
            onAdd={addChars}
            onActivity={reportTyping}
          />
        </div>
    </div>
  );
}
