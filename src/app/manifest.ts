import type { MetadataRoute } from "next";

// 웹앱 매니페스트 — 브라우저의 "앱 설치"와 구글 플레이 스토어용 TWA
// (Trusted Web Activity) 래퍼가 모두 이 파일을 읽는다. 이름/색/아이콘을
// 바꾸면 설치된 앱에도 반영된다(스토어용 앱 껍데기는 다시 빌드 필요 없음).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "PoRoom 포룸",
    short_name: "PoRoom",
    description: "화상회의 없이 함께 집중하는 온라인 뽀모도로 작업실",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["productivity", "education", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "포룸", url: "/main", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "도전", url: "/compete", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "랭킹", url: "/ranking", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
