"use server";

import { revalidatePath } from "next/cache";
import { err } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, RecordVisibility, JoinType } from "@/lib/rooms";
import { isRoomTag } from "@/lib/room-tags";
import { purgeRoomChatImages } from "@/lib/chat-image-purge";

export async function updateRoomSettings(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await err("loginRequired") };

  const roomId = String(formData.get("roomId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "neutral");
  const tags = formData.getAll("tags").map(String).filter(isRoomTag);
  const recordVisibility = String(
    formData.get("recordVisibility") ?? "shared"
  ) as RecordVisibility;
  const joinType = String(formData.get("joinType") ?? "invite") as JoinType;

  if (!roomId) return { error: await err("invalidRequest") };
  if (!name) return { error: await err("roomNameRequired") };

  const { error } = await supabase
    .from("rooms")
    .update({
      name,
      color,
      tags,
      record_visibility: recordVisibility,
      join_type: joinType,
    })
    .eq("id", roomId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/room/${roomId}`);
  revalidatePath("/main");
  return null;
}

export async function deleteRoom(roomId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await err("loginRequired") };

  // 방장이 방을 지우기 전에 채팅 사진 파일도 함께 지운다.
  const { data: owned } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", roomId)
    .eq("owner_id", user.id)
    .eq("is_system", false)
    .maybeSingle();
  if (owned) await purgeRoomChatImages(supabase, roomId).catch(() => 0);

  const { error } = await supabase
    .from("rooms")
    .delete()
    .eq("id", roomId)
    .eq("owner_id", user.id)
    .eq("is_system", false);

  if (error) return { error: error.message };

  revalidatePath("/main");
  return null;
}

export async function kickMember(roomId: string, targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === targetUserId) return;

  await supabase
    .from("room_members")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", targetUserId);

  revalidatePath(`/room/${roomId}`);
}

// 차단 = 즉시 강제 퇴장 + 방장이 풀어주기 전까지 재입장 금지(초대코드,
// 오픈방 참여 둘 다 막음 — joinRoomByCode/joinOpenRoom에서 확인).
export async function banMember(roomId: string, targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === targetUserId) return;

  await supabase
    .from("room_bans")
    .upsert(
      { room_id: roomId, user_id: targetUserId, banned_by: user.id },
      { onConflict: "room_id,user_id" }
    );

  await supabase
    .from("room_members")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", targetUserId);

  revalidatePath(`/room/${roomId}`);
}

export async function unbanMember(roomId: string, targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("room_bans")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", targetUserId);

  revalidatePath(`/room/${roomId}`);
}

export type BannedMember = { userId: string; name: string };

export async function getBannedMembers(roomId: string): Promise<BannedMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("room_bans")
    .select("user_id,users(name,email)")
    .eq("room_id", roomId)
    .order("banned_at", { ascending: false })
    .returns<{ user_id: string; users: { name: string | null; email: string } | null }[]>();

  const unknown = await err("unknown");
  return (data ?? []).map((r) => ({
    userId: r.user_id,
    name: r.users?.name || r.users?.email || unknown,
  }));
}

export async function setViceStatus(
  roomId: string,
  targetUserId: string,
  isVice: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("room_members")
    .update({ is_vice: isVice })
    .eq("room_id", roomId)
    .eq("user_id", targetUserId);

  revalidatePath(`/room/${roomId}`);
}

export async function transferOwnership(roomId: string, targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === targetUserId) return;

  await supabase
    .from("rooms")
    .update({ owner_id: targetUserId })
    .eq("id", roomId)
    .eq("owner_id", user.id);

  revalidatePath(`/room/${roomId}`);
}
