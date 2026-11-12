"use strict";

/* ---------------- barkod okuma (iOS) ----------------
   Yalnızca iPhone uygulamasında: kamera barkodu okur, besin değerleri Open Food Facts'ten
   (açık veri, ODbL) gelir ve kullanıcının kendi yiyeceklerine kaydedilir. Web sitesinde
   düğme çizilmez (barcodeAvailable), böylece web'deki "hiçbir yere gönderilmez" sözü doğru kalır.

   Dışarı yalnızca barkod numarası gider: istekte gövde, çerez, profil ya da günlük verisi
   yoktur (teknik olarak sunucu IP adresini görür; privacy.html bunu yazar). Ürün görselleri
   indirilmez. Aynı barkod bir daha okutulursa ürün cihazdan bulunur, ağa çıkılmaz.

   Kayıt: state.customFoods["bc_" + barkod] = { n, p, c, f, lif, i, bc, a, br?, src?, por? }
   bc barkod, a arama takma adı (barkod ve marka; numarayla arama çalışsın), src:"off" verinin
   Open Food Facts'ten geldiği, por tek bir "porsiyon" ölçüsü. Open Food Facts'ten gelen hiçbir
   metin unitName'e yazılmaz (bazı ekranlar onu kaçışsız basar).

   Saf işlevler (validGtin, normGtin, offToFood) yalnızca sayı, durum ve temizlenmiş ad döndürür;
   metne çevirme ekran koduna aittir (README, "Hesap ve ekran"). */
const OFF_HOST = "https://world.openfoodfacts.org";
const OFF_FIELDS = "code,product_name,product_name_tr,product_name_en,brands,nutriments,serving_quantity,serving_quantity_unit,product_quantity_unit";
const OFF_TIMEOUT = 8000;

/* Testlerde üzerine yazılabilsin diye düz işlev. */
function barcodeAvailable(){ return IS_NATIVE; }

/* GTIN (EAN-8, UPC-A, EAN-13, GTIN-14): yalnızca rakam, uzunluk ve sağlama basamağı. */
function validGtin(code){
  if (typeof code !== "string" || !/^\d+$/.test(code) || ![8, 12, 13, 14].includes(code.length)) return false;
  let sum = 0;
  for (let i = code.length - 2, w = 3; i >= 0; i--, w = 4 - w) sum += (+code[i]) * w;
  return (10 - sum % 10) % 10 === +code[code.length - 1];
}

/* Aynı ürün farklı uzunlukta okunabilir: Apple Vision UPC-A'yı 13 haneli (başında 0) verir,
   Open Food Facts da 13 hane tutar. Anahtar ve istek hep bu biçimle yazılır. */
function normGtin(code){
  const c = String(code || "").replace(/\s/g, "");
  if (c.length === 12) return "0" + c;
  if (c.length === 14 && c[0] === "0") return c.slice(1);
  return c;
}

const offUrl = code => `${OFF_HOST}/api/v2/product/${normGtin(code)}.json?fields=${OFF_FIELDS}`;

/* Open Food Facts yanıtı → { status:"ok"|"partial"|"notfound", food, flags }.
   food: { n, br, p, c, f, lif, serving } (100 g başına gram; serving gram ya da null).
   flags: { ml, fromServing, absurd, labelKcal, kcalMismatch }.
   Kurallar: değerler sayı, 0..100 olmalı ve p+c+f en fazla 105; aksi halde o değer eksik sayılır.
   Yalnızca porsiyon başına verilmişse serving_quantity ile 100 g'a çevrilir. Enerji yalnızca
   kJ ise 4,184'e bölünür; makrolardan hesaplanan kaloriyle etiket kalorisi %20'den fazla
   (ve en az 10 kcal) ayrışırsa kcalMismatch. Ad ve marka metinleri < > ve denetim
   karakterlerinden arındırılır (ekran yine de kaçışlı basar; bu ikinci savunma hattı). */
