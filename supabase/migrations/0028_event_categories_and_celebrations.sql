-- PoRoom: 일정 기본 카테고리(공모전/출판사 투고/출간/기타) 기존 방
-- 백필 + "출간" 카테고리 일정에 대한 🎉 축하 클릭 기능.

insert into public.room_event_categories (room_id, name, color, created_by)
select r.id, c.name, c.color, r.owner_id
from public.rooms r
cross join (
  values ('공모전', 'amber'), ('출판사 투고', 'blue'), ('출간', 'rose'), ('기타', 'neutral')
) as c(name, color)
where r.is_system = false
  and not exists (
    select 1 from public.room_event_categories rec
    where rec.room_id = r.id and rec.name = c.name
  );

create table if not exists public.event_celebrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.room_events (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table public.event_celebrations enable row level security;

drop policy if exists "room members can read celebrations" on public.event_celebrations;
create policy "room members can read celebrations"
  on public.event_celebrations for select
  to authenticated
  using (
    exists (
      select 1 from public.room_events e
      join public.room_members rm on rm.room_id = e.room_id
      where e.id = event_celebrations.event_id and rm.user_id = auth.uid()
    )
  );

drop policy if exists "room members can celebrate" on public.event_celebrations;
create policy "room members can celebrate"
  on public.event_celebrations for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.room_events e
      join public.room_members rm on rm.room_id = e.room_id
      where e.id = event_celebrations.event_id and rm.user_id = auth.uid()
    )
  );

drop policy if exists "users can remove their own celebration" on public.event_celebrations;
create policy "users can remove their own celebration"
  on public.event_celebrations for delete
  to authenticated
  using (auth.uid() = user_id);
