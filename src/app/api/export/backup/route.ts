import { NextResponse } from "next/server";
import { buildBackupDump } from "@/lib/export-data";

// 백업 파일을 구글 드라이브에 올리려면 별도 OAuth 스코프 승인을 구글에
// 요청하고 심사를 기다려야 한다 — 그 대신 로컬 다운로드로 대체한다.
export async function GET() {
  const dump = await buildBackupDump();
  if ("error" in dump) {
    return NextResponse.json({ error: dump.error }, { status: 401 });
  }

  const json = JSON.stringify(dump, null, 2);
  const filename = `poroom-backup-${dump.exportedAt.slice(0, 10)}.json`;

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
