"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { AdSlot } from "@/components/ad-slot";
import { chatBubbleClass } from "@/lib/palette";
import { characterSrc } from "@/lib/characters";
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

const CHAT_FONT_SIZE_STORAGE_KEY = "poroom:chat-font-size";
const DEFAULT_CHAT_FONT_SIZE = 14;
const MIN_CHAT_FONT_SIZE = 11;
const MAX_CHAT_FONT_SIZE = 20;

export function ChatPanel({
  roomId,
  selfId,
  members,
  initialMessages,
  canModerate,
  onActivity,
  collapsed,
  onToggleCollapsed,
}: {
  roomId: string;
  selfId: string;
  members: Member[];
  initialMessages: ChatMessage[];
  canModerate: boolean;
  onActivity?: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const t = useTranslations("room.chatPanel");
  const tCommon = useTranslations("room.common");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [selfColorOverride, setSelfColorOverride] = useState<string | null>(null);
  const [whisperTargetId, setWhisperTargetId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const collapsedRef = useRef(collapsed);
  useEffect(() => {
    collapsedRef.current = collapsed;
  }, [collapsed]);

  // 접힌 상태가 바깥(부모)에서 바뀌어 펼쳐지면 쌓인 안 읽은 개수를 비운다
  // — 다른 상태 동기화와 동일하게, prop 참조가 바뀔 때 렌더 중 바로 맞춘다.
  const [syncedCollapsed, setSyncedCollapsed] = useState(collapsed);
  if (collapsed !== syncedCollapsed) {
    setSyncedCollapsed(collapsed);
    if (!collapsed) setUnreadCount(0);
  }

  // 채팅 메시지 글자 크기를 참여자가 직접 조절할 수 있게 한다 — 기기에
  // 저장해두고 다음에 이 방을 열 때도 유지한다.
  const [chatFontSize, setChatFontSize] = useState(DEFAULT_CHAT_FONT_SIZE);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const stored = Number(window.localStorage.getItem(CHAT_FONT_SIZE_STORAGE_KEY));
      if (stored >= MIN_CHAT_FONT_SIZE && stored <= MAX_CHAT_FONT_SIZE) setChatFontSize(stored);
    } catch {
      // 로컬스토리지를 못 쓰는 환경이면 기본값을 그대로 둔다.
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const adjustChatFontSize = (delta: number) => {
    setChatFontSize((prev) => {
      const next = Math.min(MAX_CHAT_FONT_SIZE, Math.max(MIN_CHAT_FONT_SIZE, prev + delta));
      try {
        window.localStorage.setItem(CHAT_FONT_SIZE_STORAGE_KEY, String(next));
      } catch {
        // 저장 실패해도 이번 세션 내 크기 조절 자체는 계속 동작한다.
      }
      return next;
    });
  };

  const nameOf = (userId: string) =>
    userId === selfId
      ? tCommon("self")
      : members.find((m) => m.id === userId)?.name ?? tCommon("unknown");

  // 채팅 메시지 옆에 보낸 사람의 캐릭터를 원형으로 보여줘서, 색상 말고도
  // 캐릭터로 구분할 수 있게 한다.
  const characterIdOf = (userId: string) =>
    members.find((m) => m.id === userId)?.characterId ?? null;

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
        if (collapsedRef.current && msg.userId !== selfId) {
          setUnreadCount((c) => c + 1);
        }
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
        if (collapsedRef.current) {
          setUnreadCount((c) => c + 1);
        }
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

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapsed}
        title={t("expand")}
        className="flex h-[500px] w-full flex-col items-center justify-start gap-3 overflow-hidden rounded-sm border border-neutral-400 py-4 text-neutral-500 transition hover:bg-neutral-50 lg:h-[680px] dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        <span aria-hidden className="text-base">
          ▸
        </span>
        {unreadCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-300 px-1.5 text-[11px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <span
          className="mt-1 text-xs font-semibold text-neutral-700 dark:text-neutral-200"
          style={{ writingMode: "vertical-rl" }}
        >
          {t("title")}
        </span>
      </button>
    );
  }

  return (
    <div className="flex h-[500px] flex-col overflow-hidden rounded-sm border border-neutral-400 lg:h-[680px] dark:border-neutral-600">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleCollapsed}
            title={t("collapse")}
            className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900 dark:text-white"
          >
            <span aria-hidden className="text-neutral-400">
              ◂
            </span>
            {t("title")}
          </button>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => adjustChatFontSize(-1)}
              disabled={chatFontSize <= MIN_CHAT_FONT_SIZE}
              title={t("fontSizeDown")}
              aria-label={t("fontSizeDown")}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-200 text-xs text-neutral-500 transition hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => adjustChatFontSize(1)}
              disabled={chatFontSize >= MAX_CHAT_FONT_SIZE}
              title={t("fontSizeUp")}
              aria-label={t("fontSizeUp")}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-200 text-xs text-neutral-500 transition hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-neutral-400">{t("bubbleColorLabel")}</span>
          <ChatColorPicker current={selfColor} onChange={setSelfColorOverride} />
        </div>
      </div>
      <div ref={listRef} className="chat-scroll flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((m) => {
          const isSelf = m.userId === selfId;
          const canDelete = isSelf || canModerate;
          const avatarSrc = characterSrc(characterIdOf(m.userId));
          return (
            <div
              key={m.id}
              className={`group flex items-end gap-1.5 text-sm ${isSelf ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800">
                {avatarSrc ? (
                  <Image src={avatarSrc} alt="" width={28} height={28} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-neutral-300">🙂</span>
                )}
              </div>
              {/* 말풍선 정렬을 flex 교차축(items-end/items-start)이 아니라
                  text-align으로 한다 — 한글처럼 어디서든 줄바꿈 가능한
                  텍스트가 "flex-col items-end + 퍼센트 max-width" 조합
                  안에 있으면, 실제로는 공간이 충분한데도 브라우저가 내용
                  너비를 실제보다 훨씬 좁게(글자 한두 개 폭으로) 어림해
                  버블이 필요 이상으로 줄바꿈되는 문제가 있었다(문의 캡처
                  확인). min-w-0 flex-1 + text-align 조합은 이 계산
                  경로를 타지 않아 버블이 항상 제 너비대로 한 줄에 들어간다. */}
              <div className="min-w-0 flex-1">
                <div className={isSelf ? "text-right" : "text-left"}>
                  <span className="inline-flex items-center gap-1 text-[12px] text-neutral-400">
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
                </div>
                <div className={isSelf ? "text-right" : "text-left"}>
                  <span
                    style={{ fontSize: chatFontSize }}
                    className={`mt-0.5 inline-block max-w-[85%] break-words rounded-lg px-3 py-1.5 text-left ${chatBubbleClass(
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
                      className="ml-1 align-middle text-[11px] text-neutral-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100 dark:text-neutral-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
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
