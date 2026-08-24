-- PoRoom: [개인] 페이지 하단에 추가하는 뽀모도로 통계(일별/월별 횟수,
-- 누적 집중시간/휴식시간, 체류시간 대비 집중시간 비율)를 위한 스키마.

-- 집중시간(focus_minutes)은 이미 있었지만 휴식시간은 기록되는 곳이
-- 없었다 — 뽀모도로 컨텍스트가 focus와 동일한 방식으로 분 단위 누적을
-- 서버에 반영할 수 있도록 컬럼을 추가한다.
alter table public.daily_records
  add column if not exists break_minutes integer not null default 0;

-- poroom 사이트 체류 시간(뽀모도로 진행 여부와 무관하게, (main) 레이아웃이
-- 떠 있는 동안 주기적으로 누적)을 하루 단위로 저장한다. 본인만
-- 읽고/쓸 수 있으면 충분해서 daily_records처럼 전체 공개하지 않는다.
create table if not exists public.site_time_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  record_date date not null,
  seconds integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, record_date)
);

alter table public.site_time_logs enable row level security;

drop policy if exists "users read their own site time" on public.site_time_logs;
create policy "users read their own site time"
  on public.site_time_logs for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users insert their own site time" on public.site_time_logs;
create policy "users insert their own site time"
  on public.site_time_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users update their own site time" on public.site_time_logs;
create policy "users update their own site time"
  on public.site_time_logs for update
  to authenticated
  using (auth.uid() = user_id);
