import { getTranslations } from "next-intl/server";
import { SYSTEM_CHALLENGE_META, type SystemChallengeKind } from "@/lib/system-challenges";

const KINDS: SystemChallengeKind[] = ["daily5k", "daily10k", "monthly_draft"];

export async function SystemChallengeRecordPanel({
  joined,
  successCounts,
}: {
  joined: Record<SystemChallengeKind, boolean>;
  successCounts: Record<SystemChallengeKind, number>;
}) {
  const t = await getTranslations("me.systemChallengeRecordPanel");

  return (
    <div className="mt-1 flex flex-col divide-y divide-neutral-400 dark:divide-neutral-600">
      {KINDS.map((kind) => {
        const meta = SYSTEM_CHALLENGE_META[kind];
        return (
          <div key={kind} className="flex items-center justify-between gap-2 py-2 text-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-neutral-900 dark:text-white">{meta.title}</span>
              <span
                className={`w-fit rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                  joined[kind]
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
                }`}
              >
                {joined[kind] ? t("joined") : t("notJoined")}
              </span>
            </div>
            <span className="shrink-0 text-xs font-medium text-neutral-600 dark:text-neutral-300">
              {t("successCount", { count: successCounts[kind] })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
