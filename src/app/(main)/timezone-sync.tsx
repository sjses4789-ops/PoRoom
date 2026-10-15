"use client";

import { useEffect, useRef } from "react";
import { markAttendanceToday, syncTimezone } from "@/lib/profile";

// 보이지 않는 컴포넌트 — 브라우저가 감지한 시간대를 서버에 알려서 출석일 계산(각 나라 자정 기준)에 쓸 수 있게 하고,
// poroom에 들어와 있으면 그날 출석으로 남긴다. 탭을 켜 둔 채 자정을 넘기면 새 날짜로 다시 남긴다.
export function TimezoneSync() {
  const markedDayRef = useRef<string | null>(null);

  useEffect(() => {
    let tz: string | undefined;
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
    } catch {
      // Intl 미지원 등 — 조용히 무시하고 서버 쪽 기본값(한국)을 쓴다.
    }

    const localDay = () => {
      try {
        return new Intl.DateTimeFormat("en-CA", tz ? { timeZone: tz } : undefined).format(new Date());
      } catch {
        return new Date().toISOString().slice(0, 10);
      }
    };

    const mark = () => {
      const day = localDay();
      if (markedDayRef.current === day) return;
      markedDayRef.current = day;
      void markAttendanceToday(tz ?? null);
    };

    if (tz) void syncTimezone(tz);
    mark();
    // 자정을 넘겼는지 가끔 확인하고, 다른 탭에 있다 돌아왔을 때도 확인한다.
    const id = setInterval(mark, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") mark();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
