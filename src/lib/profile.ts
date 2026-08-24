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
