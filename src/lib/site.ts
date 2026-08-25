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

export const HOME_META: Record<
  string,
  { title: string; description: string; ogLocale: string }
> = {
  ko: {
    title: "포룸 | 함께 집중하는 온라인 뽀모도로 작업실",
    description:
      "웹소설 작가를 위한 온라인 뽀모도로 작업실 포룸. 화상회의 없이 함께 집중하고, 글자수 랭킹과 집필 챌린지로 꾸준히 쓰는 습관을 만드세요.",
    ogLocale: "ko_KR",
  },
  en: {
    title: "PoRoom | Focus Together in an Online Pomodoro Studio",
    description:
      "PoRoom is an online Pomodoro study room for web novelists. Focus together without video calls, and build a steady writing habit with word-count rankings and writing challenges.",
    ogLocale: "en_US",
  },
  ja: {
    title: "ポルーム | みんなで集中するオンライン・ポモドーロ作業室",
    description:
      "ウェブ小説作家のためのオンライン・ポモドーロ作業室、ポルーム。ビデオ通話なしで一緒に集中し、文字数ランキングと執筆チャレンジでコツコツ書く習慣を作りましょう。",
    ogLocale: "ja_JP",
  },
  zh: {
    title: "PoRoom | 一起专注的在线番茄钟自习室",
    description:
      "PoRoom 是为网络小说作者打造的在线番茄钟自习室。无需视频通话即可一起专注写作,借助字数排行榜和写作挑战养成持续创作的习惯。",
    ogLocale: "zh_CN",
  },
};
