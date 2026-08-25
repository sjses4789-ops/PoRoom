"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  createFeedPost,
  deleteFeedPost,
  toggleFeedReaction,
  type ReactionType,
  type PostType,
  type FeedPostMeta,
  type DuelOption,
  type ChallengeOption,
} from "@/lib/feed";
import { characterSrc } from "@/lib/characters";

export type { ReactionType, PostType, FeedPostMeta, DuelOption, ChallengeOption };

export type FeedPost = {
  id: string;
  postType: PostType;
  authorId: string;
  authorName: string;
  characterId: string | null;
  mood: string;
  focusMinutes: number;
  chars: number;
  meta: FeedPostMeta;
  createdAt: string;
  createdAtLabel: string;
  reactions: Record<ReactionType, { count: number; selfActive: boolean }>;
};

const REACTION_EMOJI: Record<ReactionType, string> = {
  heart: "❤️",
  clap: "👏",
  fire: "🔥",
};

type CategoryFilter = PostType | "all";

const CATEGORY_ICON: Record<CategoryFilter, string> = {
  all: "🗂️",
  write: "✍️",
  duel: "⚔️",
  challenge: "🏆",
  submission: "📮",
  contest: "🏅",
};

const CATEGORIES: CategoryFilter[] = ["all", "write", "duel", "challenge", "submission", "contest"];

const PASTEL_COLORS = [
  "#FDE2E4", "#FFD8BE", "#FFF1BA", "#E3F4C1", "#C8F4DE",
  "#C4F1F9", "#C9E4FF", "#D6CDFE", "#F0C9F9", "#FFC9DE",
  "#F6BFC0", "#FBE0C4", "#FFF4B8", "#CDEFC4", "#BEEFDE",
  "#BEE3F8", "#C7D2FE", "#E4C1F9", "#F5C6EC", "#FFB5C0",
];

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

const BADGE_TEXT = "text-[13px]";

