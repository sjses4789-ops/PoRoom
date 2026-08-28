"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayKst, kstDayRangeUtc } from "@/lib/time";
import { SYSTEM_CHALLENGE_META, type SystemChallengeKind } from "@/lib/system-challenges";

export type ReactionType = "heart" | "clap" | "fire";
export type PostType = "write" | "duel" | "challenge" | "submission" | "contest";

export type ContestMode = "chars" | "complete" | "round";

export type FeedPostMeta = {
  challengeTitle?: string;
  result?: "win" | "loss" | "draw";
  // 대결 최종 등수 — 동점자는 같은 등수(1,1,3 방식). 2명짜리 1:1 대결에선
  // 항상 1위 또는 2위(무승부면 둘 다 1위)로, win/loss와 같은 정보라
  // 굳이 따로 안 보여줘도 되지만 3명 이상 참여하는 대결에서는 의미가
  // 있어 항상 계산해서 저장해둔다.
  rank?: number;
  participantCount?: number;
  achieved?: boolean;
  // 챌린지 배지를 종류별로 다르게 그리기 위한 표시(예: monthly_draft는
  // "초단 완고 Ο/✕" 전용 스타일을 쓴다).
  kind?: SystemChallengeKind | null;
  publisherCount?: number;
  genre?: string;
  contestName?: string;
  contestMode?: ContestMode;
  contestChars?: number;
  contestComplete?: boolean;
  contestRound?: number;
  // 작성자가 고른 피드 카드 배경색(파스텔 팔레트의 hex 값). 없으면 기본
  // 배경을 쓴다.
  bgColor?: string;
};

export type FeedPostResult =
  | { error: string }
  | {
      id: string;
      postType: PostType;
      mood: string;
      focusMinutes: number;
      chars: number;
      meta: FeedPostMeta;
      createdAt: string;
    };

export type CreatePostInput =
  | { postType: "write"; mood: string }
  | { postType: "submission"; mood: string; publisherCount: number; genre: string }
  | {
      postType: "contest";
      mood: string;
      contestName: string;
      contestMode: ContestMode;
      contestChars?: number;
      contestComplete?: boolean;
      contestRound?: number;
    }
  | { postType: "duel"; mood: string; challengeId: string }
  | { postType: "challenge"; mood: string; challengeId: string; chars?: number; draftDone?: boolean };

type ChallengeRow = {
  id: string;
  title: string;
  metric: "chars" | "minutes" | "achievement";
  kind: SystemChallengeKind | null;
  is_admin_event: boolean;
  start_date: string | null;
  end_date: string | null;
};

async function computeDuelResult(
  supabase: Awaited<ReturnType<typeof createClient>>,
  challengeId: string,
  userId: string
): Promise<
  | { title: string; result: "win" | "loss" | "draw"; rank: number; participantCount: number }
  | { error: string }
> {
  const { data: challenge } = await supabase
    .from("challenges")
    .select("id,title,metric,start_date,end_date")
    .eq("id", challengeId)
    .maybeSingle<{
      id: string;
      title: string;
      metric: "chars" | "minutes" | "achievement";
      start_date: string | null;
      end_date: string | null;
    }>();
  if (!challenge || !challenge.start_date || !challenge.end_date) {
    return { error: "대결을 찾을 수 없습니다." };
  }

  const { data: participants } = await supabase
    .from("challenge_participants")
    .select("user_id")
    .eq("challenge_id", challengeId)
    .returns<{ user_id: string | null }[]>();
  const participantIds = (participants ?? []).map((p) => p.user_id).filter((id): id is string => !!id);
  if (!participantIds.includes(userId)) {
    return { error: "참여하지 않은 대결입니다." };
  }

  const { data: records } = await supabase
    .from("daily_records")
    .select("user_id,record_date,chars,focus_minutes")
    .in("user_id", participantIds)
    .gte("record_date", challenge.start_date)
    .lte("record_date", challenge.end_date)
    .returns<{ user_id: string; record_date: string; chars: number; focus_minutes: number }[]>();

  const totals = new Map<string, number>();
  for (const id of participantIds) totals.set(id, 0);
  for (const r of records ?? []) {
    const value = challenge.metric === "chars" ? r.chars : r.focus_minutes;
    totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + value);
  }

  const myValue = totals.get(userId) ?? 0;
  const maxValue = Math.max(...totals.values());
  const topUsers = [...totals.entries()].filter(([, v]) => v === maxValue).map(([id]) => id);

  let result: "win" | "loss" | "draw";
  if (myValue !== maxValue) result = "loss";
  else if (topUsers.length > 1) result = "draw";
  else result = "win";

  // 등수는 "동점자는 같은 등수, 그다음 등수는 인원수만큼 건너뛴다"는
  // 표준 스포츠 순위 방식(1,1,3)으로 계산한다 — 3명이 1위로 동점이면
  // 그다음은 2위가 아니라 4위.
  const sortedValues = [...totals.values()].sort((a, b) => b - a);
  const rank = sortedValues.filter((v) => v > myValue).length + 1;

  return { title: challenge.title, result, rank, participantCount: totals.size };
}

