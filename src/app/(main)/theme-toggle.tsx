"use client";

import { useState } from "react";

const STORAGE_KEY = "poroom-theme";

export function ThemeToggle() {
  // an inline script (see root layout) applies the persisted theme to
  // <html> before hydration, so reading it here — rather than syncing via
  // an effect — keeps this in sync with what's already on screen.
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

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
      className="relative flex h-6 w-12 shrink-0 items-center rounded-full border border-neutral-300 bg-gradient-to-r from-white from-50% to-neutral-950 to-50% p-0.5 transition dark:border-neutral-600"
    >
      <span
        suppressHydrationWarning
        className={`flex h-5 w-5 items-center justify-center rounded-full border border-neutral-200 bg-white text-[11px] leading-none shadow transition-transform duration-200 dark:border-neutral-700 ${
          dark ? "translate-x-6" : "translate-x-0"
        }`}
      >
        {dark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
