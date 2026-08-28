-- PoRoom: 방을 만들 때 "웹소설 작가만/웹툰 작가만/누구나"를 고를 수
-- 있게 한다. NULL이면 누구나(직업 무관) 입장 가능 — 기존 방은 전부
-- 이 값이라 하위 호환에 영향 없다.
alter table public.rooms
  add column if not exists target_position text
    check (target_position in ('novelist', 'webtoon'));
