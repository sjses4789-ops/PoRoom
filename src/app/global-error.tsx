"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/report-client-error";

// 최상위 레이아웃에서 난 오류용 — 이 화면은 레이아웃을 대신하므로 html/body를 직접 그린다.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(error);
  }, [error]);

  return (
    <html lang="ko">
      <body style={{ fontFamily: "sans-serif", display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center", padding: 24 }}>
        <h1 style={{ fontSize: 18 }}>문제가 생겼어요</h1>
        <p style={{ fontSize: 14, color: "#666" }}>잠시 후 다시 시도해 주세요. 오류는 자동으로 기록돼요.</p>
        <button type="button" onClick={reset} style={{ padding: "8px 16px", background: "#171717", color: "#fff", border: 0, borderRadius: 6 }}>
          다시 시도
        </button>
      </body>
    </html>
  );
}
