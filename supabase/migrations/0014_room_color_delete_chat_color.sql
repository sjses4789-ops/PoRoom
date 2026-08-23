-- PoRoom:
-- 1) rooms.color — 방 생성/설정에서 목표 글자수·시간 대신 고를 수 있는
--    방 색상 (팔레트 key 저장).
-- 2) rooms 삭제(방 폭파하기) + 방 나가기로 인원이 0명이 되면 자동 삭제할 수
--    있도록 owner-only, 시스템방 제외 delete 정책 추가.
-- 3) users.chat_color — 채팅 메시지 배경색 개인 설정.

alter table public.rooms
  add column if not exists color text not null default 'neutral';

drop policy if exists "owner can delete own non-system room" on public.rooms;
create policy "owner can delete own non-system room"
  on public.rooms for delete
  to authenticated
  using (auth.uid() = owner_id and is_system = false);

alter table public.users
  add column if not exists chat_color text;
