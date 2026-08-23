// muted, grayish-pastel background per work-status category — subtle
// enough not to compete with the character art or the phase color dot.
const WORK_STATUS_BG: Record<string, string> = {
  "구상중": "#EEF1F4",
  "집필중": "#EEF3EE",
  "퇴고중": "#F5F2EA",
  "교정중": "#F5EFEA",
  "자료조사": "#F1EEF5",
  "휴식 중": "#EAF2F1",
  "자리 비움": "#F0F0EE",
};

export function workStatusBg(status: string | null): string | undefined {
  if (!status) return undefined;
  return WORK_STATUS_BG[status];
}
