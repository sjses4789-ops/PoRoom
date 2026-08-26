import type { Metadata, Viewport } from "next";
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
      // <head> 맨 앞의 동기 스크립트(아래)가 하이드레이션보다 먼저 이
      // 태그에 dark 클래스를 붙인다 — 서버가 그린 값(dark 없음)과 실제
      // DOM(dark 있음)이 달라, 이 표시가 없으면 리액트가 하이드레이션 중
      // 이 불일치를 "고치려다" 방금 붙은 dark 클래스를 지워버려 새로고침
      // 직후 다크모드가 라이트로 보이는 원인이 된다.
      suppressHydrationWarning
    >
      <head>
        {/* next/script의 beforeInteractive는 "하이드레이션 전에 실행됨"이
            아니라 "초기 HTML에 일찍 삽입·다운로드됨"만 보장한다(공식 문서:
            "does not block page hydration from occurring") — 실제 실행
            시점은 하이드레이션과 경쟁한다. (main) 처럼 클라이언트 JS가
            무거운 페이지에서는 이 스크립트가 하이드레이션보다 늦게 실행돼
            테마 토글은 dark인데 화면은 라이트로 남는 문제가 있었다(공개
            페이지처럼 가벼운 곳에서는 거의 안 보였음). 그래서 순수 HTML
            <script> 태그로 <head> 맨 앞에 직접 박아 넣는다 — 이건 브라우저가
            HTML을 파싱하는 동안 동기적으로 실행되므로 이후에 나오는 어떤
            번들 스크립트(하이드레이션 포함)보다도 먼저 끝난다. 애드센스
            소유권 확인 스크립트를 아래에 순수 태그로 넣은 것과 같은 이유. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
              if (localStorage.getItem('poroom-theme') === 'dark') {
                document.documentElement.classList.add('dark');
              }
            } catch (e) {}`,
          }}
        />
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
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
