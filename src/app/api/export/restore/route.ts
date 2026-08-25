import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 백업 JSON을 현재 로그인한 계정에 "추가"한다 — 백업 파일 안에 user_id가
// 있어도 절대 신뢰하지 않고, 항상 지금 로그인한 사용자에게만 데이터를
// 붙인다(다른 계정 데이터를 흉내내 옮겨붙이는 걸 막기 위함).
// 대결/챌린지 참여 기록은 기간이 지나면 의미가 없고 되돌려 참여할 수도
// 없어서 이 복원 대상에서 제외한다 — 글자수·작품·할일·목표처럼 실제로
// "이어서 쓸 수 있는" 데이터만 옮긴다.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "올바른 백업 파일이 아니에요." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "올바른 백업 파일이 아니에요." }, { status: 400 });
  }
  const dump = body as Record<string, unknown>;
  const asArray = (v: unknown): Record<string, unknown>[] =>
    Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object") : [];

  const summary = { works: 0, workRecords: 0, workRecordEntries: 0, dailyRecords: 0, todos: 0, goals: 0 };

  // ---- 작품: 제목이 같은 작품이 이미 있으면 그 작품에 합치고, 없으면 새로 만든다 ----
  const backupWorks = asArray(dump.works);
  const { data: existingWorks } = await supabase
    .from("works")
    .select("id,title")
    .eq("user_id", user.id)
    .returns<{ id: string; title: string }[]>();
  const workIdByTitle = new Map((existingWorks ?? []).map((w) => [w.title, w.id]));
  const oldIdToNewId = new Map<string, string>();

  for (const w of backupWorks) {
    const oldId = typeof w.id === "string" ? w.id : null;
    const title = typeof w.title === "string" ? w.title.trim() : "";
    if (!oldId || !title) continue;
    let newId = workIdByTitle.get(title);
    if (!newId) {
      const { data: inserted, error } = await supabase
        .from("works")
        .insert({ user_id: user.id, title })
        .select("id")
        .single<{ id: string }>();
      if (error || !inserted) continue;
      newId = inserted.id;
      workIdByTitle.set(title, newId);
      summary.works++;
    }
    oldIdToNewId.set(oldId, newId);
  }

  // ---- 작품별 일자 글자수(work_records) ----
  const workRecordRows = asArray(dump.workRecords)
    .map((r) => {
      const newWorkId = typeof r.work_id === "string" ? oldIdToNewId.get(r.work_id) : undefined;
      const recordDate = typeof r.record_date === "string" ? r.record_date : null;
      if (!newWorkId || !recordDate) return null;
      return { work_id: newWorkId, user_id: user.id, record_date: recordDate, chars: Number(r.chars) || 0 };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (workRecordRows.length) {
    const { error } = await supabase
      .from("work_records")
      .upsert(workRecordRows, { onConflict: "work_id,record_date" });
    if (!error) summary.workRecords = workRecordRows.length;
  }

  // ---- 작품별 기록 건(work_record_entries, 건별 차트용) ----
  const entryRows = asArray(dump.workRecordEntries)
    .map((e) => {
      const newWorkId = typeof e.work_id === "string" ? oldIdToNewId.get(e.work_id) : undefined;
      if (!newWorkId) return null;
      return {
        work_id: newWorkId,
        user_id: user.id,
        delta: Number(e.delta) || 0,
        current_chars: Number(e.current_chars) || 0,
        created_at: typeof e.created_at === "string" ? e.created_at : new Date().toISOString(),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (entryRows.length) {
    const { error } = await supabase.from("work_record_entries").insert(entryRows);
    if (!error) summary.workRecordEntries = entryRows.length;
  }

  // ---- 방별 일자 글자수/집중시간(daily_records): 더 이상 존재하지 않는
  // 방이면 연결하지 않고 기록만 살린다 ----
  const backupDaily = asArray(dump.dailyRecords);
  const roomIds = Array.from(
    new Set(backupDaily.map((r) => r.room_id).filter((v): v is string => typeof v === "string"))
  );
  const { data: validRoomRows } = roomIds.length
    ? await supabase.from("rooms").select("id").in("id", roomIds).returns<{ id: string }[]>()
    : { data: [] as { id: string }[] };
  const validRoomIds = new Set((validRoomRows ?? []).map((r) => r.id));
  const dailyRows = backupDaily
    .map((r) => {
      const recordDate = typeof r.record_date === "string" ? r.record_date : null;
      if (!recordDate) return null;
      return {
        user_id: user.id,
        room_id: typeof r.room_id === "string" && validRoomIds.has(r.room_id) ? r.room_id : null,
        record_date: recordDate,
        chars: Number(r.chars) || 0,
        focus_minutes: Number(r.focus_minutes) || 0,
        break_minutes: Number(r.break_minutes) || 0,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (dailyRows.length) {
    const { error } = await supabase
      .from("daily_records")
      .upsert(dailyRows, { onConflict: "user_id,room_id,record_date" });
    if (!error) summary.dailyRecords = dailyRows.length;
  }

  // ---- 할 일: 같은 날짜+내용이 이미 있으면 건너뛴다 ----
  const { data: existingTodos } = await supabase
    .from("todos")
    .select("content,for_date")
    .eq("user_id", user.id)
    .returns<{ content: string; for_date: string | null }[]>();
  const existingTodoKeys = new Set((existingTodos ?? []).map((t) => `${t.content}__${t.for_date ?? ""}`));
  const todoRows = asArray(dump.todos)
    .map((t) => {
      const content = typeof t.content === "string" ? t.content.trim() : "";
      if (!content) return null;
      const forDate = typeof t.for_date === "string" ? t.for_date : null;
      const key = `${content}__${forDate ?? ""}`;
      if (existingTodoKeys.has(key)) return null;
      existingTodoKeys.add(key);
      return { user_id: user.id, content, for_date: forDate };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (todoRows.length) {
    const { error } = await supabase.from("todos").insert(todoRows);
    if (!error) summary.todos = todoRows.length;
  }

  // ---- 목표 ----
  const goalRows = asArray(dump.goals)
    .filter((g) => g.period === "month" || g.period === "year")
    .map((g) => ({
      user_id: user.id,
      period: g.period as "month" | "year",
      target_chars: Number(g.target_chars) || 0,
      target_minutes: Number(g.target_minutes) || 0,
    }));
  if (goalRows.length) {
    const { error } = await supabase.from("goals").upsert(goalRows, { onConflict: "user_id,period" });
    if (!error) summary.goals = goalRows.length;
  }

  return NextResponse.json({ ok: true, summary });
}
