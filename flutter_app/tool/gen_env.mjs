// 웹 프로젝트(.env.local)의 "공개" 값(Supabase URL / anon key)만 뽑아 env.json을 만든다.
// anon key는 브라우저에도 공개되는 NEXT_PUBLIC_ 값이라 앱에 들어가도 안전하다 — 서비스 키 등 비공개 값은
// 절대 읽어오지 않는다. 사용: node tool/gen_env.mjs  →  flutter run --dart-define-from-file=env.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.resolve(here, "..", "..", ".env.local");
const wanted = { NEXT_PUBLIC_SUPABASE_URL: "SUPABASE_URL", NEXT_PUBLIC_SUPABASE_ANON_KEY: "SUPABASE_ANON_KEY" };
const out = { WEB_URL: process.env.POROOM_WEB_URL ?? "https://poroom.kr" };

for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && wanted[m[1]]) out[wanted[m[1]]] = m[2].replace(/^["']|["']$/g, "");
}
if (!out.SUPABASE_URL || !out.SUPABASE_ANON_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 .env.local 에서 찾지 못했어요.");
  process.exit(1);
}
fs.writeFileSync(path.resolve(here, "..", "env.json"), JSON.stringify(out, null, 2) + "\n");
console.log("env.json 생성 완료 (키 이름만):", Object.keys(out).join(", "));
