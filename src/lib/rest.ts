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
      roomId: string | null;
    };

export async function createRestPost(
  title: string,
  content: string,
  category: RestPostCategory,
  roomId?: string | null
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

  // 방 링크는 "인원 모집" 게시판에서만, 그리고 작성자가 실제로 그 방에
  // 참여 중일 때만 걸 수 있게 한다 — 다른 방을 흉내내 링크를 거는 걸
  // 막기 위해 room_members에 본인 행이 있는지 서버에서 한 번 더 확인.
  let linkedRoomId: string | null = null;
  if (category === "인원 모집" && roomId) {
    const { data: membership } = await supabase
      .from("room_members")
      .select("room_id")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .maybeSingle<{ room_id: string }>();
    linkedRoomId = membership?.room_id ?? null;
  }

  const { data, error } = await supabase
    .from("rest_posts")
    .insert({
      user_id: user.id,
      title: trimmedTitle,
      content: trimmedContent,
      category,
      room_id: linkedRoomId,
    })
    .select("id,title,content,created_at,category,room_id")
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
    roomId: data.room_id,
  };
}

export type JoinedRoom = { id: string; name: string };

export async function getMyJoinedRooms(): Promise<JoinedRoom[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("room_members")
    .select("rooms(id,name)")
    .eq("user_id", user.id)
    .returns<{ rooms: { id: string; name: string } | null }[]>();

  return (data ?? [])
    .map((r) => r.rooms)
    .filter((r): r is { id: string; name: string } => r !== null);
}

export type RestPostEditResult = { error: string } | { ok: true };

export async function updateRestPost(
  postId: string,
  title: string,
  content: string,
  roomId?: string | null
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

  let linkedRoomId: string | null = null;
  if (roomId) {
    const { data: membership } = await supabase
      .from("room_members")
      .select("room_id")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .maybeSingle<{ room_id: string }>();
    linkedRoomId = membership?.room_id ?? null;
  }

  const { error } = await supabase
    .from("rest_posts")
    .update({ title: trimmedTitle, content: trimmedContent, room_id: linkedRoomId })
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
