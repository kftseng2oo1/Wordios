// WordiOS v2 Service Worker
// 更新 App 時改這個版本號
const VERSION = "wordios-v2.2.0";
const CORE = `${VERSION}-core`;
const LIBS = "wordios-libs";   // CDN 元件網址都帶版本號，內容不會變，可長期快取

const CORE_ASSETS = [
  "./", "./index.html", "./manifest.json", "./icon.svg",
  "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png",
];
const CDN_HOSTS = ["cdn.jsdelivr.net", "cdn.sheetjs.com"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CORE).then((c) => c.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CORE && k !== LIBS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // 1) 頁面：網路優先，離線才用快取 → 一更新就拿到新版
  if (req.mode === "navigate" || (url.origin === location.origin && url.pathname.endsWith(".html"))) {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CORE).then((c) => c.put("./index.html", copy)); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // 2) CDN 轉檔元件：快取優先（帶版本號的網址不會變）
  if (CDN_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(LIBS).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // 3) 其他同源檔案：快取優先，背景更新
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then((hit) => {
        const net = fetch(req).then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(CORE).then((c) => c.put(req, copy)); }
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
