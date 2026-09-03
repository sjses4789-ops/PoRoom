import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { AdminEventForm } from "./admin-event-form";
import { AdminEventDeleteButton } from "./admin-event-delete-button";
import { AdminEventEditButton } from "./admin-event-edit-button";
import { AdminRoomDeleteButton } from "./admin-room-delete-button";
import { AdminMemberList, type AdminUserRow } from "./admin-member-list";

type RoomRow = { id: string; name: string; is_system: boolean; created_at: string };
type MemberRow = { room_id: string };
type EventRow = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
};
type UserRow = {
  id: string;
  name: string | null;
  email: string;
  created_at: string;
  is_banned: boolean;
  position: "novelist" | "webtoon" | null;
};

// 관리자 페이지는 별도 네비게이션 링크 없이 URL로만 접근한다 — 계정이
// admin이 아니면 서버에서 바로 404를 돌려주기 때문에, 이 페이지의 존재
// 자체가 일반 사용자에게 노출될 일이 없다.
export default async function AdminPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) notFound();

  const t = await getTranslations("admin");
  const supabase = await createClient();
  const {
    data: { user: self },
  } = await supabase.auth.getUser();

  const [{ data: rooms }, { data: memberships }, { data: events }, { data: users }] =
    await Promise.all([
      supabase
        .from("rooms")
        .select("id,name,is_system,created_at")
        .order("created_at", { ascending: false })
        .returns<RoomRow[]>(),
      supabase.from("room_members").select("room_id").returns<MemberRow[]>(),
      supabase
        .from("challenges")
        .select("id,title,start_date,end_date")
        .eq("is_admin_event", true)
        .order("created_at", { ascending: false })
        .returns<EventRow[]>(),
      supabase
        .from("users")
        .select("id,name,email,created_at,is_banned,position")
        .order("created_at", { ascending: false })
        .returns<UserRow[]>(),
    ]);

  const memberCountByRoom = new Map<string, number>();
  for (const m of memberships ?? []) {
    memberCountByRoom.set(m.room_id, (memberCountByRoom.get(m.room_id) ?? 0) + 1);
  }
  const userRooms = (rooms ?? []).filter((r) => !r.is_system);

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
        {t("title")}
      </h1>

      <section className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-700">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t("fullBackupHeading")}
        </h2>
        <p className="text-xs text-neutral-400">{t("fullBackupHint")}</p>
        <a
          href="/api/admin/full-backup"
          className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {t("fullBackupButton")}
        </a>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t("createEventHeading")}
        </h2>
        <p className="text-xs text-neutral-400">{t("createEventHint")}</p>
        <div className="max-w-md">
          <AdminEventForm />
        </div>
        {events && events.length > 0 && (
          <ul className="flex flex-col gap-2">
            {events.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-neutral-900 dark:text-white">{e.title}</span>
                  <span className="text-[11px] text-neutral-400">
                    {e.start_date} ~ {e.end_date}
                  </span>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <AdminEventEditButton
                    challengeId={e.id}
                    currentTitle={e.title}
                    currentStartDate={e.start_date}
                    currentEndDate={e.end_date}
                  />
                  <AdminEventDeleteButton challengeId={e.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {t("roomsHeading")}
          </h2>
          <p className="text-xs text-neutral-400">{t("roomsHint")}</p>
          <ul className="flex max-h-[32rem] flex-col gap-2 overflow-y-auto">
            {userRooms.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="min-w-0 truncate font-medium text-neutral-900 dark:text-white">
                    {r.name}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {t("memberCount", { count: memberCountByRoom.get(r.id) ?? 0 })}
                  </span>
                </div>
                <AdminRoomDeleteButton roomId={r.id} roomName={r.name} />
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {t("membersHeading")}
          </h2>
          <p className="text-xs text-neutral-400">{t("membersHint")}</p>
          <AdminMemberList
            selfId={self!.id}
            users={(users ?? []).map(
              (u): AdminUserRow => ({
                id: u.id,
                name: u.name,
                email: u.email,
                isBanned: u.is_banned,
                position: u.position,
              })
            )}
          />
        </section>
      </div>
    </div>
  );
}
