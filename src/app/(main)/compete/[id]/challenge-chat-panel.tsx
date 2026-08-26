"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { chatBubbleClass } from "@/lib/palette";
import { AdSlot } from "@/components/ad-slot";

export type ChallengeChatMessage = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
};

export type ChallengeChatMember = { id: string; name: string; chatColor: string | null };

export function ChallengeChatPanel({
  challengeId,
  selfId,
  members,
  initialMessages,
}: {
  challengeId: string;
  selfId: string;
  members: ChallengeChatMember[];
  initialMessages: ChallengeChatMessage[];
}) {
  const t = useTranslations("compete.challengeChatPanel");
  const [messages, setMessages] = useState<ChallengeChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(
    null
  );

  const nameOf = (userId: string) =>
    userId === selfId ? t("selfLabel") : members.find((m) => m.id === userId)?.name ?? t("unknownUser");
  const colorOf = (userId: string) => members.find((m) => m.id === userId)?.chatColor ?? null;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`challenge-chat:${challengeId}`)
      .on("broadcast", { event: "message" }, ({ payload }) => {
        const msg = payload as ChallengeChatMessage;
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      })
      .subscribe();
    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [challengeId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("challenge_messages")
      .insert({ challenge_id: challengeId, user_id: selfId, content })
      .select("id,user_id,content,created_at")
      .single();
    if (error || !data) return;

    const message: ChallengeChatMessage = {
      id: data.id,
      userId: data.user_id,
      content: data.content,
      createdAt: data.created_at,
    };
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    channelRef.current?.send({ type: "broadcast", event: "message", payload: message });
  };

  return (
    // 바깥 테두리는 이 컴포넌트가 아니라 page.tsx의 공유 그리드 카드(로그·
    // 참여자 열과 같은 테두리를 나눠 쓰는 divide-x 레이아웃)가 맡는다 —
    // 예전엔 채팅만 자체 테두리가 있고 로그는 안쪽 목록에만 테두리가 있어
    // 디자인이 어긋나 보였다.
    <div className="flex h-full flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</h2>
      <div
        ref={listRef}
        className="chat-scroll h-[340px] space-y-3 overflow-y-auto rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-700"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-neutral-400">
            {t("emptyHint")}
          </p>
        ) : (
          messages.map((m) => {
            const isSelf = m.userId === selfId;
            // 정렬을 flex 교차축이 아니라 text-align으로 한다 —
            // room/[id]/chat-panel.tsx와 같은 이유(줄바꿈 가능한 한글
            // 텍스트가 flex-col items-end + 퍼센트 max-width 조합 안에
            // 있으면 실제보다 훨씬 좁게 계산되어 불필요하게 줄바꿈되는
            // 문제가 있었다).
            return (
              <div key={m.id} className={`text-sm ${isSelf ? "text-right" : "text-left"}`}>
                <span className="text-[12px] text-neutral-400">{nameOf(m.userId)}</span>
                <div>
                  <span
                    className={`mt-0.5 inline-block max-w-[85%] break-words rounded-lg px-3 py-1.5 text-left ${chatBubbleClass(
                      colorOf(m.userId),
                      isSelf
                    )}`}
                  >
                    {m.content}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t("placeholder")}
          className="flex-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
        />
        <button
          onClick={send}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700"
        >
          {t("send")}
        </button>
      </div>
      <div className="h-14 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
        <AdSlot className="h-14" />
      </div>
    </div>
  );
}
