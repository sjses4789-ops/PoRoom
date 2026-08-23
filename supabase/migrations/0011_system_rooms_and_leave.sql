-- PoRoom: mark system rooms (마감방/새벽반) so they can be treated
-- differently from regular rooms (no owner UI, capacity enforced without
-- auto-expanding into numbered siblings), and allow any member to remove
-- themselves from a room (leave).

alter table public.rooms
  add column if not exists is_system boolean not null default false;

drop policy if exists "users can leave a room themselves" on public.room_members;
create policy "users can leave a room themselves"
  on public.room_members for delete
  to authenticated
  using (auth.uid() = user_id);
