"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "poroom-theme";

// 이모지(🌙)는 CSS로 색을 바꿀 수 없어서, 다크 테마의 "검정 채움색 달
// 아이콘" 요구를 맞추려면 직접 그린 초승달 SVG를 fill로 칠해야 한다.
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden>
      <path fill="black" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ThemeToggle() {
  // an inline script (see root layout) applies the persisted theme to
  // <html> before hydration, so reading it here — rather than syncing via
  // an effect — keeps this in sync with what's already on screen.
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  // 서버는 항상 라이트로 렌더링하니, 이 버튼의 아이콘/위치는 다크 상태일
  // 때 서버-클라이언트 하이드레이션 결과가 달라진다 — suppressHydrationWarning로
  // 경고는 죽였지만, 그 부작용으로 리액트가 "첫 하이드레이션에서는 이미
  // 화면에 있는(서버가 그린 라이트용) DOM을 그대로 믿고 건드리지 않는다"라서,
  // 새로고침 직후 실제로는 다크인데도(<html>에 dark 클래스는 이미 붙어
  // 있음) 버튼 자체는 라이트 모양(☀️, 왼쪽 위치)으로 잠깐~계속 멈춰 있는
  // 경우가 있었다. 마운트 직후 한 번 실제 상태로 다시 맞춰 이 어긋남을
  // 없앤다(이미 맞으면 setDark가 같은 값이라 리렌더는 안 일어난다).
  // 마운트 시 한 번만 외부 상태(<html> 클래스)를 읽어와 리액트 state에
  // 반영하는 정당한 동기화라 규칙이 스스로 인정하는 예외에 해당한다.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "다크 테마 (누르면 라이트 테마로 전환)" : "라이트 테마 (누르면 다크 테마로 전환)"}
      suppressHydrationWarning
      // 기본(라이트) 테마: 트랙 전체(달 아이콘 쪽·해 쪽 모두)가 검정.
      // 다크 테마: 트랙 전체가 화이트.
      className="relative flex h-6 w-12 shrink-0 items-center rounded-full border border-neutral-300 bg-black p-0.5 transition dark:border-neutral-600 dark:bg-white"
    >
      <span
        suppressHydrationWarning
        // 기본 테마의 동그라미(해)는 검정이 아니어야 하므로 흰색으로,
        // 다크 테마의 동그라미는 회색 채움 안에 검정 달 아이콘을 담는다.
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] leading-none shadow transition-transform duration-200 ${
          dark ? "translate-x-6 bg-neutral-400" : "translate-x-0 bg-white"
        }`}
      >
        {dark ? <MoonIcon /> : "☀️"}
      </span>
    </button>
  );
}
