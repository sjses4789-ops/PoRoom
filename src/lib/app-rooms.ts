"use server";

import { createRoom, joinRoomByCode } from "@/lib/rooms";

// 모바일·데스크탑 앱이 부르는 방 만들기/초대코드 입장 — 웹의 서버 액션(createRoom, joinRoomByCode)을 그대로 쓰되,
// 이 액션들은 성공하면 방 화면으로 redirect()를 던지므로(웹은 그걸로 이동한다) 앱이 방 id를 받을 수 있게 그 이동 주소에서 꺼내 돌려준다.

type AppRoomResult = { error: string } | { roomId: string };

function roomIdFromRedirect(e: unknown): string | null {
  if (typeof e !== "object" || e === null || !("digest" in e)) return null;
  const digest = String((e as { digest: unknown }).digest);
  if (!digest.startsWith("NEXT_REDIRECT")) return null;
  const match = /\/room\/([0-9a-fA-F-]{36})/.exec(digest);
  return match ? match[1] : null;
}

export async function createRoomForApp(input: {
  name: string;
  color: string;
  tags: string[];
  joinType: "invite" | "open";
  targetPosition: "novelist" | "webtoon" | "";
  recordVisibility: "shared" | "private" | "free";
  nicknameId?: string | null;
}): Promise<AppRoomResult> {
  const formData = new FormData();
  formData.set("name", input.name);
  formData.set("color", input.color);
  for (const tag of input.tags) formData.append("tags", tag);
  formData.set("joinType", input.joinType);
  formData.set("targetPosition", input.targetPosition);
  formData.set("recordVisibility", input.recordVisibility);
  formData.set("nicknameId", input.nicknameId ?? "");
  try {
    const result = await createRoom(null, formData);
    return result && "error" in result ? { error: result.error } : { error: "unknown" };
  } catch (e) {
    const roomId = roomIdFromRedirect(e);
    if (roomId) return { roomId };
    throw e;
  }
}

export async function joinRoomByCodeForApp(code: string, nicknameId?: string | null): Promise<AppRoomResult> {
  const formData = new FormData();
  formData.set("code", code);
  formData.set("nicknameId", nicknameId ?? "");
  try {
    const result = await joinRoomByCode(null, formData);
    return result && "error" in result ? { error: result.error } : { error: "unknown" };
  } catch (e) {
    const roomId = roomIdFromRedirect(e);
    if (roomId) return { roomId };
    throw e;
  }
}
