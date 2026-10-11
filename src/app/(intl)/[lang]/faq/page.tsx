import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDE_LANGS, isGuideLang } from "@/content/guides-i18n";
import { FAQ } from "@/content/guides-i18n/pages";
import { SITE_URL } from "@/lib/site";

type Params = { lang: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return GUIDE_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isGuideLang(lang)) return {};
  const t = FAQ[lang];
  return {
    title: t.title,
    description: t.description,
    alternates: {
      canonical: `${SITE_URL}/${lang}/faq`,
      languages: {
        ko: `${SITE_URL}/faq`,
        en: `${SITE_URL}/en/faq`,
        ja: `${SITE_URL}/ja/faq`,
        "x-default": `${SITE_URL}/faq`,
      },
    },
  };
}

export default async function LocalizedFaqPage({ params }: { params: Promise<Params> }) {
  const { lang } = await params;
  if (!isGuideLang(lang)) notFound();
  const t = FAQ[lang];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang,
    mainEntity: t.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-sm text-neutral-500">
          {t.lead}
          <Link href={`/${lang}/about`} className="underline">
            {t.leadAbout}
          </Link>
          {t.leadOr}
          <a href="mailto:sjses4789@gmail.com" className="underline">
            sjses4789@gmail.com
          </a>
          {t.leadAfter}
        </p>
      </header>
      <dl className="flex flex-col gap-6">
        {t.items.map((item) => (
          <div key={item.q} className="flex flex-col gap-1.5">
            <dt className="text-[15px] font-semibold">{item.q}</dt>
            <dd className="text-[15px] leading-[1.8] text-neutral-700 dark:text-neutral-300">{item.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
