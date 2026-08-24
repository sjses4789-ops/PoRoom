"use server";

import { createClient } from "@/lib/supabase/server";
import { todayKst } from "@/lib/time";

// (main) 레이아웃이 떠 있는 동안 SiteTimeTracker가 주기적으로 호출해서
// poroom 체류 시간을 하루 단위로 누적한다 — [개인] 페이지의 "체류시간
// 대비 집중시간" 통계에서 사용.
export async function recordSiteTime(seconds: number) {
  if (seconds <= 0) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const date = todayKst();
  const { data: existing } = await supabase
    .from("site_time_logs")
    .select("id,seconds")
    .eq("user_id", user.id)
    .eq("record_date", date)
    .maybeSingle<{ id: string; seconds: number }>();

  if (existing) {
    await supabase
      .from("site_time_logs")
      .update({
        seconds: existing.seconds + seconds,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("site_time_logs").insert({
      user_id: user.id,
      record_date: date,
      seconds,
    });
  }
}
