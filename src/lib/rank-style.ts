import { paletteCard } from "@/lib/palette";

// shared 1~10위 강조 스타일 — 랭킹 테이블 여러 곳(전체 랭킹, 대결 승패
// 랭킹)에서 같은 톤을 쓰기 위해 분리해뒀다. row 배경은 [도전] 방 박스와
// 같은 방식(라이트=옅은 파스텔, 다크=그에 어울리는 진한 톤)을 쓴다.
export type RankStyle = { row: string; rankText: string; nameText: string; icon?: string };

const TOP3_STYLE: Record<number, RankStyle> = {
  1: {
    row: paletteCard("amber"),
    rankText: "text-amber-600 dark:text-amber-400 font-semibold",
    nameText: "text-amber-700 dark:text-amber-300",
    icon: "👑",
  },
  2: {
    row: paletteCard("neutral"),
    rankText: "text-neutral-500 dark:text-neutral-400 font-semibold",
    nameText: "text-neutral-700 dark:text-neutral-200",
    icon: "🥈",
  },
  3: {
    row: paletteCard("orange"),
    rankText: "text-orange-600 dark:text-orange-400 font-semibold",
    nameText: "text-orange-700 dark:text-orange-300",
    icon: "🥉",
  },
};

export const RANK_STYLE: Record<number, RankStyle> = {
  ...TOP3_STYLE,
  ...Object.fromEntries(
    Array.from({ length: 7 }, (_, i) => [
      i + 4,
      {
        row: "bg-sky-50/50 dark:bg-sky-950/25",
        rankText: "text-sky-600 dark:text-sky-400",
        nameText: "text-neutral-900 dark:text-white",
      },
    ])
  ),
};
