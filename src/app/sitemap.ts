import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { GUIDES, GUIDE_UPDATED_AT } from "@/content/guides";
import { GUIDE_LANGS, getLocalizedGuides, translatedLangs } from "@/content/guides-i18n";

const HOME_LANGUAGES = {
  ko: `${SITE_URL}/`,
  en: `${SITE_URL}/en`,
  ja: `${SITE_URL}/ja`,
  zh: `${SITE_URL}/zh`,
  "x-default": `${SITE_URL}/`,
};

// 한국어 원문과 번역본을 서로 연결하는 hreflang 주소들.
function guideLanguages(slug: string): Record<string, string> {
  const languages: Record<string, string> = { ko: `${SITE_URL}/guide/${slug}` };
  for (const l of translatedLangs(slug)) languages[l] = `${SITE_URL}/${l}/guide/${slug}`;
  return languages;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages: HOME_LANGUAGES },
    },
    {
      url: `${SITE_URL}/en`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages: HOME_LANGUAGES },
    },
    {
      url: `${SITE_URL}/ja`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages: HOME_LANGUAGES },
    },
    {
      url: `${SITE_URL}/zh`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages: HOME_LANGUAGES },
    },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/guide`, lastModified: new Date(GUIDE_UPDATED_AT), changeFrequency: "weekly", priority: 0.8 },
    ...GUIDES.map((g) => ({
      url: `${SITE_URL}/guide/${g.slug}`,
      lastModified: new Date(GUIDE_UPDATED_AT),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      ...(translatedLangs(g.slug).length > 0 ? { alternates: { languages: guideLanguages(g.slug) } } : {}),
    })),
    // 영어·일본어로 번역된 공개 정보 페이지(언어 간 hreflang 연결 포함)
    ...GUIDE_LANGS.flatMap((lang) => [
      {
        url: `${SITE_URL}/${lang}/guide`,
        lastModified: new Date(GUIDE_UPDATED_AT),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        alternates: { languages: { ko: `${SITE_URL}/guide`, en: `${SITE_URL}/en/guide`, ja: `${SITE_URL}/ja/guide` } },
      },
      {
        url: `${SITE_URL}/${lang}/about`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
        alternates: { languages: { ko: `${SITE_URL}/about`, en: `${SITE_URL}/en/about`, ja: `${SITE_URL}/ja/about` } },
      },
      {
        url: `${SITE_URL}/${lang}/faq`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
        alternates: { languages: { ko: `${SITE_URL}/faq`, en: `${SITE_URL}/en/faq`, ja: `${SITE_URL}/ja/faq` } },
      },
      ...getLocalizedGuides(lang).map((g) => ({
        url: `${SITE_URL}/${lang}/guide/${g.slug}`,
        lastModified: new Date(GUIDE_UPDATED_AT),
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: { languages: guideLanguages(g.slug) },
      })),
    ]),
  ];
}
