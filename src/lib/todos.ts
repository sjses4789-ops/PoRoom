"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateTodoResult = { error: string } | { id: string; content: string };

export async function createTodo(content: string): Promise<CreateTodoResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const trimmed = content.trim();
  if (!trimmed) return { error: "할 일을 입력해주세요." };

  const { data, error } = await supabase
    .from("todos")
    .insert({ user_id: user.id, content: trimmed })
    .select("id,content")
    .single();

  if (error || !data) return { error: error?.message ?? "추가에 실패했습니다." };

  revalidatePath("/me");
  revalidatePath("/main");
  return { id: data.id, content: data.content };
}

export async function updateTodo(id: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const trimmed = content.trim();
  if (!trimmed) return;

  await supabase
    .from("todos")
    .update({ content: trimmed })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/me");
  revalidatePath("/main");
}

export async function deleteTodo(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // for_date가 있는 항목은 챌린지 참여로 자동 생성된 할 일이다 — 그냥
  // 지우기만 하면 다음 페이지 로드 때 ensureChallengeTodos()가 "오늘치가
  // 없다"고 보고 똑같이 다시 만들어버리므로, 지운 (내용, 날짜) 조합을
  // 남겨서 같은 기간 동안은 재생성되지 않게 한다.
  const { data: todo } = await supabase
    .from("todos")
    .select("content,for_date")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<{ content: string; for_date: string | null }>();

  await supabase.from("todos").delete().eq("id", id).eq("user_id", user.id);

  if (todo?.for_date) {
    await supabase
      .from("todo_dismissals")
      .upsert(
        { user_id: user.id, content: todo.content, for_date: todo.for_date },
        { onConflict: "user_id,content,for_date" }
      );
  }

  revalidatePath("/me");
  revalidatePath("/main");
}
