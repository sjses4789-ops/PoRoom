-- PoRoom: 채팅 메시지 반응(❤️😄🎉👍😢😮) + 채팅 사진 자동 삭제(서버 정기 작업)용 함수
--
--  1) chat_message_reactions — 메시지마다 사람·종류별로 한 번씩 누를 수 있는 반응. 메시지를 읽을 수 있는 사람만 반응을 보고,
--     본인 이름으로만 달고 지운다. 귓속말에는 달 수 없다(받는 사람 둘만 보는 글이라 방 전체 알림 대상이 아니다).
--  2) service_expired_chat_image_paths() — 올린 지 30일이 지난 채팅 사진 파일 경로 목록. service_role(서버 정기 작업) 전용이다.
--     (미처리 신고에 걸린 사진은 증거라서 뺀다.)
--
-- ⚠ 0071을 먼저 실행해야 한다. 이 SQL을 실행하기 전에는 반응 버튼이 "처리하지 못했어요"처럼 동작하지 않는다(채팅은 그대로).

create table if not exists public.chat_message_reactions (
  message_id uuid not null references public.chat_messages (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  -- heart / smile / party / thumbs / sad / wow — 화면의 이모지는 앱이 이 이름에 맞춰 그린다.
  emoji text not null check (emoji in ('heart', 'smile', 'party', 'thumbs', 'sad', 'wow')),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create index if not exists chat_message_reactions_message_idx on public.chat_message_reactions (message_id);

alter table public.chat_message_reactions enable row level security;

-- 읽기: 그 메시지를 읽을 수 있는 사람(chat_messages의 RLS가 그대로 적용된다).
drop policy if exists "readers of a message can read its reactions" on public.chat_message_reactions;
create policy "readers of a message can read its reactions"
  on public.chat_message_reactions for select
  to authenticated
  using (exists (select 1 from public.chat_messages m where m.id = chat_message_reactions.message_id));

-- 달기: 본인 이름으로, 읽을 수 있는 전체 채팅 메시지(귓속말 제외)에만.
drop policy if exists "members can react to room messages" on public.chat_message_reactions;
create policy "members can react to room messages"
  on public.chat_message_reactions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.chat_messages m
      where m.id = chat_message_reactions.message_id and m.target_user_id is null
    )
  );

drop policy if exists "users can remove own reactions" on public.chat_message_reactions;
create policy "users can remove own reactions"
  on public.chat_message_reactions for delete
  to authenticated
  using (auth.uid() = user_id);

revoke all on public.chat_message_reactions from anon;

-- 채팅 사진 자동 삭제용 — 서버의 정기 작업(서비스 키)만 부를 수 있다.
create or replace function public.service_expired_chat_image_paths(p_limit int default 500)
returns setof text
language sql
stable
security definer
set search_path = public, storage
as $$
  select o.name
    from storage.objects o
   where o.bucket_id = 'chat-images'
     and o.created_at < now() - interval '30 days'
     and not exists (
       select 1 from public.user_reports ur
        where ur.resolved = false and ur.message_image_path = o.name
     )
   order by o.created_at
   limit greatest(p_limit, 1);
$$;

revoke all on function public.service_expired_chat_image_paths(int) from public, anon, authenticated;
grant execute on function public.service_expired_chat_image_paths(int) to service_role;

-- ── ROLLBACK ──────────────────────────────────────────────
-- drop function if exists public.service_expired_chat_image_paths(int);
-- drop table if exists public.chat_message_reactions;
