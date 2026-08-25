import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { GoogleAnalytics } from "@/components/google-analytics";
import { DisableRightClickAndDrag } from "@/components/disable-right-click-drag";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_DESCRIPTION = "화상회의 없이 함께 집중하는 온라인 뽀모도로 작업실";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "포룸", "PoRoom", "웹소설", "웹소설 작가", "뽀모도로", "뽀모도로 타이머",
    "온라인 작업실", "온라인 스터디룸", "글쓰기 챌린지", "집필 챌린지",
    "글자수 기록", "글자수 랭킹", "함께 집중", "바디 더블링", "웹소설 연재",
    "글쓰기 모임", "집필 모임", "온라인 집필실", "타이핑 연습",
  ],
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/poroom-room-preview.png",
        width: 1600,
        height: 1000,
        alt: "PoRoom 방 화면 미리보기",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: ["/poroom-room-preview.png"],
  },
};

// 검색결과에 로고/사이트명이 제대로 뜨도록 하는 구조화 데이터(JSON-LD).
// 화면에는 전혀 보이지 않고 검색엔진만 읽는다 — SEO 표준 관행(schema.org)
// 이라 페이지에 "태그를 넣었다"는 티가 나지 않는다.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: "포룸",
      url: SITE_URL,
      logo: `${SITE_URL}/poroom-icon.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "ko",
    },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {/* 애드센스 사이트 소유권 확인은 JS를 실행하지 않고 원본 HTML의
            <head> 안에서 <script> 태그를 그대로 찾는다 — next/script의
            afterInteractive 전략은 그 태그를 하이드레이션 이후에야 DOM에
            꽂아 넣어서 원본 HTML에는 preload 힌트만 남고 실제 <script>는
            없었다. 그래서 여기 <head>에 순수 HTML 태그로 직접 박아 넣는다. */}
        {ADSENSE_CLIENT_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="min-h-full flex flex-col">
        <DisableRightClickAndDrag />
        <GoogleAnalytics />
        <Script id="theme-init" strategy="beforeInteractive">
          {`try {
            if (localStorage.getItem('poroom-theme') === 'dark') {
              document.documentElement.classList.add('dark');
            }
          } catch (e) {}`}
        </Script>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
