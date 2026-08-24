"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/rooms";

// 관리자 여부는 항상 서버에서(클라이언트 번들에 노출되지 않는 곳에서)
// DB의 users.is_admin 플래그로 판단한다 — 이메일을 코드에 하드코딩해
// 비교하지 않는 이유는, RLS도 같은 플래그를 보고 있어서 UI 체크와
// DB 권한이 항상 같은 소스를 보게 하기 위함.
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle<{ is_admin: boolean }>();

  return data?.is_admin ?? false;
}

// 출판사 비정기 공모전/투고 기간처럼 짧게 열리는 이벤트용 임시 챌린지.
// is_admin_event=true는 RLS insert 정책이 관리자만 켤 수 있게 막아준다.
export async function createAdminChallengeEvent(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const title = String(formData.get("title") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const metric = String(formData.get("metric") ?? "chars") as
    | "chars"
    | "minutes"
    | "achievement";

  if (!title) return { error: "이벤트 이름을 입력해주세요." };
  if (!startDate || !endDate) return { error: "기간을 선택해주세요." };
  if (endDate < startDate) return { error: "종료일이 시작일보다 빠릅니다." };
  if (!["chars", "minutes", "achievement"].includes(metric)) {
    return { error: "잘못된 기준입니다." };
  }

  const { error } = await supabase.from("challenges").insert({
    title,
    type: "user",
    metric,
    visibility: "open",
    start_date: startDate,
    end_date: endDate,
    started_at: new Date().toISOString(),
    duration_days: 1,
    is_admin_event: true,
    created_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/compete");
  return null;
}

export async function adminDeleteChallenge(challengeId: string) {
  const supabase = await createClient();
  await supabase.from("challenges").delete().eq("id", challengeId);
  revalidatePath("/admin");
  revalidatePath("/compete");
}

export async function adminDeleteRoom(roomId: string) {
  const supabase = await createClient();
  await supabase.from("rooms").delete().eq("id", roomId);
  revalidatePath("/admin");
  revalidatePath("/main");
}

// 서비스 키가 없어서 Supabase Auth 자체의 계정 정지 기능은 못 쓴다 —
// 대신 우리 쪽 users.is_banned 플래그를 관리자가 켜고, (main)
// layout.tsx가 매 요청마다 이 값을 확인해서 켜져 있으면 즉시
// 로그아웃시키는 방식으로 "다시 로그인해도 못 들어오게" 막는다.
export async function adminSetBanned(userId: string, banned: boolean) {
  const supabase = await createClient();
  await supabase.from("users").update({ is_banned: banned }).eq("id", userId);
  revalidatePath("/admin");
}

// 관리자가 만든 "달성 여부" 챌린지에서, 참가자 본인이 달성 완료를
// 체크한다(초단 완고 챌린지의 자가 신고 체크와 같은 패턴).
export async function setChallengeAchieved(challengeId: string, achieved: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("challenge_participants")
    .update({ achieved })
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id);

  revalidatePath(`/compete/${challengeId}`);
}
