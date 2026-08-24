-- PoRoom: 헤더의 BASIC/PREMIUM 등급 배지용 플래그. 결제는 아직 미구현
-- (추후 5,900원 결제 시 광고 제거 + 참여자 카드 펫 이미지 기능을 열어줄
-- 예정) — 지금은 항상 false로 시작해서 배지가 BASIC으로만 보인다.
alter table public.users add column if not exists is_premium boolean not null default false;
