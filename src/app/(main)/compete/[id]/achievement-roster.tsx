"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { setChallengeAchieved } from "@/lib/admin";

export type AchievementRow = { id: string; name: string; achieved: boolean };

// "달성 여부" 기준 챌린지(주로 관리자가 만든 투고/공모전 이벤트)의
// 참가자 명단 — monthly_draft 챌린지의 자가 신고 체크와 같은 패턴으로,
// 본인 것만 직접 체크할 수 있고 나머지는 다른 참가자 상태를 보기만 한다.
export function AchievementRoster({
  challengeId,
  selfId,
  participants,
}: {
  challengeId: string;
  selfId: string;
  participants: AchievementRow[];
}) {
  const t = useTranslations("compete.achievementRoster");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const ranked = [...participants].sort((a, b) => Number(b.achieved) - Number(a.achieved));

  return (
    <div className="flex flex-col gap-2">
      {ranked.map((p) => {
        const isSelf = p.id === selfId;
        return (
          <div
            key={p.id}
            className={`flex items-center justify-between gap-3 rounded-md px-2 py-1.5 ${
              p.achieved ? "bg-emerald-50 dark:bg-emerald-500/10" : ""
            }`}
          >
            <span className="min-w-0 truncate text-sm text-neutral-900 dark:text-white">
              {p.name}
              {isSelf ? ` (${t("self")})` : ""}
            </span>
            {isSelf ? (
              <button
                type="button"
                disabled={pending}
                onClick={async () => {
                  setPending(true);
                  await setChallengeAchieved(challengeId, !p.achieved);
                  setPending(false);
                  router.refresh();
                }}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-50 ${
                  p.achieved
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                }`}
              >
                {p.achieved ? t("achieved") : t("markAchieved")}
              </button>
            ) : (
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  p.achieved
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                }`}
              >
                {p.achieved ? t("achieved") : t("notAchieved")}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
