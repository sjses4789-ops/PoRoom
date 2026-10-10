import type { SupabaseClient } from "@supabase/supabase-js";

// 입장과 함께 저장할 닉네임을 정한다(서버 전용 헬퍼 — 서버 액션 파일이 아니라서 클라이언트에서 직접
// 호출할 수 없다). nicknameId가 없으면(기본 닉네임) nickname은 null이고, 내가 만든 닉네임이 아닌
// id가 오면 ok=false다(남의 닉네임으로는 입장할 수 없다).
export async function resolveJoinNickname(
  supabase: SupabaseClient,
  userId: string,
  nicknameId: string | null | undefined
): Promise<{ nickname: string | null; ok: boolean }> {
  if (!nicknameId) return { nickname: null, ok: true };
  const { data } = await supabase
    .from("user_nicknames")
    .select("nickname")
    .eq("id", nicknameId)
    .eq("user_id", userId)
    .maybeSingle<{ nickname: string }>();
  if (!data) return { nickname: null, ok: false };
  return { nickname: data.nickname, ok: true };
}
