"use server";

import { revalidatePath } from "next/cache";
import { err } from "@/lib/errors";
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
  if (!user) return { error: await err("loginRequired") };

  const trimmedTitle = title.trim();
  if (!trimmedTitle) return { error: await err("eventTitleRequired") };
  if (!eventDate) return { error: await err("dateRequired") };

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
    return { error: error?.message ?? await err("eventAddFailed") };
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

export type EventEditResult = { error: string } | { ok: true };

// RLS(0043_room_event_edit)가 작성자/방장/부방장만 허용한다.
export async function updateEvent(
  roomId: string,
  eventId: string,
  title: string,
  eventDate: string,
  memo: string,
  categoryId: string | null
): Promise<EventEditResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await err("loginRequired") };

  const trimmedTitle = title.trim();
  if (!trimmedTitle) return { error: await err("eventTitleRequired") };
  if (!eventDate) return { error: await err("dateRequired") };

  const { error } = await supabase
    .from("room_events")
    .update({
      title: trimmedTitle,
      event_date: eventDate,
      memo: memo.trim() || null,
      category_id: categoryId,
    })
    .eq("id", eventId);

  if (error) return { error: error.message };

  revalidatePath(`/room/${roomId}`);
  return { ok: true };
}

export async function deleteEvent(roomId: string, eventId: string): Promise<EventEditResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await err("loginRequired") };

  const { error } = await supabase.from("room_events").delete().eq("id", eventId);
  if (error) return { error: error.message };

  revalidatePath(`/room/${roomId}`);
  return { ok: true };
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