function PostBadges({ post, t }: { post: FeedPost; t: ReturnType<typeof useTranslations> }) {
  if (post.postType === "write") {
    if (post.focusMinutes <= 0 && post.chars <= 0) return null;
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {post.focusMinutes > 0 && (
          <span className={`rounded-full bg-neutral-100 px-2.5 py-1 ${BADGE_TEXT} font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300`}>
            ⏱ {post.focusMinutes}
            {t("minuteUnit")}
          </span>
        )}
        {post.chars > 0 && (
          <span className={`rounded-full bg-neutral-100 px-2.5 py-1 ${BADGE_TEXT} font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300`}>
            ✍️ {post.chars.toLocaleString()}
            {t("charUnit")}
          </span>
        )}
      </div>
    );
  }

  if (post.postType === "submission") {
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className={`rounded-full bg-sky-50 px-2.5 py-1 ${BADGE_TEXT} font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300`}>
          📮 {post.meta.genre} · {t("publisherCountLabel", { count: post.meta.publisherCount ?? 0 })}
        </span>
      </div>
    );
  }

  if (post.postType === "contest") {
    const mode = post.meta.contestMode ?? "chars";
    const detail =
      mode === "complete"
        ? post.meta.contestComplete
          ? t("contestCompleteLabel")
          : t("contestNotCompleteLabel")
        : mode === "round"
          ? `${(post.meta.contestRound ?? 0).toLocaleString()}${t("contestRoundUnit")}`
          : `${(post.meta.contestChars ?? 0).toLocaleString()}${t("charUnit")}`;
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className={`rounded-full bg-amber-50 px-2.5 py-1 ${BADGE_TEXT} font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300`}>
          🏅 {post.meta.contestName} · {detail}
        </span>
      </div>
    );
  }

  if (post.postType === "duel") {
    const result = post.meta.result;
    const style =
      result === "win"
        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
        : result === "draw"
          ? "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
          : "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300";
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className={`rounded-full px-2.5 py-1 ${BADGE_TEXT} font-medium ${style}`}>
          ⚔️ {post.meta.challengeTitle} · {t(`duelResult.${result}`)}
        </span>
      </div>
    );
  }

  if (post.postType === "challenge") {
    const achieved = post.meta.achieved;

    // 초단 완고는 "달성/미달성" 대신 사용자가 요청한 전용 문구·색으로 표시.
    if (post.meta.kind === "monthly_draft") {
      const style = achieved
        ? "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300"
        : "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300";
      return (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2.5 py-1 ${BADGE_TEXT} font-medium ${style}`}>
            {achieved ? t("draftDoneYes") : t("draftDoneNo")}
          </span>
        </div>
      );
    }

    const style = achieved
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400";
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className={`rounded-full px-2.5 py-1 ${BADGE_TEXT} font-medium ${style}`}>
          🏆 {post.meta.challengeTitle} · {achieved ? t("achieved") : t("notAchieved")}
        </span>
        {post.chars > 0 && (
          <span className={`rounded-full bg-neutral-100 px-2.5 py-1 ${BADGE_TEXT} font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300`}>
            ✍️ {post.chars.toLocaleString()}
            {t("charUnit")}
          </span>
        )}
      </div>
    );
  }

  return null;
}

export function FeedView({
  selfId,
  selfName,
  selfCharacterId,
  todayFocusMinutes,
  todayChars,
  duelOptions,
  challengeOptions,
  initialPosts,
}: {
  selfId: string;
  selfName: string;
  selfCharacterId: string | null;
  todayFocusMinutes: number;
  todayChars: number;
  duelOptions: DuelOption[];
  challengeOptions: ChallengeOption[];
  initialPosts: FeedPost[];
}) {
  const t = useTranslations("feed.view");
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [mood, setMood] = useState("");
  const [publisherCount, setPublisherCount] = useState("");
  const [genre, setGenre] = useState("");
  const [contestName, setContestName] = useState("");
  const [contestMode, setContestMode] = useState<"chars" | "complete" | "round">("chars");
  const [contestChars, setContestChars] = useState("");
  const [contestComplete, setContestComplete] = useState(false);
  const [contestRound, setContestRound] = useState("");
  const [duelId, setDuelId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [draftDone, setDraftDone] = useState(false);
  const [bgColor, setBgColor] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetComposer = () => {
    setMood("");
    setPublisherCount("");
    setGenre("");
    setContestName("");
    setContestMode("chars");
    setContestChars("");
    setContestComplete(false);
    setContestRound("");
    setDuelId("");
    setChallengeId("");
    setDraftDone(false);
    setBgColor(null);
  };

  const selectedChallengeKind = challengeOptions.find((c) => c.id === challengeId)?.kind ?? null;
  const visiblePosts = category === "all" ? posts : posts.filter((p) => p.postType === category);

  const canSubmit =
    category !== "all" &&
    mood.trim().length > 0 &&
    (category !== "duel" || duelId) &&
    (category !== "challenge" || challengeId) &&
    (category !== "submission" || genre.trim().length > 0) &&
    (category !== "contest" || contestName.trim().length > 0);

  const submit = async () => {
    if (!canSubmit) return;
    setPending(true);
    setError(null);

    const result = await createFeedPost(
      category === "write"
        ? { postType: "write", mood }
        : category === "submission"
          ? { postType: "submission", mood, publisherCount: Number(publisherCount) || 0, genre }
          : category === "contest"
            ? {
                postType: "contest",
                mood,
                contestName,
                contestMode,
                contestChars: contestMode === "chars" ? Number(contestChars) || 0 : undefined,
                contestComplete: contestMode === "complete" ? contestComplete : undefined,
                contestRound: contestMode === "round" ? Number(contestRound) || 0 : undefined,
              }
            : category === "duel"
              ? { postType: "duel", mood, challengeId: duelId }
              : {
                  postType: "challenge",
                  mood,
                  challengeId,
                  draftDone: selectedChallengeKind === "monthly_draft" ? draftDone : undefined,
                },
      bgColor
    );

    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    const emptyReactions = {
      heart: { count: 0, selfActive: false },
      clap: { count: 0, selfActive: false },
      fire: { count: 0, selfActive: false },
    };
    setPosts((prev) => [
      {
        id: result.id,
        postType: result.postType,
        authorId: selfId,
        authorName: selfName,
        characterId: selfCharacterId,
        mood: result.mood,
        focusMinutes: result.focusMinutes,
        chars: result.chars,
        meta: result.meta,
        createdAt: result.createdAt,
        createdAtLabel: t("justNow"),
        reactions: emptyReactions,
      },
      ...prev,
    ]);
    resetComposer();
  };

  const remove = async (postId: string) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    await deleteFeedPost(postId);
  };

  const react = async (postId: string, type: ReactionType) => {
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[120px_1fr]">
      <div className="flex flex-row flex-wrap gap-1.5 lg:flex-col lg:flex-nowrap lg:border-r lg:border-neutral-100 lg:pr-4 dark:lg:border-neutral-800">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-left text-sm font-medium transition lg:rounded-md ${
              category === c
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            <span aria-hidden>{CATEGORY_ICON[c]}</span>
            {t(`category.${c}`)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {category !== "all" && (
        <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <Avatar characterId={selfCharacterId} />
              <div
                className="grid grid-cols-5 gap-1"
                role="group"
                aria-label={t("bgColorLabel")}
                title={t("bgColorLabel")}
              >
                <button
                  type="button"
                  onClick={() => setBgColor(null)}
                  title={t("bgColorNone")}
                  aria-label={t("bgColorNone")}
                  className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-white text-[8px] text-neutral-400 dark:bg-neutral-800 ${
                    bgColor === null ? "border-neutral-900 dark:border-white" : "border-neutral-200 dark:border-neutral-600"
                  }`}
                >
                  ✕
                </button>
                {PASTEL_COLORS.slice(0, 19).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBgColor(c)}
                    title={c}
                    aria-label={c}
                    className={`h-3.5 w-3.5 rounded-full border ${
                      bgColor === c ? "border-neutral-900 dark:border-white" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <input
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={t("moodPlaceholder")}
              className="min-w-0 flex-1 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
            <button
              onClick={submit}
              disabled={pending || !canSubmit}
              className="shrink-0 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {pending ? t("posting") : t("post")}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pl-[52px] text-xs text-neutral-500 dark:text-neutral-400">
            {category === "write" && (
              <>
                <span className="rounded-full bg-white px-2.5 py-1 dark:bg-neutral-800">
                  ⏱ {t("focusLabel")} {todayFocusMinutes}
                  {t("minuteUnit")}
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 dark:bg-neutral-800">
                  ✍️ {t("charsLabel")} {todayChars.toLocaleString()}
                  {t("charUnit")}
                </span>
                <span className="text-[11px] text-neutral-400">{t("autoFilledHint")}</span>
              </>
            )}
            {category === "submission" && (
              <>
                <label className="flex items-center gap-1.5">
                  {t("publisherCountFieldLabel")}
                  <input
                    type="number"
                    min={0}
                    value={publisherCount}
                    onChange={(e) => setPublisherCount(e.target.value)}
                    className="w-16 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  />
                  {t("countUnit")}
                </label>
                <label className="flex items-center gap-1.5">
                  {t("genreLabel")}
                  <input
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder={t("genrePlaceholder")}
                    className="w-28 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  />
                </label>
              </>
            )}
            {category === "contest" && (
              <>
                <label className="flex items-center gap-1.5">
                  {t("contestNameLabel")}
                  <input
                    value={contestName}
                    onChange={(e) => setContestName(e.target.value)}
                    placeholder={t("contestNamePlaceholder")}
                    className="w-36 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  />
                </label>
                <label className="flex items-center gap-1.5">
                  {t("contestFieldLabel")}
                  <select
                    value={contestMode}
                    onChange={(e) => setContestMode(e.target.value as "chars" | "complete" | "round")}
                    className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  >
                    <option value="chars">{t("contestFieldChars")}</option>
                    <option value="complete">{t("contestFieldComplete")}</option>
                    <option value="round">{t("contestFieldRound")}</option>
                  </select>
                </label>
                {contestMode === "chars" && (
                  <label className="flex items-center gap-1.5">
                    {t("contestCharsLabel")}
                    <input
                      type="number"
                      min={0}
                      value={contestChars}
                      onChange={(e) => setContestChars(e.target.value)}
                      className="w-24 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    />
                    {t("charUnit")}
                  </label>
                )}
                {contestMode === "complete" && (
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={contestComplete}
                      onChange={(e) => setContestComplete(e.target.checked)}
                      className="accent-neutral-900"
                    />
                    {t("contestFieldComplete")}
                  </label>
                )}
                {contestMode === "round" && (
                  <label className="flex items-center gap-1.5">
                    {t("contestRoundLabel")}
                    <input
                      type="number"
                      min={0}
                      value={contestRound}
                      onChange={(e) => setContestRound(e.target.value)}
                      placeholder={t("contestRoundPlaceholder")}
                      className="w-20 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    />
                    {t("contestRoundUnit")}
                  </label>
                )}
              </>
            )}
            {category === "duel" && (
              <label className="flex items-center gap-1.5">
                {t("duelSelectLabel")}
                {duelOptions.length === 0 ? (
                  <span className="text-neutral-400">{t("noDuels")}</span>
                ) : (
                  <select
                    value={duelId}
                    onChange={(e) => setDuelId(e.target.value)}
                    className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  >
                    <option value="">{t("selectPlaceholder")}</option>
                    {duelOptions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                )}
              </label>
            )}
            {category === "challenge" && (
              <label className="flex items-center gap-1.5">
                {t("challengeSelectLabel")}
                {challengeOptions.length === 0 ? (
                  <span className="text-neutral-400">{t("noChallenges")}</span>
                ) : (
                  <select
                    value={challengeId}
                    onChange={(e) => setChallengeId(e.target.value)}
                    className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  >
                    <option value="">{t("selectPlaceholder")}</option>
                    {challengeOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                )}
              </label>
            )}
            {category === "challenge" && challengeId && selectedChallengeKind === "monthly_draft" && (
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={draftDone}
                  onChange={(e) => setDraftDone(e.target.checked)}
                  className="accent-neutral-900"
                />
                {t("draftDoneCheckLabel")}
              </label>
            )}
            {category === "challenge" &&
              challengeId &&
              (selectedChallengeKind === "daily5k" || selectedChallengeKind === "daily10k") && (
                <span className="rounded-full bg-white px-2.5 py-1 dark:bg-neutral-800">
                  ✍️ {t("charsLabel")} {todayChars.toLocaleString()}
                  {t("charUnit")}
                  <span className="ml-1 text-[11px] text-neutral-400">{t("autoFilledHint")}</span>
                </span>
              )}
          </div>
          {error && <p className="pl-[52px] text-xs text-red-500">{error}</p>}
        </div>
        )}

        {visiblePosts.length === 0 ? (
          <p className="text-center text-xs text-neutral-400">{t("noPosts")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {visiblePosts.map((p) => (
              <li
                key={p.id}
                style={p.meta.bgColor ? { backgroundColor: p.meta.bgColor } : undefined}
                className={`flex flex-col gap-2.5 rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${
                  p.meta.bgColor
                    ? "border-black/5"
                    : "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar characterId={p.characterId} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold text-neutral-900 dark:text-white">
                        {p.authorName}
                        <span aria-hidden className="text-xs">
                          {CATEGORY_ICON[p.postType]}
                        </span>
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
                    <PostBadges post={p} t={t} />
                  </div>
                </div>
                <div className="flex gap-1.5 border-t border-neutral-100 pt-2.5 pl-[48px] dark:border-neutral-800">
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
    </div>
  );
}
