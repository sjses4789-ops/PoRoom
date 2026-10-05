import Constants from "expo-constants";

type Extra = { webUrl: string; supabaseUrl?: string; supabaseAnonKey?: string };
const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const WEB_URL = extra.webUrl.replace(/\/$/, "");
export const SUPABASE_URL = extra.supabaseUrl ?? "";
export const SUPABASE_ANON_KEY = extra.supabaseAnonKey ?? "";

// 웹(src/lib/app-mode.ts)이 이 표식으로 "앱 안의 WebView"를 알아보고 상단 메뉴/푸터/광고를 숨긴다.
export const APP_USER_AGENT_TOKEN = "PoRoomApp/1.0";

// 웹 페이지 주소만 갈아끼우면 되도록 탭 → 웹 경로를 한곳에 모은다.
export const TABS = [
  { name: "index", title: "포룸", path: "/main", icon: "home" },
  { name: "feed", title: "피드", path: "/feed", icon: "newspaper" },
  { name: "compete", title: "도전", path: "/compete", icon: "flash" },
  { name: "ranking", title: "랭킹", path: "/ranking", icon: "trophy" },
  { name: "rest", title: "휴식", path: "/rest", icon: "cafe" },
  { name: "me", title: "개인", path: "/me", icon: "person" },
] as const;
