"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayKst } from "@/lib/time";

// 오늘(그리고 그 이후 날짜 전부)에 적용될 목표 글자수(및 선택적으로
// 시간 목표)를 설정한다. 같은 날짜에 다시 부르면 그 값만 덮어쓴다.
// targetMinutes를 안 넘기면(방의 char-input처럼 글자수만 다루는
// 호출부) 기존 시간 목표값은 그대로 둔다.
export async function setDailyCharGoal(targetChars: number, targetMinutes?: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const chars = Math.max(0, Math.floor(targetChars) || 0);
  const payload: {
    user_id: string;
    effective_date: string;
    target_chars: number;
    target_minutes?: number;
  } = { user_id: user.id, effective_date: todayKst(), target_chars: chars };
  if (targetMinutes !== undefined) {
    payload.target_minutes = Math.max(0, Math.floor(targetMinutes) || 0);
  }

  await supabase
    .from("daily_char_goals")
    .upsert(payload, { onConflict: "user_id,effective_date" });

  revalidatePath("/room/[id]", "page");
  revalidatePath("/me");
}
