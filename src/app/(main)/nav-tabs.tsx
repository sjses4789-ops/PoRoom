"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";

const TAB_HREFS = ["/main", "/feed", "/compete", "/ranking", "/rest"] as const;
const TAB_KEYS: Record<
  (typeof TAB_HREFS)[number],
  "main" | "feed" | "compete" | "ranking" | "rest"
> = {
  "/main": "main",
  "/feed": "feed",
  "/compete": "compete",
  "/ranking": "ranking",
  "/rest": "rest",
};

export default function NavTabs() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tLogin = useTranslations("login");

  return (
    <nav className="flex items-center gap-1 whitespace-nowrap">
      {TAB_HREFS.map((href) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            }`}
          >
            {t(TAB_KEYS[href])}
          </Link>
        );
      })}
      <ThemeToggle />
      <LanguageSwitcher />
      {/* 베타 서비스 표시 — 마우스를 올리면 안내 문구가 보인다(홈페이지의 BETA 배지와 같은 모양). */}
      <span
        title={tLogin("landing.betaNotice")}
        className="shrink-0 cursor-default rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold tracking-wide text-amber-700 dark:bg-amber-950 dark:text-amber-300"
      >
        BETA
      </span>
    </nav>
  );
}
