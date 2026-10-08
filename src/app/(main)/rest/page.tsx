import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { getMyJoinedRooms } from "@/lib/rest";
import type { RestInfoCategory } from "@/lib/rest-types";
import { PageAdRail } from "@/components/page-ad-rail";
import { getDemoData, getDemoRestPosts, shouldShowDemoData } from "@/lib/demo-data";
import { isDemoId } from "@/lib/demo-id";
import { RestNav } from "./rest-nav";
import type { RestPost } from "./rest-board";

type PostRow = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  category: "자유" | "정보" | "인원 모집";
  room_id: string | null;
  info_category: RestInfoCategory | null;
  pinned: boolean;
};
type UserRow = { id: string; name: string | null };
type RoomRow = { id: string; name: string };

export const metadata: Metadata = {
  title: "작가 정보 게시판",
  description:
    "웹소설·웹툰 작가를 위한 집필 팁, 공모전·투고 정보, 질문과 답변, 함께 쓸 사람을 구하는 모집 글을 모아둔 포룸 게시판입니다.",
};

export default async function RestPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const t = await getTranslations("rest.page");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 애드센스 심사 기간 동안 비로그인 방문자도 이 게시판을 볼 수 있게
  // 열어뒀다 — "내 것" 조회는 selfId가 없으면 건너뛴다.
  const selfId = user?.id ?? null;

  const [
    { data: myProfile },
    { data: realPostRows },
    { data: realUsers },
    { data: realRooms },
    { data: myScores },
    isAdmin,
    myRooms,
  ] = await Promise.all([
    selfId
      ? supabase.from("users").select("name").eq("id", selfId).maybeSingle<{ name: string | null }>()
      : Promise.resolve({ data: null }),
    supabase
      .from("rest_posts")
      .select("id,user_id,title,content,created_at,category,room_id,info_category,pinned")
      .order("created_at", { ascending: false })
      .returns<PostRow[]>(),
    // email은 여기서 같이 안 가져온다 — anon(비로그인) 롤은 email 컬럼
    // 권한이 없어서 같이 요청하면 쿼리 전체가 실패한다.
    supabase.from("users").select("id,name").returns<UserRow[]>(),
    supabase.from("rooms").select("id,name").returns<RoomRow[]>(),
    selfId
      ? supabase
          .from("typing_scores")
          .select("cpm")
          .eq("user_id", selfId)
          .order("cpm", { ascending: false })
          .limit(1)
          .returns<{ cpm: number }[]>()
      : Promise.resolve({ data: [] as { cpm: number }[] }),
    isCurrentUserAdmin(),
    getMyJoinedRooms(),
  ]);

  // 심사 기간 비로그인 방문자에게는 실제 글 뒤에 예시 글([정보]/[인원 모집])과
  // 작성자/방을 덧붙인다 — DB에는 아무것도 쓰지 않는다(src/lib/demo-data.ts 참고).
  const demo = shouldShowDemoData(user) ? getDemoData() : null;
  const postRows: PostRow[] = [...(realPostRows ?? []), ...(demo ? getDemoRestPosts() : [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const users: UserRow[] = [...(realUsers ?? []), ...(demo?.users ?? [])];
  const rooms: RoomRow[] = [...(realRooms ?? []), ...(demo?.rooms ?? [])];

  // 애드센스 심사 기간에 "/"로 들어온 비로그인 방문자에게 보이는 화면(미들웨어 rewrite) —
  // 소개 홈페이지를 대신하므로 이 사이트가 무엇인지 한 줄로 알려준다.
  const isReviewHome = demo !== null && tab === "info";

  const userNames: Record<string, string> = {};
  for (const u of users) userNames[u.id] = u.name || t("unknownUser");

  const roomNames: Record<string, string> = {};
  for (const r of rooms) roomNames[r.id] = r.name;

  const posts: RestPost[] = postRows.map((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    createdAt: p.created_at,
    authorId: p.user_id,
    authorName: userNames[p.user_id] ?? "알 수 없음",
    category: p.category,
    infoCategory: p.info_category,
    pinned: p.pinned,
    roomId: p.room_id,
    roomName: p.room_id ? roomNames[p.room_id] ?? null : null,
    trusted: isDemoId(p.id),
  }));

  return (
    <PageAdRail>
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
          {isReviewHome ? "PoRoom 작가 정보 게시판" : t("title")}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {isReviewHome
            ? "포룸은 웹소설·웹툰 작가가 화상회의 없이 함께 집중하는 온라인 작업실입니다. 이 게시판에는 집필 팁, 공모전·투고 정보, 질문과 답변이 올라옵니다."
            : t("subtitle")}
        </p>
      </div>
      <RestNav
        selfId={selfId ?? ""}
        selfName={myProfile?.name ?? user?.email ?? "나"}
        isAdmin={isAdmin}
        myBestCpm={myScores && myScores.length > 0 ? myScores[0].cpm : null}
        initialPosts={posts}
        myRooms={myRooms}
        initialView={tab === "info" ? "정보" : tab === "recruit" ? "인원 모집" : undefined}
        expandAll={demo !== null}
      />
    </div>
    </PageAdRail>
  );
}
