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
    </nav>
  );
}
