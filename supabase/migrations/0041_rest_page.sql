-- PoRoom: [휴식] 페이지 — 타자 연습 기록과 사이트 전역 게시판(자유/정보/
-- 인원 모집).

create table if not exists public.rest_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  category text not null check (category in ('자유', '정보', '인원 모집')),
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists rest_posts_created_at_idx
  on public.rest_posts (created_at desc);

alter table public.rest_posts enable row level security;

drop policy if exists "authenticated can read rest posts" on public.rest_posts;
create policy "authenticated can read rest posts"
  on public.rest_posts for select
  to authenticated
  using (true);

drop policy if exists "users can create rest posts" on public.rest_posts;
create policy "users can create rest posts"
  on public.rest_posts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "author can update own rest post" on public.rest_posts;
create policy "author can update own rest post"
  on public.rest_posts for update
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "author or admin can delete rest post" on public.rest_posts;
create policy "author or admin can delete rest post"
  on public.rest_posts for delete
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.users u where u.id = auth.uid() and u.is_admin = true
    )
  );

-- 타자 연습: 문장을 완주할 때마다 기록을 남기고, 랭킹은 유저별 최고
-- 속도(cpm)만 뽑아서 보여준다.
create table if not exists public.typing_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  cpm integer not null check (cpm >= 0),
  accuracy integer not null check (accuracy between 0 and 100),
  created_at timestamptz not null default now()
);

create index if not exists typing_scores_user_id_cpm_idx
  on public.typing_scores (user_id, cpm desc);

alter table public.typing_scores enable row level security;

drop policy if exists "authenticated can read typing scores" on public.typing_scores;
create policy "authenticated can read typing scores"
  on public.typing_scores for select
  to authenticated
  using (true);

drop policy if exists "users can insert own typing score" on public.typing_scores;
create policy "users can insert own typing score"
  on public.typing_scores for insert
  to authenticated
  with check (auth.uid() = user_id);
