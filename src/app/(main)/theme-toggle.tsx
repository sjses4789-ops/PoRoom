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
  // 서버는 <html>에 뭐가 붙어있는지 알 길이 없어 항상 "라이트"로 렌더링
  // 한다. 예전엔 여기서 useState 초기값을 document.documentElement에서
  // 바로 읽어와(다크면 dark=true) 첫 렌더부터 아이콘이 <MoonIcon/>(svg
  // 엘리먼트)으로 나오게 했었는데, 이러면 서버가 그린 첫 화면(텍스트
  // "☀️")과 클라이언트의 첫 렌더(엘리먼트 종류 자체가 다른 <svg>)가
  // 구조적으로 어긋난다 — suppressHydrationWarning은 "속성/텍스트 값"
  // 차이만 눈감아줄 뿐 "엘리먼트 종류가 통째로 바뀌는" 이런 어긋남은
  // 못 가려서, 리액트가 하이드레이션에 통째로 실패(React error #418)
  // 하고 복구하면서 <html>에 있던 dark 클래스까지 날아가 새로고침 직후
  // 다크모드가 라이트로 보이는 진짜 원인이었다. 그래서 첫 렌더는 서버와
  // 무조건 똑같이 "라이트"로 시작하고, 마운트가 끝난 뒤에야(=하이드레이션
  // 대상이 아닌 순수 클라이언트 리렌더) 실제 상태로 맞춘다.
  const [dark, setDark] = useState(false);

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
      // 기본(라이트) 테마: 트랙 전체(달 아이콘 쪽·해 쪽 모두)가 검정.
      // 다크 테마: 트랙 전체가 화이트.
      className="relative flex h-6 w-12 shrink-0 items-center rounded-full border border-neutral-300 bg-black p-0.5 transition dark:border-neutral-600 dark:bg-white"
    >
      <span
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
