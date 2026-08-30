import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { inRange } from "@/lib/records";
import { ChallengeCard, type ChallengeParticipant } from "../challenge-card";
import { ChallengeRankingBars } from "../challenge-ranking-bars";
import { AchievementRoster } from "./achievement-roster";
import { StartChallengeButton } from "../start-challenge-button";
import { ChallengeSettingsButton } from "./challenge-settings-button";
import { ActivityLogList, type LogEntry } from "./activity-log-list";
import { JoinChallengeButton } from "./join-challenge-button";
import { DraftCheckButton } from "../draft-check-button";
import { ChallengeChatPanel, type ChallengeChatMessage } from "./challenge-chat-panel";
import { ChallengeParticipantCard } from "./challenge-participant-card";
import { PosterViewButton } from "./poster-view-button";
import { LeaveChallengeButton } from "./leave-challenge-button";
import { AchieversList, type Achiever } from "./achievers-list";
import {
  SYSTEM_CHALLENGE_META,
  ensureSystemChallenge,
  type SystemChallengeKind,
} from "@/lib/system-challenges";
import { todayKst, kstDayRangeUtc } from "@/lib/time";

type ChallengeRow = {
  id: string;
  title: string;
  metric: "chars" | "minutes" | "achievement";
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
  start_mode: "manual" | "full";
  target_position: string | null;
  poster_image_url: string | null;
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
  const tMeta = await getTranslations("compete.systemChallengeMeta");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS already hides private challenges I'm not a participant/creator of.
  const { data: challenge } = await supabase
    .from("challenges")
    .select(
      "id,title,metric,visibility,invite_code,start_date,end_date,kind,created_by,color,capacity,duration_days,started_at,is_admin_event,start_mode,target_position,poster_image_url"
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
    .select("user_id,achieved,achieved_at")
    .eq("challenge_id", id)
    .returns<{ user_id: string | null; achieved: boolean; achieved_at: string | null }[]>();

  const participantIds = (participantRows ?? [])
    .map((p) => p.user_id)
    .filter((v): v is string => Boolean(v));
  const achievedByUser = new Map(
    (participantRows ?? [])
      .filter((p): p is { user_id: string; achieved: boolean; achieved_at: string | null } =>
        Boolean(p.user_id)
      )
      .map((p) => [p.user_id, p.achieved])
  );
  const achievedAtByUser = new Map(
    (participantRows ?? [])
      .filter(
        (p): p is { user_id: string; achieved: boolean; achieved_at: string } =>
          Boolean(p.user_id) && p.achieved && Boolean(p.achieved_at)
      )
      .map((p) => [p.user_id, p.achieved_at])
  );
  const iAmParticipant = participantIds.includes(user!.id);
  const isCreator = challenge.created_by === user!.id;
  const isPending = !challenge.kind && !challenge.started_at;
  const isAchievementMetric = challenge.metric === "achievement";

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
  const achievers: Achiever[] = Array.from(achievedAtByUser.entries())
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([uid, achievedAt]) => ({
      id: uid,
      name: userNameMap.get(uid) ?? t("unknownUser"),
      achievedAt,
    }));

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

  // focus_recorded는 실제 뽀모도로 진행 중 1분마다 남는 기록이라(출석일
  // 계산엔 계속 쓰지만) 피드에 그대로 보여주면 1분마다 "n분 집중했어요"가
  // 계속 쌓여 시끄럽고, 심지어 이 챌린지와 무관한 다른 방에서 집중한
  // 기록까지 섞여 보인다 — 피드에는 실제로 의미 있는 시작/집필 활동만
  // 보여준다.
  const logEntries: LogEntry[] = (logs ?? [])
    .filter((l) => l.type !== "focus_recorded")
    .map((l) => ({
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
  // 1:1 대결(시스템 챌린지·관리자 이벤트 제외)이 기간이 끝났으면, 3일
  // 뒤 자동으로 방이 사라진다는 안내를 보여준다(참여자 개인 기록은
  // 남아있으니 걱정하지 말라는 문구 포함).
  const isEndedDuel =
    !isSystemKind && !challenge.is_admin_event && challenge.end_date !== null && today > challenge.end_date;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/compete" className="text-xs text-neutral-400 hover:underline">
          {t("backLink")}
        </Link>
        <div className="flex items-center gap-1.5">
          {challenge.poster_image_url && <PosterViewButton imageUrl={challenge.poster_image_url} />}
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
          {iAmParticipant && <LeaveChallengeButton challengeId={challenge.id} />}
        </div>
      </div>

      {isSystemKind ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-400 p-4 dark:border-neutral-600">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">
              {challenge.kind ? tMeta(`${challenge.kind}.title`) : challenge.title}
            </span>
            <span className="text-[12px] text-neutral-400">
              {challenge.kind ? tMeta(`${challenge.kind}.resetLabel`) : ""}
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
          targetPosition={
            challenge.target_position === "novelist" || challenge.target_position === "webtoon"
              ? challenge.target_position
              : null
          }
          startSlot={
            isPending && isCreator ? (
              challenge.start_mode === "full" ? (
                <p className="text-[11px] text-neutral-400">{t("waitingForFull")}</p>
              ) : (
                <StartChallengeButton challengeId={challenge.id} participantCount={participantIds.length} />
              )
            ) : undefined
          }
        />
      )}

      {isEndedDuel && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-[12px] text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-400">
          {t("expiryBanner")}
        </p>
      )}

      {!iAmParticipant && challenge.visibility === "open" && (
        <JoinChallengeButton challengeId={challenge.id} />
      )}

      {iAmParticipant && (
        // 채팅·로그(·참여자) 열이 각자 따로 테두리를 두르던 예전 방식은
        // 채팅은 전체 영역에 테두리가 있는데 로그는 안쪽 목록에만 테두리가
        // 있어 높이도 선도 어긋나 보였다 — [개인] 페이지의 출석일/할일/
        // 목표현황처럼 하나의 카드를 divide-x로 나눠 쓰는 표 형식으로
        // 통일해서, 테두리 하나를 셋이 공유하고 높이도 자동으로 맞는다.
        <div
          className={`grid grid-cols-1 divide-y divide-neutral-400 overflow-hidden rounded-md border border-neutral-400 dark:divide-neutral-600 dark:border-neutral-600 ${
            isSystemKind ? "lg:grid-cols-2 lg:divide-x lg:divide-y-0" : "lg:grid-cols-3 lg:divide-x lg:divide-y-0"
          }`}
        >
          <div className="p-4">
            <ChallengeChatPanel
              challengeId={challenge.id}
              selfId={user!.id}
              members={chatMembers}
              initialMessages={chatMessages}
            />
          </div>
          <div className="flex flex-col gap-3 p-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              {isSystemKind ? t("feedHeading") : t("logHeading")}
            </h2>
            {/* flex-1(그리드가 채팅 쪽 높이에 맞춰 셀을 늘려주는 것)로는
                안 된다 — 로그 항목이 많아지면 grid의 auto 행 높이 계산이
                이 셀의 실제(늘어난) 내용 높이를 기준으로 잡아버려서, 결국
                채팅까지 포함한 행 전체가 로그 길이만큼 늘어져버린다.
                채팅 쪽 열의 실제 높이(제목+메시지창 340px+입력창+광고
                자리)와 맞춘 고정 높이를 줘야 항상 서로 높이가 같다. */}
            <div className="h-[460px] overflow-y-auto">
              <ActivityLogList entries={logEntries} />
            </div>
          </div>
          {!isSystemKind && (
            <div className="flex flex-col gap-3 p-4">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {t("participantsHeading")}
              </h2>
              {isAchievementMetric ? (
                <AchievementRoster
                  challengeId={challenge.id}
                  selfId={user!.id}
                  participants={participantIds.map((uid) => ({
                    id: uid,
                    name: userNameMap.get(uid) ?? t("unknownUser"),
                    achieved: achievedByUser.get(uid) ?? false,
                  }))}
                />
              ) : (
                <ChallengeRankingBars
                  participants={participants}
                  metric={challenge.metric}
                  targetPosition={
                    challenge.target_position === "novelist" ||
                    challenge.target_position === "webtoon"
                      ? challenge.target_position
                      : null
                  }
                />
              )}
            </div>
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

      {isAchievementMetric && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {t("achieversHeading")}
          </h2>
          <AchieversList achievers={achievers} />
        </section>
      )}
    </div>
  );
}
