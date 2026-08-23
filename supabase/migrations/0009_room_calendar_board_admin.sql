-- PoRoom: room calendar events, room free board, and room-owner admin
-- actions (kick a member, transfer ownership).

create table if not exists public.room_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  title text not null,
  event_date date not null,
  memo text,
  created_by uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists room_events_room_id_event_date_idx
  on public.room_events (room_id, event_date);

alter table public.room_events enable row level security;

drop policy if exists "room members can read events" on public.room_events;
create policy "room members can read events"
  on public.room_events for select
  to authenticated
  using (
    exists (
      select 1 from public.room_members rm
      where rm.room_id = room_events.room_id and rm.user_id = auth.uid()
    )
  );

drop policy if exists "room members can create events" on public.room_events;
create policy "room members can create events"
  on public.room_events for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.room_members rm
      where rm.room_id = room_events.room_id and rm.user_id = auth.uid()
    )
  );

drop policy if exists "creator can delete own events" on public.room_events;
create policy "creator can delete own events"
  on public.room_events for delete
  to authenticated
  using (auth.uid() = created_by);

create table if not exists public.room_posts (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists room_posts_room_id_created_at_idx
  on public.room_posts (room_id, created_at desc);

alter table public.room_posts enable row level security;

drop policy if exists "room members can read posts" on public.room_posts;
create policy "room members can read posts"
  on public.room_posts for select
  to authenticated
  using (
    exists (
      select 1 from public.room_members rm
      where rm.room_id = room_posts.room_id and rm.user_id = auth.uid()
    )
  );

drop policy if exists "room members can create posts" on public.room_posts;
create policy "room members can create posts"
  on public.room_posts for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.room_members rm
      where rm.room_id = room_posts.room_id and rm.user_id = auth.uid()
    )
  );

-- owner can kick a member out of their room
drop policy if exists "owner can remove members" on public.room_members;
create policy "owner can remove members"
  on public.room_members for delete
  to authenticated
  using (
    exists (
      select 1 from public.rooms r
      where r.id = room_members.room_id and r.owner_id = auth.uid()
    )
  );

-- allow the owner to hand off owner_id to someone else (the default UPDATE
-- policy's implicit WITH CHECK would otherwise require owner_id to still
-- equal auth.uid() after the update, blocking a transfer).
drop policy if exists "owner can update own room" on public.rooms;
create policy "owner can update own room"
  on public.rooms for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (true);
