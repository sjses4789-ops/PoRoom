// 애드센스 관련 임시 스위치 모음.
//
// 현재 계획: 지금은 평소처럼 서비스를 운영하고, 애드센스는 나중에 다시 신청한다.
// 그래서 심사 대응용으로 켜 두었던 것들을 모두 꺼 둔 상태다. 신청 시점이 오면 아래 값을
// 필요한 만큼만 true로 바꾸면 된다(코드는 그대로 남겨 두었다).

// 비로그인 방문자에게 [포룸]·[피드]·[랭킹]·[휴식]·[도전] 목록을 열어 주는 "심사 모드".
// false면 원래대로 로그인해야 (main) 전체에 접근할 수 있고, 홈페이지 버튼도 구글 로그인으로 돌아온다.
export const ADSENSE_REVIEW_MODE = false;

// 심사 모드의 비로그인 화면에 가짜(예시) 방·피드·랭킹·대결·게시글을 덧붙일지.
// 지금은 숨긴 상태다. (src/lib/demo-data.ts) — 켜더라도 ADSENSE_REVIEW_MODE가 true일 때만 보인다.
export const ADSENSE_DEMO_DATA = false;

// 심사 모드에서 poroom.kr("/")을 소개 홈페이지 대신 [휴식]-정보 게시판으로 보여줄지.
// 지금은 꺼서 소개 홈페이지가 그대로 나온다. (src/lib/supabase/middleware.ts의 rewrite)
export const ADSENSE_HOME_IS_INFO_BOARD = false;

// 사이트 안의 광고 영역(채팅창 아래 광고 칸, 페이지 오른쪽 세로 광고 칸)을 보여줄지.
// 애드센스 승인 전에는 빈 "광고 영역" 칸이 보이지 않도록 숨겨 둔다 — 승인 후 true로 되돌린다.
// (애드센스 확인용 스크립트는 <head>에 그대로 남아 있다.)
export const ADS_VISIBLE = false;

// 헤더의 등급 표시(BASIC / PREMIUM 배지와 그 설명 팝업)를 보여줄지.
// 광고 제거 같은 유료 혜택 안내가 광고가 없는 지금은 의미가 없어서 숨겨 둔다 — 승인 후 true로 되돌린다.
export const TIER_BADGE_VISIBLE = false;
