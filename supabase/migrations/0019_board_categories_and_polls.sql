-- PoRoom: 게시판을 4개 분류(공지사항/정보 공유/팁 전수/자유)로 나누고,
-- 방마다 투표(찬반/후보, 익명 옵션)를 만들 수 있는 기능을 추가한다.

alter table public.room_posts
  add column if not exists category text not null default '자유'
    check (category in ('공지사항', '정보 공유', '팁 전수', '자유'));

-- "공지사항" 분류로 글을 쓰는 것도 예전 is_notice와 동일하게 방장/부방장만
-- 가능하도록 정책을 갱신한다.
drop policy if exists "room members can create posts" on public.room_posts;
create policy "room members can create posts"
  on public.room_posts for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.room_members rm
      where rm.room_id = room_posts.room_id and rm.user_id = auth.uid()
    )
    and (
      category <> '공지사항'
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
  );

-- 투표
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  created_by uuid not null references public.users (id) on delete cascade,
  title text not null,
  poll_type text not null check (poll_type in ('yesno', 'candidates')),
  is_anonymous_vote boolean not null default false,
  is_anonymous_creator boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists polls_room_id_created_at_idx
  on public.polls (room_id, created_at desc);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  label text not null,
  position integer not null default 0
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  option_id uuid not null references public.poll_options (id) on delete cascade,
  voter_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, voter_id)
);

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

drop policy if exists "room members can read polls" on public.polls;
create policy "room members can read polls"
  on public.polls for select
  to authenticated
  using (
    exists (
      select 1 from public.room_members rm
      where rm.room_id = polls.room_id and rm.user_id = auth.uid()
    )
  );

drop policy if exists "room members can create polls" on public.polls;
create policy "room members can create polls"
  on public.polls for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.room_members rm
      where rm.room_id = polls.room_id and rm.user_id = auth.uid()
    )
  );

drop policy if exists "room members can read poll options" on public.poll_options;
create policy "room members can read poll options"
  on public.poll_options for select
  to authenticated
  using (
    exists (
      select 1 from public.polls p
      join public.room_members rm on rm.room_id = p.room_id
      where p.id = poll_options.poll_id and rm.user_id = auth.uid()
    )
  );

drop policy if exists "poll creator can add options" on public.poll_options;
create policy "poll creator can add options"
  on public.poll_options for insert
  to authenticated
  with check (
    exists (
      select 1 from public.polls p
      where p.id = poll_options.poll_id and p.created_by = auth.uid()
    )
  );

drop policy if exists "room members can read votes" on public.poll_votes;
create policy "room members can read votes"
  on public.poll_votes for select
  to authenticated
  using (
    exists (
      select 1 from public.polls p
      join public.room_members rm on rm.room_id = p.room_id
      where p.id = poll_votes.poll_id and rm.user_id = auth.uid()
    )
  );

drop policy if exists "room members can vote" on public.poll_votes;
create policy "room members can vote"
  on public.poll_votes for insert
  to authenticated
  with check (
    auth.uid() = voter_id
    and exists (
      select 1 from public.polls p
      join public.room_members rm on rm.room_id = p.room_id
      where p.id = poll_votes.poll_id and rm.user_id = auth.uid()
    )
  );

drop policy if exists "voters can change their own vote" on public.poll_votes;
create policy "voters can change their own vote"
  on public.poll_votes for update
  to authenticated
  using (auth.uid() = voter_id)
  with check (auth.uid() = voter_id);
