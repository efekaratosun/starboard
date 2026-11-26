"use strict";

/* ---------------- ödül öğünü hesabı ----------------
   Saf işlevler: kayıt ya da DOM'a dokunmaz. Gün sınırı 04:00; seçili öğünlerin
   tamamlanması; P/K puanları, haklar, bekleme ve düzenleme penceresi burada. */

const CHEAT_BOUNDARY_H = 4;
const CHEAT_EDIT_DAYS = 7;
const CHEAT_USE_WAIT = 7;
const CHEAT_RETRO_K = 0.9;
const CHEAT_P_TABLE = { ok: 1, fail: -1, empty: -2, late: 0 };
const CHEAT_P_MEAL = 8;
const CHEAT_P_DAY = 10;

/* 04:00 öncesi bir önceki takvim gününe aittir. */
function dayKey4(d = new Date()){
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 6e4);
  if (x.getUTCHours() < CHEAT_BOUNDARY_H) x.setUTCDate(x.getUTCDate() - 1);
  return x.toISOString().slice(0, 10);
}
const today4 = () => dayKey4(new Date());
const cheatDayKey = dayKey4;

function cheatSkipped(entry){
  const s = entry && (entry.skipped || entry.skip);
  return Array.isArray(s) ? s.map(String) : [];
}

function cheatLoggedSlots(entry){
  const out = new Set();
  for (const it of (entry && entry.log) || [])
    if (it && it.slot) out.add(String(it.slot));
  return out;
}

/* Seçili bütün öğünler günlükte girilmiş ya da atlanmış olmalı. */
function cheatMealsComplete(entry, mealIds){
  if (!mealIds || !mealIds.length) return true;
  const skip = new Set(cheatSkipped(entry)), log = cheatLoggedSlots(entry);
  return mealIds.every(id => skip.has(String(id)) || log.has(String(id)));
}

/* başarılı ok | başarısız fail | girilmemiş empty | geç late */
function cheatDayKind(entry, mealIds, band){
  band = band || {};
  if (entry && entry.late) return "late";
  if (!cheatMealsComplete(entry, mealIds)) return "empty";
  const kcal = entry && typeof entry.kcal === "number" ? entry.kcal : null;
  if (kcal === null) return "empty";
  const lo = band.lo, hi = band.hi;
  if (typeof lo !== "number" || typeof hi !== "number") return "empty";
  return kcal >= lo && kcal <= hi ? "ok" : "fail";
}

function cheatP(kind){
  return Object.hasOwn(CHEAT_P_TABLE, kind) ? CHEAT_P_TABLE[kind] : CHEAT_P_TABLE.empty;
}

/* Günlük K: A<H iken min(H-A, 0.15H); A>H iken -(A-H); girilmemiş 0.
   retro: geçmişe dönük düzenlemede %90. Toplam havuz max(0, ∑) ile sınırlanır. */
function cheatKDay(actual, target, kind, retro){
  if (kind === "empty") return 0;
  if (kind === "late" && actual == null) return 0;
  if (typeof actual !== "number" || typeof target !== "number") return 0;
  let k;
  if (actual < target) k = Math.min(target - actual, 0.15 * target);
  else if (actual > target) k = -(actual - target);
  else k = 0;
  if (retro) k *= CHEAT_RETRO_K;
  return k;
}

function cheatKTotal(parts){
  const sum = (parts || []).reduce((a, x) => a + (typeof x === "number" ? x : 0), 0);
  return Math.max(0, sum);
}

function cheatB(target){
  if (typeof target !== "number" || !Number.isFinite(target) || target <= 0) return 0;
  return Math.round(0.30 * target / 50) * 50;
}

/* Haklar: öğün P≥8 ve K≥B (tavan B); gün P≥10 ve K≥2B (tavan 2B).
   Gün hakkı varken öğün hakkı dönmez (öğün → gün yükselmesi). */
function cheatRights(pTotal, kTotal, target){
  const B = cheatB(target);
  const day = pTotal >= CHEAT_P_DAY && kTotal >= 2 * B ? 2 * B : 0;
  const meal = day > 0 ? 0 : (pTotal >= CHEAT_P_MEAL && kTotal >= B ? B : 0);
  return { B, meal, day };
}

/* Kötü günde kaybedilen hak; öğün→gün yükselmesinde öğün düşüşü yanma sayılmaz. */
function cheatRightsLost(before, after){
  const bM = (before && before.meal) || 0, aM = (after && after.meal) || 0;
  const bD = (before && before.day) || 0, aD = (after && after.day) || 0;
  const lost = { meal: 0, day: 0 };
  const upgraded = aD > bD && bM > aM;
  if (!upgraded && bM > aM) lost.meal = bM - aM;
  if (bD > aD) lost.day = bD - aD;
  return lost;
}

