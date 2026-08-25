-- [휴식] 게시판 개선:
-- 1) "인원 모집" 게시글에 작성자가 참여 중인 방으로 연결되는 링크를 걸 수
--    있도록 room_id 컬럼 추가 (방이 삭제되면 링크만 사라지도록 set null).
-- 2) 관리자가 다른 사람의 게시글을 수정할 수 있도록 UPDATE 정책에도
--    삭제 정책과 동일한 "작성자 또는 관리자" 조건을 적용 — 기존에는
--    작성자만 허용돼 있어 관리자가 수정 버튼을 눌러도 RLS에 막혀
--    실제로는 반영되지 않는 문제가 있었다.

alter table public.rest_posts
  add column if not exists room_id uuid references public.rooms (id) on delete set null;

drop policy if exists "author can update own rest post" on public.rest_posts;
drop policy if exists "author or admin can update rest post" on public.rest_posts;
create policy "author or admin can update rest post"
  on public.rest_posts for update
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.users u where u.id = auth.uid() and u.is_admin = true
    )
  );
