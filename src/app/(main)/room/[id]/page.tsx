import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { RoomView, type Member } from "./room-view";
import type { ChatMessage } from "./chat-panel";
import type { DailyRecord } from "@/lib/records";
import { formatRelativeTime, todayKst } from "@/lib/time";
import { ShareRecordsToggle } from "./share-records-toggle";
import { RoomTabs } from "./room-tabs";
import { RoomRecordsPanel } from "./room-records-panel";
import { CalendarPanel, type RoomEvent, type EventCategory } from "./calendar-panel";
import { BoardPanel, type RoomPost } from "./board-panel";
import { PollPanel, type Poll } from "./poll-panel";
import type { PostCategory } from "@/lib/room-posts";
import type { PollType } from "@/lib/polls";
import {
  RoomSettingsButton,
  type SettingsMember,
  type SettingsCategory,
} from "./room-settings-button";
import { LeaveRoomButton } from "./leave-room-button";
import { SystemRoomLeaveGuard } from "./system-room-leave-guard";
import { paletteDot } from "@/lib/palette";

type RecordVisibility = "shared" | "private" | "free";
type JoinType = "invite" | "open";

type RoomRow = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  color: string;
  tags: string[];
  record_visibility: RecordVisibility;
  join_type: JoinType;
  capacity: number | null;
  is_system: boolean;
};

type MemberRow = {
  user_id: string;
  share_records: boolean;
  last_seen_at: string | null;
  is_vice: boolean;
  users: {
    name: string | null;
    email: string;
    character_id: string | null;
    chat_color: string | null;
  } | null;
};

type ChatMessageRow = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type DailyRecordRow = {
  user_id: string;
  record_date: string;
  chars: number;
  focus_minutes: number;
};

type EventRow = {
  id: string;
  title: string;
  event_date: string;
  memo: string | null;
  created_by: string;
  category_id: string | null;
};

type PostRow = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  category: PostCategory;
};

type CategoryRow = { id: string; name: string; color: string };

