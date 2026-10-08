import type { Guide, GuideCategory } from "./types";
import { HABIT_GUIDES } from "./habits";
import { WEBNOVEL_GUIDES } from "./webnovel";
import { WEBTOON_GUIDES } from "./webtoon";
import { CAREER_GUIDES } from "./career";

export type { Guide, GuideCategory, GuideSection } from "./types";

// 가이드 공개일 — 실제로 이 글들을 사이트에 올린 날짜다(과거 날짜로 꾸미지 않는다).
// 글을 고치거나 추가하면 GUIDE_UPDATED_AT도 함께 바꾼다.
export const GUIDE_PUBLISHED_AT = "2026-10-08";
export const GUIDE_UPDATED_AT = "2026-10-08";

export const GUIDES: Guide[] = [...HABIT_GUIDES, ...WEBNOVEL_GUIDES, ...WEBTOON_GUIDES, ...CAREER_GUIDES];

export const GUIDE_CATEGORIES: { name: GuideCategory; description: string }[] = [
  { name: "집필 습관", description: "뽀모도로, 루틴, 슬럼프, 초고와 퇴고까지 꾸준히 쓰는 방법" },
  { name: "웹소설 작법", description: "1화 구성, 인물, 대사, 묘사, 플롯 막힘을 푸는 법" },
  { name: "웹툰 작업", description: "콘티, 컷 연출, 작업 시간 배분, 캐릭터 시트" },
  { name: "건강과 환경", description: "오래 작업하는 사람의 몸 관리와 작업 환경" },
  { name: "연재와 투고", description: "연재 주기, 공모전, 시놉시스, 피드백과 합평" },
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
