// PoRoom 서비스 워커 — 일부러 최소한만 한다.
// 이 앱은 로그인 쿠키·서버 렌더링·실시간 연결에 의존하므로 페이지나 API
// 응답을 캐시하면 오래된 화면/다른 사람의 화면이 보일 위험이 있다. 그래서
// 캐시하는 건 "오프라인일 때 보여줄 안내 페이지" 하나뿐이고, 평소에는 모든
// 요청을 그냥 네트워크로 보낸다.
const CACHE = "poroom-offline-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // 페이지 이동(navigate) 요청이 네트워크 오류로 실패했을 때만 안내 페이지로 대체한다.
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});
