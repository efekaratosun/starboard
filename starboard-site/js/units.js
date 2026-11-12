"use strict";

/* ---------------- birimler ----------------
   Kayıtta her değer metrik durur: vücut ağırlığı ve kaldırılan ağırlık kg, boy ve
   vücut ölçüleri cm, su ml. Kullanıcı "imperial" seçtiyse değerler yalnızca ekrana
   yazılırken ve giriş alanından okunurken çevrilir. Böylece eski kayıtlar, yedekler,
   kalori hesabı ve kişisel rekorlar birim seçiminden etkilenmez.

   Seçim profile.units içinde durur ("metric" ya da "imperial"). Seçim yoksa
   tarayıcının bölgesinden tahmin edilir: ABD, Liberya ve Myanmar imperial, gerisi metrik.
   Mesafeler (km, m) ve besin gramları her iki sistemde de metrik kalır. */
const UNIT_SYSTEMS = [["metric", "kg · cm · ml"], ["imperial", "lb · ft · fl oz"]];
const KG_PER_LB = 0.45359237, CM_PER_IN = 2.54, ML_PER_FLOZ = 29.5735295625;
const IMPERIAL_REGIONS = ["US", "LR", "MM"];

/* "en-US" -> imperial, "en-GB" / "tr-TR" / "en" -> metric */
function unitsForLocale(tag){
  const m = /^[a-z]{2,3}[-_]([a-z]{2})\b/i.exec(String(tag || ""));
  return m && IMPERIAL_REGIONS.includes(m[1].toUpperCase()) ? "imperial" : "metric";
}
/* window.STARBOARD_UNITS: testler ya da sayfayı saran kabuk sistemi dışarıdan verebilir. */
function detectUnits(){
  if (window.STARBOARD_UNITS === "metric" || window.STARBOARD_UNITS === "imperial") return window.STARBOARD_UNITS;
  const tags = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
  return unitsForLocale(tags[0]);
}

/* Geçerli sistem: kayıttaki seçim, ilk girişte ekrandaki seçim, yoksa tahmin. */
function unitSys(){
  if (typeof state !== "undefined" && state && state.profile && state.profile.units) return state.profile.units;
  if (typeof ob !== "undefined" && ob && ob.units) return ob.units;
  return detectUnits();
}
const isImp = () => unitSys() === "imperial";

/* ---- sayı biçimi: Türkçede ondalık virgül, İngilizcede nokta ---- */
const decSep = () => LANG === "tr" ? "," : ".";
const fmtN = v => String(v).replace(".", decSep());
/* Sabit ondalık: 75 -> "75,0" */
const fmtFix = (v, d) => v.toFixed(d).replace(".", decSep());
const kg1 = v => fmtFix(v, 1);

/* ---- ağırlık (vücut ve kaldırılan) ---- */
const wUnit = () => isImp() ? "lb" : "kg";
const wOut = kg => isImp() ? kg / KG_PER_LB : kg;
const wIn = v => isImp() ? v * KG_PER_LB : v;
/* Vücut ağırlığı: ekranda bir ondalık. "75,3 kg" / "166.0 lb" */
const wNum = kg => kg1(wOut(kg));
const fmtW = kg => `${wNum(kg)} ${wUnit()}`;
/* Tam sayıya yuvarlanmış: sınır ve aralık metinleri için. "30 kg" / "66 lb" */
const fmtW0 = kg => `${Math.round(wOut(kg))} ${wUnit()}`;
/* Girilen vücut ağırlığını kaydedilecek kg değerine çevirir. Metrikte 0,1 kg'a yuvarlanır;
   imperialde daha ince tutulur ki 180 lb yazan kişi geri 179,9 lb görmesin. */
const wSave = v => isImp() ? Math.round(v * KG_PER_LB * 1000) / 1000 : Math.round(v * 10) / 10;

/* Kaldırılan ağırlık: gereksiz ondalık yok. "60 kg", "135 lb", "22,5 kg" */
const liftOut = kg => isImp() ? +(kg / KG_PER_LB).toFixed(1) : kg;
const liftIn = v => isImp() ? Math.round(v * KG_PER_LB * 10000) / 10000 : v;
const fmtLift = kg => fmtN(liftOut(kg));
/* Antrenman ekranındaki ± adımı: 2,5 kg ya da 5 lb */
const liftStep = () => isImp() ? 5 : 2.5;

/* ---- uzunluk (boy ve vücut ölçüleri) ---- */
const lUnit = () => isImp() ? "in" : "cm";
const lOut = cm => isImp() ? +(cm / CM_PER_IN).toFixed(1) : cm;
const lIn = v => isImp() ? Math.round(v * CM_PER_IN * 100) / 100 : v;
/* Boy: "178 cm" ya da 5′10″ */
function fmtHeight(cm){
  if (!isImp()) return `${fmtN(+(+cm).toFixed(1))} cm`;
  const t = Math.round(cm / CM_PER_IN);
  return `${Math.floor(t / 12)}′${t % 12}″`;
}
/* Boy imperialde ayak ve inç olarak iki ayrı alandan girilir. */
const heightFtIn = cm => { const t = Math.round(cm / CM_PER_IN); return [Math.floor(t / 12), t % 12]; };
const heightFromFtIn = (ft, inch) => Math.round(((ft || 0) * 12 + (inch || 0)) * CM_PER_IN * 10) / 10;

/* ---- hacim (su) ---- */
const vUnit = () => isImp() ? "fl oz" : "ml";
const vOut = ml => isImp() ? Math.round(ml / ML_PER_FLOZ) : Math.round(ml);
const vIn = v => Math.round(isImp() ? v * ML_PER_FLOZ : v);
const fmtV = ml => `${vOut(ml)} ${vUnit()}`;
/* Bir bardak: 250 ml ya da 8 fl oz. Hızlı ekleme düğmeleri bardağın 1, 2 ve 4 katı. */
const cupMl = () => isImp() ? 8 * ML_PER_FLOZ : 250;
/* Dolu bardak sayısı; imperial bardak tam sayı ml olmadığı için yarım ml pay bırakılır. */
const cupsOf = ml => Math.floor(((ml || 0) + 0.5) / cupMl());
