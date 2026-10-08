// docs/info-board-posts-20.md → src/lib/admin-info-posts.ts (게시판이 그리는 HTML로 변환)
//   node scripts/build-admin-info-posts.mjs
//
// 게시 전에 두 가지를 정리한다:
//  1) "[직접 경험 추가…]" 안내 줄(운영자에게 쓴 메모)은 공개 글에 나가면 안 되므로 뺀다.
//  2) 질문형 글(13~16번)에서 운영자가 실제로 하지 않은 일을 한 것처럼 쓴 대목(시도하는 방법, 겪는 어려움,
//     "정리 글을 올리겠다"는 약속 등)은 뺀다 — 본인 이름으로 나가는 글에 지어낸 경험·약속을 넣지 않기 위해서다.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const md = fs.readFileSync(path.join(root, "docs", "info-board-posts-20.md"), "utf8");

const REMOVE_SECTIONS_BY_POST = {
  13: [/제가 정리하려는 방식/],
  14: [/현재 제가 시도하는 방법들/, /제가 느끼는 가장 큰 불안/, /답변을 정리하는 방식/],
  15: [/제가 정리하려는 것/, /제가 찾고 있는 관계의 모습/, /지금 시도해 보려는 계획/],
  16: [/제가 겪는 어려움/, /정리 계획/, /휴식이 작업에 도움이 되었다고 느낀 순간/],
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) =>
  esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");

function removeSections(lines, patterns) {
  const out = [];
  let skipping = false;
  for (const line of lines) {
    const bold = /^\*\*(.+)\*\*\s*$/.exec(line.trim());
    if (bold) skipping = patterns.some((p) => p.test(bold[1]));
    if (!skipping) out.push(line);
  }
  return out;
}

function toHtml(lines) {
  const html = [];
  let para = [];
  let list = null; // { type: "ul" | "ol", items: string[] }
  const flushPara = () => {
    if (para.length) html.push(`<p>${para.map(inline).join("<br>")}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) html.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.type}>`);
    list = null;
  };
  let inFence = false;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      flushPara();
      flushList();
      continue;
    }
    if (inFence) {
      // 코드 블록(기록 양식 예시)은 줄 단위 문단으로 보여 준다.
      if (line.trim()) html.push(`<p>${esc(line)}</p>`);
      continue;
    }
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    const check = /^- \[ \] (.*)$/.exec(line);
    const bullet = /^- (.*)$/.exec(line);
    const numbered = /^\d+\. (.*)$/.exec(line);
    if (check || bullet) {
      flushPara();
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(check ? `☐ ${check[1]}` : bullet[1]);
    } else if (numbered) {
      flushPara();
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(numbered[1]);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return html.join("");
}

const blocks = md.split(/\n---\n/).slice(1);
const posts = [];
for (const block of blocks) {
  const m = /^\s*## (\d+)\. \[([^\]]+)\] ([^\n]+)\n([\s\S]*)$/.exec(block);
  if (!m) continue;
  const [, num, category, title, rest] = m;
  let lines = rest.split("\n").filter((l) => !l.trim().startsWith("[직접 경험 추가"));
  const patterns = REMOVE_SECTIONS_BY_POST[Number(num)];
  if (patterns) lines = removeSections(lines, patterns);
  const html = toHtml(lines);
  posts.push({ no: Number(num), infoCategory: category, title: title.trim(), html });
}

if (posts.length !== 20) throw new Error(`expected 20 posts, got ${posts.length}`);

const out = `// 자동 생성 파일 — scripts/build-admin-info-posts.mjs 로 docs/info-board-posts-20.md에서 만든다.
// 관리자 페이지의 "정보 게시판 글 게시" 버튼이 이 데이터를 운영자 계정으로 게시한다.
export type AdminInfoPost = {
  no: number;
  infoCategory: "팁&노하우" | "공모전" | "질문" | "기타";
  title: string;
  html: string;
};

export const ADMIN_INFO_POSTS: AdminInfoPost[] = ${JSON.stringify(posts, null, 2)};
`;
fs.writeFileSync(path.join(root, "src", "lib", "admin-info-posts.ts"), out);
console.log(posts.map((p) => `${p.no}:${p.html.replace(/<[^>]+>/g, "").length}`).join(" "));
