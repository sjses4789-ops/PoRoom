// PostgREST(Supabase)는 요청 한 번에 최대 1000행까지만 돌려준다 — 그보다 많을 수 있는 조회는 이 함수로
// 페이지를 나눠 끝까지 읽는다. build는 같은 조건의 쿼리에 .range(from, to)를 붙여 돌려줘야 하고,
// 페이지 사이에 행이 겹치거나 빠지지 않도록 쿼리에 정렬(유일한 기준)이 있어야 한다.
const PAGE_SIZE = 1000;

export async function fetchAllPages<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null }>
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data } = await build(from, from + PAGE_SIZE - 1);
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return all;
}
