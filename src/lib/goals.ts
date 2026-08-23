"use server";

import { revalidatePath } from "next/cache";
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
  if (!user) return { error: "로그인이 필요합니다." };

  const period = String(formData.get("period") ?? "month");
  const targetChars = Number(formData.get("targetChars") ?? 0) || 0;
  const targetMinutes = Number(formData.get("targetMinutes") ?? 0) || 0;

  if (!["month", "year"].includes(period)) {
    return { error: "잘못된 기간입니다." };
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
