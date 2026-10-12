// 이 브라우저(저장소)를 구분하는 값 — 같은 브라우저의 여러 탭은 같은 값을 쓰고, 다른 브라우저/기기는 다른 값을
// 쓴다. 같은 계정으로 다른 브라우저에서 같은 방에 동시에 접속했는지 알아보는 데 쓴다(use-room-presence).
const KEY = "poroom:browser-id";
let memoryId: string | null = null;

export function getBrowserId(): string {
  if (memoryId) return memoryId;
  const fresh = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored) {
      memoryId = stored;
      return stored;
    }
    const id = fresh();
    window.localStorage.setItem(KEY, id);
    memoryId = id;
    return id;
  } catch {
    // 저장소를 못 쓰는 환경이면 이번 방문 동안만 유지한다.
    memoryId = fresh();
    return memoryId;
  }
}
