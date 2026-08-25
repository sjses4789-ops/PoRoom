-- PoRoom: 오늘 목표에도 이번 달/올해 목표처럼 시간(분) 목표를 추가한다.
-- 지금까지 daily_char_goals는 글자수만 있었는데, [개인] 페이지의
-- "오늘" 탭에서도 시간 목표 그래프를 보여주기 위해 컬럼을 추가한다.
alter table public.daily_char_goals
  add column if not exists target_minutes integer not null default 0;
