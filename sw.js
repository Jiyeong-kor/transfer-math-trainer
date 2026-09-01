const CACHE = "transfer-math-trainer-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./enhancements.css",
  "./quiz-ux.css",
  "./app.js",
  "./quiz-ux.js",
  "./adaptive-training.js",
  "./app-update.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./core/storage.js",
  "./core/mastery.js",
  "./core/scheduler.js",
  "./core/session.js",
  "./content/curriculum.js",
  "./content/concepts.js",
  "./content/lessons.js",
  "./content/lessons-foundation-engineering.js",
  "./content/lessons-differential.js",
  "./content/lessons-integral-calculus2.js",
  "./content/lessons-linear.js",
  "./content/problems.js",
  "./content/problems-foundation-engineering.js",
  "./content/problems-differential.js",
  "./content/problems-integral-calculus2.js",
  "./content/problems-linear.js",
  "./content/problems-adaptive.js",
  "./content/learner-seed.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});