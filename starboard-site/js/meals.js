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
             : recipesView();
  return `<div class="seg">
    ${[["log","Günlüğüm"],["plan","Öneriler"],["recipes","Tarifler"]].map(([k,l]) =>
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
        <p>${r.t} · ${r.srv} porsiyon · P${m.serving.p} K${m.serving.c} Y${m.serving.f} · lif ${m.serving.lif} g</p></div>
      <span class="k num">${m.serving.kcal} kcal</span>
    </div>
    ${open ? `<div class="rec-body">
      <h4>Malzemeler (${r.srv} porsiyon)</h4>
      ${r.ing.map(([k,g]) => { const f = FOODS[k]; return f
        ? `<div class="rec-ing"><span>${f.n}</span><span>${f.unit ? `${Math.round(g/f.unit)} ${f.unitName}` : `${g} g`}</span></div>` : ""; }).join("")}
      <h4>Hazırlanışı</h4>
      <ol>${r.steps.map(s => `<li>${s}</li>`).join("")}</ol>
      <button class="ghost" data-recipe-add="${idx}" style="margin-top:6px">Günlüğüme 1 porsiyon ekle</button>
    </div>` : ""}
  </section>`;
}

/* Arama boşken üç tarif gösteriyoruz; "başka tarifler" listeyi kaydırıyor. */
/* Tarifin türü de aranabilsin: "balık" yazınca hamsi ve somon tarifleri de çıksın. */
const CAT_WORDS = { fish:"balık deniz ürünü", poultry:"tavuk kümes beyaz et", meat:"et kırmızı et kıyma",
  legume:"baklagil bakliyat", veg:"sebze zeytinyağlı", grain:"tahıl hamur pilav",
  dairy:"süt ürünü yoğurt", egg:"yumurta kahvaltı", nuts:"kuruyemiş", potato:"patates", bread:"hamur", fruit:"meyve tatlı" };

const recipeFits = r => r.ing.every(([k]) => foodAllowed(k, currentDiet()));

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
    if (!hits.length) return `<section><div class="empty">"${esc(recipeQuery)}" için tarif bulunamadı. Yemek adı ya da malzeme adıyla arayabilirsin.</div></section>`;
    return `<div class="metric-note" style="margin:0 4px 12px">${hits.length} tarif bulundu</div>`
      + hits.map(([r,i]) => recipeCard(r,i)).join("");
  }
  const pool = RECIPES.map((r,i) => [r,i]).filter(([r]) => recipeFits(r));
  if (!pool.length) return `<section><div class="empty">Seçtiğin beslenme türüne uyan hazır tarif yok. Arama kutusundan tüm tariflere bakabilirsin.</div></section>`;
  const start = recipeOffset % pool.length;
  const idxs = [0,1,2].map(k => pool[(start + k) % pool.length]);
  return (currentDiet() !== "hepsi"
      ? `<div class="metric-note" style="margin:0 4px 12px">${DIETS[currentDiet()]} beslenmeye uyan ${pool.length} tarif</div>` : "")
    + idxs.map(([r,i]) => recipeCard(r, i)).join("")
    + `<section><button class="ghost" id="rec-more">Başka tarifler göster</button></section>`;
}

