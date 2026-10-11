-- PoRoom: 쪽지(1:1 메시지)
--
-- 방 참여자 카드를 우클릭해서 보내는 쪽지. 받은 사람만 읽을 수 있고(보낸 사람도 자기가 보낸 것은 읽는다),
-- 받은 사람이 상대를 차단했다면 쪽지는 보낼 수 없다. sender_name은 보낸 시점에 상대가 보게 될 이름
-- (그 방의 닉네임이 있으면 닉네임, 없으면 기본 닉네임)을 그대로 적어 두어, 방 닉네임으로 숨긴 실명이
-- 쪽지로 드러나지 않게 한다.
--
-- ⚠ 이 SQL을 실행하기 전에는 쪽지 보내기/우편함이 "처리하지 못했어요"라고만 나온다(다른 기능은 영향 없음).

create table if not exists public.direct_notes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users (id) on delete cascade,
  recipient_id uuid not null references public.users (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete set null,
  sender_name text not null,
  content text not null check (char_length(btrim(content)) between 1 and 1000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists direct_notes_recipient_idx on public.direct_notes (recipient_id, created_at desc);

-- 받는 사람이 나를 차단했는지 확인한다. 차단 목록(user_blocks)은 차단한 본인만 읽을 수 있어서, RLS를
-- 우회하는 security definer 함수로만 확인하고 결과(참/거짓)만 돌려준다.
create or replace function public.is_blocked_by(blocker uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_blocks b
    where b.blocker_id = blocker and b.blocked_id = auth.uid()
  );
$$;

revoke all on function public.is_blocked_by(uuid) from public;
grant execute on function public.is_blocked_by(uuid) to authenticated;

alter table public.direct_notes enable row level security;

drop policy if exists "users can send notes" on public.direct_notes;
create policy "users can send notes"
  on public.direct_notes for insert
  to authenticated
  with check (auth.uid() = sender_id and not public.is_blocked_by(recipient_id));

drop policy if exists "sender and recipient can read notes" on public.direct_notes;
create policy "sender and recipient can read notes"
  on public.direct_notes for select
  to authenticated
  using (auth.uid() = recipient_id or auth.uid() = sender_id);

-- 받은 사람만 읽음 표시(read_at)를 바꾼다.
drop policy if exists "recipient can mark notes read" on public.direct_notes;
create policy "recipient can mark notes read"
  on public.direct_notes for update
  to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

drop policy if exists "recipient can delete notes" on public.direct_notes;
create policy "recipient can delete notes"
  on public.direct_notes for delete
  to authenticated
  using (auth.uid() = recipient_id);

revoke all on public.direct_notes from anon;

-- 새 쪽지가 오면 우편함 아이콘이 바로 바뀌도록 실시간 구독 대상에 넣는다.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'direct_notes'
  ) then
    alter publication supabase_realtime add table public.direct_notes;
  end if;
end $$;

-- ── ROLLBACK ─────────────────────────────────────────────────────────
-- drop table if exists public.direct_notes;
-- drop function if exists public.is_blocked_by(uuid);
