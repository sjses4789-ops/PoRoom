-- PoRoom: 방장이 참여자를 "차단"할 수 있도록 한다. 차단은 즉시 강제
-- 퇴장(room_members 삭제)에 더해, 방장이 풀어주기 전까지 초대코드로도
-- 오픈방 참여로도 다시 들어올 수 없게 막는 영구 명단이다.

create table if not exists public.room_bans (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  banned_at timestamptz not null default now(),
  banned_by uuid references public.users (id) on delete set null,
  primary key (room_id, user_id)
);

alter table public.room_bans enable row level security;

-- 방장은 자기 방의 차단 명단 전체를 볼 수 있다(설정 화면에 표시).
drop policy if exists "owner can view room bans" on public.room_bans;
create policy "owner can view room bans"
  on public.room_bans for select
  to authenticated
  using (
    exists (
      select 1 from public.rooms r
      where r.id = room_bans.room_id and r.owner_id = auth.uid()
    )
  );

-- 누구든 "내가 이 방에서 차단됐는지"는 스스로 확인할 수 있어야
-- 참여 시도 시점에 서버 액션에서 차단 여부를 판별할 수 있다.
drop policy if exists "user can check own ban status" on public.room_bans;
create policy "user can check own ban status"
  on public.room_bans for select
  to authenticated
  using (user_id = auth.uid());

-- 차단/차단 해제는 방장만.
drop policy if exists "owner can ban members" on public.room_bans;
create policy "owner can ban members"
  on public.room_bans for insert
  to authenticated
  with check (
    exists (
      select 1 from public.rooms r
      where r.id = room_bans.room_id and r.owner_id = auth.uid()
    )
  );

drop policy if exists "owner can unban members" on public.room_bans;
create policy "owner can unban members"
  on public.room_bans for delete
  to authenticated
  using (
    exists (
      select 1 from public.rooms r
      where r.id = room_bans.room_id and r.owner_id = auth.uid()
    )
  );
