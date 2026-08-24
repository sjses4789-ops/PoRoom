"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createPost, updatePost, deletePost, type PostCategory } from "@/lib/room-posts";

export type RoomPost = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  category: PostCategory;
};

// PostCategory values stay in canonical Korean (the DB/type identifier),
// while the on-screen label goes through CATEGORY_LABEL_KEY below so every
// locale can display its own translation.
const CATEGORIES: PostCategory[] = ["공지사항", "정보 공유", "팁 전수", "자유"];

const CATEGORY_LABEL_KEY: Record<PostCategory, "notice" | "infoShare" | "tips" | "free"> = {
  "공지사항": "notice",
  "정보 공유": "infoShare",
  "팁 전수": "tips",
  "자유": "free",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BoardPanel({
  roomId,
  selfId,
  selfName,
  canPostNotice,
  initialPosts,
}: {
  roomId: string;
  selfId: string;
  selfName: string;
  canPostNotice: boolean;
  initialPosts: RoomPost[];
}) {
  const t = useTranslations("room.boardPanel");
  const [posts, setPosts] = useState<RoomPost[]>(initialPosts);
  const visibleCategories = canPostNotice
    ? CATEGORIES
    : CATEGORIES.filter((c) => c !== "공지사항");
  const [activeCategory, setActiveCategory] = useState<PostCategory>(visibleCategories[0]);
  const [writing, setWriting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const canWriteHere = activeCategory !== "공지사항" || canPostNotice;

  const submit = async () => {
    setPending(true);
    setError(null);
    const result = await createPost(roomId, title, content, activeCategory);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setPosts((prev) => [{ ...result, authorId: selfId, authorName: selfName }, ...prev]);
    setTitle("");
    setContent("");
    setWriting(false);
  };

  const canModify = (p: RoomPost) => p.authorId === selfId || canPostNotice;

  const startEdit = (p: RoomPost) => {
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditContent(p.content);
    setEditError(null);
  };

  const submitEdit = async (postId: string) => {
    setEditPending(true);
    setEditError(null);
    const result = await updatePost(roomId, postId, editTitle, editContent);
    setEditPending(false);
    if ("error" in result) {
      setEditError(result.error);
      return;
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, title: editTitle.trim(), content: editContent.trim() } : p
      )
    );
    setEditingId(null);
  };

  const removePost = async (postId: string) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    const result = await deletePost(roomId, postId);
    if ("error" in result) {
      window.alert(result.error);
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setOpenId(null);
  };

  const visiblePosts = posts.filter((p) => p.category === activeCategory);

  return (
    <div className="grid grid-cols-1 gap-4 border border-neutral-400 p-4 lg:grid-cols-[140px_1fr] dark:border-neutral-600">
      <div className="flex flex-row flex-wrap gap-1.5 lg:flex-col lg:flex-nowrap lg:border-r lg:border-neutral-100 lg:pr-4 dark:lg:border-neutral-800">
        {visibleCategories.map((c) => (
          <button
            key={c}
            onClick={() => {
              setActiveCategory(c);
              setWriting(false);
              setOpenId(null);
            }}
            className={`shrink-0 rounded-md px-3 py-1.5 text-left text-sm font-medium transition ${
              activeCategory === c
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            {t(`categories.${CATEGORY_LABEL_KEY[c]}`)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {t(`categories.${CATEGORY_LABEL_KEY[activeCategory]}`)}
          </h2>
          {canWriteHere && (
            <button
              onClick={() => setWriting((v) => !v)}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {writing ? t("cancel") : t("write")}
            </button>
          )}
        </div>

        {writing && (
          <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("contentPlaceholder")}
              rows={4}
              className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={submit}
              disabled={pending}
              className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {pending ? t("submitting") : t("submit")}
            </button>
          </div>
        )}

        {visiblePosts.length === 0 ? (
          <p className="text-xs text-neutral-400">{t("noPosts")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-neutral-400 border border-neutral-400 dark:divide-neutral-600 dark:border-neutral-600">
            {visiblePosts.map((p) => {
              const isOpen = openId === p.id;
              const isEditing = editingId === p.id;
              return (
                <li key={p.id} className="flex flex-col">
                  <button
                    onClick={() => setOpenId(isOpen ? null : p.id)}
                    className="flex items-center justify-between gap-2 px-4 py-3 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <span className="min-w-0 truncate font-medium text-neutral-900 dark:text-white">
                      {p.title}
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-[12px] text-neutral-400">
                      {p.authorName} · {formatDate(p.createdAt)}
                    </span>
                  </button>
                  {isOpen && !isEditing && (
                    <div className="flex flex-col gap-2 px-4 pb-3">
                      <p className="whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-300">
                        {p.content}
                      </p>
                      {canModify(p) && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => startEdit(p)}
                            className="rounded-md border border-neutral-200 px-2.5 py-1 text-[12px] font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                          >
                            {t("edit")}
                          </button>
                          <button
                            onClick={() => removePost(p.id)}
                            className="rounded-md border border-red-200 px-2.5 py-1 text-[12px] font-medium text-red-500 transition hover:bg-red-50"
                          >
                            {t("delete")}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {isOpen && isEditing && (
                    <div className="flex flex-col gap-2 px-4 pb-3">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder={t("titlePlaceholder")}
                        className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder={t("contentPlaceholder")}
                        rows={4}
                        className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
                      />
                      {editError && <p className="text-xs text-red-500">{editError}</p>}
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => submitEdit(p.id)}
                          disabled={editPending}
                          className="rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                        >
                          {editPending ? t("saving") : t("save")}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
