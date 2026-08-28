-- PoRoom: 1:1형 대결(challenges.kind가 NULL인 것)을 만들 때 "웹툰 작가
-- 대상/웹소설 작가 대상/누구나"를 고를 수 있게 한다. 글자수·컷수는
-- 서로 다른 단위라 metric이 'chars'(=웹소설의 글자수 또는 웹툰의
-- 컷수)면 대상을 반드시 하나로 좁혀야 하고, 'minutes'(집중 시간)일
-- 때만 누구나(NULL) 섞여서 겨룰 수 있다 — 이 규칙은 앱 코드
-- (createChallenge)에서 검증한다. 시스템 챌린지(kind 있음)는 아직
-- 웹툰 작가 대상을 지원하지 않아 이 값을 쓰지 않는다.
alter table public.challenges
  add column if not exists target_position text
    check (target_position in ('novelist', 'webtoon'));