function recipesView(){
  return `
  <section>
    <h2>Tarifler <span class="count">${RECIPES.length} tarif</span></h2>
    <input id="rec-q" type="text" placeholder="Ara: karnıyarık, mercimek, tavuk…" value="${esc(recipeQuery)}" autocomplete="off">
    <div class="metric-note" style="margin-top:10px">Yemek adıyla da malzemeyle de arayabilirsin. Değerler bir porsiyon içindir ve malzemelerden hesaplanır.</div>
  </section>
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
  return fold("micro", "Mikro besinler", `${keys.length - missing.length}/${keys.length}`, `
    <div class="pills">${keys.map(k => micros.has(k)
      ? `<span class="pill on"><svg class="ico"><use href="#i-check"/></svg>${NUTRIENTS[k].n}</span>`
      : `<span class="pill">${NUTRIENTS[k].n}</span>`).join("")}</div>
    ${missing.length ? `<div class="metric-note" style="margin-top:14px">
      ${missing.slice(0,4).map(k => `<b>${NUTRIENTS[k].n}</b> için: ${NUTRIENTS[k].src}`).join("<br>")}
    </div>` : `<div class="metric-note" style="margin-top:14px">On dört mikro besin kaynağının hepsinden bir şeyler almışsın.</div>`}
    <div class="metric-note" style="margin-top:12px">Bu bölüm miligram ölçmez; hangi besin grubundan bir şey yediğini gösterir. Ayrıntısı aşağıda.</div>`);
}

function logView(program, entry){
  const log = entry.log || [];
  const tot = logTotals(entry);
  const fib = fiberTarget(program);

  return `
  ${favBlock(entry)}
  <section>
    <h2>${onToday() ? "Bugün aldığın" : "O gün aldığın"} <span class="count">${tot.kcal} / ${program.kcal} kcal</span></h2>
    ${macroRow("Kalori", tot.kcal, program.kcal, "", "grain", "band")}
    ${macroRow("Protein", tot.p, program.protein, " g", "poultry", "mp")}
    ${macroRow("Karbonhidrat", tot.c, program.carb, " g", "bread", "mc")}
    ${macroRow("Yağ", tot.f, program.fat, " g", "oil", "mf")}
    ${macroRow("Lif", tot.lif, fib, " g", "veg", "ml")}
    ${tot.kcal > program.kcal * 1.1 ? `<div class="metric-note" style="margin-top:12px"><b class="out">Hedefi ${tot.kcal-program.kcal} kcal aştın.</b></div>`
      : tot.kcal ? `<div class="metric-note" style="margin-top:12px">Hedefe ${Math.max(program.kcal-tot.kcal,0)} kcal kaldı.</div>` : ""}
  </section>

  ${log.length ? microSection(tot.micros) : ""}

  ${mealCards(entry)}
  ${mealManager()}
  <div class="foot">Değerler ortalamadır; markalı ürünlerde ambalajdaki bilgiyi kullanmak daha doğru olur. Günlüğe kayıt girdiğin sürece Bugün sekmesindeki kalori alanı buradan hesaplanır.</div>`;
}

/* ---- dünün aynısı ----
   Kalemler kimlikleriyle birlikte kopyalanmaz; her kopya yeni kimlik alır
   ki düzenleme ve silme iki günü birden etkilemesin. */
/* Gün değişince açık kalan besin ekleme paneli, arama ve düzenleme
   yanlış güne yazılıyormuş gibi görünüyordu; gün değiştiren yollar sıfırlar. */
function resetMealUI(){
  addOpen = null; logPick = null; logQuery = ""; logCat = null; editLog = null;
  mealAddOpen = false;
}

function ydayLog(){
  const p = state.days[shiftDays(vKey(), -1)];
  return (p && p.log) ? p.log : [];
}
function copyItems(entry, items){
  entry.log = entry.log || [];
  for (const it of items) entry.log.push({ ...it, id: Date.now() + Math.random() });
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
      <h2>${esc(l)}${items.length ? `<span class="count">${kcalOf(items)} kcal</span>` : ""}</h2>
      ${items.length ? items.map(logLine).join("")
        : `<div class="empty">Bu öğüne henüz bir şey eklemedin.</div>`}
      ${addOpen === k ? addPanel()
        : `<button class="ghost" data-addfood="${k}" style="margin-top:12px">Besin ekle</button>
           ${yIt.length ? `<button class="ghost rep" data-copymeal="${k}" style="margin-top:8px">
             ↺ ${onToday() ? "Dünküyle" : "Bir önceki günle"} aynı (${yIt.length} kalem · ${kcalOf(yIt)} kcal)</button>` : ""}`}
    </section>`;
  });

  const other = log.filter(x => slotOf(x) === "__other");
  if (other.length) cards.push(`<section>
    <h2>Diğer <span class="count">${kcalOf(other)} kcal</span></h2>
    ${other.map(logLine).join("")}
    <div class="metric-note" style="margin-top:10px">Kaldırdığın bir öğüne ait kayıtlar. Silebilir ya da o öğünü geri ekleyebilirsin.</div>
  </section>`);

  return cards.join("");
}

/* Arama paneli açık olduğu öğünün kartının içinde durur; öğün zaten belli
   olduğu için ayrıca "hangi öğün" sormaya gerek kalmıyor. */
