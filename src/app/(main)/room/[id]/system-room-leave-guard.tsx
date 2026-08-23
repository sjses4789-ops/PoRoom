"use client";

import { useEffect, useRef } from "react";
import { leaveRoom } from "@/lib/rooms";

// 마감방/새벽반 are "drop-in" rooms: being a member only means "currently
// here". Leaving the page (closing the tab, navigating elsewhere in the
// app) counts as leaving the room, unlike regular rooms where membership
// persists until an explicit "나가기".
export function SystemRoomLeaveGuard({ roomId }: { roomId: string }) {
  const survivedFirstCleanupRef = useRef(false);

  useEffect(() => {
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

      // React Strict Mode intentionally mounts, unmounts, then remounts
      // once in dev — skip the very first synthetic cleanup so we don't
      // leave the room the instant we joined it.
      if (survivedFirstCleanupRef.current) {
        leaveRoom(roomId);
      }
      survivedFirstCleanupRef.current = true;
    };
  }, [roomId]);

  return null;
}
