"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { AdSlot } from "@/components/ad-slot";
import { ADS_VISIBLE } from "@/lib/adsense-review-mode";
import { chatBubbleClass, chatBorderClass } from "@/lib/palette";
import { characterSrc } from "@/lib/characters";
import { ChatColorPicker } from "./chat-color-picker";
import {
  ChatImage,
  ChatImageConfirm,
  CHAT_IMAGE_BUCKET,
  CHAT_IMAGE_MAX_BYTES,
  CHAT_IMAGE_TYPES,
} from "./chat-image";
import { WhisperTargetPicker } from "./whisper-target-picker";
import type { Member } from "./room-view";

export type ChatMessage = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  targetUserId: string | null;
  // 첨부한 사진의 저장 경로(chat-images 버킷). 사진이 없으면 null.
  imagePath: string | null;
};

// 사진만 보내는 메시지의 content — content는 not null이고, 앱/구버전 화면은 이 글자를 그대로 보여 준다.
const IMAGE_ONLY_CONTENT = "📷";

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
  isOwner,
  blockedIds,
  onAvatarContextMenu,
  onActivity,
  collapsed,
  onToggleCollapsed,
}: {
  roomId: string;
  selfId: string;
  members: Member[];
  initialMessages: ChatMessage[];
  canModerate: boolean;
  // 방장만 "채팅 초기화"(모든 메시지 삭제)를 쓸 수 있다.
  isOwner: boolean;
  // 내가 차단한 참여자 — 그 사람의 메시지(귓속말 포함)는 내 화면에서 숨긴다.
  blockedIds: string[];
  // 채팅의 프로필 사진을 우클릭했을 때(참여자 카드 우클릭 메뉴와 같은 메뉴를 띄우기 위해 방 화면이 처리한다).
  onAvatarContextMenu?: (userId: string, name: string, x: number, y: number) => void;
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

  // 실시간 신호(broadcast)는 방 참여자 누구나 보낼 수 있어서 내용을 믿을 수 없다 — 다른 사람 이름으로 가짜
  // 메시지를 띄우거나 남의 메시지를 지운 것처럼 보이게 할 수 있다. 그래서 신호에는 메시지 id만 싣고, 받는 쪽이
  // DB(RLS로 보호됨)에서 그 메시지를 직접 읽어 확인한 내용만 화면에 반영한다.
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();
    const rowToMessage = (r: {
      id: string;
      user_id: string;
      content: string;
      created_at: string;
      target_user_id: string | null;
      image_path?: string | null;
    }): ChatMessage => ({
      id: r.id,
      userId: r.user_id,
      content: r.content,
      createdAt: r.created_at,
      targetUserId: r.target_user_id,
      imagePath: r.image_path ?? null,
    });
    const acceptMessage = async (payload: unknown) => {
      const id = (payload as { id?: unknown } | null)?.id;
      if (typeof id !== "string" || messagesRef.current.some((m) => m.id === id)) return;
      const { data } = await supabase
        .from("chat_messages")
        .select("id,user_id,content,created_at,target_user_id,image_path")
        .eq("id", id)
        .maybeSingle();
      if (!data) return; // DB에 없는 메시지 — 위조된 신호이거나 내가 볼 수 없는 메시지다.
      const msg = rowToMessage(data);
      if (messagesRef.current.some((m) => m.id === msg.id)) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      if (collapsedRef.current && msg.userId !== selfId) setUnreadCount((c) => c + 1);
    };
    const confirmDeleted = async (payload: unknown) => {
      const id = (payload as { id?: unknown } | null)?.id;
      if (typeof id !== "string") return;
      const { data } = await supabase.from("chat_messages").select("id").eq("id", id).maybeSingle();
      if (!data) setMessages((prev) => prev.filter((m) => m.id !== id));
    };
    const reloadAfterClear = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id,user_id,content,created_at,target_user_id,image_path")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(50);
      setMessages([...(data ?? [])].reverse().map(rowToMessage));
      setUnreadCount(0);
    };
    const roomChannel = supabase
      // private: 방 참여자만 이 채널을 듣고 보낼 수 있다(realtime.messages RLS — 0061 마이그레이션).
      // 공개 채널이면 anon 키와 방 id만 알아도 누구나 대화를 엿볼 수 있었다.
      .channel(`room-chat:${roomId}`, { config: { private: true } })
      .on("broadcast", { event: "message" }, ({ payload }) => {
        void acceptMessage(payload);
      })
      .on("broadcast", { event: "delete" }, ({ payload }) => {
        void confirmDeleted(payload);
      })
      .on("broadcast", { event: "clear" }, () => {
        // 방장이 채팅을 초기화하면 DB의 메시지가 지워진다 — 신호만 믿지 않고 DB 기준으로 다시 불러온다.
        void reloadAfterClear();
      })
      .subscribe();
    channelRef.current = roomChannel;

    const inboxChannel = supabase
      .channel(`whisper-inbox:${roomId}:${selfId}`, { config: { private: true } })
      .on("broadcast", { event: "whisper" }, ({ payload }) => {
        void acceptMessage(payload);
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
    const channel = supabase.channel(`whisper-inbox:${roomId}:${targetUserId}`, { config: { private: true } });
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({ type: "broadcast", event: "whisper", payload: { id: message.id } });
        setTimeout(() => supabase.removeChannel(channel), 500);
      }
    });
  };

  // 메시지를 DB에 저장하고 화면에 넣은 뒤, 상대에게 "새 메시지(id)" 신호를 보낸다(글/사진 공통).
  const insertAndDeliver = async (values: { content: string; image_path?: string | null }) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ room_id: roomId, user_id: selfId, target_user_id: whisperTargetId, ...values })
      .select("id,user_id,content,created_at,target_user_id,image_path")
      .single();
    if (error || !data) return false;

    const message: ChatMessage = {
      id: data.id,
      userId: data.user_id,
      content: data.content,
      createdAt: data.created_at,
      targetUserId: data.target_user_id,
      imagePath: data.image_path ?? null,
    };
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    if (message.targetUserId) {
      sendWhisperBroadcast(message.targetUserId, message);
    } else {
      channelRef.current?.send({ type: "broadcast", event: "message", payload: { id: message.id } });
    }
    return true;
  };

  const send = async () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    await insertAndDeliver({ content });
  };

  // ── 사진 첨부 ──────────────────────────────────────────────────────────
  // 파일 선택(귓속말 팝업의 "사진 첨부")과 붙여넣기(Ctrl+V) 모두 여기로 들어와서, 바로 보내지 않고 미리보기 확인
  // 팝업을 먼저 띄운다.
  const [pendingImage, setPendingImage] = useState<{ file: File; url: string } | null>(null);
  const [imageSending, setImageSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stageImage = (file: File) => {
    if (!CHAT_IMAGE_TYPES.includes(file.type)) {
      window.alert(t("imageTypeInvalid"));
      return;
    }
    if (file.size > CHAT_IMAGE_MAX_BYTES) {
      window.alert(t("imageTooLarge"));
      return;
    }
    setPendingImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return { file, url: URL.createObjectURL(file) };
    });
  };

  const cancelImage = () => {
    if (imageSending) return;
    setPendingImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
  };

  const sendImage = async () => {
    if (!pendingImage || imageSending) return;
    setImageSending(true);
    const supabase = createClient();
    const ext = pendingImage.file.type === "image/jpeg" ? "jpg" : pendingImage.file.type.split("/")[1];
    // 경로: <방>/<나>/<범위>/<파일> — 범위는 방 전체(all) 또는 귓속말 상대(to-<id>)(0070 정책이 이 규칙으로 읽기를 제한한다).
    const scope = whisperTargetId ? `to-${whisperTargetId}` : "all";
    const path = `${roomId}/${selfId}/${scope}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(CHAT_IMAGE_BUCKET)
      .upload(path, pendingImage.file, { contentType: pendingImage.file.type, upsert: false });
    if (uploadError) {
      setImageSending(false);
      window.alert(t("imageSendFailed"));
      return;
    }
    const ok = await insertAndDeliver({ content: IMAGE_ONLY_CONTENT, image_path: path });
    if (!ok) {
      // 메시지 저장에 실패하면 올린 사진도 지운다.
      await supabase.storage.from(CHAT_IMAGE_BUCKET).remove([path]);
      setImageSending(false);
      window.alert(t("imageSendFailed"));
      return;
    }
    setImageSending(false);
    setPendingImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
  };

  const removeMessage = async (id: string) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    const target = messages.find((m) => m.id === id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    const supabase = createClient();
    await supabase.from("chat_messages").delete().eq("id", id);
    // 사진 메시지면 저장된 사진도 함께 지운다(내 사진이거나 방장/부방장일 때만 정책이 허용한다).
    if (target?.imagePath) await supabase.storage.from(CHAT_IMAGE_BUCKET).remove([target.imagePath]);
    channelRef.current?.send({ type: "broadcast", event: "delete", payload: { id } });
  };

  const clearAll = async () => {
    if (!window.confirm(t("clearConfirm"))) return;
    const supabase = createClient();
    // 지우기 전에 이 방의 사진 경로를 모아 둔다 — 메시지를 지운 뒤 사진 파일도 함께 지운다.
    const { data: imageRows } = await supabase
      .from("chat_messages")
      .select("image_path")
      .eq("room_id", roomId)
      .not("image_path", "is", null);
    const { error } = await supabase.from("chat_messages").delete().eq("room_id", roomId);
    if (error) {
      window.alert(t("clearFailed"));
      return;
    }
    const imagePaths = (imageRows ?? []).map((r) => r.image_path as string).filter(Boolean);
    if (imagePaths.length > 0) await supabase.storage.from(CHAT_IMAGE_BUCKET).remove(imagePaths);
    setMessages([]);
    channelRef.current?.send({ type: "broadcast", event: "clear", payload: {} });
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
          {isOwner && (
            <button
              type="button"
              onClick={clearAll}
              title={t("clearTitle")}
              className="rounded-md border border-neutral-200 px-2 py-1 text-[11px] text-red-500 transition hover:bg-red-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              {t("clearButton")}
            </button>
          )}
          <span className="text-xs text-neutral-400">{t("bubbleColorLabel")}</span>
          <ChatColorPicker current={selfColor} onChange={setSelfColorOverride} />
        </div>
      </div>
      <div ref={listRef} className="chat-scroll flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages
          .filter((m) => !blockedIds.includes(m.userId))
          .map((m) => {
          const isSelf = m.userId === selfId;
          const canDelete = isSelf || canModerate;
          const avatarSrc = characterSrc(characterIdOf(m.userId));
          return (
            <div
              key={m.id}
              className={`group flex items-end gap-1.5 text-sm ${isSelf ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                // 고른 말풍선 색이 프로필 사진 테두리색이 된다(안 골랐으면 기본 회색 테두리).
                onContextMenu={(e) => {
                  // 내 사진에는 메뉴가 없다.
                  if (isSelf || !onAvatarContextMenu) return;
                  e.preventDefault();
                  onAvatarContextMenu(m.userId, nameOf(m.userId), e.clientX, e.clientY);
                }}
                className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-50 dark:bg-neutral-800 ${
                  chatBorderClass(colorOf(m.userId))
                    ? `border-2 ${chatBorderClass(colorOf(m.userId))}`
                    : "border border-neutral-200 dark:border-neutral-700"
                }`}
              >
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
                    {m.imagePath ? <ChatImage path={m.imagePath} /> : m.content}
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
              onAttach={() => {
                setPickerOpen(false);
                fileInputRef.current?.click();
              }}
            />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={CHAT_IMAGE_TYPES.join(",")}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) stageImage(file);
            }}
          />
        </div>
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            onActivity?.();
          }}
          onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && send()}
          onPaste={(e) => {
            // 복사한 이미지를 붙여넣으면 바로 보내지 않고 미리보기 확인 팝업을 띄운다(글자 붙여넣기는 그대로).
            const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
            if (!file) return;
            e.preventDefault();
            stageImage(file);
          }}
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
      {ADS_VISIBLE && (
        <div className="h-14 overflow-hidden border-t border-neutral-100 dark:border-neutral-800">
          <AdSlot className="h-14" />
        </div>
      )}
      {pendingImage && (
        <ChatImageConfirm
          previewUrl={pendingImage.url}
          whisperName={whisperTargetId ? nameOf(whisperTargetId) : null}
          sending={imageSending}
          onSend={sendImage}
          onCancel={cancelImage}
        />
      )}
    </div>
  );
}
