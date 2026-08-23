"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const TYPING_WINDOW_MS = 5000;
const TRACK_THROTTLE_MS = 2000;

type PresencePayload = {
  name: string;
  lastTypedAt: number | null;
  workStatus: string | null;
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
      .then(() => channelRef.current?.track(payload));
  }, []);
  const selfPayloadRef = useRef<PresencePayload>({
    name: selfName,
    lastTypedAt: null,
    workStatus: null,
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

    channel
      .on("presence", { event: "sync" }, syncFromState)
      .on("presence", { event: "join" }, syncFromState)
      .on("presence", { event: "leave" }, syncFromState)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track(selfPayloadRef.current);
        }
      });

    const tickId = setInterval(() => setTick((t) => t + 1), 1000);

    return () => {
      clearInterval(tickId);
      supabase.removeChannel(channel);
    };
  }, [roomId, selfId, selfName]);

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

  return { reportTyping, getStatus, getWorkStatus, setWorkStatus };
}
