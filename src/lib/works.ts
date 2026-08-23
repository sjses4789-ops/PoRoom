"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

export type CreateWorkResult = { error: string } | { id: string; title: string };

export async function createWork(title: string): Promise<CreateWorkResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const trimmed = title.trim();
  if (!trimmed) return { error: "작품 이름을 입력해주세요." };

  const { data, error } = await supabase
    .from("works")
    .insert({ user_id: user.id, title: trimmed })
    .select("id,title")
    .single();

  if (error || !data) return { error: error?.message ?? "작품 추가에 실패했습니다." };

  revalidatePath("/room/[id]", "page");
  return { id: data.id, title: data.title };
}

export async function deleteWork(workId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("works").delete().eq("id", workId).eq("user_id", user.id);
  revalidatePath("/room/[id]", "page");
}

export async function recordWorkChars(
  workId: string,
  delta: number,
  currentChars: number,
  dateOverride?: string
) {
  if (delta === 0) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const date = dateOverride ?? todayUtc();
  const { data: existing } = await supabase
    .from("work_records")
    .select("id,chars")
    .eq("work_id", workId)
    .eq("record_date", date)
    .maybeSingle<{ id: string; chars: number }>();

  if (existing) {
    await supabase
      .from("work_records")
      .update({
        chars: existing.chars + delta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("work_records").insert({
      work_id: workId,
      user_id: user.id,
      record_date: date,
      chars: delta,
    });
  }

  // 입력 1회당 하나의 행 — "입력 기준" 그래프(같은 날짜라도 1회/2회
  // 추가 변동을 각각 점으로 표시)를 위해 개별 변동 내역을 남긴다.
  await supabase.from("work_record_entries").insert({
    work_id: workId,
    user_id: user.id,
    delta,
    current_chars: currentChars,
  });

  await supabase
    .from("works")
    .update({ last_current_chars: currentChars })
    .eq("id", workId)
    .eq("user_id", user.id);

  revalidatePath("/me");
}
