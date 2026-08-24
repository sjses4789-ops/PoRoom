"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function TierBadgeButton({ isPremium }: { isPremium: boolean }) {
  const t = useTranslations("layout.tier");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide transition ${
          isPremium
            ? "bg-gradient-to-r from-pink-200 to-rose-200 text-white shadow-sm hover:from-pink-300 hover:to-rose-300"
            : "bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        }`}
      >
        {isPremium ? t("premium") : t("basic")}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-10 bg-neutral-900/20" />
          <div className="fixed left-1/2 top-1/2 z-20 w-[min(22rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-md border border-neutral-300 bg-white p-5 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between">
              <span
                className={`rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide ${
                  isPremium
                    ? "bg-gradient-to-r from-pink-200 to-rose-200 text-white"
                    : "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                }`}
              >
                {isPremium ? t("premium") : t("basic")}
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>
            {isPremium ? (
              <p className="text-sm text-neutral-600 dark:text-neutral-300">{t("premiumDesc")}</p>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-neutral-600 dark:text-neutral-300">{t("basicDesc")}</p>
                <ul className="flex flex-col gap-1 text-[13px] text-neutral-500 dark:text-neutral-400">
                  <li>· {t("perkAdFree")}</li>
                  <li>· {t("perkPet")}</li>
                </ul>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {t("price", { amount: "5,900" })}
                </p>
                <p className="text-[12px] text-neutral-400">{t("comingSoon")}</p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
