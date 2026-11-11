"use strict";

/* ---------------- depolama ---------------- */
const KEY = "saglik-takip-v1";

async function loadState(){
  if (window.storage) {
    try { const r = await window.storage.get(KEY); if (r && r.value) return JSON.parse(r.value); }
    catch(e){ /* kayıt yok */ }
  }
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch(e){}
  return null;
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
