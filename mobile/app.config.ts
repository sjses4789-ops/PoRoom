import fs from "node:fs";
import path from "node:path";
import type { ExpoConfig } from "expo/config";

// 웹 프로젝트(.env.local)에 이미 있는 공개 값(Supabase URL/anon key)을 앱도 그대로
// 쓴다 — 별도 설정 파일을 중복으로 만들지 않기 위해 빌드할 때 읽어서 넣는다.
// (둘 다 브라우저에도 공개되는 NEXT_PUBLIC_ 값이라 앱 번들에 들어가도 안전하다.)
function readWebEnv(): Record<string, string> {
  const file = path.resolve(__dirname, "..", ".env.local");
  if (!fs.existsSync(file)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = { ...readWebEnv(), ...process.env } as Record<string, string | undefined>;

const config: ExpoConfig = {
  name: "PoRoom",
  slug: "poroom",
  scheme: "poroom",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  android: {
    package: "kr.poroom.app",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    predictiveBackGestureEnabled: false,
  },
  ios: {
    bundleIdentifier: "kr.poroom.app",
    supportsTablet: true,
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    ["expo-notifications", { color: "#c17b7b" }],
    ["expo-splash-screen", { image: "./assets/splash-icon.png", backgroundColor: "#ffffff", imageWidth: 200 }],
  ],
  extra: {
    // 개발 중에는 POROOM_WEB_URL=http://10.0.2.2:3000 처럼 로컬 웹 서버를 가리킬 수 있다.
    webUrl: env.POROOM_WEB_URL ?? "https://poroom.kr",
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // POROOM_PREVIEW=1 로 빌드하면 로그인 없이 방 화면 레이아웃만 보는 /preview 화면이 열린다.
    preview: env.POROOM_PREVIEW === "1",
  },
};

export default config;
