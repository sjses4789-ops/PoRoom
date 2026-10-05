import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

// 앱은 로그인 "수단"으로만 Supabase를 쓴다 — 로그인 결과(세션)는 곧바로 WebView의
// 웹 쿠키로 넘기고 앱 쪽에는 저장하지 않는다(persistSession: false). 웹과 앱이 같은
// refresh token을 따로 들고 있으면 한쪽이 갱신할 때 다른 쪽이 무효화되기 때문이다.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: "pkce",
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
