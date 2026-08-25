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
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const celebrate = useCallback((msg: string) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    setVisible(false);
    setMessage(msg);
    // 먼저 보이지 않는 상태로 그려진 다음 opacity 전환이 걸리도록 한
    // 틱 늦춰서 visible을 켠다 — 그래야 트랜지션이 눈에 보인다.
    // requestAnimationFrame은 화면에 실제로 그려지고 있을 때만 불리므로
    // (탭이 백그라운드거나 렌더링이 억제된 환경에서는 아예 안 불릴 수
    // 있음) 대신 setTimeout을 쓴다.
    showTimerRef.current = setTimeout(() => setVisible(true), 10);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      clearTimerRef.current = setTimeout(() => setMessage(null), FADE_MS);
    }, DISPLAY_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, []);

  // 회끼가 섞인, 흰색에 아주 가까운 옅은 파스텔 노란색 — 테마와 무관하게
  // 항상 밝은 톤이라 글자는 항상 어두운 색으로 고정해야 읽힌다(다른
  // 채움색 있는 카드들과 같은 원칙).
  const toast = message ? (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div
        className={`rounded-[2rem] px-8 py-6 text-center text-base font-semibold text-neutral-900 shadow-xl transition-all duration-300 ${
          visible ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
        style={{ backgroundColor: "#FAF8F2" }}
      >
        {message}
      </div>
    </div>
  ) : null;

  return { toast, celebrate };
}
