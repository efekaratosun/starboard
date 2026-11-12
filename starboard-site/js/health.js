"use strict";

/* ---------------- Apple Sağlık (iOS) ----------------
   Yalnızca iPhone uygulamasında: adım, uyku ve kilo Apple Sağlık'tan okunur ve günlük
   kaydın mevcut alanlarına (steps, sleep/bed/wake, weight) yazılır. Sağlık'a hiçbir şey
   yazılmaz; veriler cihazdan çıkmaz. Eklenti @capgo/capacitor-health (JS adı "Health"),
   paketleyici olmadığı için nativePlugin("Health") ile doğrudan çağrılır.

   Ayar: state.profile.health = { on, steps, sleep, weight, lastSync }. Türler yoksa açık
   sayılır (yalnızca false kapalıdır); lastSync ISO zaman.
   Kayıt: state.days[k].hk = { steps, sleep, bed, wake, weight }: Sağlık'tan o alana en son
   yazılan değer. Elle girilen değer her zaman kazanır: alan doluyken hk'deki değerden
   farklıysa kullanıcı değiştirmiştir, alan boşken hk'de değer varsa kullanıcı silmiştir;
   ikisinde de dokunulmaz. Yeni alanlar isteğe bağlıdır, SCHEMA değişmedi.

   Eşitleme uygulama açılınca, öne gelince (en fazla dakikada bir) ve Ayarlar'daki
   düğmeyle yapılır. İlk bağlantıda 14 gün geriye gidilir; sonra son eşitlemeden bu yana
   (en az 2, en çok 14 gün). Kaydı olmayan geçmiş güne yalnızca { tasks: [] } açılır,
   görev tohumlaması yapılmaz.

   Hesap (hkStepsByDay, hkSleepByDay, hkWeightByDay, applyHealth) metin üretmez ve web'de
   test edilir; eşitleme (syncHealth) ve okuma yalnızca yerelde çalışır. */
const HK_TYPES = ["steps", "sleep", "weight"];
const HK_FIELDS = { steps: ["steps"], sleep: ["sleep", "bed", "wake"], weight: ["weight"] };
const HK_SELF = "app.starboard.health";           /* kendi kaynağımız: ileride yazma eklenirse geri okunmasın */
const HK_FULL_DAYS = 14, HK_MIN_DAYS = 2;
/* Eklentinin uyku durumları: "light" HealthKit'teki core uykusudur. inBed ve awake sayılmaz. */
const HK_ASLEEP = new Set(["asleep", "light", "core", "deep", "rem"]);
const HK_NAP_MIN = 180;                            /* 3 saatten kısa oturum şekerleme sayılır */
const HK_GAP_MS = 60 * 6e4;                        /* aynı gecenin parçaları arasında en fazla 1 saat */

const healthOf = p => (p && p.health) || {};
const hkReadTypes = H => HK_TYPES.filter(t => H[t] !== false);

/* ---- hesap ---- */

/* queryAggregated (günlük kova, toplam) -> { "YYYY-AA-GG": adım }. Kova yerel gece
   yarısından başlar; yaz saati günlerinde de doğru güne düşsün diye ortası alınır. */
function hkStepsByDay(samples){
  const out = {};
  for (const s of samples || []){
    const v = Number(s && s.value), a = Date.parse(s && s.startDate), b = Date.parse(s && s.endDate);
    if (!isFinite(v) || v <= 0 || !isFinite(a)) continue;
    const k = dayKey(new Date(isFinite(b) && b > a ? (a + b) / 2 : a));
    out[k] = (out[k] || 0) + Math.round(v);
  }
  return out;
}

/* Yerel saat, gece yarısından dakika, 5 dakikaya yuvarlı (uyku kadranıyla aynı adım). */
const hkMin = t => { const d = new Date(t); return Math.round((d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60) / 5) * 5 % 1440; };

/* Uyku örnekleri -> { "YYYY-AA-GG": { sleep (saat, 2 ondalık), bed, wake } }.
   Her kaynağın uyku aralıkları birleştirilip oturumlara ayrılır (aradaki uyanıklık
   1 saati geçmezse aynı oturum). Oturum bittiği günün kaydına yazılır; süre yalnızca
   uykuda geçen zamandır. 3 saatten kısa oturumlar atılır. Aynı güne birden çok kaynak
   düşerse tek kaynak seçilir: önce Apple Watch, sonra aşamalı veri veren, sonra en uzun. */
