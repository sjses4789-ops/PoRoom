"use client";

import type { ReactNode } from "react";

// 파일 다운로드(Content-Disposition: attachment 응답)를 시작하는 버튼. 다운로드 주소는 페이지가 아니라
// API 응답이라 next/link로 이동시키면 안 되고, 일반 <a>는 린트(no-html-link-for-pages)가 막는다 —
// 그래서 주소로 직접 이동시키는 버튼으로 만든다(첨부 응답이라 화면은 그대로 유지된다).
export function DownloadLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={() => window.location.assign(href)} className={className}>
      {children}
    </button>
  );
}
