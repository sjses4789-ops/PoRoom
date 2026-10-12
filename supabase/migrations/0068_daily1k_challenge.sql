-- PoRoom: 반복형 시스템 챌린지에 "매일 1천자 쓰기"(daily1k)를 추가한다.
--  - challenges.kind 허용 값에 daily1k 추가
--  - activity_logs.type 허용 값에 milestone_1k 추가(1천자 달성 기록)
-- ⚠ 이 SQL을 실행하기 전에는 [도전] 페이지에서 1천자 챌린지 행이 만들어지지 않는다(나머지는 정상 동작).

alter table public.challenges drop constraint if exists challenges_kind_check;
alter table public.challenges
  add constraint challenges_kind_check
  check (kind in ('daily1k', 'daily5k', 'daily10k', 'monthly_draft'));

alter table public.activity_logs drop constraint if exists activity_logs_type_check;
alter table public.activity_logs
  add constraint activity_logs_type_check
  check (type in (
    'session_start', 'session_end', 'chars_added', 'focus_recorded',
    'milestone_1k', 'milestone_5k', 'milestone_10k', 'draft_done'
  ));

-- ── ROLLBACK ──────────────────────────────────────────────
-- delete from public.challenges where kind = 'daily1k';
-- delete from public.activity_logs where type = 'milestone_1k';
-- alter table public.challenges drop constraint if exists challenges_kind_check;
-- alter table public.challenges add constraint challenges_kind_check check (kind in ('daily5k', 'daily10k', 'monthly_draft'));
-- alter table public.activity_logs drop constraint if exists activity_logs_type_check;
-- alter table public.activity_logs add constraint activity_logs_type_check check (type in ('session_start', 'session_end', 'chars_added', 'focus_recorded', 'milestone_5k', 'milestone_10k', 'draft_done'));
