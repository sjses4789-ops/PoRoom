// shared 1~10위 강조 스타일 — 랭킹 테이블 여러 곳(전체 랭킹, 대결 승패
// 랭킹)에서 같은 톤을 쓰기 위해 분리해뒀다.
export type RankStyle = { row: string; rankText: string; nameText: string; icon?: string };

const TOP3_STYLE: Record<number, RankStyle> = {
  1: {
    row: "bg-amber-50",
    rankText: "text-amber-600 font-semibold",
    nameText: "text-amber-700",
    icon: "👑",
  },
  2: {
    row: "bg-neutral-100",
    rankText: "text-neutral-500 font-semibold",
    nameText: "text-neutral-700",
    icon: "🥈",
  },
  3: {
    row: "bg-orange-50",
    rankText: "text-orange-600 font-semibold",
    nameText: "text-orange-700",
    icon: "🥉",
  },
};

export const RANK_STYLE: Record<number, RankStyle> = {
  ...TOP3_STYLE,
  ...Object.fromEntries(
    Array.from({ length: 7 }, (_, i) => [
      i + 4,
      { row: "bg-sky-50/50", rankText: "text-sky-600", nameText: "text-neutral-900 dark:text-white" },
    ])
  ),
};