function offToFood(json, lang){
  const P = json && typeof json === "object" ? json.product : null;
  if (!P || typeof P !== "object" || json.status === 0) return { status: "notfound", food: null, flags: {} };
  const N = P.nutriments && typeof P.nutriments === "object" ? P.nutriments : {};
  const toNum = v => (typeof v === "number" || (typeof v === "string" && v.trim() !== "")) && isFinite(+v) ? +v : null;
  const r1 = v => Math.round(v * 10) / 10;
  const clean = (s, max) => typeof s === "string"
    ? s.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";

  const sq = toNum(P.serving_quantity);
  const serving = sq !== null && sq > 0 && sq <= 5000 ? sq : null;
  let fromServing = false;
  const per100 = (key, track) => {
    const a = toNum(N[key + "_100g"]);
    if (a !== null) return a;
    const b = toNum(N[key + "_serving"]);
    if (b !== null && serving){ if (track) fromServing = true; return b * 100 / serving; }
    return null;
  };

  let absurd = false;
  const macro = key => {
    const v = per100(key, true);
    if (v === null) return null;
    if (v < 0 || v > 100){ absurd = true; return null; }
    return v;
  };
  let p = macro("proteins"), c = macro("carbohydrates"), f = macro("fat");
  if ((p || 0) + (c || 0) + (f || 0) > 105){ absurd = true; p = c = f = null; }
  let lif = per100("fiber", false);
  if (lif === null || lif < 0 || lif > 100) lif = 0;

  let label = per100("energy-kcal", false);
  if (label === null){
    let kj = toNum(N["energy-kj_100g"]);
    if (kj === null) kj = toNum(N["energy_100g"]);
    if (kj === null){ const s = toNum(N["energy-kj_serving"]); if (s !== null && serving) kj = s * 100 / serving; }
    if (kj !== null) label = kj / 4.184;
  }
  if (label !== null && (label < 0 || label > 950)) label = null;

  const unit = String(P.product_quantity_unit || P.serving_quantity_unit || "").toLowerCase();
  const ml = ["ml", "cl", "dl", "l"].includes(unit);

  const code = clean(String(P.code || json.code || ""), 14);
  const lg = /^[a-z]{2}$/.test(lang || "") ? "product_name_" + lang : "product_name";
  const name = [P[lg], P.product_name, P.product_name_en, P.product_name_tr].map(x => clean(x, 80)).find(Boolean) || code;
  const br = clean(String(P.brands || "").split(",")[0], 40);

  const complete = p !== null && c !== null && f !== null;
  const food = { n: name, br, p: p === null ? null : r1(p), c: c === null ? null : r1(c),
    f: f === null ? null : r1(f), lif: r1(lif), serving };
  const calc = complete ? p * 4 + c * 4 + f * 9 : null;
  const kcalMismatch = complete && label !== null
    && Math.abs(calc - label) > 10 && Math.abs(calc - label) > 0.2 * Math.max(calc, label);
  return { status: complete ? "ok" : "partial", food,
    flags: { ml, fromServing: complete && fromServing, absurd, labelKcal: label === null ? null : Math.round(label), kcalMismatch } };
}

/* Barkodu Open Food Facts'te arar. get: { status, data } döndüren ya da bağlantı hatasında
   atan işlev (testlerde sahtesi verilir). Sonuç offToFood'unkine benzer; status ayrıca
   "offline" (bağlantı kurulamadı), "error" (süre doldu ya da sunucu anlamsız yanıt verdi) olabilir. */
async function lookupBarcode(code, get){
  get = get || nativeGet;
  let r;
  try {
    r = await get(offUrl(code), {
      "User-Agent": `Starboard/${APP_VERSION} (github.com/efekaratosun/starboard)`,
      "Accept": "application/json"
    }, OFF_TIMEOUT);
  } catch(e){
    return { status: e && e.name === "TimeoutError" ? "error" : "offline", food: null, flags: {} };
  }
  if (!r) return { status: "error", food: null, flags: {} };
  if (r.status === 404) return { status: "notfound", food: null, flags: {} };
  if (r.status !== 200 || !r.data || typeof r.data !== "object") return { status: "error", food: null, flags: {} };
  return offToFood(r.data, LANG);
}

