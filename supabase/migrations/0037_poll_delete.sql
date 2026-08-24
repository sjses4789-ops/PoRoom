-- PoRoom: 투표 삭제는 방장/부방장/투표 생성자만 할 수 있다. options/votes는
-- polls를 참조하는 외래키가 on delete cascade라서 같이 정리된다.
drop policy if exists "poll delete by owner vice or creator" on public.polls;
create policy "poll delete by owner vice or creator"
  on public.polls for delete
  to authenticated
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.rooms r
      where r.id = polls.room_id and r.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.room_members rm
      where rm.room_id = polls.room_id
        and rm.user_id = auth.uid()
        and rm.is_vice = true
    )
  );
