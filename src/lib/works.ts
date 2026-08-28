"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayKst } from "@/lib/time";

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

export async function renameWork(workId: string, title: string): Promise<CreateWorkResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const trimmed = title.trim();
  if (!trimmed) return { error: "작품 이름을 입력해주세요." };

  const { data, error } = await supabase
    .from("works")
    .update({ title: trimmed })
    .eq("id", workId)
    .eq("user_id", user.id)
    .select("id,title")
    .single();

  if (error || !data) return { error: error?.message ?? "작품 이름 수정에 실패했습니다." };

  revalidatePath("/me");
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

// 방의 글자수 기록 입력(char-input.tsx)에서 매 입력마다 호출된다 — 이제
// 작품 선택이 필수라서(예전엔 선택사항이라 작품별 합계가 하루 총
// 글자수보다 적어지는 정확도 문제가 있었다), 방 무관 개인 글자수
// 기록(daily_records, addChars가 별도로 처리)과 항상 같은 입력 이벤트
// 하나에서 나란히 저장돼 서로 어긋나지 않는다.
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

  const date = dateOverride ?? todayKst();
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

export type WorkRecordEdit = { date: string; chars: number };

// [개인] 페이지 "작품별 글자수" 그래프의 연필 버튼(표 형식 편집)에서
// 사용 — recordWorkChars()의 델타 누적과 달리 해당 날짜의 글자수 값을
// 그대로 덮어쓴다. chars가 0 이하면 그 날짜 행을 삭제한다.
export async function setWorkRecordChars(
  workId: string,
  date: string,
  chars: number
): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const safeChars = Math.max(0, Math.floor(chars) || 0);

  const { data: existing } = await supabase
    .from("work_records")
    .select("id")
    .eq("work_id", workId)
    .eq("record_date", date)
    .maybeSingle<{ id: string }>();

  if (existing) {
    if (safeChars <= 0) {
      await supabase.from("work_records").delete().eq("id", existing.id);
    } else {
      await supabase
        .from("work_records")
        .update({ chars: safeChars, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }
  } else if (safeChars > 0) {
    await supabase.from("work_records").insert({
      work_id: workId,
      user_id: user.id,
      record_date: date,
      chars: safeChars,
    });
  }

  revalidatePath("/me");
  return null;
}

// [방]-기록 탭 수정창에서 작품을 고르면, 그 작품의 날짜별 글자수를
// 한 번에 가져와 입력칸을 채운다.
export async function getWorkRecords(workId: string): Promise<Record<string, number>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data } = await supabase
    .from("work_records")
    .select("record_date,chars")
    .eq("work_id", workId)
    .eq("user_id", user.id)
    .returns<{ record_date: string; chars: number }[]>();

  const map: Record<string, number> = {};
  for (const r of data ?? []) map[r.record_date] = r.chars;
  return map;
}

// 사용자의 전체 작품 목록 — 방의 글자수 입력, [개인] 페이지 그래프 양쪽
// 모두 여기서 초기 목록을 가져온다.
export async function getMyWorks() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("works")
    .select("id,title,last_current_chars")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .returns<{ id: string; title: string; last_current_chars: number }[]>();

  return (data ?? []).map((w) => ({
    id: w.id,
    title: w.title,
    lastCurrentChars: w.last_current_chars,
  }));
}
