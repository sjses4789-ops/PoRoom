import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PoRoom",
  description: "화상회의 없이 함께 집중하는 온라인 뽀모도로 작업실",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* 애드센스 사이트 소유권 확인은 JS를 실행하지 않고 원본 HTML의
          <head> 안에서 <script> 태그를 그대로 찾는다 — next/script의
          afterInteractive 전략은 그 태그를 하이드레이션 이후에야 DOM에
          꽂아 넣어서 원본 HTML에는 preload 힌트만 남고 실제 <script>는
          없었다. 그래서 여기 <head>에 순수 HTML 태그로 직접 박아 넣는다. */}
      {ADSENSE_CLIENT_ID && (
        <head>
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        </head>
      )}
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {`try {
            if (localStorage.getItem('poroom-theme') === 'dark') {
              document.documentElement.classList.add('dark');
            }
          } catch (e) {}`}
        </Script>
        {children}
      </body>
    </html>
  );
}