async function computeChallengeAchievement(
  supabase: Awaited<ReturnType<typeof createClient>>,
  challengeId: string,
  userId: string
): Promise<
  | { title: string; achieved: boolean; kind: SystemChallengeKind | null; todayChars?: number }
  | { error: string }
> {
  const { data: challenge } = await supabase
    .from("challenges")
    .select("id,title,kind,is_admin_event")
    .eq("id", challengeId)
    .maybeSingle<{ id: string; title: string; kind: SystemChallengeKind | null; is_admin_event: boolean }>();
  if (!challenge) return { error: "챌린지를 찾을 수 없습니다." };

  const { data: participant } = await supabase
    .from("challenge_participants")
    .select("id,achieved")
    .eq("challenge_id", challengeId)
    .eq("user_id", userId)
    .maybeSingle<{ id: string; achieved: boolean }>();
  if (!participant) return { error: "참여하지 않은 챌린지입니다." };

  const title = challenge.kind ? SYSTEM_CHALLENGE_META[challenge.kind].title : challenge.title;

  if (!challenge.kind) {
    // 관리자 지정 이벤트 — 자가 신고한 달성 여부를 그대로 쓴다.
    return { title, achieved: participant.achieved, kind: null };
  }

  const today = todayKst();

  if (challenge.kind === "monthly_draft") {
    const monthStart = `${today.slice(0, 7)}-01`;
    const { data } = await supabase
      .from("activity_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "draft_done")
      .gte("created_at", kstDayRangeUtc(monthStart).startUtc)
      .limit(1);
    return { title, achieved: (data ?? []).length > 0, kind: challenge.kind };
  }

  const dailyTarget = SYSTEM_CHALLENGE_META[challenge.kind].dailyTarget ?? 0;
  const { data: todayRows } = await supabase
    .from("daily_records")
    .select("chars")
    .eq("user_id", userId)
    .eq("record_date", today)
    .returns<{ chars: number }[]>();
  const todayChars = (todayRows ?? []).reduce((sum, r) => sum + r.chars, 0);
  return { title, achieved: todayChars >= dailyTarget, kind: challenge.kind, todayChars };
}

export async function createFeedPost(
  input: CreatePostInput,
  bgColor?: string | null
): Promise<FeedPostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const trimmedMood = input.mood.trim();
  if (!trimmedMood) return { error: "오늘 기분이나 소식을 입력해주세요." };

  let focusMinutes = 0;
  let chars = 0;
  let meta: FeedPostMeta = {};

  if (input.postType === "write") {
    // 사용자가 직접 입력하지 않고, 게시하는 시점의 실제 기록에서 그대로
    // 가져온다 — 임의의 숫자를 적어 넣을 수 없도록.
    const today = todayKst();
    const { data: todayRows } = await supabase
      .from("daily_records")
      .select("chars,focus_minutes")
      .eq("user_id", user.id)
      .eq("record_date", today)
      .returns<{ chars: number; focus_minutes: number }[]>();
    chars = (todayRows ?? []).reduce((sum, r) => sum + r.chars, 0);
    focusMinutes = (todayRows ?? []).reduce((sum, r) => sum + r.focus_minutes, 0);
  } else if (input.postType === "submission") {
    const publisherCount = Math.max(0, Math.floor(input.publisherCount) || 0);
    const genre = input.genre.trim();
    if (!genre) return { error: "장르를 입력해주세요." };
    meta = { publisherCount, genre };
  } else if (input.postType === "contest") {
    const contestName = input.contestName.trim();
    if (!contestName) return { error: "공모전 이름을 입력해주세요." };
    if (input.contestMode === "complete") {
      meta = { contestName, contestMode: "complete", contestComplete: !!input.contestComplete };
    } else if (input.contestMode === "round") {
      const contestRound = Math.max(0, Math.floor(input.contestRound ?? 0) || 0);
      meta = { contestName, contestMode: "round", contestRound };
    } else {
      const contestChars = Math.max(0, Math.floor(input.contestChars ?? 0) || 0);
      meta = { contestName, contestMode: "chars", contestChars };
    }
  } else if (input.postType === "duel") {
    const result = await computeDuelResult(supabase, input.challengeId, user.id);
    if ("error" in result) return result;
    meta = {
      challengeTitle: result.title,
      result: result.result,
      rank: result.rank,
      participantCount: result.participantCount,
    };
  } else if (input.postType === "challenge") {
    const result = await computeChallengeAchievement(supabase, input.challengeId, user.id);
    if ("error" in result) return result;
    if (result.kind === "monthly_draft") {
      // 초단 완고는 자동 추적(activity_logs)이 있긴 하지만, 사용자가 직접
      // 체크해 보고하는 방식으로 바꿨다 — 관리자 이벤트와 같은 자가 신고
      // 방식.
      meta = { challengeTitle: result.title, achieved: !!input.draftDone, kind: result.kind };
    } else {
      meta = { challengeTitle: result.title, achieved: result.achieved, kind: result.kind };
      if (result.kind === "daily5k" || result.kind === "daily10k") {
        // 오늘 글자수는 자동으로 이미 계산돼 있으니(달성 여부 판정에 쓴 값)
        // 그대로 재사용 — 사용자가 입력할 필요도, 별도로 입력받을 수도 없다.
        chars = result.todayChars ?? 0;
      }
    }
  }

  if (bgColor) meta = { ...meta, bgColor };

  const { data, error } = await supabase
    .from("feed_posts")
    .insert({
      user_id: user.id,
      post_type: input.postType,
      mood: trimmedMood,
      focus_minutes: focusMinutes,
      chars,
      meta,
    })
    .select("id,post_type,mood,focus_minutes,chars,meta,created_at")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "게시에 실패했습니다." };
  }

  revalidatePath("/feed");
  return {
    id: data.id,
    postType: data.post_type,
    mood: data.mood,
    focusMinutes: data.focus_minutes,
    chars: data.chars,
    meta: data.meta ?? {},
    createdAt: data.created_at,
  };
}

