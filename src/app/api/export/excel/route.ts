import { NextResponse } from "next/server";
import { buildExportBundle } from "@/lib/export-data";
import { buildExportWorkbook } from "@/lib/export-excel";

export async function GET() {
  const bundle = await buildExportBundle();
  if ("error" in bundle) {
    return NextResponse.json({ error: bundle.error }, { status: 401 });
  }

  const buffer = await buildExportWorkbook(bundle);
  const filename = `poroom-export-${bundle.today}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
