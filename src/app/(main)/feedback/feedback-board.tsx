"use client";

import { useState } from "react";
import {
  createFeedbackPost,
  createFeedbackComment,
  deleteFeedbackComment,
  type FeedbackCategory,
} from "@/lib/feedback";
import { RichTextEditor } from "@/components/rich-text-editor";
import { RichContent } from "@/components/rich-content";

export type FeedbackComment = {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
};

export type FeedbackPost = {
  id: string;
  category: FeedbackCategory;
  title: string;
  content: string;
  createdAt: string;
  authorName: string;
  comments: FeedbackComment[];
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
  isAdmin,
}: {
  selfName: string;
  initialPosts: FeedbackPost[];
  isAdmin: boolean;
}) {
  const [posts, setPosts] = useState<FeedbackPost[]>(initialPosts);
  const [writing, setWriting] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("suggestion");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyPending, setReplyPending] = useState<string | null>(null);

  const submit = async () => {
    setPending(true);
    setError(null);
    const result = await createFeedbackPost(category, title, content);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setPosts((prev) => [{ ...result, authorName: selfName, comments: [] }, ...prev]);
    setTitle("");
    setContent("");
    setWriting(false);
  };

  const submitReply = async (postId: string) => {
    const draft = (replyDrafts[postId] ?? "").trim();
    if (!draft) return;
    setReplyPending(postId);
    const result = await createFeedbackComment(postId, draft);
    setReplyPending(null);
    if ("error" in result) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                { id: result.id, content: result.content, createdAt: result.createdAt, authorName: selfName },
              ],
            }
          : p
      )
    );
    setReplyDrafts((prev) => ({ ...prev, [postId]: "" }));
  };

  const removeComment = async (postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p
      )
    );
    await deleteFeedbackComment(commentId);
  };

  return (
    <div className="flex flex-col gap-4 border border-neutral-400 p-4">
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
          <RichTextEditor value={content} onChange={setContent} placeholder="내용" />
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
        <ul className="flex flex-col divide-y divide-neutral-400 border border-neutral-400">
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
                    {p.comments.length > 0 && (
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        답변 {p.comments.length}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-[12px] text-neutral-400">
                    {p.authorName} · {formatDate(p.createdAt)}
                  </span>
                </button>
                {isOpen && (
                  <div className="flex flex-col gap-3 px-4 pb-3">
                    <RichContent content={p.content} />

                    {p.comments.length > 0 && (
                      <div className="flex flex-col gap-2 border-l-2 border-neutral-200 pl-3 dark:border-neutral-700">
                        {p.comments.map((c) => (
                          <div key={c.id} className="flex flex-col gap-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                                {c.authorName} · {formatDate(c.createdAt)}
                              </span>
                              {isAdmin && (
                                <button
                                  onClick={() => removeComment(p.id, c.id)}
                                  className="text-[11px] text-neutral-300 hover:text-red-500 dark:text-neutral-600"
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                            <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-200">
                              {c.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {isAdmin && (
                      <div className="flex gap-2">
                        <input
                          value={replyDrafts[p.id] ?? ""}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === "Enter" && submitReply(p.id)}
                          placeholder="관리자 답글"
                          className="min-w-0 flex-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
                        />
                        <button
                          onClick={() => submitReply(p.id)}
                          disabled={replyPending === p.id}
                          className="shrink-0 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
                        >
                          등록
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
