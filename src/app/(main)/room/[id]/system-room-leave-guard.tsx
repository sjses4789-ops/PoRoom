"use client";

import { useEffect, useRef } from "react";
import { leaveRoom } from "@/lib/rooms";
import { usePomodoroContext } from "../../pomodoro-context";

// 마감방/새벽반은 "잠깐 들르는" 방이라, 멤버로 남아 있다는 것은 곧 "지금 이 방에 있다"는 뜻이다. 페이지를 떠나면
// (탭을 닫거나, poroom의 다른 페이지로 이동하거나) 방에서 나간 것으로 보아 참여자 목록에서도 사라진다 —
// 일반 방은 "나가기"를 눌러야만 멤버에서 빠진다.
// 방별 "나가기 예약" — 같은 방 화면이 곧바로 다시 붙으면(새 인스턴스여도) 예약을 취소한다.
const pendingLeave = new Map<string, ReturnType<typeof setTimeout>>();

export function SystemRoomLeaveGuard({ roomId }: { roomId: string }) {
  const pomodoro = usePomodoroContext();
  const pomodoroRef = useRef(pomodoro);
  useEffect(() => {
    pomodoroRef.current = pomodoro;
  });

  useEffect(() => {
    // 같은 방 화면이 곧바로 다시 붙은 경우(개발 모드의 Strict Mode 재마운트, 같은 방으로의 이동)는 나간 게 아니다.
    const pending = pendingLeave.get(roomId);
    if (pending) {
      clearTimeout(pending);
      pendingLeave.delete(roomId);
    }

    const handleUnload = () => {
      navigator.sendBeacon(
        "/api/leave-room",
        new Blob([JSON.stringify({ roomId })], { type: "application/json" })
      );
    };
    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);

      // 이전에는 "처음 정리 단계는 건너뛰기"로 Strict Mode를 피했는데, 운영 환경에서는 그 첫 정리가 바로 진짜
      // 이동이라 poroom 안에서 다른 페이지로 가도 방을 나간 것으로 처리되지 않았다(참여자 목록에 계속 남았다).
      // 지금은 잠깐(재마운트가 없는지 보려고) 기다렸다가 나간다.
      const timer = setTimeout(() => {
        pendingLeave.delete(roomId);
        const p = pomodoroRef.current;
        // 이 방의 뽀모도로가 돌고 있었다면 기록을 마무리하고 멈춘다 — 방을 나갔으니 이 방에는 더 쌓이지 않는다.
        if (p.activeRoomId === roomId && p.running) {
          p.flushPending();
          p.pause();
        }
        void leaveRoom(roomId);
      }, 400);
      pendingLeave.set(roomId, timer);
    };
  }, [roomId]);

  return null;
}
