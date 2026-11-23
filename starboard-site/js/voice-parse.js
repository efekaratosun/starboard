"use strict";

/* ---------------- konuşmadan besin listesi ----------------
   "iki yumurta, beş zeytin, bir dilim beyaz peynir yedim" gibi serbest bir cümleyi
   besin listesine çevirir. Tamamen cihazda çalışır, ağa çıkmaz ve başka dosyaya bağımlı
   değildir: besin listesi (foods: [[anahtar, besin], ...]) dışarıdan verilir.

   parseMeal(metin, foods, { usage(k), pop(k) }) →
     { items: [{ raw, qty, unit, key, name, g, conf, alts, approx, dropped }] }
   conf "high": uygulama emin; "low": kullanıcıya sorulmalı (alts aday listesi, ilki öneri).
   key null: hiçbir besin bulunamadı (raw gösterilir, kullanıcı elle arar).
   Yazıya çevirme (SFSpeechRecognizer ya da klavye) bu dosyanın işi değildir. */

const vpFold = s => String(s || "").toLowerCase()
  .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
  .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
  .normalize("NFD").replace(/[̀-ͯ]/g, "");

const VP_NUM = { bir:1, bi:1, iki:2, uc:3, dort:4, bes:5, alti:6, yedi:7, sekiz:8, dokuz:9, on:10,
  yarim:0.5, ceyrek:0.25 };
const VP_TENS = { on:10, yirmi:20, otuz:30, kirk:40, elli:50, altmis:60, yetmis:70, seksen:80, doksan:90 };
const VP_STOP = new Set(["yedim","yedik","yiyorum","yerim","ictim","icti","ictik","aldim","tukettim",
  "kahvaltida","oglen","oglende","aksam","aksamda","icin","falan","filan","ben","bugun","sabah",
  "de","da","ayrica","yaklasik","civari","kadar"]);
const VP_SPLIT = /\s*(?:[,;.]|\bve de\b|\bbir de\b|\bbirde\b|\bve\b|\bile\b|\bsonra\b|\bardindan\b|\bayrica\b)\s*/;

/* İki sözcüklü birimler önce denenir. */
const VP_UNIT2 = { "yemek kasigi":"yk", "tatli kasigi":"tk", "cay kasigi":"ck", "su bardagi":"bardak",
  "cay bardagi":"cbardak", "kibrit kutusu":"kibrit" };
const VP_UNIT1 = { adet:"adet", tane:"adet", dilim:"dilim", kase:"kase", kasik:"kasik", kasigi:"kasik",
  bardak:"bardak", bardagi:"bardak", fincan:"fincan", tabak:"tabak", porsiyon:"porsiyon", avuc:"avuc",
  kutu:"kutu", paket:"paket", parca:"parca", olcek:"olcek", kepce:"kepce", sise:"sise",
  gram:"g", gr:"g", g:"g", ml:"ml", kilo:"kg", kg:"kg", litre:"l", lt:"l" };

/* Besin adındaki sözcüğe gelebilecek Türkçe ekler (ı→i, ü→u, ö→o ile sadeleşmiş). */
const VP_EK = new Set(["i","u","a","e","yi","yu","ya","ye","in","un","an","en","nin","nun","ni","nu","na","ne",
  "si","su","li","lu","la","le","yla","yle","ler","lar","leri","lari","lerin","larin","den","dan","ten","tan",
  "de","da","te","ta","ini","unu","ina","une","ina","ile","ci","cu"]);

function vpWordMatch(tok, word){
  if (tok === word) return true;
  if (word.length < 3) return false;
  /* Ünsüz yumuşaması: ekmek → ekmegi, kurabiye → ..., çorap → çorabı. */
  const w2 = /[kp]$/.test(word) ? word.slice(0, -1) + (word.endsWith("k") ? "g" : "b") : null;
  for (const w of w2 ? [word, w2] : [word]){
    if (tok.length > w.length && tok.startsWith(w) && VP_EK.has(tok.slice(w.length))) return true;
  }
  return false;
}

