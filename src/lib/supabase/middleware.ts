import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADSENSE_REVIEW_MODE } from "@/lib/adsense-review-mode";

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

  // 홈페이지의 언어별 SEO 진입점(/en, /ja, /zh) — 실제로는 "/"와 같은
  // 페이지를 렌더링하지만, URL이 따로 있어야 구글이 언어별로 색인한다.
  const homeLocaleMatch = /^\/(en|ja|zh)$/.exec(request.nextUrl.pathname);

  const isPublicRoute =
    request.nextUrl.pathname === "/" ||
    homeLocaleMatch !== null ||
    // 로그인 없이 (main) 레이아웃 헤더(테마 토글 등)를 재현해 실제
    // 배포 환경에서 테스트하기 위한 숨김 QA 페이지 — 어디에도 링크되지
    // 않고 robots.ts에서도 색인을 막아둔다.
    request.nextUrl.pathname.startsWith("/qa-x7f3") ||
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname.startsWith("/privacy") ||
    // 검색엔진 크롤러(구글봇 등)는 로그인 상태가 아니므로, 검색 최적화용
    // 파일들도 로그인 리다이렉트 대상에서 제외해야 한다.
    request.nextUrl.pathname === "/sitemap.xml" ||
    request.nextUrl.pathname === "/robots.txt" ||
    isGoogleVerificationFile;

  // ADSENSE_REVIEW_MODE 동안은 "/"와 같은 논리로, 로그인 리다이렉트를
  // 미들웨어 단에서 걸지 않고 각 페이지 컴포넌트가 스스로 판단하게
  // 맡긴다 — [포룸]·[피드]·[랭킹]·[휴식]·[도전] 목록은 로그인 없이도
  // 렌더링되도록 고쳐뒀고, [개인]·방 내부·도전 상세·피드백·관리자
  // 페이지는 각자 자기 안에서 여전히 로그인을 요구한다.
  if (!user && !isPublicRoute && !ADSENSE_REVIEW_MODE) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/main";
    return NextResponse.redirect(url);
  }

  if (homeLocaleMatch) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const rewritten = NextResponse.rewrite(url);
    rewritten.headers.set("x-poroom-locale", homeLocaleMatch[1]);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      rewritten.cookies.set(cookie);
    });
    return rewritten;
  }

  return supabaseResponse;
}
