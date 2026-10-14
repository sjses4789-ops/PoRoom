import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// 프로필 행(public.users)이 없는 로그인 계정이면 만들어 준다 — 탈퇴 뒤 같은 구글 계정으로 다시 가입한 경우, 가입 시 프로필을
// 만드는 트리거가 다시 돌지 않아 행이 없다(0073). 함수가 아직 없으면(0073 실행 전) 조용히 넘어간다.
export async function ensureMyProfile(supabase: Supabase): Promise<void> {
  try {
    await supabase.rpc("ensure_my_profile");
  } catch {
    // 실패해도 호출한 쪽이 계속 진행한다.
  }
}
