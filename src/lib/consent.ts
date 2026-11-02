"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { err } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { recordConsent } from "@/lib/consent-core";
import type { ActionResult } from "@/lib/rooms";

// 이미 가입한 회원이 나이 확인·약관 동의를 처음 한 번 하는 화면(/consent)의 저장 동작.
export async function submitConsent(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await err("loginRequired") };

  const result = await recordConsent(
    supabase,
    user.id,
    String(formData.get("birthDate") ?? ""),
    formData.get("agreeTerms") === "on"
  );
  if ("underage" in result) redirect("/login?underage=1");
  if ("error" in result) return { error: result.error };

  revalidatePath("/", "layout");
  redirect("/main");
}
