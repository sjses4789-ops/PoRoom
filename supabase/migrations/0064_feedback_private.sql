-- PoRoom: [기능 제안 & 버그 신고] 글을 비밀글로 — 작성자 본인과 관리자만 볼 수 있다.
--
-- 지금까지는 로그인한 누구나 모든 글과 답글을 읽을 수 있었다. 이제 글(feedback_posts)은 작성자와
-- 관리자만, 답글(feedback_comments)은 그 글의 작성자와 관리자만 읽는다. 글쓰기·관리자 답글·삭제
-- 권한은 그대로다.
--
-- ⚠ 실행 순서: 이 SQL을 실행하기 전에는 예전처럼 모든 글이 보인다(코드는 먼저 배포돼도 안전하다).

drop policy if exists "authenticated can read feedback posts" on public.feedback_posts;
drop policy if exists "authors and admins can read feedback posts" on public.feedback_posts;
create policy "authors and admins can read feedback posts"
  on public.feedback_posts for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );

drop policy if exists "authenticated can read feedback comments" on public.feedback_comments;
drop policy if exists "post authors and admins can read feedback comments" on public.feedback_comments;
create policy "post authors and admins can read feedback comments"
  on public.feedback_comments for select
  to authenticated
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
    or exists (
      select 1 from public.feedback_posts p
      where p.id = feedback_comments.post_id and p.user_id = auth.uid()
    )
  );

-- anon(비로그인)은 원래 이 테이블을 읽을 수 없지만, 명시적으로 걷어 둔다.
revoke all on public.feedback_posts from anon;
revoke all on public.feedback_comments from anon;

-- ── ROLLBACK ─────────────────────────────────────────────────────────
-- drop policy if exists "authors and admins can read feedback posts" on public.feedback_posts;
-- create policy "authenticated can read feedback posts" on public.feedback_posts for select to authenticated using (true);
-- drop policy if exists "post authors and admins can read feedback comments" on public.feedback_comments;
-- create policy "authenticated can read feedback comments" on public.feedback_comments for select to authenticated using (true);
