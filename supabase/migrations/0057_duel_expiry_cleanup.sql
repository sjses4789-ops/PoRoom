-- PoRoom: 대결 기간이 끝난 지 3일이 지난 1:1 대결방은 자동으로 정리한다.
-- (챌린지 목록/상세 페이지를 불러올 때마다 lazy하게 정리 — pg_cron 등
-- 예약 실행 권한이 없는 환경이라 시스템 챌린지 주/월 리셋과 같은 패턴을
-- 쓴다. daily_records/activity_logs는 challenge_id를 참조하지 않으므로
-- 대결방이 삭제돼도 참여자 개인 기록은 전혀 영향받지 않는다.)
--
-- 시스템 챌린지(kind IS NOT NULL)와 관리자 지정 이벤트(is_admin_event)는
-- 대상에서 제외 — 반복/영구 운영되는 챌린지라 end_date가 지나도 삭제
-- 대상이 아니다.

drop policy if exists "anyone can delete expired duels" on public.challenges;
create policy "anyone can delete expired duels"
  on public.challenges for delete
  to authenticated
  using (
    kind is null
    and is_admin_event = false
    and end_date is not null
    and end_date < (current_date - interval '3 days')::date
  );