function addPanel(){
  return `<div class="pick" style="margin-top:12px">
    <input id="food-q" type="text" placeholder="Ara: karnıyarık, hellim, kivi…" value="${esc(logQuery)}" autocomplete="off">
    ${logQuery.trim().length >= 2 ? "" : catChips()}
    <div class="res" id="food-results">${resultsHTML()}</div>
    ${logPick ? pickCard() : ""}
    <div class="row" style="margin-top:12px">
      <button class="ghost" id="custom-toggle">Kendim tanımlayayım</button>
      <button class="ghost" id="add-close" style="flex:0 0 92px">Kapat</button>
    </div>
    <div id="custom-form"></div>
  </div>`;
}

function mealManager(){
  const list = userMeals();
  const shares = mealShares(list);
  const T = MEAL_TIMES.find(x => x.key === mealAddTime) || MEAL_TIMES[1];
  return `<section>
    <h2>Öğünlerim <span class="count">${list.length}</span></h2>
    ${list.map((m,i) => `<div class="rt">${iconBox(m.cat === "kahvalti" ? "egg" : m.cat === "ara" ? "fruit" : "grain")}
      <div class="m"><h3>${esc(m.name)}</h3><p>günlük hedefin %${Math.round(shares[i]*100)} kadarı · ${m.h}:00 civarı</p></div>
      ${list.length > 1 ? `<button class="del" data-meal-del="${m.id}" aria-label="Öğünü kaldır">×</button>` : ""}
    </div>`).join("")}
    ${mealAddOpen ? `<div class="pick">
      <div class="field"><label for="ml-name">Öğün adı</label>
        <input id="ml-name" type="text" placeholder="Örn. Öğle yemeği" autocomplete="off"></div>
      <label>Ne zaman</label>
      <div class="chips">${MEAL_TIMES.map(x =>
        `<button class="chip${mealAddTime===x.key?" sel":""}" data-meal-time="${x.key}">${x.label}</button>`).join("")}</div>
      <div class="row" style="margin-top:14px">
        <button id="ml-save">Ekle</button>
        <button class="ghost" id="ml-cancel" style="flex:0 0 100px">Vazgeç</button>
      </div>
      <div class="metric-note" style="margin-top:10px">Eklediğin öğün hem günlükte hem önerilerde çıkar; günlük hedef öğünler arasında yeniden bölünür.</div>
    </div>` : `<button class="ghost" id="ml-add" style="margin-top:12px">Öğün ekle</button>`}
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
  if (other.length) groups.push(["__other", "Diğer", other]);
  return groups.filter(([,,items]) => items.length).map(([,l,items]) => {
    const kc = items.reduce((a,it) => a + (it.p*4+it.c*4+it.f*9)*it.g/100, 0);
    return `<div class="slot-head"><span>${l}</span><span class="num">${Math.round(kc)} kcal</span></div>
      ${items.map(logLine).join("")}`;
  }).join("");
}

function logLine(it){
  const open = editLog === String(it.id);
  return `<div class="log-line${open ? " editing" : ""}">${iconBox(it.i || "grain")}
    <button class="m log-tap" data-log-edit="${it.id}" aria-expanded="${open}" aria-label="${esc(it.n)}, porsiyonu düzenle">
      <span class="lt-h">${esc(it.n)}</span><span class="lt-p">${amountText(it)} · P${Math.round(it.p*it.g/100)} K${Math.round(it.c*it.g/100)} Y${Math.round(it.f*it.g/100)}</span></button>
    <span class="k num">${Math.round((it.p*4+it.c*4+it.f*9)*it.g/100)} kcal</span>
    <button class="del" data-log-del="${it.id}" aria-label="Sil">×</button></div>
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
    <div class="lbl-row"><label for="le-amt">Miktar (${unit ? esc(f.unitName) : "g"})</label>
      <span class="lbl-v num" id="le-kcal">${Math.round((it.p*4+it.c*4+it.f*9)*it.g/100)} kcal</span></div>
    <div class="le-row">
      <button class="lf-sb" data-le-step="-1" aria-label="Azalt">−</button>
      <input id="le-amt" type="number" inputmode="decimal" value="${val}" data-unit="${unit ? f.unit : 1}">
      <button class="lf-sb" data-le-step="1" aria-label="Artır">+</button>
    </div>
    <div class="chips">${portionChips(f).map(([g,l]) => `<button class="chip${Math.abs(g - it.g) < 1 ? " sel" : ""}" data-le-g="${g}">${esc(l)}</button>`).join("")}</div>
    <label for="le-slot" style="margin-top:12px">Öğün</label>
    <select id="le-slot">${slotList().map(([k,l]) => `<option value="${k}"${(it.slot || "") === k ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>
    <div class="row" style="margin-top:14px">
      <button id="le-save">Kaydet</button>
      <button class="ghost" id="le-cancel" style="flex:0 0 100px">Vazgeç</button>
    </div>
  </div>`;
}

function favBlock(entry){
  const favs = favoriteFoods();
  const y = shiftDays(vKey(), -1);
  const yLog = (state.days[y] && state.days[y].log) || [];
  if (!favs.length && !yLog.length) return "";
  return `<section class="favs">
    <h2>Sık yediklerin <span class="count">dokun, eklensin</span></h2>
    ${favs.length ? `<div class="fav">${favs.map(([k,c]) =>
      `<button data-fav="${k}" data-fav-g="${c.g}" data-fav-slot="${c.slot||""}"><b>${esc(c.name)}</b> · ${c.g} g</button>`).join("")}</div>`
      : `<div class="empty">Besin ekledikçe sık kullandıkların burada birikecek.</div>`}
    ${yLog.length ? `<button class="ghost rep" id="copy-y" style="margin-top:14px">↺ ${onToday() ? "Dünün" : "Bir önceki günün"} tamamını kopyala (${yLog.length} kalem)</button>` : ""}
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

const CAT_LABELS = { kahvaltilik:"Kahvaltılık", sarkuteri:"Şarküteri", spor:"Spor & protein", ara:"Ara öğün",
  yemek:"Ana yemek", et:"Et & tavuk", balik:"Balık", sut:"Süt ürünleri", sebze:"Sebze",
  meyve:"Meyve", tahil:"Tahıl & ekmek", baklagil:"Baklagil", kuruyemis:"Kuruyemiş", yag:"Yağ & zeytin" };

const foodCat = f => f.cat || ICON_CAT[f.i] || "tahil";

function catCounts(){
  const c = {};
  for (const [,f] of allFoods()) { const k = foodCat(f); c[k] = (c[k]||0) + 1; }
  return c;
}

function foodRow(k, f){
  const P = porsOf(f);
  const per = f.unit ? ` · 1 ${f.unitName} ${Math.round((f.p*4+f.c*4+f.f*9)*f.unit/100)} kcal`
    : P.length ? ` · 1 ${P[0].n} ${Math.round((f.p*4+f.c*4+f.f*9)*P[0].g/100)} kcal` : "";
  return `<div class="item" data-food="${k}">${iconBox(f.i || "grain")}
    <div class="item-main"><h3>${esc(f.n)}</h3><p>100 g: ${Math.round(f.p*4+f.c*4+f.f*9)} kcal${per}</p></div>
    <span class="add">+</span></div>`;
}

/* Kelime sırasından bağımsız arama: sorgudaki her kelime adın bir kelimesinde
   geçmeli. Tam kelime > kelime başı > kelime içi diye puanlanır, böylece
   "hindi" yazınca "Hindi salam" "Hindistan cevizi"nden önce gelir. */
function matchScore(text, q){
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
    if (!best) return 0;
    score += best;
  }
  return score;
}
/* Ad eşleşmesi takma ad eşleşmesinden biraz öne geçer. */
function foodScore(f, q){
  const a = matchScore(f.n, q);
  if (a) return a + 0.5;
  return f.a ? matchScore(f.n + " " + f.a, q) : 0;
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
  return allFoods()
    .map(([k,f]) => [k, f, foodScore(f, q)])
    .filter(x => x[2] > 0)
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
    if (!hits.length) return `<div class="empty" style="padding-top:12px">Bulunamadı. Aşağıdan kendin tanımlayabilirsin.</div>`;
    return hits.map(([k,f]) => foodRow(k,f)).join("");
  }
  if (logCat){
    const list = allFoods().filter(([,f]) => foodCat(f) === logCat)
      .sort((a,b) => a[1].n.localeCompare(b[1].n, "tr"));
    return `<div class="metric-note" style="margin:12px 4px 0">${CAT_LABELS[logCat]} · ${list.length} kalem</div>`
      + list.map(([k,f]) => foodRow(k,f)).join("");
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
const nfmt = n => Number.isInteger(n) ? String(n) : String(n).replace(".", ",");

function pickCard(){
  const f = foodOf(logPick);
  if (!f) return "";
  const def = f.unit ? 1 : 100;
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
    <label for="pick-amt">Miktar (${f.unit ? f.unitName : "g"})</label>
    <input id="pick-amt" type="number" inputmode="decimal" value="${def}">
    <div class="chips">${chips.map(([v,l]) => `<button class="chip" data-amt="${v}">${esc(l)}</button>`).join("")}</div>
    ${f.unit ? `<div class="metric-note" style="margin-top:9px">1 ${esc(f.unitName)} ≈ ${f.unit} g</div>`
      : P.length ? `<div class="metric-note" style="margin-top:9px">${P.map(x => `1 ${esc(x.n)} ≈ ${x.g} g`).join(" · ")}</div>` : ""}
    <div class="row" style="margin-top:14px">
      <button id="pick-add">Ekle</button>
      <button class="ghost" id="pick-cancel" style="flex:0 0 100px">Vazgeç</button>
    </div>
  </div>`;
}

function fixResults(){
  const q = norm(fixQuery.trim());
  if (q.length < 2) return "";
  const hits = searchFoods(fixQuery, 8);
  if (!hits.length) return `<div class="empty" style="padding-top:10px">Bulunamadı.</div>`;
  return hits.map(([k,f]) => `<div class="item" data-fixfood="${k}">${iconBox(f.i || "grain")}
    <div class="item-main"><h3>${esc(f.n)}</h3><p>100 g: ${Math.round(f.p*4+f.c*4+f.f*9)} kcal</p></div>
    <span class="add">+</span></div>`).join("");
}

function fixPicker(){
  const f = fixPick ? foodOf(fixPick) : null;
  const chips = f && f.unit ? [1,2,3] : [50,100,150,200];
  return `<div class="pick">
    <label for="fix-q">Ne yiyeceksin?</label>
    <input id="fix-q" type="text" placeholder="Ara: yumurta, döner, muz…" value="${esc(fixQuery)}" autocomplete="off">
    <div class="res" id="fix-res">${fixResults()}</div>
    ${f ? `<div style="margin-top:14px">
      <label for="fix-amt">${esc(f.n)} — miktar (${f.unit ? f.unitName : "g"})</label>
      <input id="fix-amt" type="number" inputmode="decimal" value="${f.unit ? 1 : 100}">
      <div class="chips">${chips.map(c => `<button class="chip" data-fixamt="${c}">${c} ${f.unit?f.unitName:"g"}</button>`).join("")}</div>
      <button id="fix-save" style="margin-top:12px">Bu öğüne ekle</button>
    </div>` : ""}
    <div class="metric-note" style="margin-top:10px">Eklediğin miktar hedeften düşülür, günün kalanı diğer öğünlere göre yeniden hesaplanır.</div>
  </div>`;
}

function prefsSection(){
  const prefs = mealPrefs();
  const usage = foodUsage();
  const known = Object.keys(usage).filter(k => usage[k] >= 2).length;

  return `<section>
    <h2>Önerileri kendine göre ayarla</h2>
    <label for="diet-sel">Beslenme türü</label>
    <select id="diet-sel" style="margin-bottom:14px">${Object.entries(DIETS)
      .map(([k,l]) => `<option value="${k}"${currentDiet()===k?" selected":""}>${l}</option>`).join("")}</select>
    <div class="chips">
      <button class="chip${prefs.useMine?" sel":""}" id="use-mine">
        <svg class="ico" style="width:14px;height:14px;flex:0 0 14px;vertical-align:-2px" aria-hidden="true"><use href="#i-repeat"/></svg>
        Sık yediğim besinlerle kur</button>
    </div>
    <div class="metric-note" style="margin-top:10px">${known
      ? `Günlüğünde en az iki kez geçen ${known} besin var; bunlar önerilerde öncelikli kullanılıyor.`
      : "Günlüğe besin girdikçe öneriler senin yediklerine yaklaşır. Şu an varsayılan kombinasyonlar gösteriliyor."}</div>
    ${currentDiet() !== "hepsi" ? `<div class="metric-note" style="margin-top:10px">
      ${DIETS[currentDiet()]} seçili: ${Object.keys(FOODS).filter(k => foodAllowed(k, currentDiet())).length}
      besin uygun, kalanı önerilerden çıkarıldı. Günlüğe istediğini yazmaya devam edebilirsin.</div>` : ""}
    ${prefs.exclude.length ? `<div style="margin-top:14px">
      <div class="metric-note" style="margin-bottom:8px">Önerilerden çıkardıkların:</div>
      <div class="chips">${prefs.exclude.map(k => `<button class="chip" data-munex="${k}">
        ${esc((FOODS[k]||{n:k}).n)} <span style="opacity:.6">geri al</span></button>`).join("")}</div>
    </div>` : ""}
  </section>`;
}

function planView(program){
  const plan = buildMeals(program, mealVariant);
  const off = Math.abs(plan.total.kcal - program.kcal);

  return `
  <section>
    <h2>${plan.setName} <span class="count">${plan.total.kcal} kcal</span></h2>
    ${macroRow("Kalori", plan.total.kcal, program.kcal, "", "grain", "band")}
    ${macroRow("Protein", plan.total.p, program.protein, " g", "poultry", "mp")}
    ${macroRow("Karbonhidrat", plan.total.c, program.carb, " g", "bread", "mc")}
    ${macroRow("Yağ", plan.total.f, program.fat, " g", "oil", "mf")}
    ${macroRow("Lif", plan.total.lif, fiberTarget(program), " g", "veg", "ml")}
    ${off > program.kcal * 0.08 ? `<div class="metric-note" style="margin-top:12px">
      <b class="out">Bu kombinasyon hedeften ${off} kcal ${plan.total.kcal>program.kcal?"yüksek":"düşük"}.</b>
      Yağlı besinler kendi yağını da getirdiği için bazı setler düşük kalorili hedeflere oturmuyor; başka kombinasyon dene.</div>` : ""}
    <button class="ghost" id="reroll" style="margin-top:14px">Başka kombinasyon</button>
  </section>
  ${prefsSection()}
  ${microSection(plan.micros)}
  ${plan.meals.map(m => `<section>
    <h2>${m.name} <span class="count">${m.kcal} kcal</span></h2>
    ${m.items.map(i => {
      const rec = i.key ? recipeFor(i.key) : null;
      return `<div class="item">${iconBox(i.icon)}
      ${rec
        ? `<button class="item-main tap" data-recipefor="${i.key}">
             <h3>${esc(i.text)}</h3>
             <p>${i.fixed?"senin girdiğin · ":""}${rec.idx >= 0 ? "tarifi gör" : rec.uses + " tarifte kullanılıyor"}</p>
           </button><svg class="ico chev" aria-hidden="true"><use href="#i-next"/></svg>`
        : `<div class="item-main"><h3>${esc(i.text)}</h3>${i.fixed?`<p>senin girdiğin</p>`:""}</div>`}
      ${i.fixed
        ? `<button class="del" data-fixdel="${m.slot}|${i.key}" aria-label="Kaldır">×</button>`
        : i.key ? `<button class="del" data-mex="${i.key}" aria-label="Bu besini önerilerden çıkar">×</button>` : ""}
    </div>`; }).join("")}
    ${m.full ? `<div class="metric-note" style="margin-top:10px">Bu öğün girdiklerinle doldu; günün kalanı diğer öğünlere dağıtıldı.</div>` : ""}
    <button class="ghost" data-fixadd="${m.slot}" style="margin-top:12px">${fixSlot===m.slot?"Kapat":"Kendi yiyeceğini ekle"}</button>
    ${fixSlot===m.slot ? fixPicker() : ""}
  </section>`).join("")}
  <div class="foot">Miktarlar pişmemiş/ham ağırlıktır. Ortalama besin değerlerine göre hesaplandığı için markaya ve pişirmeye göre sapma olur.</div>`;
}

function wireMeals(entry){
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

  app.querySelectorAll("[data-fav]").forEach(b => b.onclick = async () => {
    if (!(await guardKcal(entry))) return;
    addFoodDirect(entry, b.dataset.fav, Number(b.dataset.favG), b.dataset.favSlot || null);
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
    copyItems(entry, items);
    syncKcal(entry);                 /* günlük doldu, günün kalorisi de güncellensin */
    await saveState(state); render();
    toast(`${items.length} kalem kopyalandı.`);
  });

  app.querySelectorAll("[data-addfood]").forEach(b => b.onclick = () => {
    addOpen = b.dataset.addfood;
    logQuery = ""; logCat = null; logPick = null;
    render();
    const el = document.getElementById("food-q");
    if (el) el.scrollIntoView({ behavior:"smooth", block:"center" });
  });
  const addClose = document.getElementById("add-close");
  if (addClose) addClose.onclick = () => { addOpen = null; logPick = null; logQuery = ""; logCat = null; render(); };

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
    entry.log = entry.log || [];
    for (const it of yLog) entry.log.push({ ...it, id: Date.now()+Math.random() });
    syncKcal(entry);
    await saveState(state); render();
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
      if (!g){ toast("Geçerli bir miktar gir."); return; }
      it.g = Math.round(g);
      it.slot = document.getElementById("le-slot").value;
      editLog = null;
      syncKcal(entry);
      await saveState(state); render();
      toast("Porsiyon güncellendi.");
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
    bindResults();
  };
  bindResults();

  app.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => {
    logCat = logCat === b.dataset.cat ? null : b.dataset.cat;
    logQuery = ""; logPick = null;
    render();
  });

  const amt = document.getElementById("pick-amt");
  if (amt) {
    app.querySelectorAll("[data-amt]").forEach(b => b.onclick = () => { amt.value = b.dataset.amt; });
    document.getElementById("pick-cancel").onclick = () => { logPick = null; render(); };
    document.getElementById("pick-add").onclick = async () => {
      const f = FOODS[logPick] || (state.customFoods||{})[logPick];
      const n = num(amt.value);
      if (!f || !n || n <= 0) return;
      if (!(await guardKcal(entry))) return;
      const grams = f.unit ? n * f.unit : n;
      entry.log = entry.log || [];
      entry.log.push({ id: Date.now()+Math.random(), k:logPick, n:f.n, g:Math.round(grams),
        p:f.p, c:f.c, f:f.f, lif:f.lif || 0, v:f.v || [], i:f.i, slot: addOpen || defaultSlot() });
      syncKcal(entry);
      logPick = null; logQuery = "";
      await saveState(state); render();
    };
  }


  const ct = document.getElementById("custom-toggle");
  if (ct) ct.onclick = () => {
    const box = document.getElementById("custom-form");
    if (box.innerHTML) { box.innerHTML = ""; return; }
    box.innerHTML = `<div class="pick">
      <h3>Kendi besinin</h3>
      <div class="field"><label for="cf-n">Ad</label><input id="cf-n" type="text" placeholder="Annemin mercimek köftesi"></div>
      <div class="row">
        <div class="field"><label for="cf-p">Protein</label><input id="cf-p" type="number" inputmode="decimal" placeholder="g/100g"></div>
        <div class="field"><label for="cf-c">Karb.</label><input id="cf-c" type="number" inputmode="decimal" placeholder="g/100g"></div>
        <div class="field"><label for="cf-f">Yağ</label><input id="cf-f" type="number" inputmode="decimal" placeholder="g/100g"></div>
      </div>
      <button id="cf-save">Kaydet</button>
      <div class="metric-note" style="margin-top:10px">Değerleri 100 gram başına gir. Bir kere tanımladığın besin aramada çıkar.</div>
    </div>`;
    document.getElementById("cf-save").onclick = async () => {
      const n = document.getElementById("cf-n").value.trim();
      const p = num(document.getElementById("cf-p").value) || 0;
      const c = num(document.getElementById("cf-c").value) || 0;
      const f = num(document.getElementById("cf-f").value) || 0;
      if (!n || (p+c+f) === 0) return;
      state.customFoods = state.customFoods || {};
      const key = "cf_" + Date.now();
      state.customFoods[key] = { n, p, c, f, lif:0, i:"grain" };
      logPick = key; logQuery = n;
      await saveState(state); render();
    };
  };
}

function bindFix(){
  app.querySelectorAll("[data-fixfood]").forEach(b => b.onclick = () => { fixPick = b.dataset.fixfood; render(); });
}

function bindResults(){
  app.querySelectorAll("[data-food]").forEach(b => b.onclick = () => {
    logPick = b.dataset.food; render();
    const el = document.getElementById("pick-amt");
    if (el) el.scrollIntoView({ behavior:"smooth", block:"center" });
  });
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
  if (!f) return;
  entry.log = entry.log || [];
  entry.log.push({ id: Date.now()+Math.random(), k:key, n:f.n, g:grams,
    p:f.p, c:f.c, f:f.f, lif:f.lif || 0, v:f.v || [], i:f.i, slot: slot || defaultSlot() });
  syncKcal(entry);
}
