-- PoRoom: 할 일에 날짜(어느 날의 할 일인지)와 완료 시각을 추가한다.
-- 지금까지는 체크하면 곧바로 삭제돼서 완료 기록이 전혀 남지 않았는데,
-- [개인] 페이지에 날짜별로 완료 여부를 확인하는 팝오버를 추가하면서
-- 체크해도 기록이 남도록 바꾼다(체크 시 completed_at만 채우고 더 이상
-- 삭제하지 않음 — 실제 삭제는 별도의 "삭제" 버튼만 담당).
-- for_date는 챌린지 자동 생성 항목의 반복 주기 식별용으로 이미 쓰이고
-- 있어(0030_challenge_recurring_todos.sql) 용도가 다르므로 건드리지
-- 않고 별도 컬럼을 둔다.
alter table public.todos
  add column if not exists todo_date date,
  add column if not exists completed_at timestamptz;

-- 기존 행은 생성일 기준으로 날짜를 채워둔다(그 시점엔 완료 여부 개념이
-- 없었으니 전부 미완료로 남겨둠 — 어차피 예전에 체크됐던 항목은 이미
-- 삭제돼서 테이블에 안 남아있다).
update public.todos set todo_date = created_at::date where todo_date is null;
