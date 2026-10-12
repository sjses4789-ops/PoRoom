import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { AdminEventForm } from "./admin-event-form";
import { AdminEventDeleteButton } from "./admin-event-delete-button";
import { AdminEventEditButton } from "./admin-event-edit-button";
import { AdminRoomDeleteButton } from "./admin-room-delete-button";
import { AdminMemberList, type AdminUserRow } from "./admin-member-list";
import { AdminTabs } from "./admin-tabs";
import { AdminReportList, type AdminReport } from "./admin-report-list";
import { RichContent } from "@/components/rich-content";
import Link from "next/link";

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

  const [
    { data: rooms },
    { data: memberships },
    { data: events },
    { data: users },
    { data: nicknameRows },
    { data: reportRows },
    { data: feedbackRows },
  ] =
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
      // 사용자가 방별로 쓰려고 만든 추가 닉네임 전체(관리자만 모두 볼 수 있다 — 0062 정책).
      supabase
        .from("user_nicknames")
        .select("user_id,nickname")
        .order("created_at", { ascending: true })
        .returns<{ user_id: string; nickname: string }[]>(),
      // 참여자 신고(0065) — 관리자만 읽을 수 있다. 테이블이 없으면 빈 목록으로 보인다.
      supabase
        .from("user_reports")
        .select("id,reporter_id,reported_id,room_id,reason,resolved,created_at")
        .order("created_at", { ascending: false })
        .returns<
          {
            id: string;
            reporter_id: string;
            reported_id: string;
            room_id: string | null;
            reason: string;
            resolved: boolean;
            created_at: string;
          }[]
        >(),
      // [기능 제안 & 버그 신고] 글 — 비밀글이라 관리자(와 작성자)만 읽는다(0064).
      supabase
        .from("feedback_posts")
        .select("id,user_id,category,title,content,created_at")
        .order("created_at", { ascending: false })
        .limit(100)
        .returns<
          { id: string; user_id: string; category: "suggestion" | "bug"; title: string; content: string; created_at: string }[]
        >(),
    ]);

  const displayName = new Map((users ?? []).map((u) => [u.id, u.name || u.email]));
  const roomName = new Map((rooms ?? []).map((r) => [r.id, r.name]));
  const reports: AdminReport[] = (reportRows ?? []).map((r) => ({
    id: r.id,
    reportedName: displayName.get(r.reported_id) ?? "알 수 없음",
    reporterName: displayName.get(r.reporter_id) ?? "알 수 없음",
    roomName: r.room_id ? (roomName.get(r.room_id) ?? "삭제된 방") : null,
    reason: r.reason,
    createdAt: r.created_at,
    resolved: r.resolved,
  }));

  const nicknamesByUser = new Map<string, string[]>();
  for (const n of nicknameRows ?? []) {
    nicknamesByUser.set(n.user_id, [...(nicknamesByUser.get(n.user_id) ?? []), n.nickname]);
  }

  const memberCountByRoom = new Map<string, number>();
  for (const m of memberships ?? []) {
    memberCountByRoom.set(m.room_id, (memberCountByRoom.get(m.room_id) ?? 0) + 1);
  }
  const userRooms = (rooms ?? []).filter((r) => !r.is_system);

  const pendingReports = reports.filter((r) => !r.resolved).length;

  const roomsAndMembers = (
    <>
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
                nicknames: nicknamesByUser.get(u.id) ?? [],
              })
            )}
          />
        </section>
      </div>
      <section className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-700">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">참여자 신고</h2>
        <p className="text-xs text-neutral-400">
          방 참여자 카드에서 접수된 신고예요. 신고 대상의 계정 차단은 위 회원 목록에서 할 수 있어요.
        </p>
        <AdminReportList reports={reports} />
      </section>
    </>
  );

  const challengeTab = (
    <>
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
    </>
  );

  const manageTab = (
    <>
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
      <section className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-700">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            기능 제안 & 버그 신고 ({(feedbackRows ?? []).length}건)
          </h2>
          <Link href="/feedback" className="text-xs text-neutral-500 underline hover:text-neutral-900 dark:hover:text-white">
            답글 달러 가기
          </Link>
        </div>
        <p className="text-xs text-neutral-400">비밀글로 접수된 글이에요. 최근 100건까지 보여 줘요.</p>
        {(feedbackRows ?? []).length === 0 ? (
          <p className="text-xs text-neutral-400">접수된 글이 없습니다.</p>
        ) : (
          <ul className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto">
            {(feedbackRows ?? []).map((p) => (
              <li key={p.id} className="rounded-md border border-neutral-200 dark:border-neutral-700">
                <details className="group">
                  <summary className="flex cursor-pointer flex-wrap items-center gap-x-2 gap-y-0.5 px-3 py-2 text-[13px]">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        p.category === "bug"
                          ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                          : "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                      }`}
                    >
                      {p.category === "bug" ? "버그 신고" : "기능 제안"}
                    </span>
                    <span className="font-medium text-neutral-900 dark:text-white">{p.title}</span>
                    <span className="text-[12px] text-neutral-400">
                      · {displayName.get(p.user_id) ?? "알 수 없음"} · {new Date(p.created_at).toLocaleString("ko-KR")}
                    </span>
                  </summary>
                  <div className="border-t border-neutral-100 px-3 py-3 text-sm dark:border-neutral-800">
                    <RichContent content={p.content} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
        {t("title")}
      </h1>
      <AdminTabs
        tabs={[
          { key: "rooms", label: "방 & 회원", badge: pendingReports, content: roomsAndMembers },
          { key: "challenge", label: "챌린지", content: challengeTab },
          { key: "manage", label: "관리", content: manageTab },
        ]}
      />
    </div>
  );
}
