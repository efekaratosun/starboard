"use strict";

/* ---------------- depolama ---------------- */
/* Uygulama sürümü: Ayarlar'da ve yedek dosyasında görünür. Değişiklikler CHANGELOG.md'de. */
const APP_VERSION = "1.7.0";

/* Kayıt, KEY altında tek bir JSON olarak durur. Eski adla (OLD_KEYS) kaydedilmiş veri
   ilk açılışta okunur ve yeni adla yazılır; eski kayıt yedek olarak yerinde bırakılır. */
const KEY = "starboard-state";
const OLD_KEYS = ["saglik-takip-v1"];
let loadedFromOldKey = false;

async function readKey(k){
  if (window.storage) {
    try { const r = await window.storage.get(k); if (r && r.value) return JSON.parse(r.value); }
    catch(e){ /* kayıt yok */ }
  }
  try { const raw = localStorage.getItem(k); if (raw) return JSON.parse(raw); } catch(e){}
  return null;
}

async function loadState(){
  loadedFromOldKey = false;
  const cur = await readKey(KEY);
  if (cur) return cur;
  for (const k of OLD_KEYS){
    const old = await readKey(k);
    if (old){ loadedFromOldKey = true; return old; }
  }
  return null;
}

async function clearState(){
  for (const k of [KEY, ...OLD_KEYS]){
    if (window.storage) { try { await window.storage.delete(k); } catch(e){} }
    try { localStorage.removeItem(k); } catch(e){}
  }
}

/* ---------------- veri sürümü ----------------
   Kaydın biçimi değiştiğinde SCHEMA bir artırılır ve MIGRATIONS'a eski sürümden
   bir sonrakine taşıyan adım eklenir. Adımlar sırayla çalışır, böylece çok eski
   bir kayıt ya da yedek de güncel biçime gelir. Kural: bir adım yayınlandıktan
   sonra değiştirilmez; yeni değişiklik yeni adım olarak eklenir. */
const SCHEMA = 2;
const MIGRATIONS = {
  /* 1 -> 2: antrenman ortamı zorunlu alan oldu; tamamlanan günlere yıldız damgası eklendi. */
  1: s => {
    if (!s.profile.venue) s.profile.venue = "gym";
    if (!s.starred){
      s.starred = 1;
      const keep = state; state = s;      /* damgalama geçerli kayıt üzerinde çalışır */
      try { stampAllStars(); } finally { state = keep; calcReset(); }
    }
  }
};

/* Kaydı güncel biçime taşır. newer: kayıt bu sürümün tanımadığı daha yeni bir biçimde. */
function migrateState(s){
  if (!s || typeof s !== "object" || !s.profile) return { changed:false, newer:false };
  let v = Number.isInteger(s.v) && s.v >= 1 ? s.v : 1;
  if (v > SCHEMA) return { changed:false, newer:true };
  let changed = false;
  while (v < SCHEMA){ MIGRATIONS[v](s); v++; changed = true; }
  if (s.v !== SCHEMA){ s.v = SCHEMA; changed = true; }
  return { changed, newer:false };
}

async function saveState(s){
  calcReset();                 /* veri değişti: gün puanları yeniden hesaplansın */
  const v = JSON.stringify(s);
  if (window.storage) { try { await window.storage.set(KEY, v); } catch(e){} }
  try { localStorage.setItem(KEY, v); } catch(e){}
}

/* ---------------- tarih ---------------- */
const dayKey = d => new Date(d.getTime() - d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const today = () => dayKey(new Date());
const shiftDays = (key, n) => { const d = new Date(key + "T12:00:00"); d.setDate(d.getDate() + n); return dayKey(d); };
const isoWeekday = key => { const w = new Date(key + "T12:00:00").getDay(); return w === 0 ? 7 : w; };
const prettyDate = key => new Date(key + "T12:00:00").toLocaleDateString(locale(), { day:"numeric", month:"long" });
const weekdayName = key => new Date(key + "T12:00:00").toLocaleDateString(locale(), { weekday:"long" });
/* 1 Ocak 2024 pazartesi: başka dillerde gün adları tarayıcıdan alınır. */
const wdNames = style => [""].concat([1,2,3,4,5,6,7].map(n => new Date(2024, 0, n).toLocaleDateString(locale(), { weekday:style })));
const WD_NAMES = LANG === "tr" ? ["","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"] : wdNames("long");
/* Kısaltmalar ayrı: "Pazartesi".slice(0,3) ile "Pazar".slice(0,3) aynı çıkıyor. */
const WD_SHORT = LANG === "tr" ? ["","Pzt","Sal","Çar","Per","Cum","Cmt","Paz"] : wdNames("short");
