"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MAX_EXTRA_NICKNAMES, MAX_NICKNAME_LENGTH } from "@/lib/nickname-limits";


export type NicknameItem = { id: string; nickname: string };

export async function getMyNicknames(): Promise<NicknameItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_nicknames")
    .select("id,nickname")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .returns<NicknameItem[]>();
  return data ?? [];
}

export async function createNickname(
  raw: string
): Promise<{ error: string } | { id: string; nickname: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const nickname = raw.trim();
  if (!nickname) return { error: "닉네임을 입력해주세요." };
  if (nickname.length > MAX_NICKNAME_LENGTH) {
    return { error: `닉네임은 ${MAX_NICKNAME_LENGTH}자 이하로 입력해주세요.` };
  }

  const existing = await getMyNicknames();
  if (existing.length >= MAX_EXTRA_NICKNAMES) {
    return { error: `닉네임은 기본 닉네임을 포함해 최대 ${MAX_EXTRA_NICKNAMES + 1}개까지 만들 수 있어요.` };
  }
  if (existing.some((n) => n.nickname === nickname)) {
    return { error: "이미 만들어 둔 닉네임이에요." };
  }

  const { data, error } = await supabase
    .from("user_nicknames")
    .insert({ user_id: user.id, nickname })
    .select("id,nickname")
    .single<NicknameItem>();
  if (error || !data) {
    return { error: error?.code === "P0001" ? "더 이상 닉네임을 만들 수 없어요." : "닉네임을 만들지 못했어요." };
  }
  return data;
}

// 이 방에서 쓸 닉네임을 정한다. nicknameId가 null이면 기본 닉네임을 쓴다.
// (내가 만든 닉네임인지 서버에서 다시 확인한다 — 남의 닉네임 id로는 설정할 수 없다.)
export async function setRoomNickname(
  roomId: string,
  nicknameId: string | null
): Promise<{ error: string } | { nickname: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  let nickname: string | null = null;
  if (nicknameId) {
    const { data } = await supabase
      .from("user_nicknames")
      .select("nickname")
      .eq("id", nicknameId)
      .eq("user_id", user.id)
      .maybeSingle<{ nickname: string }>();
    if (!data) return { error: "존재하지 않는 닉네임이에요." };
    nickname = data.nickname;
  }

  const { error } = await supabase
    .from("room_members")
    .update({ nickname, nickname_set: true })
    .eq("room_id", roomId)
    .eq("user_id", user.id);
  if (error) return { error: "닉네임을 바꾸지 못했어요." };

  revalidatePath(`/room/${roomId}`);
  return { nickname };
}
