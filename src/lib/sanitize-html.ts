import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "span",
  "strong",
  "em",
  "u",
  "s",
  "mark",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "h1",
  "h2",
  "h3",
];

// style은 에디터가 글자색/배경색/정렬에 쓰는 인라인 스타일만 허용한다.
// DOMPurify가 style 속성값 자체도 위험한 패턴(javascript:, expression() 등)을
// 걸러내지만, 한 번 더 "color/background-color/text-align 선언만 남기고
// 나머지는 버리는" 화이트리스트를 직접 적용해 이중으로 막는다.
const SAFE_STYLE_DECLARATION =
  /^(color|background-color|text-align)\s*:\s*[a-z0-9#(),.%\s-]+$/i;

function sanitizeStyleAttr(value: string) {
  const kept = value
    .split(";")
    .map((decl) => decl.trim())
    .filter((decl) => SAFE_STYLE_DECLARATION.test(decl));
  return kept.join("; ");
}

export function sanitizeHtml(dirty: string) {
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
  });

  // 위 화이트리스트로 한 번 더 걸러낸 안전한 style만 남긴다.
  return clean.replace(/style="([^"]*)"/gi, (_match, styleValue: string) => {
    const safe = sanitizeStyleAttr(styleValue.replace(/&quot;/g, '"'));
    return safe ? `style="${safe}"` : "";
  });
}
