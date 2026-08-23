import { createClient } from "@/lib/supabase/server";
import { FeedbackBoard, type FeedbackPost } from "./feedback-board";

type PostRow = {
  id: string;
  user_id: string;
  category: "suggestion" | "bug";
  title: string;
  content: string;
  created_at: string;
};
type UserRow = { id: string; name: string | null; email: string };

export default async function FeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: myProfile }, { data: postRows }, { data: users }] = await Promise.all([
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
  ]);

  const userNames: Record<string, string> = {};
  for (const u of users ?? []) userNames[u.id] = u.name || u.email;

  const posts: FeedbackPost[] = (postRows ?? []).map((p) => ({
    id: p.id,
    category: p.category,
    title: p.title,
    content: p.content,
    createdAt: p.created_at,
    authorName: userNames[p.user_id] ?? "알 수 없음",
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
      />
    </div>
  );
}
