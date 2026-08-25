"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { GoogleSignInButton } from "./google-sign-in-button";

export function AuthLanding({ banned = false }: { banned?: boolean }) {
  const t = useTranslations("login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-white">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/poroom-logo.png"
          alt="PoRoom"
          width={1254}
          height={485}
          priority
          className="h-auto w-64"
        />
        <p className="text-sm text-neutral-500">{t("tagline")}</p>
      </div>
      {banned && (
        <p className="max-w-xs text-center text-sm text-red-500">{t("bannedNotice")}</p>
      )}
      <GoogleSignInButton label={t("google")} />
    </main>
  );
}
