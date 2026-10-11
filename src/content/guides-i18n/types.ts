import type { Guide } from "../guides/types";

// 번역된 가이드 — slug·category(한국어 원본 분류 키)·related는 원본과 같고, 글 내용만 번역한다.
// 번역이 없는 글은 /en, /ja 목록에 나오지 않는다(한국어 글을 그대로 복제해 노출하지 않는다).
export type LocalizedGuide = Guide;
export type LocalizedGuideMap = Record<string, LocalizedGuide>;
