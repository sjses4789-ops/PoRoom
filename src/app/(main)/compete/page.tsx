import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { inRange } from "@/lib/records";
import { PageAdRail } from "@/components/page-ad-rail";
import CreateChallengeButton from "./create-challenge-button";
import JoinByCodeButton from "./join-by-code-button";
import { ChallengeCard, type ChallengeParticipant } from "./challenge-card";
import { OpenChallengeCard } from "./open-challenge-card";
import { OpenSystemChallengeCard } from "./open-system-challenge-card";
import { JoinedSystemChallengeCard } from "./joined-system-challenge-card";
import {
  ensureSystemChallenge,
  SYSTEM_CHALLENGE_META,
  SYSTEM_CHALLENGE_CARD_BG,
  type SystemChallengeKind,
} from "@/lib/system-challenges";

const ADMIN_EVENT_CARD_BG = "bg-[#faf0f0] dark:bg-[#2a1c1c]";
import { todayKst, kstDayRangeUtc } from "@/lib/time";

const SYSTEM_CHALLENGE_KINDS: SystemChallengeKind[] = ["daily5k", "daily10k", "monthly_draft"];

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
  target_position: string | null;
};

type ParticipantRow = {
  challenge_id: string;
  user_id: string | null;
  room_id: string | null;
};

type UserRow = { id: string; name: string | null; email: string };
type RecordRow = {
  user_id: string;
  record_date: string;
  chars: number;
  focus_minutes: number;
};

const CHALLENGE_SELECT =
  "id,title,metric,visibility,invite_code,start_date,end_date,kind,created_by,color,capacity,duration_days,started_at,is_admin_event,target_position";

export default async function CompetePage() {
  const t = await getTranslations("compete.page");
  const tMeta = await getTranslations("compete.systemChallengeMeta");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 애드센스 심사 기간 동안 비로그인 방문자도 이 목록을 볼 수 있게
  // 열어뒀다 — "내 것" 관련 조회/자동 참여는 selfId가 없으면 건너뛴다.
  const selfId = user?.id ?? null;

  // 반복형 시스템 챌린지(5천자/1만자/초단 완고)가 아직 없으면 만들고,
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
      .order("created_at", { ascending: false })
      .limit(40)
      .returns<ChallengeRow[]>(),
    supabase
      .from("challenges")
      .select(CHALLENGE_SELECT)
      .not("kind", "is", null)
      .returns<ChallengeRow[]>(),
  ]);
  const challenges = [...(userChallenges ?? []), ...(systemChallenges ?? [])];

  const challengeIds = (challenges ?? []).map((c) => c.id);

  const today = todayKst();
  const monthStart = `${today.slice(0, 7)}-01`;

  const [{ data: participants }, { data: users }, { data: records }, { data: draftLogs }] =
    await Promise.all([
      challengeIds.length
        ? supabase
            .from("challenge_participants")
            .select("challenge_id,user_id,room_id")
            .in("challenge_id", challengeIds)
            .returns<ParticipantRow[]>()
        : Promise.resolve({ data: [] as ParticipantRow[] }),
      supabase.from("users").select("id,name,email").returns<UserRow[]>(),
      supabase
        .from("daily_records")
        .select("user_id,record_date,chars,focus_minutes")
        .returns<RecordRow[]>(),
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

  const userNameMap = new Map((users ?? []).map((u) => [u.id, u.name || u.email]));

  const participantsByChallenge = new Map<string, ParticipantRow[]>();
  for (const p of participants ?? []) {
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
              ? (records ?? []).filter(
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

  // 대결방을 삭제하는 대신(예전엔 3일 뒤 자동 삭제였다가, 그 삭제 로직이
  // 관리자 세션에서 전체 challenges 테이블을 지워버리는 사고로 이어져
  // 제거했다) 기간이 끝난 대결은 그냥 목록 맨 아래로 밀어낸다.
  const isEnded = (c: ChallengeRow) => Boolean(c.end_date && today > c.end_date);
  const sortEndedLast = <T extends ChallengeRow>(list: T[]) =>
    [...list].sort((a, b) => Number(isEnded(a)) - Number(isEnded(b)));

  const joinedChallenges = sortEndedLast(joined.filter((c) => !c.kind && !c.is_admin_event));
  const joinedSystemChallenges = joined.filter((c) => c.kind !== null || c.is_admin_event);
  const openChallenges = sortEndedLast(openToJoin.filter((c) => !c.kind && !c.is_admin_event));
  const openSystemChallenges = openToJoin.filter((c) => c.kind !== null || c.is_admin_event);

  const myTodayChars = selfId
    ? (records ?? [])
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
                      inviteCode={c.invite_code}
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
        </div>
      </div>
    </div>
    </PageAdRail>
  );
}
