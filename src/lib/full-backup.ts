import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";

// 관리자 전용 "전체 데이터 백업" — 서비스 키가 없는 환경이라 이 요청을
// 보내는 관리자 세션의 RLS 권한 범위 안에서만 읽을 수 있다. 이 앱의
// 핵심 콘텐츠 테이블은 대부분 "인증된 사용자는 전체 조회 가능"으로
// 열려 있어(랭킹 등을 위해) 실질적으로 거의 모든 테이블을 담을 수
// 있지만, goals(개인 목표)처럼 본인만 조회 가능한 테이블은 관리자
// 세션으로도 다른 사람 것까지는 못 읽어 그 사람 몫만 비어 있을 수 있다
// — 서버 로그의 rowCounts로 각 테이블이 실제로 몇 건 담겼는지 확인 가능.
const BACKUP_TABLES = [
  "users",
  "rooms",
  "room_members",
  "room_bans",
  "room_events",
  "room_event_categories",
  "room_posts",
  "daily_records",
  "daily_char_goals",
  "works",
  "work_records",
  "work_record_entries",
  "goals",
  "todos",
  "todo_dismissals",
  "challenges",
  "challenge_participants",
  "challenge_messages",
  "chat_messages",
  "activity_logs",
  "feed_posts",
  "feed_reactions",
  "rest_posts",
  "feedback_posts",
  "feedback_comments",
  "polls",
  "poll_options",
  "poll_votes",
  "site_time_logs",
  "typing_scores",
  "event_celebrations",
] as const;

const PAGE_SIZE = 1000;

// PostgREST(Supabase)는 요청 한 번에 최대 1000행만 돌려주므로, 큰 테이블은
// range()로 나눠서 끝까지 긁어온다.
async function fetchAllRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string
): Promise<unknown[]> {
  const rows: unknown[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(offset, offset + PAGE_SIZE - 1);
    if (error || !data) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return rows;
}

export type FullBackupResult =
  | { error: string }
  | {
      exportedAt: string;
      exportedBy: string;
      tables: Record<string, unknown[]>;
      rowCounts: Record<string, number>;
    };

export async function buildFullBackup(): Promise<FullBackupResult> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return { error: "관리자만 사용할 수 있습니다." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const entries = await Promise.all(
    BACKUP_TABLES.map(async (table) => [table, await fetchAllRows(supabase, table)] as const)
  );

  const tables: Record<string, unknown[]> = {};
  const rowCounts: Record<string, number> = {};
  for (const [table, rows] of entries) {
    tables[table] = rows;
    rowCounts[table] = rows.length;
  }

  return {
    exportedAt: new Date().toISOString(),
    exportedBy: user.id,
    tables,
    rowCounts,
  };
}