const VP_CACHE = new WeakMap();
function vpWords(f){
  let c = VP_CACHE.get(f);
  if (c) return c;
  const req = vpFold(String(f.n || "").replace(/\(.*?\)/g, " ")).split(/[^a-z0-9]+/).filter(Boolean);
  const opt = vpFold((String(f.n || "").match(/\((.*?)\)/g) || []).join(" ")).split(/[^a-z0-9]+/).filter(Boolean);
  /* Takma ad virgülle birden çok ifade olabilir: "peynir, peynir inek". */
  const phrases = vpFold(f.a || "").split(/[,;]/).map(p => p.split(/[^a-z0-9]+/).filter(Boolean)).filter(p => p.length);
  const alias = phrases.flat();
  c = { req, opt, alias, phrases };
  VP_CACHE.set(f, c);
  return c;
}

/* Sözcük kümesinin bir besine ne kadar uyduğu; 0 = uymuyor. Tam ad eşleşmesi en yüksek. */
function vpScore(toks, f){
  const w = vpWords(f);
  const name = [...w.req, ...w.opt];
  const all = toks.every(t => name.some(x => vpWordMatch(t, x)));
  if (all){
    const covered = w.req.filter(x => toks.some(t => vpWordMatch(t, x))).length;
    const extra = w.req.length - covered;
    const optLeft = w.opt.filter(x => !toks.some(t => vpWordMatch(t, x))).length;
    const byName = extra === 0 ? 100 - 2 * Math.min(optLeft, 3) : Math.max(10, 60 - 6 * extra);
    /* Takma ad tam tutuyorsa ("köfte" → Izgara köfte) adın kısmi eşleşmesinden güçlüdür. */
    const aliasEq = w.phrases.some(p => p.length === toks.length && toks.every(t => p.some(x => vpWordMatch(t, x))));
    return aliasEq && byName < 90 ? 75 : byName;
  }
  const viaAlias = toks.every(t => name.some(x => vpWordMatch(t, x)) || w.alias.some(x => vpWordMatch(t, x)));
  if (viaAlias && w.alias.length){
    const eq = w.phrases.some(p => p.length === toks.length && toks.every(t => p.some(x => vpWordMatch(t, x))));
    return eq ? 75 : 65;
  }
  return 0;
}

/* Bir parçadaki sayı ve birimi ayıklar, kalan sözcükler besin adıdır. */
function vpQuantity(tokens){
  const rest = tokens.slice();
  let qty = null, unit = null;
  for (let i = 0; i < rest.length; i++){
    const t = rest[i];
    let q = null, len = 1;
    const m = /^(\d+(?:[.,]\d+)?)(g|gr|gram|ml)?$/.exec(t);
    if (m){ q = parseFloat(m[1].replace(",", ".")); if (m[2]) { qty = q; unit = m[2] === "ml" ? "ml" : "g"; rest.splice(i, 1); break; } }
    else if (t in VP_TENS && VP_NUM[rest[i + 1]] && VP_NUM[rest[i + 1]] < 10 && rest[i + 1] !== "yarim"){ q = VP_TENS[t] + VP_NUM[rest[i + 1]]; len = 2; }
    else if (t in VP_TENS && t !== "on"){ q = VP_TENS[t]; }
    else if (t in VP_NUM){ q = VP_NUM[t]; }
    if (q === null) continue;
    let j = i + len;
    if (rest[j] === "bucuk"){ q += 0.5; j++; }
    qty = q;
    const two = rest[j] && rest[j + 1] ? VP_UNIT2[rest[j] + " " + rest[j + 1]] : null;
    if (two){ unit = two; j += 2; }
    else if (rest[j] && VP_UNIT1[rest[j]]){ unit = VP_UNIT1[rest[j]]; j++; }
    rest.splice(i, j - i);
    break;
  }
  return { qty, unit, rest };
}

