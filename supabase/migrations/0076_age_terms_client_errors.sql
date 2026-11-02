-- PoRoom: 가입 시 나이 확인·약관 동의 기록, 클라이언트 오류 기록
--
--  1) users.birth_year, users.terms_agreed_at — 가입(온보딩) 때 입력한 생년(만 나이는 서버가 생년월일로 계산해 만 14세 이상만
--     통과시키고, 생년월일 전체는 저장하지 않는다)과 약관·개인정보 동의 시각. 이미 가입한 사람은 null이라, 다음 접속 때
--     한 번 입력하게 한다(앱이 /consent 로 보낸다).
--  2) client_errors — 사용자 화면에서 난 오류를 서버가 모아 관리자가 보는 간단한 오류 기록(서버가 서비스 키로만 쓴다).
--
-- ⚠ 이 SQL을 실행하기 전에는: 가입 화면이 나이 입력을 저장하지 못한다(가입이 막히지는 않는다 — 앱이 열이 없으면 건너뛴다).

alter table public.users add column if not exists birth_year integer check (birth_year is null or birth_year between 1900 and 2100);
alter table public.users add column if not exists terms_agreed_at timestamptz;

create table if not exists public.client_errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references public.users (id) on delete set null,
  message text not null,
  stack text,
  url text,
  user_agent text
);

create index if not exists client_errors_created_at_idx on public.client_errors (created_at desc);

alter table public.client_errors enable row level security;

-- 관리자만 읽고 지운다(쓰기는 서버가 서비스 키로 하므로 정책이 필요 없다).
drop policy if exists "admins can read client errors" on public.client_errors;
create policy "admins can read client errors"
  on public.client_errors for select
  to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

drop policy if exists "admins can delete client errors" on public.client_errors;
create policy "admins can delete client errors"
  on public.client_errors for delete
  to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

revoke all on public.client_errors from anon;

-- ── ROLLBACK ──────────────────────────────────────────────
-- drop table if exists public.client_errors;
-- alter table public.users drop column if exists birth_year, drop column if exists terms_agreed_at;
