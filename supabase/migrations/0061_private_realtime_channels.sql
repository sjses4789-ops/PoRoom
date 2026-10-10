-- PoRoom: 실시간 채널(채팅·귓속말·접속 상태/화면 공유·대결 채팅)을 "비공개 채널"로 잠근다.
--
-- 배경: 지금까지 채팅은 DB(chat_messages, RLS로 보호)에 저장하면서 화면에는 Realtime
-- Broadcast 채널(`room-chat:<방id>` 등)로 즉시 흘려 보냈다. 그런데 이 채널들은 "공개
-- 채널"이라서, 사이트 코드에 그대로 들어 있는 anon 키와 방 id(공개 방 목록에 노출)만 알면
-- 로그인 없이도 구독해서 실시간 대화를 엿보거나(귓속말 inbox 채널은 방 id + 사용자 id만 알면
-- 구독 가능), 가짜 메시지를 끼워 넣을 수 있었다.
--
-- 해결: 클라이언트가 채널을 `private: true`로 열도록 바꾸고(앱 코드 쪽), 아래 정책으로
-- realtime.messages(비공개 채널의 수신/송신 권한 테이블)에서 "그 방/대결의 참여자만" 듣고
-- 보내게 한다. 비공개 채널은 정책이 허용하지 않으면 입장 자체가 거부된다.
--
-- ⚠ 실행 순서: 이 SQL을 먼저 실행한 뒤에 코드를 배포해야 한다. (이 정책은 비공개 채널에만
--   적용되므로 코드가 배포되기 전에는 아무 영향이 없다. 반대로 코드를 먼저 배포하면 정책이 없어
--   채팅·접속 상태가 막힌다.)
--
-- 되돌리기: 맨 아래 "ROLLBACK" 블록 참고.

-- 비공개 채널 토픽 규칙
--   room-chat:<roomId>              방 전체 채팅
--   room-presence:<roomId>          접속 상태 / 타이핑 / 뽀모도로 / 화면 공유 프레임
--   whisper-inbox:<roomId>:<userId> 그 사용자 한 명에게 오는 귓속말
--   challenge-chat:<challengeId>    대결방 채팅

drop policy if exists "room members can receive room realtime" on realtime.messages;
create policy "room members can receive room realtime"
  on realtime.messages for select
  to authenticated
  using (
    realtime.messages.extension in ('broadcast', 'presence')
    and (
      -- 방 채팅 / 접속 상태: 그 방의 참여자
      (
        (realtime.topic() like 'room-chat:%' or realtime.topic() like 'room-presence:%')
        and exists (
          select 1 from public.room_members rm
          where rm.user_id = auth.uid()
            and rm.room_id::text = split_part(realtime.topic(), ':', 2)
        )
      )
      -- 귓속말 inbox: 받는 사람 본인(그리고 그 방의 참여자)만
      or (
        realtime.topic() like 'whisper-inbox:%'
        and split_part(realtime.topic(), ':', 3) = auth.uid()::text
        and exists (
          select 1 from public.room_members rm
          where rm.user_id = auth.uid()
            and rm.room_id::text = split_part(realtime.topic(), ':', 2)
        )
      )
      -- 대결방 채팅: 그 대결의 참가자
      or (
        realtime.topic() like 'challenge-chat:%'
        and exists (
          select 1 from public.challenge_participants cp
          where cp.user_id = auth.uid()
            and cp.challenge_id::text = split_part(realtime.topic(), ':', 2)
        )
      )
    )
  );

drop policy if exists "room members can send room realtime" on realtime.messages;
create policy "room members can send room realtime"
  on realtime.messages for insert
  to authenticated
  with check (
    realtime.messages.extension in ('broadcast', 'presence')
    and (
      (
        (
          realtime.topic() like 'room-chat:%'
          or realtime.topic() like 'room-presence:%'
          -- 귓속말은 받는 사람의 inbox 채널로 "보내므로", 보내는 사람도 같은 방의 참여자이면 된다.
          or realtime.topic() like 'whisper-inbox:%'
        )
        and exists (
          select 1 from public.room_members rm
          where rm.user_id = auth.uid()
            and rm.room_id::text = split_part(realtime.topic(), ':', 2)
        )
      )
      or (
        realtime.topic() like 'challenge-chat:%'
        and exists (
          select 1 from public.challenge_participants cp
          where cp.user_id = auth.uid()
            and cp.challenge_id::text = split_part(realtime.topic(), ':', 2)
        )
      )
    )
  );

-- 채팅 테이블은 로그인한 참여자만 접근한다 — 비로그인(anon) 롤의 권한을 명시적으로 걷어
-- 두어, 이후 실수로 anon 정책이 생겨도 채팅이 새지 않게 한다. (이미 정책상 anon은 못 읽는다.)
revoke all on public.chat_messages from anon;
revoke all on public.challenge_messages from anon;

-- ── ROLLBACK (문제가 생겼을 때만) ────────────────────────────────────
-- drop policy if exists "room members can receive room realtime" on realtime.messages;
-- drop policy if exists "room members can send room realtime" on realtime.messages;
-- (정책을 지우면 비공개 채널이 전부 막히므로, 코드도 함께 이전 버전으로 되돌려야 한다.)
