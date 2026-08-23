"use server";

import { createClient } from "@/lib/supabase/server";

export type ActivityType =
  | "session_start"
  | "session_end"
  | "chars_added"
  | "focus_recorded";

export async function logActivity(
  roomId: string | null,
  type: ActivityType,
  amount?: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    room_id: roomId,
    type,
    amount: amount ?? null,
  });
}
