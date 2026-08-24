-- PoRoom: (1) 채팅 귓속말/삭제, (2)(3) 대결방(challenges) 설정·시작 대기·
-- 인원/색상, (4) 관리자(임시 챌린지, 채팅/방 삭제) 기능을 위한 스키마.

-- ── 0. 관리자 계정 플래그 ───────────────────────────────────────────
-- 아래 챌린지 insert 정책이 이 컬럼을 참조하므로, 그 정책보다 먼저
-- 만들어야 한다("column u.is_admin does not exist" 오류 방지).
alter table public.users add column if not exists is_admin boolean not null default false;
update public.users set is_admin = true where email = 'sjses4789@gmail.com';

-- ── 1. 채팅 귓속말 + 방장/부방장 메시지 삭제 ────────────────────────
alter table public.chat_messages
  add column if not exists target_user_id uuid references public.users (id) on delete cascade;

-- 귓속말(target_user_id 설정)은 보낸 사람과 받는 사람만 볼 수 있다.
drop policy if exists "room members can read messages" on public.chat_messages;
create policy "room members can read messages"
  on public.chat_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.room_members rm
      where rm.room_id = chat_messages.room_id and rm.user_id = auth.uid()
    )
    and (
      target_user_id is null
      or target_user_id = auth.uid()
      or user_id = auth.uid()
    )
  );

drop policy if exists "author or moderators can delete messages" on public.chat_messages;
create policy "author or moderators can delete messages"
  on public.chat_messages for delete
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.rooms r
      where r.id = chat_messages.room_id and r.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.room_members rm
      where rm.room_id = chat_messages.room_id and rm.user_id = auth.uid() and rm.is_vice = true
    )
  );

-- ── 2/3. 대결방(challenges): 색상/인원/기간, "시작 대기" 상태 ──────
-- start_date/end_date는 이제 대결이 실제로 "시작"된 뒤에만 채워진다
-- (그 전까지는 참가자를 모으는 대기 상태) — 그래서 NOT NULL을 푼다.
alter table public.challenges alter column start_date drop not null;
alter table public.challenges alter column end_date drop not null;

alter table public.challenges
  add column if not exists color text,
  add column if not exists capacity integer,
  add column if not exists duration_days integer not null default 7,
  add column if not exists started_at timestamptz,
  add column if not exists is_admin_event boolean not null default false;

-- kind가 있든(시스템 챌린지) 없든(1:1형 대결) 생성자 본인은 수정할 수
-- 있도록 넓힌다 — 기존엔 kind가 있는 챌린지만 수정 가능했음.
drop policy if exists "creator can update kind challenges" on public.challenges;
drop policy if exists "creator can update their challenges" on public.challenges;
create policy "creator can update their challenges"
  on public.challenges for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- 일반 유저는 is_admin_event를 스스로 켤 수 없다 — 관리자만 가능.
drop policy if exists "authenticated users can create challenges" on public.challenges;
create policy "authenticated users can create challenges"
  on public.challenges for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and (
      is_admin_event = false
      or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
    )
  );

-- ── 4. 관리자 방/챌린지/채팅 삭제 권한 ─────────────────────────────
drop policy if exists "admins can delete any room" on public.rooms;
create policy "admins can delete any room"
  on public.rooms for delete
  to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

drop policy if exists "admins can delete any challenge" on public.challenges;
create policy "admins can delete any challenge"
  on public.challenges for delete
  to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

drop policy if exists "admins can delete any chat message" on public.chat_messages;
create policy "admins can delete any chat message"
  on public.chat_messages for delete
  to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));
