import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 브라우저에서 난 화면 오류를 받아 client_errors(0076)에 남긴다 — 관리자 페이지 [지표] 탭에서 본다.
// 로그인하지 않은 방문자의 오류도 받아야 해서 서비스 키로 쓰되, 남용을 막으려고 길이를 자르고 IP별로 횟수를 제한한다.
export const dynamic = "force-dynamic";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, { count: number; resetAt: number }>();

function limited(ip: string): boolean {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
  const cur = hits.get(ip);
  if (!cur || cur.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  cur.count += 1;
  return cur.count > MAX_PER_WINDOW;
}

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : null);

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ ok: false }, { status: 429 });

  let body: { message?: unknown; stack?: unknown; url?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const message = clip(body.message, 500);
  if (!message) return NextResponse.json({ ok: false }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false }, { status: 503 });

  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // 로그인 정보를 못 읽어도 오류 자체는 남긴다.
  }

  await admin.from("client_errors").insert({
    user_id: userId,
    message,
    stack: clip(body.stack, 4000),
    url: clip(body.url, 500),
    user_agent: clip(request.headers.get("user-agent"), 300),
  });
  return NextResponse.json({ ok: true });
}
