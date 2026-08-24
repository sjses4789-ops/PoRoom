-- PoRoom: 계정 탈퇴 기능 — 본인 users 행을 스스로 지울 수 있는 정책이
-- 없었다(select/update만 있었음). user_id를 참조하는 나머지 테이블은
-- 전부 이미 on delete cascade라서, 이 행 하나만 지워지면 나머지 소유
-- 데이터는 자동으로 함께 정리된다.
drop policy if exists "users can delete own row" on public.users;
create policy "users can delete own row"
  on public.users for delete
  to authenticated
  using (auth.uid() = id);
