"use server";

import { createClient } from "@/lib/supabase/server";
import { leaveRoom } from "@/lib/rooms";

// 계정 탈퇴: 참여 중인 모든 방에서 먼저 정상적으로 나가게 한다(leaveRoom과
// 동일한 로직 재사용 — 방장이면 다른 참여자에게 방장을 넘기거나, 혼자면
// 방을 삭제하는 처리가 그대로 적용된다). room_members를 남긴 채 곧바로
// public.users 행만 지우면 rooms.owner_id의 on delete cascade 때문에
// 내가 방장인 방이 다른 참여자가 있어도 통째로 사라져버리는 문제가
// 있어서, 반드시 이 순서로 처리해야 한다.
//
// public.users를 지우면 user_id를 참조하는 나머지 테이블(일별 기록,
// 활동 로그, 채팅, 작품, 목표, 할 일, 피드백, 투표 등)은 전부
// on delete cascade로 함께 정리된다. 다만 서비스 키가 없어 Supabase
// Auth의 auth.users 행 자체는 지울 수 없다 — 로그아웃까지만 확실히
// 시킨다.
export async function deleteAccount(): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: memberships } = await supabase
    .from("room_members")
    .select("room_id")
    .eq("user_id", user.id)
    .returns<{ room_id: string }[]>();

  for (const m of memberships ?? []) {
    await leaveRoom(m.room_id);
  }

  const { error } = await supabase.from("users").delete().eq("id", user.id);
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  return null;
}
