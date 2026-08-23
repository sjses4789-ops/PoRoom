import { NextResponse } from "next/server";
import { leaveRoom } from "@/lib/rooms";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const roomId = typeof body?.roomId === "string" ? body.roomId : null;
  if (!roomId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await leaveRoom(roomId);
  return NextResponse.json({ ok: true });
}
