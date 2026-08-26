import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import NavTabs from "../(main)/nav-tabs";

// 로그인 없이도 (main) 레이아웃의 헤더(=테마 토글이 실제로 들어있는 곳)를
// 그대로 재현해서 다크모드 관련 버그를 실제 배포 환경에서도 테스트할 수
// 있게 만든 내부 QA 전용 페이지. 어디에도 링크하지 않고, 검색엔진에는
// robots.ts에서 별도로 막아뒀다 — URL을 아는 사람만 접근 가능.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "QA",
};

export default function QaPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <header className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between md:px-8 md:py-4 dark:border-neutral-800">
        <div className="flex items-center justify-between gap-4 md:justify-start md:gap-8">
          <Link href="/main" className="flex shrink-0 items-center gap-2">
            <Image src="/poroom-icon.png" alt="" width={24} height={24} />
            <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
              PoRoom
            </span>
          </Link>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:mx-0 md:flex-1 md:px-0">
          <NavTabs />
        </div>
      </header>
      <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
          로그인 없이 접근 가능한 내부 QA 페이지입니다. 위 네비게이션의 테마
          토글로 다크모드를 켠 뒤 새로고침해서 테마가 유지되는지 확인하세요.
        </div>
      </main>
    </div>
  );
}
