"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

// 오늘(그리고 그 이후 날짜 전부)에 적용될 목표 글자수를 설정한다. 같은
// 날짜에 다시 부르면 그 값만 덮어쓴다.
export async function setDailyCharGoal(targetChars: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const value = Math.max(0, Math.floor(targetChars) || 0);

  await supabase
    .from("daily_char_goals")
    .upsert(
      { user_id: user.id, effective_date: todayUtc(), target_chars: value },
      { onConflict: "user_id,effective_date" }
    );

  revalidatePath("/room/[id]", "page");
}
