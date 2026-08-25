-- PoRoom: [피드] — 오늘의 집중시간/글자수와 기분을 짧게 남기고, 다른
-- 이용자들이 하트/응원 반응을 남길 수 있는 사이트 전역 SNS 피드.

create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  mood text not null,
  focus_minutes integer not null default 0 check (focus_minutes >= 0),
  chars integer not null default 0 check (chars >= 0),
  created_at timestamptz not null default now()
);

create index if not exists feed_posts_created_at_idx
  on public.feed_posts (created_at desc);

alter table public.feed_posts enable row level security;

drop policy if exists "authenticated can read feed posts" on public.feed_posts;
create policy "authenticated can read feed posts"
  on public.feed_posts for select
  to authenticated
  using (true);

drop policy if exists "users can create own feed posts" on public.feed_posts;
create policy "users can create own feed posts"
  on public.feed_posts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "author can delete own feed post" on public.feed_posts;
create policy "author can delete own feed post"
  on public.feed_posts for delete
  to authenticated
  using (auth.uid() = user_id);

-- 반응은 이용자당 게시글당 종류별로 하나씩만(하트/멋져요/대단해요 중복 무관,
-- 같은 종류 중복은 불가) — 다시 누르면 취소(delete)하는 토글 방식으로 쓴다.
create table if not exists public.feed_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  reaction_type text not null check (reaction_type in ('heart', 'clap', 'fire')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, reaction_type)
);

create index if not exists feed_reactions_post_id_idx
  on public.feed_reactions (post_id);

alter table public.feed_reactions enable row level security;

drop policy if exists "authenticated can read feed reactions" on public.feed_reactions;
create policy "authenticated can read feed reactions"
  on public.feed_reactions for select
  to authenticated
  using (true);

drop policy if exists "users can create own feed reactions" on public.feed_reactions;
create policy "users can create own feed reactions"
  on public.feed_reactions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users can delete own feed reactions" on public.feed_reactions;
create policy "users can delete own feed reactions"
  on public.feed_reactions for delete
  to authenticated
  using (auth.uid() = user_id);
