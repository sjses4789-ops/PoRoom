// [휴식] 게시판 관련 타입·상수 — "use server" 파일(rest.ts)은 async
// 함수만 export할 수 있어서, 값으로 쓰이는 배열/타입은 별도 파일로 뺀다.

export type RestPostCategory = "자유" | "정보" | "인원 모집";

// [휴식]-'정보' 게시판 글에만 붙는 하위 카테고리 — 게시글 제목 앞에
// "[팁&노하우]"처럼 붙고, 카테고리마다 다른 색으로 구분된다.
export const REST_INFO_CATEGORIES = ["팁&노하우", "공모전", "질문", "기타"] as const;
export type RestInfoCategory = (typeof REST_INFO_CATEGORIES)[number];
