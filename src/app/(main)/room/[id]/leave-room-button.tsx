"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { leaveRoom } from "@/lib/rooms";
import { createClient } from "@/lib/supabase/client";

export function LeaveRoomButton({ roomId, selfId }: { roomId: string; selfId: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={async () => {
        if (!window.confirm("이 방에서 나가시겠어요?")) return;
        setPending(true);

        // let everyone else's participant card drop me immediately,
        // instead of waiting on DB-change replication.
        await new Promise<void>((resolve) => {
          const supabase = createClient();
          const channel = supabase.channel(`room-members-list:${roomId}`);
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            supabase.removeChannel(channel);
            resolve();
          };
          channel.subscribe((status) => {
            if (status === "SUBSCRIBED") {
              channel.send({
                type: "broadcast",
                event: "member-left",
                payload: { userId: selfId },
              });
              finish();
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
              finish();
            }
          });
          setTimeout(finish, 1500);
        });

        await leaveRoom(roomId);
        router.push("/forum");
      }}
      className="rounded-md border border-red-200/70 px-3 py-1.5 text-xs font-medium text-red-400/80 transition hover:border-red-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
    >
      {pending ? "나가는 중..." : "방 나가기"}
    </button>
  );
}
