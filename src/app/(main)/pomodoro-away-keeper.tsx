"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient, createIsolatedClient } from "@/lib/supabase/client";
import { setWorkStatus } from "@/lib/rooms";
import {
  clearStatusBeforeAway,
  readStatusBeforeAway,
  saveStatusBeforeAway,
} from "@/lib/auto-away";
import { usePomodoroContext } from "./pomodoro-context";
import type { PresencePayload } from "./room/[id]/use-room-presence";

const RETRACK_MS = 8000;

// 뽀모도로를 켜 두고(실행 중이거나 일시정지) 그 방 페이지를 떠나 poroom의 다른 페이지에 있는 동안:
//  1) 그 방에서 계속 "접속 중"으로 보이도록 방 접속 채널에 대신 붙어 있고(뽀모도로 진행 상태 포함),
//  2) 상태설정을 자동으로 바꿔 둔다 — 실행 중인 집중이면 "자리 비움", 일시정지/휴식이면 "휴식 중".
// 방 페이지로 돌아오면 방 화면이 원래 상태로 되돌린다(RoomView). 뽀모도로가 끝나거나 초기화되면 여기서
// 되돌리고 접속에서도 빠진다.
export function PomodoroAwayKeeper() {
  const pomodoro = usePomodoroContext();
  const pathname = usePathname();
  const tStatus = useTranslations("room.workStatusPicker.presets");

  const roomId = pomodoro.activeRoomId;
  // 접속 중으로 보이는 경우: (1) 그 방 페이지에 있을 때(방 화면이 직접 접속을 맡는다), (2) 그 방에서 뽀모도로를
  // "실행 중"이면서 poroom의 다른 페이지에 있을 때(이 컴포넌트가 대신 붙어 있는다). 일시정지·정지 상태로
  // 방을 떠나면 비접속이다.
  const active = !!roomId && pomodoro.started && pomodoro.running;
  const awayRoomId = active && pathname !== `/room/${roomId}` ? roomId : null;
  const statusKey: "away" | "resting" =
    pomodoro.running && pomodoro.phase === "focus" ? "away" : "resting";
  const statusLabel = tStatus(statusKey);

  // 최신 뽀모도로 값을 interval/cleanup에서 읽기 위한 ref.
  const latestRef = useRef({
    active,
    phase: pomodoro.phase,
    running: pomodoro.running,
    elapsedFraction: pomodoro.elapsedFraction,
    durationSeconds: (pomodoro.phase === "break" ? pomodoro.breakMinutes : pomodoro.focusMinutes) * 60,
  });
  useEffect(() => {
    latestRef.current = {
      active,
      phase: pomodoro.phase,
      running: pomodoro.running,
      elapsedFraction: pomodoro.elapsedFraction,
      durationSeconds:
        (pomodoro.phase === "break" ? pomodoro.breakMinutes : pomodoro.focusMinutes) * 60,
    };
  });

  // 1) 상태설정 자동 전환 — 떠나 있는 방(awayRoomId)이 생기거나 라벨이 바뀔 때.
  useEffect(() => {
    if (!awayRoomId) return;
    let cancelled = false;
    (async () => {
      if (readStatusBeforeAway(awayRoomId) === null) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data } = await supabase
          .from("room_members")
          .select("work_status")
          .eq("room_id", awayRoomId)
          .eq("user_id", user.id)
          .maybeSingle<{ work_status: string | null }>();
        if (cancelled) return;
        // 이미 자동으로 바꾼 값("자리 비움"/"휴식 중")이면 원래 상태로 저장하지 않는다.
        saveStatusBeforeAway(awayRoomId, data?.work_status ?? null);
      }
      if (!cancelled) await setWorkStatus(awayRoomId, statusLabel);
    })();
    return () => {
      cancelled = true;
    };
  }, [awayRoomId, statusLabel]);

  // 뽀모도로가 끝났거나 다른 방으로 바뀌어 더는 "떠나 있는" 상태가 아닐 때, 방 페이지가 아닌 곳이면 여기서 되돌린다.
  const lastAwayRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = lastAwayRef.current;
    lastAwayRef.current = awayRoomId;
    if (!prev || prev === awayRoomId) return;
    // 방 페이지로 돌아온 경우는 RoomView가 화면과 함께 되돌린다.
    if (pathname === `/room/${prev}`) return;
    const saved = readStatusBeforeAway(prev);
    if (saved !== null) {
      clearStatusBeforeAway(prev);
      void setWorkStatus(prev, saved || null);
    }
  }, [awayRoomId, pathname]);

  // 2) 떠나 있는 동안 그 방 접속 채널에 대신 붙어 있기.
  useEffect(() => {
    if (!awayRoomId) return;
    // 방 화면이 같은 이름의 채널을 쓰므로 별도 연결을 쓴다(공용 클라이언트에서는 같은 이름의 채널이 하나로 합쳐진다).
    const supabase = createIsolatedClient();
    let cancelled = false;
    let channel: RealtimeChannel | null = null;
    let retrackId: ReturnType<typeof setInterval> | null = null;
    let selfId: string | null = null;

    const sessionId = (globalThis.crypto?.randomUUID?.() ?? String(Math.random()));
    const payload = (): PresencePayload => {
      const l = latestRef.current;
      return {
        name: "",
        sessionId,
        lastTypedAt: null,
        pomodoroPhase: l.phase === "idle" ? "idle" : l.phase,
        pomodoroProgressing: l.running,
        pomodoroElapsedFraction: l.elapsedFraction,
        pomodoroSnapshotAt: Date.now(),
        pomodoroDurationSeconds: l.durationSeconds,
      };
    };

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      selfId = user.id;
      channel = supabase.channel(`room-presence:${awayRoomId}`, {
        config: { presence: { key: user.id }, private: true },
      });
      channel.subscribe((status) => {
        if (cancelled || !channel) return;
        if (status === "SUBSCRIBED") {
          channel.track(payload()).catch(() => {});
          retrackId = setInterval(() => channel?.track(payload()).catch(() => {}), RETRACK_MS);
        }
      });
    })();

    return () => {
      cancelled = true;
      if (retrackId) clearInterval(retrackId);
      if (channel) {
        // 뽀모도로가 끝나서 빠지는 경우에만 "나갔다"고 알린다 — 방 페이지로 돌아가는 경우엔 바로 방 화면이
        // 접속을 이어받으므로 깜빡이지 않게 알리지 않는다.
        if (!latestRef.current.active && selfId) {
          channel
            .send({ type: "broadcast", event: "presence-left", payload: { userId: selfId, sessionId } })
            .catch(() => {});
        }
        void supabase.removeChannel(channel).finally(() => supabase.realtime.disconnect());
      } else {
        supabase.realtime.disconnect();
      }
    };
  }, [awayRoomId]);

  return null;
}
