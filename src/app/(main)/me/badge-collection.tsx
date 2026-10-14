import { getTranslations } from "next-intl/server";
import type { SystemChallengeKind } from "@/lib/system-challenges";

export type EventBadge = { id: string; title: string; endDate: string };
export type DuelBadge = { id: string; title: string; endDate: string };

const KINDS: SystemChallengeKind[] = ["daily1k", "daily5k", "daily10k", "monthly_draft"];
const KIND_ICON: Record<SystemChallengeKind, string> = {
  daily1k: "✍️",
  daily5k: "📝",
  daily10k: "📚",
  monthly_draft: "🏁",
};

// [개인]의 "완주 뱃지" — 매일 챌린지 성공 횟수, 이벤트 챌린지 완주, 대결 승리가 뱃지로 쌓인다.
// 받지 못한 매일 챌린지 뱃지는 흐리게 보여 줘서 무엇을 모을 수 있는지 알 수 있게 한다.
export async function BadgeCollection({
  systemSuccessCounts,
  events,
  duelWins,
}: {
  systemSuccessCounts: Record<SystemChallengeKind, number>;
  events: EventBadge[];
  duelWins: DuelBadge[];
}) {
  const t = await getTranslations("me.badges");
  const tMeta = await getTranslations("compete.systemChallengeMeta");

  const chip = (earned: boolean) =>
    `flex min-w-0 items-center gap-2 rounded-md border px-3 py-2 text-xs ${
      earned
        ? "border-amber-300 bg-amber-50 text-neutral-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-white"
        : "border-dashed border-neutral-300 text-neutral-400 dark:border-neutral-700 dark:text-neutral-500"
    }`;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-neutral-400 p-4 dark:border-neutral-600">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</h2>
        <p className="mt-1 text-xs text-neutral-500">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {KINDS.map((kind) => {
          const count = systemSuccessCounts[kind] ?? 0;
          return (
            <div key={kind} className={chip(count > 0)}>
              <span className={`text-lg ${count > 0 ? "" : "grayscale"}`} aria-hidden>
                {KIND_ICON[kind]}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{tMeta(`${kind}.title`)}</span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {count > 0 ? t("successCount", { count }) : t("notYet")}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          {t("eventHeading", { count: events.length })}
        </h3>
        {events.length === 0 ? (
          <p className="text-xs text-neutral-400">{t("eventEmpty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <div key={e.id} className={chip(true)}>
                <span className="text-lg" aria-hidden>
                  🏅
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{e.title}</span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{e.endDate}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          {t("duelHeading", { count: duelWins.length })}
        </h3>
        {duelWins.length === 0 ? (
          <p className="text-xs text-neutral-400">{t("duelEmpty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {duelWins.map((d) => (
              <div key={d.id} className={chip(true)}>
                <span className="text-lg" aria-hidden>
                  ⚔️
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{d.title}</span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{d.endDate}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
