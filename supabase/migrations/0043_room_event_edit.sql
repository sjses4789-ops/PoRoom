-- PoRoom: 방 일정도 게시판처럼 작성자 본인이나 방장/부방장이 수정·삭제할
-- 수 있게 한다. 기존 삭제 정책은 작성자만 허용했으므로 방장/부방장도
-- 포함하도록 바꾸고, 수정 정책은 새로 만든다.
drop policy if exists "creator can delete own events" on public.room_events;
create policy "creator, owner or vice can delete events"
  on public.room_events for delete
  to authenticated
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.rooms r
      where r.id = room_events.room_id and r.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.room_members rm
      where rm.room_id = room_events.room_id
        and rm.user_id = auth.uid()
        and rm.is_vice = true
    )
  );

drop policy if exists "creator, owner or vice can update events" on public.room_events;
create policy "creator, owner or vice can update events"
  on public.room_events for update
  to authenticated
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.rooms r
      where r.id = room_events.room_id and r.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.room_members rm
      where rm.room_id = room_events.room_id
        and rm.user_id = auth.uid()
        and rm.is_vice = true
    )
  );
