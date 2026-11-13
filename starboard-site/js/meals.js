"use strict";

/* ---- beslenme ---- */
const norm = s => s.toLowerCase()
  .replace(/ı/g,"i").replace(/ş/g,"s").replace(/ğ/g,"g")
  .replace(/ü/g,"u").replace(/ö/g,"o").replace(/ç/g,"c")
  /* "İ".toLowerCase() geriye i + birleşik nokta bırakıyor; ayrıştırıp temizliyoruz. */
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"");

function allFoods(){
  return Object.entries(FOODS).concat(Object.entries(state.customFoods || {}));
}

function logTotals(entry){
  const t = { kcal:0, p:0, c:0, f:0, lif:0 };
  const micros = new Set();
  for (const it of (entry.log || [])){
    t.p += it.p * it.g/100; t.c += it.c * it.g/100; t.f += it.f * it.g/100;
    t.lif += (it.lif || 0) * it.g/100;
    (it.v || []).forEach(x => micros.add(x));
  }
  t.kcal = t.p*4 + t.c*4 + t.f*9;
  return { kcal:Math.round(t.kcal), p:Math.round(t.p), c:Math.round(t.c),
           f:Math.round(t.f), lif:Math.round(t.lif), micros };
}

/* Lif için yaygın referans: 1000 kcal başına ~14 g. */
const fiberTarget = program => Math.round(program.kcal / 1000 * 14);

/* Günlükte kayıt varsa günün kalorisi oradan gelir; elle girilen değeri ezer. */
function syncKcal(entry){
  if (entry.log && entry.log.length){ entry.kcal = logTotals(entry).kcal; delete entry.kcalManual; }
  else if (entry.logCleared) { delete entry.kcal; delete entry.logCleared; delete entry.kcalManual; }
}

function mealsView(program){
  const entry = ensureDay(vKey());
  const body = mealTab === "plan" ? planView(program)
             : mealTab === "log" ? logView(program, entry)
             : mealTab === "list" ? shoppingView(program)
             : recipesView();
  return `<div class="seg">
    ${[["log",tx("Günlüğüm")],["plan",tx("Öneriler")],["recipes",tx("Tarifler")],["list",tx("Liste")]].map(([k,l]) =>
      `<button data-meal-tab="${k}" aria-current="${mealTab===k}">${l}</button>`).join("")}
  </div>` + body;
}

/* Tarif makroları malzemelerden hesaplanıyor, ayrıca girilmiyor. */
function recipeMacros(r){
  let g = 0, p = 0, c = 0, f = 0, lif = 0;
  const v = new Set();
  for (const [k, grams] of r.ing){
    const food = FOODS[k];
    if (!food) continue;
    g += grams;
    p += food.p*grams/100; c += food.c*grams/100; f += food.f*grams/100; lif += (food.lif||0)*grams/100;
    (food.v || []).forEach(x => v.add(x));
  }
  const srv = r.srv || 1;
  return {
    gPer: Math.round(g / srv),
    per100: { p: p/g*100, c: c/g*100, f: f/g*100, lif: lif/g*100 },
    serving: { kcal:Math.round((p*4+c*4+f*9)/srv), p:Math.round(p/srv), c:Math.round(c/srv),
               f:Math.round(f/srv), lif:Math.round(lif/srv) },
    v: [...v]
  };
}

function recipeCard(r, idx){
  const m = recipeMacros(r);
  const open = recipeOpen === idx;
  return `<section>
    <div class="item rec" data-recipe="${idx}">${iconBox(r.i)}
      <div class="item-main"><h3>${r.n}</h3>
        <p>${tx("{0} · {1} porsiyon · P{2} K{3} Y{4} · lif {5} g", [(exText(r.t)), (r.srv), (m.serving.p), (m.serving.c), (m.serving.f), (m.serving.lif)])}</p></div>
      <span class="k num">${tx("{0} kcal", [(m.serving.kcal)])}</span>
    </div>
    ${open ? `<div class="rec-body">
      <h4>${tx("Malzemeler ({0} porsiyon)", [(r.srv)])}</h4>
      ${r.ing.map(([k,g]) => { const f = FOODS[k]; return f
        ? `<div class="rec-ing"><span>${f.n}</span><span>${f.unit ? `${Math.round(g/f.unit)} ${f.unitName}` : `${g} g`}</span></div>` : ""; }).join("")}
      <h4>${tx("Hazırlanışı")}</h4>
      <ol>${r.steps.map(s => `<li>${s}</li>`).join("")}</ol>
      <button class="ghost" data-recipe-add="${idx}" style="margin-top:6px">${tx("Günlüğüme 1 porsiyon ekle")}</button>
      ${recipeListBtn(idx)}
    </div>` : ""}
  </section>`;
}

/* Arama boşken üç tarif gösteriyoruz; "başka tarifler" listeyi kaydırıyor. */
/* Tarifin türü de aranabilsin: "balık" yazınca hamsi ve somon tarifleri de çıksın. */
const CAT_WORDS = { fish:tx("balık deniz ürünü"), poultry:tx("tavuk kümes beyaz et"), meat:tx("et kırmızı et kıyma"),
  legume:"baklagil bakliyat", veg:tx("sebze zeytinyağlı"), grain:tx("tahıl hamur pilav"),
  dairy:tx("süt ürünü yoğurt"), egg:tx("yumurta kahvaltı"), nuts:tx("kuruyemiş"), potato:"patates", bread:"hamur", fruit:tx("meyve tatlı") };

const recipeFits = r => recipeAllowed(r, currentDiet());

/* Parantezli ekleri at: "Pilav (pişmiş)" → "pilav" */
const plainName = n => norm(n.replace(/\s*\(.*?\)/g, "").trim());

/* Bir besin için tarif bağlantısı: kendisi bir yemekse o tarif,
   değilse onu malzeme olarak kullanan tarifler. */
function recipeFor(key){
  const f = foodOf(key);
  if (!f) return null;
  const n = plainName(f.n);
  if (n.length < 3) return null;
  /* Sadece tam ad eşleşmesi "bu besinin tarifi" sayılır. Alt dize eşleşmesi
     "Yumurta" → "Yumurtalı ıspanak" gibi yanıltıcı bağlantılar üretiyordu. */
  const idx = RECIPES.findIndex(r => plainName(r.n) === n);
  const uses = RECIPES.filter(r => r.ing.some(([k]) => k === key)).length;
  if (idx < 0 && !uses) return null;
  return { idx, uses, q: f.n.replace(/\s*\(.*?\)/g, "").trim() };
}

function recipeList(){
  const q = norm(recipeQuery.trim());
  if (q.length >= 2){
    const hits = RECIPES.map((r,i) => [r,i]).filter(([r]) =>
      matchScore(r.n, q) > 0
      || norm(CAT_WORDS[r.i] || "").includes(q)
      || r.ing.some(([k]) => FOODS[k] && norm(FOODS[k].n).includes(q)));
    if (!hits.length) return `<section><div class="empty">${tx("\"{0}\" için tarif bulunamadı. Yemek adı ya da malzeme adıyla arayabilirsin.", [(esc(recipeQuery))])}</div></section>`;
    return `<div class="metric-note" style="margin:0 4px 12px">${tx("{0} tarif bulundu", [(hits.length)])}</div>`
      + hits.map(([r,i]) => recipeCard(r,i)).join("");
  }
  /* Arama bütün tarifleri kapsar; liste yalnızca seçili mutfağınkileri gösterir. */
  const pool = RECIPES.map((r,i) => [r,i]).filter(([r]) => recipeFits(r) && cuisineOk(r));
  if (!pool.length) return `<section><div class="empty">${tx("Beslenme türüne uyan hazır tarif yok.")}</div></section>`;
  const start = recipeOffset % pool.length;
  const idxs = [0,1,2].map(k => pool[(start + k) % pool.length]);
  return (currentDiet() !== "hepsi"
      ? `<div class="metric-note" style="margin:0 4px 12px">${tx("{0} beslenmeye uyan {1} tarif", [(DIETS[currentDiet()]), (pool.length)])}</div>` : "")
    + idxs.map(([r,i]) => recipeCard(r, i)).join("")
    + `<section><button class="ghost" id="rec-more">${tx("Başka tarifler göster")}</button></section>`;
}

function recipesView(){
  return `
  <section>
    <h2>${tx("Tarifler")} <span class="count">${tx("{0} tarif", [(RECIPES.length)])}</span></h2>
    <input id="rec-q" type="text" aria-label="${tx("Tarif ara")}" placeholder="${tx("Ara: karnıyarık, mercimek, tavuk…")}" value="${esc(recipeQuery)}" autocomplete="off">  </section>
  <div id="rec-results">${recipeList()}</div>`;
}

function macroRow(label, got, target, unit, ic, color){
  return `<div class="macro">${iconBox(ic)}<div class="lbl">${label}
    <div class="mbar"><i style="width:${clamp(got/target*100,0,100)}%;background:var(--${color||"band"})"></i></div></div>
    <span class="v num">${got}${unit}<span class="tgt">/ ${target}${unit}</span></span></div>`;
}

function microSection(micros){
  const keys = Object.keys(NUTRIENTS);
  const missing = keys.filter(k => !micros.has(k));
  return fold("micro", tx("Mikro besinler"), `${keys.length - missing.length}/${keys.length}`, `
    <div class="pills">${keys.map(k => micros.has(k)
      ? `<span class="pill on"><svg class="ico"><use href="#i-check"/></svg>${NUTRIENTS[k].n}</span>`
      : `<span class="pill">${NUTRIENTS[k].n}</span>`).join("")}</div>
    ${missing.length ? `<div class="metric-note" style="margin-top:14px">
      ${missing.slice(0,4).map(k => tx("{0} için: {1}", [`<b>${NUTRIENTS[k].n}</b>`, NUTRIENTS[k].src])).join("<br>")}
    </div>` : ""}`);
}

