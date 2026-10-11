import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDE_LANGS, GUIDE_UI, isGuideLang } from "@/content/guides-i18n";

export function generateStaticParams() {
  return GUIDE_LANGS.map((lang) => ({ lang }));
}

// 영어·일본어 공개 정보 페이지(/en/guide, /ja/guide ...)의 공통 틀 — 한국어 (public) 레이아웃과 같은
// 모양이고 문구만 해당 언어다.
export default async function IntlLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isGuideLang(lang)) notFound();
  const ui = GUIDE_UI[lang];
  const base = `/${lang}`;
  const nav = [
    { href: `${base}/guide`, label: ui.nav.guide },
    { href: `${base}/about`, label: ui.nav.about },
    { href: `${base}/faq`, label: ui.nav.faq },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="border-b border-neutral-100 dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href={base} className="flex items-center gap-2">
            <Image src="/poroom-icon.png" alt="" width={24} height={24} />
            <span className="text-sm font-semibold tracking-tight">PoRoom</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-neutral-600 dark:text-neutral-300">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-neutral-900 hover:underline dark:hover:text-white">
                {item.label}
              </Link>
            ))}
            <Link
              href="/main"
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {ui.nav.enter}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">{children}</main>

      <footer className="border-t border-neutral-100 px-4 py-8 text-xs text-neutral-500 sm:px-6 dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:underline">
                {item.label}
              </Link>
            ))}
            <Link href="/privacy" className="hover:underline">
              {ui.nav.privacy}
            </Link>
          </div>
          <p>MADE BY. GGOZIL · © {new Date().getFullYear()} GGOZIL. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
