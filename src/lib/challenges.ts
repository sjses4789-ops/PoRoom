"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/rooms";
import { SYSTEM_CHALLENGE_CAPACITY, ensureChallengeTodos } from "@/lib/system-challenges";
import { todayKst } from "@/lib/time";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export type ChallengeMetric = "chars" | "minutes";
export type ChallengeVisibility = "open" | "private";

export async function createChallenge(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const title = String(formData.get("title") ?? "").trim();
  const metric = String(formData.get("metric") ?? "chars") as ChallengeMetric;
  const visibility = String(
    formData.get("visibility") ?? "open"
  ) as ChallengeVisibility;
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  if (!title) return { error: "대결 이름을 입력해주세요." };
  if (!["chars", "minutes"].includes(metric)) {
    return { error: "잘못된 기준입니다." };
  }
  if (!["open", "private"].includes(visibility)) {
    return { error: "잘못된 공개 설정입니다." };
  }
  if (!startDate || !endDate) return { error: "기간을 선택해주세요." };
  if (endDate < startDate) return { error: "종료일이 시작일보다 빠릅니다." };

  let challengeId: string | null = null;
  const wantsCode = visibility === "private";

  for (let attempt = 0; attempt < 5 && !challengeId; attempt++) {
    const { data: challenge, error } = await supabase
      .from("challenges")
      .insert({
        title,
        type: "user",
        metric,
        visibility,
        invite_code: wantsCode ? generateInviteCode() : null,
        start_date: startDate,
        end_date: endDate,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      if (wantsCode && error.code === "23505") continue; // code collision, retry
      return { error: error.message };
    }
    challengeId = challenge.id;
  }

  if (!challengeId) {
    return { error: "대결 생성에 실패했습니다. 다시 시도해주세요." };
  }

  await supabase
    .from("challenge_participants")
    .insert({ challenge_id: challengeId, user_id: user.id });

  revalidatePath("/compete");
  redirect("/compete");
}

export type JoinChallengeResult = { error: string } | { ok: true };

export async function joinChallenge(challengeId: string): Promise<JoinChallengeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id,end_date,kind")
    .eq("id", challengeId)
    .maybeSingle<{ id: string; end_date: string; kind: string | null }>();

  if (!challenge) return { error: "존재하지 않는 대결입니다." };

  const today = todayKst();
  if (today > challenge.end_date) return { error: "이미 종료된 대결입니다." };

  if (challenge.kind) {
    const { count } = await supabase
      .from("challenge_participants")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", challengeId);
    if ((count ?? 0) >= SYSTEM_CHALLENGE_CAPACITY) {
      return { error: `정원(${SYSTEM_CHALLENGE_CAPACITY}명)이 가득 찼습니다.` };
    }
  }

  const { error } = await supabase
    .from("challenge_participants")
    .insert({ challenge_id: challengeId, user_id: user.id });

  if (error && error.code !== "23505") return { error: error.message };

  if (challenge.kind) {
    await ensureChallengeTodos(supabase, user.id);
    revalidatePath("/main");
  }

  revalidatePath("/compete");
  return { ok: true };
}

export async function joinChallengeByCode(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  if (!code) return { error: "초대코드를 입력해주세요." };

  const { data: challenge, error } = await supabase
    .from("challenges")
    .select("id,end_date")
    .eq("invite_code", code)
    .maybeSingle<{ id: string; end_date: string }>();

  if (error) return { error: error.message };
  if (!challenge) return { error: "존재하지 않는 초대코드입니다." };

  const today = todayKst();
  if (today > challenge.end_date) return { error: "이미 종료된 대결입니다." };

  const { error: joinError } = await supabase
    .from("challenge_participants")
    .insert({ challenge_id: challenge.id, user_id: user.id });

  if (joinError && joinError.code !== "23505") {
    return { error: joinError.message };
  }

  revalidatePath("/compete");
  redirect("/compete");
}
