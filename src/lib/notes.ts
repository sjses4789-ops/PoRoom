"use server";

import { createClient } from "@/lib/supabase/server";
import { err } from "@/lib/errors";
import { NOTE_MAX_LENGTH } from "@/lib/notes-limits";

export type NoteItem = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  read: boolean;
  roomName: string | null;
  // 이 쪽지가 오간 방(답장할 때 같은 방의 닉네임으로 보내기 위해 필요)
  roomId: string | null;
};

// 쪽지 보내기 — 받는 사람이 나를 차단했다면 DB가 거부한다(0066). 차단 여부가 드러나지 않도록 보낸 사람에게는
// 같은 오류 문구를 돌려준다.
export async function sendNote(
  recipientId: string,
  roomId: string | null,
  content: string
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await err("loginRequired") };
  if (user.id === recipientId) return { error: await err("noteSelf") };

  const text = content.trim();
  if (!text) return { error: await err("noteRequired") };
  if (text.length > NOTE_MAX_LENGTH) return { error: await err("noteTooLong", { max: NOTE_MAX_LENGTH }) };

  // 상대가 보게 될 내 이름: 그 방에서 닉네임을 쓰고 있으면 닉네임, 아니면 기본 닉네임.
  const [{ data: profile }, memberResult] = await Promise.all([
    supabase.from("users").select("name,email").eq("id", user.id).maybeSingle<{ name: string | null; email: string }>(),
    roomId
      ? supabase
          .from("room_members")
          .select("nickname")
          .eq("room_id", roomId)
          .eq("user_id", user.id)
          .maybeSingle<{ nickname: string | null }>()
      : Promise.resolve({ data: null as { nickname: string | null } | null }),
  ]);
  const senderName = memberResult.data?.nickname || profile?.name || await err("unknown");

  const { error } = await supabase
    .from("direct_notes")
    .insert({ sender_id: user.id, recipient_id: recipientId, room_id: roomId, sender_name: senderName, content: text });
  if (error) return { error: await err("noteSendFailed") };
  return { ok: true };
}

// 받은 쪽지 목록(최신순, 최대 100건). 내가 차단한 사람이 예전에 보낸 쪽지는 숨긴다.
export async function getInbox(): Promise<{ notes: NoteItem[]; unread: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { notes: [], unread: 0 };

  const [{ data: rows }, { data: blocks }] = await Promise.all([
    supabase
      .from("direct_notes")
      .select("id,sender_id,sender_name,room_id,content,read_at,created_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<
        {
          id: string;
          sender_id: string;
          sender_name: string;
          room_id: string | null;
          content: string;
          read_at: string | null;
          created_at: string;
        }[]
      >(),
    supabase.from("user_blocks").select("blocked_id").eq("blocker_id", user.id).returns<{ blocked_id: string }[]>(),
  ]);

  const blocked = new Set((blocks ?? []).map((b) => b.blocked_id));
  const visible = (rows ?? []).filter((r) => !blocked.has(r.sender_id));

  const roomIds = Array.from(new Set(visible.map((r) => r.room_id).filter((id): id is string => Boolean(id))));
  const roomNames = new Map<string, string>();
  if (roomIds.length > 0) {
    const { data: rooms } = await supabase.from("rooms").select("id,name").in("id", roomIds).returns<{ id: string; name: string }[]>();
    for (const r of rooms ?? []) roomNames.set(r.id, r.name);
  }

  const notes: NoteItem[] = visible.map((r) => ({
    id: r.id,
    senderId: r.sender_id,
    senderName: r.sender_name,
    content: r.content,
    createdAt: r.created_at,
    read: r.read_at !== null,
    roomName: r.room_id ? (roomNames.get(r.room_id) ?? null) : null,
    roomId: r.room_id,
  }));
  return { notes, unread: notes.filter((n) => !n.read).length };
}

export async function getUnreadNoteCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from("direct_notes")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .is("read_at", null);
  return count ?? 0;
}

export async function markNoteRead(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("direct_notes")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_id", user.id)
    .is("read_at", null);
}

export async function deleteNote(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("direct_notes").delete().eq("id", id).eq("recipient_id", user.id);
}
