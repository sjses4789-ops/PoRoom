"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createWork, deleteWork } from "@/lib/works";
import { WORK_LINE_COLORS as LINE_COLORS } from "@/lib/work-colors";
import type { WorkMeta } from "./work-chart";

export function WorkList({
  works,
  onWorksChange,
}: {
  works: WorkMeta[];
  onWorksChange: (updater: (prev: WorkMeta[]) => WorkMeta[]) => void;
}) {
  const t = useTranslations("me.workList");
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

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
    setBusyId(null);
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
        <ul className="flex max-h-64 flex-col divide-y divide-neutral-100 overflow-y-auto dark:divide-neutral-800">
          {works.map((w, i) => (
            <li key={w.id} className="flex items-center gap-2 py-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-neutral-800 dark:text-neutral-200">
                {w.title}
              </span>
              <button
                type="button"
                onClick={() => removeWork(w)}
                disabled={busyId === w.id}
                title={t("deleteTitle")}
                className="shrink-0 text-neutral-300 transition hover:text-red-500 disabled:opacity-50 dark:text-neutral-600"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
