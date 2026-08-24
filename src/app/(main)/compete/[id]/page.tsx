import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { inRange } from "@/lib/records";
import { ChallengeCard, type ChallengeParticipant } from "../challenge-card";
import { ChallengeRankingBars } from "../challenge-ranking-bars";
import { StartChallengeButton } from "../start-challenge-button";
import { ChallengeSettingsButton } from "./challenge-settings-button";
import { ActivityLogList, type LogEntry } from "./activity-log-list";
import { JoinChallengeButton } from "./join-challenge-button";
import { DraftCheckButton } from "../draft-check-button";
import { ChallengeChatPanel, type ChallengeChatMessage } from "./challenge-chat-panel";
import { ChallengeParticipantCard } from "./challenge-participant-card";
import {
  SYSTEM_CHALLENGE_META,
  ensureSystemChallenge,
  type SystemChallengeKind,
} from "@/lib/system-challenges";
import { todayKst, kstDayRangeUtc } from "@/lib/time";

type ChallengeRow = {
  id: string;
  title: string;
  metric: "chars" | "minutes";
  visibility: "open" | "private";
  invite_code: string | null;
  start_date: string | null;
  end_date: string | null;
  kind: SystemChallengeKind | null;
  created_by: string;
  color: string | null;
  capacity: number | null;
  duration_days: number;
  started_at: string | null;
  is_admin_event: boolean;
};

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  character_id: string | null;
  chat_color: string | null;
};
type RecordRow = {
  user_id: string;
  record_date: string;
  chars: number;
  focus_minutes: number;
};
type LogRow = {
  id: string;
  user_id: string;
  type: LogEntry["type"];
  amount: number | null;
  created_at: string;
};
type ChatMessageRow = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("compete.challengeDetailPage");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS already hides private challenges I'm not a participant/creator of.
  const { data: challenge } = await supabase
    .from("challenges")
    .select(
      "id,title,metric,visibility,invite_code,start_date,end_date,kind,created_by,color,capacity,duration_days,started_at,is_admin_event"
    )
    .eq("id", id)
    .maybeSingle<ChallengeRow>();

  if (!challenge) notFound();

  // 시스템 챌린지는 직접 방문했을 때도(=/compete를 거치지 않고) 주/월
  // 경계가 지났으면 참여 가능 기간을 최신으로 맞춰준다.
  if (challenge.kind) {
    await ensureSystemChallenge(supabase, challenge.kind, user!.id);
  }

  const { data: participantRows } = await supabase
    .from("challenge_participants")
    .select("user_id")
    .eq("challenge_id", id)
    .returns<{ user_id: string | null }[]>();

  const participantIds = (participantRows ?? [])
    .map((p) => p.user_id)
    .filter((v): v is string => Boolean(v));
  const iAmParticipant = participantIds.includes(user!.id);
  const isCreator = challenge.created_by === user!.id;
  const isPending = !challenge.kind && !challenge.started_at;

  // 아직 시작 전이면(대기 상태) 기간 자체가 없으니 로그/기록 범위 조회를
  // 건너뛴다.
  const startTs = challenge.start_date ? kstDayRangeUtc(challenge.start_date).startUtc : null;
  const endTs = challenge.end_date ? kstDayRangeUtc(challenge.end_date).endUtc : null;

  const [{ data: users }, { data: records }, { data: logs }, { data: chatRows }] =
    await Promise.all([
      participantIds.length
        ? supabase
            .from("users")
            .select("id,name,email,character_id,chat_color")
            .in("id", participantIds)
            .returns<UserRow[]>()
        : Promise.resolve({ data: [] as UserRow[] }),
      participantIds.length
        ? supabase
            .from("daily_records")
            .select("user_id,record_date,chars,focus_minutes")
            .in("user_id", participantIds)
            .returns<RecordRow[]>()
        : Promise.resolve({ data: [] as RecordRow[] }),
      iAmParticipant && participantIds.length && startTs && endTs
        ? supabase
            .from("activity_logs")
            .select("id,user_id,type,amount,created_at")
            .in("user_id", participantIds)
            .gte("created_at", startTs)
            .lte("created_at", endTs)
            .order("created_at", { ascending: false })
            .limit(100)
            .returns<LogRow[]>()
        : Promise.resolve({ data: [] as LogRow[] }),
      iAmParticipant
        ? supabase
            .from("challenge_messages")
            .select("id,user_id,content,created_at")
            .eq("challenge_id", id)
            .order("created_at", { ascending: true })
            .limit(50)
            .returns<ChatMessageRow[]>()
        : Promise.resolve({ data: [] as ChatMessageRow[] }),
    ]);

  const userNameMap = new Map((users ?? []).map((u) => [u.id, u.name || u.email]));
  const userCharacterMap = new Map((users ?? []).map((u) => [u.id, u.character_id]));

  const today = todayKst();
  const isDailyKind = challenge.kind === "daily5k" || challenge.kind === "daily10k";
  const isDraftKind = challenge.kind === "monthly_draft";
  const isSystemKind = Boolean(challenge.kind);

  const participants: ChallengeParticipant[] = participantIds.map((uid) => {
    const matching = (records ?? []).filter(
      (r) =>
        r.user_id === uid &&
        (isDailyKind
          ? r.record_date === today
          : challenge.start_date && challenge.end_date
            ? inRange(r.record_date, challenge.start_date, challenge.end_date)
            : false)
    );
    const value = matching.reduce(
      (sum, r) => sum + (challenge.metric === "chars" ? r.chars : r.focus_minutes),
      0
    );
    return { id: uid, name: userNameMap.get(uid) ?? t("unknownUser"), value };
  });

  const monthStart = `${today.slice(0, 7)}-01`;
  const { data: draftLogs } =
    isDraftKind && participantIds.length
      ? await supabase
          .from("activity_logs")
          .select("user_id")
          .in("user_id", participantIds)
          .eq("type", "draft_done")
          .gte("created_at", kstDayRangeUtc(monthStart).startUtc)
          .returns<{ user_id: string }[]>()
      : { data: [] as { user_id: string }[] };
  const draftDoneSet = new Set((draftLogs ?? []).map((r) => r.user_id));
  const myDraftDone = draftDoneSet.has(user!.id);

  const logEntries: LogEntry[] = (logs ?? []).map((l) => ({
    id: l.id,
    userName: userNameMap.get(l.user_id) ?? t("unknownUser"),
    type: l.type,
    amount: l.amount,
    createdAt: l.created_at,
  }));

  const chatMembers = (users ?? []).map((u) => ({
    id: u.id,
    name: userNameMap.get(u.id) ?? t("unknownUser"),
    chatColor: u.chat_color,
  }));
  const chatMessages: ChallengeChatMessage[] = (chatRows ?? []).map((m) => ({
    id: m.id,
    userId: m.user_id,
    content: m.content,
    createdAt: m.created_at,
  }));

  const dailyTarget = challenge.kind ? SYSTEM_CHALLENGE_META[challenge.kind].dailyTarget : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <Link href="/compete" className="text-xs text-neutral-400 hover:underline">
          {t("backLink")}
        </Link>
        {!isSystemKind && isCreator && (
          <ChallengeSettingsButton
            challengeId={challenge.id}
            currentTitle={challenge.title}
            currentColor={challenge.color}
            currentCapacity={challenge.capacity}
            currentDurationDays={challenge.duration_days}
            started={Boolean(challenge.started_at)}
          />
        )}
      </div>

      {isSystemKind ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">
              {challenge.title}
            </span>
            <span className="text-[12px] text-neutral-400">
              {SYSTEM_CHALLENGE_META[challenge.kind!].resetLabel}
              {dailyTarget && t("dailyTargetSuffix", { target: dailyTarget.toLocaleString() })}
            </span>
          </div>
          {isDraftKind && iAmParticipant && <DraftCheckButton alreadyDone={myDraftDone} />}
        </div>
      ) : (
        <ChallengeCard
          id={challenge.id}
          title={challenge.title}
          metric={challenge.metric}
          visibility={challenge.visibility}
          inviteCode={challenge.invite_code}
          startDate={challenge.start_date}
          endDate={challenge.end_date}
          durationDays={challenge.duration_days}
          color={challenge.color}
          participants={participants}
          linkable={false}
          showRanking={false}
          startSlot={
            isPending && isCreator ? (
              <StartChallengeButton challengeId={challenge.id} participantCount={participantIds.length} />
            ) : undefined
          }
        />
      )}

      {!iAmParticipant && challenge.visibility === "open" && (
        <JoinChallengeButton challengeId={challenge.id} />
      )}

      {iAmParticipant && (
        <div className={`grid grid-cols-1 gap-4 ${isSystemKind ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
          <ChallengeChatPanel
            challengeId={challenge.id}
            selfId={user!.id}
            members={chatMembers}
            initialMessages={chatMessages}
          />
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              {isSystemKind ? t("feedHeading") : t("logHeading")}
            </h2>
            <div className="h-[420px] overflow-y-auto">
              <ActivityLogList entries={logEntries} />
            </div>
          </section>
          {!isSystemKind && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {t("participantsHeading")}
              </h2>
              <ChallengeRankingBars participants={participants} metric={challenge.metric} />
            </section>
          )}
        </div>
      )}

      {isSystemKind && participants.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {t("participantsHeading")}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {participants.map((p) => (
              <ChallengeParticipantCard
                key={p.id}
                name={p.name}
                characterId={userCharacterMap.get(p.id) ?? null}
                chars={isDraftKind ? undefined : p.value}
                target={dailyTarget}
                achieved={isDraftKind ? draftDoneSet.has(p.id) : p.value >= (dailyTarget ?? Infinity)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
