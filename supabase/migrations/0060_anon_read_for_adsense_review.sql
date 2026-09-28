-- PoRoom: 애드센스 심사 대응 — 로그인 없이도 [포룸]·[피드]·[랭킹]·[휴식]·
-- [도전] 목록 페이지의 실제 데이터가 보이도록 한다.
--
-- 미들웨어/레이아웃의 로그인 리다이렉트만 풀었던 이전 조치로는 부족했다
-- — 각 테이블의 select RLS 정책이 전부 `to authenticated`로만 걸려
-- 있어서, 로그인 안 한 방문자(Postgres의 anon 롤)는 페이지는 뜨지만
-- 쿼리 결과가 항상 0건으로 보였다(방 목록도, 게시판 글도 전부 빈
-- 화면으로 보였던 진짜 원인).
--
-- 아래 정책들에 anon 롤을 추가한다(ALTER POLICY로 롤만 바꾸고 using()
-- 조건은 그대로 유지). 글쓰기·수정·삭제(insert/update/delete) 정책은
-- 전혀 건드리지 않으므로, 비로그인 방문자는 여전히 아무것도 쓸 수
-- 없다(서버 액션도 별도로 로그인을 요구해서 이중으로 막혀 있음).
--
-- users/rooms/challenges는 RLS(행 단위)만으로는 부족해서 컬럼 단위
-- 권한도 같이 제한한다 — RLS는 "행"만 막지 "열"은 안 막아서, anon
-- 키만으로 Supabase REST API에 직접 요청해도(우리 앱을 거치지 않아도)
-- 이메일·초대코드 같은 민감한 컬럼이 새어나갈 수 있기 때문이다:
--   - users: 이메일·차단여부·관리자여부 등은 빼고 id/name/character_id/
--     position만 공개(앱 쪽도 email을 더는 select하지 않도록 수정,
--     이름 없을 때 대체 표시는 "알 수 없음"으로 변경).
--   - rooms/challenges: invite_code(초대코드)만 빼고 나머지 공개(앱
--     쪽은 로그인한 사용자의 "내 방"/"내가 참여한 비공개 대결"
--     초대코드만 별도 쿼리로 가져오도록 수정).
--
-- 개인 목표(goals)·할 일(todos)·채팅(chat_messages)·작품 기록
-- (work_records) 등 이 마이그레이션에 없는 나머지 테이블은 지금처럼
-- authenticated 전용으로 남는다.

-- 1) 민감한 컬럼이 없는 테이블 — anon 롤 추가만 하면 됨
alter policy "room members are viewable by authenticated users" on public.room_members
  to authenticated, anon;
alter policy "authenticated can read all records for ranking" on public.daily_records
  to authenticated, anon;
alter policy "participants are viewable when challenge is visible" on public.challenge_participants
  to authenticated, anon;
alter policy "authenticated can read milestone logs for ranking" on public.activity_logs
  to authenticated, anon;
alter policy "authenticated can read rest posts" on public.rest_posts
  to authenticated, anon;
alter policy "authenticated can read typing scores" on public.typing_scores
  to authenticated, anon;
alter policy "authenticated can read feed posts" on public.feed_posts
  to authenticated, anon;
alter policy "authenticated can read feed reactions" on public.feed_reactions
  to authenticated, anon;

-- 2) users — 이메일 등은 제외하고 닉네임/캐릭터/직업만 공개
alter policy "users are viewable by authenticated users" on public.users
  to authenticated, anon;
revoke select on public.users from anon;
grant select (id, name, character_id, position) on public.users to anon;

-- 3) rooms — 초대코드 제외
alter policy "rooms are viewable by authenticated users" on public.rooms
  to authenticated, anon;
revoke select on public.rooms from anon;
grant select (id, name, color, tags, join_type, target_position, is_system, created_at, owner_id) on public.rooms to anon;

-- 4) challenges — 초대코드 제외
alter policy "challenges are viewable when open or joined" on public.challenges
  to authenticated, anon;
revoke select on public.challenges from anon;
grant select (id, title, metric, visibility, start_date, end_date, kind, created_by, color, capacity, duration_days, started_at, is_admin_event, target_position, poster_image_url) on public.challenges to anon;
