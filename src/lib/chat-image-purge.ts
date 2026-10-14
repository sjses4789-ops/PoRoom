import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const BUCKET = "chat-images";

// 채팅 사진 보관 기간(일). 0071 마이그레이션의 읽기 정책(30일)과 같은 값 — 이 기간이 지나면 사진은 열리지 않고,
// 아래 함수들이 실제 파일을 지운다.
export const CHAT_IMAGE_RETENTION_DAYS = 30;

async function removeInChunks(supabase: Supabase, paths: string[]): Promise<number> {
  let removed = 0;
  for (let i = 0; i < paths.length; i += 100) {
    const chunk = paths.slice(i, i + 100);
    const { data } = await supabase.storage.from(BUCKET).remove(chunk);
    removed += data?.length ?? 0;
  }
  return removed;
}

// 30일이 지난 사진 중 "내가 지울 수 있는" 것(내가 올린 사진, 내가 방장/부방장인 방의 사진, 관리자면 전부)을 지운다.
// 함수가 아직 없거나(0071 실행 전) 실패하면 조용히 넘어간다.
export async function purgeExpiredChatImages(supabase: Supabase, limit = 200): Promise<number> {
  const { data, error } = await supabase.rpc("expired_chat_image_paths", { p_limit: limit });
  if (error || !Array.isArray(data) || data.length === 0) return 0;
  return removeInChunks(supabase, data as string[]);
}

// 계정을 지우기 전에 내가 올린 사진 파일을 모두 지운다.
export async function purgeMyChatImages(supabase: Supabase): Promise<number> {
  const { data, error } = await supabase.rpc("my_chat_image_paths");
  if (error || !Array.isArray(data) || data.length === 0) return 0;
  return removeInChunks(supabase, data as string[]);
}

// 방이 사라지기 전에 그 방의 사진 파일을 모두 지운다(마지막 참여자가 나갈 때, 관리자가 방을 지울 때).
export async function purgeRoomChatImages(supabase: Supabase, roomId: string): Promise<number> {
  const { data, error } = await supabase.rpc("room_chat_image_paths", { p_room: roomId });
  if (error || !Array.isArray(data) || data.length === 0) return 0;
  return removeInChunks(supabase, data as string[]);
}
