-- PoRoom:
-- 1) daily_char_goals — "오늘의 목표 글자수"를 설정한 날짜부터 계속
--    적용되는 개인별 일일 목표 글자수. 특정 날짜에 값을 설정하면 그
--    날짜와 그 이후 날짜 전부에 동일하게 적용되고(더 최근 effective_date가
--    나올 때까지), 같은 날 다시 조정하면 그 날짜의 값만 덮어쓴다.
create table if not exists public.daily_char_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  effective_date date not null,
  target_chars integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, effective_date)
);

alter table public.daily_char_goals enable row level security;

drop policy if exists "users manage their own daily goals" on public.daily_char_goals;
create policy "users manage their own daily goals"
  on public.daily_char_goals for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2) rooms/users를 Realtime publication에 추가 — 포룸 방 목록 실시간
--    생성/삭제 감지(rooms)와, 방에 들어와 있는 동안 캐릭터·닉네임·채팅
--    색상을 바꾸면 참여자 카드가 즉시 갱신되도록(users) 하기 위함.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'users'
  ) then
    alter publication supabase_realtime add table public.users;
  end if;
end $$;
