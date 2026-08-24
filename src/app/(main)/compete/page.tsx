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
import { StartChallengeButton } from "./start-challenge-button";
import {
  ensureSystemChallenge,
  SYSTEM_CHALLENGE_META,
  type SystemChallengeKind,
} from "@/lib/system-challenges";
import { todayKst, kstDayRangeUtc } from "@/lib/time";

const SYSTEM_CHALLENGE_KINDS: SystemChallengeKind[] = ["daily5k", "daily10k", "monthly_draft"];

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
  "id,title,metric,visibility,invite_code,start_date,end_date,kind,created_by,color,capacity,duration_days,started_at,is_admin_event";

export default async function CompetePage() {
  const t = await getTranslations("compete.page");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 반복형 시스템 챌린지(5천자/1만자/초단 완고)가 아직 없으면 만들고,
  // 주/월 경계를 넘었으면 기간을 새로 갱신한다.
  await Promise.all(
    SYSTEM_CHALLENGE_KINDS.map((kind) => ensureSystemChallenge(supabase, kind, user!.id))
  );

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
      supabase
        .from("activity_logs")
        .select("id")
        .eq("user_id", user!.id)
        .eq("type", "draft_done")
        .gte("created_at", kstDayRangeUtc(monthStart).startUtc)
        .limit(1),
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
    const iAmIn = rows.some((r) => r.user_id === user!.id);

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

  const joinedChallenges = joined.filter((c) => !c.kind && !c.is_admin_event);
  const joinedSystemChallenges = joined.filter((c) => c.kind !== null || c.is_admin_event);
  const openChallenges = openToJoin.filter((c) => !c.kind && !c.is_admin_event);
  const openSystemChallenges = openToJoin.filter((c) => c.kind !== null || c.is_admin_event);

  const myTodayChars = (records ?? [])
    .filter((r) => r.user_id === user!.id && r.record_date === today)
    .reduce((sum, r) => sum + r.chars, 0);

  const draftDoneThisMonth = (draftLogs ?? []).length > 0;

  return (
    <PageAdRail>
    <div className="flex flex-col gap-8">
      <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
        {t("title")}
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {t("joinedHeading")}
          </h2>
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
                  startSlot={
                    !c.started_at && c.created_by === user!.id ? (
                      <StartChallengeButton challengeId={c.id} participantCount={c.participantCount} />
                    ) : undefined
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {t("joinedSystemHeading")}
          </h2>
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
                    title={meta?.title ?? c.title}
                    subLabel={meta?.resetLabel ?? t("adminEventLabel")}
                    startDate={c.start_date ?? today}
                    endDate={c.end_date ?? today}
                    myTodayChars={myTodayChars}
                    dailyTarget={meta?.dailyTarget}
                    draftDoneThisMonth={c.kind === "monthly_draft" ? draftDoneThisMonth : undefined}
                    isAdminEvent={c.is_admin_event}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              {t("openHeading")}
            </h2>
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
                  startDate={c.start_date}
                  endDate={c.end_date}
                  participantCount={c.participantCount}
                />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {t("openSystemHeading")}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {openSystemChallenges.map((c) => {
              const meta = c.kind ? SYSTEM_CHALLENGE_META[c.kind] : null;
              return (
                <OpenSystemChallengeCard
                  key={c.id}
                  id={c.id}
                  title={meta?.title ?? c.title}
                  subLabel={meta?.resetLabel ?? t("adminEventLabel")}
                  startDate={c.start_date ?? today}
                  endDate={c.end_date ?? today}
                  participantCount={c.participantCount}
                  dailyTarget={meta?.dailyTarget}
                  isAdminEvent={c.is_admin_event}
                />
              );
            })}
          </div>
        </section>
      </div>
    </div>
    </PageAdRail>
  );
}
