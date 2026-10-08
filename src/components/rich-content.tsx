import { SanitizedHtml } from "./sanitized-html";

const LOOKS_LIKE_HTML = /<[a-z][\s\S]*>/i;

const RICH_CONTENT_CLASS =
  "text-sm text-neutral-600 dark:text-neutral-300 " +
  "[&_a]:text-sky-600 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-300 " +
  "[&_blockquote]:pl-3 [&_blockquote]:text-neutral-500 dark:[&_blockquote]:border-neutral-600 " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_mark]:rounded-sm [&_mark]:bg-amber-200 dark:[&_mark]:bg-amber-500/40 " +
  "[&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-semibold " +
  "[&_img]:my-1 [&_img]:max-w-full [&_img]:rounded-md " +
  "[&_p]:mb-1 last:[&_p]:mb-0";

// 서식 에디터 도입 전에 작성된 글은 순수 텍스트라 줄바꿈만 살려서 보여주고,
// 그 이후 글은 에디터가 저장한 HTML을 정화(sanitize)해서 그대로 렌더링한다.
// 사용자가 쓴 HTML의 정화는 브라우저에서만 한다(SanitizedHtml) — 서버에서 정화 라이브러리
// (isomorphic-dompurify→jsdom)를 불러오면 서버리스 운영 환경에서 오류가 나 이 컴포넌트를 쓰는
// 영역 전체의 서버 렌더링이 실패했기 때문이다. 서버에는 태그를 뺀 텍스트가 먼저 렌더링된다.
// trusted=true는 우리 코드가 직접 만든(사용자 입력이 아닌) HTML에만 쓴다 — 정화 없이 서버에서
// 그대로 렌더링해서 크롤러가 이미지·서식까지 그대로 읽는다.
export function RichContent({
  content,
  className,
  trusted = false,
}: {
  content: string;
  className?: string;
  trusted?: boolean;
}) {
  if (!LOOKS_LIKE_HTML.test(content)) {
    return <p className={`whitespace-pre-wrap ${className ?? RICH_CONTENT_CLASS}`}>{content}</p>;
  }
  if (trusted) {
    return (
      <div className={className ?? RICH_CONTENT_CLASS} dangerouslySetInnerHTML={{ __html: content }} />
    );
  }
  return <SanitizedHtml content={content} className={className ?? RICH_CONTENT_CLASS} />;
}
