"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  createRestPost,
  updateRestPost,
  deleteRestPost,
  setRestPostPinned,
  type JoinedRoom,
} from "@/lib/rest";
import { REST_INFO_CATEGORIES, type RestPostCategory, type RestInfoCategory } from "@/lib/rest-types";
import { RichTextEditor } from "@/components/rich-text-editor";
import { RichContent } from "@/components/rich-content";

export type RestPost = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  category: RestPostCategory;
  infoCategory: RestInfoCategory | null;
  pinned: boolean;
  roomId: string | null;
  roomName: string | null;
};

// 카테고리마다 다른 색으로 구분한다 — 옅은 배경 + 진한 글자(라이트),
// 어두운 배경 + 밝은 글자(다크) 쌍.
const INFO_CATEGORY_COLOR: Record<RestInfoCategory, string> = {
  "팁&노하우": "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  "공모전": "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "질문": "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  "기타": "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
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
  myRooms,
}: {
  category: RestPostCategory;
  selfId: string;
  selfName: string;
  isAdmin: boolean;
  initialPosts: RestPost[];
  myRooms: JoinedRoom[];
}) {
  const t = useTranslations("rest.board");
  const [posts, setPosts] = useState<RestPost[]>(initialPosts);
  const [writing, setWriting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [roomId, setRoomId] = useState("");
  const [infoCategory, setInfoCategory] = useState<RestInfoCategory | "">("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editRoomId, setEditRoomId] = useState("");
  const [editInfoCategory, setEditInfoCategory] = useState<RestInfoCategory | "">("");
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [pinBusyId, setPinBusyId] = useState<string | null>(null);

  const isRecruit = category === "인원 모집";
  const isInfo = category === "정보";
  const visiblePosts = posts
    .filter((p) => p.category === category)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));

  const submit = async () => {
    setPending(true);
    setError(null);
    const result = await createRestPost(
      title,
      content,
      category,
      isRecruit ? roomId || null : null,
      isInfo ? infoCategory || null : null
    );
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setPosts((prev) => [
      {
        ...result,
        authorId: selfId,
        authorName: selfName,
        roomName: myRooms.find((r) => r.id === result.roomId)?.name ?? null,
      },
      ...prev,
    ]);
    setTitle("");
    setContent("");
    setRoomId("");
    setInfoCategory("");
    setWriting(false);
  };

  const canModify = (p: RestPost) => p.authorId === selfId || isAdmin;

  const startEdit = (p: RestPost) => {
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditContent(p.content);
    setEditRoomId(p.roomId ?? "");
    setEditInfoCategory(p.infoCategory ?? "");
    setEditError(null);
  };

  const submitEdit = async (postId: string) => {
    setEditPending(true);
    setEditError(null);
    const result = await updateRestPost(
      postId,
      editTitle,
      editContent,
      isRecruit ? editRoomId || null : null,
      isInfo ? editInfoCategory || null : null
    );
    setEditPending(false);
    if ("error" in result) {
      setEditError(result.error);
      return;
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              title: editTitle.trim(),
              content: editContent.trim(),
              roomId: isRecruit ? editRoomId || null : null,
              roomName: isRecruit ? myRooms.find((r) => r.id === editRoomId)?.name ?? null : null,
              infoCategory: isInfo ? editInfoCategory || null : null,
            }
          : p
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

  const togglePin = async (p: RestPost) => {
    const next = !p.pinned;
    setPinBusyId(p.id);
    const result = await setRestPostPinned(p.id, next);
    setPinBusyId(null);
    if ("error" in result) {
      window.alert(result.error);
      return;
    }
    setPosts((prev) => prev.map((post) => (post.id === p.id ? { ...post, pinned: next } : post)));
  };

  const infoCategorySelect = (
    value: RestInfoCategory | "",
    onChange: (v: RestInfoCategory | "") => void
  ) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as RestInfoCategory | "")}
      className="rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white outline-none focus:border-neutral-400"
    >
      <option value="">{t("noInfoCategory")}</option>
      {REST_INFO_CATEGORIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );

  const roomSelect = (value: string, onChange: (v: string) => void) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white outline-none focus:border-neutral-400"
    >
      <option value="">{t("noRoomLink")}</option>
      {myRooms.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
        </option>
      ))}
    </select>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t(`category.${category}`)}
        </h2>
        <button
          onClick={() => setWriting((v) => !v)}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {writing ? t("cancel") : t("write")}
        </button>
      </div>

      {writing && (
        <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("titlePlaceholder")}
            className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
          />
          <RichTextEditor value={content} onChange={setContent} placeholder={t("contentPlaceholder")} />
          {isRecruit && (
            <label className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              {t("linkRoomLabel")}
              {roomSelect(roomId, setRoomId)}
            </label>
          )}
          {isInfo && (
            <label className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              {t("infoCategoryLabel")}
              {infoCategorySelect(infoCategory, setInfoCategory)}
            </label>
          )}
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
        <div className="overflow-hidden rounded-sm border border-neutral-400 dark:border-neutral-600">
          <div className="hidden grid-cols-[56px_1fr_100px_92px] gap-2 border-b border-neutral-400 bg-neutral-50 px-4 py-2 text-[11px] font-medium text-neutral-500 sm:grid dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
            <span className="text-center">{t("no")}</span>
            <span>{t("titleColumn")}</span>
            <span className="text-center">{t("authorColumn")}</span>
            <span className="text-center">{t("dateColumn")}</span>
          </div>
          <ul className="flex flex-col divide-y divide-neutral-400 dark:divide-neutral-600">
            {visiblePosts.map((p, i) => {
              const isOpen = openId === p.id;
              const isEditing = editingId === p.id;
              const num = visiblePosts.length - i;
              return (
                <li key={p.id} className="flex flex-col">
                  <button
                    onClick={() => setOpenId(isOpen ? null : p.id)}
                    className={`grid grid-cols-[auto_1fr] items-center gap-2 px-4 py-3 text-left text-sm transition hover:bg-neutral-50 sm:grid-cols-[56px_1fr_100px_92px] dark:hover:bg-neutral-800 ${
                      isOpen ? "bg-neutral-50 dark:bg-neutral-800" : ""
                    }`}
                  >
                    <span className="hidden text-center text-[12px] text-neutral-400 sm:block">
                      {num}
                    </span>
                    <span className="min-w-0 truncate font-medium text-neutral-900 dark:text-white">
                      {p.pinned && (
                        <span className="mr-1 text-amber-500" aria-hidden>
                          📌
                        </span>
                      )}
                      {p.infoCategory && (
                        <span
                          className={`mr-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${INFO_CATEGORY_COLOR[p.infoCategory]}`}
                        >
                          {p.infoCategory}
                        </span>
                      )}
                      {p.roomId && (
                        <span className="mr-1 text-[11px] text-emerald-600 dark:text-emerald-400">🔗</span>
                      )}
                      {p.title}
                    </span>
                    <span className="hidden truncate text-center text-[12px] text-neutral-400 sm:block">
                      {p.authorName}
                    </span>
                    <span className="hidden whitespace-nowrap text-center text-[12px] text-neutral-400 sm:block">
                      {formatDate(p.createdAt)}
                    </span>
                    <span className="col-span-2 text-[11px] text-neutral-400 sm:hidden">
                      {p.authorName} · {formatDate(p.createdAt)}
                    </span>
                  </button>
                  {isOpen && !isEditing && (
                    <div className="flex flex-col gap-2 border-t border-neutral-100 bg-neutral-50/50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                      <RichContent content={p.content} />
                      {p.roomId && (
                        <Link
                          href={`/room/${p.roomId}`}
                          className="inline-flex w-fit items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
                        >
                          🔗 {p.roomName ?? t("unknownRoom")} {t("goToRoom")}
                        </Link>
                      )}
                      {(canModify(p) || (isAdmin && isInfo)) && (
                        <div className="flex gap-3 text-[11px] text-neutral-400">
                          {isAdmin && isInfo && (
                            <button
                              onClick={() => togglePin(p)}
                              disabled={pinBusyId === p.id}
                              className="hover:text-amber-600 disabled:opacity-50 dark:hover:text-amber-400"
                            >
                              {p.pinned ? t("unpin") : t("pin")}
                            </button>
                          )}
                          {canModify(p) && (
                            <>
                              <button onClick={() => startEdit(p)} className="hover:text-neutral-700 dark:hover:text-neutral-200">
                                {t("edit")}
                              </button>
                              <button onClick={() => removePost(p.id)} className="hover:text-red-500">
                                {t("delete")}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {isOpen && isEditing && (
                    <div className="flex flex-col gap-2 border-t border-neutral-100 bg-neutral-50/50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder={t("titlePlaceholder")}
                        className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
                      />
                      <RichTextEditor value={editContent} onChange={setEditContent} placeholder={t("contentPlaceholder")} />
                      {isRecruit && (
                        <label className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                          {t("linkRoomLabel")}
                          {roomSelect(editRoomId, setEditRoomId)}
                        </label>
                      )}
                      {isInfo && (
                        <label className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                          {t("infoCategoryLabel")}
                          {infoCategorySelect(editInfoCategory, setEditInfoCategory)}
                        </label>
                      )}
                      {editError && <p className="text-xs text-red-500">{editError}</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitEdit(p.id)}
                          disabled={editPending}
                          className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                        >
                          {editPending ? t("saving") : t("save")}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
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
        </div>
      )}
    </div>
  );
}
