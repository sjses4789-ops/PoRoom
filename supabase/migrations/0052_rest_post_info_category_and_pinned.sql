-- PoRoom: [휴식]-'정보' 게시판에 관리자 고정 공지와 카테고리 기능을 추가한다.

-- 관리자가 쓴 공지글을 항상 상단에 고정할 수 있도록 한다. 고정은
-- '정보' 게시판 글에서만 의미가 있다(다른 카테고리 글을 고정하는 걸
-- 막는다) — 실제 "관리자만 고정 가능"은 서버 액션에서 isCurrentUserAdmin()
-- 으로 확인한다(체크 제약에서는 auth 컨텍스트를 볼 수 없어서).
alter table public.rest_posts
  add column if not exists pinned boolean not null default false;

alter table public.rest_posts
  drop constraint if exists rest_posts_pinned_requires_info;
alter table public.rest_posts
  add constraint rest_posts_pinned_requires_info
  check (not pinned or category = '정보');

-- '정보' 게시판 글에 붙일 수 있는 하위 카테고리(팁&노하우/공모전/질문/기타) —
-- 다른 카테고리(자유/인원 모집) 글에는 값이 없어야 한다. 정보 글이라도
-- 값이 비어 있을 수 있다(기존 글, 혹은 카테고리 없이 작성한 글).
alter table public.rest_posts
  add column if not exists info_category text;

alter table public.rest_posts
  drop constraint if exists rest_posts_info_category_valid;
alter table public.rest_posts
  add constraint rest_posts_info_category_valid
  check (
    (category = '정보' and (info_category is null or info_category in ('팁&노하우', '공모전', '질문', '기타')))
    or (category <> '정보' and info_category is null)
  );
