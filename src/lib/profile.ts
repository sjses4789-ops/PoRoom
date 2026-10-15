"use server";

import { redirect } from "next/navigation";
import { err } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/rooms";
import { ensureMyProfile } from "@/lib/ensure-profile";
import { dateInTimezone } from "@/lib/time";

// 폼으로 받은 돌아갈 주소는 이 사이트 안의 경로("/..."로 시작, "//"나 "/\" 제외)만 허용한다 — 바깥 주소로 보내는 데 쓰이지 못하게.
function safeRedirectPath(path: string): string {
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path : "/main";
}

export async function setNickname(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await err("loginRequired") };

  const nickname = String(formData.get("nickname") ?? "").trim();
  const redirectTo = safeRedirectPath(String(formData.get("redirectTo") ?? "/main"));

  if (!nickname) return { error: await err("nicknameRequired") };
  if (nickname.length > 20) return { error: await err("nickname20") };

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

// poroom에 들어와 있으면 그날 출석 — 날짜는 각자 시간대의 자정 기준이다(timezone은 브라우저가 알려 주고, 없으면 저장된 값,
// 그것도 없으면 한국 시간). 같은 날 여러 번 불러도 한 줄만 남는다. 테이블(0075)이 없으면 조용히 넘어간다.
export async function markAttendanceToday(timezone?: string | null): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  let tz = timezone && isValidTimezone(timezone) ? timezone : null;
  if (!tz) {
    const { data } = await supabase.from("users").select("timezone").eq("id", user.id).maybeSingle<{ timezone: string | null }>();
    tz = data?.timezone ?? null;
  }
  const day = dateInTimezone(new Date(), tz);
  await supabase
    .from("attendance_days")
    .upsert({ user_id: user.id, day }, { onConflict: "user_id,day", ignoreDuplicates: true });
}

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
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
  if (!user) return { error: await err("loginRequired") };

  const nickname = String(formData.get("nickname") ?? "").trim();
  const position = String(formData.get("position") ?? "");
  const redirectTo = safeRedirectPath(String(formData.get("redirectTo") ?? "/main"));

  if (!nickname) return { error: await err("nicknameRequired") };
  if (nickname.length > 20) return { error: await err("nickname20") };
  if (position !== "novelist" && position !== "webtoon") {
    return { error: await err("positionSelect") };
  }

  // 프로필 행이 없는 계정(탈퇴 뒤 재가입)이면 먼저 만든다 — 없으면 아래 저장이 0건이어도 오류 없이 지나가 화면만 새로 고쳐진다.
  await ensureMyProfile(supabase);
  const { data: saved, error } = await supabase
    .from("users")
    .update({ name: nickname, position })
    .eq("id", user.id)
    .select("id");

  if (error) return { error: error.message };
  if (!saved || saved.length === 0) return { error: await err("profileSaveFailed") };

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
