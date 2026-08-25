-- PoRoom: 공지사항 게시글에 "고정" 표시를 추가한다. 고정된 공지는
-- 게시판 정렬에서 항상 맨 위에 오도록 클라이언트에서 pinned desc,
-- created_at desc로 정렬한다 — is_notice(공지사항 카테고리인지 여부)와는
-- 별개로, 공지사항 중에서도 특정 글만 상단 고정할 수 있게 하는 값이다.

alter table public.room_posts
  add column if not exists pinned boolean not null default false;

-- 고정은 공지사항 게시글에서만 의미가 있다 — is_notice가 true인 글만
-- pinned를 true로 둘 수 있다(다른 카테고리 글을 고정하는 걸 막는다).
alter table public.room_posts
  drop constraint if exists room_posts_pinned_requires_notice;
alter table public.room_posts
  add constraint room_posts_pinned_requires_notice
  check (not pinned or is_notice);
