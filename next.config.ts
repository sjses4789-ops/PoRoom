import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  async rewrites() {
    // 꼬바(GGobar) 소개 사이트 — public/ggobar 의 정적 HTML을 /ggobar 주소로 보여 준다.
    return {
      beforeFiles: [{ source: "/ggobar", destination: "/ggobar/index.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      {
        // 서비스 워커는 브라우저/CDN이 오래 캐시하면 업데이트가 안 퍼지므로 항상 재검증한다.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
