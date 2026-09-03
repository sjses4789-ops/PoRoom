"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const TYPING_WINDOW_MS = 5000;
const TRACK_THROTTLE_MS = 2000;
// 위 타임아웃으로도 놓친 갱신이 있을 수 있으니, 주기적으로 현재 상태를
// 다시 track()해서 다른 참여자 화면이 스스로 복구되도록 한다.
const RETRACK_INTERVAL_MS = 8000;
// 브라우저는 백그라운드 탭의 setInterval/setTimeout을 강하게 쓰로틀링한다
// (Chrome은 몇 분만 지나도 1분에 한 번 수준으로 줄인다) — supabase-js
// realtime 클라이언트의 heartbeat도 내부적으로 타이머 기반이라, 참여자가
// 다른 탭이나 집필 프로그램으로 옮겨가 방 탭이 백그라운드에 오래 머물면
// 하트비트가 지연되어 서버가 그 연결을 끊어버리고, presence 상태에서
// 빠지는 경우가 실제로 있다. 그렇다고 바로 "비접속"으로 보여주면, 실제로는
// 계속 접속해 있는 사람이 화면에서만 끊긴 것처럼 보이는 문제가 생긴다 —
// 그래서 presence에서 잠깐 빠지더라도 이 유예 시간 동안은 마지막으로 알려진
// 상태를 그대로 보여주고, 이 시간을 넘겨야만 실제 비접속으로 표시한다.
const PRESENCE_GRACE_MS = 5 * 60 * 1000;
// 채널이 CHANNEL_ERROR/CLOSED 같은 상태 전환 없이 "겉으로는 구독 중"인
// 채로 조용히 죽어있는 경우가 있다(특히 탭이 오래 백그라운드에 머물러
// 브라우저가 하트비트 타이머까지 강하게 쓰로틀링한 뒤) — 이럴 땐 다른
// 참여자가 뽀모도로를 멈추거나 방을 나가도 sync 이벤트 자체가 안 와서
// 화면이 영원히 그 시점 상태로 멈춰 보인다. 그래서 (1) sync 이벤트가
// 일정 시간 이상 안 온 채로 방치되면, (2) 탭이 오래 숨겨졌다 다시
// 보이면, (3) 그 외에도 일정 주기마다 무조건, 채널을 통째로 버리고
// 새로 구독해 강제로 최신 상태를 받아온다 — (1)의 감지 로직 자체가
// 놓치는 경우가 있더라도 (3)이 최대 정체 시간을 보장한다.
const STALE_SYNC_MS = 20 * 1000;
const STALE_CHECK_INTERVAL_MS = 8 * 1000;
const LONG_HIDDEN_MS = 10 * 1000;
const FORCE_RECONNECT_INTERVAL_MS = 60 * 1000;

type PomodoroPhase = "focus" | "break" | "idle";

type PresencePayload = {
  name: string;
  lastTypedAt: number | null;
  pomodoroPhase: PomodoroPhase;
  // 진행률(fraction)을 그 순간 값 그대로 실어 보내면, 보내는 쪽 탭이
  // 백그라운드에 있을 때(집필 프로그램으로 옮겨가 있는 등) 브라우저가
  // setInterval을 강하게 쓰로틀링해서 몇 분에 한 번씩만 갱신되어 보는
  // 사람 화면엔 진행률이 실제보다 한참 뒤처진 채로 멈춰 보이는 문제가
  // 있었다 — 그래서 "이 스냅샷 시점의 진행률 + 그 시점 시각 + 이번
  // 구간 길이"만 보내고, 보는 쪽에서 지금 이 순간까지 얼마나 더
  // 흘렀는지 직접 계산해서 매초 스스로 앞으로 진행시킨다. 일시정지
  // 중에는 progressing을 false로 보내 그 시점에 고정시킨다.
  pomodoroProgressing: boolean;
  pomodoroElapsedFraction: number;
  pomodoroSnapshotAt: number;
  pomodoroDurationSeconds: number;
};

export type PresenceStatus = "offline" | "typing" | "idle";

// 화면 공유 프레임은 브로드캐스트로 오가는데, "공유 중지" 신호를 놓치는
// 경우(탭이 갑자기 닫히는 등)에 대비해 이 시간 동안 새 프레임이 안 오면
// 자동으로 공유가 끊긴 것으로 보고 지운다.
const SCREEN_FRAME_STALE_MS = 8000;
const SCREEN_FRAME_STALE_CHECK_MS = 3000;

