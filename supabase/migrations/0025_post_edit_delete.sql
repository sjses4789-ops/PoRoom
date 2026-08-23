-- PoRoom: 게시글 작성자 본인 또는 방장/부방장이 게시글을 수정·삭제할 수
-- 있도록 UPDATE/DELETE 정책을 추가한다 (지금까지 room_posts에는 select·
-- insert 정책만 있었다).

drop policy if exists "author or moderators can update posts" on public.room_posts;
create policy "author or moderators can update posts"
  on public.room_posts for update
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.rooms r
      where r.id = room_posts.room_id and r.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.room_members rm2
      where rm2.room_id = room_posts.room_id
        and rm2.user_id = auth.uid()
        and rm2.is_vice = true
    )
  )
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.rooms r
      where r.id = room_posts.room_id and r.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.room_members rm2
      where rm2.room_id = room_posts.room_id
        and rm2.user_id = auth.uid()
        and rm2.is_vice = true
    )
  );

drop policy if exists "author or moderators can delete posts" on public.room_posts;
create policy "author or moderators can delete posts"
  on public.room_posts for delete
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.rooms r
      where r.id = room_posts.room_id and r.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.room_members rm2
      where rm2.room_id = room_posts.room_id
        and rm2.user_id = auth.uid()
        and rm2.is_vice = true
    )
  );
