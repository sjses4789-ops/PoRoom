"use server";

import { revalidatePath } from "next/cache";
import { err } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { REPORT_MAX_LENGTH, REPORT_MIN_LENGTH } from "@/lib/safety-limits";

// 개인 차단 — 내 화면에서만 그 사람의 채팅(귓속말 포함)을 숨긴다(상대에게는 알려지지 않는다). 방장이
// 방에서 내보내는 "방 차단"(room-admin)과는 별개다.
export async function blockUser(blockedId: string): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await err("loginRequired") };
  if (user.id === blockedId) return { error: await err("blockSelf") };

  const { error } = await supabase
    .from("user_blocks")
    .upsert({ blocker_id: user.id, blocked_id: blockedId }, { onConflict: "blocker_id,blocked_id" });
  if (error) return { error: await err("blockFailed") };
  return null;
}

export async function unblockUser(blockedId: string): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await err("loginRequired") };

  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId);
  if (error) return { error: await err("unblockFailed") };
  return null;
}

// 나를 차단한 사람들의 id(0067) — 그 사람들의 채팅을 내 화면에서 거르는 데만 쓴다. 테이블/함수가 아직 없으면
// 빈 목록으로 본다.
export async function getBlockerIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_blockers");
  return Array.isArray(data) ? (data as string[]) : [];
}

// 신고 — 관리자 페이지에서만 볼 수 있다. 같은 사람을 여러 번 신고해도 각각 기록된다.
export async function reportUser(
  reportedId: string,
  roomId: string | null,
  reason: string
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await err("loginRequired") };
  if (user.id === reportedId) return { error: await err("reportSelf") };

  const text = reason.trim();
  if (text.length < REPORT_MIN_LENGTH) return { error: await err("reportReasonRequired") };
  if (text.length > REPORT_MAX_LENGTH) return { error: await err("reportTooLong", { max: REPORT_MAX_LENGTH }) };

  const { error } = await supabase
    .from("user_reports")
    .insert({ reporter_id: user.id, reported_id: reportedId, room_id: roomId, reason: text });
  if (error) return { error: await err("reportFailed") };
  return { ok: true };
}

// 메시지·사진 신고 — 신고하는 순간의 글과 사진 경로를 함께 보관해서, 나중에 메시지가 지워져도 관리자가 확인할 수 있다.
export async function reportMessage(
  messageId: string,
  roomId: string,
  reason: string
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await err("loginRequired") };

  const text = reason.trim();
  if (text.length < REPORT_MIN_LENGTH) return { error: await err("reportReasonRequired") };
  if (text.length > REPORT_MAX_LENGTH) return { error: await err("reportTooLong", { max: REPORT_MAX_LENGTH }) };

  // 내가 읽을 수 있는 메시지(내 방의 전체 채팅, 나에게 온 귓속말)만 신고할 수 있다.
  const { data: message } = await supabase
    .from("chat_messages")
    .select("id,user_id,room_id,content,image_path")
    .eq("id", messageId)
    .eq("room_id", roomId)
    .maybeSingle<{ id: string; user_id: string; room_id: string; content: string; image_path: string | null }>();
  if (!message) return { error: await err("reportFailed") };
  if (message.user_id === user.id) return { error: await err("reportSelf") };

  const { error } = await supabase.from("user_reports").insert({
    reporter_id: user.id,
    reported_id: message.user_id,
    room_id: roomId,
    reason: text,
    message_id: message.id,
    message_content: message.content,
    message_image_path: message.image_path,
  });
  if (error) return { error: await err("reportFailed") };
  return { ok: true };
}

export async function setReportResolved(id: string, resolved: boolean): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const supabase = await createClient();
  await supabase.from("user_reports").update({ resolved }).eq("id", id);
  revalidatePath("/admin");
}

export async function deleteReport(id: string): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const supabase = await createClient();
  await supabase.from("user_reports").delete().eq("id", id);
  revalidatePath("/admin");
}
