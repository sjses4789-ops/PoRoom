-- PoRoom: 방마다 태그를 여러 개 붙일 수 있도록 한다 (고정된 태그 목록,
-- 애플리케이션에서 검증). 포룸의 "전체/추천 방" 목록을 태그로 필터링하는
-- 데 사용된다.
alter table public.rooms
  add column if not exists tags text[] not null default '{}';
