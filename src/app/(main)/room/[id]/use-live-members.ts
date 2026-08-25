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

// use-room-presence.ts와 동일한 문제: 탭이 오래 열려있으면 이 채널의
// 연결도 조용히 죽어있을 수 있고, 그동안 놓친 입장/퇴장/상태변경
// postgres_changes·broadcast 이벤트는 되돌릴 방법이 없다(presence의
// sync와 달리 재연결해도 놓친 이벤트가 다시 오지 않는다) — 그래서
// 재연결 시 목록 자체를 DB에서 다시 통째로 읽어와 확실히 맞춘다.
const LONG_HIDDEN_MS = 10 * 1000;
// 위 재연결 감지가 놓치는 경우에 대비한 안전망 — 회원 목록은 (프레즌스와
// 달리) DB에 실제로 남아있는 진실이므로, 이상 징후 여부와 무관하게
// 일정 주기마다 무조건 다시 읽어와 "상태설정"·입장·퇴장이 화면에
// 반영되기까지 걸리는 최대 시간을 보장한다.
const POLL_INTERVAL_MS = 15 * 1000;

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
    let cancelled = false;
    let currentChannel: ReturnType<typeof supabase.channel> | null = null;
    let retrySubscribeId: ReturnType<typeof setTimeout> | null = null;
    let hiddenSince: number | null = null;

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

    // 채널이 끊겨있던 동안 놓친 입장/퇴장/상태변경 이벤트를 되돌릴 방법이
    // 없으므로, 재연결 시 DB에서 현재 멤버 목록을 통째로 다시 읽어와
    // 확실히 맞춘다.
    const refetchAll = async () => {
      const { data: rows } = await supabase
        .from("room_members")
        .select("user_id,share_records,users(name,email,character_id,chat_color,work_status)")
        .eq("room_id", roomId)
        .returns<(MemberRoomRow & { user_id: string })[]>();
      if (!rows || cancelled) return;
      setMembers((prev) => {
        const prevById = new Map(prev.map((m) => [m.id, m]));
        return rows.map((row) => {
          const existing = prevById.get(row.user_id);
          return {
            id: row.user_id,
            name: row.users?.name || row.users?.email || existing?.name || "알 수 없음",
            characterId: row.users?.character_id ?? null,
            chatColor: row.users?.chat_color ?? null,
            recordsVisible:
              recordVisibility === "shared" ||
              row.user_id === selfId ||
              (recordVisibility === "free" && row.share_records === true),
            lastSeenLabel: existing?.lastSeenLabel ?? null,
            workStatus: row.users?.work_status ?? null,
          };
        });
      });
    };

    // postgres_changes replication can lag or miss events behind RLS, so
    // joins/leaves are also announced live via Broadcast — the same
    // mechanism Presence already uses reliably in this app. Whichever
    // arrives first wins; both paths dedupe against the current state.
    const setup = () => {
      if (cancelled) return;
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
          if (cancelled) return;
          if (status === "SUBSCRIBED") {
            channel.send({ type: "broadcast", event: "member-joined", payload: { userId: selfId } });
            refetchAll();
          } else if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            if (retrySubscribeId) clearTimeout(retrySubscribeId);
            retrySubscribeId = setTimeout(() => {
              supabase.removeChannel(channel);
              setup();
            }, 2000);
          }
        });
      currentChannel = channel;
    };
    setup();

    // 탭이 백그라운드에 있는 동안은 화면을 보고 있지 않으니 폴링을
    // 쉬어서 불필요한 DB 조회를 줄인다 — 다시 보이면(위 onActive) 곧바로
    // 한 번 재조회하므로 놓치는 변경사항은 없다.
    const pollId = setInterval(() => {
      if (document.visibilityState === "visible") refetchAll();
    }, POLL_INTERVAL_MS);

    // use-room-presence.ts와 동일한 이유로, 탭이 오래 숨겨져 있다 돌아오면
    // 연결이 조용히 죽어있을 수 있으니 채널을 통째로 새로 구독하고
    // 목록도 다시 불러온다.
    const onActive = () => {
      const wasHiddenLong = hiddenSince !== null && Date.now() - hiddenSince > LONG_HIDDEN_MS;
      hiddenSince = null;
      if (wasHiddenLong) {
        if (retrySubscribeId) clearTimeout(retrySubscribeId);
        if (currentChannel) supabase.removeChannel(currentChannel);
        setup();
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
      clearInterval(pollId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onActive);
      window.removeEventListener("blur", onInactive);
      if (currentChannel) supabase.removeChannel(currentChannel);
    };
  }, [roomId, selfId, recordVisibility]);

  return { members, updateSelfWorkStatus };
}
