// 기본 닉네임(users.name)은 따로 두고, 방마다 쓸 수 있는 "추가 닉네임"을 사용자당 최대 2개
// (기본 포함 총 3개)까지 만든다. 개수 제한은 DB 트리거도 강제한다(0062 마이그레이션).
export const MAX_EXTRA_NICKNAMES = 2;
export const MAX_NICKNAME_LENGTH = 20;
