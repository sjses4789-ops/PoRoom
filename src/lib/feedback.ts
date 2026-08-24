"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FeedbackCategory = "suggestion" | "bug";

export type FeedbackPostResult =
  | { error: string }
  | {
      id: string;
      category: FeedbackCategory;
      title: string;
      content: string;
      createdAt: string;
    };

export async function createFeedbackPost(
  category: FeedbackCategory,
  title: string,
  content: string
): Promise<FeedbackPostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  if (!trimmedTitle) return { error: "제목을 입력해주세요." };
  if (!trimmedContent) return { error: "내용을 입력해주세요." };
  if (category !== "suggestion" && category !== "bug") {
    return { error: "잘못된 분류입니다." };
  }

  const { data, error } = await supabase
    .from("feedback_posts")
    .insert({ user_id: user.id, category, title: trimmedTitle, content: trimmedContent })
    .select("id,category,title,content,created_at")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "등록에 실패했습니다." };
  }

  revalidatePath("/feedback");

  return {
    id: data.id,
    category: data.category,
    title: data.title,
    content: data.content,
    createdAt: data.created_at,
  };
}

export type FeedbackCommentResult =
  | { error: string }
  | { id: string; content: string; createdAt: string };

// 관리자만 답글을 달 수 있다 — RLS(0039_feedback_comments)로도 강제된다.
export async function createFeedbackComment(
  postId: string,
  content: string
): Promise<FeedbackCommentResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const trimmed = content.trim();
  if (!trimmed) return { error: "댓글 내용을 입력해주세요." };

  const { data, error } = await supabase
    .from("feedback_comments")
    .insert({ post_id: postId, user_id: user.id, content: trimmed })
    .select("id,content,created_at")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "댓글 등록에 실패했습니다." };
  }

  revalidatePath("/feedback");

  return { id: data.id, content: data.content, createdAt: data.created_at };
}

export async function deleteFeedbackComment(commentId: string): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const { error } = await supabase.from("feedback_comments").delete().eq("id", commentId);
  if (error) return { error: error.message };
  revalidatePath("/feedback");
  return null;
}
