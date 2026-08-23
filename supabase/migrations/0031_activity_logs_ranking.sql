-- PoRoom: [랭킹] 페이지의 챌린지 랭킹(매일 5천자/매일 1만자/초단 완고
-- 성공 횟수 합산)은 전체 사용자를 대상으로 집계해야 하는데, 기존
-- activity_logs select 정책은 "내 로그이거나, 지금 나와 같은 챌린지에
-- 참여 중인 사람의 로그"만 허용해서 지난 기간의 성공 기록은 다른
-- 사용자에게 보이지 않았다. milestone_5k/milestone_10k/draft_done
-- 세 종류만 앱 전체 공개 지표로 열어준다.

drop policy if exists "authenticated can read milestone logs for ranking" on public.activity_logs;
create policy "authenticated can read milestone logs for ranking"
  on public.activity_logs for select
  to authenticated
  using (type in ('milestone_5k', 'milestone_10k', 'draft_done'));