function hkSleepByDay(samples){
  const bySrc = {};
  for (const s of samples || []){
    if (!s || !HK_ASLEEP.has(s.sleepState) || s.sourceId === HK_SELF) continue;
    const a = Date.parse(s.startDate), b = Date.parse(s.endDate);
    if (!isFinite(a) || !isFinite(b) || b <= a) continue;
    const id = s.sourceId || s.sourceName || "?";
    const S = bySrc[id] || (bySrc[id] = { name: String(s.sourceName || id), staged: false, iv: [] });
    S.iv.push([a, b]);
    if (s.sleepState !== "asleep") S.staged = true;
  }
  const best = {};
  for (const S of Object.values(bySrc)){
    const sessions = [];
    for (const [a, b] of S.iv.sort((x, y) => x[0] - y[0])){
      const cur = sessions[sessions.length - 1];
      if (cur && a <= cur.end + HK_GAP_MS){
        if (b > cur.end){ cur.asleep += b - Math.max(a, cur.end); cur.end = b; }
      } else sessions.push({ start: a, end: b, asleep: b - a });
    }
    const rank = (/watch/i.test(S.name) ? 2 : 0) + (S.staged ? 1 : 0);
    for (const x of sessions){
      const min = x.asleep / 6e4;
      if (min < HK_NAP_MIN) continue;
      const k = dayKey(new Date(x.end)), cur = best[k];
      if (!cur || rank > cur.rank || (rank === cur.rank && min > cur.min)) best[k] = { rank, min, start: x.start, end: x.end };
    }
  }
  const out = {};
  for (const [k, x] of Object.entries(best))
    out[k] = { sleep: Math.round(x.min / 60 * 100) / 100, bed: hkMin(x.start), wake: hkMin(x.end) };
  return out;
}

/* Kilo örnekleri (kg) -> { "YYYY-AA-GG": günün ilk ölçümü, 0,1 kg }. 25–400 kg dışı ve
   kendi kaynağımız atılır (hızlı girişteki sınırla aynı). */
function hkWeightByDay(samples){
  const first = {};
  for (const s of samples || []){
    const v = Number(s && s.value), t = Date.parse(s && s.startDate);
    if (!isFinite(v) || !isFinite(t) || v < 25 || v > 400 || s.sourceId === HK_SELF) continue;
    const k = dayKey(new Date(t));
    if (!first[k] || t < first[k].t) first[k] = { t, v };
  }
  const out = {};
  for (const [k, x] of Object.entries(first)) out[k] = Math.round(x.v * 10) / 10;
  return out;
}

/* Okunan veriyi kayda yazar. data: { steps, sleep, weight } (yukarıdaki işlevlerin çıktısı);
   yalnızca from..to (dahil) arasındaki günler ve açık türler. Bir şey değiştiyse true. */
function applyHealth(st, data, from, to){
  const H = healthOf(st.profile);
  st.days = st.days || {};
  let changed = false;
  for (const type of HK_TYPES){
    if (H[type] === false) continue;
    const fields = HK_FIELDS[type], main = fields[0], src = (data && data[type]) || {};
    for (const k of Object.keys(src).sort()){
      if (k < from || k > to) continue;
      const vals = type === "sleep" ? src[k] : { [type]: src[k] };
      if (!vals || !fields.every(f => typeof vals[f] === "number" && isFinite(vals[f]))) continue;
      const e = st.days[k], hk = (e && e.hk) || {};
      const has = !!e && typeof e[main] === "number", had = typeof hk[main] === "number";
      /* had: daha önce biz yazdık. Değer hâlâ bizimkiyse güncellenir; değişmiş ya da
         silinmişse kullanıcınındır. had değilse yalnızca boş alan doldurulur. */
      if (had ? !(has && fields.every(f => e[f] === hk[f])) : has) continue;
      if (has && fields.every(f => e[f] === vals[f])) continue;
      const day = e || (st.days[k] = { tasks: [] });
      day.hk = { ...(day.hk || {}) };
      for (const f of fields){ day[f] = vals[f]; day.hk[f] = vals[f]; }
      changed = true;
    }
  }
  return changed;
}

