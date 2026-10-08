import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  GUIDES,
  GUIDE_PUBLISHED_AT,
  GUIDE_UPDATED_AT,
  getGuide,
  guideReadMinutes,
} from "@/content/guides";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `${SITE_URL}/guide/${guide.slug}` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url: `${SITE_URL}/guide/${guide.slug}`,
      publishedTime: GUIDE_PUBLISHED_AT,
      modifiedTime: GUIDE_UPDATED_AT,
    },
  };
}

export default async function GuideArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const related = (guide.related ?? [])
    .map((s) => getGuide(s))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    inLanguage: "ko",
    datePublished: GUIDE_PUBLISHED_AT,
    dateModified: GUIDE_UPDATED_AT,
    mainEntityOfPage: `${SITE_URL}/guide/${guide.slug}`,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <nav aria-label="경로" className="text-xs text-neutral-400">
        <Link href="/guide" className="hover:underline">
          작가 가이드
        </Link>
        <span aria-hidden> › </span>
        <span>{guide.category}</span>
      </nav>

      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold leading-snug tracking-tight">{guide.title}</h1>
        <p className="text-xs text-neutral-400">
          {guide.category} · 읽는 시간 약 {guideReadMinutes(guide)}분 · 업데이트 {GUIDE_UPDATED_AT}
        </p>
      </header>

      <aside className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <p className="mb-2 text-xs font-semibold text-neutral-500">먼저 보기</p>
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
          <h2 className="text-base font-semibold">이어서 읽어 보세요</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {related.map((g) => (
              <li key={g.slug}>
                <Link href={`/guide/${g.slug}`} className="text-neutral-700 underline hover:text-neutral-900 dark:text-neutral-300">
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg bg-[#faf3f3] p-5 dark:bg-[#231a1a]">
        <h2 className="text-base font-semibold">함께 집중하며 써 보세요</h2>
        <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          포룸은 웹소설·웹툰 작가가 카메라 없이 같은 방에서 뽀모도로 타이머를 함께 돌리며 작업하는 온라인
          작업실입니다. 이 글의 방법을 방에서 바로 적용해 볼 수 있어요.
        </p>
        <Link
          href="/main"
          className="mt-3 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          포룸 둘러보기
        </Link>
      </section>
    </article>
  );
}
