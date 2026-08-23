export function ChallengeRecordPanel({
  wins,
  losses,
  draws,
}: {
  wins: number;
  losses: number;
  draws: number;
}) {
  const total = wins + losses + draws;

  if (total === 0) {
    return (
      <p className="mt-1 text-sm text-neutral-400">
        종료된 개인 대결 기록이 없습니다.
      </p>
    );
  }

  return (
    <div className="mt-1 flex flex-col gap-2">
      <p className="text-sm text-neutral-900 dark:text-white">
        총 {total}전 {wins}승 {losses}패{draws > 0 ? ` ${draws}무` : ""}
      </p>
      <div className="flex gap-3 text-xs">
        <span className="text-emerald-600">승 {wins}</span>
        <span className="text-red-500">패 {losses}</span>
        {draws > 0 && <span className="text-neutral-400">무 {draws}</span>}
      </div>
    </div>
  );
}
