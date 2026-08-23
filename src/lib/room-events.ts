"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EventResult =
  | { error: string }
  | {
      id: string;
      title: string;
      eventDate: string;
      memo: string | null;
      categoryId: string | null;
    };

export async function createEvent(
  roomId: string,
  title: string,
  eventDate: string,
  memo: string,
  categoryId: string | null
): Promise<EventResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const trimmedTitle = title.trim();
  if (!trimmedTitle) return { error: "일정 제목을 입력해주세요." };
  if (!eventDate) return { error: "날짜를 선택해주세요." };

  const { data, error } = await supabase
    .from("room_events")
    .insert({
      room_id: roomId,
      title: trimmedTitle,
      event_date: eventDate,
      memo: memo.trim() || null,
      category_id: categoryId,
      created_by: user.id,
    })
    .select("id,title,event_date,memo,category_id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "일정 추가에 실패했습니다." };
  }

  revalidatePath(`/room/${roomId}`);
  return {
    id: data.id,
    title: data.title,
    eventDate: data.event_date,
    memo: data.memo,
    categoryId: data.category_id,
  };
}

export async function celebrateEvent(roomId: string, eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("event_celebrations")
    .insert({ event_id: eventId, user_id: user.id });

  if (error && error.code !== "23505") return;

  revalidatePath(`/room/${roomId}`);
}
