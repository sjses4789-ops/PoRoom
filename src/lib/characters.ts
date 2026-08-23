export const CHARACTER_COUNT = 160;

export const CHARACTER_IDS: string[] = Array.from(
  { length: CHARACTER_COUNT },
  (_, i) => `char_${String(i + 1).padStart(4, "0")}`
);

export function characterSrc(characterId: string | null | undefined) {
  if (!characterId) return null;
  return `/characters/${characterId}.png`;
}
