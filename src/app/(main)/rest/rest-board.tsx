"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  createRestPost,
  updateRestPost,
  deleteRestPost,
  type RestPostCategory,
} from "@/lib/rest";

export type RestPost = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  category: RestPostCategory;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RestBoard({
  category,
  selfId,
  selfName,
  isAdmin,
  initialPosts,
}: {
  category: RestPostCategory;
  selfId: string;
  selfName: string;
  isAdmin: boolean;
  initialPosts: RestPost[];
}) {
  const t = useTranslations("rest.board");
  const [posts, setPosts] = useState<RestPost[]>(initialPosts);
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

  const visiblePosts = posts.filter((p) => p.category === category);

  const submit = async () => {
    setPending(true);
    setError(null);
    const result = await createRestPost(title, content, category);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setPosts((prev) => [
      { ...result, authorId: selfId, authorName: selfName },
      ...prev,
    ]);
    setTitle("");
    setContent("");
    setWriting(false);
  };

  const canModify = (p: RestPost) => p.authorId === selfId || isAdmin;

  const startEdit = (p: RestPost) => {
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditContent(p.content);
  };

  const submitEdit = async (postId: string) => {
    setEditPending(true);
    const result = await updateRestPost(postId, editTitle, editContent);
    setEditPending(false);
    if ("error" in result) {
      window.alert(result.error);
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
    const result = await deleteRestPost(postId);
    if ("error" in result) {
      window.alert(result.error);
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setOpenId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t(`category.${category}`)}
        </h2>
        <button
          onClick={() => setWriting((v) => !v)}
          className="rounded-sm bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {writing ? t("cancel") : t("write")}
        </button>
      </div>

      {writing && (
        <div className="flex flex-col gap-2 rounded-sm border border-neutral-400 p-3 dark:border-neutral-600">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("titlePlaceholder")}
            className="rounded-sm border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:text-white outline-none focus:border-neutral-400"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("contentPlaceholder")}
            rows={4}
            className="rounded-sm border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:text-white outline-none focus:border-neutral-400"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={submit}
            disabled={pending}
            className="self-start rounded-sm bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {pending ? t("submitting") : t("submit")}
          </button>
        </div>
      )}

      {visiblePosts.length === 0 ? (
        <p className="text-xs text-neutral-400">{t("noPosts")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-400 overflow-hidden rounded-sm border border-neutral-400 dark:divide-neutral-600 dark:border-neutral-600">
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
                {isOpen && (
                  <div className="flex flex-col gap-2 px-4 pb-3">
                    {isEditing ? (
                      <>
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="rounded-sm border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:text-white outline-none focus:border-neutral-400"
                        />
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={4}
                          className="rounded-sm border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:text-white outline-none focus:border-neutral-400"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitEdit(p.id)}
                            disabled={editPending}
                            className="rounded-sm bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                          >
                            {editPending ? t("submitting") : t("save")}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-sm border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                          >
                            {t("cancel")}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-300">
                          {p.content}
                        </p>
                        {canModify(p) && (
                          <div className="flex gap-3 text-[11px] text-neutral-400">
                            <button onClick={() => startEdit(p)} className="hover:text-neutral-700 dark:hover:text-neutral-200">
                              {t("edit")}
                            </button>
                            <button onClick={() => removePost(p.id)} className="hover:text-red-500">
                              {t("delete")}
                            </button>
                          </div>
                        )}
                      </>
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
