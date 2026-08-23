-- PoRoom: personal goals + user/room challenges (대결)

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  period text not null check (period in ('month', 'year')),
  target_chars integer not null default 0,
  target_minutes integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, period)
);

alter table public.goals enable row level security;

drop policy if exists "users select their own goals" on public.goals;
create policy "users select their own goals"
  on public.goals for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users insert their own goals" on public.goals;
create policy "users insert their own goals"
  on public.goals for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users update their own goals" on public.goals;
create policy "users update their own goals"
  on public.goals for update
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('user', 'room')),
  metric text not null check (metric in ('chars', 'minutes')),
  title text not null,
  start_date date not null,
  end_date date not null,
  created_by uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint challenges_date_range check (end_date >= start_date)
);

alter table public.challenges enable row level security;

drop policy if exists "challenges are viewable by authenticated users" on public.challenges;
create policy "challenges are viewable by authenticated users"
  on public.challenges for select
  to authenticated
  using (true);

drop policy if exists "authenticated users can create challenges" on public.challenges;
create policy "authenticated users can create challenges"
  on public.challenges for insert
  to authenticated
  with check (auth.uid() = created_by);

create table if not exists public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid references public.users (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint challenge_participants_one_target check ((user_id is not null) <> (room_id is not null))
);

create unique index if not exists challenge_participants_user_uidx
  on public.challenge_participants (challenge_id, user_id) where user_id is not null;
create unique index if not exists challenge_participants_room_uidx
  on public.challenge_participants (challenge_id, room_id) where room_id is not null;

alter table public.challenge_participants enable row level security;

drop policy if exists "participants are viewable by authenticated users" on public.challenge_participants;
create policy "participants are viewable by authenticated users"
  on public.challenge_participants for select
  to authenticated
  using (true);

drop policy if exists "challenge creator can add participants" on public.challenge_participants;
create policy "challenge creator can add participants"
  on public.challenge_participants for insert
  to authenticated
  with check (
    exists (
      select 1 from public.challenges c
      where c.id = challenge_participants.challenge_id and c.created_by = auth.uid()
    )
  );
