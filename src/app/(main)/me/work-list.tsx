"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createWork, deleteWork, renameWork } from "@/lib/works";
import { WORK_LINE_COLORS as LINE_COLORS } from "@/lib/work-colors";
import type { WorkMeta } from "./work-chart";

export function WorkList({
  works,
  onWorksChange,
  selectedId,
  onSelect,
}: {
  works: WorkMeta[];
  onWorksChange: (updater: (prev: WorkMeta[]) => WorkMeta[]) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const t = useTranslations("me.workList");
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const confirmAdd = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setPending(true);
    const result = await createWork(title);
    setPending(false);
    if ("error" in result) return;
    onWorksChange((prev) => [...prev, { id: result.id, title: result.title }]);
    setNewTitle("");
    setAdding(false);
  };

  const removeWork = async (work: WorkMeta) => {
    if (!window.confirm(t("deleteConfirm", { title: work.title }))) return;
    setBusyId(work.id);
    await deleteWork(work.id);
    onWorksChange((prev) => prev.filter((w) => w.id !== work.id));
    if (selectedId === work.id) onSelect(null);
    setBusyId(null);
  };

  const startEdit = (work: WorkMeta) => {
    setEditingId(work.id);
    setEditTitle(work.title);
  };

  const confirmEdit = async () => {
    if (!editingId) return;
    const title = editTitle.trim();
    if (!title) {
      setEditingId(null);
      return;
    }
    setBusyId(editingId);
    const result = await renameWork(editingId, title);
    setBusyId(null);
    if ("error" in result) {
      setEditingId(null);
      return;
    }
    onWorksChange((prev) => prev.map((w) => (w.id === result.id ? { ...w, title: result.title } : w)));
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</h2>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          title={t("addTitle")}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          +
        </button>
      </div>

      {adding && (
        <div className="flex gap-1.5">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmAdd()}
            placeholder={t("namePlaceholder")}
            className="min-w-0 flex-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
          />
          <button
            type="button"
            onClick={confirmAdd}
            disabled={pending}
            className="shrink-0 rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {t("add")}
          </button>
        </div>
      )}

      {works.length === 0 ? (
        <p className="text-xs text-neutral-400">{t("noWorks")}</p>
      ) : (
        <ul className="flex max-h-64 flex-col divide-y divide-neutral-400 overflow-y-auto dark:divide-neutral-600">
          {works.map((w, i) => {
            const isSelected = (selectedId ?? works[0]?.id) === w.id;
            const isEditing = editingId === w.id;
            return (
              <li
                key={w.id}
                className={`flex items-center gap-2 py-2 ${isEditing ? "" : "cursor-pointer"} ${
                  isSelected ? "rounded-sm bg-neutral-100 px-1.5 dark:bg-neutral-800" : ""
                }`}
                onClick={() => !isEditing && onSelect(w.id)}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }}
                />
                {isEditing ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
                    onBlur={confirmEdit}
                    className="min-w-0 flex-1 rounded-md border border-neutral-200 px-2 py-0.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
                  />
                ) : (
                  <span
                    className={`min-w-0 flex-1 truncate text-sm ${
                      isSelected
                        ? "font-medium text-neutral-900 dark:text-white"
                        : "text-neutral-800 dark:text-neutral-200"
                    }`}
                  >
                    {w.title}
                  </span>
                )}
                {!isEditing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(w);
                    }}
                    disabled={busyId === w.id}
                    title={t("renameTitle")}
                    className="shrink-0 text-neutral-300 transition hover:text-neutral-600 disabled:opacity-50 dark:text-neutral-600 dark:hover:text-neutral-300"
                  >
                    ✎
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWork(w);
                  }}
                  disabled={busyId === w.id}
                  title={t("deleteTitle")}
                  className="shrink-0 text-neutral-300 transition hover:text-red-500 disabled:opacity-50 dark:text-neutral-600"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
