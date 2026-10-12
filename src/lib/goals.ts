"use server";

import { revalidatePath } from "next/cache";
import { err } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/rooms";

export async function saveGoal(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await err("loginRequired") };

  const period = String(formData.get("period") ?? "month");
  const targetChars = Number(formData.get("targetChars") ?? 0) || 0;
  const targetMinutes = Number(formData.get("targetMinutes") ?? 0) || 0;

  if (!["month", "year"].includes(period)) {
    return { error: await err("invalidPeriod") };
  }

  const { error } = await supabase.from("goals").upsert(
    {
      user_id: user.id,
      period,
      target_chars: targetChars,
      target_minutes: targetMinutes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,period" }
  );

  if (error) return { error: error.message };

  revalidatePath("/me");
  return null;
}
