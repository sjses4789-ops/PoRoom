import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 채팅 사진 자동 삭제 — 매일 한 번 Vercel Cron(vercel.json)이 이 주소를 부른다.
// 올린 지 30일이 지난 사진 파일을 서비스 키로 지운다(서비스 키는 RLS를 건너뛰는 서버 전용 키라 브라우저로 나가면 안 된다).
//
// 필요한 환경변수(Vercel → Settings → Environment Variables):
//   SUPABASE_SERVICE_ROLE_KEY — Supabase 대시보드의 service_role(또는 secret) 키. NEXT_PUBLIC_ 접두사를 붙이면 안 된다.
//   CRON_SECRET               — 아무 긴 무작위 문자열. Vercel Cron이 "Authorization: Bearer <CRON_SECRET>"로 불러 주고,
//                               여기서 그 값이 맞는 요청만 받는다(주소를 아는 아무나 못 돌리게).
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "chat-images";
const BATCH = 200;
const MAX_BATCHES = 10;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is not set" }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  let removed = 0;
  for (let i = 0; i < MAX_BATCHES; i++) {
    const { data, error } = await supabase.rpc("service_expired_chat_image_paths", { p_limit: BATCH });
    if (error) return NextResponse.json({ ok: false, error: error.message, removed }, { status: 500 });
    const paths = (data ?? []) as string[];
    if (paths.length === 0) break;
    const { data: done, error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
    if (removeError) return NextResponse.json({ ok: false, error: removeError.message, removed }, { status: 500 });
    removed += done?.length ?? 0;
    if (paths.length < BATCH) break;
  }
  return NextResponse.json({ ok: true, removed });
}
