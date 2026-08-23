export const PALETTE = [
  { key: "neutral", label: "회색", dot: "bg-neutral-500", bg: "bg-neutral-100" },
  { key: "slate", label: "슬레이트", dot: "bg-slate-500", bg: "bg-slate-100" },
  { key: "zinc", label: "징크", dot: "bg-zinc-500", bg: "bg-zinc-100" },
  { key: "stone", label: "스톤", dot: "bg-stone-500", bg: "bg-stone-100" },
  { key: "red", label: "빨강", dot: "bg-red-500", bg: "bg-red-50" },
  { key: "rose", label: "장미", dot: "bg-rose-500", bg: "bg-rose-50" },
  { key: "pink", label: "분홍", dot: "bg-pink-500", bg: "bg-pink-50" },
  { key: "fuchsia", label: "자홍", dot: "bg-fuchsia-500", bg: "bg-fuchsia-50" },
  { key: "purple", label: "보라", dot: "bg-purple-500", bg: "bg-purple-50" },
  { key: "violet", label: "바이올렛", dot: "bg-violet-500", bg: "bg-violet-50" },
  { key: "indigo", label: "인디고", dot: "bg-indigo-500", bg: "bg-indigo-50" },
  { key: "blue", label: "파랑", dot: "bg-blue-500", bg: "bg-blue-50" },
  { key: "sky", label: "하늘", dot: "bg-sky-500", bg: "bg-sky-50" },
  { key: "cyan", label: "시안", dot: "bg-cyan-500", bg: "bg-cyan-50" },
  { key: "teal", label: "청록", dot: "bg-teal-500", bg: "bg-teal-50" },
  { key: "emerald", label: "에메랄드", dot: "bg-emerald-500", bg: "bg-emerald-50" },
  { key: "green", label: "초록", dot: "bg-green-500", bg: "bg-green-50" },
  { key: "lime", label: "연두", dot: "bg-lime-500", bg: "bg-lime-50" },
  { key: "yellow", label: "노랑", dot: "bg-yellow-500", bg: "bg-yellow-50" },
  { key: "amber", label: "호박", dot: "bg-amber-500", bg: "bg-amber-50" },
  { key: "orange", label: "주황", dot: "bg-orange-500", bg: "bg-orange-50" },
  { key: "gray", label: "그레이", dot: "bg-gray-500", bg: "bg-gray-100" },
] as const;

export type PaletteKey = (typeof PALETTE)[number]["key"];

const BY_KEY = new Map(PALETTE.map((p) => [p.key, p]));

export function paletteDot(key: string) {
  return (BY_KEY.get(key as PaletteKey) ?? PALETTE[0]).dot;
}

export function paletteBg(key: string) {
  return (BY_KEY.get(key as PaletteKey) ?? PALETTE[0]).bg;
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
