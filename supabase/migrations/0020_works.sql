-- PoRoom: 작품(작업물) 단위로 글자수를 개별 기록/관리하는 기능.
-- 방과 무관하게(어느 방에서 입력하든) 개인 소유의 작품 목록에 누적된다.
create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  last_current_chars integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.work_records (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  record_date date not null,
  chars integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (work_id, record_date)
);

create index if not exists work_records_user_id_record_date_idx
  on public.work_records (user_id, record_date);

alter table public.works enable row level security;
alter table public.work_records enable row level security;

drop policy if exists "users manage their own works" on public.works;
create policy "users manage their own works"
  on public.works for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users manage their own work records" on public.work_records;
create policy "users manage their own work records"
  on public.work_records for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
