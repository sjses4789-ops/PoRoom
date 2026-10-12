import { NextResponse } from "next/server";
import {
  joinOpenRoom,
  leaveRoom,
  touchLastSeen,
  setWorkStatus,
  recordChars,
  recordFocusMinutes,
  recordBreakMinutes,
  toggleFavoriteRoom,
} from "@/lib/rooms";
import { getMyWorks, createWork, recordWorkChars } from "@/lib/works";
import { setDailyCharGoal } from "@/lib/daily-goal";
import { sendNote, getInbox, getUnreadNoteCount, markNoteRead, deleteNote } from "@/lib/notes";
import { createFeedPost, deleteFeedPost, toggleFeedReaction, getFeedPostById, getMyChallengeOptions } from "@/lib/feed";
import { joinChallenge, leaveChallenge } from "@/lib/challenges";
import { createTodo, setTodoCompleted, deleteTodo } from "@/lib/todos";
import { submitTypingScore } from "@/lib/rest";
import { setChatColor, setCharacter } from "@/lib/profile";
import { blockUser, unblockUser, reportUser } from "@/lib/safety";
import { joinSystemRoom } from "@/lib/system-rooms";

// 모바일 앱이 웹의 서버 액션(src/lib/*.ts)을 그대로 부르는 통로.
// 앱은 "Authorization: Bearer <로그인 토큰>"을 보내고, createClient()가 그 토큰의
// 사용자로(RLS 그대로) 실행하므로 웹과 같은 규칙·같은 검증을 거친다 — 앱에 로직을
// 다시 구현하지 않는다. 허용한 함수 이름만 호출할 수 있다(아래 목록 밖은 거부).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ACTIONS: Record<string, (...args: any[]) => Promise<unknown>> = {
  joinOpenRoom,
  joinSystemRoom,
  leaveRoom,
  touchLastSeen,
  setWorkStatus,
  recordChars,
  recordFocusMinutes,
  recordBreakMinutes,
  toggleFavoriteRoom,
  getMyWorks,
  createWork,
  recordWorkChars,
  setDailyCharGoal,
  // 쪽지
  sendNote,
  getInbox,
  getUnreadNoteCount,
  markNoteRead,
  deleteNote,
  // 피드
  createFeedPost,
  deleteFeedPost,
  toggleFeedReaction,
  getFeedPostById,
  getMyChallengeOptions,
  // 도전
  joinChallenge,
  leaveChallenge,
  // 할 일 / 휴식(타자 연습 기록)
  createTodo,
  setTodoCompleted,
  deleteTodo,
  submitTypingScore,
  // 프로필 / 안전
  setChatColor,
  setCharacter,
  blockUser,
  unblockUser,
  reportUser,
};

// 서버 액션 중 일부는 끝에 redirect()를 부르는데, 이건 에러를 던지는 방식으로 동작한다 —
// 앱에서는 이동이 필요 없으니 "성공"으로 취급한다.
function isRedirectError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function POST(request: Request) {
  if (!request.headers.get("authorization")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { fn?: unknown; args?: unknown } | null;
  const action = typeof body?.fn === "string" ? ACTIONS[body.fn] : undefined;
  if (!action) {
    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  }
  const args = Array.isArray(body?.args) ? body.args : [];

  try {
    const result = await action(...args);
    return NextResponse.json({ ok: true, result: result ?? null });
  } catch (e) {
    if (isRedirectError(e)) return NextResponse.json({ ok: true, result: null });
    return NextResponse.json({ ok: false, error: "action failed" }, { status: 500 });
  }
}
