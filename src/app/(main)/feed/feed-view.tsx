"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { createFeedPost, deleteFeedPost, toggleFeedReaction, type ReactionType } from "@/lib/feed";
import { characterSrc } from "@/lib/characters";

export type { ReactionType };

export type FeedPost = {
  id: string;
  authorId: string;
  authorName: string;
  characterId: string | null;
  mood: string;
  focusMinutes: number;
  chars: number;
  createdAt: string;
  createdAtLabel: string;
  reactions: Record<ReactionType, { count: number; selfActive: boolean }>;
};

const REACTION_EMOJI: Record<ReactionType, string> = {
  heart: "❤️",
  clap: "👏",
  fire: "🔥",
};

function Avatar({ characterId, size = 40 }: { characterId: string | null; size?: number }) {
  const src = characterSrc(characterId);
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt="" width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.5 }}>🙂</span>
      )}
    </div>
  );
}

export function FeedView({
  selfId,
  selfName,
  selfCharacterId,
  todayFocusMinutes,
  todayChars,
  initialPosts,
}: {
  selfId: string;
  selfName: string;
  selfCharacterId: string | null;
  todayFocusMinutes: number;
  todayChars: number;
  initialPosts: FeedPost[];
}) {
  const t = useTranslations("feed.view");
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [mood, setMood] = useState("");
  const [focusMinutes, setFocusMinutes] = useState(String(todayFocusMinutes || ""));
  const [chars, setChars] = useState(String(todayChars || ""));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setPending(true);
    setError(null);
    const result = await createFeedPost(mood, Number(focusMinutes) || 0, Number(chars) || 0);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    const emptyReactions = { heart: { count: 0, selfActive: false }, clap: { count: 0, selfActive: false }, fire: { count: 0, selfActive: false } };
    setPosts((prev) => [
      {
        id: result.id,
        authorId: selfId,
        authorName: selfName,
        characterId: selfCharacterId,
        mood: result.mood,
        focusMinutes: result.focusMinutes,
        chars: result.chars,
        createdAt: result.createdAt,
        createdAtLabel: t("justNow"),
        reactions: emptyReactions,
      },
      ...prev,
    ]);
    setMood("");
  };

  const remove = async (postId: string) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    await deleteFeedPost(postId);
  };

  const react = async (postId: string, type: ReactionType) => {
    // 낙관적 업데이트 — 눌렀을 때 바로 반영하고, 실패하면 별도 처리 없이
    // 다음 새로고침에서 서버 상태로 맞춰진다(다른 반응 버튼들처럼 가벼운
    // 상호작용이라 실패 시 재조정은 과한 처리라 생략).
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const current = p.reactions[type];
        const nextActive = !current.selfActive;
        return {
          ...p,
          reactions: {
            ...p.reactions,
            [type]: { count: current.count + (nextActive ? 1 : -1), selfActive: nextActive },
          },
        };
      })
    );
    await toggleFeedReaction(postId, type);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700">
        <div className="flex items-center gap-3">
          <Avatar characterId={selfCharacterId} />
          <input
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={t("moodPlaceholder")}
            className="min-w-0 flex-1 rounded-full border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          />
          <button
            onClick={submit}
            disabled={pending || !mood.trim()}
            className="shrink-0 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {pending ? t("posting") : t("post")}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4 pl-[52px] text-xs text-neutral-500 dark:text-neutral-400">
          <label className="flex items-center gap-1.5">
            {t("focusLabel")}
            <input
              type="number"
              min={0}
              value={focusMinutes}
              onChange={(e) => setFocusMinutes(e.target.value)}
              className="w-16 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
            {t("minuteUnit")}
          </label>
          <label className="flex items-center gap-1.5">
            {t("charsLabel")}
            <input
              type="number"
              min={0}
              value={chars}
              onChange={(e) => setChars(e.target.value)}
              className="w-20 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
            {t("charUnit")}
          </label>
        </div>
        {error && <p className="pl-[52px] text-xs text-red-500">{error}</p>}
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-xs text-neutral-400">{t("noPosts")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-2.5 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700"
            >
              <div className="flex items-start gap-3">
                <Avatar characterId={p.characterId} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                      {p.authorName}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[11px] text-neutral-400">{p.createdAtLabel}</span>
                      {p.authorId === selfId && (
                        <button
                          onClick={() => remove(p.id)}
                          title={t("delete")}
                          className="text-neutral-300 transition hover:text-red-500 dark:text-neutral-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-200">
                    {p.mood}
                  </p>
                  {(p.focusMinutes > 0 || p.chars > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.focusMinutes > 0 && (
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                          ⏱ {p.focusMinutes}
                          {t("minuteUnit")}
                        </span>
                      )}
                      {p.chars > 0 && (
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                          ✍️ {p.chars.toLocaleString()}
                          {t("charUnit")}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 pl-[48px]">
                {(Object.keys(REACTION_EMOJI) as ReactionType[]).map((type) => {
                  const r = p.reactions[type];
                  return (
                    <button
                      key={type}
                      onClick={() => react(p.id, type)}
                      className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                        r.selfActive
                          ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                          : "border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <span aria-hidden>{REACTION_EMOJI[type]}</span>
                      {t(`reaction.${type}`)}
                      {r.count > 0 && <span>{r.count}</span>}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
