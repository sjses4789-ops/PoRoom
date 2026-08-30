-- PoRoom: 게시글(정보 게시판 등) 서식 에디터에 이미지 삽입 기능을 위한
-- Supabase Storage 버킷. 각 파일은 업로드한 사용자의 uid 폴더 아래에
-- 저장되고(예: <uid>/<random>.png), 누구나 읽을 수 있는 공개 버킷이라
-- 게시글에 <img src="..."> 로 그대로 노출할 수 있다. 업로드/삭제는
-- 로그인한 본인 폴더에만 허용한다.

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

drop policy if exists "post-images are publicly readable" on storage.objects;
create policy "post-images are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'post-images');

drop policy if exists "users can upload their own post images" on storage.objects;
create policy "users can upload their own post images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users can delete their own post images" on storage.objects;
create policy "users can delete their own post images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
