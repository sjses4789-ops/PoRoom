// shared 1~10위 강조 스타일 — 랭킹 테이블 여러 곳(전체 랭킹, 대결 승패
// 랭킹)에서 같은 톤을 쓰기 위해 분리해뒀다. row 배경은 [도전] 방 박스
// (SYSTEM_CHALLENGE_CARD_BG)와 같은 방식 — 라이트는 옅은 파스텔, 다크는
// 그 위에 반투명을 얹는 게 아니라 아예 불투명한 진한 색으로 칠한다.
// 처음엔 paletteCard()(반투명 오버레이)를 썼는데, 다크 배경 위에 40%
// 투명도로만 얹으니 원래 있던 어두운 바탕색과 거의 구분이 안 갈 만큼
// 옅어져서 "다크모드인데도 색이 하나도 안 바뀐 것처럼" 보이는 문제가
// 있었다 — 챌린지 카드처럼 불투명한 헥스 색으로 바꿔 확실히 구분되게 한다.
export type RankStyle = { row: string; rankText: string; nameText: string; icon?: string };

const TOP3_STYLE: Record<number, RankStyle> = {
  1: {
    row: "bg-amber-50 dark:bg-[#2a2410]",
    rankText: "text-amber-600 dark:text-amber-400 font-semibold",
    nameText: "text-amber-700 dark:text-amber-300",
    icon: "👑",
  },
  2: {
    row: "bg-neutral-100 dark:bg-[#2a2a2a]",
    rankText: "text-neutral-500 dark:text-neutral-400 font-semibold",
    nameText: "text-neutral-700 dark:text-neutral-200",
    icon: "🥈",
  },
  3: {
    row: "bg-orange-50 dark:bg-[#2e1c0d]",
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
        row: "bg-sky-50/50 dark:bg-[#122029]",
        rankText: "text-sky-600 dark:text-sky-400",
        nameText: "text-neutral-900 dark:text-white",
      },
    ])
  ),
};
