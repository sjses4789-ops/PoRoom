import { headers } from "next/headers";

// PoRoom 모바일 앱(mobile/)의 WebView가 User-Agent 뒤에 붙이는 표식 —
// 앱에서는 하단 탭 바가 네비게이션을 맡으므로 웹의 상단 메뉴/푸터를
// 숨기고, 앱에서 쓸 수 없는 광고 스크립트도 싣지 않는다.
export const APP_USER_AGENT_TOKEN = "PoRoomApp";

export async function isAppRequest(): Promise<boolean> {
  const ua = (await headers()).get("user-agent") ?? "";
  return ua.includes(APP_USER_AGENT_TOKEN);
}
