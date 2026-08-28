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
  // 웹툰 작가 전용 상태(work-status-picker.tsx의 WEBTOON_PRESET_KEYS) —
  // 제작 공정 순서를 은근히 따라가는 색 흐름으로 골랐다.
  "구상 중": "#EEF1F4",
  "자료 조사": "#F1EEF5",
  "콘티": "#EFEFF6",
  "배경": "#EAF0EC",
  "스케치": "#F2F0EA",
  "펜터치": "#F0EFEA",
  "채색": "#F5EAEE",
  "후편집": "#EAEEF5",
  "마무리": "#EEF3EE",
};

export function workStatusBg(status: string | null): string | undefined {
  if (!status) return undefined;
  return WORK_STATUS_BG[status];
}
