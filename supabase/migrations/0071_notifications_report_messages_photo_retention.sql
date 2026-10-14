-- PoRoom: 알림(벨), 메시지·사진 신고, 채팅 사진 30일 보관 정책
--
--  1) notifications — 상단바 벨 아이콘의 알림. 귓속말 도착·신고 처리 결과는 아래 트리거가 만들고, 챌린지/대결 결과·
--     주간 리포트는 앱이 add_my_notification()으로 내 알림에 한 번만(같은 ref는 중복 안 됨) 넣는다.
--  2) user_reports — 메시지·사진 단위 신고(message_id, 신고 당시 내용/사진 경로를 함께 보관).
--  3) 채팅 사진(0070): 올린 지 30일이 지나면 "읽기 정책"이 막아 누구도 못 본다(관리자 제외). 실제 파일 삭제는
--     expired_chat_image_paths()가 알려 주는 목록을 앱이 지운다(사진을 올린 본인·방장·부방장·관리자가 접속할 때).
--     방이 사라질 때(마지막 참여자가 나가거나 관리자가 방을 지울 때)는 room_chat_image_paths()로 방의 사진을 모두 지운다.
--
-- ⚠ 0070을 먼저 실행해야 한다. 이 SQL을 실행하기 전에는 벨이 비어 있고, 메시지 신고는 "처리하지 못했어요"가 나온다.

-- ── 1) 알림 ────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  kind text not null check (kind in ('whisper', 'report_resolved', 'challenge_result', 'weekly_report')),
  -- 같은 알림이 두 번 생기지 않게 하는 키(예: 챌린지 id, 주 시작일, 귓속말 방:보낸 사람).
  ref text,
  params jsonb not null default '{}'::jsonb,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists notifications_user_kind_ref_idx
  on public.notifications (user_id, kind, ref) where ref is not null;
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "users can read own notifications" on public.notifications;
create policy "users can read own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users can mark own notifications" on public.notifications;
create policy "users can mark own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can delete own notifications" on public.notifications;
create policy "users can delete own notifications"
  on public.notifications for delete
  to authenticated
  using (auth.uid() = user_id);

revoke all on public.notifications from anon;

-- 앱이 "내 알림"으로만 넣을 수 있는 종류(챌린지 결과·주간 리포트). 남의 알림은 넣지 못한다.
create or replace function public.add_my_notification(p_kind text, p_ref text, p_params jsonb, p_link text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return; end if;
  if p_kind not in ('challenge_result', 'weekly_report') then return; end if;
  insert into public.notifications (user_id, kind, ref, params, link)
  values (auth.uid(), p_kind, p_ref, coalesce(p_params, '{}'::jsonb), p_link)
  on conflict (user_id, kind, ref) where ref is not null do nothing;
end;
$$;

revoke all on function public.add_my_notification(text, text, jsonb, text) from public;
grant execute on function public.add_my_notification(text, text, jsonb, text) to authenticated;

-- 귓속말이 오면 받는 사람 알림 — 같은 방의 같은 사람이 여러 번 보내도 알림 하나를 새로 올린다.
-- 받는 사람이 보낸 사람을 차단했다면 만들지 않는다.
create or replace function public.notify_whisper()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_label text;
  room_label text;
begin
  if new.target_user_id is null then return new; end if;
  if exists (
    select 1 from public.user_blocks b where b.blocker_id = new.target_user_id and b.blocked_id = new.user_id
  ) then
    return new;
  end if;

  select coalesce(nullif(rm.nickname, ''), u.name, u.email, '')
    into sender_label
    from public.users u
    left join public.room_members rm on rm.user_id = u.id and rm.room_id = new.room_id
   where u.id = new.user_id;
  select r.name into room_label from public.rooms r where r.id = new.room_id;

  insert into public.notifications (user_id, kind, ref, params, link)
  values (
    new.target_user_id,
    'whisper',
    new.room_id::text || ':' || new.user_id::text,
    jsonb_build_object('from', coalesce(sender_label, ''), 'room', coalesce(room_label, '')),
    '/room/' || new.room_id::text
  )
  on conflict (user_id, kind, ref) where ref is not null
  do update set read_at = null, created_at = now(), params = excluded.params;

  return new;
end;
$$;

drop trigger if exists chat_messages_notify_whisper on public.chat_messages;
create trigger chat_messages_notify_whisper
  after insert on public.chat_messages
  for each row execute function public.notify_whisper();

-- ── 2) 메시지·사진 신고 ────────────────────────────────────
alter table public.user_reports add column if not exists message_id uuid references public.chat_messages (id) on delete set null;
alter table public.user_reports add column if not exists message_content text;
alter table public.user_reports add column if not exists message_image_path text;

-- 신고가 "처리 완료"가 되면 신고한 사람에게 알린다.
create or replace function public.notify_report_resolved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(old.resolved, false) = false and new.resolved = true then
    insert into public.notifications (user_id, kind, ref, params)
    values (
      new.reporter_id,
      'report_resolved',
      new.id::text,
      jsonb_build_object('isMessage', new.message_id is not null or new.message_content is not null)
    )
    on conflict (user_id, kind, ref) where ref is not null do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists user_reports_notify_resolved on public.user_reports;
