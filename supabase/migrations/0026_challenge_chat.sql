-- PoRoom: 대결/챌린지 상세 페이지 전용 채팅 — 같은 목표를 향해 달리는
-- 참여자들끼리 감정을 나눌 수 있도록 한다. 방 채팅과 동일한 패턴(participant
-- 기준 select/insert 정책, Realtime publication 등록)을 따른다.

create table if not exists public.challenge_messages (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists challenge_messages_challenge_id_created_at_idx
  on public.challenge_messages (challenge_id, created_at);

alter table public.challenge_messages enable row level security;

drop policy if exists "participants can read challenge messages" on public.challenge_messages;
create policy "participants can read challenge messages"
  on public.challenge_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.challenge_participants cp
      where cp.challenge_id = challenge_messages.challenge_id and cp.user_id = auth.uid()
    )
  );

drop policy if exists "participants can send challenge messages" on public.challenge_messages;
create policy "participants can send challenge messages"
  on public.challenge_messages for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.challenge_participants cp
      where cp.challenge_id = challenge_messages.challenge_id and cp.user_id = auth.uid()
    )
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'challenge_messages'
  ) then
    alter publication supabase_realtime add table public.challenge_messages;
  end if;
end $$;
