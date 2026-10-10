-- PoRoom: 방별 닉네임 + 방별 "상태설정"
--
-- 1) 방별 닉네임: 가입 때 정한 기본 닉네임(users.name) 말고, 방마다 다른 닉네임을 쓸 수 있다.
--    추가 닉네임은 사용자당 최대 2개(기본 닉네임 포함 총 3개)까지 만들어 두고, 방에 입장할 때
--    "기본 닉네임 / 다른 닉네임"을 고른다. 선택한 닉네임은 그 방(room_members.nickname)에만 쓰인다.
--    관리자는 모든 사용자의 모든 닉네임을 볼 수 있다.
-- 2) 방별 상태설정: 지금까지 "상태설정"은 계정(users.work_status) 하나라 다른 방에도 그대로
--    보였다. 이제 방(room_members.work_status)마다 따로 저장해서, 그 방에서 바꾼 상태는 그 방
--    사람들에게만 보인다.
--
-- ⚠ 실행 순서: 이 SQL을 먼저 실행한 뒤에 코드를 배포한다(코드가 새 컬럼을 읽는다).

-- ── 추가 닉네임 목록 ────────────────────────────────────────────────
create table if not exists public.user_nicknames (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  nickname text not null check (char_length(btrim(nickname)) between 1 and 20),
  created_at timestamptz not null default now(),
  unique (user_id, nickname)
);

create index if not exists user_nicknames_user_id_idx on public.user_nicknames (user_id);

alter table public.user_nicknames enable row level security;

drop policy if exists "users can read own nicknames" on public.user_nicknames;
create policy "users can read own nicknames"
  on public.user_nicknames for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "admins can read all nicknames" on public.user_nicknames;
create policy "admins can read all nicknames"
  on public.user_nicknames for select
  to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

drop policy if exists "users can create own nicknames" on public.user_nicknames;
create policy "users can create own nicknames"
  on public.user_nicknames for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 닉네임은 만든 뒤 수정·삭제하지 않는다(관리자가 모든 닉네임 이력을 볼 수 있어야 하므로) — 그래서
-- update/delete 정책은 두지 않는다. (계정을 탈퇴하면 users 삭제와 함께 cascade로 지워진다.)

-- 추가 닉네임은 사용자당 최대 2개(= 기본 닉네임 포함 총 3개). 동시에 여러 개를 넣는 경우까지
-- 막으려고 정책이 아니라 트리거로 강제한다.
create or replace function public.enforce_max_user_nicknames()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.user_nicknames where user_id = new.user_id) >= 2 then
    raise exception 'nickname limit reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists user_nicknames_max on public.user_nicknames;
create trigger user_nicknames_max
  before insert on public.user_nicknames
  for each row execute function public.enforce_max_user_nicknames();

-- ── 방별 닉네임 / 상태 ───────────────────────────────────────────────
-- nickname_set: 이 방에서 쓸 닉네임을 이미 골랐는지. 새로 입장하면 false여서 입장 직후 안내창이
-- 뜬다. 이미 방에 있던 사람들은 아래에서 true(= 기본 닉네임 그대로)로 맞춘다.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'room_members' and column_name = 'nickname_set'
  ) then
    alter table public.room_members add column nickname text;
    alter table public.room_members add column work_status text;
    alter table public.room_members add column nickname_set boolean not null default true;
    alter table public.room_members alter column nickname_set set default false;
    -- 기존 계정 단위 상태설정을 각 방으로 복사해 둔다.
    update public.room_members rm
      set work_status = u.work_status
      from public.users u
      where u.id = rm.user_id and u.work_status is not null;
  end if;
end $$;

-- 본인 행의 닉네임/상태는 기존 "users can update their own membership" 정책으로 바꿀 수 있다.

-- ── ROLLBACK (문제가 생겼을 때만) ────────────────────────────────────
-- alter table public.room_members drop column if exists nickname, drop column if exists work_status, drop column if exists nickname_set;
-- drop table if exists public.user_nicknames;
-- drop function if exists public.enforce_max_user_nicknames();
