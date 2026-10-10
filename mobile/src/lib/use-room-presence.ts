import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// 웹(src/app/(main)/room/[id]/use-room-presence.ts)과 같은 채널 이름·같은 payload 형식을
// 써서, 웹 사용자와 앱 사용자가 같은 방에서 서로를 그대로 본다. 화면 공유 프레임은
// 앱에서 쓰지 않으므로 받지 않는다.
const TYPING_WINDOW_MS = 5000;
const TRACK_THROTTLE_MS = 2000;
const RETRACK_INTERVAL_MS = 8000;
const PRESENCE_GRACE_MS = 5 * 60 * 1000;
const STALE_SYNC_MS = 20 * 1000;
const STALE_CHECK_INTERVAL_MS = 8 * 1000;
const LONG_BACKGROUND_MS = 10 * 1000;
const FORCE_RECONNECT_INTERVAL_MS = 60 * 1000;

export type PomodoroPhase = "focus" | "break" | "idle";
export type PresenceStatus = "offline" | "typing" | "idle";

type PresencePayload = {
  name: string;
  lastTypedAt: number | null;
  pomodoroPhase: PomodoroPhase;
  pomodoroProgressing: boolean;
  pomodoroElapsedFraction: number;
  pomodoroSnapshotAt: number;
  pomodoroDurationSeconds: number;
};

export function useRoomPresence(roomId: string, selfId: string, selfName: string) {
  const [presenceMap, setPresenceMap] = useState<Record<string, PresencePayload>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribedRef = useRef(false);
  const lastTrackedRef = useRef(0);
  const lastSeenAtRef = useRef<Map<string, number>>(new Map());
  const lastKnownPayloadRef = useRef<Map<string, PresencePayload>>(new Map());
  const selfPayloadRef = useRef<PresencePayload>({
    name: selfName,
    lastTypedAt: null,
    pomodoroPhase: "idle",
    pomodoroProgressing: false,
    pomodoroElapsedFraction: 0,
    pomodoroSnapshotAt: 0,
    pomodoroDurationSeconds: 0,
  });
  const [, setTick] = useState(0);

  const trackSafely = useCallback((payload: PresencePayload) => {
    if (!subscribedRef.current || !channelRef.current) return;
    channelRef.current.track(payload).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retryId: ReturnType<typeof setTimeout> | null = null;
    let currentChannel: RealtimeChannel | null = null;
    let lastSyncEventAt = Date.now();
    let backgroundSince: number | null = null;

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

    const setup = () => {
      if (cancelled) return;
      subscribedRef.current = false;
      const channel = supabase.channel(`room-presence:${roomId}`, {
        config: { presence: { key: selfId }, private: true },
      });
      currentChannel = channel;
      channelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, syncFromState)
        .on("presence", { event: "join" }, syncFromState)
        .on("presence", { event: "leave" }, syncFromState)
        .subscribe(async (status) => {
          if (cancelled) return;
          if (status === "SUBSCRIBED") {
            subscribedRef.current = true;
            await channel.track(selfPayloadRef.current).catch(() => {});
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            subscribedRef.current = false;
            if (retryId) clearTimeout(retryId);
            retryId = setTimeout(() => {
              supabase.removeChannel(channel);
              setup();
            }, 2000);
          }
        });
    };
    setup();

    const hardReconnect = () => {
      if (cancelled) return;
      if (retryId) {
        clearTimeout(retryId);
        retryId = null;
      }
      if (currentChannel) {
        supabase.removeChannel(currentChannel);
        currentChannel = null;
      }
      lastSyncEventAt = Date.now();
      setup();
    };

    const tickId = setInterval(() => setTick((t) => t + 1), 1000);
    const retrackId = setInterval(() => trackSafely(selfPayloadRef.current), RETRACK_INTERVAL_MS);
    const staleId = setInterval(() => {
      if (subscribedRef.current && Date.now() - lastSyncEventAt > STALE_SYNC_MS) hardReconnect();
    }, STALE_CHECK_INTERVAL_MS);
    const forceId = setInterval(hardReconnect, FORCE_RECONNECT_INTERVAL_MS);

    // 앱이 백그라운드에 오래 있었다면 연결이 조용히 죽어 있을 수 있으니 새로 구독한다.
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        const wasLong = backgroundSince !== null && Date.now() - backgroundSince > LONG_BACKGROUND_MS;
        backgroundSince = null;
        if (wasLong) hardReconnect();
        else trackSafely(selfPayloadRef.current);
      } else if (backgroundSince === null) {
        backgroundSince = Date.now();
      }
    });

    return () => {
      cancelled = true;
      if (retryId) clearTimeout(retryId);
      clearInterval(tickId);
      clearInterval(retrackId);
      clearInterval(staleId);
      clearInterval(forceId);
      appStateSub.remove();
      if (currentChannel) supabase.removeChannel(currentChannel);
      channelRef.current = null;
    };
  }, [roomId, selfId, trackSafely]);

  const reportTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTrackedRef.current < TRACK_THROTTLE_MS) return;
    lastTrackedRef.current = now;
    selfPayloadRef.current = { ...selfPayloadRef.current, name: selfName, lastTypedAt: now };
    trackSafely(selfPayloadRef.current);
  }, [selfName, trackSafely]);

  const setPomodoroState = useCallback(
    (phase: PomodoroPhase, elapsedFraction: number, progressing: boolean, durationSeconds: number) => {
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
      if (p.lastTypedAt && Date.now() - p.lastTypedAt < TYPING_WINDOW_MS) return "typing";
      return "idle";
    },
    [effectivePresence]
  );

  const getPomodoroState = useCallback(
    (userId: string) => {
      const p = effectivePresence(userId);
      if (!p || p.pomodoroPhase === "idle") return { phase: "idle" as const, elapsedFraction: 0 };
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

  return { reportTyping, getStatus, getPomodoroState, setPomodoroState };
}
