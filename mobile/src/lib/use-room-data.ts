import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { todayKst } from "./time";

export type RoomInfo = {
  id: string;
  name: string;
  color: string;
  tags: string[];
  record_visibility: "shared" | "private" | "free";
  join_type: "invite" | "open";
  capacity: number | null;
  is_system: boolean;
  owner_id: string;
};

export type RoomMember = {
  id: string;
  name: string;
  characterId: string | null;
  chatColor: string | null;
  workStatus: string | null;
  position: "novelist" | "webtoon";
  isOwner: boolean;
  isVice: boolean;
  recordsVisible: boolean;
  lastSeenAt: string | null;
  todayChars: number;
};

type MemberRow = {
  user_id: string;
  share_records: boolean;
  last_seen_at: string | null;
  is_vice: boolean;
  users: {
    name: string | null;
    character_id: string | null;
    chat_color: string | null;
    work_status: string | null;
    position: string | null;
  } | null;
};

const REFRESH_MS = 30_000;

// 방 정보와 참여자 목록 — 웹의 room/[id]/page.tsx와 같은 조회를 앱에서 직접 한다(RLS 동일 적용).
// 참여자 상태설정·접속 시각이 바뀔 수 있어 30초마다 다시 가져온다.
export function useRoomData(roomId: string, selfId: string) {
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const [{ data: roomRow }, { data: memberRows }] = await Promise.all([
      supabase
        .from("rooms")
        .select("id,name,color,tags,record_visibility,join_type,capacity,is_system,owner_id")
        .eq("id", roomId)
        .maybeSingle<RoomInfo>(),
      supabase
        .from("room_members")
        .select("user_id,share_records,last_seen_at,is_vice,users(name,character_id,chat_color,work_status,position)")
        .eq("room_id", roomId)
        .returns<MemberRow[]>(),
    ]);

    if (!roomRow) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const visibleIds = (memberRows ?? [])
      .filter(
        (m) =>
          roomRow.record_visibility === "shared" ||
          m.user_id === selfId ||
          (roomRow.record_visibility === "free" && m.share_records)
      )
      .map((m) => m.user_id);

    const { data: todayRows } = visibleIds.length
      ? await supabase
          .from("daily_records")
          .select("user_id,chars")
          .in("user_id", visibleIds)
          .eq("record_date", todayKst())
          .returns<{ user_id: string; chars: number }[]>()
      : { data: [] as { user_id: string; chars: number }[] };
    const todayByUser = new Map<string, number>();
    for (const r of todayRows ?? []) {
      todayByUser.set(r.user_id, (todayByUser.get(r.user_id) ?? 0) + r.chars);
    }

    setRoom(roomRow);
    setMembers(
      (memberRows ?? []).map((m) => ({
        id: m.user_id,
        name: m.users?.name || "알 수 없음",
        characterId: m.users?.character_id ?? null,
        chatColor: m.users?.chat_color ?? null,
        workStatus: m.users?.work_status ?? null,
        position: m.users?.position === "webtoon" ? "webtoon" : "novelist",
        isOwner: !roomRow.is_system && m.user_id === roomRow.owner_id,
        isVice: m.is_vice,
        recordsVisible: visibleIds.includes(m.user_id),
        lastSeenAt: m.last_seen_at,
        todayChars: todayByUser.get(m.user_id) ?? 0,
      }))
    );
    setLoading(false);
  }, [roomId, selfId]);

  useEffect(() => {
    // 마운트 시 한 번 가져오고 이후 주기적으로 갱신 — 외부(서버) 데이터 동기화라 정당한 effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  return { room, members, loading, notFound, reload: load };
}
