import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const HOME_LANGUAGES = {
  ko: `${SITE_URL}/`,
  en: `${SITE_URL}/en`,
  ja: `${SITE_URL}/ja`,
  zh: `${SITE_URL}/zh`,
  "x-default": `${SITE_URL}/`,
};

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
  ];
}
