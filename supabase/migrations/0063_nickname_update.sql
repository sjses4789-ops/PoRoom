-- PoRoom: 추가 닉네임 이름 수정 허용
--
-- 0062에서는 추가 닉네임을 만들기만 하고 고칠 수 없게 했는데, [개인] 페이지에서 본인이 만든 추가
-- 닉네임(최대 2개)의 이름을 고칠 수 있게 한다. 본인 행만 수정할 수 있고, 주인(user_id)은 바꿀 수 없다.
-- (관리자는 계속 모든 사용자의 현재 닉네임을 볼 수 있다. 삭제는 여전히 허용하지 않는다.)
--
-- ⚠ 실행 순서: 이 SQL을 먼저 실행한 뒤에 코드를 배포한다.

drop policy if exists "users can update own nicknames" on public.user_nicknames;
create policy "users can update own nicknames"
  on public.user_nicknames for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── ROLLBACK ─────────────────────────────────────────────────────────
-- drop policy if exists "users can update own nicknames" on public.user_nicknames;