/* Kaç gün geriye: ilk eşitlemede 14, sonra son eşitlemeden bu yana (2–14). */
function hkWindow(lastSync, to){
  const t = Date.parse(lastSync || "");
  if (!isFinite(t)) return HK_FULL_DAYS;
  const gap = Math.round((new Date(to + "T12:00:00") - new Date(dayKey(new Date(t)) + "T12:00:00")) / 864e5);
  return Math.min(HK_FULL_DAYS, Math.max(HK_MIN_DAYS, gap + 1));
}

/* Satır alt metni: değer Sağlık'tan geldiyse ve kullanıcı değiştirmediyse. */
const hkTag = (entry, f) => entry && entry.hk && typeof entry[f] === "number" && entry.hk[f] === entry[f] ? tx(" · Sağlık'tan") : "";

/* ---- okuma ve eşitleme (yalnızca iPhone) ---- */
let hkOk = false, hkProbe = null, hkBusy = false, hkAt = 0, hkNote = "";

/* Sağlık bu cihazda var mı (eski iPad'lerde yok). Web'de hep false. */
function healthAvailable(){ return IS_NATIVE && hkOk; }
function probeHealth(){
  if (!hkProbe) hkProbe = (async () => {
    const P = nativePlugin("Health");
    if (!P) return false;
    try { const r = await P.isAvailable(); hkOk = !!(r && r.available); } catch(e){ hkOk = false; }
    return hkOk;
  })();
  return hkProbe;
}

/* Eklentiden okur. Bir tür hata verirse (izin yok, veri yok) o tür boş kalır. Uyku için
   pencerenin ilk gününe biten geceyi de almak üzere 12 saat önceden başlanır. readSamples
   varsayılan olarak 100 örnekle sınırlı; uyku aşamaları gecede onlarca örnek üretir. */
async function hkRead(P, H, start, end){
  const iso = d => d.toISOString();
  const safe = async f => { try { return await f(); } catch(e){ return null; } };
  const out = { steps: {}, sleep: {}, weight: {} };
  if (H.steps !== false){
    const r = await safe(() => P.queryAggregated({ dataType: "steps", startDate: iso(start), endDate: iso(end), bucket: "day", aggregation: "sum" }));
    if (r) out.steps = hkStepsByDay(r.samples);
  }
  if (H.sleep !== false){
    const s0 = new Date(start.getTime() - 12 * 3600e3);
    const r = await safe(() => P.readSamples({ dataType: "sleep", startDate: iso(s0), endDate: iso(end), limit: 5000, ascending: true }));
    if (r) out.sleep = hkSleepByDay(r.samples);
  }
  if (H.weight !== false){
    const r = await safe(() => P.readSamples({ dataType: "weight", startDate: iso(start), endDate: iso(end), limit: 1000, ascending: true }));
    if (r) out.weight = hkWeightByDay(r.samples);
  }
  return out;
}

/* Eşitler. opts.full: 14 gün (bağlanınca), opts.manual: düğmeyle (değişiklik olmasa da kaydeder).
   Dönen: null (çalışmadı) ya da { days: veri gelen gün sayısı, changed }. */
async function syncHealth(opts){
  const o = opts || {}, P = nativePlugin("Health");
  if (!P || !state || !state.profile || hkBusy) return null;
  const H = healthOf(state.profile);
  if (!H.on) return null;
  hkBusy = true;
  try {
    const to = today(), from = shiftDays(to, -((o.full ? HK_FULL_DAYS : hkWindow(H.lastSync, to)) - 1));
    const data = await hkRead(P, H, new Date(from + "T00:00:00"), new Date());
    const seen = new Set();
    for (const t of HK_TYPES) for (const k of Object.keys(data[t] || {})) if (k >= from && k <= to) seen.add(k);
    const changed = applyHealth(state, data, from, to);
    state.profile.health = { ...healthOf(state.profile), lastSync: new Date().toISOString() };
    if (changed || o.manual) await saveState(state);
    /* Bir alana yazılırken yeniden çizilmez; odak ve yazılan metin kaybolmasın. */
    const ae = document.activeElement;
    if (changed && !o.manual && !(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))) render();
    return { days: seen.size, changed };
  } finally { hkBusy = false; }
}

