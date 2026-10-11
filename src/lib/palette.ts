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

// 채팅 말풍선 색 팔레트 — 방/카테고리 색(PALETTE, 22색)과 따로 두고, 같은 색상에 연한 톤(기본)과 진한 톤
// (-deep)을 모두 두어 선택지를 늘렸다(총 45색). 기존에 저장된 chat_color 값(예: "blue")은 그대로
// 유효하다. 고른 색은 말풍선 배경이자 채팅 프로필 사진의 테두리색이 된다. Tailwind가 클래스를 알아보도록
// 전부 문자열 그대로 적는다.
export const CHAT_PALETTE = [
  { key: "neutral", label: "회색", dot: "bg-neutral-500", bubble: "bg-neutral-100 text-neutral-900", border: "border-neutral-400" },
  { key: "slate", label: "슬레이트", dot: "bg-slate-500", bubble: "bg-slate-100 text-neutral-900", border: "border-slate-400" },
  { key: "zinc", label: "징크", dot: "bg-zinc-500", bubble: "bg-zinc-100 text-neutral-900", border: "border-zinc-400" },
  { key: "stone", label: "스톤", dot: "bg-stone-500", bubble: "bg-stone-100 text-neutral-900", border: "border-stone-400" },
  { key: "red", label: "빨강", dot: "bg-red-500", bubble: "bg-red-50 text-neutral-900", border: "border-red-400" },
  { key: "rose", label: "장미", dot: "bg-rose-500", bubble: "bg-rose-50 text-neutral-900", border: "border-rose-400" },
  { key: "pink", label: "분홍", dot: "bg-pink-500", bubble: "bg-pink-50 text-neutral-900", border: "border-pink-400" },
  { key: "fuchsia", label: "자홍", dot: "bg-fuchsia-500", bubble: "bg-fuchsia-50 text-neutral-900", border: "border-fuchsia-400" },
  { key: "purple", label: "보라", dot: "bg-purple-500", bubble: "bg-purple-50 text-neutral-900", border: "border-purple-400" },
  { key: "violet", label: "바이올렛", dot: "bg-violet-500", bubble: "bg-violet-50 text-neutral-900", border: "border-violet-400" },
  { key: "indigo", label: "인디고", dot: "bg-indigo-500", bubble: "bg-indigo-50 text-neutral-900", border: "border-indigo-400" },
  { key: "blue", label: "파랑", dot: "bg-blue-500", bubble: "bg-blue-50 text-neutral-900", border: "border-blue-400" },
  { key: "sky", label: "하늘", dot: "bg-sky-500", bubble: "bg-sky-50 text-neutral-900", border: "border-sky-400" },
  { key: "cyan", label: "시안", dot: "bg-cyan-500", bubble: "bg-cyan-50 text-neutral-900", border: "border-cyan-400" },
  { key: "teal", label: "청록", dot: "bg-teal-500", bubble: "bg-teal-50 text-neutral-900", border: "border-teal-400" },
  { key: "emerald", label: "에메랄드", dot: "bg-emerald-500", bubble: "bg-emerald-50 text-neutral-900", border: "border-emerald-400" },
  { key: "green", label: "초록", dot: "bg-green-500", bubble: "bg-green-50 text-neutral-900", border: "border-green-400" },
  { key: "lime", label: "연두", dot: "bg-lime-500", bubble: "bg-lime-50 text-neutral-900", border: "border-lime-400" },
  { key: "yellow", label: "노랑", dot: "bg-yellow-500", bubble: "bg-yellow-50 text-neutral-900", border: "border-yellow-400" },
  { key: "amber", label: "호박", dot: "bg-amber-500", bubble: "bg-amber-50 text-neutral-900", border: "border-amber-400" },
  { key: "orange", label: "주황", dot: "bg-orange-500", bubble: "bg-orange-50 text-neutral-900", border: "border-orange-400" },
  { key: "gray", label: "그레이", dot: "bg-gray-500", bubble: "bg-gray-100 text-neutral-900", border: "border-gray-400" },
  { key: "neutral-deep", label: "진한 회색", dot: "bg-neutral-600", bubble: "bg-neutral-200 text-neutral-900", border: "border-neutral-600" },
  { key: "slate-deep", label: "진한 슬레이트", dot: "bg-slate-600", bubble: "bg-slate-200 text-neutral-900", border: "border-slate-600" },
  { key: "zinc-deep", label: "진한 징크", dot: "bg-zinc-600", bubble: "bg-zinc-200 text-neutral-900", border: "border-zinc-600" },
  { key: "stone-deep", label: "진한 스톤", dot: "bg-stone-600", bubble: "bg-stone-200 text-neutral-900", border: "border-stone-600" },
  { key: "red-deep", label: "진한 빨강", dot: "bg-red-600", bubble: "bg-red-200 text-neutral-900", border: "border-red-600" },
  { key: "rose-deep", label: "진한 장미", dot: "bg-rose-600", bubble: "bg-rose-200 text-neutral-900", border: "border-rose-600" },
  { key: "pink-deep", label: "진한 분홍", dot: "bg-pink-600", bubble: "bg-pink-200 text-neutral-900", border: "border-pink-600" },
  { key: "fuchsia-deep", label: "진한 자홍", dot: "bg-fuchsia-600", bubble: "bg-fuchsia-200 text-neutral-900", border: "border-fuchsia-600" },
  { key: "purple-deep", label: "진한 보라", dot: "bg-purple-600", bubble: "bg-purple-200 text-neutral-900", border: "border-purple-600" },
  { key: "violet-deep", label: "진한 바이올렛", dot: "bg-violet-600", bubble: "bg-violet-200 text-neutral-900", border: "border-violet-600" },
  { key: "indigo-deep", label: "진한 인디고", dot: "bg-indigo-600", bubble: "bg-indigo-200 text-neutral-900", border: "border-indigo-600" },
  { key: "blue-deep", label: "진한 파랑", dot: "bg-blue-600", bubble: "bg-blue-200 text-neutral-900", border: "border-blue-600" },
  { key: "sky-deep", label: "진한 하늘", dot: "bg-sky-600", bubble: "bg-sky-200 text-neutral-900", border: "border-sky-600" },
  { key: "cyan-deep", label: "진한 시안", dot: "bg-cyan-600", bubble: "bg-cyan-200 text-neutral-900", border: "border-cyan-600" },
  { key: "teal-deep", label: "진한 청록", dot: "bg-teal-600", bubble: "bg-teal-200 text-neutral-900", border: "border-teal-600" },
  { key: "emerald-deep", label: "진한 에메랄드", dot: "bg-emerald-600", bubble: "bg-emerald-200 text-neutral-900", border: "border-emerald-600" },
  { key: "green-deep", label: "진한 초록", dot: "bg-green-600", bubble: "bg-green-200 text-neutral-900", border: "border-green-600" },
  { key: "lime-deep", label: "진한 연두", dot: "bg-lime-600", bubble: "bg-lime-200 text-neutral-900", border: "border-lime-600" },
  { key: "yellow-deep", label: "진한 노랑", dot: "bg-yellow-600", bubble: "bg-yellow-200 text-neutral-900", border: "border-yellow-600" },
  { key: "amber-deep", label: "진한 호박", dot: "bg-amber-600", bubble: "bg-amber-200 text-neutral-900", border: "border-amber-600" },
  { key: "orange-deep", label: "진한 주황", dot: "bg-orange-600", bubble: "bg-orange-200 text-neutral-900", border: "border-orange-600" },
  { key: "gray-deep", label: "진한 그레이", dot: "bg-gray-600", bubble: "bg-gray-200 text-neutral-900", border: "border-gray-600" },
  { key: "black", label: "검정", dot: "bg-neutral-900", bubble: "bg-neutral-900 text-white", border: "border-neutral-900" },
] as const;

const CHAT_BY_KEY = new Map<string, (typeof CHAT_PALETTE)[number]>(CHAT_PALETTE.map((p) => [p.key, p]));

export function chatDot(key: string) {
  return (CHAT_BY_KEY.get(key) ?? CHAT_PALETTE[0]).dot;
}

// 채팅 프로필 사진 테두리 — 색을 고르지 않았으면 null(기본 회색 테두리를 그대로 쓴다).
export function chatBorderClass(key: string | null | undefined) {
  if (!key) return null;
  return CHAT_BY_KEY.get(key)?.border ?? null;
}

// chat bubble styling — a chosen color always wins; otherwise fall back to
// the original neutral look (dark for me, light gray for everyone else).
// bubble backgrounds are fixed light pastels/grays regardless of theme, so
// the text stays dark in both themes — flipping it white in dark mode
// would make it unreadable against the still-light bubble.
export function chatBubbleClass(colorKey: string | null | undefined, isSelf: boolean) {
  if (colorKey) {
    const chat = CHAT_BY_KEY.get(colorKey);
    return chat ? chat.bubble : `${paletteBg(colorKey)} text-neutral-900`;
  }
  return isSelf ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-800";
}