function logView(program, entry){
  const log = entry.log || [];
  const tot = logTotals(entry);
  const fib = fiberTarget(program);

  return `
  ${favBlock(entry)}
  <section>
    <h2>${onToday() ? tx("Bugün aldığın") : tx("O gün aldığın")} <span class="count">${tx("{0} / {1} kcal", [(tot.kcal), (program.kcal)])}</span></h2>
    ${macroRow(tx("Kalori"), tot.kcal, program.kcal, "", "grain", "band")}
    ${macroRow(tx("Protein"), tot.p, program.protein, " g", "poultry", "mp")}
    ${macroRow(tx("Karbonhidrat"), tot.c, program.carb, " g", "bread", "mc")}
    ${macroRow(tx("Yağ"), tot.f, program.fat, " g", "oil", "mf")}
    ${macroRow(tx("Lif"), tot.lif, fib, " g", "veg", "ml")}
    ${tot.kcal > program.kcal * 1.1 ? `<div class="metric-note" style="margin-top:12px"><b class="out">${tx("Hedefi {0} kcal aştın.", [(tot.kcal-program.kcal)])}</b></div>`
      : tot.kcal ? `<div class="metric-note" style="margin-top:12px">${tx("Hedefe {0} kcal kaldı.", [(Math.max(program.kcal-tot.kcal,0))])}</div>` : ""}
  </section>

  ${log.length ? microSection(tot.micros) : ""}

  ${mealCards(entry)}
  ${mealManager()}
  ${savedManager()}
  <div class="foot">${tx("Değerler ortalamadır.")}</div>`;
}

/* ---- dünün aynısı ----
   Kalemler kimlikleriyle birlikte kopyalanmaz; her kopya yeni kimlik alır
   ki düzenleme ve silme iki günü birden etkilemesin. */
/* Gün değişince açık kalan besin ekleme paneli, arama ve düzenleme
   yanlış güne yazılıyormuş gibi görünüyordu; gün değiştiren yollar sıfırlar. */
function resetMealUI(){
  addOpen = null; logPick = null; logQuery = ""; logCat = null; editLog = null;
  mealAddOpen = false; saveMealOpen = null; myFoodsOpen = false; myFoodEdit = null;
}

/* ---- kayıtlı öğünler ----
   Sık yenen bir öğün (birden çok kalem) adıyla saklanır ve tek dokunuşla
   herhangi bir öğüne eklenir. Kalemlerin kaydedildiği andaki değerleri saklanır:
   kendi yiyeceğin sonradan silinse de kayıtlı öğün bozulmaz. */
let saveMealOpen = null;
const savedMeals = () => state.savedMeals || [];
const itemsKcal = items => Math.round(items.reduce((a,it) => a + (it.p*4+it.c*4+it.f*9)*it.g/100, 0));
/* Bir öğünün günlükteki kalemleri; öğünü belirtilmemiş eski kayıtlar son öğüne düşer. */
function itemsOfSlot(log, slot){
  const list = slotList(), known = new Set(list.map(([k]) => k));
  const fallback = list.length ? list[list.length-1][0] : "aksam";
  return (log || []).filter(x => { const s = x.slot || fallback; return (known.has(s) ? s : "__other") === slot; });
}
function saveMealForm(items){
  const name = items.slice(0, 2).map(it => it.n.replace(/\s*\(.*?\)/g, "")).join(", ") + (items.length > 2 ? "…" : "");
  return `<div class="pick" style="margin-top:12px">
    <div class="field"><label for="sm-name">${tx("Kayıtlı öğünün adı")}</label>
      <input id="sm-name" type="text" maxlength="40" value="${esc(name)}" autocomplete="off"></div>
    <div class="row"><button id="sm-save">${tx("Kaydet")}</button>
      <button class="ghost" id="sm-cancel" style="flex:0 0 100px">${tx("Vazgeç")}</button></div>
  </div>`;
}
function savedChips(){
  const list = savedMeals();
  if (!list.length) return "";
  return `<div class="metric-note" style="margin:0 0 8px">${tx("Kayıtlı öğünlerin")}</div>
    <div class="chips" style="margin:0 0 12px">${list.map(s =>
      `<button class="chip" data-saved-add="${s.id}">${esc(s.name)} · ${tx("{0} kcal", [(itemsKcal(s.items))])}</button>`).join("")}</div>`;
}
function savedManager(){
  const list = savedMeals();
  if (!list.length) return "";
  return `<section>
    <h2>${tx("Kayıtlı öğünler")} <span class="count">${list.length}</span></h2>
    ${list.map(s => `<div class="rt">${iconBox(s.items[0] && s.items[0].i || "grain")}
      <div class="m"><h3>${esc(s.name)}</h3><p>${tx("{0} kalem · {1} kcal", [(s.items.length), (itemsKcal(s.items))])}</p></div>
      <button class="del" data-saved-del="${s.id}" aria-label="${tx("Kayıtlı öğünü sil")}">×</button>
    </div>`).join("")}
  </section>`;
}

function ydayLog(){
  const p = state.days[shiftDays(vKey(), -1)];
  return (p && p.log) ? p.log : [];
}
function copyItems(entry, items, slot){
  entry.log = entry.log || [];
  const ids = [];
  for (const it of items){
    const id = Date.now() + Math.random();
    ids.push(id);
    entry.log.push(slot ? { ...it, id, slot } : { ...it, id });
  }
  return ids;
}

/* Her öğün kendi kartı: o öğünün kayıtları ve besin eklemesi bir arada. */
function mealCards(entry){
  const log = entry.log || [];
  const list = slotList();
  const known = new Set(list.map(([k]) => k));
  const fallback = list.length ? list[list.length-1][0] : "aksam";
  const slotOf = x => { const sId = x.slot || fallback; return known.has(sId) ? sId : "__other"; };
  const kcalOf = items => Math.round(items.reduce((a,it) => a + (it.p*4+it.c*4+it.f*9)*it.g/100, 0));

  const cards = list.map(([k,l]) => {
    const items = log.filter(x => slotOf(x) === k);
    const yIt = items.length ? [] : ydayLog().filter(x => slotOf(x) === k);
    return `<section>
      <h2>${esc(l)}${items.length ? `<span class="count">${tx("{0} kcal", [(kcalOf(items))])}</span>` : ""}</h2>
      ${items.length ? items.map(logLine).join("")
        : `<div class="empty">${tx("Bu öğüne henüz bir şey eklemedin.")}</div>`}
      ${saveMealOpen === k && items.length ? saveMealForm(items)
        : items.length >= 2 && addOpen !== k ? `<button class="link" data-savemeal="${k}" style="margin-top:10px">${tx("Bu öğünü kaydet")}</button>` : ""}
      ${addOpen === k ? addPanel()
        : `<button class="ghost" data-addfood="${k}" style="margin-top:12px">${tx("Besin ekle")}</button>
           ${yIt.length ? `<button class="ghost rep" data-copymeal="${k}" style="margin-top:8px">
             ${tx("↺ {0} aynı ({1} kalem · {2} kcal)", [(onToday() ? tx("Dünküyle") : tx("Bir önceki günle")), (yIt.length), (kcalOf(yIt))])}</button>` : ""}`}
    </section>`;
  });

  const other = log.filter(x => slotOf(x) === "__other");
  if (other.length) cards.push(`<section>
    <h2>${tx("Diğer")} <span class="count">${tx("{0} kcal", [(kcalOf(other))])}</span></h2>
    ${other.map(logLine).join("")}  </section>`);

  return cards.join("");
}

/* ---- kendi yiyeceklerim ----
   Günlük kalemleri eklendikleri andaki değerleri (ad, makrolar, lif, mikro besinler)
   kendi içinde taşır; k yalnızca "sık yediklerin" ve porsiyon ölçüsü içindir. Bu yüzden
   bir yiyeceği düzenlemek ya da silmek geçmiş günleri değiştirmez ve şema sürümü artmaz.
   Silinen yiyeceğin geçmiş kalemlerinde ad ve değerler durur, yalnızca porsiyon
   ölçüsü ("2 dilim") yerine gram yazılır. */
let myFoodsOpen = false, myFoodEdit = null;
const myFoodList = () => Object.entries(state.customFoods || {}).filter(([, f]) => f && typeof f.n === "string")
  .sort((a, b) => a[1].n.localeCompare(b[1].n, locale()));

function myFoodPre(key){
  const f = (state.customFoods || {})[key];
  return { edit: key, bc: f.bc, n: f.n, p: f.p, c: f.c, f: f.f, lif: f.lif, cancel: true,
    title: f.bc ? tx("Barkod {0}", [esc(f.bc)]) : null };
}

function myFoodsHTML(){
  return myFoodList().map(([k, f]) => {
    const open = myFoodEdit === k;
    return `<div class="item mf-row">${iconBox(f.i || "grain")}
      <button class="item-main tap" data-mf-edit="${esc(k)}" aria-expanded="${open}" aria-label="${esc(f.n)}, ${tx("Düzenle")}">
        <h3>${esc(f.n)}${f.bc ? `<span class="bc-mark" role="img" aria-label="${tx("Barkodlu ürün")}">${icon("barcode")}</span>` : ""}</h3>
        <p>${f.br ? esc(f.br) + " · " : ""}${tx("100 g: {0} kcal", [(Math.round(f.p*4+f.c*4+f.f*9))])}</p></button>
      <button class="del" data-mf-del="${esc(k)}" aria-label="${esc(f.n)}, ${tx("Sil")}">×</button>
    </div>${open ? `<div id="mf-edit">${customFoodForm(myFoodPre(k))}</div>` : ""}`;
  }).join("");
}

function myFoodsBlock(){
  if (!myFoodList().length) return "";
  return `<button class="ghost" id="mf-toggle" aria-expanded="${myFoodsOpen}" style="margin-top:10px">${tx("Kendi yiyeceklerim")}</button>
    ${myFoodsOpen ? `<div id="mf-box">${myFoodsHTML()}</div>` : ""}`;
}

