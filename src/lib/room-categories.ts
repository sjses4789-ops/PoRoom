"use server";

import { revalidatePath } from "next/cache";
import { err } from "@/lib/errors";
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
  if (!user) return { error: await err("loginRequired") };

  const trimmed = name.trim();
  if (!trimmed) return { error: await err("categoryNameRequired") };

  const { data, error } = await supabase
    .from("room_event_categories")
    .insert({ room_id: roomId, name: trimmed, color, created_by: user.id })
    .select("id,name,color")
    .single();

  if (error || !data) {
    return { error: error?.message ?? await err("categoryCreateFailed") };
  }

  revalidatePath(`/room/${roomId}`);
  return data;
}
