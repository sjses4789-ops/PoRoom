import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "오프라인",
  robots: { index: false },
};

// 인터넷 연결이 끊겼을 때 서비스 워커(public/sw.js)가 대신 보여주는 정적 안내 페이지.
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">인터넷에 연결되어 있지 않아요</h1>
      <p className="text-sm text-neutral-500">
        PoRoom은 함께 집중하는 서비스라 연결이 필요해요. 연결을 확인한 뒤 다시 시도해 주세요.
      </p>
      <p className="text-xs text-neutral-400">You&apos;re offline. Please check your connection and try again.</p>
    </main>
  );
}
