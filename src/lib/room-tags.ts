// 장르/분위기/지역(한국 내) 태그 — 화면에 표시할 땐 tags 메시지
// 네임스페이스로 번역해서 보여준다 (translateRoomTag 참고).
const GENRE_TAGS = [
  "모임",
  "번개",
  "웹소설",
  "웹툰",
  "로판",
  "로맨스",
  "현판",
  "무협",
  "판타지",
  "추리",
  "공포",
  "노벨",
  "순문",
  "시",
  "에세이",
  "기타",
  "마감",
  "인풋",
  "초단",
  "10대",
  "20대",
  "30대",
  "40대",
  "50대",
  "60대",
  "조용한",
  "친말한",
  "기성",
  "지망",
  "수다",
  "작업위주",
  "수도권",
  "충청",
  "전라",
  "경상",
  "강원",
  "제주",
] as const;

// 국가/권역 태그는 보는 사람의 언어와 무관하게 그 나라 고유의 언어로
// 고정 표기한다 (해당 방이 어떤 언어권 대상인지 나타내는 식별자라서,
// 뷰어 로케일에 따라 번역하면 오히려 의미가 사라진다).
const REGION_TAGS = ["한국", "USA", "日本", "中国"] as const;

export const ROOM_TAGS = [...GENRE_TAGS, ...REGION_TAGS] as const;

export type RoomTag = (typeof ROOM_TAGS)[number];

export function isRoomTag(value: string): value is RoomTag {
  return (ROOM_TAGS as readonly string[]).includes(value);
}

export function isTranslatableTag(value: string): value is (typeof GENRE_TAGS)[number] {
  return (GENRE_TAGS as readonly string[]).includes(value);
}

// next-intl 번역 함수(useTranslations("tags")/getTranslations("tags"))를
// 받아 태그를 번역한다. 국가 태그는 항상 원문 그대로 반환.
export function translateRoomTag(t: (key: string) => string, tag: string): string {
  return isTranslatableTag(tag) ? t(tag) : tag;
}
