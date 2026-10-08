// 애드센스 심사용 [휴식]-정보 게시판 예시 글의 인포그래픽 이미지를 만든다.
//   node scripts/gen-demo-rest-images.mjs
// 글 데이터는 src/lib/demo-rest-posts.ts에서 그대로 읽고(순서대로 info-01.png, info-02.png ...),
// 결과는 public/demo/rest/ 에 저장된다. 한글은 Windows의 맑은 고딕으로 그려진다.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { INFO_POSTS } from "../src/lib/demo-rest-posts.ts";

const OUT = path.resolve(import.meta.dirname, "..", "public", "demo", "rest");
fs.mkdirSync(OUT, { recursive: true });

const W = 1200;
const H = 630;
const FONT = "Malgun Gothic, Apple SD Gothic Neo, Noto Sans KR, sans-serif";

const THEME = {
  "팁&노하우": { bg: "#f7ecec", accent: "#c17b7b", ink: "#4a2f2f", label: "팁 & 노하우" },
  공모전: { bg: "#f8f1df", accent: "#b88a2e", ink: "#4a3c17", label: "공모전 · 투고" },
  질문: { bg: "#efebf8", accent: "#7b6bc1", ink: "#2f2a4a", label: "질문" },
  기타: { bg: "#eaf1f4", accent: "#5f8fa3", ink: "#243942", label: "기타 정보" },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// 글자 폭 어림(한글·한자는 1em, 영문·숫자·공백·기호는 0.56em)
const charWidth = (ch) => (/[ᄀ-ᇿ㄰-㆏가-힯一-鿿]/.test(ch) ? 1 : 0.56);
const textWidth = (s, size) => [...s].reduce((sum, ch) => sum + charWidth(ch) * size, 0);

function wrap(text, size, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (textWidth(next, size) <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function render(post, index) {
  const t = THEME[post.info];
  const titleSize = 50;
  const titleLines = wrap(post.title, titleSize, 1000).slice(0, 3);
  const titleTop = 190;
  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="100" y="${titleTop + i * 66}" font-family="${FONT}" font-size="${titleSize}" font-weight="700" fill="${t.ink}">${esc(line)}</text>`
    )
    .join("");

  const gridTop = titleTop + titleLines.length * 66 + 20;
  const cardH = Math.min(96, Math.floor((H - 90 - gridTop) / 2) - 14);
  const points = post.points.slice(0, 4);
  const cards = points
    .map((p, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 100 + col * 510;
      const y = gridTop + row * (cardH + 16);
      return `
        <rect x="${x}" y="${y}" width="490" height="${cardH}" rx="14" fill="#ffffff" opacity="0.92"/>
        <circle cx="${x + 46}" cy="${y + cardH / 2}" r="22" fill="${t.accent}"/>
        <text x="${x + 46}" y="${y + cardH / 2 + 10}" text-anchor="middle" font-family="${FONT}" font-size="26" font-weight="700" fill="#ffffff">${i + 1}</text>
        <text x="${x + 86}" y="${y + cardH / 2 + 11}" font-family="${FONT}" font-size="30" font-weight="600" fill="${t.ink}">${esc(p)}</text>`;
    })
    .join("");

  const chipW = textWidth(t.label, 26) + 48;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${t.bg}"/>
    <circle cx="1130" cy="60" r="150" fill="${t.accent}" opacity="0.10"/>
    <circle cx="1060" cy="580" r="110" fill="${t.accent}" opacity="0.08"/>
    <rect x="100" y="80" width="${chipW}" height="46" rx="23" fill="${t.accent}"/>
    <text x="${100 + chipW / 2}" y="112" text-anchor="middle" font-family="${FONT}" font-size="26" font-weight="700" fill="#ffffff">${esc(t.label)}</text>
    ${titleSvg}
    ${cards}
    <text x="1100" y="${H - 34}" text-anchor="end" font-family="${FONT}" font-size="22" fill="${t.ink}" opacity="0.55">PoRoom · 작가 정보 게시판</text>
  </svg>`;
}

let count = 0;
for (const [i, post] of INFO_POSTS.entries()) {
  const file = path.join(OUT, `info-${String(i + 1).padStart(2, "0")}.png`);
  await sharp(Buffer.from(render(post, i)))
    .png({ palette: true, quality: 90, compressionLevel: 9 })
    .toFile(file);
  count++;
}
console.log(`${count} images -> ${OUT}`);
