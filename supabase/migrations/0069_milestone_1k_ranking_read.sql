-- PoRoom: [랭킹]의 챌린지 랭킹 점수에 "매일 1천자" 성공(milestone_1k)이 들어가므로, 이 로그도 다른
-- 마일스톤 로그(0031)처럼 앱 전체 공개 지표로 읽을 수 있게 한다. (0068을 먼저 실행해야 한다.)
--
-- 점수: 1천자 1점 · 5천자 2점 · 1만자 3점 · 초단 5점 · 관리자 이벤트 7점.

drop policy if exists "authenticated can read milestone logs for ranking" on public.activity_logs;
create policy "authenticated can read milestone logs for ranking"
  on public.activity_logs for select
  to authenticated
  using (type in ('milestone_1k', 'milestone_5k', 'milestone_10k', 'draft_done'));

-- ── ROLLBACK ──────────────────────────────────────────────
-- drop policy if exists "authenticated can read milestone logs for ranking" on public.activity_logs;
-- create policy "authenticated can read milestone logs for ranking" on public.activity_logs for select to authenticated
--   using (type in ('milestone_5k', 'milestone_10k', 'draft_done'));
