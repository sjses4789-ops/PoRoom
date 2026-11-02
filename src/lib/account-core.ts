import { createClient } from "@/lib/supabase/server";
import { leaveRoom } from "@/lib/rooms";
import { purgeMyChatImages } from "@/lib/chat-image-purge";
import { createAdminClient } from "@/lib/supabase/admin";

// 계정 탈퇴: 참여 중인 모든 방에서 먼저 정상적으로 나가게 한다(leaveRoom과 동일한 로직 재사용 — 방장이면 다른 참여자에게
// 방장을 넘기거나, 혼자면 방을 삭제하는 처리가 그대로 적용된다). room_members를 남긴 채 곧바로 public.users 행만 지우면
// rooms.owner_id의 on delete cascade 때문에 내가 방장인 방이 다른 참여자가 있어도 통째로 사라져버리는 문제가 있어서,
// 반드시 이 순서로 처리해야 한다.
//
// public.users를 지우면 user_id를 참조하는 나머지 테이블(일별 기록, 활동 로그, 채팅, 작품, 목표, 할 일, 피드백, 투표 등)은
// 전부 on delete cascade로 함께 정리된다. 마지막으로 서비스 키로 로그인 계정(auth.users)까지 지운다 — 예전에는 이 키가
// 없어 로그인 계정이 남았고, 같은 구글 계정으로 다시 가입하면 프로필 행이 없는 상태가 되는 문제가 있었다(0073).
// 서비스 키가 없으면(SUPABASE_SERVICE_ROLE_KEY) 로그인 계정은 남는다 — 이 경우 관리자 페이지의 "고아 계정 정리"로 나중에 지운다.
export async function performAccountDeletion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<{ error: string } | { authDeleted: boolean }> {
  const { data: memberships } = await supabase
    .from("room_members")
    .select("room_id")
    .eq("user_id", userId)
    .returns<{ room_id: string }[]>();

  // 내가 올린 채팅 사진 파일을 먼저 지운다(계정이 지워지면 사진을 찾을 방법이 없어진다).
  await purgeMyChatImages(supabase).catch(() => 0);

  for (const m of memberships ?? []) {
    await leaveRoom(m.room_id);
  }

  const { error } = await supabase.from("users").delete().eq("id", userId);
  if (error) return { error: error.message };

  const admin = createAdminClient();
  if (!admin) return { authDeleted: false };
  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  return { authDeleted: !authError };
}

