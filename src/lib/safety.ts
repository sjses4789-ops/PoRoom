"use server";

import { revalidatePath } from "next/cache";
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
  if (!user) return { error: "로그인이 필요합니다." };
  if (user.id === blockedId) return { error: "자기 자신은 차단할 수 없어요." };

  const { error } = await supabase
    .from("user_blocks")
    .upsert({ blocker_id: user.id, blocked_id: blockedId }, { onConflict: "blocker_id,blocked_id" });
  if (error) return { error: "차단하지 못했어요. 잠시 후 다시 시도해 주세요." };
  return null;
}

export async function unblockUser(blockedId: string): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId);
  if (error) return { error: "차단을 풀지 못했어요. 잠시 후 다시 시도해 주세요." };
  return null;
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
  if (!user) return { error: "로그인이 필요합니다." };
  if (user.id === reportedId) return { error: "자기 자신은 신고할 수 없어요." };

  const text = reason.trim();
  if (text.length < REPORT_MIN_LENGTH) return { error: "신고 이유를 적어 주세요." };
  if (text.length > REPORT_MAX_LENGTH) return { error: `신고 이유는 ${REPORT_MAX_LENGTH}자 이하로 적어 주세요.` };

  const { error } = await supabase
    .from("user_reports")
    .insert({ reporter_id: user.id, reported_id: reportedId, room_id: roomId, reason: text });
  if (error) return { error: "신고를 접수하지 못했어요. 잠시 후 다시 시도해 주세요." };
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
