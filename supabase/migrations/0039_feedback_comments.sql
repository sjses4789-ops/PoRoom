-- PoRoom: 피드백 게시글에 관리자만 댓글을 달 수 있는 기능(공식 답변용).
create table if not exists public.feedback_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feedback_posts (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists feedback_comments_post_id_created_at_idx
  on public.feedback_comments (post_id, created_at asc);

alter table public.feedback_comments enable row level security;

drop policy if exists "authenticated can read feedback comments" on public.feedback_comments;
create policy "authenticated can read feedback comments"
  on public.feedback_comments for select
  to authenticated
  using (true);

drop policy if exists "admins can post feedback comments" on public.feedback_comments;
create policy "admins can post feedback comments"
  on public.feedback_comments for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.users u where u.id = auth.uid() and u.is_admin = true
    )
  );

drop policy if exists "admins can delete feedback comments" on public.feedback_comments;
create policy "admins can delete feedback comments"
  on public.feedback_comments for delete
  to authenticated
  using (
    exists (
      select 1 from public.users u where u.id = auth.uid() and u.is_admin = true
    )
  );
