import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { inRange } from "@/lib/records";
import { fetchAllPages } from "@/lib/paginate";
import { PageAdRail } from "@/components/page-ad-rail";
import CreateChallengeButton from "./create-challenge-button";
import JoinByCodeButton from "./join-by-code-button";
import { ChallengeCard, type ChallengeParticipant } from "./challenge-card";
import { OpenChallengeCard } from "./open-challenge-card";
import { OpenSystemChallengeCard } from "./open-system-challenge-card";
import { JoinedSystemChallengeCard } from "./joined-system-challenge-card";
import { EndedChallengeCard } from "./ended-challenge-card";
import {
  ensureSystemChallenge,
  SYSTEM_CHALLENGE_META,
  SYSTEM_CHALLENGE_CARD_BG,
  type SystemChallengeKind,
} from "@/lib/system-challenges";

const ADMIN_EVENT_CARD_BG = "bg-[#faf0f0] dark:bg-[#2a1c1c]";
import { todayKst, kstDayRangeUtc } from "@/lib/time";
import { getDemoData, shouldShowDemoData, withoutDemoIds } from "@/lib/demo-data";

const SYSTEM_CHALLENGE_KINDS: SystemChallengeKind[] = ["daily1k", "daily5k", "daily10k", "monthly_draft"];

type ChallengeRow = {
  id: string;
  title: string;
  metric: "chars" | "minutes" | "achievement";
  visibility: "open" | "private";
  start_date: string | null;
  end_date: string | null;
  kind: SystemChallengeKind | null;
  created_by: string;
  color: string | null;
  capacity: number | null;
  duration_days: number;
  started_at: string | null;
  is_admin_event: boolean;
  target_position: string | null;
};

type ParticipantRow = {
  challenge_id: string;
  user_id: string | null;
  room_id: string | null;
};

type UserRow = { id: string; name: string | null };
type RecordRow = {
  user_id: string;
  record_date: string;
  chars: number;
  focus_minutes: number;
};

// invite_code는 여기서 같이 안 가져온다 — anon(비로그인) 롤은 이 컬럼을
// 아예 못 읽어서(다른 사람의 비공개 대결 초대코드가 익명 API 요청으로
// 새어나가지 않도록 하는 조치), 같이 요청하면 쿼리 전체가 실패한다.
// 로그인한 사용자가 실제 참여 중인 비공개 대결의 초대코드는 아래에서
// 별도 쿼리로 가져온다.
const CHALLENGE_SELECT =
  "id,title,metric,visibility,start_date,end_date,kind,created_by,color,capacity,duration_days,started_at,is_admin_event,target_position";

