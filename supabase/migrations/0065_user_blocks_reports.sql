-- PoRoom: 참여자 개인 차단 + 신고
--
-- 1) user_blocks: "내가" 차단한 사람 목록. 차단한 사람의 채팅이 내 화면에서 숨겨진다(본인만 읽고 쓴다).
-- 2) user_reports: 참여자 신고. 누구나 신고할 수 있고(본인 명의로만), 관리자만 읽고 처리한다.
--
-- ⚠ 이 SQL을 실행하기 전에는 차단·신고 버튼이 "처리하지 못했어요"라고만 나온다(다른 기능은 영향 없음).

create table if not exists public.user_blocks (
  blocker_id uuid not null references public.users (id) on delete cascade,
  blocked_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.user_blocks enable row level security;

drop policy if exists "users can read own blocks" on public.user_blocks;
create policy "users can read own blocks"
  on public.user_blocks for select
  to authenticated
  using (auth.uid() = blocker_id);

drop policy if exists "users can block others" on public.user_blocks;
create policy "users can block others"
  on public.user_blocks for insert
  to authenticated
  with check (auth.uid() = blocker_id);

drop policy if exists "users can unblock" on public.user_blocks;
create policy "users can unblock"
  on public.user_blocks for delete
  to authenticated
  using (auth.uid() = blocker_id);

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users (id) on delete cascade,
  reported_id uuid not null references public.users (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete set null,
  reason text not null check (char_length(btrim(reason)) between 1 and 500),
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

create index if not exists user_reports_created_at_idx on public.user_reports (created_at desc);

alter table public.user_reports enable row level security;

drop policy if exists "users can report others" on public.user_reports;
create policy "users can report others"
  on public.user_reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists "admins can read reports" on public.user_reports;
create policy "admins can read reports"
  on public.user_reports for select
  to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

drop policy if exists "admins can update reports" on public.user_reports;
create policy "admins can update reports"
  on public.user_reports for update
  to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

drop policy if exists "admins can delete reports" on public.user_reports;
create policy "admins can delete reports"
  on public.user_reports for delete
  to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

revoke all on public.user_blocks from anon;
revoke all on public.user_reports from anon;

-- ── ROLLBACK ─────────────────────────────────────────────────────────
-- drop table if exists public.user_reports;
-- drop table if exists public.user_blocks;
