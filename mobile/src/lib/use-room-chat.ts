import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type ChatMessage = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  targetUserId: string | null;
};

type MessageRow = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  target_user_id: string | null;
};

const toMessage = (r: MessageRow): ChatMessage => ({
  id: r.id,
  userId: r.user_id,
  content: r.content,
  createdAt: r.created_at,
  targetUserId: r.target_user_id,
});

// 웹(chat-panel.tsx)과 같은 방식 — 최근 50개는 DB에서 읽고, 새 메시지는 방 채널
// (room-chat:방id)의 broadcast로 실시간 전달한다. 귓속말은 받는 사람 전용 채널
// (whisper-inbox:방id:사용자id)로 따로 온다. 보낼 때는 DB에 저장한 뒤 broadcast한다.
export function useRoomChat(roomId: string, selfId: string, onIncoming?: () => void) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onIncomingRef = useRef(onIncoming);
  useEffect(() => {
    onIncomingRef.current = onIncoming;
  }, [onIncoming]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("chat_messages")
      .select("id,user_id,content,created_at,target_user_id")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<MessageRow[]>()
      .then(({ data }) => {
        if (cancelled) return;
        const initial = (data ?? []).map(toMessage).reverse();
        // 로딩 중에 이미 실시간으로 받은 메시지는 보존하며 합친다.
        setMessages((prev) => {
          const seen = new Set(initial.map((m) => m.id));
          return [...initial, ...prev.filter((m) => !seen.has(m.id))];
        });
      });

    const add = (msg: ChatMessage) =>
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));

    // 실시간 신호는 방 참여자 누구나 보낼 수 있어 내용을 믿을 수 없다(웹과 같은 이유) — 신호에는 메시지 id만
    // 실려 오고, DB(RLS로 보호됨)에서 그 메시지를 직접 읽어 확인한 것만 화면에 반영한다.
    const acceptSignal = async (payload: unknown): Promise<ChatMessage | null> => {
      const id = (payload as { id?: unknown } | null)?.id;
      if (typeof id !== "string") return null;
      const { data } = await supabase
        .from("chat_messages")
        .select("id,user_id,content,created_at,target_user_id")
        .eq("id", id)
        .maybeSingle<MessageRow>();
      if (!data) return null;
      const msg = toMessage(data);
      add(msg);
      return msg;
    };

    const roomChannel = supabase
      .channel(`room-chat:${roomId}`, { config: { private: true } })
      .on("broadcast", { event: "message" }, ({ payload }) => {
        acceptSignal(payload).then((msg) => {
          if (msg && msg.userId !== selfId) onIncomingRef.current?.();
        });
      })
      .on("broadcast", { event: "delete" }, ({ payload }) => {
        // DB에서 정말 지워진 메시지일 때만 화면에서 뺀다.
        const id = (payload as { id?: unknown } | null)?.id;
        if (typeof id !== "string") return;
        supabase
          .from("chat_messages")
          .select("id")
          .eq("id", id)
          .maybeSingle()
          .then(({ data }) => {
            if (!data) setMessages((prev) => prev.filter((m) => m.id !== id));
          });
      })
      .on("broadcast", { event: "clear" }, () => {
        // 방장이 채팅을 초기화했다 — 신호만 믿지 않고 DB 기준으로 다시 불러온다.
        supabase
          .from("chat_messages")
          .select("id,user_id,content,created_at,target_user_id")
          .eq("room_id", roomId)
          .order("created_at", { ascending: false })
          .limit(50)
          .returns<MessageRow[]>()
          .then(({ data }) => setMessages((data ?? []).map(toMessage).reverse()));
      })
      .subscribe();
    channelRef.current = roomChannel;

    const inboxChannel = supabase
      .channel(`whisper-inbox:${roomId}:${selfId}`, { config: { private: true } })
      .on("broadcast", { event: "whisper" }, ({ payload }) => {
        acceptSignal(payload).then((msg) => {
          if (msg) onIncomingRef.current?.();
        });
      })
      .subscribe();

    return () => {
      cancelled = true;
      channelRef.current = null;
      supabase.removeChannel(roomChannel);
      supabase.removeChannel(inboxChannel);
    };
  }, [roomId, selfId]);

  const send = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text) return false;
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({ room_id: roomId, user_id: selfId, content: text, target_user_id: null })
        .select("id,user_id,content,created_at,target_user_id")
        .single<MessageRow>();
      if (error || !data) return false;
      const message = toMessage(data);
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      channelRef.current?.send({ type: "broadcast", event: "message", payload: { id: message.id } });
      return true;
    },
    [roomId, selfId]
  );

  const remove = useCallback(async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    await supabase.from("chat_messages").delete().eq("id", id);
    channelRef.current?.send({ type: "broadcast", event: "delete", payload: { id } });
  }, []);

  return { messages, send, remove };
}
