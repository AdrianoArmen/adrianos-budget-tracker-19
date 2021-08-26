const VERSION = "v_1";
const CACHE_NAME = "static-cache" + VERSION;
const DATA_CACHE_NAME = "data-cache" + VERSION;

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/styles.css",
  "/manifest.json",
  "/index.js",
  "/icons/icon-192x192.jpg",
  "/icons/icon-512x512.jpg",
  "/images/icon-72x72.png",
  "/images/icon-96x96.png",
  "/images/icon-128x128.png",
  "/images/icon-144x144.png",
  "/images/icon-152x152.png",
  "/images/icon-192x192.png",
  "/images/icon-384x384.png",
  "/images/icon-512x512.png",
];

// install
self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Files successfully pre-cached");
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

// activate
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Wiping out cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// fetch
self.addEventListener("fetch", function (e) {
  if (e.request.url.includes("/api/")) {
    e.respondWith(
      caches
        .open(DATA_CACHE_NAME)
        .then((cache) => {
          return fetch(e.request)
            .then((response) => {
              if (response.status === 200) {
                cache.put(e.request.url, response.clone());
                // successful request will be cloned and stored in cache
              }

              return response;
            })
            .catch((err) => {
              return cache.match(e.request);
              //   when requests fail attempt to fetch from cache
            });
        })
        .catch((err) => console.log(err))
    );

    return;
  }

  //   static files will be providaded if api request is not found
  e.respondWith(
    caches.match(e.request).then(function (response) {
      return response || fetch(e.request);
    })
  );
});
