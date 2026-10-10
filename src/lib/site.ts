// SEO 관련 메타데이터(layout, 홈페이지, sitemap, robots)가 공통으로
// 쓰는 사이트 기본 정보 — 도메인이 바뀌면 여기만 고치면 된다.
export const SITE_URL = "https://poroom.kr";
export const SITE_NAME = "PoRoom";

// 홈페이지는 언어별로 별도 URL(/en, /ja, /zh)을 두어 구글이 각 언어권
// 검색결과에 따로 색인·노출할 수 있게 한다(쿠키 기반 언어 전환만으로는
// 크롤러가 항상 한국어판만 보게 되어 해외 검색 노출이 불가능했음).
export const HOME_LOCALE_PATH: Record<string, string> = {
  ko: "/",
  en: "/en",
  ja: "/ja",
  zh: "/zh",
};

// 검색엔진용 키워드 — 네이버 등은 keywords 메타를 참고하고, 구글은 거의 무시한다(구글 노출은
// 제목·설명·본문·구조화 데이터·사이트맵이 좌우한다). 서비스와 실제로 관련 있는 말만 담았다.
export const SITE_KEYWORDS: Record<string, string[]> = {
  ko: ["포룸","PoRoom","poroom","poroom.kr","포룸 사이트","뽀모도로","포모도로","뽀모도로 타이머","포모도로 타이머","온라인 뽀모도로","뽀모도로 기법","뽀모도로 앱","뽀모도로 25분","집중 타이머","집중력 타이머","공부 타이머","작업 타이머","타이머 사이트","웹소설","웹소설 작가","웹소설 작가 모임","웹소설 연재","웹소설 쓰기","웹소설 작법","웹소설 집필","웹소설 습작","웹소설 지망생","웹소설 작가 지망생","웹소설 신인 작가","웹소설 글쓰기","웹소설 연재 습관","웹소설 커뮤니티","웹소설 작가 커뮤니티","웹툰","웹툰 작가","웹툰 작가 모임","웹툰 작업","웹툰 제작","웹툰 작가 지망생","웹툰 습작","웹툰 마감","웹툰 컷수","웹툰 작업 기록","웹툰 커뮤니티","웹툰 작가 커뮤니티","작가 커뮤니티","창작 커뮤니티","창작자 커뮤니티","글쓰기 커뮤니티","글쓰기 모임","글쓰기 모임 온라인","글쓰기 습관","글쓰기 루틴","글쓰기 앱","글쓰기 사이트","글쓰기 챌린지","매일 글쓰기","글쓰기 동기부여","글쓰기 슬럼프","글쓰기 기록","집필","집필 모임","집필 챌린지","집필 습관","집필 루틴","집필 기록","집필 타이머","집필실","온라인 집필실","온라인 작업실","온라인 작업방","온라인 작업 공간","작가 작업실","작가 작업방","글자수 기록","글자수 계산","글자수 카운터","글자수 세기","글자수 랭킹","일일 글자수","하루 글자수","글자수 목표","글자수 통계","컷수 기록","컷수 랭킹","5천자 챌린지","1만자 챌린지","매일 5천자","매일 1만자","초고 완성","초고 쓰기","퇴고","연재 챌린지","연재 준비","원고 마감","마감 챌린지","함께 집중","같이 집중","함께 공부","같이 공부","함께 작업","같이 작업","바디 더블링","바디더블링","캠스터디","화상 없는 스터디","화상회의 없는 스터디","온라인 스터디룸","온라인 스터디","온라인 독서실","가상 독서실","가상 스터디룸","온라인 도서관","스터디 윗미","study with me","코워킹","온라인 코워킹","가상 작업실","집중력 향상","집중력 높이는 법","집중 환경","몰입","몰입 습관","생산성","생산성 앱","습관 만들기","습관 형성","루틴 만들기","자기관리","작업 기록","출석 체크","동기부여 사이트","대결","1대1 대결","글쓰기 대결","랭킹","랭킹 시스템","챌린지","챌린지 사이트","챌린지 앱","타이핑 연습","타자 연습","타자 속도 측정","타자 연습 사이트","타이핑 속도 측정","공유 캘린더","할 일 관리","투두리스트","작가 일정 관리","작가 플래너"],
  en: ["PoRoom","poroom.kr","Pomodoro","Pomodoro timer","online Pomodoro","Pomodoro technique","Pomodoro study room","online study room","virtual study room","virtual coworking","online coworking","body doubling","body doubling online","study with me","focus timer","focus room","focus together","work together online","co-working space online","writing sprint","writing sprints","writing group online","writing community","writing challenge","daily writing habit","writing accountability","writing tracker","word count tracker","word count goal","word count ranking","web novel","web novelist","web novel writer","web novel writing","webtoon","webtoon artist","webtoon creator","webtoon production","webtoon community","author community","creator community","writer productivity","writing productivity","productivity app","habit tracker","typing practice","typing speed test","typing test","leaderboard","writing leaderboard","writing duel"],
  ja: ["ポルーム","PoRoom","poroom.kr","ポモドーロ","ポモドーロ・テクニック","ポモドーロタイマー","オンラインポモドーロ","オンライン作業室","オンライン自習室","バーチャル自習室","もくもく会","オンラインもくもく会","ボディダブリング","一緒に集中","集中タイマー","作業用","Web小説","Web小説作家","Web小説 執筆","ウェブトゥーン","ウェブトゥーン作家","ウェブトゥーン制作","執筆習慣","執筆チャレンジ","執筆記録","文字数カウント","文字数ランキング","文字数目標","ライティング習慣","創作コミュニティ","作家コミュニティ","執筆仲間","タイピング練習","タイピング速度","習慣化","生産性アプリ","ランキング","チャレンジ"],
  zh: ["PoRoom","poroom.kr","番茄钟","番茄工作法","在线番茄钟","番茄钟计时器","在线自习室","线上自习室","云自习室","虚拟自习室","一起专注","陪伴式学习","body doubling","专注计时器","专注力","网络小说","网络小说作者","网文作者","网文写作","网络小说创作","webtoon","条漫","漫画作者","条漫创作","写作习惯","写作挑战","写作打卡","写作社群","创作者社区","字数统计","字数排行榜","字数目标","码字","日更","每日码字","打字练习","打字速度测试","习惯养成","效率工具","排行榜","挑战赛"],
};

