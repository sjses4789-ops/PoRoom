-- PoRoom: 시스템이 자동 관리하는 반복형 챌린지(매일 5천자/매일 1만자 쓰기,
-- 매 달 초단 완고) — 대결(challenges) 테이블을 그대로 재사용하되, kind로
-- 구분되는 싱글턴 행이며 기간(start_date/end_date)은 매주 월요일 또는
-- 매 달 1일마다 애플리케이션 코드가 새 기간으로 갱신(리셋)한다.

alter table public.challenges
  add column if not exists kind text check (kind in ('daily5k', 'daily10k', 'monthly_draft'));

create unique index if not exists challenges_kind_uidx
  on public.challenges (kind) where kind is not null;

alter table public.activity_logs drop constraint if exists activity_logs_type_check;
alter table public.activity_logs
  add constraint activity_logs_type_check
  check (type in (
    'session_start', 'session_end', 'chars_added', 'focus_recorded',
    'milestone_5k', 'milestone_10k', 'draft_done'
  ));

drop policy if exists "authenticated users can create challenges" on public.challenges;
create policy "authenticated users can create challenges"
  on public.challenges for insert
  to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "creator can update kind challenges" on public.challenges;
create policy "creator can update kind challenges"
  on public.challenges for update
  to authenticated
  using (kind is not null)
  with check (kind is not null);
