-- PoRoom: per-user activity log (session start/end, chars/focus recorded)
-- visible to yourself and to anyone you currently share an active challenge
-- with, for the duration of that challenge.

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete set null,
  type text not null check (type in ('session_start', 'session_end', 'chars_added', 'focus_recorded')),
  amount integer,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_user_id_created_at_idx
  on public.activity_logs (user_id, created_at desc);

alter table public.activity_logs enable row level security;

create or replace function public.shares_active_challenge_with(target_user_id uuid, event_time timestamptz)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.challenge_participants mine
    join public.challenge_participants theirs on theirs.challenge_id = mine.challenge_id
    join public.challenges c on c.id = mine.challenge_id
    where mine.user_id = auth.uid()
      and theirs.user_id = target_user_id
      and event_time::date between c.start_date and c.end_date
  );
$$;

drop policy if exists "users can read their own or shared-challenge logs" on public.activity_logs;
create policy "users can read their own or shared-challenge logs"
  on public.activity_logs for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.shares_active_challenge_with(user_id, created_at)
  );

drop policy if exists "users insert their own activity logs" on public.activity_logs;
create policy "users insert their own activity logs"
  on public.activity_logs for insert
  to authenticated
  with check (auth.uid() = user_id);
