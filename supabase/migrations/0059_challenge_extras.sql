-- PoRoom: 챌린지 공고 이미지, 달성 순서 기록, 챌린지 포기(탈퇴), 관리자
-- 챌린지 수정 권한 확장.

alter table public.challenges
  add column if not exists poster_image_url text;

alter table public.challenge_participants
  add column if not exists achieved_at timestamptz;

-- 참여자 본인은 언제든 챌린지/대결에서 탈퇴(포기)할 수 있다 — 지금까지는
-- 참여를 취소할 방법이 전혀 없었음.
drop policy if exists "participants can leave a challenge" on public.challenge_participants;
create policy "participants can leave a challenge"
  on public.challenge_participants for delete
  to authenticated
  using (user_id = auth.uid());

-- 관리자는 (본인이 만들지 않은 것 포함) 모든 챌린지를 수정할 수 있다 —
-- 기존엔 생성자 본인만 수정 가능해서, 다른 관리자가 만든 이벤트를 고칠
-- 방법이 없었다.
drop policy if exists "admins can update any challenge" on public.challenges;
create policy "admins can update any challenge"
  on public.challenges for update
  to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));
