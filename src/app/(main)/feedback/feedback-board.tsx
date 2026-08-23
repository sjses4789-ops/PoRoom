"use client";

import { useState } from "react";
import { createFeedbackPost, type FeedbackCategory } from "@/lib/feedback";

export type FeedbackPost = {
  id: string;
  category: FeedbackCategory;
  title: string;
  content: string;
  createdAt: string;
  authorName: string;
};

const CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  suggestion: "기능 제안",
  bug: "버그 신고",
};

const CATEGORY_BADGE: Record<FeedbackCategory, string> = {
  suggestion: "bg-sky-500",
  bug: "bg-red-500",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FeedbackBoard({
  selfName,
  initialPosts,
}: {
  selfName: string;
  initialPosts: FeedbackPost[];
}) {
  const [posts, setPosts] = useState<FeedbackPost[]>(initialPosts);
  const [writing, setWriting] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("suggestion");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const submit = async () => {
    setPending(true);
    setError(null);
    const result = await createFeedbackPost(category, title, content);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setPosts((prev) => [{ ...result, authorName: selfName }, ...prev]);
    setTitle("");
    setContent("");
    setWriting(false);
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">전체 {posts.length}건</h2>
        <button
          onClick={() => setWriting((v) => !v)}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700"
        >
          {writing ? "취소" : "글쓰기"}
        </button>
      </div>

      {writing && (
        <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3">
          <div className="flex gap-3">
            {(["suggestion", "bug"] as const).map((c) => (
              <label key={c} className="flex items-center gap-1.5 text-xs text-neutral-700">
                <input
                  type="radio"
                  name="category"
                  checked={category === c}
                  onChange={() => setCategory(c)}
                  className="accent-neutral-900"
                />
                {CATEGORY_LABEL[c]}
              </label>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용"
            rows={4}
            className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={submit}
            disabled={pending}
            className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
          >
            {pending ? "등록 중..." : "등록"}
          </button>
        </div>
      )}

      {posts.length === 0 ? (
        <p className="text-xs text-neutral-400">아직 등록된 글이 없습니다.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-100 rounded-lg border border-neutral-200">
          {posts.map((p) => {
            const isOpen = openId === p.id;
            return (
              <li key={p.id} className="flex flex-col">
                <button
                  onClick={() => setOpenId(isOpen ? null : p.id)}
                  className="flex items-center justify-between gap-2 px-4 py-3 text-left text-sm hover:bg-neutral-50"
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium text-white ${CATEGORY_BADGE[p.category]}`}
                    >
                      {CATEGORY_LABEL[p.category]}
                    </span>
                    <span className="min-w-0 truncate font-medium text-neutral-900 dark:text-white">
                      {p.title}
                    </span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-[12px] text-neutral-400">
                    {p.authorName} · {formatDate(p.createdAt)}
                  </span>
                </button>
                {isOpen && (
                  <p className="whitespace-pre-wrap px-4 pb-3 text-sm text-neutral-600">
                    {p.content}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
