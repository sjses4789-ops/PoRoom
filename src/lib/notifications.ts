"use server";

import { createClient } from "@/lib/supabase/server";
import { getMyChallengeResults } from "@/lib/challenge-results";
import { getLastWeekReport } from "@/lib/weekly-report";
import { purgeExpiredChatImages } from "@/lib/chat-image-purge";
import { kstDatePlusDays, todayKst } from "@/lib/time";

export type NotificationKind = "whisper" | "report_resolved" | "challenge_result" | "weekly_report";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  params: Record<string, unknown>;
  link: string | null;
  read: boolean;
  createdAt: string;
};

type Row = {
  id: string;
  kind: NotificationKind;
  params: Record<string, unknown> | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export async function getNotifications(): Promise<{ items: NotificationItem[]; unread: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], unread: 0 };

  const { data } = await supabase
    .from("notifications")
    .select("id,kind,params,link,read_at,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<Row[]>();
  const items: NotificationItem[] = (data ?? []).map((r) => ({
    id: r.id,
    kind: r.kind,
    params: r.params ?? {},
    link: r.link,
    read: r.read_at !== null,
    createdAt: r.created_at,
  }));
  return { items, unread: items.filter((i) => !i.read).length };
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).is("read_at", null);
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
}

// 그 방에서 온 귓속말 알림을 읽음으로 — 방 화면을 보고 있는 동안에는 알림이 쌓이지 않게 한다.
export async function markRoomWhisperRead(roomId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("kind", "whisper")
    .eq("link", `/room/${roomId}`)
    .is("read_at", null);
}

export async function deleteNotification(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notifications").delete().eq("id", id);
}

// 로그인한 사용자가 앱을 쓰는 동안 가끔 부른다(벨이 한 시간에 한 번). 아직 알림으로 안 만든 것을 만든다:
//  - 최근 30일 안에 끝난 대결·이벤트 챌린지의 내 결과
//  - 지난주 집필 리포트
// 같은 ref는 DB가 중복으로 넣지 않으므로 몇 번 불러도 안전하다. 겸사겸사 30일 지난 채팅 사진 파일도 정리한다.
export async function syncMyNotifications(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const since = kstDatePlusDays(-30, todayKst());
    const results = await getMyChallengeResults(supabase, user.id);
    for (const r of results) {
      if (r.endDate < since) continue;
      await supabase.rpc("add_my_notification", {
        p_kind: "challenge_result",
        p_ref: r.id,
        p_params: {
          type: r.kind,
          title: r.title,
          metric: r.metric,
          rank: r.rank,
          total: r.total,
          value: r.value,
          success: r.success,
          targetPosition: r.targetPosition,
        },
        p_link: "/compete",
      });
    }

    const week = await getLastWeekReport(supabase, user.id);
    if (week) {
      await supabase.rpc("add_my_notification", {
        p_kind: "weekly_report",
        p_ref: week.weekStart,
        p_params: week,
        p_link: "/me",
      });
    }
  } catch {
    // 알림 만들기가 실패해도 화면 사용에는 영향이 없다.
  }

  try {
    await purgeExpiredChatImages(supabase);
  } catch {
    // 사진 정리 실패도 조용히 넘어간다.
  }
}