/* ---- kayıt ---- */
function foodByBarcode(code){
  const c = normGtin(code), cf = (state && state.customFoods) || {};
  if (cf["bc_" + c]) return ["bc_" + c, cf["bc_" + c]];
  for (const [k, f] of Object.entries(cf)) if (f && f.bc === c) return [k, f];
  return null;
}

/* food: { n, p, c, f, lif?, br?, serving?, src? }. Aynı barkod aynı anahtara yazılır, kopya olmaz. */
function saveBarcodeFood(code, food){
  const bc = normGtin(code), key = "bc_" + bc;
  const br = typeof food.br === "string" ? food.br.slice(0, 40) : "";
  const rec = { n: String(food.n || bc).slice(0, 80), p: food.p, c: food.c, f: food.f, lif: food.lif || 0,
    i: "grain", bc, a: bc + (br ? " " + br : "") };
  if (br) rec.br = br;
  if (food.src === "off") rec.src = "off";
  if (food.serving > 0) rec.por = [{ n: tx("porsiyon"), g: Math.round(food.serving) }];
  state.customFoods = state.customFoods || {};
  state.customFoods[key] = rec;
  return key;
}

/* ---- akış ---- */
const bcBox = () => document.getElementById("bc-box");
let bcBusy = false;

function bcShow(html){
  const b = bcBox();
  if (!b) return null;
  const cf = document.getElementById("custom-form");
  if (cf) cf.innerHTML = "";            /* iki formda aynı kimlikler olmasın */
  b.innerHTML = html;
  return b;
}

function bcMsg(text, buttons, warn){
  return `<div class="pick"><div class="metric-note${warn ? " cf-warn" : ""}">${text}</div>
    ${buttons.length ? `<div class="row" style="margin-top:12px">${buttons.map(([id, l, ghost]) =>
      `<button${ghost ? ' class="ghost"' : ""} id="${id}">${l}</button>`).join("")}</div>` : ""}</div>`;
}

const bcManualHTML = () => `<div class="pick">
  <div class="field"><label for="bc-num">${tx("Barkod numarası")}</label>
    <input id="bc-num" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="14" autocomplete="off"></div>
  <div class="metric-note cf-warn" id="bc-err" role="alert"></div>
  <button id="bc-find">${tx("Bul")}</button></div>`;

function bcWireManual(){
  const num = document.getElementById("bc-num"), err = document.getElementById("bc-err");
  if (!num) return;
  const go = () => {
    const c = num.value.replace(/\s/g, "");
    if (!validGtin(c)){ err.textContent = tx("Geçersiz barkod"); num.focus(); return; }
    return bcResolve(c);
  };
  document.getElementById("bc-find").onclick = go;
  num.onkeydown = ev => { if (ev.key === "Enter") go(); };
}

function bcShowManual(prefix){
  const b = bcShow((prefix || "") + bcManualHTML());
  bcWireManual();
  const num = document.getElementById("bc-num");
  if (num && b) num.focus();
}

