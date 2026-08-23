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

  const apply = (next: boolean) => {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  };

  return (
    <div
      suppressHydrationWarning
      className="flex shrink-0 items-center rounded-full border border-neutral-200 p-0.5 text-[12px] font-medium dark:border-neutral-700"
    >
      <button
        type="button"
        onClick={() => apply(false)}
        aria-pressed={!dark}
        suppressHydrationWarning
        className={`rounded-full px-2 py-0.5 transition ${
          !dark
            ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
            : "text-neutral-500 dark:text-neutral-400"
        }`}
      >
        기본
      </button>
      <button
        type="button"
        onClick={() => apply(true)}
        aria-pressed={dark}
        suppressHydrationWarning
        className={`rounded-full px-2 py-0.5 transition ${
          dark
            ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
            : "text-neutral-500 dark:text-neutral-400"
        }`}
      >
        다크
      </button>
    </div>
  );
}
