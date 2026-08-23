-- PoRoom: 사이트 전역 "기능 제안 & 버그 신고" 방명록형 게시판.
create table if not exists public.feedback_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  category text not null check (category in ('suggestion', 'bug')),
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists feedback_posts_created_at_idx
  on public.feedback_posts (created_at desc);

alter table public.feedback_posts enable row level security;

drop policy if exists "authenticated can read feedback posts" on public.feedback_posts;
create policy "authenticated can read feedback posts"
  on public.feedback_posts for select
  to authenticated
  using (true);

drop policy if exists "users can post their own feedback" on public.feedback_posts;
create policy "users can post their own feedback"
  on public.feedback_posts for insert
  to authenticated
  with check (auth.uid() = user_id);
