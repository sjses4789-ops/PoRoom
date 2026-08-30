"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { adminUpdateChallengeEvent } from "@/lib/admin";

export function AdminEventEditButton({
  challengeId,
  currentTitle,
  currentStartDate,
  currentEndDate,
}: {
  challengeId: string;
  currentTitle: string;
  currentStartDate: string | null;
  currentEndDate: string | null;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);
  const posterRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("challengeId", challengeId);
    formData.set("title", titleRef.current?.value ?? "");
    formData.set("startDate", startRef.current?.value ?? "");
    formData.set("endDate", endRef.current?.value ?? "");
    const poster = posterRef.current?.files?.[0];
    if (poster) formData.set("posterImage", poster);

    const result = await adminUpdateChallengeEvent(null, formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-md border border-neutral-200 px-2.5 py-1 text-[11px] font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {t("editEvent")}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-10 bg-neutral-900/20" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-20 flex w-[min(22rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-md border border-neutral-300 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{t("editEvent")}</p>
              <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                ✕
              </button>
            </div>
            <input
              ref={titleRef}
              defaultValue={currentTitle}
              placeholder={t("eventNamePlaceholder")}
              className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
            />
            <div className="flex gap-2">
              <input
                ref={startRef}
                type="date"
                defaultValue={currentStartDate ?? ""}
                className="w-1/2 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700 outline-none focus:border-neutral-400"
              />
              <input
                ref={endRef}
                type="date"
                defaultValue={currentEndDate ?? ""}
                className="w-1/2 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700 outline-none focus:border-neutral-400"
              />
            </div>
            <label className="flex flex-col gap-1 text-[12px] text-neutral-500 dark:text-neutral-400">
              {t("posterImageReplaceLabel")}
              <input
                ref={posterRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="text-xs text-neutral-600 dark:text-neutral-300"
              />
            </label>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {pending ? t("saving") : t("save")}
            </button>
          </div>
        </>
      )}
    </>
  );
}
