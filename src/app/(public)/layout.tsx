import Image from "next/image";
import Link from "next/link";

// 로그인 없이 누구나 읽는 공개 정보 페이지(가이드·소개·자주 묻는 질문)의 공통 틀.
// 서비스 본체((main) 레이아웃)와 달리 타이머·실시간 연결 같은 것은 싣지 않는다.
const NAV = [
  { href: "/guide", label: "작가 가이드" },
  { href: "/about", label: "서비스 소개" },
  { href: "/faq", label: "자주 묻는 질문" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="border-b border-neutral-100 dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/poroom-icon.png" alt="" width={24} height={24} />
            <span className="text-sm font-semibold tracking-tight">PoRoom</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-neutral-600 dark:text-neutral-300">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-neutral-900 hover:underline dark:hover:text-white">
                {item.label}
              </Link>
            ))}
            <Link
              href="/main"
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              포룸 입장하기
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">{children}</main>

      <footer className="border-t border-neutral-100 px-4 py-8 text-xs text-neutral-500 sm:px-6 dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:underline">
                {item.label}
              </Link>
            ))}
            <Link href="/privacy" className="hover:underline">
              개인정보처리방침
            </Link>
          </div>
          <p>MADE BY. GGOZIL · © {new Date().getFullYear()} GGOZIL. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
