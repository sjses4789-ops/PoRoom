import { getTranslations } from "next-intl/server";

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

function describe(entry: LogEntry, t: Awaited<ReturnType<typeof getTranslations>>) {
  const d = new Date(entry.createdAt);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const date = t("monthDay", { month, day });
  switch (entry.type) {
    case "session_start":
      return t("sessionStart", { name: entry.userName });
    case "session_end":
      return t("sessionEnd", { name: entry.userName });
    case "chars_added":
      return t("charsAdded", { name: entry.userName, amount: entry.amount?.toLocaleString() ?? 0 });
    case "focus_recorded":
      return t("focusRecorded", { name: entry.userName, amount: entry.amount ?? 0 });
    case "milestone_5k":
      return t("milestone5k", { name: entry.userName, date });
    case "milestone_10k":
      return t("milestone10k", { name: entry.userName, date });
    case "draft_done":
      return t("draftDone", { name: entry.userName, month });
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

export async function ActivityLogList({ entries }: { entries: LogEntry[] }) {
  const t = await getTranslations("compete.activityLogList");

  if (entries.length === 0) {
    return (
      <p className="text-xs text-neutral-400">{t("empty")}</p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-neutral-400 border border-neutral-400">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex items-center gap-3 px-4 py-2.5 text-sm"
        >
          <span aria-hidden>{ICON[entry.type]}</span>
          <span className="flex-1 text-neutral-800 dark:text-white">{describe(entry, t)}</span>
          <span className="shrink-0 text-[12px] text-neutral-400">
            {formatTime(entry.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
