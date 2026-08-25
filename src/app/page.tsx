import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { UsageGuideSection } from "./usage-guide-section";

type Feature = { icon: string; title: string; desc: string };
type UsageItem = { icon: string; title: string; desc: string };
type FaqItem = { q: string; a: string };

// 로그인 안 한 방문자(구글 애드센스 크롤러, 구글 OAuth 브랜딩 심사 봇 포함)도
// 리다이렉트 없이 바로 이 페이지에서 콘텐츠(및 <head>의 애드센스 스크립트)를
// 받아야 하므로, 미들웨어가 "/"는 로그인 여부와 무관하게 그대로 통과시키고
// 이 페이지가 직접 분기한다. 로그인 페이지(/login)와 달리 이 홈페이지는
// 비로그인 방문자에게 서비스 소개 콘텐츠를 보여주는 역할을 한다 — 구글
// OAuth 심사에서 "홈페이지가 로그인 화면과 구분되지 않는다"는 지적을 받아,
// 로그인 버튼만 있던 화면에서 실제 소개 콘텐츠가 있는 홈페이지로 개편했다.
//
// 이 페이지는 의도적으로 다크 모드를 적용하지 않는다(dark: 유틸리티를
// 쓰지 않음) — 첫인상을 주는 랜딩페이지는 방문자의 시스템/사이트 테마
// 설정과 무관하게 항상 같은 밝은 톤으로 보여주기 위함.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/main");
  }

  const t = await getTranslations("login");
  const tFooter = await getTranslations("layout.footer");
  const features = t.raw("landing.features") as Feature[];
  const highlights = t.raw("landing.highlights") as Feature[];
  const audience = t.raw("landing.audience") as string[];
  const benefits = t.raw("landing.benefits") as string[];
  const usageGuide = t.raw("landing.usageGuide") as UsageItem[];
  const faq = t.raw("landing.faq") as FaqItem[];

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-end px-4 py-6 sm:px-6">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="shrink-0 whitespace-nowrap text-xs text-neutral-400">
            {tFooter("writingAppHint")}
          </span>
          <a
            href="https://pomowriter.oopy.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-md border border-stone-300 bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700 transition hover:bg-stone-200"
          >
            PomoWriter
          </a>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col items-start gap-6 text-left">
          <Image src="/poroom-logo.png" alt="PoRoom" width={1254} height={485} priority className="h-16 w-auto self-center sm:h-20" />
          <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-500">
            {t("landing.eyebrow")}
          </span>
          <h1 className="whitespace-pre-line text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            {t("landing.heroTitle")}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-neutral-500 sm:text-base">
            {t("landing.heroBody")}
          </p>
          <div className="flex flex-col items-start gap-2">
            <GoogleSignInButton
              label={t("google")}
              className="flex items-center gap-3 rounded-md bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
            />
            <p className="text-xs text-neutral-400">{t("landing.ctaHint")}</p>
          </div>
        </div>

        {/* 히어로 오른쪽 — 방 화면 스크린샷. public/poroom-room-preview.png
            (1600x1000px)를 교체하면 바로 반영된다. */}
        <div className="flex w-full flex-col items-center gap-3 lg:items-end">
          <Image
            src="/poroom-room-preview.png"
            alt={t("landing.heroImageAlt")}
            width={1600}
            height={1000}
            className="w-full max-w-2xl rounded-xl border border-neutral-200 shadow-sm"
          />
        </div>
      </section>

      <section className="border-t border-neutral-100">
        <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6">
          <h2 className="mb-6 text-xl font-semibold tracking-tight text-neutral-900">
            {t("landing.audienceTitle")}
          </h2>
          <ul className="flex flex-col gap-3">
            {audience.map((a) => (
              <li key={a} className="rounded-sm border border-neutral-200 px-4 py-3 text-sm text-neutral-600">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-neutral-100 bg-neutral-50">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-center text-xl font-semibold tracking-tight text-neutral-900">
            {t("landing.highlightsTitle")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((h) => (
              <div
                key={h.title}
                className="flex flex-col items-center gap-2 rounded-sm border border-neutral-200 bg-white p-5 text-center"
              >
                <span className="text-2xl" aria-hidden>
                  {h.icon}
                </span>
                <h3 className="text-sm font-semibold text-neutral-900">{h.title}</h3>
                <p className="text-xs leading-relaxed text-neutral-500">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-100">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-center text-xl font-semibold tracking-tight text-neutral-900">
            {t("landing.featuresTitle")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex flex-col items-center gap-2 rounded-sm border border-neutral-200 p-5 text-center"
              >
                <span className="text-2xl" aria-hidden>
                  {f.icon}
                </span>
                <h3 className="text-sm font-semibold text-neutral-900">{f.title}</h3>
                <p className="text-xs leading-relaxed text-neutral-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <UsageGuideSection title={t("landing.usageTitle")} items={usageGuide} />

      <section className="border-t border-neutral-100">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="mb-10 text-center text-xl font-semibold tracking-tight text-neutral-900">
            {t("landing.whyTitle")}
          </h2>

          <div className="flex flex-col gap-10">
            <div>
              <h3 className="mb-3 text-base font-semibold text-neutral-900">
                {t("landing.whyPomodoroTitle")}
              </h3>
              {t("landing.whyPomodoroBody")
                .split("\n\n")
                .map((para, i) => (
                  <p key={i} className="mb-3 text-sm leading-relaxed text-neutral-600 last:mb-0">
                    {para}
                  </p>
                ))}
            </div>

            <div>
              <h3 className="mb-3 text-base font-semibold text-neutral-900">
                {t("landing.whyRoomTitle")}
              </h3>
              {t("landing.whyRoomBody")
                .split("\n\n")
                .map((para, i) => (
                  <p key={i} className="mb-3 text-sm leading-relaxed text-neutral-600 last:mb-0">
                    {para}
                  </p>
                ))}
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">
                {t("landing.benefitsTitle")}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {benefits.map((b) => (
                  <li key={b} className="flex gap-2.5 text-sm leading-relaxed text-neutral-600">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900" aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-100 bg-neutral-50">
        <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-center text-xl font-semibold tracking-tight text-neutral-900">
            {t("landing.faqTitle")}
          </h2>
          <div className="flex flex-col divide-y divide-neutral-100 rounded-sm border border-neutral-200 bg-white">
            {faq.map((item) => (
              <details key={item.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-neutral-900 marker:content-none">
                  {item.q}
                  <span
                    aria-hidden
                    className="shrink-0 text-neutral-400 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-100">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
          <Image src="/poroom-logo.png" alt="PoRoom" width={1254} height={485} className="h-10 w-auto" />
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
            {t("landing.footerCtaTitle")}
          </h2>
          <p className="text-sm text-neutral-500">{t("landing.footerCtaBody")}</p>
          <GoogleSignInButton
            label={t("google")}
            className="flex items-center gap-3 rounded-md bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
          />
        </div>
      </section>

      <section className="border-t border-neutral-100 bg-neutral-50">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
          <Image src="/PomoWriter_logo.png" alt="PomoWriter" width={256} height={256} className="h-16 w-16 rounded-xl" />
          <h2 className="whitespace-pre-line text-xl font-semibold tracking-tight text-neutral-900">
            {t("landing.pomowriterCtaTitle")}
          </h2>
          <a
            href="https://pomowriter.oopy.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-md bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            {t("landing.pomowriterCtaButton")}
          </a>
        </div>
      </section>

      <footer className="mt-auto border-t border-neutral-100 px-4 py-8 text-xs text-neutral-400 sm:px-6 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-3">
          <p className="text-neutral-500">{tFooter("tagline")}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>MADE BY. GGOZIL</span>
            <span aria-hidden>·</span>
            <a
              href="https://pomowriter.oopy.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-600 hover:underline"
            >
              {tFooter("writingApp")}
            </a>
            <span aria-hidden>·</span>
            <Link href="/feedback" className="hover:text-neutral-600 hover:underline">
              {tFooter("feedback")}
            </Link>
            <span aria-hidden>·</span>
            <Link href="/privacy" className="hover:text-neutral-600 hover:underline">
              {tFooter("privacy")}
            </Link>
          </div>
          <p className="text-neutral-300">{tFooter("copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </main>
  );
}
