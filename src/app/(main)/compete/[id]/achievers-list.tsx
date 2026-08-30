import { getTranslations } from "next-intl/server";

export type Achiever = { id: string; name: string; achievedAt: string };

// 챌린지 성공자 목록 — 하단에 누구나(참여자가 아니어도) 볼 수 있게
// 노출하고, 달성한 순서(먼저 달성한 사람이 위)대로 정렬한다.
export async function AchieversList({ achievers }: { achievers: Achiever[] }) {
  const t = await getTranslations("compete.achieversList");
  if (achievers.length === 0) {
    return <p className="text-xs text-neutral-400">{t("empty")}</p>;
  }
  return (
    <ol className="flex flex-col gap-1.5">
      {achievers.map((a, i) => (
        <li
          key={a.id}
          className="flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1.5 text-sm dark:bg-emerald-500/10"
        >
          <span className="w-6 shrink-0 text-center text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
            {i + 1}
          </span>
          <span className="min-w-0 truncate text-neutral-900 dark:text-white">{a.name}</span>
        </li>
      ))}
    </ol>
  );
}
