import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-neutral-100 px-4 py-8 text-xs text-neutral-400 sm:px-6 md:px-8 dark:border-neutral-800 dark:text-neutral-500">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        <p className="text-neutral-500 dark:text-neutral-400">
          PoRoom은 화상회의 없이 함께 집중하는 온라인 뽀모도로 스터디룸
          서비스입니다.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>MADE BY. GGOZIL</span>
          <span aria-hidden>·</span>
          <a
            href="https://pomowriter.oopy.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-600 hover:underline dark:hover:text-neutral-300"
          >
            무료 글쓰기 프로그램 PomoWriter
          </a>
          <span aria-hidden>·</span>
          <Link
            href="/feedback"
            className="hover:text-neutral-600 hover:underline dark:hover:text-neutral-300"
          >
            기능 제안 & 버그 신고
          </Link>
        </div>
        <p className="text-neutral-300 dark:text-neutral-600">
          © {new Date().getFullYear()} GGOZIL. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
