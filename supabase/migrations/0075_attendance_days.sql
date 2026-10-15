-- PoRoom: poroom에 들어오기만 해도 출석 인정
--
-- 지금까지는 글자수를 입력하거나 집중 시간이 기록돼야(activity_logs) 그날 출석으로 쳤다. 이제는 poroom 페이지에 들어와
-- 있는 것만으로도 그날 출석이다. 날짜는 각자 시간대의 자정 기준(한국은 한국 0시, 일본은 일본 0시 …)이고, 앱이 접속할 때
-- 그날 한 줄(attendance_days)을 남기며, my_attendance_dates()가 기존 기록 로그 날짜와 합쳐서 돌려준다.
--
-- ⚠ 0074를 먼저 실행해야 한다.

create table if not exists public.attendance_days (
  user_id uuid not null references public.users (id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.attendance_days enable row level security;

drop policy if exists "users can read own attendance" on public.attendance_days;
create policy "users can read own attendance"
  on public.attendance_days for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users can mark own attendance" on public.attendance_days;
create policy "users can mark own attendance"
  on public.attendance_days for insert
  to authenticated
  with check (auth.uid() = user_id);

revoke all on public.attendance_days from anon;

-- 출석 날짜 = (접속해서 남긴 날) + (글자수·집중 시간 기록이 있는 날, p_tz 자정 기준).
create or replace function public.my_attendance_dates(p_tz text default 'Asia/Seoul')
returns setof date
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  tz text := coalesce(nullif(btrim(p_tz), ''), 'Asia/Seoul');
begin
  if not exists (select 1 from pg_timezone_names where name = tz) then
    tz := 'Asia/Seoul';
  end if;

  return query
    select d.day from public.attendance_days d where d.user_id = auth.uid()
    union
    select (a.created_at at time zone tz)::date
      from public.activity_logs a
     where a.user_id = auth.uid()
       and a.type in ('chars_added', 'focus_recorded');
end;
$$;

revoke all on function public.my_attendance_dates(text) from public, anon;
grant execute on function public.my_attendance_dates(text) to authenticated;

-- ── ROLLBACK ──────────────────────────────────────────────
-- 0074의 my_attendance_dates 정의로 되돌린 뒤: drop table if exists public.attendance_days;
