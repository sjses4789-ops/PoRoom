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
  revalidatePath("/forum");
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

  revalidatePath("/forum");
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