export default async function CompetePage() {
  const t = await getTranslations("compete.page");
  const tMeta = await getTranslations("compete.systemChallengeMeta");
  const tDuel = await getTranslations("compete.openChallengeCard");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 애드센스 심사 기간 동안 비로그인 방문자도 이 목록을 볼 수 있게
  // 열어뒀다 — "내 것" 관련 조회/자동 참여는 selfId가 없으면 건너뛴다.
  const selfId = user?.id ?? null;

  // 반복형 시스템 챌린지(1천자/5천자/1만자/초단 완고)가 아직 없으면 만들고,
  // 주/월 경계를 넘었으면 기간을 새로 갱신한다.
  if (selfId) {
    await Promise.all(
      SYSTEM_CHALLENGE_KINDS.map((kind) => ensureSystemChallenge(supabase, kind, selfId))
    );
  }

  // RLS already limits this to challenges that are open, or that I created,
  // or that I'm already a participant of. 시스템 챌린지(관리자 임시
  // 이벤트 포함)는 오래된 created_at을 가진 영구/장기 행이라 개수 제한과
  // 별도로 조회한다. kind가 없어도 is_admin_event=true인 행은 "챌린지"
  // 쪽으로 묶어야 해서 나중에 JS에서 다시 나눈다.
  const [{ data: userChallenges }, { data: systemChallenges }] = await Promise.all([
    supabase
      .from("challenges")
      .select(CHALLENGE_SELECT)
      .is("kind", null)
      // 비로그인(anon) 롤은 created_at 컬럼을 읽을 권한이 없어서 이 컬럼으로 정렬하면 쿼리 전체가 실패한다
      // (이벤트 챌린지 목록이 통째로 비어 보이던 원인) — 비로그인일 땐 읽을 수 있는 시작일로 정렬한다.
      .order(selfId ? "created_at" : "start_date", { ascending: false, nullsFirst: true })
      .limit(40)
      .returns<ChallengeRow[]>(),
    supabase
      .from("challenges")
      .select(CHALLENGE_SELECT)
      .not("kind", "is", null)
      .returns<ChallengeRow[]>(),
  ]);
  // 심사 기간 비로그인 방문자에게는 실제 대결 뒤에 예시 대결(과 참가자/
  // 기록)을 덧붙인다 — DB에는 아무것도 쓰지 않는다(src/lib/demo-data.ts 참고).
  const demo = shouldShowDemoData(user) ? getDemoData() : null;
  const challenges: ChallengeRow[] = [
    ...(userChallenges ?? []),
    ...(systemChallenges ?? []),
    ...(demo?.challenges ?? []),
  ];

  const challengeIds = (challenges ?? []).map((c) => c.id);

  const today = todayKst();
  const monthStart = `${today.slice(0, 7)}-01`;

  // 예시 대결 id는 uuid가 아니라서 DB 조회에는 실제 id만 보낸다.
  const realChallengeIds = withoutDemoIds(challengeIds);

  const [{ data: realParticipants }, { data: draftLogs }] = await Promise.all([
    realChallengeIds.length
      ? supabase
          .from("challenge_participants")
          .select("challenge_id,user_id,room_id")
          .in("challenge_id", realChallengeIds)
          .returns<ParticipantRow[]>()
      : Promise.resolve({ data: [] as ParticipantRow[] }),
    selfId
      ? supabase
          .from("activity_logs")
          .select("id")
          .eq("user_id", selfId)
          .eq("type", "draft_done")
          .gte("created_at", kstDayRangeUtc(monthStart).startUtc)
          .limit(1)
      : Promise.resolve({ data: [] as { id: string }[] }),
  ]);

  // 이름/기록은 내가 참여 중인 대결·챌린지의 참가자 것만 필요하다 — 사이트 전체를 가져오면 조회 상한(1000행)에
  // 걸려 값이 틀려진다. 기록은 그 챌린지들의 가장 이른 시작일부터만 읽는다.
  const myChallengeIds = new Set(
    selfId ? (realParticipants ?? []).filter((r) => r.user_id === selfId).map((r) => r.challenge_id) : []
  );
  const neededUserIds = Array.from(
    new Set([
      ...(realParticipants ?? [])
        .filter((r) => myChallengeIds.has(r.challenge_id) && r.user_id)
        .map((r) => r.user_id as string),
      ...(selfId ? [selfId] : []),
    ])
  );
  const recordsFrom = [
    today,
    ...challenges.filter((c) => myChallengeIds.has(c.id) && c.start_date).map((c) => c.start_date as string),
  ].sort()[0];
  const [realUsers, realRecords] = await Promise.all([
    neededUserIds.length
      ? fetchAllPages<UserRow>((from, to) =>
          supabase
            .from("users")
            .select("id,name")
            .in("id", neededUserIds)
            .order("id")
            .range(from, to)
            .returns<UserRow[]>()
        )
      : Promise.resolve([] as UserRow[]),
    neededUserIds.length
      ? fetchAllPages<RecordRow>((from, to) =>
          supabase
            .from("daily_records")
            .select("user_id,record_date,chars,focus_minutes")
            .in("user_id", neededUserIds)
            .gte("record_date", recordsFrom)
            .order("record_date")
            .order("user_id")
            .order("room_id")
            .range(from, to)
            .returns<RecordRow[]>()
        )
      : Promise.resolve([] as RecordRow[]),
  ]);

  const participants: ParticipantRow[] = [
    ...(realParticipants ?? []),
    ...(demo?.challengeParticipants ?? []),
  ];
  const users: UserRow[] = [...realUsers, ...(demo?.users ?? [])];
  const records: RecordRow[] = [...realRecords, ...(demo?.records ?? [])];

  const userNameMap = new Map(users.map((u) => [u.id, u.name || t("unknownUser")]));

  const participantsByChallenge = new Map<string, ParticipantRow[]>();
  for (const p of participants) {
    const list = participantsByChallenge.get(p.challenge_id) ?? [];
    list.push(p);
    participantsByChallenge.set(p.challenge_id, list);
  }

  const joined: Array<ChallengeRow & { participants: ChallengeParticipant[]; participantCount: number }> = [];
  const openToJoin: Array<ChallengeRow & { participantCount: number }> = [];

  for (const c of challenges) {
    const rows = participantsByChallenge.get(c.id) ?? [];
    const iAmIn = selfId ? rows.some((r) => r.user_id === selfId) : false;

    if (iAmIn) {
      const participantList: ChallengeParticipant[] = rows
        .filter((r) => r.user_id)
        .map((r) => {
          const matching =
            c.start_date && c.end_date
              ? records.filter(
                  (rec) =>
                    rec.user_id === r.user_id &&
                    inRange(rec.record_date, c.start_date!, c.end_date!)
                )
              : [];
          const value = matching.reduce(
            (sum, rec) => sum + (c.metric === "chars" ? rec.chars : rec.focus_minutes),
            0
          );
          return {
            id: r.user_id!,
            name: userNameMap.get(r.user_id!) ?? t("unknownUser"),
            value,
          };
        });
      joined.push({ ...c, participants: participantList, participantCount: rows.length });
    } else if (c.visibility === "open") {
      openToJoin.push({ ...c, participantCount: rows.length });
    }
  }

  // 초대코드는 내가 실제로 참여 중인 비공개 대결만 별도로 조회한다(anon
  // 롤은 이 컬럼을 아예 못 읽으므로 비로그인 방문자는 joined 자체가
  // 항상 비어 있어 자동으로 스킵됨).
  const joinedPrivateIds = joined.filter((c) => c.visibility === "private").map((c) => c.id);
  const { data: inviteCodeRows } = joinedPrivateIds.length
    ? await supabase
        .from("challenges")
        .select("id,invite_code")
        .in("id", joinedPrivateIds)
        .returns<{ id: string; invite_code: string | null }[]>()
    : { data: [] as { id: string; invite_code: string | null }[] };
  const inviteCodeByChallengeId = new Map((inviteCodeRows ?? []).map((r) => [r.id, r.invite_code]));

  // 대결방을 삭제하는 대신(예전엔 3일 뒤 자동 삭제였다가, 그 삭제 로직이
  // 관리자 세션에서 전체 challenges 테이블을 지워버리는 사고로 이어져
  // 제거했다) 기간이 끝난 대결은 그냥 목록 맨 아래로 밀어낸다.
  const isEnded = (c: ChallengeRow) => Boolean(c.end_date && today > c.end_date);

  // 기간이 지난 대결은 "참여 중/참여 가능" 목록에서 빼고 맨 아래 "종료된 대결 목록"에 모은다.
  const joinedChallenges = joined.filter((c) => !c.kind && !c.is_admin_event && !isEnded(c));
  // 기간이 지난 관리자 챌린지(이벤트)는 진행 중 목록에서 빼고 맨 아래 "종료된 챌린지 목록"에 모은다.
  // 반복형 시스템 챌린지(kind)는 주/월마다 기간이 갱신되므로 여기에 해당하지 않는다.
  const isEndedAdminEvent = (c: ChallengeRow) =>
    c.is_admin_event && Boolean(c.end_date && today > c.end_date);

  // 시스템 챌린지는 1천자 → 5천자 → 1만자 → 초단 완고 순으로 보여 준다(관리자 이벤트는 맨 위).
  const kindOrder = (c: ChallengeRow) => (c.kind ? SYSTEM_CHALLENGE_KINDS.indexOf(c.kind) : -1);
  const byKindOrder = <T extends ChallengeRow>(list: T[]) =>
    [...list].sort((x, y) => kindOrder(x) - kindOrder(y));

  const joinedSystemChallenges = byKindOrder(
    joined.filter((c) => (c.kind !== null || c.is_admin_event) && !isEndedAdminEvent(c))
  );
  const openChallenges = openToJoin.filter((c) => !c.kind && !c.is_admin_event && !isEnded(c));
  const endedDuels = challenges
    .filter((c) => !c.kind && !c.is_admin_event && isEnded(c))
    .map((c) => {
      const rows = participantsByChallenge.get(c.id) ?? [];
      return {
        ...c,
        participantCount: rows.length,
        iJoined: selfId ? rows.some((r) => r.user_id === selfId) : false,
      };
    })
    .sort((a, b) => (b.end_date ?? "").localeCompare(a.end_date ?? ""));
  const openSystemChallenges = byKindOrder(
    openToJoin.filter((c) => (c.kind !== null || c.is_admin_event) && !isEndedAdminEvent(c))
  );
  const endedAdminChallenges = challenges
    .filter(isEndedAdminEvent)
    .map((c) => {
      const rows = participantsByChallenge.get(c.id) ?? [];
      return {
        ...c,
        participantCount: rows.length,
        iJoined: selfId ? rows.some((r) => r.user_id === selfId) : false,
      };
    })
    .sort((a, b) => (b.end_date ?? "").localeCompare(a.end_date ?? ""));

  const myTodayChars = selfId
    ? records
        .filter((r) => r.user_id === selfId && r.record_date === today)
        .reduce((sum, r) => sum + r.chars, 0)
    : 0;

  const draftDoneThisMonth = (draftLogs ?? []).length > 0;

  return (
    <PageAdRail>
    <div className="flex flex-col gap-8">
      <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
        {t("title")}
      </h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            {t("duelTab")}
          </h2>
          <section className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {t("joinedHeading")}
              </h3>
              {joinedChallenges.length === 0 ? (
                <p className="text-xs text-neutral-400">
                  {t("joinedEmpty")}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {joinedChallenges.map((c) => (
                    <ChallengeCard
                      key={c.id}
                      id={c.id}
                      title={c.title}
                      metric={c.metric}
                      visibility={c.visibility}
                      inviteCode={inviteCodeByChallengeId.get(c.id) ?? null}
                      startDate={c.start_date}
                      endDate={c.end_date}
                      durationDays={c.duration_days}
                      color={c.color}
                      participants={c.participants}
                      targetPosition={
                        c.target_position === "novelist" || c.target_position === "webtoon"
                          ? c.target_position
                          : null
                      }
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {t("openHeading")}
                </h3>
                <div className="flex gap-2">
                  <CreateChallengeButton />
                  <JoinByCodeButton />
                </div>
              </div>
              {openChallenges.length === 0 ? (
                <p className="text-xs text-neutral-400">
                  {t("openEmpty")}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {openChallenges.map((c) => (
                    <OpenChallengeCard
                      key={c.id}
                      id={c.id}
                      title={c.title}
                      metric={c.metric}
                      targetPosition={
                        c.target_position === "novelist" || c.target_position === "webtoon"
                          ? c.target_position
                          : null
                      }
                      startDate={c.start_date}
                      endDate={c.end_date}
                      participantCount={c.participantCount}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {t("endedDuelHeading")}
              </h3>
              {endedDuels.length === 0 ? (
                <p className="text-xs text-neutral-400">{t("endedDuelEmpty")}</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {endedDuels.map((c) => (
                    <EndedChallengeCard
                      key={c.id}
                      href={c.iJoined ? `/compete/${c.id}` : undefined}
                      title={c.title}
                      subLabel={
                        c.metric === "chars"
                          ? c.target_position === "webtoon"
                            ? tDuel("metricCuts")
                            : tDuel("metricChars")
                          : c.metric === "minutes"
                            ? tDuel("metricMinutes")
                            : tDuel("metricAchievement")
                      }
                      startDate={c.start_date ?? ""}
                      endDate={c.end_date ?? ""}
                      participantsLabel={t("endedParticipants", { count: c.participantCount })}
                      endedBadge={t("endedBadge")}
                      joinedBadge={c.iJoined ? t("endedJoinedBadge") : null}
                      bgClass="bg-white dark:bg-neutral-900"
                    />
                  ))}
                </div>
              )}
            </section>
        </div>

        <div className="flex flex-col gap-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            {t("challengeTab")}
          </h2>
          <section className="flex flex-col gap-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {t("joinedSystemHeading")}
                </h3>
                <span className="text-[11px] text-neutral-400">{t("resetHint")}</span>
              </div>
              {joinedSystemChallenges.length === 0 ? (
                <p className="text-xs text-neutral-400">
                  {t("joinedSystemEmpty")}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {joinedSystemChallenges.map((c) => {
                    const meta = c.kind ? SYSTEM_CHALLENGE_META[c.kind] : null;
                    return (
                      <JoinedSystemChallengeCard
                        key={c.id}
                        id={c.id}
                        title={c.kind ? tMeta(`${c.kind}.title`) : c.title}
                        subLabel={c.kind ? tMeta(`${c.kind}.resetLabel`) : t("adminEventLabel")}
                        startDate={c.start_date ?? today}
                        endDate={c.end_date ?? today}
                        myTodayChars={myTodayChars}
                        dailyTarget={meta?.dailyTarget}
                        draftDoneThisMonth={c.kind === "monthly_draft" ? draftDoneThisMonth : undefined}
                        bgClass={c.kind ? SYSTEM_CHALLENGE_CARD_BG[c.kind] : ADMIN_EVENT_CARD_BG}
                        isAdminEvent={c.is_admin_event}
                      />
                    );
                  })}
                </div>
              )}
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {t("openSystemHeading")}
                </h3>
                <span className="text-[11px] text-neutral-400">{t("resetHint")}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {openSystemChallenges.map((c) => {
                  const meta = c.kind ? SYSTEM_CHALLENGE_META[c.kind] : null;
                  return (
                    <OpenSystemChallengeCard
                      key={c.id}
                      id={c.id}
                      title={c.kind ? tMeta(`${c.kind}.title`) : c.title}
                      subLabel={c.kind ? tMeta(`${c.kind}.resetLabel`) : t("adminEventLabel")}
                      startDate={c.start_date ?? today}
                      endDate={c.end_date ?? today}
                      participantCount={c.participantCount}
                      dailyTarget={meta?.dailyTarget}
                      bgClass={c.kind ? SYSTEM_CHALLENGE_CARD_BG[c.kind] : ADMIN_EVENT_CARD_BG}
                      isAdminEvent={c.is_admin_event}
                    />
                  );
                })}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {t("endedHeading")}
              </h3>
              {endedAdminChallenges.length === 0 ? (
                <p className="text-xs text-neutral-400">{t("endedEmpty")}</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {endedAdminChallenges.map((c) => (
                    <EndedChallengeCard
                      key={c.id}
                      title={c.title}
                      subLabel={t("adminEventLabel")}
                      startDate={c.start_date ?? ""}
                      endDate={c.end_date ?? ""}
                      participantsLabel={t("endedParticipants", { count: c.participantCount })}
                      endedBadge={t("endedBadge")}
                      joinedBadge={c.iJoined ? t("endedJoinedBadge") : null}
                      bgClass={ADMIN_EVENT_CARD_BG}
                    />
                  ))}
                </div>
              )}
            </section>
        </div>
      </div>
    </div>
    </PageAdRail>
  );
}
