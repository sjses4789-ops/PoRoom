export type GuideCategory = "집필 습관" | "웹소설 작법" | "웹툰 작업" | "건강과 환경" | "연재와 투고";

export type GuideSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  steps?: string[];
  // 본문 중간에 넣는 예시 상자(일정표, 문장 예시 등).
  example?: { title: string; lines: string[] };
};

export type Guide = {
  slug: string;
  title: string;
  // 검색 결과와 목록 카드에 보이는 소개 문장(120자 안팎).
  description: string;
  category: GuideCategory;
  // 글 맨 위 "먼저 보기" 상자의 핵심 3가지.
  summary: string[];
  sections: GuideSection[];
  // 이어 읽기를 권하는 글의 slug.
  related?: string[];
};
