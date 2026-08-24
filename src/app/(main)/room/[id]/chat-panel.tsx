"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { AdSlot } from "@/components/ad-slot";
import { chatBubbleClass } from "@/lib/palette";
import { ChatColorPicker } from "./chat-color-picker";
import { WhisperTargetPicker } from "./whisper-target-picker";
import type { Member } from "./room-view";

export type ChatMessage = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  targetUserId: string | null;
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
  canModerate,
  onActivity,
}: {
  roomId: string;
  selfId: string;
  members: Member[];
  initialMessages: ChatMessage[];
  canModerate: boolean;
  onActivity?: () => void;
}) {
  const t = useTranslations("room.chatPanel");
  const tCommon = useTranslations("room.common");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [selfColorOverride, setSelfColorOverride] = useState<string | null>(null);
  const [whisperTargetId, setWhisperTargetId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const nameOf = (userId: string) =>
    userId === selfId
      ? tCommon("self")
      : members.find((m) => m.id === userId)?.name ?? tCommon("unknown");

  const selfColor =
    selfColorOverride ?? members.find((m) => m.id === selfId)?.chatColor ?? null;

  const colorOf = (userId: string) =>
    userId === selfId
      ? selfColor
      : members.find((m) => m.id === userId)?.chatColor ?? null;

  // postgres_changes replication can lag or silently miss events behind
  // RLS, so new messages are pushed live via Broadcast instead — the same
  // mechanism Presence already uses reliably in this app. The DB insert
  // still happens for persistence/history on reload. Whispers are NOT put
  // on this room-wide channel (everyone in the room would receive the
  // payload even if the UI hid it) — they go out on the recipient's own
  // private inbox channel instead, see sendWhisper below.
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(
    null
  );

  useEffect(() => {
    const supabase = createClient();
    const roomChannel = supabase
      .channel(`room-chat:${roomId}`)
      .on("broadcast", { event: "message" }, ({ payload }) => {
        const msg = payload as ChatMessage;
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      })
      .on("broadcast", { event: "delete" }, ({ payload }) => {
        const { id } = payload as { id: string };
        setMessages((prev) => prev.filter((m) => m.id !== id));
      })
      .subscribe();
    channelRef.current = roomChannel;

    const inboxChannel = supabase
      .channel(`whisper-inbox:${roomId}:${selfId}`)
      .on("broadcast", { event: "whisper" }, ({ payload }) => {
        const msg = payload as ChatMessage;
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      })
      .subscribe();

    return () => {
      channelRef.current = null;
      supabase.removeChannel(roomChannel);
      supabase.removeChannel(inboxChannel);
    };
  }, [roomId, selfId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const sendWhisperBroadcast = (targetUserId: string, message: ChatMessage) => {
    const supabase = createClient();
    const channel = supabase.channel(`whisper-inbox:${roomId}:${targetUserId}`);
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({ type: "broadcast", event: "whisper", payload: message });
        setTimeout(() => supabase.removeChannel(channel), 500);
      }
    });
  };

  const send = async () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ room_id: roomId, user_id: selfId, content, target_user_id: whisperTargetId })
      .select("id,user_id,content,created_at,target_user_id")
      .single();
    if (error || !data) return;

    const message: ChatMessage = {
      id: data.id,
      userId: data.user_id,
      content: data.content,
      createdAt: data.created_at,
      targetUserId: data.target_user_id,
    };
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    if (message.targetUserId) {
      sendWhisperBroadcast(message.targetUserId, message);
    } else {
      channelRef.current?.send({ type: "broadcast", event: "message", payload: message });
    }
  };

  const removeMessage = async (id: string) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setMessages((prev) => prev.filter((m) => m.id !== id));
    const supabase = createClient();
    await supabase.from("chat_messages").delete().eq("id", id);
    channelRef.current?.send({ type: "broadcast", event: "delete", payload: { id } });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-sm border border-neutral-400 dark:border-neutral-600">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
        <span className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-neutral-400">{t("bubbleColorLabel")}</span>
          <ChatColorPicker current={selfColor} onChange={setSelfColorOverride} />
        </div>
      </div>
      <div ref={listRef} className="chat-scroll flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((m) => {
          const isSelf = m.userId === selfId;
          const canDelete = isSelf || canModerate;
          return (
            <div
              key={m.id}
              className={`group flex flex-col text-sm ${isSelf ? "items-end" : "items-start"}`}
            >
              <span className="flex items-center gap-1 text-[12px] text-neutral-400">
                {nameOf(m.userId)}
                {m.targetUserId && (
                  <span className="text-amber-500">
                    🤫{" "}
                    {isSelf
                      ? t("whisperToLabel", { name: nameOf(m.targetUserId) })
                      : t("whisperTag")}
                  </span>
                )}
              </span>
              <span className="flex max-w-[85%] items-center gap-1">
                <span
                  className={`mt-0.5 break-words rounded-lg px-3 py-1.5 ${chatBubbleClass(
                    colorOf(m.userId),
                    isSelf
                  )}`}
                >
                  {m.content}
                </span>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => removeMessage(m.id)}
                    title={t("deleteMessage")}
                    className="shrink-0 text-[11px] text-neutral-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100 dark:text-neutral-600"
                  >
                    ✕
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>
      {whisperTargetId && (
        <div className="flex items-center justify-between border-t border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          <span>🤫 {t("whisperingTo", { name: nameOf(whisperTargetId) })}</span>
          <button
            type="button"
            onClick={() => setWhisperTargetId(null)}
            className="font-medium hover:underline"
          >
            {t("whisperOff")}
          </button>
        </div>
      )}
      <div className="flex gap-2 border-t border-neutral-100 dark:border-neutral-800 p-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            title={t("whisperButton")}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-sm transition ${
              whisperTargetId
                ? "border-amber-400 bg-amber-400 text-white"
                : "border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
            }`}
          >
            🤫
          </button>
          {pickerOpen && (
            <WhisperTargetPicker
              members={members}
              selfId={selfId}
              onPick={(userId) => {
                setWhisperTargetId(userId);
                setPickerOpen(false);
              }}
              onOff={() => {
                setWhisperTargetId(null);
                setPickerOpen(false);
              }}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            onActivity?.();
          }}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={whisperTargetId ? t("whisperInputPlaceholder") : t("inputPlaceholder")}
          className="min-w-0 flex-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
        />
        <button
          onClick={send}
          title={t("send")}
          aria-label={t("send")}
          className="shrink-0 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700"
        >
          ⌂
        </button>
      </div>
      <div className="h-14 overflow-hidden border-t border-neutral-100 dark:border-neutral-800">
        <AdSlot className="h-14" />
      </div>
    </div>
  );
}
