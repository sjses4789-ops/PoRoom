import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/qa-x7f3"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
