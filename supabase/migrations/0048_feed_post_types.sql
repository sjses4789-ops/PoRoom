-- PoRoom: 피드에 글쓰기 종류(post_type) 추가 — 집필/대결/챌린지/투고/공모전.
-- 종류별 전용 정보(투고 출판사 수·장르, 공모전 이름·글자수, 대결/챌린지
-- 결과 등)는 meta jsonb에 담는다. focus_minutes/chars 컬럼은 '집필'
-- 종류에서만 쓰인다(그 외 종류는 0).

alter table public.feed_posts
  add column if not exists post_type text not null default 'write'
    check (post_type in ('write', 'duel', 'challenge', 'submission', 'contest'));

alter table public.feed_posts
  add column if not exists meta jsonb not null default '{}'::jsonb;
