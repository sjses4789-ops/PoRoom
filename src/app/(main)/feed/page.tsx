import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { todayKst, formatRelativeTime } from "@/lib/time";
import { PageAdRail } from "@/components/page-ad-rail";
import { getMyChallengeOptions } from "@/lib/feed";
import { getDemoData, shouldShowDemoData } from "@/lib/demo-data";
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

  const [
    { data: realPostRows },
    { data: realUsers },
    { data: realReactionRows },
    { data: todayRows },
    options,
  ] =
    await Promise.all([
      supabase
        .from("feed_posts")
        .select("id,user_id,post_type,mood,focus_minutes,chars,meta,created_at")
        .order("created_at", { ascending: false })
        .limit(100)
        .returns<PostRow[]>(),
      // email은 여기서 같이 안 가져온다 — anon(비로그인) 롤은 users
      // 테이블에서 email 컬럼 권한이 없어서(회원 이메일이 익명 API
      // 요청으로 새어나가지 않도록 하는 조치), 같이 요청하면 쿼리
      // 전체가 실패한다. 어차피 닉네임이 없을 때의 대체 표시용으로만
      // 쓰였던 필드라 unknownUser로 대체한다.
      supabase.from("users").select("id,name,character_id,position").returns<UserRow[]>(),
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

  // 심사 기간 비로그인 방문자에게는 실제 글 뒤에 예시 글(과 작성자/반응)을
  // 덧붙인다 — DB에는 아무것도 쓰지 않는다(src/lib/demo-data.ts 참고).
  const demo = shouldShowDemoData(user) ? getDemoData() : null;
  const postRows: PostRow[] = [...(realPostRows ?? []), ...(demo?.feedPosts ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const users: UserRow[] = [...(realUsers ?? []), ...(demo?.users ?? [])];
  const reactionRows: ReactionRow[] = [...(realReactionRows ?? []), ...(demo?.feedReactions ?? [])];

  const userNames: Record<string, string> = {};
  const userCharacters: Record<string, string | null> = {};
  const userPositions: Record<string, "novelist" | "webtoon"> = {};
  for (const u of users) {
    userNames[u.id] = u.name || t("unknownUser");
    userCharacters[u.id] = u.character_id;
    userPositions[u.id] = u.position === "webtoon" ? "webtoon" : "novelist";
  }

  const reactionsByPost = new Map<string, ReactionRow[]>();
  for (const r of reactionRows) {
    const list = reactionsByPost.get(r.post_id) ?? [];
    list.push(r);
    reactionsByPost.set(r.post_id, list);
  }

  const posts: FeedPost[] = postRows.map((p) => {
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
