"use client";

import { useEffect, useState } from "react";

// 사용자가 쓴 HTML을 정화(sanitize)해서 보여주는 컴포넌트 — 정화는 브라우저에서만 한다.
// 서버에서 정화 라이브러리(isomorphic-dompurify → jsdom)를 불러오면 서버리스 운영 환경에서
// 오류가 나서 이 컴포넌트를 쓰는 영역 전체의 서버 렌더링이 실패하기 때문이다. 서버(와 정화가
// 끝나기 전)에는 태그를 뺀 텍스트를 먼저 보여주므로, 크롤러도 글 내용을 읽을 수 있다.
function toPlainText(html: string) {
  return html
    .replace(/<(br|\/p|\/li|\/h[1-3]|\/blockquote)\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

export function SanitizedHtml({ content, className }: { content: string; className?: string }) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    import("@/lib/sanitize-html").then((m) => {
      if (alive) setHtml(m.sanitizeHtml(content));
    });
    return () => {
      alive = false;
    };
  }, [content]);

  if (html === null) {
    return <div className={`whitespace-pre-wrap ${className ?? ""}`}>{toPlainText(content)}</div>;
  }
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