type PollRow = {
  id: string;
  created_by: string;
  title: string;
  poll_type: PollType;
  is_anonymous_vote: boolean;
  is_anonymous_creator: boolean;
  created_at: string;
};
type PollOptionRow = { id: string; poll_id: string; label: string; position: number };
type PollVoteRow = { poll_id: string; option_id: string; voter_id: string };

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("room.page");
  const tCommon = await getTranslations("room.common");
  const RECORD_VISIBILITY_LABEL: Record<RecordVisibility, string> = {
    shared: t("recordVisibility.shared"),
    private: t("recordVisibility.private"),
    free: t("recordVisibility.free"),
  };
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: room } = await supabase
    .from("rooms")
    .select(
      "id,name,invite_code,owner_id,color,tags,record_visibility,join_type,capacity,is_system"
    )
    .eq("id", id)
    .maybeSingle()
    .returns<RoomRow>();

  if (!room) notFound();

  const { data: memberRows } = await supabase
    .from("room_members")
    .select(
      "user_id,share_records,last_seen_at,is_vice,users(name,email,character_id,chat_color)"
    )
    .eq("room_id", id)
    .returns<MemberRow[]>();

  const shareRecordsMap = new Map(
    (memberRows ?? []).map((m) => [m.user_id, m.share_records])
  );
  const viceMap = new Map((memberRows ?? []).map((m) => [m.user_id, m.is_vice]));

  const members: Member[] = (memberRows ?? []).map((m) => ({
    id: m.user_id,
    name: m.users?.name || m.users?.email || tCommon("unknown"),
    characterId: m.users?.character_id ?? null,
    chatColor: m.users?.chat_color ?? null,
    recordsVisible:
      room.record_visibility === "shared" ||
      m.user_id === user!.id ||
      (room.record_visibility === "free" && shareRecordsMap.get(m.user_id) === true),
    lastSeenLabel: formatRelativeTime(m.last_seen_at),
  }));

  const nameMap = new Map(members.map((m) => [m.id, m.name]));
  const selfMember = members.find((m) => m.id === user!.id);
  const selfShareRecords = shareRecordsMap.get(user!.id) ?? true;
  const isOwner = !room.is_system && room.owner_id === user!.id;
  const isVice = viceMap.get(user!.id) ?? false;
  const canPostNotice = isOwner || isVice;

  const today = todayKst();

  // 서로 의존하지 않는 조회는 전부 한 배치로 보낸다 — 방 입장이 느리다는
  // 피드백의 원인은 이 페이지가 필요한 조회 중 상당수를 이전 조회 결과와
  // 무관한데도 순차적으로(하나씩 기다렸다가 다음 것) 보내고 있던 것.
  const [
    { data: messageRows },
    { data: recordRows },
    { data: eventRows },
    { data: postRows },
    { data: categoryRows },
    { data: pollRows },
    { data: selfTodayGlobalRows },
    { data: goalRows },
    { data: workRows },
  ] = await Promise.all([
    supabase
      .from("chat_messages")
      .select("id,user_id,content,created_at")
      .eq("room_id", id)
      .order("created_at", { ascending: true })
      .limit(50)
      .returns<ChatMessageRow[]>(),
    supabase
      .from("daily_records")
      .select("user_id,record_date,chars,focus_minutes")
      .eq("room_id", id)
      .returns<DailyRecordRow[]>(),
    supabase
      .from("room_events")
      .select("id,title,event_date,memo,created_by,category_id")
      .eq("room_id", id)
      .returns<EventRow[]>(),
    supabase
      .from("room_posts")
      .select("id,user_id,title,content,created_at,category")
      .eq("room_id", id)
      .order("created_at", { ascending: false })
      .returns<PostRow[]>(),
    supabase
      .from("room_event_categories")
      .select("id,name,color")
      .eq("room_id", id)
      .returns<CategoryRow[]>(),
    supabase
      .from("polls")
      .select("id,created_by,title,poll_type,is_anonymous_vote,is_anonymous_creator,created_at")
      .eq("room_id", id)
      .order("created_at", { ascending: false })
      .returns<PollRow[]>(),
    // "오늘의 글자수"는 이 방만이 아니라 그날 어느 방에서 입력했든 합산되는
    // 개인 기록이다 — 방이 나중에 삭제돼도 사라지지 않는다.
    supabase
      .from("daily_records")
      .select("chars")
      .eq("user_id", user!.id)
      .eq("record_date", today)
      .returns<{ chars: number }[]>(),
    // 오늘 적용되는 목표 글자수 — 오늘 또는 그 이전 날짜에 설정된 값 중
    // 가장 최근 것.
    supabase
      .from("daily_char_goals")
      .select("target_chars")
      .eq("user_id", user!.id)
      .lte("effective_date", today)
      .order("effective_date", { ascending: false })
      .limit(1)
      .returns<{ target_chars: number }[]>(),
    supabase
      .from("works")
      .select("id,title,last_current_chars")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: true })
      .returns<{ id: string; title: string; last_current_chars: number }[]>(),
  ]);

  const pollIds = (pollRows ?? []).map((p) => p.id);
  const eventIds = (eventRows ?? []).map((e) => e.id);
  const [{ data: pollOptionRows }, { data: pollVoteRows }, { data: celebrationRows }] =
    await Promise.all([
      pollIds.length
        ? supabase
            .from("poll_options")
            .select("id,poll_id,label,position")
            .in("poll_id", pollIds)
            .order("position", { ascending: true })
            .returns<PollOptionRow[]>()
        : Promise.resolve({ data: [] as PollOptionRow[] }),
      pollIds.length
        ? supabase
            .from("poll_votes")
            .select("poll_id,option_id,voter_id")
            .in("poll_id", pollIds)
            .returns<PollVoteRow[]>()
        : Promise.resolve({ data: [] as PollVoteRow[] }),
      eventIds.length
        ? supabase
            .from("event_celebrations")
            .select("event_id,user_id")
            .in("event_id", eventIds)
            .returns<{ event_id: string; user_id: string }[]>()
        : Promise.resolve({ data: [] as { event_id: string; user_id: string }[] }),
    ]);

  const initialMessages: ChatMessage[] = (messageRows ?? []).map((m) => ({
    id: m.id,
    userId: m.user_id,
    content: m.content,
    createdAt: m.created_at,
  }));

  const visibleUserIds = new Set(
    members.filter((m) => m.recordsVisible).map((m) => m.id)
  );

  const dailyRecords: DailyRecord[] = (recordRows ?? [])
    .filter((r) => visibleUserIds.has(r.user_id))
    .map((r) => ({
      userId: r.user_id,
      date: r.record_date,
      chars: r.chars,
      focusMinutes: r.focus_minutes,
    }));

  const selfToday = dailyRecords.find(
    (r) => r.userId === user!.id && r.date === today
  );

  const selfTodayGlobalChars = (selfTodayGlobalRows ?? []).reduce(
    (sum, r) => sum + r.chars,
    0
  );
  const selfTodayGoalChars = goalRows?.[0]?.target_chars ?? 0;

  const works = (workRows ?? []).map((w) => ({
    id: w.id,
    title: w.title,
    lastCurrentChars: w.last_current_chars,
  }));

  const categoryNameById = new Map((categoryRows ?? []).map((c) => [c.id, c.name]));

  const celebrationCountMap = new Map<string, number>();
  const selfCelebratedSet = new Set<string>();
  for (const c of celebrationRows ?? []) {
    celebrationCountMap.set(c.event_id, (celebrationCountMap.get(c.event_id) ?? 0) + 1);
    if (c.user_id === user!.id) selfCelebratedSet.add(c.event_id);
  }

  const events: RoomEvent[] = (eventRows ?? []).map((e) => {
    // 출간 카테고리 일정은 누구의 일정인지 알 수 없도록 항상 익명 처리한다
    // (작품 공개는 하고 싶지만 작가 본인임은 숨기고 싶은 경우가 많아서).
    const isAnnouncement = e.category_id
      ? categoryNameById.get(e.category_id) === "출간"
      : false;
    return {
      id: e.id,
      title: e.title,
      eventDate: e.event_date,
      memo: e.memo,
      authorName: isAnnouncement ? null : nameMap.get(e.created_by) ?? tCommon("unknown"),
      categoryId: e.category_id,
      celebrationCount: celebrationCountMap.get(e.id) ?? 0,
      selfCelebrated: selfCelebratedSet.has(e.id),
    };
  });

  const categories: EventCategory[] = (categoryRows ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
  }));

  const posts: RoomPost[] = (postRows ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    createdAt: p.created_at,
    authorId: p.user_id,
    authorName: nameMap.get(p.user_id) ?? tCommon("unknown"),
    category: p.category,
  }));

  const latestNoticePost = posts.find((p) => p.category === "공지사항") ?? null;
  const latestNotice = latestNoticePost
    ? {
        title: latestNoticePost.title,
        content: latestNoticePost.content,
        authorName: latestNoticePost.authorName,
      }
    : null;

  const votesByPollOption = new Map<string, number>();
  const selfVotesByPoll = new Map<string, string[]>();
  for (const v of pollVoteRows ?? []) {
    votesByPollOption.set(v.option_id, (votesByPollOption.get(v.option_id) ?? 0) + 1);
    if (v.voter_id === user!.id) {
      const list = selfVotesByPoll.get(v.poll_id) ?? [];
      list.push(v.option_id);
      selfVotesByPoll.set(v.poll_id, list);
    }
  }

  const polls: Poll[] = (pollRows ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    pollType: p.poll_type,
    isAnonymousVote: p.is_anonymous_vote,
    authorName: p.is_anonymous_creator ? null : (nameMap.get(p.created_by) ?? tCommon("unknown")),
    createdAt: p.created_at,
    options: (pollOptionRows ?? [])
      .filter((o) => o.poll_id === p.id)
      .map((o) => ({ id: o.id, label: o.label, count: votesByPollOption.get(o.id) ?? 0 })),
    selfVoteOptionIds: selfVotesByPoll.get(p.id) ?? [],
  }));

  const settingsMembers: SettingsMember[] = members
    .filter((m) => m.id !== user!.id)
    .map((m) => ({ id: m.id, name: m.name, isVice: viceMap.get(m.id) ?? false }));

  const settingsCategories: SettingsCategory[] = categories;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/main"
            className="text-xs text-neutral-400 hover:underline"
          >
            {t("backToPoroom")}
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${paletteDot(room.color)}`} />
            {room.name}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            {RECORD_VISIBILITY_LABEL[room.record_visibility]}
          </span>
          {room.record_visibility === "free" && (
            <ShareRecordsToggle roomId={room.id} initialShare={selfShareRecords} />
          )}
          {!room.is_system && (
            <div className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
              {t("inviteCode")}{" "}
              <span className="font-mono text-neutral-900 dark:text-white">
                {room.invite_code}
              </span>
            </div>
          )}
          {isOwner && (
            <RoomSettingsButton
              roomId={room.id}
              currentName={room.name}
              currentColor={room.color}
              currentTags={room.tags}
              currentJoinType={room.join_type}
              currentRecordVisibility={room.record_visibility}
              members={settingsMembers}
              categories={settingsCategories}
            />
          )}
          <LeaveRoomButton roomId={room.id} selfId={user!.id} />
        </div>
      </div>

      {room.is_system && <SystemRoomLeaveGuard roomId={room.id} />}

      <RoomTabs
        room={
          <RoomView
            roomId={room.id}
            roomName={room.name}
            isSystemRoom={room.is_system}
            selfId={user!.id}
            selfName={selfMember?.name ?? user!.email ?? tCommon("self")}
            members={members}
            recordVisibility={room.record_visibility}
            capacity={room.capacity}
            initialMessages={initialMessages}
            latestNotice={latestNotice}
            dailyRecords={dailyRecords}
            selfTodayChars={selfToday?.chars ?? 0}
            selfTodayFocusMinutes={selfToday?.focusMinutes ?? 0}
            selfTodayGlobalChars={selfTodayGlobalChars}
            selfTodayGoalChars={selfTodayGoalChars}
            initialWorks={works}
          />
        }
        records={<RoomRecordsPanel members={members} dailyRecords={dailyRecords} />}
        calendar={
          <CalendarPanel roomId={room.id} initialEvents={events} categories={categories} />
        }
        poll={
          <PollPanel
            roomId={room.id}
            selfName={selfMember?.name ?? user!.email ?? tCommon("self")}
            initialPolls={polls}
          />
        }
        board={
          <BoardPanel
            roomId={room.id}
            selfId={user!.id}
            selfName={selfMember?.name ?? user!.email ?? tCommon("self")}
            canPostNotice={canPostNotice}
            initialPosts={posts}
          />
        }
      />
    </div>
  );
}
