// 화면 오류를 서버에 알린다(실패해도 조용히 넘어간다). error.tsx / global-error.tsx에서 쓴다.
export function reportClientError(error: Error & { digest?: string }) {
  try {
    void fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message + (error.digest ? ` [${error.digest}]` : ""),
        stack: error.stack,
        url: typeof window !== "undefined" ? window.location.href : null,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // 무시
  }
}
