"use strict";

/* ---------------- dil ----------------
   Kaynak dil Türkçedir: kodda metinler Türkçe yazılır ve tx("...") içine alınır.
   Değişken içeren metinlerde yer tutucu kullanılır: tx("{0} tarif bulundu", [n]).
   Başka bir dil seçiliyse tx() aynı metni o dilin sözlüğünde (js/lang/*.js) arar;
   bulamazsa Türkçesini gösterir ve eksik listesine yazar. Dil değişince sayfa
   yeniden yüklenir, çünkü bazı metinler yükleme anında hazırlanır. */
/* İngilizce "beta": arayüz çevrildi, içerik (besinler, tarifler, hareketler) henüz Türkçe. */
const LANGS = [["tr", "Türkçe"], ["en", "English (beta)"]];
const LOCALES = { tr:"tr-TR", en:"en-US" };
const LANG_KEY = "starboard-lang";
const I18N = { en: window.STARBOARD_EN || {} };
const I18N_MISSING = new Set();

let LANG = "tr";
try { const saved = localStorage.getItem(LANG_KEY); if (saved && LOCALES[saved]) LANG = saved; } catch(e){}
document.documentElement.lang = LANG;

function tx(s, vars){
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

/* ---- hareket metinleri ----
   Hareket adları ve antrenman satırları ("Omuz press 3×10 · 20 dk koşu") kodda ve
   kayıtlarda Türkçe kalır: ayrıştırma, rehber eşleşmesi ve kişisel rekorlar bu
   metinlere bağlıdır. Yalnızca ekrana yazılırken exText() ile çevrilir.
   Sözlük (js/lang/en-workout.js) ad ve kelime düzeyindedir; metin soldan sağa
   taranır ve en uzun eşleşen ad ya da kelime karşılığıyla değiştirilir. */
const I18N_EX = { en: window.STARBOARD_EN_EX || {} };
let EX_KEYS = null;
const isLetter = ch => !!ch && /[A-Za-zÇĞİÖŞÜçğıöşüâîû]/.test(ch);

function exText(s){
  if (LANG === "tr" || !s) return s;
  const dict = I18N_EX[LANG];
  if (!dict) return s;
  if (!EX_KEYS){
    EX_KEYS = Object.keys(dict).map(k => [k.toLocaleLowerCase("tr"), dict[k]]).sort((a, b) => b[0].length - a[0].length);
  }
  const src = String(s), low = src.toLocaleLowerCase("tr");
  if (low.length !== src.length) return src;      /* güvenlik: konumlar kaymasın */
  let out = "", i = 0;
  while (i < src.length){
    let hit = null;
    if (!isLetter(src[i - 1]) && isLetter(src[i])){
      for (const [k, v] of EX_KEYS){
        if (low.startsWith(k, i) && !isLetter(src[i + k.length])){ hit = [k, v]; break; }
      }
    }
    if (hit){
      /* Kaynak küçük harfle başlıyorsa karşılığı da küçük harfle başlar. */
      const lower = src[i] === low[i] && src[i] !== src[i].toLocaleUpperCase("tr");
      out += lower ? hit[1][0].toLowerCase() + hit[1].slice(1) : hit[1];
      i += hit[0].length;
    } else { out += src[i]; i++; }
  }
  /* "1TM" (tek tekrar maksimumu) rakamla başladığı için kelime taramasına girmez. */
  return out.replace(/\b1TM\b/g, "1RM");
}

function setLang(l){
  if (!LOCALES[l] || l === LANG) return;
  try { localStorage.setItem(LANG_KEY, l); } catch(e){}
  location.reload();
}
