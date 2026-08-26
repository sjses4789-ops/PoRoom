// card: 방목록/대결방 카드처럼 카드 전체를 채우는 용도 — 라이트에서는
// 옅은 파스텔(bg), 다크에서는 그 파스텔이 그대로 번지지 않도록 같은
// 색상 계열의 진한 톤을 낮은 불투명도로 얹어 다크 테마에 어울리게 한다
// (시스템 챌린지 카드의 "라이트 옅은 배경 / 다크 진한 배경" 톤과 같은
// 접근이며, 리터럴 문자열이라 Tailwind JIT가 인식한다).
export const PALETTE = [
  { key: "neutral", label: "회색", dot: "bg-neutral-500", bg: "bg-neutral-100", card: "bg-neutral-100 dark:bg-neutral-800/60" },
  { key: "slate", label: "슬레이트", dot: "bg-slate-500", bg: "bg-slate-100", card: "bg-slate-100 dark:bg-slate-800/60" },
  { key: "zinc", label: "징크", dot: "bg-zinc-500", bg: "bg-zinc-100", card: "bg-zinc-100 dark:bg-zinc-800/60" },
  { key: "stone", label: "스톤", dot: "bg-stone-500", bg: "bg-stone-100", card: "bg-stone-100 dark:bg-stone-800/60" },
  { key: "red", label: "빨강", dot: "bg-red-500", bg: "bg-red-50", card: "bg-red-50 dark:bg-red-950/40" },
  { key: "rose", label: "장미", dot: "bg-rose-500", bg: "bg-rose-50", card: "bg-rose-50 dark:bg-rose-950/40" },
  { key: "pink", label: "분홍", dot: "bg-pink-500", bg: "bg-pink-50", card: "bg-pink-50 dark:bg-pink-950/40" },
  { key: "fuchsia", label: "자홍", dot: "bg-fuchsia-500", bg: "bg-fuchsia-50", card: "bg-fuchsia-50 dark:bg-fuchsia-950/40" },
  { key: "purple", label: "보라", dot: "bg-purple-500", bg: "bg-purple-50", card: "bg-purple-50 dark:bg-purple-950/40" },
  { key: "violet", label: "바이올렛", dot: "bg-violet-500", bg: "bg-violet-50", card: "bg-violet-50 dark:bg-violet-950/40" },
  { key: "indigo", label: "인디고", dot: "bg-indigo-500", bg: "bg-indigo-50", card: "bg-indigo-50 dark:bg-indigo-950/40" },
  { key: "blue", label: "파랑", dot: "bg-blue-500", bg: "bg-blue-50", card: "bg-blue-50 dark:bg-blue-950/40" },
  { key: "sky", label: "하늘", dot: "bg-sky-500", bg: "bg-sky-50", card: "bg-sky-50 dark:bg-sky-950/40" },
  { key: "cyan", label: "시안", dot: "bg-cyan-500", bg: "bg-cyan-50", card: "bg-cyan-50 dark:bg-cyan-950/40" },
  { key: "teal", label: "청록", dot: "bg-teal-500", bg: "bg-teal-50", card: "bg-teal-50 dark:bg-teal-950/40" },
  { key: "emerald", label: "에메랄드", dot: "bg-emerald-500", bg: "bg-emerald-50", card: "bg-emerald-50 dark:bg-emerald-950/40" },
  { key: "green", label: "초록", dot: "bg-green-500", bg: "bg-green-50", card: "bg-green-50 dark:bg-green-950/40" },
  { key: "lime", label: "연두", dot: "bg-lime-500", bg: "bg-lime-50", card: "bg-lime-50 dark:bg-lime-950/40" },
  { key: "yellow", label: "노랑", dot: "bg-yellow-500", bg: "bg-yellow-50", card: "bg-yellow-50 dark:bg-yellow-950/40" },
  { key: "amber", label: "호박", dot: "bg-amber-500", bg: "bg-amber-50", card: "bg-amber-50 dark:bg-amber-950/40" },
  { key: "orange", label: "주황", dot: "bg-orange-500", bg: "bg-orange-50", card: "bg-orange-50 dark:bg-orange-950/40" },
  { key: "gray", label: "그레이", dot: "bg-gray-500", bg: "bg-gray-100", card: "bg-gray-100 dark:bg-gray-800/60" },
] as const;

export type PaletteKey = (typeof PALETTE)[number]["key"];

const BY_KEY = new Map(PALETTE.map((p) => [p.key, p]));

export function paletteDot(key: string) {
  return (BY_KEY.get(key as PaletteKey) ?? PALETTE[0]).dot;
}

export function paletteBg(key: string) {
  return (BY_KEY.get(key as PaletteKey) ?? PALETTE[0]).bg;
}

// 카드 전체를 색으로 채우는 용도(방목록 카드, 대결방 카드 등) — 다크
// 테마에서도 옅은 라이트 파스텔이 그대로 번지지 않고 테마에 어울리는
// 진한 톤으로 바뀐다.
export function paletteCard(key: string) {
  return (BY_KEY.get(key as PaletteKey) ?? PALETTE[0]).card;
}

// row colors for the records matrix — cycles through the palette by index
// so each participant's row is visually distinct.
export function rowColorByIndex(index: number) {
  return PALETTE[index % PALETTE.length].bg;
}

// chat bubble styling — a chosen color always wins; otherwise fall back to
// the original neutral look (dark for me, light gray for everyone else).
// bubble backgrounds are fixed light pastels/grays regardless of theme, so
// the text stays dark in both themes — flipping it white in dark mode
// would make it unreadable against the still-light bubble.
export function chatBubbleClass(colorKey: string | null | undefined, isSelf: boolean) {
  if (colorKey) return `${paletteBg(colorKey)} text-neutral-900`;
  return isSelf ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-800";
}
