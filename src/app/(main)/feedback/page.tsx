import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { FeedbackBoard, type FeedbackPost, type FeedbackComment } from "./feedback-board";

type PostRow = {
  id: string;
  user_id: string;
  category: "suggestion" | "bug";
  title: string;
  content: string;
  created_at: string;
};
type UserRow = { id: string; name: string | null; email: string };
type CommentRow = { id: string; post_id: string; user_id: string; content: string; created_at: string };

export default async function FeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 애드센스 심사 기간 동안 목록 페이지([포룸]·[피드]·[랭킹]·[휴식]·[도전])는
  // 로그인 없이도 열어뒀지만, 이 페이지는 그 범위에 없어 그대로 로그인을
  // 요구한다.
  if (!user) {
    redirect("/login");
  }

  const [{ data: myProfile }, { data: postRows }, { data: users }, { data: commentRows }, isAdmin] =
    await Promise.all([
      supabase
        .from("users")
        .select("name")
        .eq("id", user!.id)
        .maybeSingle<{ name: string | null }>(),
      supabase
        .from("feedback_posts")
        .select("id,user_id,category,title,content,created_at")
        .order("created_at", { ascending: false })
        .returns<PostRow[]>(),
      supabase.from("users").select("id,name,email").returns<UserRow[]>(),
      supabase
        .from("feedback_comments")
        .select("id,post_id,user_id,content,created_at")
        .order("created_at", { ascending: true })
        .returns<CommentRow[]>(),
      isCurrentUserAdmin(),
    ]);

  const userNames: Record<string, string> = {};
  for (const u of users ?? []) userNames[u.id] = u.name || u.email;

  const commentsByPost = new Map<string, FeedbackComment[]>();
  for (const c of commentRows ?? []) {
    const list = commentsByPost.get(c.post_id) ?? [];
    list.push({
      id: c.id,
      content: c.content,
      createdAt: c.created_at,
      authorName: userNames[c.user_id] ?? "알 수 없음",
    });
    commentsByPost.set(c.post_id, list);
  }

  const posts: FeedbackPost[] = (postRows ?? []).map((p) => ({
    id: p.id,
    category: p.category,
    title: p.title,
    content: p.content,
    createdAt: p.created_at,
    authorName: userNames[p.user_id] ?? "알 수 없음",
    comments: commentsByPost.get(p.id) ?? [],
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
          기능 제안 & 버그 신고
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          PoRoom을 더 좋게 만들 아이디어나 발견한 버그를 자유롭게 남겨주세요.
        </p>
      </div>
      <FeedbackBoard
        selfName={myProfile?.name ?? user!.email ?? "나"}
        initialPosts={posts}
        isAdmin={isAdmin}
      />
    </div>
  );
}
