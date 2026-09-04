import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { getMyJoinedRooms } from "@/lib/rest";
import type { RestInfoCategory } from "@/lib/rest-types";
import { PageAdRail } from "@/components/page-ad-rail";
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
type UserRow = { id: string; name: string | null; email: string };
type RoomRow = { id: string; name: string };

export default async function RestPage() {
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
    { data: postRows },
    { data: users },
    { data: rooms },
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
    supabase.from("users").select("id,name,email").returns<UserRow[]>(),
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

  const userNames: Record<string, string> = {};
  for (const u of users ?? []) userNames[u.id] = u.name || u.email;

  const roomNames: Record<string, string> = {};
  for (const r of rooms ?? []) roomNames[r.id] = r.name;

  const posts: RestPost[] = (postRows ?? []).map((p) => ({
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
  }));

  return (
    <PageAdRail>
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
      </div>
      <RestNav
        selfId={selfId ?? ""}
        selfName={myProfile?.name ?? user?.email ?? "나"}
        isAdmin={isAdmin}
        myBestCpm={myScores && myScores.length > 0 ? myScores[0].cpm : null}
        initialPosts={posts}
        myRooms={myRooms}
      />
    </div>
    </PageAdRail>
  );
}
