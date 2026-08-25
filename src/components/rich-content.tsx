import { sanitizeHtml } from "@/lib/sanitize-html";

const LOOKS_LIKE_HTML = /<[a-z][\s\S]*>/i;

const RICH_CONTENT_CLASS =
  "text-sm text-neutral-600 dark:text-neutral-300 " +
  "[&_a]:text-sky-600 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-300 " +
  "[&_blockquote]:pl-3 [&_blockquote]:text-neutral-500 dark:[&_blockquote]:border-neutral-600 " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_mark]:rounded-sm [&_mark]:bg-amber-200 dark:[&_mark]:bg-amber-500/40 " +
  "[&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-semibold " +
  "[&_p]:mb-1 last:[&_p]:mb-0";

// 서식 에디터 도입 전에 작성된 글은 순수 텍스트라 줄바꿈만 살려서 보여주고,
// 그 이후 글은 에디터가 저장한 HTML을 정화(sanitize)해서 그대로 렌더링한다.
export function RichContent({ content, className }: { content: string; className?: string }) {
  if (!LOOKS_LIKE_HTML.test(content)) {
    return <p className={`whitespace-pre-wrap ${className ?? RICH_CONTENT_CLASS}`}>{content}</p>;
  }
  return (
    <div
      className={className ?? RICH_CONTENT_CLASS}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
    />
  );
}
