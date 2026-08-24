// 두벌식(표준) 키보드 자판 기준의 한글 분해/키 매핑. 타자 연습 화면에서
// "다음 글자를 치려면 어느 키를 눌러야 하는지"를 보여주기 위해 쓴다.

const CHOSEONG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

const JUNGSEONG = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ",
  "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ",
] as const;

const JONGSEONG = [
  "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ",
  "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

export type KeyPress = { jamo: string; key: string; shift: boolean };

// 자음/모음 낱자 하나 -> 물리 키. 겹자음(ㄲㄸㅃㅆㅉ)과 ㅒㅖ는 시프트로
// 한 번에 눌러 완성되는 키라 두벌식에서 키 입력이 하나뿐이다.
const JAMO_KEY: Record<string, { key: string; shift: boolean }> = {
  ㄱ: { key: "r", shift: false },
  ㄲ: { key: "r", shift: true },
  ㄴ: { key: "s", shift: false },
  ㄷ: { key: "e", shift: false },
  ㄸ: { key: "e", shift: true },
  ㄹ: { key: "f", shift: false },
  ㅁ: { key: "a", shift: false },
  ㅂ: { key: "q", shift: false },
  ㅃ: { key: "q", shift: true },
  ㅅ: { key: "t", shift: false },
  ㅆ: { key: "t", shift: true },
  ㅇ: { key: "d", shift: false },
  ㅈ: { key: "w", shift: false },
  ㅉ: { key: "w", shift: true },
  ㅊ: { key: "c", shift: false },
  ㅋ: { key: "z", shift: false },
  ㅌ: { key: "x", shift: false },
  ㅍ: { key: "v", shift: false },
  ㅎ: { key: "g", shift: false },
  ㅏ: { key: "k", shift: false },
  ㅐ: { key: "o", shift: false },
  ㅑ: { key: "i", shift: false },
  ㅒ: { key: "o", shift: true },
  ㅓ: { key: "j", shift: false },
  ㅔ: { key: "p", shift: false },
  ㅕ: { key: "u", shift: false },
  ㅖ: { key: "p", shift: true },
  ㅗ: { key: "h", shift: false },
  ㅛ: { key: "y", shift: false },
  ㅜ: { key: "n", shift: false },
  ㅠ: { key: "b", shift: false },
  ㅡ: { key: "m", shift: false },
  ㅣ: { key: "l", shift: false },
};

// 두벌식엔 없는 겹모음/겹받침은 기본 낱자 두 개를 연달아 눌러 만든다.
const COMPOUND: Record<string, [string, string]> = {
  ㅘ: ["ㅗ", "ㅏ"],
  ㅙ: ["ㅗ", "ㅐ"],
  ㅚ: ["ㅗ", "ㅣ"],
  ㅝ: ["ㅜ", "ㅓ"],
  ㅞ: ["ㅜ", "ㅔ"],
  ㅟ: ["ㅜ", "ㅣ"],
  ㅢ: ["ㅡ", "ㅣ"],
  ㄳ: ["ㄱ", "ㅅ"],
  ㄵ: ["ㄴ", "ㅈ"],
  ㄶ: ["ㄴ", "ㅎ"],
  ㄺ: ["ㄹ", "ㄱ"],
  ㄻ: ["ㄹ", "ㅁ"],
  ㄼ: ["ㄹ", "ㅂ"],
  ㄽ: ["ㄹ", "ㅅ"],
  ㄾ: ["ㄹ", "ㅌ"],
  ㄿ: ["ㄹ", "ㅍ"],
  ㅀ: ["ㄹ", "ㅎ"],
  ㅄ: ["ㅂ", "ㅅ"],
};

function keysForJamo(jamo: string): KeyPress[] {
  const compound = COMPOUND[jamo];
  if (compound) {
    return compound.flatMap((j) => keysForJamo(j));
  }
  const k = JAMO_KEY[jamo];
  if (!k) return [];
  return [{ jamo, key: k.key, shift: k.shift }];
}

// 완성된 한글 음절(예: "글") 하나를 두벌식 키 입력 순서로 분해한다.
// 한글 음절이 아니면(공백/문장부호/영문 등) 그 글자 자체를 키로 돌려준다.
export function decomposeChar(char: string): KeyPress[] {
  const code = char.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) {
    if (char === " ") return [{ jamo: "␣", key: " ", shift: false }];
    return [{ jamo: char, key: char.toLowerCase(), shift: false }];
  }
  const offset = code - 0xac00;
  const cho = CHOSEONG[Math.floor(offset / (21 * 28))];
  const jung = JUNGSEONG[Math.floor((offset % (21 * 28)) / 28)];
  const jong = JONGSEONG[offset % 28];

  const keys = [...keysForJamo(cho), ...keysForJamo(jung)];
  if (jong) keys.push(...keysForJamo(jong));
  return keys;
}
