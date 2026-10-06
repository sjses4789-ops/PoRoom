import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

// 앱이 로그인 세션의 "주인"이다 — 웹과 같은 Supabase 프로젝트·같은 계정을 쓰고, 세션은
// 앱 저장소(AsyncStorage)에 보관·자동 갱신한다. 웹(WebView) 화면에는 이 세션의 액세스
// 토큰만 잠깐 빌려준다(AppWebView 참고).
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: "pkce",
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// 앱이 백그라운드에 있는 동안은 토큰 자동 갱신 타이머를 멈추고, 돌아오면 다시 켠다
// (supabase-js 공식 React Native 권장 방식).
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
