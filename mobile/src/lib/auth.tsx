import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";
import { WEB_URL } from "./config";

const LOGGED_IN_KEY = "poroom.loggedIn";

type AuthStatus = "loading" | "in" | "out";

type AuthContextValue = {
  status: AuthStatus;
  /** 로그인 직후 첫 WebView가 열어야 하는 세션 전달 주소(한 번 쓰면 비워진다). */
  takeHandoffUrl: () => string | null;
  signInWithGoogle: () => Promise<string | null>;
  /** 웹이 로그인 화면으로 돌아왔을 때(로그아웃/세션 만료) 앱도 로그아웃 상태로 맞춘다. */
  markLoggedOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// 안드로이드에서 인증 브라우저가 끝난 뒤 앱으로 돌아오는 처리를 마무리한다.
WebBrowser.maybeCompleteAuthSession();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  // 렌더와 무관한 일회용 값이라 state가 아니라 ref에 둔다(읽으면서 비울 수 있어야 한다).
  const handoffRef = useRef<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(LOGGED_IN_KEY)
      .then((v) => setStatus(v === "1" ? "in" : "out"))
      .catch(() => setStatus("out"));
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

      const { data: sessionData, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError || !sessionData.session) {
        return exchangeError?.message ?? "로그인에 실패했어요. 다시 시도해 주세요.";
      }

      // 세션은 웹 쿠키로 넘기고(#fragment라 서버 로그에 남지 않음), 앱 쪽 세션은 버린다.
      // scope: "local"이라 서버의 세션은 취소되지 않는다.
      const { access_token, refresh_token } = sessionData.session;
      const hash = new URLSearchParams({ access_token, refresh_token, next: "/main" }).toString();
      handoffRef.current = `${WEB_URL}/auth/app-session#${hash}`;
      await supabase.auth.signOut({ scope: "local" });

      await SecureStore.setItemAsync(LOGGED_IN_KEY, "1");
      setStatus("in");
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "로그인 중 문제가 생겼어요.";
    }
  }, []);

  const takeHandoffUrl = useCallback(() => {
    const url = handoffRef.current;
    handoffRef.current = null;
    return url;
  }, []);

  const markLoggedOut = useCallback(() => {
    SecureStore.deleteItemAsync(LOGGED_IN_KEY).catch(() => {});
    setStatus("out");
  }, []);

  const value = useMemo(
    () => ({ status, takeHandoffUrl, signInWithGoogle, markLoggedOut }),
    [status, takeHandoffUrl, signInWithGoogle, markLoggedOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
