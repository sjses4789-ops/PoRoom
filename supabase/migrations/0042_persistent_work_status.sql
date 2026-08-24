-- PoRoom: "상태설정"(작업 상태)을 presence(실시간 접속 세션)에만 실어
-- 보내던 걸 users 테이블에 영구 저장하도록 바꾼다. 그래야 방을
-- 나갔다 들어와도, 다른 페이지(랭킹/대결/휴식)에 가 있어도 참여자
-- 목록에 표시된 상태가 그대로 유지된다. RLS는 기존 "users can update
-- own row" 정책이 이 컬럼에도 그대로 적용된다.
alter table public.users add column if not exists work_status text;
