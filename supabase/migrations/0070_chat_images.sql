-- PoRoom: 방 채팅에 사진 첨부.
--
--  1) chat_messages.image_path — 첨부한 사진의 저장 경로(없으면 null). 사진만 보내는 메시지는 content에 "📷"를 넣는다
--     (content는 not null이고, 앱/구버전 화면은 이 글자를 그대로 보여 준다).
--  2) chat-images 버킷(비공개) — 사진은 로그인한 방 참여자만 "서명된 임시 주소"로 볼 수 있다. 공개 버킷(post-images)에
--     넣으면 주소를 아는 누구나 볼 수 있어서, 채팅 보안(0061)을 지키려고 비공개로 따로 만든다.
--
-- 경로 규칙: <방id>/<보낸 사람 id>/<범위>/<파일명>
--   범위는 "all"(방 전체) 또는 "to-<받는 사람 id>"(귓속말). 귓속말 사진은 보낸 사람과 받는 사람만 읽을 수 있다.
--
-- ⚠ 이 SQL을 먼저 실행한 뒤에 코드를 배포해야 한다(그 전에는 사진 보내기가 실패한다. 글 채팅은 그대로 동작한다).

alter table public.chat_messages add column if not exists image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-images',
  'chat-images',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- 읽기: 그 방의 참여자이면서, 방 전체 사진이거나 내가 보냈거나 나에게 온 귓속말 사진일 때.
drop policy if exists "room members can read chat images" on storage.objects;
create policy "room members can read chat images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'chat-images'
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
  );

-- 올리기: 그 방의 참여자가 자기 폴더에만, 범위는 all 또는 to-<id>.
drop policy if exists "room members can upload chat images" on storage.objects;
create policy "room members can upload chat images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-images'
    and (storage.foldername(name))[2] = auth.uid()::text
    and ((storage.foldername(name))[3] = 'all' or (storage.foldername(name))[3] like 'to-%')
    and exists (
      select 1 from public.room_members rm
      where rm.user_id = auth.uid()
        and rm.room_id::text = (storage.foldername(name))[1]
    )
  );

-- 지우기: 내가 올린 사진, 또는 그 방의 방장/부방장(채팅 초기화·메시지 삭제 때 사진도 같이 지운다).
drop policy if exists "owners can delete chat images" on storage.objects;
create policy "owners can delete chat images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'chat-images'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
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
    )
  );

-- ── ROLLBACK ──────────────────────────────────────────────
-- drop policy if exists "room members can read chat images" on storage.objects;
-- drop policy if exists "room members can upload chat images" on storage.objects;
-- drop policy if exists "owners can delete chat images" on storage.objects;
-- delete from storage.objects where bucket_id = 'chat-images';
-- delete from storage.buckets where id = 'chat-images';
-- alter table public.chat_messages drop column if exists image_path;
