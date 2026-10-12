"use server";

import { revalidatePath } from "next/cache";
import { err } from "@/lib/errors";
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
      pinned: boolean;
    };

export async function createPost(
  roomId: string,
  title: string,
  content: string,
  category: PostCategory,
  pinned = false
): Promise<PostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await err("loginRequired") };

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  if (!trimmedTitle) return { error: await err("titleRequired") };
  if (!trimmedContent) return { error: await err("contentRequired") };

  // 고정은 공지사항 글에서만 의미가 있다 — 다른 카테고리면 무시한다.
  const isNotice = category === "공지사항";

  const { data, error } = await supabase
    .from("room_posts")
    .insert({
      room_id: roomId,
      user_id: user.id,
      title: trimmedTitle,
      content: trimmedContent,
      category,
      is_notice: isNotice,
      pinned: isNotice && pinned,
    })
    .select("id,title,content,created_at,category,pinned")
    .single();

  if (error || !data) {
    return { error: error?.message ?? await err("postCreateFailed") };
  }

  revalidatePath(`/room/${roomId}`);
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    createdAt: data.created_at,
    category: data.category,
    pinned: data.pinned,
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
  if (!user) return { error: await err("loginRequired") };

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  if (!trimmedTitle) return { error: await err("titleRequired") };
  if (!trimmedContent) return { error: await err("contentRequired") };

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
  if (!user) return { error: await err("loginRequired") };

  const { error } = await supabase.from("room_posts").delete().eq("id", postId);

  if (error) return { error: error.message };

  revalidatePath(`/room/${roomId}`);
  return { ok: true };
}
