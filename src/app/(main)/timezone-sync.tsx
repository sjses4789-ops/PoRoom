"use client";

import { useEffect } from "react";
import { syncTimezone } from "@/lib/profile";

// 보이지 않는 컴포넌트 — 브라우저가 감지한 시간대를 서버에 알려서
// 출석일 계산(각 나라 자정 기준)에 쓸 수 있게 한다.
export function TimezoneSync() {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) syncTimezone(tz);
    } catch {
      // Intl 미지원 등 — 조용히 무시하고 서버 쪽 기본값(한국)을 쓴다.
    }
  }, []);

  return null;
}
