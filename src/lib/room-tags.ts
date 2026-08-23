export const ROOM_TAGS = [
  "모임",
  "번개",
  "로판",
  "로맨스",
  "현판",
  "무협",
  "판타지",
  "노벨",
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

export type RoomTag = (typeof ROOM_TAGS)[number];

export function isRoomTag(value: string): value is RoomTag {
  return (ROOM_TAGS as readonly string[]).includes(value);
}
