import { redirect } from "next/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { SiteFooter } from "./(main)/site-footer";

type Feature = { icon: string; title: string; desc: string };

// 로그인 안 한 방문자(구글 애드센스 크롤러, 구글 OAuth 브랜딩 심사 봇 포함)도
// 리다이렉트 없이 바로 이 페이지에서 콘텐츠(및 <head>의 애드센스 스크립트)를
// 받아야 하므로, 미들웨어가 "/"는 로그인 여부와 무관하게 그대로 통과시키고
// 이 페이지가 직접 분기한다. 로그인 페이지(/login)와 달리 이 홈페이지는
// 비로그인 방문자에게 서비스 소개 콘텐츠를 보여주는 역할을 한다 — 구글
// OAuth 심사에서 "홈페이지가 로그인 화면과 구분되지 않는다"는 지적을 받아,
// 로그인 버튼만 있던 화면에서 실제 소개 콘텐츠가 있는 홈페이지로 개편했다.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/main");
  }

  const t = await getTranslations("login");
  const features = t.raw("landing.features") as Feature[];
  const audience = t.raw("landing.audience") as string[];

  return (
    <main className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
        <Image src="/poroom-logo.png" alt="PoRoom" width={1254} height={485} priority className="h-auto w-28" />
        <GoogleSignInButton
          label={t("google")}
          className="hidden items-center gap-2 rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 sm:flex dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
        />
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-24">
        <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          {t("landing.eyebrow")}
        </span>
        <h1 className="whitespace-pre-line text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
          {t("landing.heroTitle")}
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-neutral-500 sm:text-base dark:text-neutral-400">
          {t("landing.heroBody")}
        </p>
        <div className="flex flex-col items-center gap-2">
          <GoogleSignInButton
            label={t("google")}
            className="flex items-center gap-3 rounded-md bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          />
          <p className="text-xs text-neutral-400 dark:text-neutral-500">{t("landing.ctaHint")}</p>
        </div>
      </section>

      <section className="border-t border-neutral-100 dark:border-neutral-800">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-center text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            {t("landing.featuresTitle")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-2 rounded-sm border border-neutral-200 p-5 dark:border-neutral-800"
              >
                <span className="text-2xl" aria-hidden>
                  {f.icon}
                </span>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{f.title}</h3>
                <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-100 dark:border-neutral-800">
        <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6">
          <h2 className="mb-6 text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            {t("landing.audienceTitle")}
          </h2>
          <ul className="flex flex-col gap-3">
            {audience.map((a) => (
              <li
                key={a}
                className="rounded-sm border border-neutral-200 px-4 py-3 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-300"
              >
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            {t("landing.footerCtaTitle")}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("landing.footerCtaBody")}</p>
          <GoogleSignInButton
            label={t("google")}
            className="flex items-center gap-3 rounded-md bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
