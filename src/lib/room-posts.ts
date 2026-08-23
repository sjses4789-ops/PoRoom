"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PostCategory = "공지사항" | "정보 공유" | "팁 전수" | "자유";

export type PostResult =
  | { error: string }
  | {
      id: string;
      title: string;
      content: string;
      createdAt: string;
      category: PostCategory;
    };

export async function createPost(
  roomId: string,
  title: string,
  content: string,
  category: PostCategory
): Promise<PostResult> {
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
    .from("room_posts")
    .insert({
      room_id: roomId,
      user_id: user.id,
      title: trimmedTitle,
      content: trimmedContent,
      category,
      is_notice: category === "공지사항",
    })
    .select("id,title,content,created_at,category")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "게시글 작성에 실패했습니다." };
  }

  revalidatePath(`/room/${roomId}`);
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    createdAt: data.created_at,
    category: data.category,
  };
}

export type EditPostResult = { error: string } | { ok: true };

export async function updatePost(
  roomId: string,
  postId: string,
  title: string,
  content: string
): Promise<EditPostResult> {
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
    .from("room_posts")
    .update({ title: trimmedTitle, content: trimmedContent })
    .eq("id", postId);

  if (error) return { error: error.message };

  revalidatePath(`/room/${roomId}`);
  return { ok: true };
}

export async function deletePost(roomId: string, postId: string): Promise<EditPostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase.from("room_posts").delete().eq("id", postId);

  if (error) return { error: error.message };

  revalidatePath(`/room/${roomId}`);
  return { ok: true };
}
