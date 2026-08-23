-- PoRoom: chat messages + realtime publication
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_room_id_created_at_idx
  on public.chat_messages (room_id, created_at);

alter table public.chat_messages enable row level security;

drop policy if exists "room members can read messages" on public.chat_messages;
create policy "room members can read messages"
  on public.chat_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.room_members rm
      where rm.room_id = chat_messages.room_id and rm.user_id = auth.uid()
    )
  );

drop policy if exists "room members can send messages" on public.chat_messages;
create policy "room members can send messages"
  on public.chat_messages for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.room_members rm
      where rm.room_id = chat_messages.room_id and rm.user_id = auth.uid()
    )
  );

-- make sure chat inserts stream over Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;
