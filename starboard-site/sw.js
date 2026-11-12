/* Starboard: çevrimdışı çalışma. Sayfa önce ağdan denenir (güncellemeler hemen gelsin),
   ağ yoksa önbellekten açılır. */
const CACHE = "starboard-202611111733";
const SHELL = [
  "./", "index.html", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png",
  "css/tokens.css", "css/components.css", "css/app.css",
  "js/lang/en.js", "js/lang/en-food.js", "js/lang/en-workout.js", "js/i18n.js", "js/units.js", "js/storage.js", "js/program.js", "js/nutrition.js", "js/foods-intl.js", "js/evaluate.js", "js/goals.js", "js/app.js", "js/onboarding.js",
  "js/router.js", "js/today.js", "js/meals.js", "js/shopping.js", "js/workout.js", "js/quick.js", "js/ui.js", "js/vendor/motion.js", "js/exercise-anim.js", "js/workout-mode.js",
  "js/widgets.js", "js/charts.js", "js/about.js", "js/settings.js", "js/calendar.js", "js/whatsnew.js", "js/main.js", "js/register-sw.js"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const fonts = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== location.origin && !fonts) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (fonts) {
      const hit = await cache.match(req);
      if (hit) return hit;
    }
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === "navigate") { const idx = await cache.match("index.html"); if (idx) return idx; }
      throw err;
    }
  })());
});