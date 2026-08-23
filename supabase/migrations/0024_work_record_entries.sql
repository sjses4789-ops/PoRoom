-- PoRoom: 작품 글자수 "입력 기준" 그래프용 — 같은 날짜에 여러 번 기록해도
-- work_records(날짜별 합산)와 달리 입력 1회마다 별도 행으로 남긴다.

create table if not exists public.work_record_entries (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  delta integer not null,
  current_chars integer not null,
  created_at timestamptz not null default now()
);

create index if not exists work_record_entries_work_id_created_at_idx
  on public.work_record_entries (work_id, created_at);

alter table public.work_record_entries enable row level security;

drop policy if exists "users manage their own work record entries" on public.work_record_entries;
create policy "users manage their own work record entries"
  on public.work_record_entries for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