export const HOME_META: Record<
  string,
  { title: string; description: string; ogLocale: string }
> = {
  ko: {
    title: "포룸 | 함께 집중하는 온라인 뽀모도로 작업실",
    description:
      "웹소설 작가와 웹툰 작가를 위한 온라인 뽀모도로 작업실 포룸. 화상회의 없이 함께 집중하고, 글자수·컷수 랭킹과 집필 챌린지로 꾸준히 쓰는 습관을 만드세요.",
    ogLocale: "ko_KR",
  },
  en: {
    title: "PoRoom | Focus Together in an Online Pomodoro Studio",
    description:
      "PoRoom is an online Pomodoro study room for web novelists and webtoon artists. Focus together without video calls, and build a steady work habit with rankings and challenges.",
    ogLocale: "en_US",
  },
  ja: {
    title: "ポルーム | みんなで集中するオンライン・ポモドーロ作業室",
    description:
      "Web小説作家とウェブトゥーン作家のためのオンライン・ポモドーロ作業室、ポルーム。ビデオ通話なしで一緒に集中し、文字数・カット数ランキングと制作チャレンジでコツコツ続ける習慣を作りましょう。",
    ogLocale: "ja_JP",
  },
  zh: {
    title: "PoRoom | 一起专注的在线番茄钟自习室",
    description:
      "PoRoom 是为网络小说作者和webtoon作者打造的在线番茄钟自习室。无需视频通话即可一起专注创作,借助字数·格数排行榜和创作挑战养成持续创作的习惯。",
    ogLocale: "zh_CN",
  },
};
