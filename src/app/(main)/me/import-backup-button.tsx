"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function ImportBackupButton() {
  const t = useTranslations("me.page");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setPending(true);
    setMessage(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/export/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      const result = await res.json();
      if (!res.ok) {
        setMessage(result.error ?? t("importInvalidFile"));
      } else {
        setMessage(t("importSuccess"));
        router.refresh();
      }
    } catch {
      setMessage(t("importInvalidFile"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => {
          if (window.confirm(t("importConfirm"))) inputRef.current?.click();
        }}
        disabled={pending}
        className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {pending ? t("importPending") : t("importBackup")}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {message && <p className="text-[11px] text-neutral-400">{message}</p>}
    </div>
  );
}
