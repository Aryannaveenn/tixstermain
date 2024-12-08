const CACHE_NAME = "ticket-booking-cache-v1";
const urlsToCache = [
  //these are the files that the serviceworker will chache
  "/public/css/index.css",
  "/public/css/login.css",
  "/public/css/signup.css",
  "/public/css/index.css",
  "/views/index.ejs",
  '/public/css/contact.css',
  '/public/css/about.css'
];

//first install event
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      //open cache
      console.log("Service Worker: Cache opened successfully"); //making sure we know that it works thru console logs
      return Promise.all(
        urlsToCache.map((url) => {
          //adds these urls to cache
          console.log(`Caching: ${url}`);
          return fetch(url).then((response) => {
            if (
              response.ok &&
              (response.url.startsWith("http://"))
            ) {
              cache.put(url, response.clone()); //cache the response for static resources
            }
          });
        })
      );
    })
  );
});

//second activate
self.addEventListener("activate", (event) => {
  console.log("Service Worker: activating events");
  const cacheWhitelist = [CACHE_NAME]; //caches that should be kept to be used
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log(`Service Worker: Deleting outdated cache ${cacheName}`);
            return caches.delete(cacheName); //delete old caches so wrong info won't be dispkayed
          }
        })
      );
    })
  );
});

//last fetch event
self.addEventListener("fetch", (event) => {
  console.log(`Service Worker: Fetching request for ${event.request.url}`);
  if (
    event.request.url.includes("/events") ||
    event.request.url.includes("/seats")
  ) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          return networkResponse;
        }
        return networkResponse;
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log(
          `Service Worker: Returning cached response for ${event.request.url}`
        );
        return cachedResponse;
      }

      console.log(
        `Service Worker: Fetching from network for ${event.request.url}`
      );
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          if (
            networkResponse.url.startsWith("http://") ||
            networkResponse.url.startsWith("https://")
          ) {
            return caches.open(CACHE_NAME).then((cache) => {
              console.log(
                `Service Worker: Caching new resource ${event.request.url}`
              );
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          }
        }
        return networkResponse;
      });
    })
  );
});
