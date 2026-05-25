// ============================================================
// SEQUENCE LAB Service Worker
// ============================================================
// バージョンを上げるとキャッシュが全更新される。
// HTML/CSS/JS を変更したら必ずこの数字をインクリメントすること。
// 例: "v1" → "v2" → "v3" ...
// ============================================================
const CACHE_VERSION = 'v113';
const CACHE_NAME = `sequence-lab-${CACHE_VERSION}`;

// プリキャッシュ対象（アプリシェル）
const PRECACHE_URLS = [
  './portal.html',
  './daily.html',
  './overtime.html',
  './index.html',
  './project.html',
  './labor.html',
  './inventory.html',
  './vehicle.html',
  './register.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

// API は絶対にキャッシュしない（古いデータを見せないため）
const NO_CACHE_PATTERNS = [
  /script\.google\.com/,
  /googleusercontent\.com/,
  /drive\.google\.com/,
  /docs\.google\.com/
];

// ===== install: プリキャッシュ =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // 個別にaddして、1つ失敗しても全体が止まらないように
        return Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn('[SW] precache失敗:', url, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ===== activate: 古いキャッシュ削除 =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k.startsWith('sequence-lab-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ===== fetch: ルーティング =====
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // GET以外は素通し
  if (req.method !== 'GET') return;

  // API系は絶対キャッシュしない（ネットワーク直行、失敗は失敗のまま）
  if (NO_CACHE_PATTERNS.some((re) => re.test(url.href))) {
    return; // デフォルト挙動（ネットワーク取得）に任せる
  }

  // クロスオリジンは素通し
  if (url.origin !== self.location.origin) return;

// 同一オリジンの静的リソース：stale-while-revalidate
// キャッシュから即返してUIを速く表示、裏でネットワーク取得して次回用に更新
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res.ok && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, resClone).catch(() => {});
            });
          }
          return res;
        })
        .catch(() => cached || Response.error());
      // キャッシュがあれば即返す、無ければネットワーク待ち
      return cached || fetchPromise;
    })
  );
});

// ===== message: 手動更新トリガー（任意） =====
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
