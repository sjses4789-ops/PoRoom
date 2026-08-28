"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/rooms";

export async function setNickname(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const nickname = String(formData.get("nickname") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? "/main");

  if (!nickname) return { error: "닉네임을 입력해주세요." };
  if (nickname.length > 20) return { error: "닉네임은 20자 이내로 입력해주세요." };

  const { error } = await supabase
    .from("users")
    .update({ name: nickname })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

// 출석일 계산에 쓸 시간대를 브라우저에서 감지해 저장한다(TimezoneSync
// 컴포넌트가 호출). 매번 쓰지 않도록 호출 쪽에서 이미 달라졌을 때만
// 부르지만, 여기서도 한 번 더 값이 같으면 건너뛴다.
export async function syncTimezone(timezone: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("users")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle<{ timezone: string | null }>();
  if (existing?.timezone === timezone) return;

  await supabase.from("users").update({ timezone }).eq("id", user.id);
}

export type ProfilePosition = "novelist" | "webtoon";

// [개인] 페이지에서 언제든 바꿀 수 있는 직업 설정 — 웹소설 작가/웹툰
// 작가에 따라 [방] 상태 설정 목록과 [피드]/기록의 작업 단위(글자수/
// 컷수)가 달라진다. onboarding에서 처음 고를 때는 completeOnboarding이
// 닉네임과 함께 한 번에 저장하므로, 이건 그 이후 [개인] 페이지에서
// 다시 바꿀 때만 쓴다.
export async function setPosition(position: ProfilePosition) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("users").update({ position }).eq("id", user.id);

  revalidatePath("/", "layout");
}

// 온보딩 화면 전용 — 닉네임과 직업을 한 번에 저장한다. 캐릭터(프로필
// 사진)는 CharacterPicker가 고르는 즉시 자체적으로 저장하므로 여기
// 폼에는 안 실린다.
export async function completeOnboarding(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const nickname = String(formData.get("nickname") ?? "").trim();
  const position = String(formData.get("position") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/main");

  if (!nickname) return { error: "닉네임을 입력해주세요." };
  if (nickname.length > 20) return { error: "닉네임은 20자 이내로 입력해주세요." };
  if (position !== "novelist" && position !== "webtoon") {
    return { error: "직업을 선택해주세요." };
  }

  const { error } = await supabase
    .from("users")
    .update({ name: nickname, position })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function setCharacter(characterId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("users")
    .update({ character_id: characterId })
    .eq("id", user.id);

  revalidatePath("/", "layout");
}

export async function setChatColor(color: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("users").update({ chat_color: color }).eq("id", user.id);

  revalidatePath("/", "layout");
}
