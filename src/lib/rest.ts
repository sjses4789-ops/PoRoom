"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RestPostCategory = "자유" | "정보" | "인원 모집";

export type RestPostResult =
  | { error: string }
  | {
      id: string;
      title: string;
      content: string;
      createdAt: string;
      category: RestPostCategory;
    };

export async function createRestPost(
  title: string,
  content: string,
  category: RestPostCategory
): Promise<RestPostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  if (!trimmedTitle) return { error: "제목을 입력해주세요." };
  if (!trimmedContent) return { error: "내용을 입력해주세요." };

  const { data, error } = await supabase
    .from("rest_posts")
    .insert({ user_id: user.id, title: trimmedTitle, content: trimmedContent, category })
    .select("id,title,content,created_at,category")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "게시글 작성에 실패했습니다." };
  }

  revalidatePath("/rest");
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    createdAt: data.created_at,
    category: data.category,
  };
}

export type RestPostEditResult = { error: string } | { ok: true };

export async function updateRestPost(
  postId: string,
  title: string,
  content: string
): Promise<RestPostEditResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  if (!trimmedTitle) return { error: "제목을 입력해주세요." };
  if (!trimmedContent) return { error: "내용을 입력해주세요." };

  const { error } = await supabase
    .from("rest_posts")
    .update({ title: trimmedTitle, content: trimmedContent })
    .eq("id", postId);

  if (error) return { error: error.message };
  revalidatePath("/rest");
  return { ok: true };
}

export async function deleteRestPost(postId: string): Promise<RestPostEditResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase.from("rest_posts").delete().eq("id", postId);
  if (error) return { error: error.message };
  revalidatePath("/rest");
  return { ok: true };
}

export async function submitTypingScore(
  cpm: number,
  accuracy: number
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  if (!Number.isFinite(cpm) || cpm < 0 || cpm > 2000) {
    return { error: "잘못된 기록입니다." };
  }
  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100) {
    return { error: "잘못된 기록입니다." };
  }

  const { error } = await supabase
    .from("typing_scores")
    .insert({ user_id: user.id, cpm: Math.round(cpm), accuracy: Math.round(accuracy) });

  if (error) return { error: error.message };
  revalidatePath("/rest");
  revalidatePath("/ranking");
  return { ok: true };
}
