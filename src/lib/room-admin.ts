"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, RecordVisibility, JoinType } from "@/lib/rooms";
import { isRoomTag } from "@/lib/room-tags";

export async function updateRoomSettings(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const roomId = String(formData.get("roomId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "neutral");
  const tags = formData.getAll("tags").map(String).filter(isRoomTag);
  const recordVisibility = String(
    formData.get("recordVisibility") ?? "shared"
  ) as RecordVisibility;
  const joinType = String(formData.get("joinType") ?? "invite") as JoinType;

  if (!roomId) return { error: "잘못된 요청입니다." };
  if (!name) return { error: "방 이름을 입력해주세요." };

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
  if (!user) return { error: "로그인이 필요합니다." };

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

  return (data ?? []).map((r) => ({
    userId: r.user_id,
    name: r.users?.name || r.users?.email || "알 수 없음",
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
