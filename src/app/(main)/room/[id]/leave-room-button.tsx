"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { leaveRoom } from "@/lib/rooms";
import { createClient } from "@/lib/supabase/client";
import { usePomodoroContext } from "../../pomodoro-context";

export function LeaveRoomButton({ roomId, selfId }: { roomId: string; selfId: string }) {
  const t = useTranslations("room.leaveRoomButton");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const pomodoro = usePomodoroContext();

  return (
    <button
      disabled={pending}
      onClick={async () => {
        if (!window.confirm(t("confirmLeave"))) return;
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

        // room_members에서 빠지고 나면 RLS가 이 방으로는 더 이상 기록을
        // 못 쓰게 막으므로, 나가기 전에 지금까지 쌓인 뽀모도로 시간을
        // 먼저 반영해둔다.
        if (pomodoro.activeRoomId === roomId) pomodoro.flushPending();

        await leaveRoom(roomId);
        router.push("/main");
      }}
      className="rounded-md border border-red-200/70 px-3 py-1.5 text-xs font-medium text-red-400/80 transition hover:border-red-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
    >
      {pending ? t("leaving") : t("leave")}
    </button>
  );
}
