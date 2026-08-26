"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayKst } from "@/lib/time";
import { isTodoRowActive } from "@/lib/system-challenges";

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
    .insert({ user_id: user.id, content: trimmed, todo_date: todayKst() })
    .select("id,content")
    .single();

  if (error || !data) return { error: error?.message ?? "추가에 실패했습니다." };

  revalidatePath("/me");
  revalidatePath("/main");
  return { id: data.id, content: data.content };
}

// 체크(완료)해도 더 이상 지우지 않고 completed_at만 채운다 — [개인]
// 페이지의 날짜별 팝오버에서 완료 여부까지 확인할 수 있도록.
export async function completeTodo(id: string) {
  await setTodoCompleted(id, true);
}

// "+더보기" 팝오버에서 과거 날짜의 항목도 체크/해제할 수 있어야 해서,
// 완료 여부를 양방향으로 바꾸는 함수로 통일한다. 챌린지가 아니라
// 사용자가 직접 적은 할 일은, 완료 처리한 그 날짜에서 "+더보기"로 다시
// 찾을 수 있어야 하므로 완료 시 todo_date를 오늘로 다시 찍는다(챌린지
// 자동 생성 항목은 for_date로 활성 기간을 판단하므로 건드리지 않는다).
export async function setTodoCompleted(id: string, completed: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const update: { completed_at: string | null; todo_date?: string } = {
    completed_at: completed ? new Date().toISOString() : null,
  };

  if (completed) {
    const { data: todo } = await supabase
      .from("todos")
      .select("for_date")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle<{ for_date: string | null }>();
    if (!todo?.for_date) {
      update.todo_date = todayKst();
    }
  }

  await supabase.from("todos").update(update).eq("id", id).eq("user_id", user.id);

  revalidatePath("/me");
  revalidatePath("/main");
}

export type TodoHistoryItem = { id: string; content: string; completed: boolean };

export async function getTodosForDate(date: string): Promise<TodoHistoryItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const monthStart = `${date.slice(0, 7)}-01`;

  // 수동으로 적은 할 일은 그 날 만들어진 것(todo_date)만 그 날짜 기록에
  // 속하지만, 챌린지 자동 생성 항목(매일/이번 달)은 처음 만들어진 날의
  // todo_date만으로는 찾을 수 없다 — 예를 들어 초단 완고 챌린지 항목은
  // 그 달 첫 참여일에 딱 한 번만 만들어지고 todo_date도 그날로 고정되지만,
  // 실제로는 그 달 내내 "오늘의 할 일"에 계속 떠 있으므로 for_date로도
  // 함께 찾아야 한다.
  const { data } = await supabase
    .from("todos")
    .select("id,content,completed_at,todo_date,for_date")
    .eq("user_id", user.id)
    .or(`todo_date.eq.${date},for_date.eq.${date},for_date.eq.${monthStart}`)
    .order("created_at", { ascending: true })
    .returns<
      { id: string; content: string; completed_at: string | null; todo_date: string; for_date: string | null }[]
    >();

  return (data ?? [])
    .filter((r) => !r.for_date || isTodoRowActive({ content: r.content, for_date: r.for_date }, date))
    .map((r) => ({ id: r.id, content: r.content, completed: !!r.completed_at }));
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
