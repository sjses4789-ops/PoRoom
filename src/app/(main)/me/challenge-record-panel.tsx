import { getTranslations } from "next-intl/server";

export async function ChallengeRecordPanel({
  wins,
  losses,
  draws,
}: {
  wins: number;
  losses: number;
  draws: number;
}) {
  const t = await getTranslations("me.challengeRecordPanel");
  const total = wins + losses + draws;

  if (total === 0) {
    return (
      <p className="mt-1 text-sm text-neutral-400">
        {t("noRecords")}
      </p>
    );
  }

  return (
    <div className="mt-1 flex flex-col gap-2">
      <p className="text-sm text-neutral-900 dark:text-white">
        {t("summary", { total, wins, losses })}
        {draws > 0 ? t("drawSuffix", { draws }) : ""}
      </p>
      <div className="flex gap-3 text-xs">
        <span className="text-emerald-600">{t("win", { wins })}</span>
        <span className="text-red-500">{t("loss", { losses })}</span>
        {draws > 0 && <span className="text-neutral-400">{t("draw", { draws })}</span>}
      </div>
    </div>
  );
}
