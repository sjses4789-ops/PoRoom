// 기간이 끝난 관리자 챌린지(이벤트) 카드 — 참여 버튼 없이 기록만 보여 준다.
export function EndedChallengeCard({
  title,
  subLabel,
  startDate,
  endDate,
  participantsLabel,
  endedBadge,
  joinedBadge,
  bgClass,
}: {
  title: string;
  subLabel: string;
  startDate: string;
  endDate: string;
  participantsLabel: string;
  endedBadge: string;
  /** 내가 참여했던 챌린지이면 배지 문구를, 아니면 null */
  joinedBadge: string | null;
  bgClass: string;
}) {
  return (
    <div
      className={`flex flex-col gap-2 overflow-hidden rounded-lg border border-neutral-200/60 p-4 opacity-75 dark:border-neutral-700 ${bgClass}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 rounded bg-neutral-200 px-1.5 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
            {endedBadge}
          </span>
          <span className="min-w-0 truncate text-sm font-medium text-neutral-900 dark:text-white">{title}</span>
        </span>
        <span className="shrink-0 whitespace-nowrap text-xs text-neutral-400">{participantsLabel}</span>
      </div>
      <p className="text-[12px] text-neutral-400">
        {startDate} ~ {endDate} · {subLabel}
      </p>
      {joinedBadge && (
        <span className="self-start rounded-full border border-neutral-300 px-2 py-0.5 text-[11px] text-neutral-500 dark:border-neutral-600 dark:text-neutral-400">
          {joinedBadge}
        </span>
      )}
    </div>
  );
}
