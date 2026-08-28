"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePomodoroContext } from "../../pomodoro-context";
import { useRoomPresence } from "./use-room-presence";
import { useLiveMembers } from "./use-live-members";
import { ParticipantCard, type ParticipantData } from "./participant-card";
import { ChatPanel, type ChatMessage, type LatestNotice } from "./chat-panel";
import { PomodoroPanel } from "./pomodoro-panel";
import { CharInput } from "./char-input";
import { sumTotals, type DailyRecord } from "@/lib/records";
import { recordChars, touchLastSeen, setWorkStatus, type RecordVisibility } from "@/lib/rooms";
import { effectiveRecordDate, toLocalDateKey } from "@/lib/time";
import { RichContent } from "@/components/rich-content";
import { useCelebrationToast } from "@/components/celebration-toast";
import { useTodayCharsSync } from "./today-chars-sync";

export type Member = {
  id: string;
  name: string;
  characterId: string | null;
  chatColor: string | null;
  recordsVisible: boolean;
  lastSeenLabel: string | null;
  workStatus: string | null;
  // 참여자 카드에 누적 글자수/작업량을 보여줄 때 "자"/"컷" 중 어떤
  // 단위로 표시할지는 그 참여자 본인의 직업을 따른다.
  position: "novelist" | "webtoon";
  isOwner: boolean;
  isVice: boolean;
};

const LAST_SEEN_HEARTBEAT_MS = 30000;

const CHAT_WIDTH_STORAGE_KEY = "poroom:chat-width";
const DEFAULT_CHAT_WIDTH = 340;
const MIN_CHAT_WIDTH = 260;
const MAX_CHAT_WIDTH = 560;

