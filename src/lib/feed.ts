"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReactionType = "heart" | "clap" | "fire";

export type FeedPostResult =
  | { error: string }
  | {
      id: string;
      mood: string;
      focusMinutes: number;
      chars: number;
      createdAt: string;
    };

export async function createFeedPost(
  mood: string,
  focusMinutes: number,
  chars: number
): Promise<FeedPostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const trimmedMood = mood.trim();
  if (!trimmedMood) return { error: "오늘 기분이나 소식을 입력해주세요." };

  const safeFocusMinutes = Math.max(0, Math.floor(focusMinutes) || 0);
  const safeChars = Math.max(0, Math.floor(chars) || 0);

  const { data, error } = await supabase
    .from("feed_posts")
    .insert({
      user_id: user.id,
      mood: trimmedMood,
      focus_minutes: safeFocusMinutes,
      chars: safeChars,
    })
    .select("id,mood,focus_minutes,chars,created_at")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "게시에 실패했습니다." };
  }

  revalidatePath("/feed");
  return {
    id: data.id,
    mood: data.mood,
    focusMinutes: data.focus_minutes,
    chars: data.chars,
    createdAt: data.created_at,
  };
}

export async function deleteFeedPost(postId: string): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase.from("feed_posts").delete().eq("id", postId);
  if (error) return { error: error.message };

  revalidatePath("/feed");
  return { ok: true };
}

// 이미 눌러둔 반응이면 취소(삭제), 아니면 새로 추가하는 토글 방식.
// 반응 종류(하트/멋져요/대단해요)는 서로 독립적으로 중복 선택 가능.
export async function toggleFeedReaction(
  postId: string,
  reactionType: ReactionType
): Promise<{ error: string } | { active: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: existing } = await supabase
    .from("feed_reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .eq("reaction_type", reactionType)
    .maybeSingle<{ id: string }>();

  if (existing) {
    const { error } = await supabase.from("feed_reactions").delete().eq("id", existing.id);
    if (error) return { error: error.message };
    revalidatePath("/feed");
    return { active: false };
  }

  const { error } = await supabase
    .from("feed_reactions")
    .insert({ post_id: postId, user_id: user.id, reaction_type: reactionType });
  if (error) return { error: error.message };

  revalidatePath("/feed");
  return { active: true };
}
