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

/* ---- yerel eklentiler ----
   Web'de çağrılar sessizce hiçbir şey yapmaz; böylece kodun geri kalanı
   "iPhone'da mıyız" diye sormadan çağırabilir. */
/* Eklenti çağrıları söz (promise) döndürür; reddedilirse sessizce yutulur. */
const quiet = p => { if (p && p.catch) p.catch(() => {}); };
const nativePlugin = name => {
  if (!IS_NATIVE) return null;
  const C = window.Capacitor;
  return (C.Plugins && C.Plugins[name]) || C.registerPlugin(name);
};

/* Dokunsal geri bildirim. kind: "light" (dokunuş), "success" (başarı), "warning" (uyarı). */
function haptic(kind){
  const H = nativePlugin("Haptics");
  if (!H) return;
  try {
    if (kind === "success") quiet(H.notification({ type: "SUCCESS" }));
    else if (kind === "warning") quiet(H.notification({ type: "WARNING" }));
    else quiet(H.impact({ style: "LIGHT" }));
  } catch(e){}
}

/* Barkod tarayıcı (@capacitor/barcode-scanner). Projede paketleyici olmadığı için eklenti
   doğrudan çağrılır; eklentinin JS sarmalayıcısındaki varsayılan değerler devreye girmez,
   yerel taraf ise bu alanların hepsini zorunlu sayar. Bu yüzden hepsi burada elle verilir.
   hint 17: bütün biçimler (EAN_13 verilirse EAN-8 kaçar; Apple Vision UPC-A ile EAN-13'ü
   zaten ayırmaz). Sonucu doğrulama barcode.js'te (validGtin).
   Sonuç: web'de null, yoksa { status:"ok", code } | { status:"cancel" | "denied" | "error" }.
   Hata kodları eklentinin iOS kaynağındandır (OSBarcodeError): 0006 vazgeçildi, 0007 kamera
   izni yok; tanınmayan her hata "error" sayılır. */
const SCAN_ERRORS = { "OS-PLUG-BARC-0006": "cancel", "OS-PLUG-BARC-0007": "denied" };
async function nativeScan(opts){
  const B = nativePlugin("CapacitorBarcodeScanner");
  if (!B) return null;
  const o = opts || {};
  try {
    const r = await B.scanBarcode({
      hint: 17, scanButton: false, scanText: " ", scanInstructions: o.instructions || " ",
      cameraDirection: 1, scanOrientation: 1,
      cancelButtonAccessibilityLabel: o.cancelLabel,
      torchButtonOnAccessibilityLabel: o.torchOnLabel,
      torchButtonOffAccessibilityLabel: o.torchOffLabel
    });
    const code = r && typeof r.ScanResult === "string" ? r.ScanResult.trim() : "";
    return code ? { status: "ok", code } : { status: "error" };
  } catch(e){
    return { status: SCAN_ERRORS[e && e.code] || "error" };
  }
}

/* Ağdan JSON okur: { status, data } döner (HTTP hataları da dönen sonuçtur, atılmaz);
   bağlantı kurulamazsa ya da süre dolarsa hata atar, süre dolması name:"TimeoutError".
   Önce çekirdekte hazır gelen CapacitorHttp kullanılır: tarayıcının fetch'i User-Agent
   başlığını değiştiremez, Open Food Facts ise uygulamanın kendini tanıtmasını ister.
   CapacitorHttp yoksa ya da yerelde kayıtlı değilse (UNIMPLEMENTED) fetch kullanılır;
   fetch'te yalnızca Accept gider (başka başlık CORS ön isteği doğurur), çerez ve yönlendiren yok. */
function nativeTimeout(){
  const e = new Error("timeout"); e.name = "TimeoutError"; return e;
}
async function nativeGet(url, headers, timeoutMs){
  const H = nativePlugin("CapacitorHttp");
  if (H && typeof H.request === "function"){
    let timer;
    try {
      const r = await Promise.race([
        H.request({ url, method: "GET", headers: headers || {}, connectTimeout: timeoutMs, readTimeout: timeoutMs }),
        new Promise((_, rej) => { timer = setTimeout(() => rej(nativeTimeout()), timeoutMs); })
      ]);
      let data = r.data;
      if (typeof data === "string"){ try { data = JSON.parse(data); } catch(e){ data = null; } }
      return { status: r.status, data };
    } catch(e){
      if (!(e && (e.code === "UNIMPLEMENTED" || /not implemented/i.test(e.message || "")))) throw e;
    } finally { clearTimeout(timer); }
  }
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" }, signal: ctl.signal,
      credentials: "omit", referrerPolicy: "no-referrer" });
    let data = null;
    try { data = await r.json(); } catch(e){}
    return { status: r.status, data };
  } catch(e){
    throw e && e.name === "AbortError" ? nativeTimeout() : e;
  } finally { clearTimeout(timer); }
}

/* Durum çubuğu (saat, pil) temaya uyar: koyu zeminde açık yazı, açık zeminde koyu yazı.
   Capacitor'da "DARK" stili koyu zemin içindir, yani yazıyı açık yapar. */
function nativeStatusBar(dark){
  const S = nativePlugin("StatusBar");
  if (!S) return;
  try { quiet(S.setStyle({ style: dark ? "DARK" : "LIGHT" })); } catch(e){}
}
