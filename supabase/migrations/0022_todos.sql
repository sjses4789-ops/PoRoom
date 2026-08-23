-- PoRoom: 개인 체크리스트("할 일"). 체크하면 목록에서 사라지는 방식이라
-- 완료 여부 컬럼 없이 존재 자체가 "아직 안 한 일"을 뜻한다.
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.todos enable row level security;

drop policy if exists "users manage their own todos" on public.todos;
create policy "users manage their own todos"
  on public.todos for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
