"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/report-client-error";

// 화면을 그리다 예상하지 못한 오류가 나면 보이는 안내 — 오류는 자동으로 운영자에게 기록된다.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">문제가 생겼어요</h1>
      <p className="max-w-xs text-sm text-neutral-500">
        잠시 후 다시 시도해 주세요. 같은 문제가 계속되면 [기능 제안 & 버그 신고]로 알려 주세요. 오류는 자동으로 기록돼요.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
      >
        다시 시도
      </button>
    </main>
  );
}
