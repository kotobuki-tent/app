// 最小 Service Worker（alcohol.html / forklift.html 専用）
// 目的：PWAインストール要件（fetchハンドラを持つSW）を満たすことだけ。
// キャッシュは一切しない＝ネットワーク透過。ページは常に最新で配信される。
// ※ root の sw.js とは別物。各ページが scope を自分のURLに限定して登録するので衝突しない。
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { /* respondWithしない＝既定のネットワーク取得 */ });
