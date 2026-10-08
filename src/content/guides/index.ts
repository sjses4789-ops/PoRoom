import type { Guide, GuideCategory } from "./types";
import { HABIT_GUIDES } from "./habits";
import { HABIT_GUIDES_2 } from "./habits2";
import { WEBNOVEL_GUIDES } from "./webnovel";
import { WEBNOVEL_GUIDES_2 } from "./webnovel2";
import { WEBTOON_GUIDES } from "./webtoon";
import { WEBTOON_GUIDES_2 } from "./webtoon2";
import { CAREER_GUIDES } from "./career";
import { CAREER_GUIDES_2 } from "./career2";
import { WELLBEING_GUIDES_2 } from "./wellbeing2";
import { GUIDE_EXTRAS } from "./extras";
import { MORE_GUIDES } from "./more";

export type { Guide, GuideCategory, GuideSection } from "./types";

// 가이드 공개일 — 실제로 이 글들을 사이트에 올린 날짜다(과거 날짜로 꾸미지 않는다).
// 글을 고치거나 추가하면 GUIDE_UPDATED_AT도 함께 바꾼다.
export const GUIDE_PUBLISHED_AT = "2026-10-08";
export const GUIDE_UPDATED_AT = "2026-10-08";

const BASE_GUIDES: Guide[] = [
  ...HABIT_GUIDES,
  ...HABIT_GUIDES_2,
  ...WEBNOVEL_GUIDES,
  ...WEBNOVEL_GUIDES_2,
  ...WEBTOON_GUIDES,
  ...WEBTOON_GUIDES_2,
  ...CAREER_GUIDES.filter((g) => g.category === "건강과 환경"),
  ...WELLBEING_GUIDES_2,
  ...CAREER_GUIDES.filter((g) => g.category !== "건강과 환경"),
  ...CAREER_GUIDES_2,
  ...MORE_GUIDES,
];

// 처음 쓴 글에는 "직접 해 보기" 구간(extras.ts)을 끝에 덧붙인다.
export const GUIDES: Guide[] = BASE_GUIDES.map((g) => ({
  ...g,
  sections: [...g.sections, ...(GUIDE_EXTRAS[g.slug] ?? [])],
}));

export const GUIDE_CATEGORIES: { name: GuideCategory; description: string }[] = [
  { name: "집필 습관", description: "뽀모도로, 루틴, 슬럼프, 초고와 퇴고, 기록과 계획까지 꾸준히 쓰는 방법" },
  { name: "웹소설 작법", description: "1화 구성, 세계관, 인물, 악역, 관계, 대사, 묘사, 복선, 시점, 장르 문법" },
  { name: "웹툰 작업", description: "대본과 콘티, 컷 연출, 채색, 배경, 식자, 초반 구성, 작업 시간 배분" },
  { name: "건강과 환경", description: "몸 관리, 수면, 식사와 에너지, 마음 관리, 작업 환경" },
  { name: "연재와 투고", description: "연재처 선택, 투고 메일, 공모전, 계약과 저작권, 독자 소통, 홍보, 수입 관리" },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function guideReadMinutes(guide: Guide): number {
  const text = guide.sections
    .flatMap((s) => [
      s.heading,
      ...(s.paragraphs ?? []),
      ...(s.bullets ?? []),
      ...(s.steps ?? []),
      ...(s.example ? [s.example.title, ...s.example.lines] : []),
    ])
    .join("");
  // 한국어 평균 읽기 속도를 분당 약 500자로 본다.
  return Math.max(1, Math.round(text.length / 500));
}