export function useRoomPresence(
  roomId: string,
  selfId: string,
  selfName: string
) {
  const [presenceMap, setPresenceMap] = useState<
    Record<string, PresencePayload>
  >({});
  const [screenFrames, setScreenFrames] = useState<Record<string, string>>({});
  const screenFrameSeenAtRef = useRef<Map<string, number>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  // SUBSCRIBED 상태일 때만 track()을 보낼 수 있다 — 구독이 끊기거나
  // 재연결 중일 때 track()을 부르면 조용히 무시되거나 에러가 나서,
  // 다시 SUBSCRIBED가 될 때까지는 시도조차 하지 않는다.
  const subscribedRef = useRef(false);
  const lastTrackedRef = useRef(0);
  // presence에서 실제로 빠진 뒤에도 유예 시간 동안은 마지막으로 알려진
  // 상태를 보여주기 위한 캐시.
  const lastSeenAtRef = useRef<Map<string, number>>(new Map());
  const lastKnownPayloadRef = useRef<Map<string, PresencePayload>>(new Map());
  // 예전엔 track() 호출들을 Promise 체인으로 직렬화했는데, 그중 하나가
  // 영원히 응답하지 않으면(채널이 조용히 죽어있는 등) 그 뒤로 큐에 걸린
  // 모든 track() — 타이핑/작업상태/뽀모도로 갱신 전부 — 가 그 자리에서
  // 영구히 멈춰버리는 문제가 있었다. WebSocket은 한 연결 안에서 이미
  // 순서를 보장하므로 직렬화 큐 자체가 불필요했다 — 그냥 바로 부른다.
  const trackSafely = useCallback((payload: PresencePayload) => {
    if (!subscribedRef.current || !channelRef.current) return;
    channelRef.current.track(payload).catch(() => {});
  }, []);
  const selfPayloadRef = useRef<PresencePayload>({
    name: selfName,
    lastTypedAt: null,
    pomodoroPhase: "idle",
    pomodoroProgressing: false,
    pomodoroElapsedFraction: 0,
    // phase가 "idle"인 동안은 getPomodoroState가 이 값을 아예 안 써서,
    // 렌더 중 호출이 금지된 Date.now() 없이 자리표시자만 넣어둬도 된다 —
    // 실제 값은 최초로 setPomodoroState가 불릴 때 채워진다.
    pomodoroSnapshotAt: 0,
    pomodoroDurationSeconds: 0,
  });
  const [, setTick] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let retrySubscribeId: ReturnType<typeof setTimeout> | null = null;
    let currentChannel: RealtimeChannel | null = null;
    let lastSyncEventAt = Date.now();
    let hiddenSince: number | null = null;

    const syncFromState = () => {
      if (!currentChannel) return;
      lastSyncEventAt = Date.now();
      const state = currentChannel.presenceState<PresencePayload>();
      const next: Record<string, PresencePayload> = {};
      const now = Date.now();
      for (const key of Object.keys(state)) {
        const entries = state[key];
        const latest = entries[entries.length - 1];
        if (latest) {
          next[key] = latest;
          lastSeenAtRef.current.set(key, now);
          lastKnownPayloadRef.current.set(key, latest);
        }
      }
      setPresenceMap(next);
    };

    // 구독이 SUBSCRIBED 외의 상태(CHANNEL_ERROR/TIMED_OUT/CLOSED)로
    // 끝나버리면, track()이 계속 조용히 실패해서 나는 계속 연결돼
    // 있는데도 다른 참여자에게는 영원히 "비접속"으로 보이는 문제가
    // 있었다. 예전엔 같은 채널 인스턴스에 다시 subscribe()를 불렀는데,
    // supabase-js 채널은 한 번 에러난 뒤 같은 인스턴스로 재구독하는 걸
    // 신뢰성 있게 지원하지 않아서(내부 상태가 깨진 채로 남는 경우가
    // 있었다) 오히려 영영 복구가 안 되는 경우가 있었다 — 실패하면
    // 그 채널은 완전히 버리고 새 채널 인스턴스를 만들어 처음부터
    // 다시 구독한다.
    const setup = () => {
      if (cancelled) return;
      subscribedRef.current = false;
      const channel = supabase.channel(`room-presence:${roomId}`, {
        config: { presence: { key: selfId } },
      });
      currentChannel = channel;
      channelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, syncFromState)
        .on("presence", { event: "join" }, syncFromState)
        .on("presence", { event: "leave" }, syncFromState)
        .on("broadcast", { event: "screen-frame" }, ({ payload }) => {
          const { userId, dataUrl } = payload as { userId: string; dataUrl: string };
          if (!userId || !dataUrl) return;
          screenFrameSeenAtRef.current.set(userId, Date.now());
          setScreenFrames((prev) => ({ ...prev, [userId]: dataUrl }));
        })
        .on("broadcast", { event: "screen-share-stop" }, ({ payload }) => {
          const { userId } = payload as { userId: string };
          if (!userId) return;
          screenFrameSeenAtRef.current.delete(userId);
          setScreenFrames((prev) => {
            if (!(userId in prev)) return prev;
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        })
        .subscribe(async (status) => {
          if (cancelled) return;
          if (status === "SUBSCRIBED") {
            subscribedRef.current = true;
            await channel.track(selfPayloadRef.current).catch(() => {});
          } else if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            subscribedRef.current = false;
            if (retrySubscribeId) clearTimeout(retrySubscribeId);
            retrySubscribeId = setTimeout(() => {
              supabase.removeChannel(channel);
              setup();
            }, 2000);
          }
        });
    };
    setup();

    // 채널이 조용히 죽어있을 때(위 setup()의 CHANNEL_ERROR 핸들러조차
    // 안 불릴 때) 강제로 버리고 새로 구독한다.
    const hardReconnect = () => {
      if (cancelled) return;
      if (retrySubscribeId) {
        clearTimeout(retrySubscribeId);
        retrySubscribeId = null;
      }
      if (currentChannel) {
        supabase.removeChannel(currentChannel);
        currentChannel = null;
      }
      lastSyncEventAt = Date.now();
      setup();
    };

    const tickId = setInterval(() => setTick((t) => t + 1), 1000);
    // track() 하나가 유실돼도 다른 참여자 화면이 오래(다음 상태 변경
    // 전까지) 어긋난 채로 남지 않도록, 주기적으로 현재 상태를 다시
    // 알린다.
    const retrackId = setInterval(() => {
      trackSafely(selfPayloadRef.current);
    }, RETRACK_INTERVAL_MS);

    // sync 이벤트가 한참 안 왔다면(다른 참여자가 있는 방이라면 보통
    // RETRACK_INTERVAL_MS 주기로 계속 와야 정상) 이 탭의 연결이 조용히
    // 죽어있다고 보고 강제로 재연결한다.
    const staleCheckId = setInterval(() => {
      if (subscribedRef.current && Date.now() - lastSyncEventAt > STALE_SYNC_MS) {
        hardReconnect();
      }
    }, STALE_CHECK_INTERVAL_MS);

    // 위 감지 로직이 놓치는 경우에 대비한 안전망 — 무슨 이유로든
    // 이 탭이 다른 참여자의 최신 상태를 못 받아오고 있을 수 있으니,
    // 이상 징후 여부와 무관하게 일정 주기마다 무조건 재연결해서 최대
    // 정체 시간을 보장한다.
    const forceReconnectId = setInterval(() => {
      hardReconnect();
    }, FORCE_RECONNECT_INTERVAL_MS);

    // "공유 중지" 브로드캐스트를 놓친 화면 공유 프레임은 일정 시간
    // 갱신이 없으면 스스로 정리한다.
    const screenStaleId = setInterval(() => {
      const now = Date.now();
      let changed = false;
      setScreenFrames((prev) => {
        const next = { ...prev };
        for (const userId of Object.keys(next)) {
          const seenAt = screenFrameSeenAtRef.current.get(userId) ?? 0;
          if (now - seenAt > SCREEN_FRAME_STALE_MS) {
            delete next[userId];
            screenFrameSeenAtRef.current.delete(userId);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, SCREEN_FRAME_STALE_CHECK_MS);

    // 탭이 백그라운드에 있는 동안은 위 setInterval들 자체가 쓰로틀링돼서
    // 늦게(또는 거의 안) 실행된다. 잠깐 숨겨졌다 돌아온 정도면 재track만
    // 해도 충분하지만, 오래 숨겨져 있었다면(하트비트까지 쓰로틀링돼
    // 연결이 조용히 죽어있을 수 있으므로) 아예 채널을 새로 구독해
    // 최신 상태를 강제로 받아온다.
    const onActive = () => {
      const wasHiddenLong = hiddenSince !== null && Date.now() - hiddenSince > LONG_HIDDEN_MS;
      hiddenSince = null;
      if (wasHiddenLong) {
        hardReconnect();
      } else {
        trackSafely(selfPayloadRef.current);
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenSince = Date.now();
      } else {
        onActive();
      }
    };
    const onInactive = () => {
      hiddenSince = Date.now();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onActive);
    window.addEventListener("blur", onInactive);

    return () => {
      cancelled = true;
      if (retrySubscribeId) clearTimeout(retrySubscribeId);
      clearInterval(tickId);
      clearInterval(retrackId);
      clearInterval(staleCheckId);
      clearInterval(forceReconnectId);
      clearInterval(screenStaleId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onActive);
      window.removeEventListener("blur", onInactive);
      if (currentChannel) supabase.removeChannel(currentChannel);
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

  // 다른 참여자 카드에 내 뽀모도로 진행 상태(집중/휴식/대기)가 실시간으로
  // 보이도록 presence에 함께 실어 보낸다 — 이전엔 이 값이 전혀 공유되지
  // 않아서 다른 사람 눈엔 항상 "대기"로만 보였다.
  const setPomodoroState = useCallback(
    (
      phase: PomodoroPhase,
      elapsedFraction: number,
      progressing: boolean,
      durationSeconds: number
    ) => {
      selfPayloadRef.current = {
        ...selfPayloadRef.current,
        name: selfName,
        pomodoroPhase: phase,
        pomodoroProgressing: progressing,
        pomodoroElapsedFraction: elapsedFraction,
        pomodoroSnapshotAt: Date.now(),
        pomodoroDurationSeconds: durationSeconds,
      };
      trackSafely(selfPayloadRef.current);
    },
    [selfName, trackSafely]
  );

  // presence에 지금 없어도 유예 시간 안이면 마지막으로 알려진 값을
  // 그대로 쓴다 — 백그라운드 탭에서 하트비트가 지연돼 잠깐 presence에서
  // 빠지더라도 화면상으론 계속 접속 중인 것처럼 보이게 한다.
  const effectivePresence = useCallback(
    (userId: string): PresencePayload | null => {
      const live = presenceMap[userId];
      if (live) return live;
      const lastSeen = lastSeenAtRef.current.get(userId);
      if (lastSeen && Date.now() - lastSeen < PRESENCE_GRACE_MS) {
        return lastKnownPayloadRef.current.get(userId) ?? null;
      }
      return null;
    },
    [presenceMap]
  );

  const getStatus = useCallback(
    (userId: string): PresenceStatus => {
      const p = effectivePresence(userId);
      if (!p) return "offline";
      if (p.lastTypedAt && Date.now() - p.lastTypedAt < TYPING_WINDOW_MS) {
        return "typing";
      }
      return "idle";
    },
    [effectivePresence]
  );

  const getPomodoroState = useCallback(
    (userId: string) => {
      const p = effectivePresence(userId);
      if (!p || p.pomodoroPhase === "idle") return { phase: "idle" as const, elapsedFraction: 0 };
      // 진행 중이면 스냅샷 이후 흐른 시간만큼 로컬에서 그대로 더 진행시켜서
      // 보여준다 — 상대방 탭이 백그라운드라 갱신이 뜸해도 내 화면에서는
      // 매초 자연스럽게 앞으로 흘러간다. 일시정지 중이면 그 시점 값에
      // 고정한다.
      const extra = p.pomodoroProgressing
        ? (Date.now() - p.pomodoroSnapshotAt) / 1000 / Math.max(p.pomodoroDurationSeconds, 1)
        : 0;
      return {
        phase: p.pomodoroPhase,
        elapsedFraction: Math.min(1, Math.max(0, p.pomodoroElapsedFraction + extra)),
      };
    },
    [effectivePresence]
  );

  // 화면 공유 프레임(저해상도 스크린샷)을 이 방 채널로 그대로 흘려보낸다
  // — presence의 track()과 달리 상태로 남지 않고 그 순간 구독 중인
  // 사람에게만 전달되는 1회성 신호라, 서버에 아무것도 저장되지 않는다.
  const broadcastScreenFrame = useCallback(
    (dataUrl: string) => {
      if (!subscribedRef.current || !channelRef.current) return;
      channelRef.current.send({
        type: "broadcast",
        event: "screen-frame",
        payload: { userId: selfId, dataUrl },
      });
    },
    [selfId]
  );

  const stopScreenShareBroadcast = useCallback(() => {
    if (!subscribedRef.current || !channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "screen-share-stop",
      payload: { userId: selfId },
    });
  }, [selfId]);

  const getScreenFrame = useCallback(
    (userId: string): string | null => screenFrames[userId] ?? null,
    [screenFrames]
  );

  return {
    reportTyping,
    getStatus,
    setPomodoroState,
    getPomodoroState,
    broadcastScreenFrame,
    stopScreenShareBroadcast,
    getScreenFrame,
  };
}