/* Hesap: gün türü ve hak değişimine göre immune güncelle. */
function cheatAccountAfterDay(account, beforeRights, afterRights, dayKind){
  const base = { meal: 0, day: 0, immune: { meal: 0, day: 0 }, ...(account || {}) };
  const lost = cheatRightsLost(beforeRights, afterRights);
  return { ...base, immune: cheatImmuneAfterBad(base, dayKind, lost) };
}

/* Yanmaz hak: kötü günde harcanmayan kredi (kayıtta immune alanında tutulur). */
function cheatImmuneAfterBad(account, kind, lost){
  const a = { meal: 0, day: 0, ...(account && account.immune) };
  if (kind === "ok" || !lost) return a;
  if (lost.meal) a.meal = Math.max(a.meal, lost.meal);
  if (lost.day) a.day = Math.max(a.day, lost.day);
  return a;
}

/* Yükselme: birikmiş P eşikleri. */
function cheatLevel(pTotal){
  if (pTotal >= 60) return 3;
  if (pTotal >= 30) return 2;
  if (pTotal >= 10) return 1;
  return 0;
}

function cheatEditable(day, nowDay){
  nowDay = nowDay || today4();
  if (day > nowDay) return false;
  return day >= shiftDays(nowDay, -(CHEAT_EDIT_DAYS - 1));
}

function cheatUseReady(lastUseDay, nowDay){
  nowDay = nowDay || today4();
  if (!lastUseDay) return true;
  return shiftDays(lastUseDay, CHEAT_USE_WAIT) <= nowDay;
}

/* Kullanım: puan ve kredi düşülür; yanıt beklemesi başlar. */
function cheatSpend(account, kind, target){
  const B = cheatB(target);
  const costK = kind === "day" ? 2 * B : B;
  const costP = kind === "day" ? CHEAT_P_DAY : CHEAT_P_MEAL;
  const a = { P: 0, K: 0, meal: 0, day: 0, immune: { meal: 0, day: 0 }, lastUse: null, ...(account || {}) };
  const imm = a.immune || { meal: 0, day: 0 };
  const poolK = a.K + (kind === "day" ? imm.day : imm.meal);
  const poolP = a.P;
  if (poolP < costP || poolK < costK) return null;
  return {
    ...a,
    P: poolP - costP,
    K: Math.max(0, a.K - Math.max(0, costK - (kind === "day" ? imm.day : imm.meal))),
    immune: {
      meal: kind === "meal" ? Math.max(0, imm.meal - Math.min(imm.meal, costK)) : imm.meal,
      day: kind === "day" ? Math.max(0, imm.day - Math.min(imm.day, costK)) : imm.day
    },
    lastUse: today4()
  };
}

/* lose / maintain, yaş ≥18, sağlık işareti kapalı (profile.healthFlag yok ya da false). */
function cheatEligible(profile, now = new Date()){
  if (!profile || typeof profile !== "object") return false;
  if (profile.goal !== "lose" && profile.goal !== "maintain") return false;
  const age = typeof profileAge === "function" ? profileAge(profile, now) : profile.age;
  if (typeof age !== "number" || age < 18) return false;
  if (profile.healthFlag) return false;
  return true;
}

/* Bir günün P ve K'si (geçmiş günlerde K %90). */
function cheatDayScore(entry, mealIds, band, target, day, nowDay){
  nowDay = nowDay || today4();
  const kind = cheatDayKind(entry, mealIds, band);
  const retro = day < nowDay || !!(entry && entry.late);
  const kcal = entry && typeof entry.kcal === "number" ? entry.kcal : null;
  return {
    kind,
    P: cheatP(kind),
    K: cheatKDay(kcal, target, kind, retro)
  };
}

/* Dönem özeti: düzenlenebilir 7 gün; P toplamı, K havuzu, hak ve seviye. */
function cheatPeriod(days, mealIds, target, bandsByDay, nowDay){
  nowDay = nowDay || today4();
  const keys = Object.keys(days || {}).sort().filter(k => cheatEditable(k, nowDay));
  let pSum = 0;
  const kParts = [];
  for (const k of keys){
    const band = (bandsByDay && bandsByDay[k]) || {};
    const sc = cheatDayScore(days[k], mealIds, band, target, k, nowDay);
    pSum += sc.P;
    kParts.push(sc.K);
  }
  const K = cheatKTotal(kParts);
  const rights = cheatRights(pSum, K, target);
  return { P: pSum, K, level: cheatLevel(pSum), ...rights };
}