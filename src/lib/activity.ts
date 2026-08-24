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

  // 이 로그가 출석일 계산의 유일한 근거라서, insert가 조용히 실패하면
  // (RLS, FK 등) 다른 기능(글자수/집중시간 기록)은 정상 동작하는데
  // 출석만 카운팅되지 않는 것처럼 보이는 원인을 찾기 어려웠다 — 실패
  // 시 서버 로그에 남긴다.
  const { error } = await supabase.from("activity_logs").insert({
    user_id: user.id,
    room_id: roomId,
    type,
    amount: amount ?? null,
  });
  if (error) {
    console.error(`logActivity failed (type=${type}, user=${user.id}, room=${roomId}):`, error);
  }
}
