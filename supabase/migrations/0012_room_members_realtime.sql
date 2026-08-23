-- PoRoom: stream room_members INSERT/DELETE over Realtime so the
-- participant card grid updates live as people join or leave a room
-- (마감방/새벽반 in particular, where membership changes constantly).

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'room_members'
  ) then
    alter publication supabase_realtime add table public.room_members;
  end if;
end $$;
