// 애드센스 심사용 예시 데이터의 id 규칙 — 클라이언트 컴포넌트도 쓰므로
// 예시 데이터 본체(demo-data.ts)와 분리해서 가볍게 둔다.
export const DEMO_ID_PREFIX = "demo-";

export function isDemoId(id: string): boolean {
  return id.startsWith(DEMO_ID_PREFIX);
}
