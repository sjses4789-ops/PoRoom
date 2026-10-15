-- PoRoom: 출석일 계산 — 각자의 시간대 자정 기준, 기록이 많아도 빠지지 않게
--
-- 문제: 출석일은 activity_logs(글자수 기록·집중 시간 기록이 남을 때마다 한 줄)에서 날짜를 뽑는데, 웹은 이 로그를 통째로
-- 가져온다. 조회는 한 번에 1000행까지만 돌려주고, 집중 시간은 1분마다 한 줄씩 쌓이므로 많이 쓴 사용자는 로그가 금방
-- 1000줄을 넘어 "가장 최근 날(오늘)"이 빠져 출석이 인정되지 않았다.
--
-- my_attendance_dates(p_tz): 내 출석 날짜 목록만 DB에서 계산해 돌려준다(날짜는 p_tz 시간대의 자정 기준 — 한국은 한국 0시,
-- 일본은 일본 0시, 미국·중국도 각자 0시). 알 수 없는 시간대면 한국 시간으로 계산한다.

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
  -- 시간대 이름이 올바른지 확인한다(올바르지 않으면 한국 시간).
  if not exists (select 1 from pg_timezone_names where name = tz) then
    tz := 'Asia/Seoul';
  end if;

  return query
    select distinct (a.created_at at time zone tz)::date
      from public.activity_logs a
     where a.user_id = auth.uid()
       and a.type in ('chars_added', 'focus_recorded');
end;
$$;

revoke all on function public.my_attendance_dates(text) from public, anon;
grant execute on function public.my_attendance_dates(text) to authenticated;

-- ── ROLLBACK ──────────────────────────────────────────────
-- drop function if exists public.my_attendance_dates(text);
