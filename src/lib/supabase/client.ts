import { createBrowserClient } from "@supabase/ssr";

// 공용 클라이언트와 별개의 실시간 연결이 필요할 때 쓴다(예: 방 화면과 같은 이름의 채널을 동시에 다뤄야 할 때).
export function createIsolatedClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { isSingleton: false }
  );
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
