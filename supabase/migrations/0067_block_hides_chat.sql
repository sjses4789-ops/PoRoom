-- PoRoom: 참여자 차단 시 채팅이 서로에게 보이지 않게 한다.
--
-- A가 B를 차단하면
--   1) A의 화면에서 B의 채팅이 보이지 않고,
--   2) B의 화면에서도 A의 채팅이 보이지 않는다(B에게는 차단 사실이 알려지지 않는다).
-- 방 채팅 기록(chat_messages)을 읽는 규칙에서 막는다. 실시간으로 도착하는 메시지는 화면(코드)이 같은
-- 기준으로 거르는데, 그러려면 "나를 차단한 사람" 목록이 필요해서 my_blockers() 함수를 둔다
-- (is_blocked_by 함수는 0066에서 만들었다 — 먼저 0066을 실행해야 한다).
--
-- ⚠ 실행 순서: 0066 → 0067. 이 SQL 전에는 차단이 "내 화면에서 상대 채팅 숨김"(코드)만 동작한다.

-- 나를 차단한 사람들의 id. 차단 목록(user_blocks)은 차단한 본인만 읽을 수 있어서 RLS를 우회하는
-- security definer 함수로 "나에 대한 것"만 돌려준다.
create or replace function public.my_blockers()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select b.blocker_id from public.user_blocks b where b.blocked_id = auth.uid();
$$;

revoke all on function public.my_blockers() from public;
grant execute on function public.my_blockers() to authenticated;

drop policy if exists "room members can read messages" on public.chat_messages;
create policy "room members can read messages"
  on public.chat_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.room_members rm
      where rm.room_id = chat_messages.room_id and rm.user_id = auth.uid()
    )
    and (
      target_user_id is null
      or target_user_id = auth.uid()
      or user_id = auth.uid()
    )
    and (
      -- 내 글은 항상 보이고, 남의 글은 쌍방 어느 쪽도 차단하지 않았을 때만 보인다.
      user_id = auth.uid()
      or (
        not public.is_blocked_by(user_id)
        and not exists (
          select 1 from public.user_blocks ub
          where ub.blocker_id = auth.uid() and ub.blocked_id = chat_messages.user_id
        )
      )
    )
  );

-- ── ROLLBACK (0033의 원래 규칙으로 되돌린다) ──────────────────────────
-- drop policy if exists "room members can read messages" on public.chat_messages;
-- create policy "room members can read messages" on public.chat_messages for select to authenticated
--   using (
--     exists (select 1 from public.room_members rm where rm.room_id = chat_messages.room_id and rm.user_id = auth.uid())
--     and (target_user_id is null or target_user_id = auth.uid() or user_id = auth.uid())
--   );
-- drop function if exists public.my_blockers();
