import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { todayKst } from "@/lib/time";
import { paletteBg } from "@/lib/palette";
import { ChallengeRankingBars } from "./challenge-ranking-bars";

export type ChallengeParticipant = {
  id: string;
  name: string;
  value: number;
};

export async function ChallengeCard({
  id,
  title,
  metric,
  visibility,
  inviteCode,
  startDate,
  endDate,
  durationDays,
  participants,
  linkable = true,
  dateRangeLabel,
  target,
  startSlot,
  showRanking = true,
  color,
}: {
  id: string;
  title: string;
  metric: "chars" | "minutes" | "achievement";
  visibility: "open" | "private";
  inviteCode?: string | null;
  startDate: string | null;
  endDate: string | null;
  /** 방장이 설정에서 고른 카드 색상(팔레트 키) — 없으면 기본 흰 배경. */
  color?: string | null;
  /** 아직 시작 전(startDate가 null)일 때 기간 안내에 쓴다. */
  durationDays?: number;
  participants: ChallengeParticipant[];
  linkable?: boolean;
  /** startDate~endDate 대신 보여줄 라벨(예: "오늘 기준, 매일 자정 초기화"). */
  dateRangeLabel?: string;
  /** 지정하면 참여자 값의 최대치 대신 이 값을 막대의 100% 기준으로 쓴다. */
  target?: number;
  /** 시작 대기 중이고 내가 방장이면 "시작하기" 버튼을 여기 꽂아 넣는다. */
  startSlot?: React.ReactNode;
  /** 대결 상세 페이지에서는 순위를 대결 로그 옆으로 따로 빼서 보여주므로
   * 여기서는 헤더 정보만 남기고 순위 막대는 숨긴다. */
  showRanking?: boolean;
}) {
  const t = await getTranslations("compete.challengeCard");
  const today = todayKst();
  const status = !startDate
    ? t("statusPending")
    : today < startDate
      ? t("statusUpcoming")
      : today > (endDate ?? startDate)
        ? t("statusEnded")
        : t("statusOngoing");

  const content = (
    <div
      className={`flex flex-col gap-3 overflow-hidden border border-neutral-400 p-4 transition hover:border-neutral-500 dark:border-neutral-600 dark:hover:border-neutral-400 ${
        color ? paletteBg(color) : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="min-w-0 break-words text-sm font-semibold text-neutral-900 dark:text-white">
            {title}
          </span>
          <span className="rounded border border-neutral-200 px-1.5 py-0.5 text-[11px] text-neutral-400">
            {t("metricLabel", {
              metric:
                metric === "chars"
                  ? t("metricChars")
                  : metric === "minutes"
                    ? t("metricMinutes")
                    : t("metricAchievement"),
            })}
          </span>
          <span className="rounded border border-neutral-200 px-1.5 py-0.5 text-[11px] text-neutral-400">
            {visibility === "open" ? t("visibilityOpen") : t("visibilityPrivate")}
          </span>
          {visibility === "private" && inviteCode && (
            <span className="font-mono text-[11px] text-neutral-400">
              {t("inviteCode", { code: inviteCode })}
            </span>
          )}
        </div>
        <span
          className={`text-[12px] font-medium ${
            status === t("statusOngoing")
              ? "text-emerald-600"
              : status === t("statusPending")
                ? "text-amber-600"
                : status === t("statusUpcoming")
                  ? "text-neutral-400"
                  : "text-neutral-300"
          }`}
        >
          {status}
        </span>
      </div>
      <p className="text-[12px] text-neutral-400">
        {dateRangeLabel ??
          (startDate && endDate
            ? t("dateRange", { startDate, endDate })
            : t("pendingHint", { days: durationDays ?? 0 }))}
      </p>
      {startSlot}
      {showRanking && (
        <ChallengeRankingBars participants={participants} metric={metric} target={target} />
      )}
    </div>
  );

  if (!linkable) return content;

  return <Link href={`/compete/${id}`}>{content}</Link>;
}
