-- PoRoom: 내가 입장한 방 즐겨찾기 — 기존 "users can update their own
-- membership" 정책(auth.uid() = user_id)이 이미 본인 행 업데이트를
-- 허용하므로 별도 정책 없이 컬럼만 추가하면 된다.

alter table public.room_members
  add column if not exists is_favorite boolean not null default false;
