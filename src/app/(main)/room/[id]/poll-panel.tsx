"use client";

import { useState } from "react";
import { createPoll, castVote, type PollType } from "@/lib/polls";

export type PollOption = { id: string; label: string; count: number };
export type Poll = {
  id: string;
  title: string;
  pollType: PollType;
  isAnonymousVote: boolean;
  authorName: string | null; // null → 익명 투표
  createdAt: string;
  options: PollOption[];
  selfVoteOptionIds: string[];
};

const POLL_TYPE_LABEL: Record<PollType, string> = {
  yesno: "찬반 투표",
  single: "단일 선택",
  multi: "다중 투표",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    month: "numeric",
    day: "numeric",
  });
}

function PollCard({
  poll,
  onVote,
}: {
  poll: Poll;
  onVote: (pollId: string, optionId: string, pollType: PollType) => void;
}) {
  const total = poll.options.reduce((sum, o) => sum + o.count, 0);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-neutral-900 dark:text-white">
          {poll.title}
        </span>
        <span className="text-[12px] text-neutral-400">
          {poll.authorName ?? "익명"} · {formatDate(poll.createdAt)} ·{" "}
          {POLL_TYPE_LABEL[poll.pollType]}
          {poll.isAnonymousVote ? " · 익명 투표" : ""}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {poll.options.map((opt) => {
          const pct = total > 0 ? Math.round((opt.count / total) * 100) : 0;
          const isMine = poll.selfVoteOptionIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => onVote(poll.id, opt.id, poll.pollType)}
              className={`relative overflow-hidden rounded-md border px-2.5 py-1.5 text-left text-xs transition ${
                isMine
                  ? "border-neutral-900 dark:border-white"
                  : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              }`}
            >
              <div
                className="absolute inset-y-0 left-0 bg-neutral-100 transition-all dark:bg-neutral-800"
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between gap-2">
                <span
                  className={`truncate font-medium ${
                    isMine ? "text-neutral-900 dark:text-white" : "text-neutral-700 dark:text-neutral-200"
                  }`}
                >
                  {isMine ? "✓ " : ""}
                  {opt.label}
                </span>
                <span className="shrink-0 text-neutral-500 dark:text-neutral-400">
                  {opt.count}표 ({pct}%)
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[12px] text-neutral-400">
        {poll.pollType === "multi" ? "중복 선택 가능" : ""} 총 {total}표
      </p>
    </div>
  );
}

export function PollPanel({
  roomId,
  selfName,
  initialPolls,
}: {
  roomId: string;
  selfName: string;
  initialPolls: Poll[];
}) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [pollType, setPollType] = useState<PollType>("yesno");
  const [candidates, setCandidates] = useState(["", ""]);
  const [anonVote, setAnonVote] = useState(false);
  const [anonCreator, setAnonCreator] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setPollType("yesno");
    setCandidates(["", ""]);
    setAnonVote(false);
    setAnonCreator(false);
    setError(null);
  };

  const submit = async () => {
    setPending(true);
    setError(null);
    const result = await createPoll(
      roomId,
      title,
      pollType,
      candidates,
      anonVote,
      anonCreator
    );
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setPolls((prev) => [
      {
        id: result.id,
        title: result.title,
        pollType: result.pollType,
        isAnonymousVote: result.isAnonymousVote,
        authorName: result.isAnonymousCreator ? null : selfName,
        createdAt: result.createdAt,
        options: result.options.map((o) => ({ id: o.id, label: o.label, count: 0 })),
        selfVoteOptionIds: [],
      },
      ...prev,
    ]);
    resetForm();
    setCreating(false);
  };

  const vote = async (pollId: string, optionId: string, pollType: PollType) => {
    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p;
        const alreadyMine = p.selfVoteOptionIds.includes(optionId);

        if (pollType === "multi") {
          const nextIds = alreadyMine
            ? p.selfVoteOptionIds.filter((id) => id !== optionId)
            : [...p.selfVoteOptionIds, optionId];
          return {
            ...p,
            selfVoteOptionIds: nextIds,
            options: p.options.map((o) =>
              o.id === optionId ? { ...o, count: o.count + (alreadyMine ? -1 : 1) } : o
            ),
          };
        }

        // yesno/single: 기존 선택은 지우고 새 선택 하나만 남긴다.
        return {
          ...p,
          selfVoteOptionIds: [optionId],
          options: p.options.map((o) => {
            if (o.id === optionId) return { ...o, count: o.count + 1 };
            if (p.selfVoteOptionIds.includes(o.id)) return { ...o, count: Math.max(0, o.count - 1) };
            return o;
          }),
        };
      })
    );
    await castVote(roomId, pollId, optionId, pollType);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">투표</h2>
        <button
          onClick={() => setCreating((v) => !v)}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {creating ? "취소" : "투표 만들기"}
        </button>
      </div>

      {creating && (
        <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="투표 제목"
            className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
          />

          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
              투표 방식
            </span>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  { key: "yesno" as const, label: "찬반 투표 (찬성/반대)" },
                  { key: "single" as const, label: "단일 선택" },
                  { key: "multi" as const, label: "다중 투표" },
                ]
              ).map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300"
                >
                  <input
                    type="radio"
                    checked={pollType === opt.key}
                    onChange={() => setPollType(opt.key)}
                    className="accent-neutral-900"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {pollType !== "yesno" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                선택지 목록
              </span>
              {candidates.map((c, i) => (
                <div key={i} className="flex gap-1.5">
                  <input
                    value={c}
                    onChange={(e) =>
                      setCandidates((prev) =>
                        prev.map((v, idx) => (idx === i ? e.target.value : v))
                      )
                    }
                    placeholder={`선택지 ${i + 1}`}
                    className="flex-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
                  />
                  {candidates.length > 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        setCandidates((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="shrink-0 rounded-md border border-neutral-200 px-2 text-xs text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCandidates((prev) => [...prev, ""])}
                className="self-start rounded-md border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                선택지 추가
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={anonVote}
                onChange={(e) => setAnonVote(e.target.checked)}
                className="accent-neutral-900"
              />
              익명 투표 (누가 뭘 뽑았는지 공개 안 함)
            </label>
            <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={anonCreator}
                onChange={(e) => setAnonCreator(e.target.checked)}
                className="accent-neutral-900"
              />
              익명으로 투표 만들기 (만든 사람 비공개)
            </label>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={submit}
            disabled={pending}
            className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {pending ? "만드는 중..." : "만들기"}
          </button>
        </div>
      )}

      {polls.length === 0 ? (
        <p className="text-xs text-neutral-400">아직 만들어진 투표가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} onVote={vote} />
          ))}
        </div>
      )}
    </div>
  );
}
