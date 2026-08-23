-- PoRoom: room settings (record sharing policy, join type),
-- per-member sharing preference, and daily char/focus-time records.

alter table public.rooms
  add column if not exists record_visibility text not null default 'shared'
    check (record_visibility in ('shared', 'private', 'free')),
  add column if not exists join_type text not null default 'invite'
    check (join_type in ('invite', 'open'));

alter table public.room_members
  add column if not exists share_records boolean not null default true;

create table if not exists public.daily_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  record_date date not null default (now() at time zone 'utc')::date,
  chars integer not null default 0,
  focus_minutes integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, room_id, record_date)
);

create index if not exists daily_records_room_id_record_date_idx
  on public.daily_records (room_id, record_date);

alter table public.daily_records enable row level security;

drop policy if exists "room members can read records" on public.daily_records;
create policy "room members can read records"
  on public.daily_records for select
  to authenticated
  using (
    exists (
      select 1 from public.room_members rm
      where rm.room_id = daily_records.room_id and rm.user_id = auth.uid()
    )
  );

drop policy if exists "users insert their own records" on public.daily_records;
create policy "users insert their own records"
  on public.daily_records for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.room_members rm
      where rm.room_id = daily_records.room_id and rm.user_id = auth.uid()
    )
  );

drop policy if exists "users update their own records" on public.daily_records;
create policy "users update their own records"
  on public.daily_records for update
  to authenticated
  using (auth.uid() = user_id);