/* Başka bir form (elle tanımlama, barkod önizleme) açılırken kimlikler çakışmasın. */
function closeMyFoodEdit(){
  const box = document.getElementById("mf-edit");
  if (box) box.remove();
  myFoodEdit = null;
  document.querySelectorAll("[data-mf-edit]").forEach(b => b.setAttribute("aria-expanded", "false"));
}

function deleteCustomFood(key){
  const cf = state.customFoods;
  if (!cf || !cf[key]) return false;
  delete cf[key];
  if (!Object.keys(cf).length){ delete state.customFoods; myFoodsOpen = false; }
  const mp = state.mealPrefs;
  if (mp){
    if (Array.isArray(mp.exclude)) mp.exclude = mp.exclude.filter(k => k !== key);
    for (const s of Object.keys(mp.fixed || {})) mp.fixed[s] = (mp.fixed[s] || []).filter(x => x.k !== key);
  }
  if (state.shopping && state.shopping.checked) delete state.shopping.checked[key];
  if (logPick === key) logPick = null;
  if (myFoodEdit === key) myFoodEdit = null;
  return true;
}

/* Arama paneli açık olduğu öğünün kartının içinde durur; öğün zaten belli
   olduğu için ayrıca "hangi öğün" sormaya gerek kalmıyor. */
function addPanel(){
  /* Barkod düğmesi yalnızca iPhone uygulamasında; web'de panel eskisiyle aynı kalır. */
  const bc = barcodeAvailable();
  return `<div class="pick" style="margin-top:12px">
    ${quickChips()}
    ${savedChips()}
    <input id="food-q" type="text" aria-label="${tx("Ara: karnıyarık, hellim, kivi…")}" placeholder="${tx("Ara: karnıyarık, hellim, kivi…")}" value="${esc(logQuery)}" autocomplete="off">
    ${logQuery.trim().length >= 2 ? "" : catChips()}
    <div class="res" id="food-results">${resultsHTML()}</div>
    ${logPick ? pickCard() : ""}
    <div class="row" style="margin-top:12px">
      ${bc ? `<button class="ghost" id="bc-scan">${tx("Barkod okut")}</button>` : ""}
      <button class="ghost" id="custom-toggle">${tx("Kendim tanımlayayım")}</button>
      ${bc ? "" : `<button class="ghost" id="add-close" style="flex:0 0 92px">${tx("Kapat")}</button>`}
    </div>
    ${myFoodsBlock()}
    ${bc ? `<button class="ghost" id="add-close" style="margin-top:10px">${tx("Kapat")}</button>` : ""}
    ${bc ? `<div id="bc-box" aria-live="polite"></div>` : ""}
    <div id="custom-form"></div>
  </div>`;
}

/* "Kendi besinin" formu; barkod akışı da kullanır (barcode.js). pre (hepsi isteğe bağlı):
   n, p, c, f, lif ile alanlar önceden dolar; notes [[html, uyarı mı]]; title ve saveLabel
   html'dir; bc barkod numarası, br marka, serving porsiyon gramı, src:"off";
   requireAll: üç makro da dolu olmalı (boş "bilinmiyor" demek, 0 yazılırsa 0'dır). */
function customFoodForm(pre){
  pre = pre || {};
  const val = v => v == null ? "" : esc(String(v));
  return `<div class="pick" id="cf-card">
    <h3>${pre.title || tx("Kendi besinin")}</h3>
    ${(pre.notes || []).map(([html, warn]) => `<div class="metric-note${warn ? " cf-warn" : ""}" style="margin-bottom:8px">${html}</div>`).join("")}
    <div class="field"><label for="cf-n">${tx("Ad")}</label><input id="cf-n" type="text" placeholder="${tx("Annemin mercimek köftesi")}" value="${val(pre.n)}"${pre.bc || pre.edit ? ' maxlength="80"' : ""}></div>
    <div class="row">
      <div class="field"><label for="cf-p">${tx("Protein")}</label><input id="cf-p" type="number" inputmode="decimal" placeholder="g/100g" value="${val(pre.p)}"></div>
      <div class="field"><label for="cf-c">${tx("Karb.")}</label><input id="cf-c" type="number" inputmode="decimal" placeholder="g/100g" value="${val(pre.c)}"></div>
      <div class="field"><label for="cf-f">${tx("Yağ")}</label><input id="cf-f" type="number" inputmode="decimal" placeholder="g/100g" value="${val(pre.f)}"></div>
    </div>
    <div class="row">
      <div class="field"><label for="cf-l">${tx("Lif")}</label><input id="cf-l" type="number" inputmode="decimal" placeholder="g/100g" value="${val(pre.lif)}"></div>
      <div class="metric-note" id="cf-kcal" style="align-self:center"></div>
    </div>
    <div class="metric-note cf-warn" id="cf-err" role="alert"></div>
    ${pre.cancel ? `<div class="row"><button id="cf-save">${pre.saveLabel || tx("Kaydet")}</button>
      <button class="ghost" id="cf-cancel" style="flex:0 0 100px">${tx("Vazgeç")}</button></div>`
      : `<button id="cf-save">${pre.saveLabel || tx("Kaydet")}</button>`}
    <div class="metric-note" style="margin-top:10px">${tx("Değerler 100 g başına.")}</div>
  </div>`;
}

