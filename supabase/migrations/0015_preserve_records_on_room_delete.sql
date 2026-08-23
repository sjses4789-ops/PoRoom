-- PoRoom: "방 폭파하기"가 채팅/일정/게시글처럼 방에 속한 데이터는 지우되,
-- 개인이 그 방에서 쌓은 글자수·작업시간 기록(daily_records)까지 함께
-- 지워서는 안 된다. 지금은 daily_records.room_id가 rooms를
-- on delete cascade로 참조하고 있어서 방을 지우면 그 방의 모든 개인 기록도
-- 함께 사라지는 문제가 있었다. room_id를 nullable로 바꾸고 on delete
-- set null로 변경해, 방이 삭제돼도 기록 자체(글자수/시간/날짜)는 남고
-- 소속 방 정보만 비워지도록 한다.

alter table public.daily_records
  drop constraint if exists daily_records_room_id_fkey;

alter table public.daily_records
  alter column room_id drop not null;

alter table public.daily_records
  add constraint daily_records_room_id_fkey
  foreign key (room_id) references public.rooms (id) on delete set null;