function bcScrollTo(id){
  const el = document.getElementById(id);
  if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* Bu cihazda kayıtlı ürün: doğrudan miktar kartı. */
function bcUse(key, food){
  logPick = key; logQuery = food.n;
  render();
  bcScrollTo("pick-amt");
}

/* Önizleme ve elle giriş: aynı form (meals.js customFoodForm). res.status "ok" ya da "partial"
   ise Open Food Facts değerleri dolu gelir; "notfound" ve "manual" boş form açar. */
function bcForm(code, res){
  const box = bcBox();
  if (!box) return;
  const food = res.food || {}, fl = res.flags || {};
  const notes = [];
  if (res.status === "notfound") notes.push([tx("Bu ürün Open Food Facts'te yok. Değerleri ambalajdan girebilirsin."), false]);
  if (res.status === "partial") notes.push([tx("Değerler eksik; tamamlayıp kaydet."), true]);
  if (food.br) notes.push([tx("Marka: {0}", [esc(food.br)]), false]);
  if (fl.ml) notes.push([tx("Değerler 100 ml başına; 1 ml ≈ 1 g sayıldı."), false]);
  if (fl.kcalMismatch) notes.push([tx("Etiket {0} kcal diyor, değerleri kontrol et.", [fl.labelKcal]), true]);
  if (res.status === "ok" || res.status === "partial") notes.push([tx("Kaynak: Open Food Facts"), false]);
  const pre = { title: tx("Barkod {0}", [code]), notes, bc: code, n: food.n || "", p: food.p, c: food.c, f: food.f,
    lif: food.lif, br: food.br, serving: food.serving,
    src: res.status === "ok" || res.status === "partial" ? "off" : null,
    saveLabel: tx("Kaydet ve ekle"), requireAll: true };
  bcShow(customFoodForm(pre));
  wireCustomForm(box, pre);
  bcScrollTo("cf-card");
}

/* Okunan geçerli barkod: önce cihaz, sonra ağ. */
async function bcResolve(raw){
  const code = normGtin(raw);
  const hit = foodByBarcode(code);
  if (hit){ bcUse(hit[0], hit[1]); return; }
  bcShow(`<div class="pick"><div class="metric-note">${tx("Ürün aranıyor…")}</div></div>`);
  const res = await lookupBarcode(code);
  if (!bcBox()) return;
  if (res.status === "ok" || res.status === "partial" || res.status === "notfound"){ bcForm(code, res); return; }
  bcShow(bcMsg(tx("Bağlantı kurulamadı."), [["bc-retry", tx("Tekrar dene")], ["bc-enter", tx("Elle gir"), true]], true));
  document.getElementById("bc-retry").onclick = () => bcResolve(code);
  document.getElementById("bc-enter").onclick = () => bcForm(code, { status: "manual", food: {}, flags: {} });
}

function bcRetryOrManual(text, warn){
  bcShow(bcMsg(text, [["bc-retry", tx("Tekrar dene")], ["bc-enter", tx("Elle gir"), true]], warn));
  document.getElementById("bc-retry").onclick = () => bcScan();
  document.getElementById("bc-enter").onclick = () => bcShowManual();
}

async function bcScan(){
  if (bcBusy) return;
  bcBusy = true;
  let r;
  try {
    r = await nativeScan({ instructions: tx("Barkodu çerçevenin içine getir"), cancelLabel: tx("Kapat"),
      torchOnLabel: tx("Feneri kapat"), torchOffLabel: tx("Feneri aç") });
  } finally { bcBusy = false; }
  if (!r || r.status === "cancel") return;
  if (r.status === "denied"){
    bcShowManual(bcMsg(tx("Kamera izni kapalı: Ayarlar › Starboard › Kamera"), [], true));
    return;
  }
  if (r.status !== "ok"){ bcRetryOrManual(tx("Tarayıcı açılamadı."), true); return; }
  const code = r.code.replace(/\s/g, "");
  if (!validGtin(code)){ bcRetryOrManual(tx("Geçersiz barkod"), true); return; }
  await bcResolve(code);
}

/* Düğmeye basılınca: ilk kullanımda bir kez bilgi penceresi, sonra tarayıcı. */
function bcConsent(){
  return new Promise(resolve => {
    const el = document.createElement("div");
    el.className = "sheet-bg";
    el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="bc-t">
      <div class="sheet-h"><b id="bc-t">${tx("Barkod okut")}</b><button class="sheet-x" aria-label="${tx("Kapat")}">×</button></div>
      <p>${tx("Yalnızca barkod numarası Open Food Facts'e gönderilir; başka hiçbir verin cihazdan çıkmaz.")}</p>
      <div class="row" style="margin-top:8px"><button id="bc-go">${tx("Devam")}</button>
        <button class="ghost" id="bc-no">${tx("Vazgeç")}</button></div>
    </div>`;
    document.body.appendChild(el);
    const done = ok => { sheetOut(el); resolve(ok); };
    el.onclick = ev => { if (ev.target === el) done(false); };
    el.querySelector(".sheet-x").onclick = () => done(false);
    el.querySelector("#bc-no").onclick = () => done(false);
    el.querySelector("#bc-go").onclick = () => done(true);
    el.querySelector("#bc-go").focus();
  });
}

async function startBarcodeFlow(){
  if (!barcodeAvailable() || !state) return;
  if (!state.bcOk){
    if (!(await bcConsent())) return;
    state.bcOk = 1;
    await saveState(state);
  }
  await bcScan();
}
