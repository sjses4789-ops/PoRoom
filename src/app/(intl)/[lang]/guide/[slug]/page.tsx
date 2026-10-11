import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDE_PUBLISHED_AT, GUIDE_UPDATED_AT } from "@/content/guides";
import {
  CATEGORY_TEXT,
  GUIDE_LANGS,
  GUIDE_UI,
  getLocalizedGuide,
  getLocalizedGuides,
  guideReadMinutesLocalized,
  isGuideLang,
  translatedLangs,
} from "@/content/guides-i18n";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type Params = { lang: string; slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return GUIDE_LANGS.flatMap((lang) => getLocalizedGuides(lang).map((g) => ({ lang, slug: g.slug })));
}

function languagesFor(slug: string) {
  const languages: Record<string, string> = {
    ko: `${SITE_URL}/guide/${slug}`,
    "x-default": `${SITE_URL}/guide/${slug}`,
  };
  for (const l of translatedLangs(slug)) languages[l] = `${SITE_URL}/${l}/guide/${slug}`;
  return languages;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isGuideLang(lang)) return {};
  const guide = getLocalizedGuide(lang, slug);
  if (!guide) return {};
  const url = `${SITE_URL}/${lang}/guide/${slug}`;
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: url, languages: languagesFor(slug) },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url,
      locale: GUIDE_UI[lang].ogLocale,
      publishedTime: GUIDE_PUBLISHED_AT,
      modifiedTime: GUIDE_UPDATED_AT,
    },
  };
}

export default async function LocalizedGuideArticlePage({ params }: { params: Promise<Params> }) {
  const { lang, slug } = await params;
  if (!isGuideLang(lang)) notFound();
  const guide = getLocalizedGuide(lang, slug);
  if (!guide) notFound();
  const ui = GUIDE_UI[lang];
  const category = CATEGORY_TEXT[lang][guide.category].name;
  const minutes = guideReadMinutesLocalized(lang, guide);

  const related = (guide.related ?? [])
    .map((s) => getLocalizedGuide(lang, s))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    inLanguage: lang,
    datePublished: GUIDE_PUBLISHED_AT,
    dateModified: GUIDE_UPDATED_AT,
    mainEntityOfPage: `${SITE_URL}/${lang}/guide/${slug}`,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <nav aria-label={ui.breadcrumb} className="text-xs text-neutral-400">
        <Link href={`/${lang}/guide`} className="hover:underline">
          {ui.guideTitle}
        </Link>
        <span aria-hidden> › </span>
        <span>{category}</span>
      </nav>

      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold leading-snug tracking-tight">{guide.title}</h1>
        <p className="text-xs text-neutral-400">{ui.articleMeta(category, minutes, GUIDE_UPDATED_AT)}</p>
      </header>

      <aside className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <p className="mb-2 text-xs font-semibold text-neutral-500">{ui.summaryTitle}</p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
          {guide.summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </aside>

      <div className="flex flex-col gap-9">
        {guide.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{section.heading}</h2>
            {section.paragraphs?.map((p) => (
              <p key={p} className="text-[15px] leading-[1.85] text-neutral-700 dark:text-neutral-300">
                {p}
              </p>
            ))}
            {section.bullets && (
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-[1.8] text-neutral-700 dark:text-neutral-300">
                {section.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
            {section.steps && (
              <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[15px] leading-[1.8] text-neutral-700 dark:text-neutral-300">
                {section.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            )}
            {section.example && (
              <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
                <p className="mb-2 text-sm font-semibold">{section.example.title}</p>
                <ul className="flex flex-col gap-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {section.example.lines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>

      {related.length > 0 && (
        <section className="flex flex-col gap-3 border-t border-neutral-100 pt-8 dark:border-neutral-800">
          <h2 className="text-base font-semibold">{ui.relatedTitle}</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {related.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/${lang}/guide/${g.slug}`}
                  className="text-neutral-700 underline hover:text-neutral-900 dark:text-neutral-300"
                >
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg bg-[#faf3f3] p-5 dark:bg-[#231a1a]">
        <h2 className="text-base font-semibold">{ui.ctaTitle}</h2>
        <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{ui.ctaBody}</p>
        <Link
          href={`/${lang}`}
          className="mt-3 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          {ui.ctaButton}
        </Link>
      </section>
    </article>
  );
}
