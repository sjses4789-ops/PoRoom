-- PoRoom: 마감방/새벽방 정원을 30명에서 50명으로 늘린다. 두 방은 처음
-- 입장할 때 딱 한 번 생성되는 상시방이라, 코드 쪽 상수만 바꿔서는 이미
-- 만들어진 방의 capacity 값이 그대로 남는다 — 기존 행도 함께 갱신한다.
update public.rooms set capacity = 50 where is_system = true and capacity = 30;
