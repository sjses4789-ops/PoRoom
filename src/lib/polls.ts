"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PollType = "yesno" | "single" | "multi";

export type CreatePollResult =
  | { error: string }
  | {
      id: string;
      title: string;
      pollType: PollType;
      isAnonymousVote: boolean;
      isAnonymousCreator: boolean;
      createdAt: string;
      options: { id: string; label: string }[];
    };

export async function createPoll(
  roomId: string,
  title: string,
  pollType: PollType,
  candidateLabels: string[],
  isAnonymousVote: boolean,
  isAnonymousCreator: boolean
): Promise<CreatePollResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const trimmedTitle = title.trim();
  if (!trimmedTitle) return { error: "투표 제목을 입력해주세요." };

  const labels =
    pollType === "yesno"
      ? ["찬성", "반대"]
      : candidateLabels.map((l) => l.trim()).filter(Boolean);

  if (pollType !== "yesno" && labels.length < 2) {
    return { error: "선택지를 2개 이상 입력해주세요." };
  }

  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({
      room_id: roomId,
      created_by: user.id,
      title: trimmedTitle,
      poll_type: pollType,
      is_anonymous_vote: isAnonymousVote,
      is_anonymous_creator: isAnonymousCreator,
    })
    .select("id,title,poll_type,is_anonymous_vote,is_anonymous_creator,created_at")
    .single();

  if (pollError || !poll) {
    return { error: pollError?.message ?? "투표 생성에 실패했습니다." };
  }

  const { data: options, error: optionsError } = await supabase
    .from("poll_options")
    .insert(labels.map((label, i) => ({ poll_id: poll.id, label, position: i })))
    .select("id,label");

  if (optionsError || !options) {
    return { error: optionsError?.message ?? "투표 항목 생성에 실패했습니다." };
  }

  revalidatePath(`/room/${roomId}`);

  return {
    id: poll.id,
    title: poll.title,
    pollType: poll.poll_type,
    isAnonymousVote: poll.is_anonymous_vote,
    isAnonymousCreator: poll.is_anonymous_creator,
    createdAt: poll.created_at,
    options,
  };
}

// 찬반/단일 선택: 기존 선택을 전부 지우고 새로 하나만 남긴다.
// 다중 투표: 클릭한 항목만 켰다 껐다 토글한다.
export async function castVote(
  roomId: string,
  pollId: string,
  optionId: string,
  pollType: PollType
): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  if (pollType === "multi") {
    const { data: existing } = await supabase
      .from("poll_votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("option_id", optionId)
      .eq("voter_id", user.id)
      .maybeSingle<{ id: string }>();

    if (existing) {
      await supabase.from("poll_votes").delete().eq("id", existing.id);
    } else {
      const { error } = await supabase
        .from("poll_votes")
        .insert({ poll_id: pollId, option_id: optionId, voter_id: user.id });
      if (error) return { error: error.message };
    }
  } else {
    await supabase
      .from("poll_votes")
      .delete()
      .eq("poll_id", pollId)
      .eq("voter_id", user.id);
    const { error } = await supabase
      .from("poll_votes")
      .insert({ poll_id: pollId, option_id: optionId, voter_id: user.id });
    if (error) return { error: error.message };
  }

  revalidatePath(`/room/${roomId}`);
  return null;
}
