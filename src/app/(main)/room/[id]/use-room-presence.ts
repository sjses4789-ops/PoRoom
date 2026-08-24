"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const TYPING_WINDOW_MS = 5000;
const TRACK_THROTTLE_MS = 2000;
// track() 호출이 응답 없이 멈추면(네트워크 순간 단절 등) 뒤이은 모든
// track()이 큐에 걸려 영원히 반영되지 않는 문제가 있었다 — 일정 시간
// 안에 끝나지 않으면 그냥 다음 큐로 넘어가도록 타임아웃을 둔다.
const TRACK_TIMEOUT_MS = 4000;
// 위 타임아웃으로도 놓친 갱신이 있을 수 있으니, 주기적으로 현재 상태를
// 다시 track()해서 다른 참여자 화면이 스스로 복구되도록 한다.
const RETRACK_INTERVAL_MS = 15000;

type PomodoroPhase = "focus" | "break" | "idle";

type PresencePayload = {
  name: string;
  lastTypedAt: number | null;
  workStatus: string | null;
  pomodoroPhase: PomodoroPhase;
  pomodoroElapsedFraction: number;
};

export type PresenceStatus = "offline" | "typing" | "idle";

export function useRoomPresence(
  roomId: string,
  selfId: string,
  selfName: string
) {
  const [presenceMap, setPresenceMap] = useState<
    Record<string, PresencePayload>
  >({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastTrackedRef = useRef(0);
  // Realtime Presence의 track()을 겹쳐서(빠르게 연달아) 호출하면 일부
  // 호출이 유실되거나 순서가 뒤바뀌어, 이후 track()이 더는 서버 상태에
  // 반영되지 않는 것처럼 보이는 문제가 있었다 — 항상 하나씩 순서대로
  // 처리되도록 큐에 태운다.
  const trackQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const trackSafely = useCallback((payload: PresencePayload) => {
    trackQueueRef.current = trackQueueRef.current
      .catch(() => {})
      .then(() =>
        Promise.race([
          channelRef.current?.track(payload) ?? Promise.resolve(),
          new Promise((resolve) => setTimeout(resolve, TRACK_TIMEOUT_MS)),
        ])
      );
  }, []);
  const selfPayloadRef = useRef<PresencePayload>({
    name: selfName,
    lastTypedAt: null,
    workStatus: null,
    pomodoroPhase: "idle",
    pomodoroElapsedFraction: 0,
  });
  const [, setTick] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`room-presence:${roomId}`, {
      config: { presence: { key: selfId } },
    });
    channelRef.current = channel;

    const syncFromState = () => {
      const state = channel.presenceState<PresencePayload>();
      const next: Record<string, PresencePayload> = {};
      for (const key of Object.keys(state)) {
        const entries = state[key];
        const latest = entries[entries.length - 1];
        if (latest) next[key] = latest;
      }
      setPresenceMap(next);
    };

    // 구독이 SUBSCRIBED 외의 상태(CHANNEL_ERROR/TIMED_OUT/CLOSED)로
    // 끝나버리면, track()이 계속 조용히 실패해서 나는 계속 연결돼
    // 있는데도 다른 참여자에게는 영원히 "비접속"으로 보이는 문제가
    // 있었다 — 실패 상태를 만나면 잠시 뒤 같은 채널로 재구독을
    // 시도한다.
    let retrySubscribeId: ReturnType<typeof setTimeout> | null = null;
    const subscribe = () => {
      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track(selfPayloadRef.current).catch(() => {});
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          if (retrySubscribeId) clearTimeout(retrySubscribeId);
          retrySubscribeId = setTimeout(subscribe, 2000);
        }
      });
    };

    channel
      .on("presence", { event: "sync" }, syncFromState)
      .on("presence", { event: "join" }, syncFromState)
      .on("presence", { event: "leave" }, syncFromState);
    subscribe();

    const tickId = setInterval(() => setTick((t) => t + 1), 1000);
    // track() 하나가 유실돼도 다른 참여자 화면이 오래(다음 상태 변경
    // 전까지) 어긋난 채로 남지 않도록, 주기적으로 현재 상태를 다시
    // 알린다.
    const retrackId = setInterval(() => {
      trackSafely(selfPayloadRef.current);
    }, RETRACK_INTERVAL_MS);

    return () => {
      if (retrySubscribeId) clearTimeout(retrySubscribeId);
      clearInterval(tickId);
      clearInterval(retrackId);
      supabase.removeChannel(channel);
    };
  }, [roomId, selfId, selfName, trackSafely]);

  const reportTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTrackedRef.current < TRACK_THROTTLE_MS) return;
    lastTrackedRef.current = now;
    selfPayloadRef.current = {
      ...selfPayloadRef.current,
      name: selfName,
      lastTypedAt: now,
    };
    trackSafely(selfPayloadRef.current);
  }, [selfName, trackSafely]);

  const setWorkStatus = useCallback(
    (workStatus: string | null) => {
      selfPayloadRef.current = {
        ...selfPayloadRef.current,
        name: selfName,
        workStatus,
      };
      trackSafely(selfPayloadRef.current);
    },
    [selfName, trackSafely]
  );

  // 다른 참여자 카드에 내 뽀모도로 진행 상태(집중/휴식/대기)가 실시간으로
  // 보이도록 presence에 함께 실어 보낸다 — 이전엔 이 값이 전혀 공유되지
  // 않아서 다른 사람 눈엔 항상 "대기"로만 보였다.
  const setPomodoroState = useCallback(
    (phase: PomodoroPhase, elapsedFraction: number) => {
      selfPayloadRef.current = {
        ...selfPayloadRef.current,
        name: selfName,
        pomodoroPhase: phase,
        pomodoroElapsedFraction: elapsedFraction,
      };
      trackSafely(selfPayloadRef.current);
    },
    [selfName, trackSafely]
  );

  const getStatus = useCallback(
    (userId: string): PresenceStatus => {
      const p = presenceMap[userId];
      if (!p) return "offline";
      if (p.lastTypedAt && Date.now() - p.lastTypedAt < TYPING_WINDOW_MS) {
        return "typing";
      }
      return "idle";
    },
    [presenceMap]
  );

  const getWorkStatus = useCallback(
    (userId: string): string | null => presenceMap[userId]?.workStatus ?? null,
    [presenceMap]
  );

  const getPomodoroState = useCallback(
    (userId: string) => {
      const p = presenceMap[userId];
      return {
        phase: p?.pomodoroPhase ?? "idle",
        elapsedFraction: p?.pomodoroPhase && p.pomodoroPhase !== "idle" ? p.pomodoroElapsedFraction : 0,
      };
    },
    [presenceMap]
  );

  return {
    reportTyping,
    getStatus,
    getWorkStatus,
    setWorkStatus,
    setPomodoroState,
    getPomodoroState,
  };
}
