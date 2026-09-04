import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { todayKst, formatRelativeTime } from "@/lib/time";
import { PageAdRail } from "@/components/page-ad-rail";
import { getMyChallengeOptions } from "@/lib/feed";
import { FeedView, type FeedPost, type ReactionType, type PostType, type FeedPostMeta } from "./feed-view";

type PostRow = {
  id: string;
  user_id: string;
  post_type: PostType;
  mood: string;
  focus_minutes: number;
  chars: number;
  meta: FeedPostMeta;
  created_at: string;
};
type UserRow = {
  id: string;
  name: string | null;
  email: string;
  character_id: string | null;
  position: string | null;
};
type ReactionRow = { id: string; post_id: string; user_id: string; reaction_type: ReactionType };

const REACTION_TYPES: ReactionType[] = ["heart", "clap", "fire"];

export default async function FeedPage() {
  const t = await getTranslations("feed.page");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = todayKst();
  // 애드센스 심사 기간 동안 비로그인 방문자도 이 페이지를 볼 수 있게
  // 열어뒀다 — "내 것" 조회는 selfId가 없으면 건너뛰고, 글쓰기/반응 같은
  // 쓰기 동작은 FeedView 쪽에서 selfId가 없을 때 비활성화한다.
  const selfId = user?.id ?? null;

  const [{ data: postRows }, { data: users }, { data: reactionRows }, { data: todayRows }, options] =
    await Promise.all([
      supabase
        .from("feed_posts")
        .select("id,user_id,post_type,mood,focus_minutes,chars,meta,created_at")
        .order("created_at", { ascending: false })
        .limit(100)
        .returns<PostRow[]>(),
      supabase.from("users").select("id,name,email,character_id,position").returns<UserRow[]>(),
      supabase
        .from("feed_reactions")
        .select("id,post_id,user_id,reaction_type")
        .returns<ReactionRow[]>(),
      selfId
        ? supabase
            .from("daily_records")
            .select("chars,focus_minutes")
            .eq("user_id", selfId)
            .eq("record_date", today)
            .returns<{ chars: number; focus_minutes: number }[]>()
        : Promise.resolve({ data: [] as { chars: number; focus_minutes: number }[] }),
      getMyChallengeOptions(),
    ]);

  const userNames: Record<string, string> = {};
  const userCharacters: Record<string, string | null> = {};
  const userPositions: Record<string, "novelist" | "webtoon"> = {};
  for (const u of users ?? []) {
    userNames[u.id] = u.name || u.email;
    userCharacters[u.id] = u.character_id;
    userPositions[u.id] = u.position === "webtoon" ? "webtoon" : "novelist";
  }

  const reactionsByPost = new Map<string, ReactionRow[]>();
  for (const r of reactionRows ?? []) {
    const list = reactionsByPost.get(r.post_id) ?? [];
    list.push(r);
    reactionsByPost.set(r.post_id, list);
  }

  const posts: FeedPost[] = (postRows ?? []).map((p) => {
    const postReactions = reactionsByPost.get(p.id) ?? [];
    const reactions = Object.fromEntries(
      REACTION_TYPES.map((type) => {
        const forType = postReactions.filter((r) => r.reaction_type === type);
        return [
          type,
          {
            count: forType.length,
            selfActive: selfId ? forType.some((r) => r.user_id === selfId) : false,
          },
        ];
      })
    ) as FeedPost["reactions"];

    return {
      id: p.id,
      postType: p.post_type,
      authorId: p.user_id,
      authorName: userNames[p.user_id] ?? t("unknownUser"),
      characterId: userCharacters[p.user_id] ?? null,
      authorPosition: userPositions[p.user_id] ?? "novelist",
      mood: p.mood,
      focusMinutes: p.focus_minutes,
      chars: p.chars,
      meta: p.meta ?? {},
      createdAt: p.created_at,
      createdAtLabel: formatRelativeTime(p.created_at) ?? "",
      reactions,
    };
  });

  const todayFocusMinutes = (todayRows ?? []).reduce((sum, r) => sum + r.focus_minutes, 0);
  const todayChars = (todayRows ?? []).reduce((sum, r) => sum + r.chars, 0);

  return (
    <PageAdRail>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
        </div>
        <FeedView
          selfId={selfId}
          selfName={selfId ? (userNames[selfId] ?? t("unknownUser")) : t("unknownUser")}
          selfCharacterId={selfId ? (userCharacters[selfId] ?? null) : null}
          selfPosition={selfId ? (userPositions[selfId] ?? "novelist") : "novelist"}
          todayFocusMinutes={todayFocusMinutes}
          todayChars={todayChars}
          duelOptions={options.duels}
          challengeOptions={options.challenges}
          initialPosts={posts}
        />
      </div>
    </PageAdRail>
  );
}
