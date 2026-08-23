"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const TABS = [
  { href: "/forum", label: "포룸" },
  { href: "/compete", label: "대결" },
  { href: "/ranking", label: "랭킹" },
  { href: "/me", label: "개인" },
];

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 whitespace-nowrap">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
      <ThemeToggle />
    </nav>
  );
}
