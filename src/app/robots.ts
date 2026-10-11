import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // 네이버(Yeti)·구글·빙 크롤러에게는 수집 가능 범위를 명시적으로 알린다.
    rules: [
      { userAgent: ["Yeti", "Googlebot", "Bingbot"], allow: "/", disallow: ["/api/", "/admin", "/qa-x7f3"] },
      { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/qa-x7f3"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
