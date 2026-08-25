export const PALETTE = [
  { key: "neutral", label: "회색", dot: "bg-neutral-500", bg: "bg-neutral-100", bgFaded: "bg-neutral-100/30" },
  { key: "slate", label: "슬레이트", dot: "bg-slate-500", bg: "bg-slate-100", bgFaded: "bg-slate-100/30" },
  { key: "zinc", label: "징크", dot: "bg-zinc-500", bg: "bg-zinc-100", bgFaded: "bg-zinc-100/30" },
  { key: "stone", label: "스톤", dot: "bg-stone-500", bg: "bg-stone-100", bgFaded: "bg-stone-100/30" },
  { key: "red", label: "빨강", dot: "bg-red-500", bg: "bg-red-50", bgFaded: "bg-red-50/30" },
  { key: "rose", label: "장미", dot: "bg-rose-500", bg: "bg-rose-50", bgFaded: "bg-rose-50/30" },
  { key: "pink", label: "분홍", dot: "bg-pink-500", bg: "bg-pink-50", bgFaded: "bg-pink-50/30" },
  { key: "fuchsia", label: "자홍", dot: "bg-fuchsia-500", bg: "bg-fuchsia-50", bgFaded: "bg-fuchsia-50/30" },
  { key: "purple", label: "보라", dot: "bg-purple-500", bg: "bg-purple-50", bgFaded: "bg-purple-50/30" },
  { key: "violet", label: "바이올렛", dot: "bg-violet-500", bg: "bg-violet-50", bgFaded: "bg-violet-50/30" },
  { key: "indigo", label: "인디고", dot: "bg-indigo-500", bg: "bg-indigo-50", bgFaded: "bg-indigo-50/30" },
  { key: "blue", label: "파랑", dot: "bg-blue-500", bg: "bg-blue-50", bgFaded: "bg-blue-50/30" },
  { key: "sky", label: "하늘", dot: "bg-sky-500", bg: "bg-sky-50", bgFaded: "bg-sky-50/30" },
  { key: "cyan", label: "시안", dot: "bg-cyan-500", bg: "bg-cyan-50", bgFaded: "bg-cyan-50/30" },
  { key: "teal", label: "청록", dot: "bg-teal-500", bg: "bg-teal-50", bgFaded: "bg-teal-50/30" },
  { key: "emerald", label: "에메랄드", dot: "bg-emerald-500", bg: "bg-emerald-50", bgFaded: "bg-emerald-50/30" },
  { key: "green", label: "초록", dot: "bg-green-500", bg: "bg-green-50", bgFaded: "bg-green-50/30" },
  { key: "lime", label: "연두", dot: "bg-lime-500", bg: "bg-lime-50", bgFaded: "bg-lime-50/30" },
  { key: "yellow", label: "노랑", dot: "bg-yellow-500", bg: "bg-yellow-50", bgFaded: "bg-yellow-50/30" },
  { key: "amber", label: "호박", dot: "bg-amber-500", bg: "bg-amber-50", bgFaded: "bg-amber-50/30" },
  { key: "orange", label: "주황", dot: "bg-orange-500", bg: "bg-orange-50", bgFaded: "bg-orange-50/30" },
  { key: "gray", label: "그레이", dot: "bg-gray-500", bg: "bg-gray-100", bgFaded: "bg-gray-100/30" },
] as const;

export type PaletteKey = (typeof PALETTE)[number]["key"];

const BY_KEY = new Map(PALETTE.map((p) => [p.key, p]));

export function paletteDot(key: string) {
  return (BY_KEY.get(key as PaletteKey) ?? PALETTE[0]).dot;
}

export function paletteBg(key: string) {
  return (BY_KEY.get(key as PaletteKey) ?? PALETTE[0]).bg;
}

// 30% 투명도 버전 — Tailwind는 클래스 이름이 소스에 그대로(문자열
// 리터럴로) 있어야 CSS를 생성해주므로, `${paletteBg(key)}/30`처럼
// 런타임에 조립한 클래스 이름은 인식하지 못한다. 그래서 PALETTE에
// "bg-xxx-50/30" 형태를 통째로 리터럴로 미리 적어두고 그대로 꺼내 쓴다.
export function paletteBgFaded(key: string) {
  return (BY_KEY.get(key as PaletteKey) ?? PALETTE[0]).bgFaded;
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
