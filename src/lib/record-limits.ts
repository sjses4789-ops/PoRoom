// 기록(글자수) 입력의 상한 — 사람이 하루에 쓸 수 있는 양을 훨씬 넘는 값은 오타이거나 조작이라 서버가 받지 않는다.
// 이 값을 넘는 기록이 반복되면 관리자 페이지 "의심 기록"에서 볼 수 있다(운영정책 4항: 기록의 정직함).

// 한 방·하루의 글자수를 직접 입력/수정할 때 허용하는 최대값.
export const MAX_MANUAL_DAILY_CHARS = 100_000;
// 방 입력창으로 쌓이는 글자수(모든 방 합산)의 하루 최대값 — 이 이상은 더 쌓이지 않는다.
export const MAX_DAILY_TOTAL_CHARS = 150_000;
// 지난 기록을 직접 고칠 수 있는 기간(일).
export const MANUAL_EDIT_WINDOW_DAYS = 60;
// 관리자 "의심 기록"으로 보여 줄 하루 글자수 기준.
export const SUSPICIOUS_DAILY_CHARS = 50_000;
