"use server";

import { createClient } from "@/lib/supabase/server";

// 관리자 여부는 항상 서버에서(클라이언트 번들에 노출되지 않는 곳에서)
// DB의 users.is_admin 플래그로 판단한다 — 이메일을 코드에 하드코딩해
// 비교하지 않는 이유는, RLS도 같은 플래그를 보고 있어서 UI 체크와
// DB 권한이 항상 같은 소스를 보게 하기 위함.
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle<{ is_admin: boolean }>();

  return data?.is_admin ?? false;
}
