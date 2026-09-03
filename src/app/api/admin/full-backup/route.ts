import { NextResponse } from "next/server";
import { buildFullBackup } from "@/lib/full-backup";

// 관리자 전용 전체 데이터 백업 다운로드. buildFullBackup 내부에서 관리자
// 여부를 다시 확인하므로, 관리자가 아니면 401로 거부된다.
export async function GET() {
  const dump = await buildFullBackup();
  if ("error" in dump) {
    return NextResponse.json({ error: dump.error }, { status: 401 });
  }

  const json = JSON.stringify(dump, null, 2);
  const filename = `poroom-full-backup-${dump.exportedAt.slice(0, 10)}.json`;

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
