-- 챌린지 참여 시 자동 생성되는 할 일("매일 5천자 쓰기" 등)은 삭제해도
-- 다음에 [개인]/[포룸] 페이지를 열 때 ensureChallengeTodos()가 "오늘치가
-- 없네" 라고 판단해 똑같은 내용을 다시 추가해버리는 문제가 있었다 —
-- "행이 없다 = 아직 안 만들어짐"과 "행이 없다 = 사용자가 지웠음"을 구분할
-- 수 없었기 때문. 사용자가 명시적으로 지운 (내용, 날짜) 조합을 별도
-- 테이블에 남겨서, 그 조합은 같은 날짜/달 동안 다시 자동 생성되지
-- 않도록 한다.
create table if not exists public.todo_dismissals (
  user_id uuid not null references public.users (id) on delete cascade,
  content text not null,
  for_date date not null,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, content, for_date)
);

alter table public.todo_dismissals enable row level security;

drop policy if exists "users can read own dismissals" on public.todo_dismissals;
create policy "users can read own dismissals"
  on public.todo_dismissals for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users can insert own dismissals" on public.todo_dismissals;
create policy "users can insert own dismissals"
  on public.todo_dismissals for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users can delete own dismissals" on public.todo_dismissals;
create policy "users can delete own dismissals"
  on public.todo_dismissals for delete
  to authenticated
  using (auth.uid() = user_id);
