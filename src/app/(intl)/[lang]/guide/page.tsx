import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDE_CATEGORIES, GUIDE_UPDATED_AT } from "@/content/guides";
import {
  CATEGORY_TEXT,
  GUIDE_LANGS,
  GUIDE_UI,
  getLocalizedGuides,
  guideReadMinutesLocalized,
  isGuideLang,
} from "@/content/guides-i18n";
import { SITE_URL } from "@/lib/site";

type Params = { lang: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return GUIDE_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isGuideLang(lang)) return {};
  const ui = GUIDE_UI[lang];
  return {
    title: ui.guideTitle,
    description: ui.guideDescription,
    alternates: {
      canonical: `${SITE_URL}/${lang}/guide`,
      languages: {
        ko: `${SITE_URL}/guide`,
        en: `${SITE_URL}/en/guide`,
        ja: `${SITE_URL}/ja/guide`,
        "x-default": `${SITE_URL}/guide`,
      },
    },
    openGraph: {
      type: "website",
      title: ui.guideTitle,
      description: ui.guideDescription,
      url: `${SITE_URL}/${lang}/guide`,
      locale: ui.ogLocale,
    },
  };
}

export default async function LocalizedGuideIndexPage({ params }: { params: Promise<Params> }) {
  const { lang } = await params;
  if (!isGuideLang(lang)) notFound();
  const ui = GUIDE_UI[lang];
  const guides = getLocalizedGuides(lang);

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{ui.guideTitle}</h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">{ui.guideIntro}</p>
        <p className="text-xs text-neutral-400">{ui.totalLine(guides.length, GUIDE_UPDATED_AT)}</p>
      </header>

      {GUIDE_CATEGORIES.map((category) => {
        const items = guides.filter((g) => g.category === category.name);
        if (items.length === 0) return null;
        const text = CATEGORY_TEXT[lang][category.name];
        return (
          <section key={category.name} className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{text.name}</h2>
              <p className="mt-1 text-sm text-neutral-500">{text.description}</p>
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/${lang}/guide/${guide.slug}`}
                    className="flex h-full flex-col gap-2 rounded-lg border border-neutral-200 p-4 transition hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500"
                  >
                    <h3 className="text-[15px] font-medium leading-snug">{guide.title}</h3>
                    <p className="text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">{guide.description}</p>
                    <span className="mt-auto text-xs text-neutral-400">{ui.readTime(guideReadMinutesLocalized(lang, guide))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <p className="text-sm text-neutral-500">
        {ui.koreanOnlyNote}{" "}
        <Link href="/guide" className="underline hover:text-neutral-900 dark:hover:text-white">
          {ui.moreKoreanLink}
        </Link>
      </p>
    </div>
  );
}
