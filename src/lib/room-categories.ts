"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CategoryResult =
  | { error: string }
  | { id: string; name: string; color: string };

export async function createCategory(
  roomId: string,
  name: string,
  color: string
): Promise<CategoryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const trimmed = name.trim();
  if (!trimmed) return { error: "카테고리 이름을 입력해주세요." };

  const { data, error } = await supabase
    .from("room_event_categories")
    .insert({ room_id: roomId, name: trimmed, color, created_by: user.id })
    .select("id,name,color")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "카테고리 생성에 실패했습니다." };
  }

  revalidatePath(`/room/${roomId}`);
  return data;
}
