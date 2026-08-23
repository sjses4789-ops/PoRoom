-- PoRoom: users / rooms / room_members
create extension if not exists pgcrypto;

-- users: public profile row mirroring auth.users, so we can join/display
-- names without exposing the auth schema to the client.
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

drop policy if exists "users are viewable by authenticated users" on public.users;
create policy "users are viewable by authenticated users"
  on public.users for select
  to authenticated
  using (true);

drop policy if exists "users can update own row" on public.users;
create policy "users can update own row"
  on public.users for update
  to authenticated
  using (auth.uid() = id);

-- keep public.users in sync whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- backfill any users that signed up before this migration ran
insert into public.users (id, email, name, avatar_url)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'),
  raw_user_meta_data ->> 'avatar_url'
from auth.users
on conflict (id) do nothing;

-- rooms
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  owner_id uuid not null references public.users (id) on delete cascade,
  goal_chars integer not null default 0,
  goal_minutes integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

drop policy if exists "rooms are viewable by authenticated users" on public.rooms;
create policy "rooms are viewable by authenticated users"
  on public.rooms for select
  to authenticated
  using (true);

drop policy if exists "authenticated users can create rooms as owner" on public.rooms;
create policy "authenticated users can create rooms as owner"
  on public.rooms for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "owner can update own room" on public.rooms;
create policy "owner can update own room"
  on public.rooms for update
  to authenticated
  using (auth.uid() = owner_id);

-- room_members
create table if not exists public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

alter table public.room_members enable row level security;

drop policy if exists "room members are viewable by authenticated users" on public.room_members;
create policy "room members are viewable by authenticated users"
  on public.room_members for select
  to authenticated
  using (true);

drop policy if exists "users can join a room themselves" on public.room_members;
create policy "users can join a room themselves"
  on public.room_members for insert
  to authenticated
  with check (auth.uid() = user_id);
