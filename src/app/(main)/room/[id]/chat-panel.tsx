"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdSlot } from "@/components/ad-slot";
import { chatBubbleClass } from "@/lib/palette";
import { ChatColorPicker } from "./chat-color-picker";
import type { Member } from "./room-view";

export type ChatMessage = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
};

export type LatestNotice = {
  title: string;
  content: string;
  authorName: string;
};

export function ChatPanel({
  roomId,
  selfId,
  members,
  initialMessages,
  onActivity,
}: {
  roomId: string;
  selfId: string;
  members: Member[];
  initialMessages: ChatMessage[];
  onActivity?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [selfColorOverride, setSelfColorOverride] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const nameOf = (userId: string) =>
    userId === selfId
      ? "나"
      : members.find((m) => m.id === userId)?.name ?? "알 수 없음";

  const selfColor =
    selfColorOverride ?? members.find((m) => m.id === selfId)?.chatColor ?? null;

  const colorOf = (userId: string) =>
    userId === selfId
      ? selfColor
      : members.find((m) => m.id === userId)?.chatColor ?? null;

  // postgres_changes replication can lag or silently miss events behind
  // RLS, so new messages are pushed live via Broadcast instead — the same
  // mechanism Presence already uses reliably in this app. The DB insert
  // still happens for persistence/history on reload.
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(
    null
  );

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`room-chat:${roomId}`)
      .on("broadcast", { event: "message" }, ({ payload }) => {
        const msg = payload as ChatMessage;
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      })
      .subscribe();
    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ room_id: roomId, user_id: selfId, content })
      .select("id,user_id,content,created_at")
      .single();
    if (error || !data) return;

    const message: ChatMessage = {
      id: data.id,
      userId: data.user_id,
      content: data.content,
      createdAt: data.created_at,
    };
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    channelRef.current?.send({ type: "broadcast", event: "message", payload: message });
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
        <span className="text-sm font-semibold text-neutral-900 dark:text-white">채팅</span>
        <ChatColorPicker current={selfColor} onChange={setSelfColorOverride} />
      </div>
      <div ref={listRef} className="chat-scroll flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((m) => {
          const isSelf = m.userId === selfId;
          return (
            <div
              key={m.id}
              className={`flex flex-col text-sm ${isSelf ? "items-end" : "items-start"}`}
            >
              <span className="text-[12px] text-neutral-400">
                {nameOf(m.userId)}
              </span>
              <span
                className={`mt-0.5 max-w-[85%] break-words rounded-lg px-3 py-1.5 ${chatBubbleClass(
                  colorOf(m.userId),
                  isSelf
                )}`}
              >
                {m.content}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 border-t border-neutral-100 dark:border-neutral-800 p-3">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            onActivity?.();
          }}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="메시지 입력..."
          className="flex-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
        />
        <button
          onClick={send}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700"
        >
          전송
        </button>
      </div>
      <div className="h-14 overflow-hidden border-t border-neutral-100 dark:border-neutral-800">
        <AdSlot className="h-14" />
      </div>
    </div>
  );
}
