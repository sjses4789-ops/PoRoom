import { createBrowserClient } from "@supabase/ssr";

// 실시간 연결의 하트비트를 웹 워커가 세게 한다 — 방 탭이 백그라운드(집필 프로그램이 앞)에 있으면 브라우저가
// 메인 스레드 타이머를 몇 분 뒤부터 1분에 한 번 수준으로 늦춰서 하트비트가 끊기고, 서버가 연결을 닫아
// 화면 공유 프레임·채팅·접속 상태가 더 이상 안 나가기 때문이다.
const REALTIME_OPTIONS = { worker: true };

// 공용 클라이언트와 별개의 실시간 연결이 필요할 때 쓴다(예: 방 화면과 같은 이름의 채널을 동시에 다뤄야 할 때).
export function createIsolatedClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { isSingleton: false, realtime: REALTIME_OPTIONS }
  );
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { realtime: REALTIME_OPTIONS }
  );
}