function wireCustomForm(box, pre){
  pre = pre || {};
  const $ = id => box.querySelector("#" + id);
  const macros = () => ["cf-p", "cf-c", "cf-f"].map(id => num($(id).value));
  const showKcal = () => {
    const [p, c, f] = macros().map(v => v || 0);
    $("cf-kcal").textContent = tx("≈ {0} kcal / 100 g", [Math.round(p * 4 + c * 4 + f * 9)]);
  };
  ["cf-p", "cf-c", "cf-f"].forEach(id => { $(id).oninput = showKcal; });
  showKcal();
  const fail = (msg, el) => { $("cf-err").textContent = msg; if (el) el.focus(); };
  const cancel = $("cf-cancel");
  if (cancel) cancel.onclick = () => { myFoodEdit = null; render(); };
  $("cf-save").onclick = async () => {
    const n = $("cf-n").value.trim();
    const [p, c, f] = macros().map(v => v || 0);
    const lif = num($("cf-l").value) || 0;
    /* Düzenleme: yalnızca ad ve değerler değişir; barkod, marka, porsiyon, kaynak ve anahtar kalır. */
    if (pre.edit){
      const rec = (state.customFoods || {})[pre.edit];
      if (!rec){ myFoodEdit = null; render(); return; }
      if (!n) return fail(tx("Bir ad yaz."), $("cf-n"));
      const raw = macros();
      const blank = rec.bc && ["cf-p", "cf-c", "cf-f"].find((id, i) => raw[i] === null);
      if (blank) return fail(tx("Değerler eksik; tamamlayıp kaydet."), $(blank));
      if (raw.some(v => v !== null && (v < 0 || v > 100)) || p + c + f > 105 || lif < 0 || lif > 100)
        return fail(tx("Değerler geçersiz: 100 g'da toplam 100 g'ı aşamaz."), $("cf-p"));
      Object.assign(rec, { n: n.slice(0, 80), p, c, f, lif });
      myFoodEdit = null;
      await saveState(state); render();
      toast(tx("{0} kaydedildi.", [`“${rec.n}”`]));
      return;
    }
    state.customFoods = state.customFoods || {};
    let key;
    if (pre.bc){
      if (!n) return fail(tx("Bir ad yaz."), $("cf-n"));
      const raw = macros();
      const blank = ["cf-p", "cf-c", "cf-f"].find((id, i) => raw[i] === null);
      if (blank) return fail(tx("Değerler eksik; tamamlayıp kaydet."), $(blank));
      if (raw.some(v => v < 0 || v > 100) || p + c + f > 105 || lif < 0 || lif > 100)
        return fail(tx("Değerler geçersiz: 100 g'da toplam 100 g'ı aşamaz."), $("cf-p"));
      key = saveBarcodeFood(pre.bc, { n, p, c, f, lif, br: pre.br, serving: pre.serving, src: pre.src });
    } else {
      if (!n || (p + c + f) === 0) return;
      key = "cf_" + Date.now();
      state.customFoods[key] = { n, p, c, f, lif, i: "grain" };
    }
    logPick = key; logQuery = n;
    await saveState(state); render();
    if (pre.bc){
      const el = document.getElementById("pick-amt");
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };
}

function mealManager(){
  const list = userMeals();
  const shares = mealShares(list);
  const T = MEAL_TIMES.find(x => x.key === mealAddTime) || MEAL_TIMES[1];
  return `<section>
    <h2>${tx("Öğünlerim")} <span class="count">${list.length}</span></h2>
    ${list.map((m,i) => `<div class="rt">${iconBox(m.cat === "kahvalti" ? "egg" : m.cat === "ara" ? "fruit" : "grain")}
      <div class="m"><h3>${esc(mealName(m))}</h3><p>${tx("günlük hedefin %{0} kadarı · {1}:00 civarı", [(Math.round(shares[i]*100)), (m.h)])}</p></div>
      ${list.length > 1 ? `<button class="del" data-meal-del="${m.id}" aria-label="${tx("Öğünü kaldır")}">×</button>` : ""}
    </div>`).join("")}
    ${mealAddOpen ? `<div class="pick">
      <div class="field"><label for="ml-name">${tx("Öğün adı")}</label>
        <input id="ml-name" type="text" placeholder="${tx("Örn. Öğle yemeği")}" autocomplete="off"></div>
      <label>${tx("Ne zaman")}</label>
      <div class="chips">${MEAL_TIMES.map(x =>
        `<button class="chip${mealAddTime===x.key?" sel":""}" data-meal-time="${x.key}">${x.label}</button>`).join("")}</div>
      <div class="row" style="margin-top:14px">
        <button id="ml-save">${tx("Ekle")}</button>
        <button class="ghost" id="ml-cancel" style="flex:0 0 100px">${tx("Vazgeç")}</button>
      </div>    </div>` : `<button class="ghost" id="ml-add" style="margin-top:12px">${tx("Öğün ekle")}</button>`}
  </section>`;
}

function logBySlot(log){
  const list = slotList();
  const known = new Set(list.map(([k]) => k));
  /* Öğünü belirtilmemiş eski kayıtlar son öğüne düşer. */
  const fallback = list.length ? list[list.length-1][0] : "aksam";
  const slotOf = x => { const sId = x.slot || fallback; return known.has(sId) ? sId : "__other"; };
  const groups = list.map(([k,l]) => [k, l, log.filter(x => slotOf(x) === k)]);
  const other = log.filter(x => slotOf(x) === "__other");
  if (other.length) groups.push(["__other", tx("Diğer"), other]);
  return groups.filter(([,,items]) => items.length).map(([,l,items]) => {
    const kc = items.reduce((a,it) => a + (it.p*4+it.c*4+it.f*9)*it.g/100, 0);
    return `<div class="slot-head"><span>${l}</span><span class="num">${tx("{0} kcal", [(Math.round(kc))])}</span></div>
      ${items.map(logLine).join("")}`;
  }).join("");
}

function logLine(it){
  const open = editLog === String(it.id);
  return `<div class="log-line${open ? " editing" : ""}">${iconBox(it.i || "grain")}
    <button class="m log-tap" data-log-edit="${it.id}" aria-expanded="${open}" aria-label="${esc(it.n)}, ${tx("porsiyonu düzenle")}">
      <span class="lt-h">${esc(it.n)}</span><span class="lt-p">${amountText(it)} · P${Math.round(it.p*it.g/100)} K${Math.round(it.c*it.g/100)} Y${Math.round(it.f*it.g/100)}</span></button>
    <span class="k num">${tx("{0} kcal", [(Math.round((it.p*4+it.c*4+it.f*9)*it.g/100))])}</span>
    <button class="del" data-log-del="${it.id}" aria-label="${tx("Sil")}">×</button></div>
    ${open ? logEditor(it) : ""}`;
}

/* Günlükteki bir kalemin porsiyonunu ve öğününü değiştirme paneli */
function portionChips(f){
  const P = porsOf(f);
  if (f && f.unit) return [1,2,3].map(c => [c * f.unit, `${c} ${f.unitName}`]);
  if (P.length){
    const a = P[0];
    const seen = new Set();
    return (a.s || porSteps(a.g)).map(c => [Math.round(c*a.g), `${nfmt(c)} ${a.n}`])
      .concat(P.slice(1).map(x => [x.g, `1 ${x.n}`]))
      .concat([[100, "100 g"]])
      .filter(([,l]) => seen.has(l) ? false : (seen.add(l), true));
  }
  return [50,100,150,200].map(c => [c, `${c} g`]);
}
function logEditor(it){
  const f = it.k ? foodOf(it.k) : null;
  const unit = f && f.unit;
  const val = unit ? +(it.g / f.unit).toFixed(2) : it.g;
  return `<div class="pick log-edit">
    <div class="lbl-row"><label for="le-amt">${tx("Miktar ({0})", [(unit ? esc(f.unitName) : "g")])}</label>
      <span class="lbl-v num" id="le-kcal">${tx("{0} kcal", [(Math.round((it.p*4+it.c*4+it.f*9)*it.g/100))])}</span></div>
    <div class="le-row">
      <button class="lf-sb" data-le-step="-1" aria-label="${tx("Azalt")}">−</button>
      <input id="le-amt" type="number" inputmode="decimal" value="${val}" data-unit="${unit ? f.unit : 1}">
      <button class="lf-sb" data-le-step="1" aria-label="${tx("Artır")}">+</button>
    </div>
    <div class="chips">${portionChips(f).map(([g,l]) => `<button class="chip${Math.abs(g - it.g) < 1 ? " sel" : ""}" data-le-g="${g}">${esc(l)}</button>`).join("")}</div>
    <label for="le-slot" style="margin-top:12px">${tx("Öğün")}</label>
    <select id="le-slot">${slotList().map(([k,l]) => `<option value="${k}"${(it.slot || "") === k ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>
    <div class="row" style="margin-top:14px">
      <button id="le-save">${tx("Kaydet")}</button>
      <button class="ghost" id="le-cancel" style="flex:0 0 100px">${tx("Vazgeç")}</button>
    </div>
  </div>`;
}

function favBlock(entry){
  const favs = favoriteFoods();
  const y = shiftDays(vKey(), -1);
  const yLog = (state.days[y] && state.days[y].log) || [];
  /* Besin ekleme paneli açıkken aynı besinler panelin başında, o öğüne göre sıralı durur. */
  const chips = !addOpen;
  if (!favs.length && !yLog.length) return "";
  if (!chips && !yLog.length) return "";
  return `<section class="favs">
    ${chips ? `<h2>${tx("Sık yediklerin")} <span class="count">${tx("dokun, eklensin")}</span></h2>
    ${favs.length ? `<div class="fav">${favs.map(([k,c]) =>
      `<button data-fav="${k}" data-fav-g="${c.g}" data-fav-slot="${c.slot||""}"><b>${esc(c.name)}</b> · ${esc(shortAmount(k, c.g))}</button>`).join("")}</div>`
      : `<div class="empty">${tx("Besin ekledikçe sık kullandıkların burada birikecek.")}</div>`}` : ""}
    ${yLog.length ? `<button class="ghost rep" id="copy-y" style="margin-top:${chips ? 14 : 0}px">${tx("↺ {0} tamamını kopyala ({1} kalem)", [(onToday() ? tx("Dünün") : tx("Bir önceki günün")), (yLog.length)])}</button>` : ""}
  </section>`;
}

function amountText(it){
  const f = foodOf(it.k);
  if (f && f.unit) { const u = it.g / f.unit; return `${Number.isInteger(u)?u:u.toFixed(1)} ${f.unitName} (${it.g} g)`; }
  /* Gramaj bir porsiyonun tam katıysa "2 dilim (60 g)" diye göster. */
  for (const x of porsOf(f)){
    const u = it.g / x.g;
    const r = Math.round(u * 2) / 2;
    if (r >= 0.5 && Math.abs(u - r) < 0.06) return `${nfmt(r)} ${x.n} (${it.g} g)`;
  }
  return `${it.g} g`;
}

/* Kategori: besinde açıkça yazılıysa o, yoksa simgesinden türetilir. */
const ICON_CAT = { poultry:"et", meat:"et", fish:"balik", dairy:"sut", egg:"kahvaltilik",
  grain:"tahil", bread:"tahil", legume:"baklagil", veg:"sebze", potato:"sebze",
  fruit:"meyve", nuts:"kuruyemis", oil:"yag", avocado:"meyve" };

const CAT_LABELS = { kahvaltilik:tx("Kahvaltılık"), sarkuteri:tx("Şarküteri"), spor:tx("Spor & protein"), ara:tx("Ara öğün"),
  yemek:tx("Ana yemek"), et:tx("Et & tavuk"), balik:tx("Balık"), sut:tx("Süt ürünleri"), sebze:tx("Sebze"),
  meyve:tx("Meyve"), tahil:tx("Tahıl & ekmek"), baklagil:tx("Baklagil"), kuruyemis:tx("Kuruyemiş"), yag:tx("Yağ & zeytin") };

const foodCat = f => f.cat || ICON_CAT[f.i] || "tahil";

function catCounts(){
  const c = {};
  for (const [,f] of allFoods()) { const k = foodCat(f); c[k] = (c[k]||0) + 1; }
  return c;
}

/* Satır, "+" ile tek dokunuşta ekleneceği miktarı ve kalorisini gösterir;
   satıra dokunmak miktar kartını açar. */
function foodRow(k, f, habits){
  const g = defaultGrams(k, habits);
  const amount = amountText({ k, g });
  return `<div class="item">${iconBox(f.i || "grain")}
    <button class="item-main tap" data-food="${k}"><h3>${esc(f.n)}</h3><p>${esc(amount)} · ${tx("{0} kcal", [foodKcal(f, g)])}</p></button>
    <button class="add" data-qadd="${k}" data-qg="${g}" aria-label="${esc(f.n)}, ${esc(shortAmount(k, g))}, ${tx("Ekle")}">+</button></div>`;
}

/* Kelime sırasından bağımsız arama: sorgudaki her kelime adın bir kelimesinde
   geçmeli. Tam kelime > kelime başı > kelime içi diye puanlanır, böylece
   "hindi" yazınca "Hindi salam" "Hindistan cevizi"nden önce gelir. */
function matchScore(text, q, fuzzy){
  const words = norm(text).split(/[^a-z0-9]+/).filter(Boolean);
  const toks = norm(q).split(/[^a-z0-9]+/).filter(Boolean);
  if (!toks.length) return 0;
  /* Türkçe ünsüz yumuşaması: ek alınca sondaki k→ğ, p→b, t→d, ç→c olur
     ("ekmek" → "ekmeği"). Normalleştirmede ğ→g olduğu için bunları da dene. */
  /* Yalnız verimli olan k→ğ ve p→b; t→d "süt"ü "suda" ile eşleştiriyordu. */
  const soft = t => {
    const m = { k:"g", p:"b" };
    const last = t[t.length-1];
    return t.length >= 3 && m[last] ? t.slice(0,-1) + m[last] : null;
  };
  let score = 0;
  for (const t of toks){
    let best = 0;
    const ts = soft(t);
    for (const w of words){
      if (w === t) { best = 3; break; }
      /* "ekmeği" = "ekmek"in kendisi; kısa ekli yumuşamış hal tam eşleşme sayılır */
      if (ts && w.startsWith(ts) && w.length - ts.length <= 2) { best = 3; break; }
      if (w.startsWith(t) || (ts && w.startsWith(ts))) best = Math.max(best, 2);
      else if (t.length >= 3 && w.includes(t)) best = Math.max(best, 1);
    }
    /* Yazım hatası: yalnızca hiçbir şey bulunamayınca denenir (fuzzy). */
    if (!best && fuzzy && /[a-z]/.test(t) && words.some(w => nearWord(t, w))) best = 0.5;
    if (!best) return 0;
    score += best;
  }
  return score;
}
/* İki sözcük arası uzaklık: eksik, fazla, yanlış ya da yer değiştirmiş harf 1 sayılır. */
function editDist(a, b){
  let p2 = null, p = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++){
    const c = [i];
    for (let j = 1; j <= b.length; j++){
      let v = Math.min(p[j] + 1, c[j-1] + 1, p[j-1] + (a[i-1] === b[j-1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i-1] === b[j-2] && a[i-2] === b[j-1]) v = Math.min(v, p2[j-2] + 1);
      c[j] = v;
    }
    p2 = p; p = c;
  }
  return p[b.length];
}
/* Dört harften kısa sözcüklerde hata payı yok; 4–7 harfte 1, 8 ve üstünde 2.
   Yarım yazılmış sözcük de (başı tutuyorsa) yakın sayılır. */
function nearWord(t, w){
  if (t.length < 4) return false;
  const max = t.length >= 8 ? 2 : 1;
  if (Math.abs(w.length - t.length) <= max && editDist(t, w) <= max) return true;
  return w.length > t.length && editDist(t, w.slice(0, t.length)) <= max;
}
/* Ad eşleşmesi takma ad eşleşmesinden biraz öne geçer. */
function foodScore(f, q, fuzzy){
  const a = matchScore(f.n, q, fuzzy);
  if (a) return a + 0.5;
  return f.a ? matchScore(f.n + " " + f.a, q, fuzzy) : 0;
}
/* Bir besinin ne kadar "temel" olduğu: hazır öğün setlerinde ve tariflerde
   kaç kez geçtiği. Eşit puanlı aramada "Tavuk göğsü" "Tavuk şiş"in önüne geçsin. */
let POP_CACHE = null;
function foodPop(k){
  if (!POP_CACHE){
    POP_CACHE = {};
    for (const set of MEAL_SETS) for (const m of set.meals)
      for (const x of [m.p, m.c, m.f]) POP_CACHE[x] = (POP_CACHE[x]||0) + 1;
    for (const r of RECIPES) for (const [x] of r.ing) POP_CACHE[x] = (POP_CACHE[x]||0) + 1;
  }
  return POP_CACHE[k] || 0;
}

function searchFoods(q, limit){
  const use = foodUsage();
  /* Eşit puanda önce sık kullandığın besin, sonra temel besin (spor ürünü ya da
     atıştırmalık değil), sonra kısa ad: "yulaf" → önce Yulaf ezmesi, sonra barı. */
  const side = f => (f.cat === "spor" || f.cat === "ara") ? 1 : 0;
  const rank = fuzzy => allFoods()
    .map(([k,f]) => [k, f, foodScore(f, q, fuzzy)])
    .filter(x => x[2] > 0);
  /* Hiçbir şey bulunamadıysa küçük yazım hatalarına tolerans ("peynr", "tavk"). */
  let rows = rank(false);
  if (!rows.length) rows = rank(true);
  return rows
    .sort((a,b) => b[2] - a[2] || (use[b[0]]||0) - (use[a[0]]||0)
                 || side(a[1]) - side(b[1]) || foodPop(b[0]) - foodPop(a[0])
                 || a[1].n.length - b[1].n.length)
    .slice(0, limit)
    .map(([k,f]) => [k,f]);
}

function resultsHTML(){
  const q = norm(logQuery.trim());
  if (q.length >= 2){
    const hits = searchFoods(logQuery, 12);
    if (!hits.length) return `<div class="empty" style="padding-top:12px">${tx("Bulunamadı. Aşağıdan kendin tanımlayabilirsin.")}</div>`;
    const habits = foodHabits();
    return hits.map(([k,f]) => foodRow(k, f, habits)).join("");
  }
  if (logCat){
    const list = allFoods().filter(([,f]) => foodCat(f) === logCat)
      .sort((a,b) => a[1].n.localeCompare(b[1].n, "tr"));
    const habits = foodHabits();
    return `<div class="metric-note" style="margin:12px 4px 0">${tx("{0} · {1} kalem", [(CAT_LABELS[logCat]), (list.length)])}</div>`
      + list.map(([k,f]) => foodRow(k, f, habits)).join("");
  }
  return "";
}

function catChips(){
  const counts = catCounts();
  return `<div class="chips" style="margin-top:12px">${Object.entries(CAT_LABELS)
    .filter(([k]) => counts[k])
    .map(([k,l]) => `<button class="chip${logCat===k?" sel":""}" data-cat="${k}">${l} <span style="opacity:.6">${counts[k]}</span></button>`)
    .join("")}</div>`;
}

/* Porsiyon çokluğu, bir porsiyonun ağırlığına göre seçilir:
   "1 dilim ekmek" ile "10 adet zeytin" aynı listeden gelmemeli. */
/* Porsiyon tek nesne ya da liste olabilir; ilki birincil ölçüdür. */
const porsOf = f => !f || !f.por ? [] : Array.isArray(f.por) ? f.por : [f.por];
function porSteps(g){
  if (g >= 250) return [0.5, 1, 1.5];   /* nar, greyfurt, kase çorba */
  if (g >= 10)  return [1, 2, 3];       /* dilim, adet, bardak, kaşık */
  return [2, 5, 10];                    /* zeytin, sarımsak dişi gibi küçükler */
}
/* Ondalık ayırıcı dile göre: Türkçede virgül, İngilizcede nokta. */
const nfmt = n => Number.isInteger(n) || LANG !== "tr" ? String(n) : String(n).replace(".", ",");

function pickCard(){
  const f = foodOf(logPick);
  if (!f) return "";
  /* Miktar, satırdaki "+" ile eklenecek olanla başlar: son yediğin ya da 1 porsiyon. */
  const g0 = defaultGrams(logPick);
  const def = f.unit ? +(g0 / f.unit).toFixed(2) : g0;
  /* Birimli besinlerde giriş birim cinsinden; diğerlerinde gram,
     porsiyon rozetleri gram alanını doldurur. */
  const P = porsOf(f);
  let chips;
  if (f.unit) chips = [1,2,3].map(c => [c, `${c} ${f.unitName}`]);
  else if (P.length) {
    const a = P[0];
    chips = (a.s || porSteps(a.g)).map(c => [Math.round(c*a.g), `${nfmt(c)} ${a.n}`])
      .concat(P.slice(1).map(x => [x.g, `1 ${x.n}`]))
      .concat([[100, "100 g"]]);
    /* Aynı etiketi iki kez gösterme; aynı gramaj farklı adla gelebilir
       ("10 adet" ile "1 dürüm" ikisi de 200 g ama kullanıcı için farklı). */
    const seen = new Set();
    chips = chips.filter(([,l]) => seen.has(l) ? false : (seen.add(l), true));
  }
  else chips = [50,100,150,200].map(c => [c, `${c} g`]);
  return `<div class="pick" style="background:var(--surface);margin-top:14px">
    <h3>${esc(f.n)}</h3>
    <div class="lbl-row"><label for="pick-amt">${tx("Miktar ({0})", [(f.unit ? esc(f.unitName) : "g")])}</label>
      <span class="lbl-v num" id="pick-kcal">${tx("{0} kcal", [foodKcal(f, g0)])}</span></div>
    <div class="le-row">
      <button class="lf-sb" data-pick-step="-1" aria-label="${tx("Azalt")}">−</button>
      <input id="pick-amt" type="number" inputmode="decimal" value="${def}" data-unit="${f.unit || 1}">
      <button class="lf-sb" data-pick-step="1" aria-label="${tx("Artır")}">+</button>
    </div>
    <div class="chips">${chips.map(([v,l]) => `<button class="chip${Math.abs(v - def) < 0.01 ? " sel" : ""}" data-amt="${v}">${esc(l)}</button>`).join("")}</div>
    ${f.unit ? `<div class="metric-note" style="margin-top:9px">1 ${esc(f.unitName)} ≈ ${f.unit} g</div>`
      : P.length ? `<div class="metric-note" style="margin-top:9px">${P.map(x => `1 ${esc(x.n)} ≈ ${x.g} g`).join(" · ")}</div>` : ""}
    <div class="row" style="margin-top:14px">
      <button id="pick-add">${tx("Ekle")}</button>
      <button class="ghost" id="pick-cancel" style="flex:0 0 100px">${tx("Vazgeç")}</button>
    </div>
  </div>`;
}

function fixResults(){
  const q = norm(fixQuery.trim());
  if (q.length < 2) return "";
  const hits = searchFoods(fixQuery, 8);
  if (!hits.length) return `<div class="empty" style="padding-top:10px">${tx("Bulunamadı.")}</div>`;
  return hits.map(([k,f]) => `<div class="item" data-fixfood="${k}">${iconBox(f.i || "grain")}
    <div class="item-main"><h3>${esc(f.n)}</h3><p>${tx("100 g: {0} kcal", [(Math.round(f.p*4+f.c*4+f.f*9))])}</p></div>
    <span class="add">+</span></div>`).join("");
}

function fixPicker(){
  const f = fixPick ? foodOf(fixPick) : null;
  const chips = f && f.unit ? [1,2,3] : [50,100,150,200];
  return `<div class="pick">
    <label for="fix-q">${tx("Ne yiyeceksin?")}</label>
    <input id="fix-q" type="text" placeholder="${tx("Ara: yumurta, döner, muz…")}" value="${esc(fixQuery)}" autocomplete="off">
    <div class="res" id="fix-res">${fixResults()}</div>
    ${f ? `<div style="margin-top:14px">
      <label for="fix-amt">${tx("{0} — miktar ({1})", [(esc(f.n)), (f.unit ? f.unitName : "g")])}</label>
      <input id="fix-amt" type="number" inputmode="decimal" value="${f.unit ? 1 : 100}">
      <div class="chips">${chips.map(c => `<button class="chip" data-fixamt="${c}">${c} ${f.unit?f.unitName:"g"}</button>`).join("")}</div>
      <button id="fix-save" style="margin-top:12px">${tx("Bu öğüne ekle")}</button>
    </div>` : ""}  </div>`;
}

function prefsSection(){
  const prefs = mealPrefs();
  const usage = foodUsage();
  const known = Object.keys(usage).filter(k => usage[k] >= 2).length;

  return `<section>
    <h2>${tx("Önerileri kendine göre ayarla")}</h2>
    <label for="cuisine-sel">${tx("Mutfak")}</label>
    <select id="cuisine-sel" style="margin-bottom:14px">${Object.entries(CUISINES)
      .map(([k,l]) => `<option value="${k}"${currentCuisine()===k?" selected":""}>${l}</option>`).join("")}</select>
    <label for="diet-sel">${tx("Beslenme türü")}</label>
    <select id="diet-sel" style="margin-bottom:14px">${dietOptions(currentDiet())
      .map(([k,l]) => `<option value="${k}"${currentDiet()===k?" selected":""}>${l}</option>`).join("")}</select>
    <div class="chips">
      <button class="chip${prefs.useMine?" sel":""}" id="use-mine">
        <svg class="ico" style="width:14px;height:14px;flex:0 0 14px;vertical-align:-2px" aria-hidden="true"><use href="#i-repeat"/></svg>
        ${tx("Sık yediğim besinlerle kur")}</button>
    </div>    ${currentDiet() !== "hepsi" ? `<div class="metric-note" style="margin-top:10px">
      ${tx("{0} seçili: {1} besin uygun, kalanı önerilerden çıkarıldı. Günlüğe istediğini yazmaya devam edebilirsin.", [(DIETS[currentDiet()]), (Object.keys(FOODS).filter(k => foodAllowed(k, currentDiet())).length)])}
      ${INTL_DIETS.includes(currentDiet()) ? tx("Etin kesim şekli bilinemez; paketin etiketine bak.") : ""}</div>` : ""}
    ${prefs.exclude.length ? `<div style="margin-top:14px">
      <div class="metric-note" style="margin-bottom:8px">${tx("Önerilerden çıkardıkların:")}</div>
      <div class="chips">${prefs.exclude.map(k => `<button class="chip" data-munex="${k}">
        ${esc((FOODS[k]||{n:k}).n)} <span style="opacity:.6">${tx("geri al")}</span></button>`).join("")}</div>
    </div>` : ""}
  </section>`;
}

function planView(program){
  const plan = buildMeals(program, mealVariant);
  const off = Math.abs(plan.total.kcal - program.kcal);

  return `
  <section>
    <h2>${plan.setName} <span class="count">${tx("{0} kcal", [(plan.total.kcal)])}</span></h2>
    ${macroRow(tx("Kalori"), plan.total.kcal, program.kcal, "", "grain", "band")}
    ${macroRow(tx("Protein"), plan.total.p, program.protein, " g", "poultry", "mp")}
    ${macroRow(tx("Karbonhidrat"), plan.total.c, program.carb, " g", "bread", "mc")}
    ${macroRow(tx("Yağ"), plan.total.f, program.fat, " g", "oil", "mf")}
    ${macroRow(tx("Lif"), plan.total.lif, fiberTarget(program), " g", "veg", "ml")}
    ${off > program.kcal * 0.08 ? `<div class="metric-note" style="margin-top:12px">
      <b class="out">Bu kombinasyon hedeften ${off} kcal ${plan.total.kcal>program.kcal?tx("yüksek"):tx("düşük")}.</b>
      ${tx("Yağlı besinler kendi yağını da getirdiği için bazı setler düşük kalorili hedeflere oturmuyor; başka kombinasyon dene.")}</div>` : ""}
    <button class="ghost" id="reroll" style="margin-top:14px">${tx("Başka kombinasyon")}</button>
  </section>
  ${prefsSection()}
  ${microSection(plan.micros)}
  ${plan.meals.map(m => `<section>
    <h2>${m.name} <span class="count">${tx("{0} kcal", [(m.kcal)])}</span></h2>
    ${m.items.map(i => {
      const rec = i.key ? recipeFor(i.key) : null;
      return `<div class="item">${iconBox(i.icon)}
      ${rec
        ? `<button class="item-main tap" data-recipefor="${i.key}">
             <h3>${esc(i.text)}</h3>
             <p>${i.fixed?tx("senin girdiğin · "):""}${rec.idx >= 0 ? tx("tarifi gör") : rec.uses + tx(" tarifte kullanılıyor")}</p>
           </button><svg class="ico chev" aria-hidden="true"><use href="#i-next"/></svg>`
        : `<div class="item-main"><h3>${esc(i.text)}</h3>${i.fixed?`<p>${tx("senin girdiğin")}</p>`:""}</div>`}
      ${i.fixed
        ? `<button class="del" data-fixdel="${m.slot}|${i.key}" aria-label="${tx("Kaldır")}">×</button>`
        : i.key ? `<button class="del" data-mex="${i.key}" aria-label="${tx("Bu besini önerilerden çıkar")}">×</button>` : ""}
    </div>`; }).join("")}
    ${m.full ? `<div class="metric-note" style="margin-top:10px">${tx("Bu öğün doldu.")}</div>` : ""}
    <button class="ghost" data-fixadd="${m.slot}" style="margin-top:12px">${fixSlot===m.slot?tx("Kapat"):tx("Kendi yiyeceğini ekle")}</button>
    ${fixSlot===m.slot ? fixPicker() : ""}
  </section>`).join("")}
  <div class="foot">${tx("Miktarlar çiğ ağırlıktır.")}</div>`;
}

function wireMeals(entry){
  wireShopping(currentProgram());
  app.querySelectorAll("[data-meal-tab]").forEach(b => b.onclick = () => {
    if (b.dataset.mealTab === mealTab) return;
    navTo(() => { mealTab = b.dataset.mealTab; render(); window.scrollTo(0,0); }, segDir(b), "k-seg");
  });

  const rq = document.getElementById("rec-q");
  if (rq) {
    /* Odak kaybolmasın diye sadece sonuç listesini tazeliyoruz. */
    rq.oninput = () => { recipeQuery = rq.value; recipeOpen = null;
      document.getElementById("rec-results").innerHTML = recipeList(); bindRecipes(entry); };
  }
  bindRecipes(entry);
  wireMealsRest(entry);
}

function bindRecipes(entry){
  const more = document.getElementById("rec-more");
  if (more) more.onclick = () => { recipeOffset += 3; recipeOpen = null;
    document.getElementById("rec-results").innerHTML = recipeList(); bindRecipes(entry); };

  app.querySelectorAll("[data-recipe]").forEach(b => b.onclick = () => {
    const i = Number(b.dataset.recipe);
    recipeOpen = recipeOpen === i ? null : i;
    document.getElementById("rec-results").innerHTML = recipeList();
    bindRecipes(entry);
  });

  app.querySelectorAll("[data-recipe-add]").forEach(b => b.onclick = async (ev) => {
    ev.stopPropagation();
    const r = RECIPES[Number(b.dataset.recipeAdd)];
    if (!(await guardKcal(entry))) return;
    const m = recipeMacros(r);
    entry.log = entry.log || [];
    entry.log.push({ id:Date.now()+Math.random(), n:r.n + " (1 porsiyon)", g:m.gPer,
      p:+m.per100.p.toFixed(1), c:+m.per100.c.toFixed(1), f:+m.per100.f.toFixed(1),
      lif:+m.per100.lif.toFixed(1), v:m.v, i:r.i, slot: defaultSlot() });
    syncKcal(entry);
    mealTab = "log"; recipeOpen = null; recipeQuery = "";
    await saveState(state); render(); window.scrollTo(0,0);
  });
}

function wireMealsRest(entry){
  const btn = document.getElementById("reroll");
  if (btn) btn.onclick = () => { mealVariant++; render(); };

  const cs = document.getElementById("cuisine-sel");
  if (cs) cs.onchange = async () => {
    mealPrefs().cuisine = cs.value; recipeOffset = 0;
    await saveState(state); render();
  };
  const ds = document.getElementById("diet-sel");
  if (ds) ds.onchange = async () => {
    mealPrefs().diet = ds.value;
    await saveState(state); render();
  };

  const um = document.getElementById("use-mine");
  if (um) um.onclick = async () => {
    const prefs = mealPrefs();
    prefs.useMine = !prefs.useMine;
    await saveState(state); render();
  };

  app.querySelectorAll("[data-mex]").forEach(b => b.onclick = async () => {
    const prefs = mealPrefs();
    if (!prefs.exclude.includes(b.dataset.mex)) prefs.exclude.push(b.dataset.mex);
    await saveState(state); render();
  });

  app.querySelectorAll("[data-munex]").forEach(b => b.onclick = async () => {
    const prefs = mealPrefs();
    prefs.exclude = prefs.exclude.filter(k => k !== b.dataset.munex);
    await saveState(state); render();
  });

  app.querySelectorAll("[data-recipefor]").forEach(b => b.onclick = () => {
    const rec = recipeFor(b.dataset.recipefor);
    if (!rec) return;
    mealTab = "recipes";
    recipeQuery = rec.q;
    recipeOpen = rec.idx >= 0 ? rec.idx : null;
    render(); window.scrollTo(0,0);
  });

  app.querySelectorAll("[data-fixadd]").forEach(b => b.onclick = () => {
    fixSlot = fixSlot === b.dataset.fixadd ? null : b.dataset.fixadd;
    fixQuery = ""; fixPick = null;
    render();
  });

  app.querySelectorAll("[data-fixdel]").forEach(b => b.onclick = async () => {
    const [slot, key] = b.dataset.fixdel.split("|");
    const prefs = mealPrefs();
    const list = prefs.fixed[slot] || [];
    const i = list.findIndex(x => x.k === key);
    if (i >= 0) list.splice(i, 1);
    await saveState(state); render();
  });

  const fq = document.getElementById("fix-q");
  if (fq) {
    fq.oninput = () => { fixQuery = fq.value;
      document.getElementById("fix-res").innerHTML = fixResults(); bindFix(); };
    bindFix();
    const amt = document.getElementById("fix-amt");
    if (amt) {
      app.querySelectorAll("[data-fixamt]").forEach(x => x.onclick = () => { amt.value = x.dataset.fixamt; });
      document.getElementById("fix-save").onclick = async () => {
        const food = foodOf(fixPick);
        const n = num(amt.value);
        if (!food || !n || n <= 0) return;
        const grams = Math.round(food.unit ? n * food.unit : n);
        const prefs = mealPrefs();
        const list = prefs.fixed[fixSlot] || (prefs.fixed[fixSlot] = []);
        const ex = list.find(x => x.k === fixPick);
        if (ex) ex.g = grams; else list.push({ k:fixPick, g:grams });
        fixPick = null; fixQuery = "";
        await saveState(state); render();
      };
    }
  }

  app.querySelectorAll("[data-fav]").forEach(b => b.onclick = () =>
    quickAdd(entry, b.dataset.fav, Number(b.dataset.favG), { slot: b.dataset.favSlot || null }));

  /* kayıtlı öğünler */
  app.querySelectorAll("[data-savemeal]").forEach(b => b.onclick = () => {
    saveMealOpen = b.dataset.savemeal; render();
    const el = document.getElementById("sm-name");
    if (el){ el.focus(); el.select(); }
  });
  const smc = document.getElementById("sm-cancel");
  if (smc) smc.onclick = () => { saveMealOpen = null; render(); };
  const sms = document.getElementById("sm-save");
  if (sms) sms.onclick = async () => {
    const items = itemsOfSlot(entry.log, saveMealOpen);
    if (!items.length){ saveMealOpen = null; render(); return; }
    const name = document.getElementById("sm-name").value.trim().slice(0, 40) || slotLabel(saveMealOpen);
    /* Kimlik ve öğün kayda girmez: eklenirken yenileri verilir. */
    const clean = items.map(({ id, slot, ...rest }) => rest);
    state.savedMeals = savedMeals().concat([{ id: "s" + Date.now().toString(36), name, items: clean }]);
    saveMealOpen = null;
    await saveState(state); render();
    toast(tx("{0} kaydedildi.", [(`“${name}”`)]));
  };
  app.querySelectorAll("[data-saved-add]").forEach(b => b.onclick = async () => {
    const s = savedMeals().find(x => x.id === b.dataset.savedAdd);
    if (!s) return;
    if (!(await guardKcal(entry))) return;
    const slot = addOpen || defaultSlot();
    const day = vKey(), snap = logSnap(entry);
    const ids = copyItems(entry, s.items, slot);
    syncKcal(entry);
    logQuery = ""; logPick = null;
    await saveState(state); render();
    toastUndo(tx("{0} eklendi ({1} kalem).", [(`“${s.name}”`), (s.items.length)]), day, ids, snap);
  });
  app.querySelectorAll("[data-saved-del]").forEach(b => b.onclick = async () => {
    state.savedMeals = savedMeals().filter(x => x.id !== b.dataset.savedDel);
    if (!state.savedMeals.length) delete state.savedMeals;
    await saveState(state); render();
  });

  app.querySelectorAll("[data-copymeal]").forEach(b => b.onclick = async () => {
    const list = slotList(), known = new Set(list.map(([x]) => x));
    const fallback = list.length ? list[list.length-1][0] : "aksam";
    const slot = b.dataset.copymeal;
    const items = ydayLog().filter(x => {
      const sId = x.slot || fallback;
      return (known.has(sId) ? sId : "__other") === slot;
    });
    if (!items.length) return;
    if (!(await guardKcal(entry))) return;
    const day = vKey(), snap = logSnap(entry);
    const ids = copyItems(entry, items);
    syncKcal(entry);                 /* günlük doldu, günün kalorisi de güncellensin */
    await saveState(state); render();
    toastUndo(tx("{0} kalem kopyalandı.", [(items.length)]), day, ids, snap);
  });

  app.querySelectorAll("[data-addfood]").forEach(b => b.onclick = () => {
    addOpen = b.dataset.addfood;
    logQuery = ""; logCat = null; logPick = null; myFoodsOpen = false; myFoodEdit = null;
    render();
    const el = document.getElementById("food-q");
    if (el){
      /* Dokunulacak sık yediklerin varsa klavye açılıp onları örtmesin. */
      if (!quickFoods(addOpen).length) el.focus({ preventScroll: true });
      el.scrollIntoView({ behavior:"smooth", block:"center" });
    }
  });
  const addClose = document.getElementById("add-close");
  if (addClose) addClose.onclick = () => { addOpen = null; logPick = null; logQuery = ""; logCat = null; myFoodsOpen = false; myFoodEdit = null; render(); };

  const mfToggle = document.getElementById("mf-toggle");
  if (mfToggle) mfToggle.onclick = () => { myFoodsOpen = !myFoodsOpen; myFoodEdit = null; render(); };
  app.querySelectorAll("[data-mf-edit]").forEach(b => b.onclick = () => {
    myFoodEdit = myFoodEdit === b.dataset.mfEdit ? null : b.dataset.mfEdit;
    logPick = null;
    render();
    const box = document.getElementById("mf-edit");
    if (box){ box.scrollIntoView({ behavior:"smooth", block:"center" }); }
  });
  const mfEdit = document.getElementById("mf-edit");
  if (mfEdit && myFoodEdit && foodOf(myFoodEdit)) wireCustomForm(mfEdit, myFoodPre(myFoodEdit));
  app.querySelectorAll("[data-mf-del]").forEach(b => b.onclick = async () => {
    const key = b.dataset.mfDel, f = foodOf(key);
    if (!f) return;
    const yes = await askSheet({ title: tx("“{0}” silinsin mi?", [esc(f.n)]), body: "", ok: tx("Sil"), cancel: tx("Vazgeç") });
    if (!yes) return;
    deleteCustomFood(key);
    await saveState(state); render();
  });

  const mlAdd = document.getElementById("ml-add");
  if (mlAdd) mlAdd.onclick = () => { mealAddOpen = true; render(); };
  const mlCancel = document.getElementById("ml-cancel");
  if (mlCancel) mlCancel.onclick = () => { mealAddOpen = false; render(); };
  app.querySelectorAll("[data-meal-time]").forEach(b => b.onclick = () => {
    mealAddTime = b.dataset.mealTime;
    app.querySelectorAll("[data-meal-time]").forEach(x => x.classList.toggle("sel", x === b));
  });
  const mlSave = document.getElementById("ml-save");
  if (mlSave) mlSave.onclick = async () => {
    const el = document.getElementById("ml-name");
    const name = el.value.trim();
    if (!name) { el.focus(); return; }
    const T = MEAL_TIMES.find(x => x.key === mealAddTime) || MEAL_TIMES[1];
    const p = mealPrefs();
    const id = "m" + Date.now().toString(36);
    p.meals.push({ id, name, w:T.w, h:T.h, cat:T.cat });
    mealAddOpen = false;
    await saveState(state); render();
  };
  app.querySelectorAll("[data-meal-del]").forEach(b => b.onclick = async () => {
    const p = mealPrefs();
    if (p.meals.length <= 1) return;
    p.meals = p.meals.filter(m => m.id !== b.dataset.mealDel);
    delete p.fixed[b.dataset.mealDel];
    await saveState(state); render();
  });

  const cy = document.getElementById("copy-y");
  if (cy) cy.onclick = async () => {
    const y = shiftDays(vKey(), -1);
    const yLog = (state.days[y] && state.days[y].log) || [];
    if (!yLog.length) return;
    if (!(await guardKcal(entry))) return;
    const day = vKey(), snap = logSnap(entry);
    const ids = copyItems(entry, yLog);
    syncKcal(entry);
    await saveState(state); render();
    toastUndo(tx("{0} kalem kopyalandı.", [(yLog.length)]), day, ids, snap);
  };

  app.querySelectorAll("[data-log-edit]").forEach(b => b.onclick = () => {
    editLog = editLog === b.dataset.logEdit ? null : b.dataset.logEdit;
    render();
    const el = document.getElementById("le-amt");
    if (el) el.closest(".log-edit").scrollIntoView({ behavior:"smooth", block:"center" });
  });
  const leAmt = document.getElementById("le-amt");
  if (leAmt){
    const it = (entry.log || []).find(x => String(x.id) === editLog);
    const u = +leAmt.dataset.unit;
    const grams = () => { const n = num(leAmt.value); return n && n > 0 ? n * u : null; };
    const showK = () => { const g = grams(); document.getElementById("le-kcal").textContent =
      g ? `${Math.round((it.p*4+it.c*4+it.f*9)*g/100)} kcal` : "—"; };
    leAmt.oninput = showK;
    app.querySelectorAll("[data-le-g]").forEach(c => c.onclick = () => {
      leAmt.value = +(Number(c.dataset.leG) / u).toFixed(2); showK();
      app.querySelectorAll("[data-le-g]").forEach(x => x.classList.toggle("sel", x === c));
    });
    app.querySelectorAll("[data-le-step]").forEach(b => b.onclick = () => {
      const step = u > 1 ? 1 : (num(leAmt.value) || 0) >= 100 ? 10 : 5;
      leAmt.value = Math.max(0, +((num(leAmt.value) || 0) + step * Number(b.dataset.leStep)).toFixed(2)); showK();
    });
    document.getElementById("le-cancel").onclick = () => { editLog = null; render(); };
    document.getElementById("le-save").onclick = async () => {
      const g = grams();
      if (!g){ toast(tx("Geçerli bir miktar gir.")); return; }
      it.g = Math.round(g);
      it.slot = document.getElementById("le-slot").value;
      editLog = null;
      syncKcal(entry);
      await saveState(state); render();
      toast(tx("Porsiyon güncellendi."));
    };
  }

  app.querySelectorAll("[data-log-del]").forEach(b => b.onclick = async () => {
    entry.log = (entry.log || []).filter(x => String(x.id) !== b.dataset.logDel);
    if (!entry.log.length) entry.logCleared = true;
    syncKcal(entry);
    await saveState(state); render();
  });

  const q = document.getElementById("food-q");
  if (!q) return;

  /* Arama kutusunda odak kaybolmasın diye tüm ekranı değil, sadece sonuç listesini tazeliyoruz. */
  let qWasBrowsing = logQuery.trim().length < 2;
  q.oninput = () => {
    logQuery = q.value;
    if (logQuery.trim().length >= 2) logCat = null;
    const browsing = logQuery.trim().length < 2;
    if (browsing !== qWasBrowsing){
      /* Kategori rozetleri girip çıkarken paneli baştan çiz, odağı geri ver. */
      qWasBrowsing = browsing;
      const pos = q.selectionStart;
      render();
      const el = document.getElementById("food-q");
      if (el){ el.focus(); try { el.setSelectionRange(pos, pos); } catch(e){} }
      return;
    }
    document.getElementById("food-results").innerHTML = resultsHTML();
    bindResults(entry);
  };
  bindResults(entry);

  app.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => {
    logCat = logCat === b.dataset.cat ? null : b.dataset.cat;
    logQuery = ""; logPick = null;
    render();
  });

  const amt = document.getElementById("pick-amt");
  if (amt) {
    const f = foodOf(logPick), u = +amt.dataset.unit;
    const showK = () => {
      const n = num(amt.value);
      document.getElementById("pick-kcal").textContent = n && n > 0 ? tx("{0} kcal", [foodKcal(f, n * u)]) : "—";
      app.querySelectorAll("[data-amt]").forEach(x => x.classList.toggle("sel", n !== null && Math.abs(Number(x.dataset.amt) - n) < 0.01));
    };
    amt.oninput = showK;
    app.querySelectorAll("[data-amt]").forEach(b => b.onclick = () => { amt.value = b.dataset.amt; showK(); });
    app.querySelectorAll("[data-pick-step]").forEach(b => b.onclick = () => {
      const v = num(amt.value) || 0;
      const step = u > 1 ? 1 : v >= 200 ? 50 : v >= 50 ? 10 : 5;
      amt.value = Math.max(u > 1 ? 1 : 5, +(v + step * Number(b.dataset.pickStep)).toFixed(2));
      showK();
    });
    document.getElementById("pick-cancel").onclick = () => { logPick = null; render(); };
    document.getElementById("pick-add").onclick = () => {
      const n = num(amt.value);
      if (!f || !n || n <= 0) return;
      return quickAdd(entry, logPick, n * u);
    };
  }


  const ct = document.getElementById("custom-toggle");
  if (ct) ct.onclick = () => {
    const box = document.getElementById("custom-form");
    if (box.innerHTML) { box.innerHTML = ""; return; }
    const bb = document.getElementById("bc-box");
    if (bb) bb.innerHTML = "";          /* iki formda aynı kimlikler olmasın */
    closeMyFoodEdit();
    box.innerHTML = customFoodForm();
    wireCustomForm(box);
  };

  const bs = document.getElementById("bc-scan");
  if (bs) bs.onclick = () => startBarcodeFlow();
}

function bindFix(){
  app.querySelectorAll("[data-fixfood]").forEach(b => b.onclick = () => { fixPick = b.dataset.fixfood; render(); });
}

function bindResults(entry){
  app.querySelectorAll("[data-food]").forEach(b => b.onclick = () => {
    logPick = b.dataset.food; render();
    const el = document.getElementById("pick-amt");
    if (el) el.scrollIntoView({ behavior:"smooth", block:"center" });
  });
  /* "+" ve sık yediklerin: miktar sormadan ekler, toast'tan geri alınır. */
  app.querySelectorAll("[data-qadd]").forEach(b => b.onclick = () =>
    quickAdd(entry, b.dataset.qadd, Number(b.dataset.qg), { refocus: !!b.closest("#food-results") && logQuery.trim().length >= 2 }));
}

/* ---- sık kullanılan besinler ---- */
function favoriteFoods(){
  const counts = {};
  for (const k of Object.keys(state.days).sort())
    for (const it of (state.days[k].log || []))
      if (it.k && (FOODS[it.k] || (state.customFoods||{})[it.k])){
        const c = counts[it.k] || (counts[it.k] = { n:0, g:it.g, slot:it.slot, name:it.n });
        c.n++; c.g = it.g; c.slot = it.slot;   /* en son kullanılan gramaj */
      }
  return Object.entries(counts).sort((a,b) => b[1].n - a[1].n).slice(0, 8);
}

function addFoodDirect(entry, key, grams, slot){
  const f = FOODS[key] || (state.customFoods||{})[key];
  if (!f) return null;
  entry.log = entry.log || [];
  const it = { id: Date.now()+Math.random(), k:key, n:f.n, g:grams,
    p:f.p, c:f.c, f:f.f, lif:f.lif || 0, v:f.v || [], i:f.i, slot: slot || defaultSlot() };
  entry.log.push(it);
  syncKcal(entry);
  return it;
}

/* ---- kolay ekleme ----
   Her besin için geçmişten bir kez okunur: kaç kez, hangi öğünde, en son kaç gram yendi. */
function foodHabits(){
  const h = {};
  let seq = 0;
  for (const day of Object.keys(state.days).sort())
    for (const it of (state.days[day].log || [])){
      if (!it.k || !foodOf(it.k)) continue;
      const x = h[it.k] || (h[it.k] = { n:0, slots:{}, g:0, last:0 });
      x.n++; x.g = it.g; x.last = seq++;
      x.slots[it.slot || ""] = (x.slots[it.slot || ""] || 0) + 1;
    }
  return h;
}

/* O öğünde en çok yediklerin, yoksa genel olarak en çok yediklerin: [anahtar, son gram]. */
function quickFoods(slot, limit){
  const h = foodHabits();
  return Object.entries(h)
    .sort((a, b) => (b[1].slots[slot] || 0) - (a[1].slots[slot] || 0) || b[1].n - a[1].n || b[1].last - a[1].last)
    .slice(0, limit || 6)
    .map(([k, x]) => [k, x.g]);
}

/* Tek dokunuşla eklenecek miktar: daha önce yediysen son yediğin; yoksa 1 porsiyon
   (1 adet, 1 dilim…); onların hiçbiri tanımlı değilse 100 g. */
function defaultGrams(key, habits){
  const x = (habits || foodHabits())[key];
  if (x && x.g > 0) return x.g;
  const f = foodOf(key);
  if (f && f.unit) return f.unit;
  const P = porsOf(f);
  return P.length ? P[0].g : 100;
}
const foodKcal = (f, g) => Math.round((f.p*4 + f.c*4 + f.f*9) * g / 100);
/* "2 dilim (60 g)" yerine "2 dilim". */
const shortAmount = (k, g) => amountText({ k, g }).replace(/ \(\d+(?:\.\d+)? g\)$/, "");

function quickChips(){
  const list = quickFoods(addOpen, 5);
  if (!list.length) return "";
  return `<div class="metric-note" style="margin:0 0 8px">${tx("Sık yediklerin")}</div>
    <div class="fav" style="margin:0 0 12px">${list.map(([k, g]) =>
      `<button data-qadd="${esc(k)}" data-qg="${g}"><b>${esc(foodOf(k).n)}</b> · ${esc(shortAmount(k, g))}</button>`).join("")}</div>`;
}

/* Geri almak için günün kalori durumunu eklemeden önce kaydeder. */
const logSnap = entry => ({ kcal: entry.kcal, manual: entry.kcalManual, cleared: entry.logCleared, had: !!entry.log });
function undoLogAdd(day, ids, snap){
  const e = state.days[day];
  if (!e || !e.log) return false;
  const gone = new Set(ids.map(String));
  const left = e.log.filter(x => !gone.has(String(x.id)));
  if (left.length === e.log.length) return false;
  e.log = left;
  if (left.length) syncKcal(e);
  else {
    const put = (k, v) => { if (v === undefined) delete e[k]; else e[k] = v; };
    put("kcal", snap.kcal); put("kcalManual", snap.manual); put("logCleared", snap.cleared);
    if (!snap.had) delete e.log;
  }
  return true;
}
function toastUndo(msg, day, ids, snap){
  toast(msg, { label: tx("Geri al"), fn: async () => {
    if (!undoLogAdd(day, ids, snap)) return;
    await saveState(state); render();
    toast(tx("Geri alındı."));
  } });
}

/* Bir besini miktar sormadan ekler; panel açık kalır, toast'tan geri alınır.
   Çift dokunuşta iki kalem eklenmesin diye ekleme bitene kadar yenisi sayılmaz. */
let quickBusy = false;
async function quickAdd(entry, key, grams, opts){
  opts = opts || {};
  if (quickBusy || !foodOf(key) || !(grams > 0)) return null;
  quickBusy = true;
  try {
    if (!(await guardKcal(entry))) return null;
    const day = vKey(), snap = logSnap(entry);
    const it = addFoodDirect(entry, key, Math.round(grams), opts.slot || addOpen || defaultSlot());
    if (!it) return null;
    logPick = null; logQuery = "";
    await saveState(state); render();
    if (opts.refocus){ const q = document.getElementById("food-q"); if (q) q.focus({ preventScroll: true }); }
    toastUndo(tx("{0} eklendi · {1} kcal", [it.n, foodKcal(it, it.g)]), day, [it.id], snap);
    return it;
  } finally { quickBusy = false; }
}
