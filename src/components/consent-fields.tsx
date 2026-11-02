"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

// 가입 연령 확인(생년월일)과 약관 동의 입력 — 서버(consent-core)가 만 나이를 계산해 만 14세 미만이면 가입을 거절한다.
export function ConsentFields() {
  const t = useTranslations("onboarding");
  // 오늘 날짜(로컬)를 입력 최대값으로 — 미래 날짜는 고를 수 없게 한다.
  const today = new Date();
  const max = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <>
      <div className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold text-neutral-500">{t("birthLabel")}</h2>
        <input
          type="date"
          name="birthDate"
          required
          min="1900-01-01"
          max={max}
          defaultValue=""
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:text-white"
        />
        <p className="text-[11px] text-neutral-400">{t("birthHint")}</p>
      </div>

      <label className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-300">
        <input type="checkbox" name="agreeTerms" required className="mt-0.5 shrink-0 accent-neutral-900" />
        <span>
          {t("agreePrefix")}{" "}
          <Link href="/terms" target="_blank" className="underline">
            {t("termsLink")}
          </Link>
          ,{" "}
          <Link href="/privacy" target="_blank" className="underline">
            {t("privacyLink")}
          </Link>
        </span>
      </label>
    </>
  );
}
