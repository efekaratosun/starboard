"use strict";

/* ---------------- yerel (iOS) kabuk ----------------
   Uygulama Capacitor ile iPhone'da çalışırken window.Capacitor vardır ve
   isNativePlatform() true döner; web sitesinde bu dosya hiçbir şey yapmaz.

   Kalıcı depo: iOS, yer açmak için WebView'in localStorage'ını silebilir. Bu yüzden
   kayıt uygulamanın Library klasöründe bir dosyaya yazılır (kullanıcıya görünmez,
   iCloud yedeğine girer, sistem silmez). storage.js önce window.storage'a bakar;
   orada kayıt yoksa localStorage'dan okur ve sonraki kayıtta ikisine birden yazar.
   Böylece eski bir WebView kaydı ilk açılışta kendiliğinden dosyaya taşınır. */
const IS_NATIVE = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === "function"
  && window.Capacitor.isNativePlatform());

if (IS_NATIVE && !window.storage){
  const C = window.Capacitor;
  const FS = (C.Plugins && C.Plugins.Filesystem) || C.registerPlugin("Filesystem");
  const file = k => ({ path: "starboard/" + k + ".json", directory: "LIBRARY", encoding: "utf8" });
  window.storage = {
    async get(k){
      try { const r = await FS.readFile(file(k)); return { value: r.data }; }
      catch(e){ return null; }            /* dosya yok: ilk açılış */
    },
    async set(k, v){ await FS.writeFile({ ...file(k), data: v, recursive: true }); },
    async delete(k){ try { await FS.deleteFile(file(k)); } catch(e){} }
  };
}
