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
  revalidatePath("/forum");
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
  revalidatePath("/forum");
}

export async function deleteTodo(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("todos").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/me");
  revalidatePath("/forum");
}
