"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { deleteAccount } from "@/lib/account";

export function DeleteAccountButton() {
  const t = useTranslations("me.deleteAccount");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!window.confirm(t("confirm1"))) return;
          if (!window.confirm(t("confirm2"))) return;
          setPending(true);
          setError(null);
          const result = await deleteAccount();
          if (result?.error) {
            setPending(false);
            setError(result.error);
            return;
          }
          router.push("/login");
          router.refresh();
        }}
        className="text-[11px] text-neutral-300 underline decoration-dotted transition hover:text-red-500 disabled:opacity-50 dark:text-neutral-600"
      >
        {pending ? t("deleting") : t("trigger")}
      </button>
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
