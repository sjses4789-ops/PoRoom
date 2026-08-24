-- PoRoom: 1:1 대결의 시작 시점을 "수동 시작"(기존 동작) 또는 "인원이 다
-- 찼을 때 자동 시작" 중에서 고를 수 있게 한다. 정원이 무제한(capacity
-- null)인 대결은 애초에 "다 찼을 때"라는 기준이 없으므로 항상 manual로
-- 취급한다(애플리케이션 레벨에서 강제).
alter table public.challenges
  add column if not exists start_mode text not null default 'manual'
  check (start_mode in ('manual', 'full'));
