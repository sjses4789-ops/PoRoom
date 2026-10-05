"use client";

import { useEffect } from "react";

// 서비스 워커를 등록한다(운영 빌드에서만 — 개발 중 캐시가 헷갈리지 않게).
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // 등록에 실패해도 사이트 사용에는 영향이 없다(설치/오프라인 안내만 빠진다).
    });
  }, []);
  return null;
}