export function RoomView({
  roomId,
  roomName,
  isSystemRoom,
  selfId,
  selfName,
  members: initialMembers,
  recordVisibility,
  capacity,
  initialMessages,
  canModerate,
  latestNotice,
  dailyRecords,
  personalTodayChars,
  selfTodayFocusMinutes,
  selfTodayGlobalChars,
  selfTodayGoalChars,
  selfMonthGoalChars,
  selfMonthChars,
  selfPosition,
}: {
  roomId: string;
  roomName: string;
  isSystemRoom: boolean;
  selfId: string;
  selfName: string;
  members: Member[];
  recordVisibility: RecordVisibility;
  capacity: number | null;
  initialMessages: ChatMessage[];
  canModerate: boolean;
  latestNotice: LatestNotice | null;
  dailyRecords: DailyRecord[];
  // 오늘의 개인 글자수(방 무관, 전체 합산) — 참여자 카드와 글자수 기록
  // 영역 모두 이 값을 보여준다. 기록이 공개된 멤버만 들어있다.
  personalTodayChars: Record<string, number>;
  selfTodayFocusMinutes: number;
  selfTodayGlobalChars: number;
  selfTodayGoalChars: number;
  selfMonthGoalChars: number;
  selfMonthChars: number;
  // [개인] 페이지에서 고른 내 직업 — 웹툰 작가면 [방]의 상태 설정 목록과
  // 작업 단위(글자수→컷수) 표기가 달라진다.
  selfPosition: "novelist" | "webtoon";
}) {
  const t = useTranslations("room.roomView");
  const { toast: celebrationToast, celebrate } = useCelebrationToast();
  // 이번 달 글자수는 화면에 직접 렌더링하지 않고 목표 달성 감지에만
  // 쓰므로, 리렌더를 유발하지 않는 ref로 들고 있는다.
  const monthCharsRef = useRef(selfMonthChars);
  // useLiveMembers가 재조회/실시간 갱신 때도 방장 왕관 표시를 유지하려면
  // 방장 id를 알아야 하는데, 서버에서 이미 계산해 초기 members에 실어
  // 보낸 isOwner 플래그에서 그대로 뽑아 쓰면 별도 prop이 필요 없다.
  const ownerId = initialMembers.find((m) => m.isOwner)?.id ?? "";
  const { members, updateSelfWorkStatus } = useLiveMembers(
    roomId,
    selfId,
    initialMembers,
    recordVisibility,
    ownerId,
    isSystemRoom
  );
  const pomodoro = usePomodoroContext();
  const isActiveRoom = pomodoro.activeRoomId === roomId;

  const [todayChars, setTodayChars] = useState(selfTodayGlobalChars);
  const { reportTyping, getStatus, setPomodoroState, getPomodoroState } = useRoomPresence(
    roomId,
    selfId,
    selfName
  );

  // "상태설정"은 presence(그 방 세션 동안만 사는 실시간 상태)가 아니라
  // users.work_status에 영구 저장한다 — 방을 나갔다 들어와도, 다른
  // 페이지에 가 있어도 유지되어야 하기 때문. 낙관적으로 먼저 로컬
  // 상태를 바꾸고, 서버에도 반영한다(다른 참여자에게는
  // useLiveMembers의 users 테이블 실시간 구독을 통해 전파된다).
  const handleChangeWorkStatus = (status: string | null) => {
    updateSelfWorkStatus(status);
    setWorkStatus(status);
  };

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
        setTodayChars(0);
      }
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // 오늘 글자수에 델타(n)만큼 반영한다 — DB 반영은 호출부 책임(이 방에서
  // 직접 입력했을 때는 addChars가, 기록 탭에서 오늘 값을 수정했을 때는
  // 그쪽에서 이미 저장을 마친 뒤 델타만 이 함수로 알려준다).
  const applyTodayCharsDelta = (n: number) => {
    if (n === 0) return;
    setTodayChars((prev) => {
      const next = prev + n;
      if (selfTodayGoalChars > 0 && prev < selfTodayGoalChars && next >= selfTodayGoalChars) {
        celebrate(t(selfPosition === "webtoon" ? "dailyGoalToastWebtoon" : "dailyGoalToast"));
      }
      return next;
    });
    const monthPrev = monthCharsRef.current;
    const monthNext = monthPrev + n;
    monthCharsRef.current = monthNext;
    if (selfMonthGoalChars > 0 && monthPrev < selfMonthGoalChars && monthNext >= selfMonthGoalChars) {
      celebrate(t(selfPosition === "webtoon" ? "monthlyGoalToastWebtoon" : "monthlyGoalToast"));
    }
  };

  const addChars = (n: number) => {
    applyTodayCharsDelta(n);
    recordChars(roomId, n, effectiveRecordDate(sessionStartRef.current));
  };

  // 기록 탭(RoomRecordsPanel)에서 오늘 날짜의 글자수를 수정하면, 형제
  // 컴포넌트인 이곳에도 그 변화량이 즉시 반영되도록 구독한다.
  const todayCharsSync = useTodayCharsSync();
  useEffect(() => {
    return todayCharsSync?.subscribe(applyTodayCharsDelta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayCharsSync]);

  const handleStart = () =>
    pomodoro.start({ id: roomId, name: roomName, isSystemRoom }, selfTodayFocusMinutes * 60);
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
  const displayPhaseDurationSeconds =
    (displayPhase === "break" ? pomodoro.breakMinutes : pomodoro.focusMinutes) * 60;
  const displayAccumulatedFocusMinutes = isActiveRoom
    ? pomodoro.accumulatedFocusSeconds / 60
    : selfTodayFocusMinutes;

  // 다른 참여자 카드에도 내 뽀모도로 상태(집중/휴식/대기)가 보이도록
  // presence로 실어 보낸다. 진행률 값 자체가 아니라 "이 스냅샷 시점의
  // 진행률 + 그 시각 + 이번 구간 길이"를 보내서, 보는 쪽이 그 이후
  // 흐른 시간만큼 스스로 진행시키게 한다(내 탭이 백그라운드라
  // setInterval이 쓰로틀링돼도 상대방 화면은 계속 자연스럽게 흘러가야
  // 하므로) — 전환/일시정지·재시작 시점에 바로 한 번, 그 외엔 유실
  // 복구용으로 주기적으로 다시 보낸다.
  const displayElapsedFractionRef = useRef(displayElapsedFraction);
  useEffect(() => {
    displayElapsedFractionRef.current = displayElapsedFraction;
  }, [displayElapsedFraction]);

  useEffect(() => {
    setPomodoroState(
      displayPhase,
      displayElapsedFractionRef.current,
      displayRunning,
      displayPhaseDurationSeconds
    );
  }, [displayPhase, displayRunning, displayPhaseDurationSeconds, setPomodoroState]);

  useEffect(() => {
    const id = setInterval(() => {
      setPomodoroState(
        displayPhase,
        displayElapsedFractionRef.current,
        displayRunning,
        displayPhaseDurationSeconds
      );
    }, 10000);
    return () => clearInterval(id);
  }, [displayPhase, displayRunning, displayPhaseDurationSeconds, setPomodoroState]);

  const otherMembers = members.filter((m) => m.id !== selfId);
  const selfMember = members.find((m) => m.id === selfId);

  const selfParticipant: ParticipantData = {
    id: selfId,
    name: selfName,
    isSelf: true,
    characterId: selfMember?.characterId ?? null,
    phase: displayPhase,
    focusMinutes: pomodoro.focusMinutes,
    breakMinutes: pomodoro.breakMinutes,
    elapsedFraction: displayElapsedFraction,
    accumulatedFocusMinutes: displayAccumulatedFocusMinutes,
    accumulatedChars: todayChars,
    presence: getStatus(selfId),
    recordsVisible: true,
    lastSeenLabel: null,
    workStatus: selfMember?.workStatus ?? null,
    position: selfMember?.position ?? selfPosition,
    isOwner: selfMember?.isOwner ?? false,
    isVice: selfMember?.isVice ?? false,
  };

  const otherParticipants: ParticipantData[] = otherMembers.map((m) => {
    // 집중 시간은 여전히 "이 방에서" 누적된 값(이 방의 daily_records)을
    // 보여주지만, 글자수는 방 무관 개인 데이터라 오늘 하루치 합산값을
    // 보여준다(personalTodayChars, page.tsx에서 방을 가리지 않고 계산).
    const totals = sumTotals(dailyRecords, m.id);
    const pomodoroState = getPomodoroState(m.id);
    const presence = getStatus(m.id);
    return {
      id: m.id,
      name: m.name,
      characterId: m.characterId,
      phase: pomodoroState.phase,
      elapsedFraction: pomodoroState.elapsedFraction,
      focusMinutes: 25,
      breakMinutes: 5,
      accumulatedFocusMinutes: totals.focusMinutes,
      accumulatedChars: personalTodayChars[m.id] ?? 0,
      presence,
      recordsVisible: m.recordsVisible,
      lastSeenLabel: m.lastSeenLabel,
      // 상태설정은 계정에 영구 저장돼 있어서 그대로 두면, 사이트를 벗어나거나
      // 창을 닫아 완전히 비접속이 된 뒤에도 카드에 파스텔 배경/상태 뱃지가
      // 계속 남아 접속중인 사람과 구분이 잘 안 됐다 — 언마운트/네트워크
      // 끊김처럼 신뢰할 수 없는 종료 이벤트에 의존하는 대신, 화면에 보여줄
      // 때 비접속이면 그냥 표시만 비운다(저장된 값 자체는 그대로 둬서
      // 다시 접속하면 원래 상태가 곧바로 돌아온다).
      workStatus: presence === "offline" ? null : m.workStatus,
      position: m.position,
      isOwner: m.isOwner,
      isVice: m.isVice,
    };
  });

  // "나"는 항상 맨 앞에 고정하고, 접속 여부(1순위)·닉네임 오름차순(2순위)
  // 정렬은 나머지 참여자에게만 적용한다.
  otherParticipants.sort((a, b) => {
    const byPresence = Number(a.presence === "offline") - Number(b.presence === "offline");
    if (byPresence !== 0) return byPresence;
    return a.name.localeCompare(b.name, "ko");
  });

  const participants: ParticipantData[] = [selfParticipant, ...otherParticipants];

  const onlineCount = participants.filter((p) => p.presence !== "offline").length;
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);

  // 채팅창 너비를 참여자가 직접 드래그로 조절할 수 있게 한다 — 마지막
  // 값은 기기에 저장해두고 다음에 이 방을 열 때도 유지한다. 기본값은
  // 기존 300px보다 조금 넓힌 340px.
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
  const chatWidthRef = useRef(chatWidth);
  useEffect(() => {
    chatWidthRef.current = chatWidth;
  }, [chatWidth]);

  // 저장된 값 읽기는 마운트 시 한 번만 필요한 정당한 초기화라, 규칙이
  // 스스로 인정하는 예외에 해당한다(다른 로컬스토리지 동기화와 동일 패턴).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const stored = Number(window.localStorage.getItem(CHAT_WIDTH_STORAGE_KEY));
      if (stored >= MIN_CHAT_WIDTH && stored <= MAX_CHAT_WIDTH) setChatWidth(stored);
    } catch {
      // 로컬스토리지를 못 쓰는 환경이면 기본값을 그대로 둔다.
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const startChatResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = chatWidthRef.current;
    const onMove = (moveEvent: PointerEvent) => {
      const next = Math.min(
        MAX_CHAT_WIDTH,
        Math.max(MIN_CHAT_WIDTH, startWidth + (moveEvent.clientX - startX))
      );
      setChatWidth(next);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      try {
        window.localStorage.setItem(CHAT_WIDTH_STORAGE_KEY, String(chatWidthRef.current));
      } catch {
        // 저장 실패해도 이번 세션 내 너비 조절 자체는 계속 동작한다.
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <>
    {celebrationToast}
    <div
      className="grid grid-cols-1 gap-6 lg:grid-cols-[var(--chat-w)_1fr_260px]"
      style={{ "--chat-w": chatCollapsed ? "56px" : `${chatWidth}px` } as React.CSSProperties}
    >
        <div className="relative lg:order-1">
          <ChatPanel
            roomId={roomId}
            selfId={selfId}
            members={members}
            initialMessages={initialMessages}
            canModerate={canModerate}
            onActivity={reportTyping}
            collapsed={chatCollapsed}
            onToggleCollapsed={() => setChatCollapsed((v) => !v)}
          />
          {/* 채팅창 오른쪽 경계를 드래그해서 너비를 조절한다 — 접힌
              상태에서는 조절할 너비가 없으므로 숨긴다. */}
          {!chatCollapsed && (
            <div
              onPointerDown={startChatResize}
              role="separator"
              aria-orientation="vertical"
              aria-label={t("resizeChatAria")}
              title={t("resizeChatAria")}
              className="absolute -right-3 top-0 hidden h-full w-3 cursor-col-resize touch-none items-center justify-center lg:flex"
            >
              <span className="h-10 w-1 rounded-full bg-neutral-200 transition hover:bg-neutral-400 dark:bg-neutral-700 dark:hover:bg-neutral-500" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:order-2">
          <div className="flex items-center justify-between gap-3 overflow-hidden rounded-sm border border-neutral-400 px-3 py-2 dark:border-neutral-600">
            <div className="flex min-w-0 items-center gap-2">
              <span aria-hidden className="text-neutral-400">
                👥
              </span>
              <span className="shrink-0 text-sm font-semibold text-neutral-900 dark:text-white">
                {t("participantsList")}
              </span>
              <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-sm font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                {t("membersSuffix", { count: members.length, capacity: capacity ?? members.length })}
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
                      📌 {t("notice")}
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
                <RichContent content={latestNotice.content} />
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
            {participants.map((p) => (
              <ParticipantCard
                key={p.id}
                data={p}
                onChangeWorkStatus={p.isSelf ? handleChangeWorkStatus : undefined}
                selfPosition={selfPosition}
              />
            ))}
          </div>
          <p className="text-[12px] text-neutral-400">
            {t("onlineCount", { count: onlineCount })}
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
            focusSessionCount={isActiveRoom ? pomodoro.focusSessionCount : 0}
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
            onAdd={addChars}
            onActivity={reportTyping}
            position={selfPosition}
          />
        </div>
    </div>
    </>
  );
}
