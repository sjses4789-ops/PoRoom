import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDE_LANGS, isGuideLang } from "@/content/guides-i18n";
import { ABOUT } from "@/content/guides-i18n/pages";
import { SITE_URL } from "@/lib/site";

type Params = { lang: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return GUIDE_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isGuideLang(lang)) return {};
  const t = ABOUT[lang];
  return {
    title: t.title,
    description: t.description,
    alternates: {
      canonical: `${SITE_URL}/${lang}/about`,
      languages: {
        ko: `${SITE_URL}/about`,
        en: `${SITE_URL}/en/about`,
        ja: `${SITE_URL}/ja/about`,
        "x-default": `${SITE_URL}/about`,
      },
    },
  };
}

export default async function LocalizedAboutPage({ params }: { params: Promise<Params> }) {
  const { lang } = await params;
  if (!isGuideLang(lang)) notFound();
  const t = ABOUT[lang];
  const base = `/${lang}`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-[15px] leading-[1.85] text-neutral-700 dark:text-neutral-300">{t.intro}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t.whyTitle}</h2>
        {t.why.map((p) => (
          <p key={p} className="text-[15px] leading-[1.85] text-neutral-700 dark:text-neutral-300">
            {p}
          </p>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t.forWhoTitle}</h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-[1.8] text-neutral-700 dark:text-neutral-300">
          {t.forWho.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">{t.featuresTitle}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {t.features.map((f) => (
            <div key={f.title} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
              <h3 className="text-[15px] font-medium">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t.howTitle}</h2>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[15px] leading-[1.8] text-neutral-700 dark:text-neutral-300">
          {t.how.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="text-sm text-neutral-500">
          {t.moreLead}
          <Link href={`${base}/faq`} className="underline">
            {t.moreFaq}
          </Link>
          {t.moreAnd}
          <Link href={`${base}/guide`} className="underline">
            {t.moreGuide}
          </Link>
          {lang === "ja" ? "でご覧いただけます。" : "."}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t.contactTitle}</h2>
        <p className="text-[15px] leading-[1.85] text-neutral-700 dark:text-neutral-300">
          {t.contactBodyBefore}
          <a href="mailto:ggozzzzzil@gmail.com" className="underline">
            ggozzzzzil@gmail.com
          </a>
          {t.contactBodyAfter}
          {t.privacyLead}
          <Link href="/privacy" className="underline">
            {t.privacyLink}
          </Link>
          {lang === "ja" ? "でご確認いただけます。" : "."}
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/main"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          {t.enter}
        </Link>
      </div>
    </div>
  );
}
