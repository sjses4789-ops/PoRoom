import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteJoin } from "./invite-join";

// 초대 링크 — /invite/room/<초대코드>, /invite/duel/<초대코드>. 비로그인으로 열면 로그인 안내 팝업이 뜨고
// (로그인 후 이 주소로 돌아온다), 로그인했다면 닉네임을 고른 뒤 바로 입장한다.
export default async function InvitePage({ params }: { params: Promise<{ kind: string; code: string }> }) {
  const { kind, code: rawCode } = await params;
  if (kind !== "room" && kind !== "duel") notFound();
  const code = decodeURIComponent(rawCode).trim().toUpperCase().slice(0, 12);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let info: { name: string; memberCount: number | null } | null = null;
  if (user) {
    if (kind === "room") {
      const { data: room } = await supabase
        .from("rooms")
        .select("id,name")
        .eq("invite_code", code)
        .maybeSingle<{ id: string; name: string }>();
      if (room) {
        const { count } = await supabase
          .from("room_members")
          .select("user_id", { count: "exact", head: true })
          .eq("room_id", room.id);
        info = { name: room.name, memberCount: count ?? null };
      }
    } else {
      const { data: challenge } = await supabase
        .from("challenges")
        .select("id,title")
        .eq("invite_code", code)
        .maybeSingle<{ id: string; title: string }>();
      if (challenge) {
        const { count } = await supabase
          .from("challenge_participants")
          .select("user_id", { count: "exact", head: true })
          .eq("challenge_id", challenge.id);
        info = { name: challenge.title, memberCount: count ?? null };
      }
    }
  }

  return <InviteJoin kind={kind} code={code} loggedIn={Boolean(user)} info={info} />;
}
