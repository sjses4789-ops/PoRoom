"use server";

import { revalidatePath } from "next/cache";
import { err } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/rooms";
import { uploadPostImage } from "@/lib/uploads";
import { purgeExpiredChatImages, purgeRoomChatImages } from "@/lib/chat-image-purge";

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
  if (!user) return { error: await err("loginRequired") };

  const title = String(formData.get("title") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const metric = String(formData.get("metric") ?? "chars") as
    | "chars"
    | "minutes"
    | "achievement";

  if (!title) return { error: await err("eventNameRequired") };
  if (!startDate || !endDate) return { error: await err("periodRequired") };
  if (endDate < startDate) return { error: await err("endBeforeStart") };
  if (!["chars", "minutes", "achievement"].includes(metric)) {
    return { error: await err("invalidMetric") };
  }

  // 공모전 세부 내용(공고 이미지)은 선택 사항 — 안 올려도 이벤트를
  // 만들 수 있다.
  let posterImageUrl: string | null = null;
  const posterImage = formData.get("posterImage");
  if (posterImage instanceof File && posterImage.size > 0) {
    const imgForm = new FormData();
    imgForm.set("file", posterImage);
    const uploadResult = await uploadPostImage(imgForm);
    if ("error" in uploadResult) return { error: uploadResult.error };
    posterImageUrl = uploadResult.url;
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
    poster_image_url: posterImageUrl,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/compete");
  return null;
}

// 관리자가 만든 이벤트(공모전 등)의 이름/기간/측정 방식(글자수·작업시간·달성 여부)/공고 이미지를 나중에 고칠
// 수 있게 한다 — 이전엔 생성 후 수정 방법이 없어 오탈자 하나에도 삭제 후
// 재생성해야 했다.
const METRICS = ["chars", "minutes", "achievement"];

export async function adminUpdateChallengeEvent(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await err("loginRequired") };

  const challengeId = String(formData.get("challengeId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const metric = String(formData.get("metric") ?? "");

  if (!challengeId) return { error: await err("invalidRequest") };
  if (!title) return { error: await err("eventNameRequired") };
  if (!startDate || !endDate) return { error: await err("periodRequired") };
  if (endDate < startDate) return { error: await err("endBeforeStart") };
  if (!METRICS.includes(metric)) return { error: await err("invalidMetric") };

  const patch: Record<string, unknown> = { title, start_date: startDate, end_date: endDate, metric };

  const posterImage = formData.get("posterImage");
  if (posterImage instanceof File && posterImage.size > 0) {
    const imgForm = new FormData();
    imgForm.set("file", posterImage);
    const uploadResult = await uploadPostImage(imgForm);
    if ("error" in uploadResult) return { error: uploadResult.error };
    patch.poster_image_url = uploadResult.url;
  }

  const { error } = await supabase.from("challenges").update(patch).eq("id", challengeId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/compete");
  revalidatePath(`/compete/${challengeId}`);
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
  // 방이 사라지면 채팅 사진 파일도 함께 지운다(관리자 권한으로).
  await purgeRoomChatImages(supabase, roomId).catch(() => 0);
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

  // achieved_at은 "달성한 순서대로" 정렬해야 하는 챌린지 성공자 목록의
  // 기준이 된다 — 체크를 해제하면 다시 null로 되돌려 순서 기준에서 빠진다.
  await supabase
    .from("challenge_participants")
    .update({ achieved, achieved_at: achieved ? new Date().toISOString() : null })
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id);

  revalidatePath(`/compete/${challengeId}`);
}

// 보관 기간(30일)이 지난 채팅 사진 파일을 한 번에 지운다 — 관리자 권한이라 방 구분 없이 전부 지운다
// (미처리 신고에 걸린 사진은 증거라서 남긴다). 한 번에 최대 200개씩이라 개수가 많으면 여러 번 누른다.
export async function adminPurgeExpiredChatImages(): Promise<{ removed: number } | { error: string }> {
  if (!(await isCurrentUserAdmin())) return { error: await err("adminOnly") };
  const supabase = await createClient();
  const removed = await purgeExpiredChatImages(supabase, 200);
  return { removed };
}
