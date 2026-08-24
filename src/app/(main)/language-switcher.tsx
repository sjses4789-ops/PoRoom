"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";
import { LOCALES, LOCALE_LABEL } from "@/i18n/locales";

// 테마 토글과 나란히 두는 언어 선택기. URL은 바꾸지 않고 쿠키만 바꾼 뒤
// router.refresh()로 서버 컴포넌트들을 새 언어로 다시 렌더시킨다.
export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={locale}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          await setLocale(next);
          router.refresh();
        });
      }}
      aria-label="Language"
      className="shrink-0 rounded-full border border-neutral-200 bg-transparent px-2 py-0.5 text-[12px] font-medium text-neutral-500 outline-none transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l} className="text-neutral-900">
          {LOCALE_LABEL[l]}
        </option>
      ))}
    </select>
  );
}
