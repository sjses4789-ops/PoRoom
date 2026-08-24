"use client";

import { useEffect } from "react";
import { recordSiteTime } from "@/lib/site-time";

const FLUSH_INTERVAL_SECONDS = 30;

// (main) 레이아웃에 조용히 떠서 poroom 체류 시간을 30초 단위로 서버에
// 누적하는 보이지 않는 컴포넌트 — 탭이 백그라운드일 땐 세지 않는다.
export function SiteTimeTracker() {
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        recordSiteTime(FLUSH_INTERVAL_SECONDS);
      }
    }, FLUSH_INTERVAL_SECONDS * 1000);
    return () => clearInterval(id);
  }, []);

  return null;
}
