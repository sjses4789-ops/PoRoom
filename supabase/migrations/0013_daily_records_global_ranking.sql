-- PoRoom: 랭킹 페이지는 "전체 사용자/전체 방 랭킹"을 보여줘야 하는데,
-- daily_records의 기존 select 정책이 "내가 멤버인 방의 기록만" 허용하고
-- 있어서, 계정마다 가입한 방이 다르면 랭킹 집계 결과도 서로 달라지는
-- 버그가 있었다. 랭킹은 앱 전체 공개 지표이므로 로그인한 사용자라면
-- 누구나 모든 daily_records를 읽을 수 있도록 정책을 추가한다.

drop policy if exists "authenticated can read all records for ranking" on public.daily_records;
create policy "authenticated can read all records for ranking"
  on public.daily_records for select
  to authenticated
  using (true);
