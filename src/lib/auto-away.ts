// 뽀모도로를 켜 둔 채 방 페이지를 떠나 있는 동안 상태설정을 "자리 비움/휴식 중"으로 자동 전환했다가,
// 방 페이지로 돌아오면 원래 상태로 되돌리기 위해 "원래 상태"를 이 브라우저에 잠깐 보관한다.
// (빈 문자열 = 원래 상태가 없었음)

const keyFor = (roomId: string) => `poroom:status-before-away:${roomId}`;

export function readStatusBeforeAway(roomId: string): string | null {
  try {
    return window.localStorage.getItem(keyFor(roomId));
  } catch {
    return null;
  }
}

export function saveStatusBeforeAway(roomId: string, status: string | null) {
  try {
    window.localStorage.setItem(keyFor(roomId), status ?? "");
  } catch {
    // 저장 실패하면 자동 복구만 안 될 뿐이다.
  }
}

export function clearStatusBeforeAway(roomId: string) {
  try {
    window.localStorage.removeItem(keyFor(roomId));
  } catch {
    // ignore
  }
}
