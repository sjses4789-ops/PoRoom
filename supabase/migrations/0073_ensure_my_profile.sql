-- PoRoom: 프로필 행이 없는 계정 복구
--
-- 계정을 탈퇴하면 public.users 행은 지워지지만 로그인 계정(auth.users)은 남는다(서비스 키가 없어 지울 수 없었다).
-- 같은 구글 계정으로 다시 가입하면 새 계정이 만들어지지 않아 "가입 시 프로필 만들기" 트리거가 다시 돌지 않고,
-- 그러면 온보딩의 "시작하기"가 저장할 행이 없어 아무 일도 하지 못한 채 화면만 새로 고쳐졌다(초대 링크 가입 포함).
--
-- ensure_my_profile(): 로그인한 사용자의 프로필 행이 없으면 만들어 준다(있으면 아무것도 안 한다).
-- 앱이 로그인 직후 / 온보딩 저장 직전에 부른다.

create or replace function public.ensure_my_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.users (id, email, name, avatar_url)
  select
    u.id,
    coalesce(u.email, ''),
    coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
    u.raw_user_meta_data ->> 'avatar_url'
  from auth.users u
  where u.id = auth.uid()
  on conflict (id) do nothing;
end;
$$;

revoke all on function public.ensure_my_profile() from public, anon;
grant execute on function public.ensure_my_profile() to authenticated;

-- ── ROLLBACK ──────────────────────────────────────────────
-- drop function if exists public.ensure_my_profile();
