"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// 방문자 수·방문 경로(유입 채널) 분석용 Google Analytics 4 연동. gtag.js
// 자체는 최초 로드 시 한 번만 페이지뷰를 보내므로, 이 앱처럼 페이지
// 이동이 클라이언트 라우팅으로 일어나는 경우 경로가 바뀔 때마다 별도로
// config를 다시 호출해줘야 각 탭(방/피드/랭킹 등) 이동이 개별 페이지뷰로
// 잡힌다.
export function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !window.gtag) return;
    window.gtag("config", GA_MEASUREMENT_ID, { page_path: pathname });
  }, [pathname]);

  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  );
}