/* Açılışta ve uygulama öne gelince; en fazla dakikada bir. */
async function healthSoon(){
  if (!IS_NATIVE || !(await probeHealth())) return;
  if (!healthOf(state && state.profile).on || Date.now() - hkAt < 60000) return;
  hkAt = Date.now();
  try { await syncHealth(); } catch(e){}
}
if (IS_NATIVE) document.addEventListener("visibilitychange", () => { if (!document.hidden) healthSoon(); });

/* İzin ister (yalnızca okuma). iOS pencereyi yalnızca henüz sorulmamış türler için açar;
   okuma reddi uygulamaya bildirilmez, ancak "veri gelmedi" diye anlaşılır. */
async function hkAuthorize(H){
  const P = nativePlugin("Health");
  if (!P) return false;
  try { await P.requestAuthorization({ read: hkReadTypes(H), write: [] }); return true; }
  catch(e){ toast(tx("Sağlık'a bağlanılamadı.")); return false; }
}
async function hkSyncNow(full){
  const r = await syncHealth({ full, manual: true });
  hkAt = Date.now();
  if (r){
    hkNote = r.days ? "" : tx("Sağlık'tan veri gelmedi. İzin vermediysen: Sağlık uygulaması › profil › Gizlilik › Uygulamalar › Starboard.");
    if (r.days) toast(tx("Sağlık'tan {0} günlük veri alındı.", [(r.days)]));
  }
  render();
}

/* ---- ayarlar bölümü ---- */
const hkWhen = iso => {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const t = d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
  return dayKey(d) === today() ? t : `${prettyDate(dayKey(d))} ${t}`;
};
function healthSection(){
  if (!healthAvailable()) return "";
  const H = healthOf(state.profile);
  const L = { steps: tx("Adım"), sleep: tx("Uyku"), weight: tx("Kilo") };
  return `<section>
    <h2>${tx("Apple Sağlık")}</h2>
    <div class="metric-note">${tx("Adımını, uykunu ve kilonu Apple Sağlık'tan al; hedeflerin kendiliğinden işaretlensin. Veriler bu iPhone'dan çıkmaz.")}</div>
    <div class="chips" role="group" aria-label="${tx("Sağlık'tan alınacaklar")}" style="margin-top:12px">${HK_TYPES.map(t =>
      `<button class="chip${H[t] !== false ? " sel" : ""}" data-hk-type="${t}" aria-pressed="${H[t] !== false}">${L[t]}</button>`).join("")}</div>
    ${H.on
      ? `${H.lastSync ? `<div class="metric-note" style="margin-top:12px">${tx("Son eşitleme: {0}", [(hkWhen(H.lastSync))])}</div>` : ""}
    <button class="ghost" id="hk-sync" style="margin-top:12px">${tx("Şimdi eşitle")}</button>
    <button class="ghost" id="hk-off" style="margin-top:8px">${tx("Bağlantıyı kes")}</button>
    <div class="metric-note" style="margin-top:8px">${tx("İzni yalnızca Sağlık uygulamasından geri alabilirsin.")}</div>`
      : `<button id="hk-connect" style="margin-top:12px">${tx("Sağlık'a bağlan")}</button>`}
    ${hkNote ? `<div class="metric-note" role="status" style="margin-top:12px">${hkNote}</div>` : ""}
  </section>`;
}
function wireHealth(){
  const setH = async patch => { state.profile.health = { ...healthOf(state.profile), ...patch }; await saveState(state); };
  const con = document.getElementById("hk-connect");
  if (con) con.onclick = async () => {
    if (!(await hkAuthorize(healthOf(state.profile)))) return;
    await setH({ on: true });
    await hkSyncNow(true);
  };
  const sy = document.getElementById("hk-sync");
  if (sy) sy.onclick = () => hkSyncNow(false);
  const off = document.getElementById("hk-off");
  if (off) off.onclick = async () => { hkNote = ""; await setH({ on: false }); render(); };
  app.querySelectorAll("[data-hk-type]").forEach(b => b.onclick = async () => {
    const t = b.dataset.hkType, H = healthOf(state.profile), next = { ...H, [t]: H[t] === false };
    if (!hkReadTypes(next).length){ toast(tx("En az bir veri türü seç.")); return; }
    await setH({ [t]: next[t] });
    /* Bağlıyken yeni açılan tür için izin istenir ve 14 gün geriye okunur. */
    if (next.on && next[t] && (await hkAuthorize(next))) await hkSyncNow(true);
    else render();
  });
}
