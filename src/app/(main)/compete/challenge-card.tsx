import Link from "next/link";

export type ChallengeParticipant = {
  id: string;
  name: string;
  value: number;
};

export function ChallengeCard({
  id,
  title,
  metric,
  visibility,
  inviteCode,
  startDate,
  endDate,
  participants,
  linkable = true,
  dateRangeLabel,
  target,
}: {
  id: string;
  title: string;
  metric: "chars" | "minutes";
  visibility: "open" | "private";
  inviteCode?: string | null;
  startDate: string;
  endDate: string;
  participants: ChallengeParticipant[];
  linkable?: boolean;
  /** startDate~endDate 대신 보여줄 라벨(예: "오늘 기준, 매일 자정 초기화"). */
  dateRangeLabel?: string;
  /** 지정하면 참여자 값의 최대치 대신 이 값을 막대의 100% 기준으로 쓴다. */
  target?: number;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const status =
    today < startDate ? "예정" : today > endDate ? "종료" : "진행 중";
  const ranked = [...participants].sort((a, b) => b.value - a.value);
  const max = target ?? Math.max(1, ...ranked.map((p) => p.value));
  const unit = metric === "chars" ? "자" : "분";

  const content = (
    <div className="flex flex-col gap-3 overflow-hidden rounded-lg border border-neutral-200 p-4 transition hover:border-neutral-300">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="min-w-0 break-words text-sm font-semibold text-neutral-900 dark:text-white">
            {title}
          </span>
          <span className="rounded border border-neutral-200 px-1.5 py-0.5 text-[11px] text-neutral-400">
            개인 간 · {metric === "chars" ? "글자수" : "작업시간"}
          </span>
          <span className="rounded border border-neutral-200 px-1.5 py-0.5 text-[11px] text-neutral-400">
            {visibility === "open" ? "공개방" : "비공개방"}
          </span>
          {visibility === "private" && inviteCode && (
            <span className="font-mono text-[11px] text-neutral-400">
              코드 {inviteCode}
            </span>
          )}
        </div>
        <span
          className={`text-[12px] font-medium ${
            status === "진행 중"
              ? "text-emerald-600"
              : status === "예정"
                ? "text-neutral-400"
                : "text-neutral-300"
          }`}
        >
          {status}
        </span>
      </div>
      <p className="text-[12px] text-neutral-400">
        {dateRangeLabel ?? `${startDate} ~ ${endDate}`}
      </p>
      <div className="flex flex-col gap-2">
        {ranked.map((p, i) => {
          const isLeader = i === 0 && p.value > 0;
          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 rounded-md ${
                isLeader ? "bg-amber-50 px-2 py-1" : ""
              }`}
            >
              <span className="w-4 text-xs font-medium text-neutral-400">
                {isLeader ? "👑" : i + 1}
              </span>
              <span
                className={`w-20 shrink-0 truncate text-sm ${
                  isLeader ? "font-semibold text-amber-700" : "text-neutral-900 dark:text-white"
                }`}
              >
                {p.name}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full rounded-full ${isLeader ? "bg-amber-500" : "bg-neutral-900"}`}
                  style={{ width: `${Math.min(100, (p.value / max) * 100)}%` }}
                />
              </div>
              <span className="shrink-0 whitespace-nowrap text-right text-xs text-neutral-500">
                {p.value.toLocaleString()}
                {unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!linkable) return content;

  return <Link href={`/compete/${id}`}>{content}</Link>;
}
