import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 서비스 키로 동작하는 관리자 클라이언트 — RLS를 건너뛰므로 서버 코드에서만, 꼭 필요한 곳(계정 완전 삭제, 오류 기록,
// 고아 계정 정리)에서만 쓴다. 키(SUPABASE_SERVICE_ROLE_KEY)는 NEXT_PUBLIC_ 접두사 없이 서버 환경변수로만 둔다.
// 키가 없으면 null을 돌려주므로, 호출하는 쪽이 "키가 없을 때"의 동작을 정해야 한다.
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
