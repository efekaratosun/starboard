"use strict";

/* Çevrimdışı önbellek yalnızca web sitesinde: iOS uygulamasında dosyalar zaten
   uygulamanın içinde gelir (IS_NATIVE, native.js). */
if ("serviceWorker" in navigator && location.protocol !== "file:" && !IS_NATIVE) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
}
