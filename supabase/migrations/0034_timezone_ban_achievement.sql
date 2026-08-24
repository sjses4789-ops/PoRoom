-- PoRoom: (2) 사용자별 시간대(출석일 계산용), (3) 관리자 회원 관리(계정
-- 차단), (4) 관리자 챌린지 이벤트에 "달성 여부" 기준 추가.

-- ── 2. 사용자 시간대 ────────────────────────────────────────────────
-- 출석일은 나라마다 자정 기준으로 세도록(한국은 KST, 그 외는 각자
-- 브라우저 시간대) 바뀐다 — 브라우저에서 감지한 IANA 시간대 이름을
-- 저장해두고 없으면 한국(Asia/Seoul)으로 취급한다.
alter table public.users add column if not exists timezone text;

-- ── 3. 관리자 회원 관리(계정 차단) ──────────────────────────────────
alter table public.users add column if not exists is_banned boolean not null default false;

-- 서비스 키 없이도(관리자 계정 RLS로) 차단 처리를 할 수 있도록, 관리자는
-- 아무 유저 행이나 수정할 수 있게 한다 — 실제로 무엇을 바꾸는지는
-- 애플리케이션 코드(adminSetBanned)가 통제한다.
drop policy if exists "admins can update any user" on public.users;
create policy "admins can update any user"
  on public.users for update
  to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

-- ── 4. 챌린지 "달성 여부" 기준 ──────────────────────────────────────
-- 공모전/투고처럼 숫자가 아니라 "했다/안 했다"로 평가해야 하는 관리자
-- 이벤트를 위한 세 번째 metric. 참가자 스스로 체크하는 방식(기존
-- monthly_draft의 초단 완고 체크와 같은 자가 신고 패턴)이라
-- challenge_participants에 달성 여부를 들고 있는다.
alter table public.challenges drop constraint if exists challenges_metric_check;
alter table public.challenges
  add constraint challenges_metric_check check (metric in ('chars', 'minutes', 'achievement'));

alter table public.challenge_participants
  add column if not exists achieved boolean not null default false;

drop policy if exists "participants can update their own achieved flag" on public.challenge_participants;
create policy "participants can update their own achieved flag"
  on public.challenge_participants for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
