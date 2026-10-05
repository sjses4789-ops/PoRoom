"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// 모바일 앱이 로그인에 성공한 뒤, 그 세션을 앱 안의 WebView(웹 쿠키)에 넘기는
// 관문 페이지. 토큰은 URL의 #(fragment)로만 전달되어 서버 로그나 네트워크
// 요청에 실리지 않고, 이 페이지에서 곧바로 세션 쿠키로 바뀐 뒤 지워진다.
export default function AppSessionPage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const rawNext = params.get("next") ?? "/main";
    // 열린 리다이렉트 방지: 같은 사이트 안의 경로만 허용한다.
    const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/main";

    // 토큰을 주소창/히스토리에 남기지 않는다.
    window.history.replaceState(null, "", window.location.pathname);

    if (!accessToken || !refreshToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 한 번만 입력(hash)을 검증하는 정당한 초기화
      setFailed(true);
      return;
    }

    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setFailed(true);
          return;
        }
        window.location.replace(next);
      });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-neutral-500">
      {failed ? "로그인 정보를 확인하지 못했어요. 앱에서 다시 로그인해 주세요." : "로그인 중..."}
    </main>
  );
}
