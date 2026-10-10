// 임시 측정용 — 함수 실행 지역에서 Supabase까지 왕복 시간을 잰다. 측정 후 바로 삭제한다.
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const times: Record<string, number[]> = { rest: [], auth: [] };
  for (let i = 0; i < 5; i++) {
    let t = performance.now();
    await fetch(`${url}/rest/v1/rooms?select=id&limit=1`, { headers: { apikey: key }, cache: "no-store" }).then((r) => r.text());
    times.rest.push(Math.round(performance.now() - t));
    t = performance.now();
    await fetch(`${url}/auth/v1/health`, { headers: { apikey: key }, cache: "no-store" }).then((r) => r.text());
    times.auth.push(Math.round(performance.now() - t));
  }
  return Response.json({ region: process.env.VERCEL_REGION ?? null, times });
}
