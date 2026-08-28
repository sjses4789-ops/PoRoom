-- PoRoom: 웹소설 작가뿐 아니라 웹툰 작가도 같은 앱에서 함께 쓸 수
-- 있도록, 사용자마다 '포지션'(직업)을 저장한다. 두 직업은 페이지를
-- 따로 만들지 않고 [개인] 페이지에서 포지션을 바꿔 선택하며, 작업
-- '단위'(웹소설=글자수, 웹툰=컷수)만 다르게 취급한다.
--
-- 기존 사용자는 전부 웹소설 작가였으므로, 지금 있는 행은 여기서
-- 한 번만 'novelist'로 채워 넣고(컬럼 자체엔 DEFAULT를 걸지 않는다) —
-- 앞으로 새로 가입하는 사용자는 온보딩에서 직접 고르기 전까지 NULL로
-- 남아 있어야, (main) 레이아웃의 온보딩 유도 조건이 신규 가입자만
-- 정확히 걸러낼 수 있다.
alter table public.users
  add column if not exists position text check (position in ('novelist', 'webtoon'));

update public.users set position = 'novelist' where position is null;
