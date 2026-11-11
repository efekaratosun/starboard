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
const prettyDate = key => new Date(key + "T12:00:00").toLocaleDateString("tr-TR", { day:"numeric", month:"long" });
const weekdayName = key => new Date(key + "T12:00:00").toLocaleDateString("tr-TR", { weekday:"long" });
const WD_NAMES = ["","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];
/* Kısaltmalar ayrı: "Pazartesi".slice(0,3) ile "Pazar".slice(0,3) aynı çıkıyor. */
const WD_SHORT = ["","Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];
