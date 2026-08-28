import { getTranslations } from "next-intl/server";
import type { ChallengeParticipant } from "./challenge-card";

// ChallengeCard의 리더보드 막대 부분을 그대로 재사용할 수 있도록 뺀
// 컴포넌트 — 대결 상세 페이지에서는 이 부분만 따로 "대결 로그" 옆에
// 놓는다(ChallengeCard 쪽은 showRanking=false로 헤더만 보여줌).
export async function ChallengeRankingBars({
  participants,
  metric,
  target,
  targetPosition = null,
}: {
  participants: ChallengeParticipant[];
  metric: "chars" | "minutes" | "achievement";
  target?: number;
  targetPosition?: "novelist" | "webtoon" | null;
}) {
  const t = await getTranslations("compete.challengeCard");
  const ranked = [...participants].sort((a, b) => b.value - a.value);
  const max = target ?? Math.max(1, ...ranked.map((p) => p.value));
  const unit =
    metric === "chars"
      ? targetPosition === "webtoon"
        ? t("unitCuts")
        : t("unitChars")
      : metric === "minutes"
        ? t("unitMinutes")
        : "";

  return (
    <div className="flex flex-col gap-2">
      {ranked.map((p, i) => {
        const isLeader = i === 0 && p.value > 0;
        return (
          <div
            key={p.id}
            className={`flex items-center gap-3 rounded-md ${
              isLeader ? "bg-amber-50 px-2 py-1 dark:bg-amber-500/10" : ""
            }`}
          >
            <span className="w-4 text-xs font-medium text-neutral-400">
              {isLeader ? "👑" : i + 1}
            </span>
            <span
              className={`w-20 shrink-0 truncate text-sm ${
                isLeader
                  ? "font-semibold text-amber-700 dark:text-amber-400"
                  : "text-neutral-900 dark:text-white"
              }`}
            >
              {p.name}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className={`h-full rounded-full ${isLeader ? "bg-amber-500" : "bg-neutral-900 dark:bg-white"}`}
                style={{ width: `${Math.min(100, (p.value / max) * 100)}%` }}
              />
            </div>
            <span className="shrink-0 whitespace-nowrap text-right text-xs text-neutral-500 dark:text-neutral-400">
              {p.value.toLocaleString()}
              {unit}
            </span>
          </div>
        );
      })}
    </div>
  );
}
