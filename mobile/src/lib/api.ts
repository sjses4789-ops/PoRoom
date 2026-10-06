import { WEB_URL } from "./config";
import { supabase } from "./supabase";

// 웹의 서버 액션(src/lib/*.ts)을 앱이 그대로 부르는 호출 — 같은 규칙·같은 검증을 거친다.
// 허용된 함수 이름 목록은 서버(src/app/api/app/rpc/route.ts)에 있다.
export type RpcName =
  | "joinOpenRoom"
  | "leaveRoom"
  | "touchLastSeen"
  | "setWorkStatus"
  | "recordChars"
  | "recordFocusMinutes"
  | "recordBreakMinutes"
  | "toggleFavoriteRoom"
  | "getMyWorks"
  | "createWork"
  | "recordWorkChars"
  | "setDailyCharGoal";

export async function rpc<T = unknown>(fn: RpcName, ...args: unknown[]): Promise<T | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  try {
    const res = await fetch(`${WEB_URL}/api/app/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fn, args }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { ok: boolean; result: T | null };
    return json.ok ? json.result : null;
  } catch {
    return null;
  }
}
