export type LogEntry = {
  id: string;
  userName: string;
  type:
    | "session_start"
    | "session_end"
    | "chars_added"
    | "focus_recorded"
    | "milestone_5k"
    | "milestone_10k"
    | "draft_done";
  amount: number | null;
  createdAt: string;
};

function describe(entry: LogEntry) {
  const d = new Date(entry.createdAt);
  const md = `${d.getMonth() + 1}월 ${d.getDate()}일`;
  switch (entry.type) {
    case "session_start":
      return `${entry.userName}님이 뽀모도로를 시작했어요`;
    case "session_end":
      return `${entry.userName}님이 뽀모도로를 종료했어요`;
    case "chars_added":
      return `${entry.userName}님이 ${entry.amount?.toLocaleString() ?? 0}자를 기록했어요`;
    case "focus_recorded":
      return `${entry.userName}님이 ${entry.amount ?? 0}분 집중했어요`;
    case "milestone_5k":
      return `${entry.userName}님이 ${md} 5천자 집필에 성공했습니다🎉`;
    case "milestone_10k":
      return `${entry.userName}님이 ${md} 만 자 집필에 성공했습니다🎉`;
    case "draft_done":
      return `${entry.userName}님이 ${d.getMonth() + 1}월 초단을 완성하였습니다.`;
  }
}

const ICON: Record<LogEntry["type"], string> = {
  session_start: "▶️",
  session_end: "⏸️",
  chars_added: "✍️",
  focus_recorded: "⏱️",
  milestone_5k: "🎉",
  milestone_10k: "🎉",
  draft_done: "✅",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityLogList({ entries }: { entries: LogEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-neutral-400">아직 활동 기록이 없습니다.</p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-neutral-100 rounded-lg border border-neutral-200">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex items-center gap-3 px-4 py-2.5 text-sm"
        >
          <span aria-hidden>{ICON[entry.type]}</span>
          <span className="flex-1 text-neutral-800 dark:text-white">{describe(entry)}</span>
          <span className="shrink-0 text-[12px] text-neutral-400">
            {formatTime(entry.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