/* Birim adı ve miktardan gram. approx: istenen birim besinde tanımlı değil, 1 porsiyon varsayıldı. */
function vpGrams(f, qty, unit){
  const q = qty == null ? 1 : qty;
  if (unit === "g" || unit === "ml") return { g: q, approx: false };
  if (unit === "kg" || unit === "l") return { g: q * 1000, approx: false };
  const por = !f || !f.por ? [] : Array.isArray(f.por) ? f.por : [f.por];
  const base = f && f.unit ? f.unit : por.length ? por[0].g : 100;
  if (!unit){
    /* "iki köfte": sayı varsa porsiyon değil tek parça (adet) kastedilir. */
    const piece = qty != null && !(f && f.unit) ? por.find(p => vpFold(p.n) === "adet") : null;
    return { g: Math.round(q * (piece ? piece.g : base) * 10) / 10, approx: false };
  }
  const has = w => por.find(p => vpFold(p.n).includes(w));
  let g = null;
  if (unit === "adet"){
    if (f && f.unit) g = f.unit;
    else { const p = has("adet") || has("parca"); if (p) g = p.g; }
  } else if (unit === "kasik"){ const p = has("yemek kasigi") || has("kasik"); if (p) g = p.g; }
  else if (unit === "yk"){ const p = has("yemek kasigi"); if (p) g = p.g; }
  else if (unit === "tk"){ const p = has("tatli kasigi"); if (p) g = p.g; }
  else if (unit === "ck"){ const p = has("cay kasigi"); if (p) g = p.g; }
  else if (unit === "bardak" || unit === "cbardak"){ const p = has("bardak"); if (p) g = p.g; }
  else if (unit === "kibrit"){ const p = has("kibrit"); if (p) g = p.g; }
  else { const p = has(unit); if (p) g = p.g; }
  if (g === null) return { g: Math.round(q * base * 10) / 10, approx: true };
  return { g: Math.round(q * g * 10) / 10, approx: false };
}

const vpIsNum = t => /^d+(?:[.,]d+)?$/.test(t) || t in VP_NUM || t in VP_TENS || t === "bucuk";

/* Sayı yeni bir besinin başladığını gösterir: "iki yumurta beş zeytin" iki parça olur. */
function vpSplitNumbers(toks){
  const out = []; let cur = [], food = false;
  for (const t of toks){
    if (vpIsNum(t) && food){ out.push(cur); cur = []; food = false; }
    cur.push(t);
    if (!vpIsNum(t) && !VP_UNIT1[t] && !VP_UNIT2[t]) food = true;
  }
  if (cur.length) out.push(cur);
  return out;
}

const vpBest = (toks, foods) => { let b = 0; for (const [, f] of foods){ const v = vpScore(toks, f); if (v > b) b = v; } return b; };

/* "domates salatalık": bütünü eşleşmiyorsa soldan en uzun tam eşleşen parçalara bölünür. */
/* "yumurtalı omlet": -lı/-siz ekli sözcük niteleyicidir, ayrı besin sayılmaz. */
const vpMod = t => t.length > 4 && /(?:li|lu|siz|suz)$/.test(t);

function vpSplitFoods(words, foods){
  if (words.length < 2 || vpBest(words, foods) >= 90) return [words];
  const out = []; let i = 0;
  if (words.length > 1 && vpMod(words[0]) && vpBest(words.slice(1), foods) >= 90) return [words.slice(1).concat([])].map(w => Object.assign(w, { mod: true }));
  while (i < words.length){
    let len = 0;
    for (let n = words.length - i; n >= 1; n--){
      if (vpBest(words.slice(i, i + n), foods) >= 90){ len = n; break; }
    }
    if (!len) return [words];
    out.push(words.slice(i, i + len)); i += len;
  }
  return out;
}

