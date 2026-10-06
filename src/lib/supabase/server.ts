import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

// 모바일 앱(mobile/)은 쿠키가 아니라 "Authorization: Bearer <로그인 토큰>" 헤더로
// 요청을 보낸다. 이 헤더가 있으면 그 토큰의 사용자로(RLS 그대로 적용) 동작하는
// 클라이언트를 돌려준다 — 그래서 기존 서버 액션(src/lib/*.ts)을 앱도 코드 중복
// 없이 그대로 쓸 수 있다. 헤더가 없으면(웹) 지금까지와 완전히 같은 쿠키 방식이다.
async function bearerToken(): Promise<string | null> {
  try {
    const auth = (await headers()).get("authorization");
    const match = auth ? /^Bearer\s+(.+)$/i.exec(auth) : null;
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

export async function createClient(): Promise<SupabaseClient> {
  const token = await bearerToken();

  if (token) {
    const client = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      }
    );
    // 서버 액션들은 auth.getUser()를 인자 없이 부른다 — 쿠키 세션이 없는 이 클라이언트가
    // 같은 호출로 헤더의 토큰 사용자를 확인할 수 있게 기본 토큰을 채워준다.
    const getUser = client.auth.getUser.bind(client.auth);
    client.auth.getUser = (jwt?: string) => getUser(jwt ?? token);
    return client;
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component; safe to ignore
            // because middleware refreshes the session on every request.
          }
        },
      },
    }
  );
}
