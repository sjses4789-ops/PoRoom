"use client";

import type { KeyPress } from "@/lib/hangul";

type KeyDef = { key: string; base: string; shifted?: string };

const ROW1: KeyDef[] = [
  { key: "q", base: "ㅂ", shifted: "ㅃ" },
  { key: "w", base: "ㅈ", shifted: "ㅉ" },
  { key: "e", base: "ㄷ", shifted: "ㄸ" },
  { key: "r", base: "ㄱ", shifted: "ㄲ" },
  { key: "t", base: "ㅅ", shifted: "ㅆ" },
  { key: "y", base: "ㅛ" },
  { key: "u", base: "ㅕ" },
  { key: "i", base: "ㅑ" },
  { key: "o", base: "ㅐ", shifted: "ㅒ" },
  { key: "p", base: "ㅔ", shifted: "ㅖ" },
];
const ROW2: KeyDef[] = [
  { key: "a", base: "ㅁ" },
  { key: "s", base: "ㄴ" },
  { key: "d", base: "ㅇ" },
  { key: "f", base: "ㄹ" },
  { key: "g", base: "ㅎ" },
  { key: "h", base: "ㅗ" },
  { key: "j", base: "ㅓ" },
  { key: "k", base: "ㅏ" },
  { key: "l", base: "ㅣ" },
];
const ROW3: KeyDef[] = [
  { key: "z", base: "ㅋ" },
  { key: "x", base: "ㅌ" },
  { key: "c", base: "ㅊ" },
  { key: "v", base: "ㅍ" },
  { key: "b", base: "ㅠ" },
  { key: "n", base: "ㅜ" },
  { key: "m", base: "ㅡ" },
];

function Key({ def, activeKeys }: { def: KeyDef; activeKeys: KeyPress[] }) {
  const match = activeKeys.find((k) => k.key === def.key);
  const activeShift = match?.shift ?? false;
  const isActive = !!match;

  return (
    <div
      className={`flex h-10 w-9 flex-col items-center justify-center rounded-sm border text-[13px] leading-none transition sm:h-11 sm:w-10 ${
        isActive
          ? activeShift
            ? "border-amber-500 bg-amber-500 text-white"
            : "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
          : "border-neutral-200 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
      }`}
    >
      {def.shifted && (
        <span className={`text-[10px] ${isActive && activeShift ? "" : "opacity-50"}`}>
          {def.shifted}
        </span>
      )}
      <span className="font-medium">{def.base}</span>
    </div>
  );
}

export function KeyboardView({ activeKeys }: { activeKeys: KeyPress[] }) {
  const spaceActive = activeKeys.some((k) => k.key === " ");
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex gap-1">
        {ROW1.map((d) => (
          <Key key={d.key} def={d} activeKeys={activeKeys} />
        ))}
      </div>
      <div className="flex gap-1 pl-4">
        {ROW2.map((d) => (
          <Key key={d.key} def={d} activeKeys={activeKeys} />
        ))}
      </div>
      <div className="flex gap-1 pl-8">
        {ROW3.map((d) => (
          <Key key={d.key} def={d} activeKeys={activeKeys} />
        ))}
      </div>
      <div
        className={`h-9 w-56 rounded-sm border transition sm:w-64 ${
          spaceActive
            ? "border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white"
            : "border-neutral-200 dark:border-neutral-700"
        }`}
      />
    </div>
  );
}
