"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RecordVisibility } from "@/lib/rooms";
import type { Member } from "./room-view";

type MemberRoomRow = {
  share_records: boolean;
  users: {
    name: string | null;
    email: string;
    character_id: string | null;
    chat_color: string | null;
    work_status: string | null;
  } | null;
};

export function useLiveMembers(
  roomId: string,
  selfId: string,
  initialMembers: Member[],
  recordVisibility: RecordVisibility
) {
  const [members, setMembers] = useState<Member[]>(initialMembers);

  // if the server-rendered member list changes (e.g. after a settings
  // update triggers a revalidation), pick that up too — adjust state
  // during render rather than in an effect, per React's guidance for
  // resetting state when a prop changes.
  const [syncedInitialMembers, setSyncedInitialMembers] = useState(initialMembers);
  if (initialMembers !== syncedInitialMembers) {
    setSyncedInitialMembers(initialMembers);
    setMembers(initialMembers);
  }

  // "상태설정"을 누른 사람 본인 화면은 서버 왕복(및 users 테이블 realtime
  // 전파)을 기다리지 않고 곧바로 반영되도록 낙관적으로 갱신한다.
  const updateSelfWorkStatus = (status: string | null) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === selfId ? { ...m, workStatus: status } : m))
    );
  };

  useEffect(() => {
    const supabase = createClient();

    const addMember = async (userId: string) => {
      const { data: row } = await supabase
        .from("room_members")
        .select("share_records,users(name,email,character_id,chat_color,work_status)")
        .eq("room_id", roomId)
        .eq("user_id", userId)
        .maybeSingle<MemberRoomRow>();
      if (!row) return;

      const recordsVisible =
        recordVisibility === "shared" ||
        userId === selfId ||
        (recordVisibility === "free" && row.share_records === true);

      setMembers((prev) => {
        if (prev.some((m) => m.id === userId)) return prev;
        return [
          ...prev,
          {
            id: userId,
            name: row.users?.name || row.users?.email || "알 수 없음",
            characterId: row.users?.character_id ?? null,
            chatColor: row.users?.chat_color ?? null,
            recordsVisible,
            lastSeenLabel: null,
            workStatus: row.users?.work_status ?? null,
          },
        ];
      });
    };

    const removeMember = (userId: string) => {
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    };

    // postgres_changes replication can lag or miss events behind RLS, so
    // joins/leaves are also announced live via Broadcast — the same
    // mechanism Presence already uses reliably in this app. Whichever
    // arrives first wins; both paths dedupe against the current state.
    const channel = supabase
      .channel(`room-members-list:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.new as { user_id: string };
          addMember(row.user_id);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.old as { user_id?: string };
          if (row.user_id) removeMember(row.user_id);
        }
      )
      .on("broadcast", { event: "member-joined" }, ({ payload }) => {
        addMember((payload as { userId: string }).userId);
      })
      .on("broadcast", { event: "member-left" }, ({ payload }) => {
        removeMember((payload as { userId: string }).userId);
      })
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "users" },
        (payload) => {
          const row = payload.new as {
            id: string;
            name: string | null;
            email: string;
            character_id: string | null;
            chat_color: string | null;
            work_status: string | null;
          };
          setMembers((prev) =>
            prev.map((m) =>
              m.id === row.id
                ? {
                    ...m,
                    name: row.name || row.email || m.name,
                    characterId: row.character_id ?? null,
                    chatColor: row.chat_color ?? null,
                    workStatus: row.work_status ?? null,
                  }
                : m
            )
          );
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.send({ type: "broadcast", event: "member-joined", payload: { userId: selfId } });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, selfId, recordVisibility]);

  return { members, updateSelfWorkStatus };
}
