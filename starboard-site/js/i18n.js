"use strict";

/* ---------------- dil ----------------
   Kaynak dil Türkçedir: kodda metinler Türkçe yazılır ve t("...") içine alınır.
   Başka bir dil seçiliyse t() aynı metni o dilin sözlüğünde (js/lang/*.js) arar;
   bulamazsa Türkçesini gösterir ve eksik listesine yazar. Dil değişince sayfa
   yeniden yüklenir, çünkü bazı metinler yükleme anında hazırlanır. */
const LANGS = [["tr", "Türkçe"], ["en", "English"]];
const LOCALES = { tr:"tr-TR", en:"en-US" };
const LANG_KEY = "starboard-lang";
const I18N = { en: window.STARBOARD_EN || {} };
const I18N_MISSING = new Set();

let LANG = "tr";
try { const saved = localStorage.getItem(LANG_KEY); if (saved && LOCALES[saved]) LANG = saved; } catch(e){}
document.documentElement.lang = LANG;

function t(s, vars){
  let out = s;
  if (LANG !== "tr"){
    const d = I18N[LANG];
    if (d && Object.prototype.hasOwnProperty.call(d, s)) out = d[s];
    else I18N_MISSING.add(s);
  }
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  return out;
}

const locale = () => LOCALES[LANG] || "tr-TR";

function setLang(l){
  if (!LOCALES[l] || l === LANG) return;
  try { localStorage.setItem(LANG_KEY, l); } catch(e){}
  location.reload();
}
