-- PoRoom: 투표에 기간(종료 시각)을 설정할 수 있게 한다. null이면 무기한
-- 투표(기존 동작과 동일).
alter table public.polls add column if not exists ends_at timestamptz;
