"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DISPLAY_MS = 3000;
const FADE_MS = 300;

// 목표 글자수 달성·챌린지 성공 같은 순간에 3초간 떴다가 스스로 사라지는
// 축하 토스트. 여러 페이지(방, 피드)에서 재사용하기 위해 훅으로 분리.
export function useCelebrationToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const celebrate = useCallback((msg: string) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    setMessage(msg);
    // 먼저 보이지 않는 상태로 그려진 다음 opacity 전환이 걸리도록 한
    // 프레임 늦춰서 visible을 켠다 — 그래야 트랜지션이 눈에 보인다.
    requestAnimationFrame(() => setVisible(true));
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      clearTimerRef.current = setTimeout(() => setMessage(null), FADE_MS);
    }, DISPLAY_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  const toast = message ? (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-[100] flex justify-center px-4">
      <div
        className={`rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-300 dark:bg-white dark:text-neutral-900 ${
          visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        {message}
      </div>
    </div>
  ) : null;

  return { toast, celebrate };
}
