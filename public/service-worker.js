// サービスワーカー：アプリの起動を高速化し、オフライン対応の準備をします
const CACHE_NAME = 'kana-master-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// インストール時に基本ファイルをキャッシュする
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// ネットワークリクエストを処理する
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
