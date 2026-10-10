// public/ 의 큰 PNG를 눈에 띄는 화질 차이 없이 줄인다(256색 팔레트 PNG).
//   node scripts/optimize-images.mjs
// 캐릭터 160장(각 100KB 이상)과 로고가 대상이다. 더 작아질 때만 덮어쓰므로 여러 번 실행해도 안전하다.
// 원본 일러스트는 저장소 밖(character/ 폴더)에 그대로 있다.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..", "public");
const targets = [
  ...fs
    .readdirSync(path.join(root, "characters"))
    .filter((f) => f.endsWith(".png"))
    .map((f) => ({ file: path.join(root, "characters", f) })),
  // 홈페이지 로고는 화면에서 선언한 크기(1254px)로 줄여 둔다.
  { file: path.join(root, "poroom-logo.png"), width: 1254 },
];

let before = 0;
let after = 0;
for (const { file, width } of targets) {
  const original = fs.readFileSync(file);
  let img = sharp(original);
  if (width) img = img.resize({ width, withoutEnlargement: true });
  const out = await img.png({ palette: true, quality: 90, effort: 10, colours: 256 }).toBuffer();
  before += original.length;
  if (out.length < original.length) {
    fs.writeFileSync(file, out);
    after += out.length;
  } else {
    after += original.length;
  }
}
console.log(`${targets.length} files: ${(before / 1048576).toFixed(1)}MB -> ${(after / 1048576).toFixed(1)}MB`);
