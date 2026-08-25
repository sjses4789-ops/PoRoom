import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // "/"는 로그인 여부와 무관하게 항상 리다이렉트 없이 그대로 통과시킨다
  // (비로그인 방문자·구글 애드센스 크롤러도 리다이렉트 없이 콘텐츠와
  // 애드센스 스크립트를 바로 받아야 소유권 확인이 되기 때문) — 로그인
  // 여부에 따른 분기는 "/" 페이지 컴포넌트 자신이 처리한다.
  // 구글 서치 콘솔 소유권 확인용 HTML 파일(예: /google7ce16fc....html)은
  // public/ 아래 정적 파일로 서빙되지만, 로그인 안 한 구글 검증 봇이
  // 접근해야 하므로 로그인 리다이렉트 대상에서 제외한다.
  const isGoogleVerificationFile =
    /^\/google[a-z0-9]+\.html$/.test(request.nextUrl.pathname);

  const isPublicRoute =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname.startsWith("/privacy") ||
    // 검색엔진 크롤러(구글봇 등)는 로그인 상태가 아니므로, 검색 최적화용
    // 파일들도 로그인 리다이렉트 대상에서 제외해야 한다.
    request.nextUrl.pathname === "/sitemap.xml" ||
    request.nextUrl.pathname === "/robots.txt" ||
    isGoogleVerificationFile;

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/main";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
