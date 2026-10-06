import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { WEB_URL } from "./config";

type AuthStatus = "loading" | "in" | "out";

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  userId: string | null;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
  /**
   * 웹 화면(WebView)에 로그인 상태를 빌려주는 주소를 만든다. 액세스 토큰만 넘기고(#fragment라
   * 서버 로그에 남지 않음), refresh token 자리에는 더미 값을 넣는다 — 진짜 refresh token을
   * 웹이 같이 쓰면 한쪽이 갱신할 때 다른 쪽이 무효화되기 때문이다. 웹 쪽 토큰이 만료되면
   * 웹이 로그인 화면으로 돌아가고, 앱이 이를 감지해 이 주소로 다시 빌려준다.
   */
  webSessionUrl: (nextPath: string) => string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// 안드로이드에서 인증 브라우저가 끝난 뒤 앱으로 돌아오는 처리를 마무리한다.
WebBrowser.maybeCompleteAuthSession();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setStatus(data.session ? "in" : "out");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setStatus(next ? "in" : "out");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<string | null> => {
    try {
      // 구글은 앱 안의 WebView에서의 로그인을 막으므로, 시스템 브라우저(Chrome Custom Tab)로
      // 로그인하고 poroom://auth-callback 으로 돌아온다. 돌아올 땐 토큰이 아니라
      // 일회용 code만 오고, 이 code는 앱이 들고 있는 PKCE 검증값이 있어야만 쓸 수 있다.
      const redirectTo = Linking.createURL("auth-callback");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data.url) return error?.message ?? "로그인을 시작하지 못했어요.";

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== "success") return null; // 사용자가 닫음

      const code = new URL(result.url).searchParams.get("code");
      if (!code) return "로그인 응답을 확인하지 못했어요. 다시 시도해 주세요.";

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) return exchangeError.message;
      return null; // 세션은 onAuthStateChange가 반영한다.
    } catch (e) {
      return e instanceof Error ? e.message : "로그인 중 문제가 생겼어요.";
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const webSessionUrl = useCallback(
    (nextPath: string) => {
      if (!session) return null;
      const hash = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: "app-managed",
        next: nextPath,
      }).toString();
      return `${WEB_URL}/auth/app-session#${hash}`;
    },
    [session]
  );

  const value = useMemo(
    () => ({
      status,
      session,
      userId: session?.user.id ?? null,
      signInWithGoogle,
      signOut,
      webSessionUrl,
    }),
    [status, session, signInWithGoogle, signOut, webSessionUrl]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
