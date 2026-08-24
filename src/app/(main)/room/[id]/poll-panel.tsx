"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createPoll, castVote, deletePoll, type PollType } from "@/lib/polls";

export type PollOption = { id: string; label: string; count: number };
export type Poll = {
  id: string;
  title: string;
  pollType: PollType;
  isAnonymousVote: boolean;
  authorName: string | null; // null → 익명 투표
  createdBy: string;
  createdAt: string;
  endsAt: string | null; // null → 무기한 투표
  options: PollOption[];
  selfVoteOptionIds: string[];
};

const POLL_DURATION_OPTIONS = [1, 3, 7] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    month: "numeric",
    day: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PollCard({
  poll,
  canDelete,
  onVote,
  onDelete,
}: {
  poll: Poll;
  canDelete: boolean;
  onVote: (pollId: string, optionId: string, pollType: PollType) => void;
  onDelete: (pollId: string) => void;
}) {
  const t = useTranslations("room.pollPanel");
  const total = poll.options.reduce((sum, o) => sum + o.count, 0);
  const isEnded = poll.endsAt !== null && new Date(poll.endsAt) <= new Date();

  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded-sm border border-neutral-400 p-4 dark:border-neutral-600">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-neutral-900 dark:text-white">
            {poll.title}
          </span>
          <span className="text-[12px] text-neutral-400">
            {poll.authorName ?? t("anonymous")} · {formatDate(poll.createdAt)} ·{" "}
            {t(`type.${poll.pollType}`)}
            {poll.isAnonymousVote ? ` · ${t("anonymousVote")}` : ""}
          </span>
          <span className={`text-[12px] ${isEnded ? "font-medium text-red-500" : "text-neutral-400"}`}>
            {poll.endsAt
              ? isEnded
                ? t("endedAt", { date: formatDateTime(poll.endsAt) })
                : t("endsAt", { date: formatDateTime(poll.endsAt) })
              : t("noDeadline")}
          </span>
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(poll.id)}
            title={t("deletePoll")}
            className="shrink-0 text-[11px] text-neutral-300 transition hover:text-red-500 dark:text-neutral-600"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {poll.options.map((opt) => {
          const pct = total > 0 ? Math.round((opt.count / total) * 100) : 0;
          const isMine = poll.selfVoteOptionIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              disabled={isEnded}
              onClick={() => onVote(poll.id, opt.id, poll.pollType)}
              className={`relative overflow-hidden rounded-md border px-2.5 py-1.5 text-left text-xs transition disabled:cursor-not-allowed disabled:opacity-60 ${
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
                  {t("voteCountPct", { count: opt.count, pct })}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[12px] text-neutral-400">
        {poll.pollType === "multi" ? `${t("multiSelectHint")} ` : ""}
        {t("totalVotes", { total })}
      </p>
    </div>
  );
}

export function PollPanel({
  roomId,
  selfId,
  selfName,
  canModerate,
  initialPolls,
}: {
  roomId: string;
  selfId: string;
  selfName: string;
  canModerate: boolean;
  initialPolls: Poll[];
}) {
  const t = useTranslations("room.pollPanel");
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [pollType, setPollType] = useState<PollType>("yesno");
  const [candidates, setCandidates] = useState(["", ""]);
  const [anonVote, setAnonVote] = useState(false);
  const [anonCreator, setAnonCreator] = useState(false);
  const [durationDays, setDurationDays] = useState<number | null>(3);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setPollType("yesno");
    setCandidates(["", ""]);
    setAnonVote(false);
    setAnonCreator(false);
    setDurationDays(3);
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
      anonCreator,
      durationDays
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
        createdBy: selfId,
        createdAt: result.createdAt,
        endsAt: result.endsAt,
        options: result.options.map((o) => ({ id: o.id, label: o.label, count: 0 })),
        selfVoteOptionIds: [],
      },
      ...prev,
    ]);
    resetForm();
    setCreating(false);
  };

  const vote = async (pollId: string, optionId: string, pollType: PollType) => {
    // yesno/single은 이미 내가 고른 선택지를 다시 눌러도 서버 쪽 투표는
    // 1인 1표로 유지되는데, 낙관적 갱신에서 매 클릭마다 count를 +1 해버려서
    // 화면상 득표수만 계속 불어나는 버그가 있었다 — 같은 선택지 재클릭은
    // 아무 변화도 주지 않도록 한다(선택지를 바꾸는 것은 그대로 허용).
    const target = polls.find((p) => p.id === pollId);
    if (target && pollType !== "multi" && target.selfVoteOptionIds.includes(optionId)) {
      return;
    }

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

  const removePoll = async (pollId: string) => {
    if (!window.confirm(t("deletePollConfirm"))) return;
    setPolls((prev) => prev.filter((p) => p.id !== pollId));
    await deletePoll(roomId, pollId);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</h2>
        <button
          onClick={() => setCreating((v) => !v)}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {creating ? t("cancel") : t("create")}
        </button>
      </div>

      {creating && (
        <div className="flex flex-col gap-3 overflow-hidden rounded-sm border border-neutral-400 p-4 dark:border-neutral-600">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("titlePlaceholder")}
            className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
          />

          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
              {t("methodLabel")}
            </span>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  { key: "yesno" as const, label: t("method.yesno") },
                  { key: "single" as const, label: t("method.single") },
                  { key: "multi" as const, label: t("method.multi") },
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
                {t("optionsLabel")}
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
                    placeholder={t("optionPlaceholder", { index: i + 1 })}
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
                      {t("delete")}
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCandidates((prev) => [...prev, ""])}
                className="self-start rounded-md border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {t("addOption")}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
              {t("durationLabel")}
            </span>
            <div className="flex flex-wrap gap-3">
              {POLL_DURATION_OPTIONS.map((d) => (
                <label
                  key={d}
                  className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300"
                >
                  <input
                    type="radio"
                    checked={durationDays === d}
                    onChange={() => setDurationDays(d)}
                    className="accent-neutral-900"
                  />
                  {t("durationDays", { count: d })}
                </label>
              ))}
              <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                <input
                  type="radio"
                  checked={durationDays === null}
                  onChange={() => setDurationDays(null)}
                  className="accent-neutral-900"
                />
                {t("durationUnlimited")}
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={anonVote}
                onChange={(e) => setAnonVote(e.target.checked)}
                className="accent-neutral-900"
              />
              {t("anonVoteCheckbox")}
            </label>
            <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={anonCreator}
                onChange={(e) => setAnonCreator(e.target.checked)}
                className="accent-neutral-900"
              />
              {t("anonCreatorCheckbox")}
            </label>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={submit}
            disabled={pending}
            className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {pending ? t("creating") : t("submit")}
          </button>
        </div>
      )}

      {polls.length === 0 ? (
        <p className="text-xs text-neutral-400">{t("noPolls")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              canDelete={canModerate || poll.createdBy === selfId}
              onVote={vote}
              onDelete={removePoll}
            />
          ))}
        </div>
      )}
    </div>
  );
}