create trigger user_reports_notify_resolved
  after update on public.user_reports
  for each row execute function public.notify_report_resolved();

-- ── 3) 채팅 사진 30일 보관 ─────────────────────────────────
-- 읽기: 올린 지 30일 이내만(관리자는 신고 확인을 위해 항상 읽을 수 있다).
drop policy if exists "room members can read chat images" on storage.objects;
create policy "room members can read chat images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'chat-images'
    and (
      exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
      or (
        created_at > now() - interval '30 days'
        and exists (
          select 1 from public.room_members rm
          where rm.user_id = auth.uid()
            and rm.room_id::text = (storage.foldername(name))[1]
        )
        and (
          (storage.foldername(name))[3] = 'all'
          or (storage.foldername(name))[2] = auth.uid()::text
          or (storage.foldername(name))[3] = 'to-' || auth.uid()::text
        )
      )
    )
  );

-- 지우기: 올린 본인, 방장/부방장, 관리자, 그리고 방에 마지막 한 명만 남았을 때 그 사람(방이 사라질 때 사진도 함께 지우기 위해).
drop policy if exists "owners can delete chat images" on storage.objects;
create policy "owners can delete chat images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'chat-images'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
      or exists (
        select 1 from public.rooms r
        where r.id::text = (storage.foldername(name))[1] and r.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.room_members rm
        where rm.user_id = auth.uid()
          and rm.is_vice
          and rm.room_id::text = (storage.foldername(name))[1]
      )
      or (
        exists (
          select 1 from public.room_members rm
          where rm.user_id = auth.uid() and rm.room_id::text = (storage.foldername(name))[1]
        )
        and (
          select count(*) from public.room_members rm2 where rm2.room_id::text = (storage.foldername(name))[1]
        ) = 1
      )
    )
  );

-- 30일이 지난 사진 중 "내가 지울 수 있는" 파일 경로 목록(미처리 신고에 걸린 사진은 증거라서 뺀다). 관리자는 전부.
create or replace function public.expired_chat_image_paths(p_limit int default 200)
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
     and (
       (storage.foldername(o.name))[2] = auth.uid()::text
       or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
       or exists (
         select 1 from public.rooms r
          where r.id::text = (storage.foldername(o.name))[1] and r.owner_id = auth.uid()
       )
       or exists (
         select 1 from public.room_members rm
          where rm.user_id = auth.uid() and rm.is_vice and rm.room_id::text = (storage.foldername(o.name))[1]
       )
     )
   order by o.created_at
   limit greatest(p_limit, 1);
$$;

revoke all on function public.expired_chat_image_paths(int) from public;
grant execute on function public.expired_chat_image_paths(int) to authenticated;

-- 방 하나의 사진 경로 전부 — 방이 사라질 때(마지막 참여자가 나가거나 관리자가 방을 지울 때) 앱이 파일을 지우려고 쓴다.
create or replace function public.room_chat_image_paths(p_room uuid)
returns setof text
language sql
stable
security definer
set search_path = public, storage
as $$
  select o.name
    from storage.objects o
   where o.bucket_id = 'chat-images'
     and (storage.foldername(o.name))[1] = p_room::text
     and (
       exists (select 1 from public.room_members rm where rm.user_id = auth.uid() and rm.room_id = p_room)
       or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
     );
$$;

revoke all on function public.room_chat_image_paths(uuid) from public;
grant execute on function public.room_chat_image_paths(uuid) to authenticated;

-- 내가 올린 사진 경로 전부 — 계정을 지울 때 앱이 파일을 함께 지우려고 쓴다.
create or replace function public.my_chat_image_paths()
returns setof text
language sql
stable
security definer
set search_path = public, storage
as $$
  select o.name
    from storage.objects o
   where o.bucket_id = 'chat-images'
     and (storage.foldername(o.name))[2] = auth.uid()::text;
$$;

revoke all on function public.my_chat_image_paths() from public;
grant execute on function public.my_chat_image_paths() to authenticated;

-- 새 알림이 오면 벨이 바로 바뀌도록 실시간 구독 대상에 넣는다.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- ── ROLLBACK ──────────────────────────────────────────────
-- drop trigger if exists chat_messages_notify_whisper on public.chat_messages;
-- drop trigger if exists user_reports_notify_resolved on public.user_reports;
-- drop function if exists public.notify_whisper();
-- drop function if exists public.notify_report_resolved();
-- drop function if exists public.add_my_notification(text, text, jsonb, text);
-- drop function if exists public.expired_chat_image_paths(int);
-- drop function if exists public.room_chat_image_paths(uuid);
-- drop function if exists public.my_chat_image_paths();
-- drop table if exists public.notifications;
-- alter table public.user_reports drop column if exists message_id, drop column if exists message_content, drop column if exists message_image_path;
-- (사진 읽기/지우기 정책은 0070의 정의로 되돌린다.)