function parseMeal(text, foods, opts){
  const o = opts || {};
  const usage = o.usage || (() => 0), pop = o.pop || (() => 0);
  const parts = vpFold(text).split(VP_SPLIT).map(s => s.trim()).filter(Boolean);
  const items = [];
  let last = null;
  const resolve = (raw, qty, unit, words) => {
    /* Hiçbir besinde karşılığı olmayan sözcük ("haşladım") gürültüdür, atılır. */
    const known = words.filter(t => foods.some(([, f]) => vpScore([t], f) > 0));
    const dropped = known.length < words.length || !!words.mod;
    const none = { raw, qty, unit, key:null, name:"", g:0, conf:"low", alts:[], approx:false, dropped };
    if (!known.length) return none;
    if (known.every(t => vpWordMatch(t, "su") || ["sade", "maden", "icme"].includes(t)) && known.some(t => vpWordMatch(t, "su"))){
      const ml = { cbardak:100, fincan:100, sise:500, kase:250, tabak:250 };
      const per = unit === "l" || unit === "kg" ? 1000 : unit === "ml" || unit === "g" ? 1 : ml[unit] || 200;
      const v = Math.round((qty == null ? 1 : qty) * per);
      return { raw, qty, unit, key:"__su", name:"Su", water:true, ml:v, g:v, conf:"high", alts:[], approx:false, dropped:false };
    }
    const rows = foods.map(([k, f]) => [k, f, vpScore(known, f)]).filter(r => r[2] > 0);
    if (!rows.length) return none;
    const top = Math.max(...rows.map(r => r[2]));
    /* İstenen birim (dilim, kase…) besinde tanımlıysa o aday öne geçer: "bir dilim ekmek" → Beyaz ekmek. */
    const fit = r => (unit && !vpGrams(r[1], qty, unit).approx) ? 1 : 0;
    const pool = rows.filter(r => r[2] >= top - 30)
      .sort((a, b) => (usage(b[0]) - usage(a[0])) || (fit(b) - fit(a)) || (Math.floor(b[2] / 6) - Math.floor(a[2] / 6)) || (pop(b[0]) - pop(a[0])) || (b[2] - a[2]) || a[1].n.length - b[1].n.length);
    const used = pool.filter(r => usage(r[0]) > 0);
    /* Bir aday açık ara öndeyse (tam ad eşleşmesi) ya da yalnız biri daha önce yenmişse emin. */
    const lead = (top >= 90 && rows.filter(r => r[2] > top - 2).length === 1)
      /* Takma adı tam tutan ve ötekilerden belirgin öndeki aday ("köfte" → Izgara köfte). */
      || (top >= 70 && rows.filter(r => r[2] > top - 12).length === 1);
    const one = (pool.length === 1 && top >= 90) || lead || used.length === 1;
    const pick = lead && !used.length ? rows.find(r => r[2] === top) : pool[0];
    const mk = r => ({ key: r[0], name: r[1].n, ...vpGrams(r[1], qty, unit) });
    const g = mk(pick);
    return { raw, qty, unit, key: pick[0], name: pick[1].n, g: g.g, approx: g.approx, dropped,
      conf: one && !words.mod ? "high" : "low", alts: one && !words.mod ? [] : pool.slice(0, 4).map(mk) };
  };
  for (const part of parts){
    const toks = part.split(/[^a-z0-9.,]+/).filter(t => t && !VP_STOP.has(t));
    for (const seg of vpSplitNumbers(toks)){
      const { qty, unit, rest } = vpQuantity(seg);
      const words = rest.map(t => t.replace(/[.,]+$/, "")).filter(Boolean);
      /* "yumurtayı yedim iki tane": miktar besinden sonra geldi, öncekine eklenir. */
      if (!words.length){
        if (qty != null && last && last.qty == null){ items[items.length - 1] = resolve(last.raw, qty, unit, last.words); last = null; }
        continue;
      }
      const raw = seg.join(" ");
      vpSplitFoods(words, foods)
        .forEach((w, n) => {
          items.push(resolve(n ? w.join(" ") : raw, n ? null : qty, n ? null : unit, w));
          last = { raw: n ? w.join(" ") : raw, qty: n ? null : qty, words: w };
        });
    }
  }
  return { items };
}
