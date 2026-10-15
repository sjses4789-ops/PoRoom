# PoRoom 데스크탑 프로그램 (Python · PySide6)

웹(poroom.kr)·앱과 **같은 계정, 같은 서버(Supabase), 같은 규칙**으로 동작하는 Windows 데스크탑 프로그램입니다.
읽기는 Supabase에 직접(보안 규칙 RLS 그대로), 쓰기·검증은 웹의 서버 액션(`/api/app/rpc`)을 그대로 부릅니다 —
로직을 다시 만들지 않으므로 웹·앱과 항상 같은 결과가 나옵니다. 이 프로그램을 기준으로 이후 앱을 다시 설계합니다.

## 실행

```bash
cd desktop
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
python tools/gen_env.py            # 웹 .env.local의 "공개" 값(Supabase URL/anon key)만 env.json으로 뽑는다
.venv\Scripts\python run.py        # 실행
.venv\Scripts\python run.py --preview   # 로그인·서버 없이 예시 데이터로 화면만 보기
```

### 처음 한 번: 로그인 주소 등록
구글 로그인이 끝나면 브라우저가 이 PC의 `http://127.0.0.1:53682/callback` 으로 돌아옵니다.
Supabase 대시보드 → **Authentication → URL Configuration → Redirect URLs** 에 아래 주소를 추가하세요.

```
http://127.0.0.1:53682/callback
```

## exe 만들기

```bash
powershell -ExecutionPolicy Bypass -File tools/build_exe.ps1
```
결과는 `dist/PoRoom/PoRoom.exe` (폴더째 배포, `env.json`이 exe 옆에 같이 들어갑니다).

## 구조

| 파일 | 역할 |
|---|---|
| `poroom/auth.py` | 기본 브라우저로 구글 로그인(PKCE) → 토큰 저장·자동 갱신 |
| `poroom/api.py` | Supabase REST + 웹 서버 액션 호출 |
| `poroom/realtime.py` | Supabase Realtime(Phoenix) 직접 구현 — 접속 상태(presence)·채팅 broadcast |
| `poroom/repo.py` | 화면용 데이터 조회/기록(웹과 같은 쿼리), 미리보기용 예시 데이터 |
| `poroom/pomodoro.py` | 웹·앱과 같은 방식의 뽀모도로(진짜 시계로 따라잡기, 1분마다 기록) |
| `poroom/ui/*` | 메인 창, 로그인, [포룸] 홈, 방 화면 |
| `tests/` | 가짜 서버로 하는 로그인·실시간 시험 |

## 진행 상황

- [x] 1단계: 로그인, 메인 창(메뉴), [포룸] 홈(마감방·새벽방·내 방·열린 방), 방 화면(참여자 카드·실시간 접속 상태·뽀모도로·채팅), 출석 기록
- [ ] 2단계: [피드] [도전] [랭킹] [휴식]
- [ ] 3단계: [개인], 알림(벨)·우편함, 방 만들기·초대 링크, 채팅 사진·반응·신고
- [ ] 4단계: 데스크탑 전용 기능(다른 프로그램의 글자수 자동 집계, 화면 공유, 트레이), 설치 파일
