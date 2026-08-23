-- PoRoom: "새벽반" 시스템방을 "새벽방"으로 이름 변경 (기존 방/멤버/기록은
-- 그대로 유지 — 새 방을 만드는 게 아니라 이름만 바꾼다).

update public.rooms
set name = '새벽방'
where name = '새벽반' and is_system = true;
