-- PoRoom: room event categories (owner-managed), vice-host role, pinned
-- board notices (owner/vice only), and a missing UPDATE policy for
-- room_members that was silently no-oping share_records/last_seen_at
-- self-updates ever since they were introduced.

create table if not exists public.room_event_categories (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  name text not null,
  color text not null default 'neutral',
  created_by uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.room_event_categories enable row level security;

drop policy if exists "room members can read categories" on public.room_event_categories;
create policy "room members can read categories"
  on public.room_event_categories for select
  to authenticated
  using (
    exists (
      select 1 from public.room_members rm
      where rm.room_id = room_event_categories.room_id and rm.user_id = auth.uid()
    )
  );

drop policy if exists "owner can create categories" on public.room_event_categories;
create policy "owner can create categories"
  on public.room_event_categories for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.rooms r
      where r.id = room_event_categories.room_id and r.owner_id = auth.uid()
    )
  );

drop policy if exists "owner can delete categories" on public.room_event_categories;
create policy "owner can delete categories"
  on public.room_event_categories for delete
  to authenticated
  using (
    exists (
      select 1 from public.rooms r
      where r.id = room_event_categories.room_id and r.owner_id = auth.uid()
    )
  );

alter table public.room_events
  add column if not exists category_id uuid references public.room_event_categories (id) on delete set null;

-- vice-host role
alter table public.room_members
  add column if not exists is_vice boolean not null default false;

-- room_members had NO update policy at all until now, which meant any
-- UPDATE (share_records toggle, last_seen_at heartbeat) matched zero rows
-- and silently did nothing.
drop policy if exists "users can update their own membership" on public.room_members;
create policy "users can update their own membership"
  on public.room_members for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "owner can update member roles" on public.room_members;
create policy "owner can update member roles"
  on public.room_members for update
  to authenticated
  using (
    exists (
      select 1 from public.rooms r
      where r.id = room_members.room_id and r.owner_id = auth.uid()
    )
  )
  with check (true);

-- pinned notices: only the owner or a vice-host may set is_notice = true
alter table public.room_posts
  add column if not exists is_notice boolean not null default false;

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
    and (
      is_notice = false
      or exists (
        select 1 from public.rooms r
        where r.id = room_posts.room_id and r.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.room_members rm2
        where rm2.room_id = room_posts.room_id
          and rm2.user_id = auth.uid()
          and rm2.is_vice = true
      )
    )
  );