export async function deleteFeedPost(postId: string): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase.from("feed_posts").delete().eq("id", postId);
  if (error) return { error: error.message };

  revalidatePath("/feed");
  return { ok: true };
}

// 이미 눌러둔 반응이면 취소(삭제), 아니면 새로 추가하는 토글 방식.
// 반응 종류(하트/멋져요/대단해요)는 서로 독립적으로 중복 선택 가능.
export async function toggleFeedReaction(
  postId: string,
  reactionType: ReactionType
): Promise<{ error: string } | { active: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: existing } = await supabase
    .from("feed_reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .eq("reaction_type", reactionType)
    .maybeSingle<{ id: string }>();

  if (existing) {
    const { error } = await supabase.from("feed_reactions").delete().eq("id", existing.id);
    if (error) return { error: error.message };
    revalidatePath("/feed");
    return { active: false };
  }

  const { error } = await supabase
    .from("feed_reactions")
    .insert({ post_id: postId, user_id: user.id, reaction_type: reactionType });
  if (error) return { error: error.message };

  revalidatePath("/feed");
  return { active: true };
}

export type DuelOption = { id: string; title: string };
export type ChallengeOption = { id: string; title: string; kind: SystemChallengeKind | null };

// [피드]의 '대결'/'챌린지' 작성 탭에서 고를 수 있는 목록 — 결과/달성
// 여부는 여기서 미리 계산하지 않고, 실제로 게시할 때(createFeedPost) 그
// 시점 기준으로 다시 계산한다(목록을 불러온 뒤 시간이 지나 상태가
// 바뀌었을 수 있으므로).
export async function getMyChallengeOptions(): Promise<{
  duels: DuelOption[];
  challenges: ChallengeOption[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { duels: [], challenges: [] };

  const today = todayKst();

  const { data: participantRows } = await supabase
    .from("challenge_participants")
    .select("challenge_id")
    .eq("user_id", user.id)
    .returns<{ challenge_id: string }[]>();
  const challengeIds = (participantRows ?? []).map((r) => r.challenge_id);
  if (!challengeIds.length) return { duels: [], challenges: [] };

  const { data: rows } = await supabase
    .from("challenges")
    .select("id,title,metric,kind,is_admin_event,start_date,end_date")
    .in("id", challengeIds)
    .returns<ChallengeRow[]>();

  const duels: DuelOption[] = (rows ?? [])
    .filter((c) => !c.kind && !c.is_admin_event && c.end_date && c.end_date < today)
    .map((c) => ({ id: c.id, title: c.title }));

  const challenges: ChallengeOption[] = (rows ?? [])
    .filter((c) => c.kind || c.is_admin_event)
    .map((c) => ({
      id: c.id,
      title: c.kind ? SYSTEM_CHALLENGE_META[c.kind].title : c.title,
      kind: c.kind,
    }));

  return { duels, challenges };
}
