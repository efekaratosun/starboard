"use strict";

/* ---------------- alışveriş listesi ----------------
   Liste iki kaynaktan toplanır:
     1) öneri planının seçilen gün sayısı kadarı: her gün öğün kartındaki "Başka"daki
        gibi sıradaki planı kullanır, böylece haftalık liste yedi kez aynı şey olmaz;
     2) listeye eklenen tariflerin bütün malzemeleri.
   Aynı besin tek satırda toplanır, satırlar market reyonlarına göre gruplanır.
   Salata ve yan sebze gibi yalnızca metin olan öneriler listeye girmez.

   Liste kayda yazılmaz, her açılışta hesaplanır. Kayıtta yalnızca seçimler durur:
     state.shopping = { days, recipes:[tarifin RECIPES'teki sırası], checked:{ besin: true } }
   Tarifler yalnızca listenin sonuna eklendiği için sıra numarası kalıcıdır. */
const SHOP_DAYS = [0, 1, 3, 7];
/* Reyon sırası: markette genellikle karşılaşılan sıraya yakın. */
const SHOP_ORDER = ["sebze","meyve","et","balik","sarkuteri","sut","kahvaltilik","tahil","baklagil","kuruyemis","yag","yemek","ara","spor"];

function shopPrefs(){
  if (!state.shopping) state.shopping = { days:1, recipes:[], checked:{} };
  return state.shopping;
}

/* Hesap: [{ k, g, cat }] — g toplam gram. Metin içermez. */
function shoppingList(program, prefs, variant){
  const sum = new Map();
  const add = (k, g) => { if (foodOf(k) && g > 0) sum.set(k, (sum.get(k) || 0) + g); };
  if (program) for (let d = 0; d < prefs.days; d++)
    for (const meal of buildMeals(program, variant + d).meals)
      for (const it of meal.items) if (it.key && it.g) add(it.key, it.g);
  for (const i of prefs.recipes){
    const r = RECIPES[i];
    if (r) for (const [k, g] of r.ing) add(k, g);
  }
  return [...sum].map(([k, g]) => ({ k, g: Math.round(g), cat: foodCat(foodOf(k)) }));
}

function shopGroups(list){
  const order = SHOP_ORDER.concat([...new Set(list.map(x => x.cat))].filter(c => !SHOP_ORDER.includes(c)));
  return order.map(c => [c, list.filter(x => x.cat === c)
    .sort((a, b) => foodOf(a.k).n.localeCompare(foodOf(b.k).n, locale()))]).filter(([, xs]) => xs.length);
}
const shopText = x => portion(foodOf(x.k), x.g).text;

function shoppingView(program){
  const P = shopPrefs(), list = shoppingList(program, P, planDay() + mealVariant);
  const left = list.filter(x => !P.checked[x.k]).length;
  const row = x => { const on = !!P.checked[x.k]; return `<button class="shop-row${on ? " on" : ""}" data-shop-k="${esc(x.k)}" aria-pressed="${on}">
      <span class="shop-ck" aria-hidden="true">${on ? icon("check") : ""}</span><span class="shop-t">${esc(shopText(x))}</span></button>`; };
  return `<section>
    <h2>${tx("Alışveriş listesi")}${list.length ? ` <span class="count">${tx("{0} / {1} kaldı", [(left), (list.length)])}</span>` : ""}</h2>
    <label>${tx("Öneri planından")}</label>
    <div class="chips">${SHOP_DAYS.map(d => `<button class="chip${P.days === d ? " sel" : ""}" data-shop-days="${d}" aria-pressed="${P.days === d}">${d ? tx("{0} gün", [(d)]) : tx("Yok")}</button>`).join("")}</div>
    <div style="height:14px"></div>
    <label>${tx("Tarifler")}</label>
    ${P.recipes.length ? P.recipes.filter(i => RECIPES[i]).map(i => `<div class="rt">${iconBox(RECIPES[i].i)}
      <div class="m"><h3>${RECIPES[i].n}</h3><p>${tx("{0} porsiyon", [(RECIPES[i].srv)])}</p></div>
      <button class="del" data-shop-rdel="${i}" aria-label="${tx("Listeden çıkar")}">×</button></div>`).join("")
      : `<div class="metric-note">${tx("Tarifler sekmesinde bir tarifi açıp listeye ekleyebilirsin.")}</div>`}
  </section>
  ${list.length ? shopGroups(list).map(([c, xs]) => `<section>
    <h2>${CAT_LABELS[c] || c}</h2>${xs.map(row).join("")}</section>`).join("")
    : `<section><div class="empty">${tx("Liste boş. Öneri planından gün seç ya da tarif ekle.")}</div></section>`}
  ${list.length ? `<section>
    <div class="row"><button class="ghost" id="shop-share">${tx("Paylaş")}</button>
      <button class="ghost" id="shop-clear">${tx("İşaretleri kaldır")}</button></div>
    <div class="metric-note" style="margin-top:10px">${tx("Salata ve yan sebzeler listeye girmez.")}</div>
  </section>` : ""}`;
}

/* Tarif kartındaki düğme. */
const recipeListBtn = idx => {
  const inList = !!(state.shopping && state.shopping.recipes.includes(idx));
  return `<button class="ghost" data-recipe-list="${idx}" style="margin-top:8px">${inList ? tx("Listeden çıkar") : tx("Alışveriş listesine ekle")}</button>`;
};

function wireShopping(program){
  const save = async () => { await saveState(state); render(); };
  app.querySelectorAll("[data-recipe-list]").forEach(b => b.onclick = async () => {
    const P = shopPrefs(), i = Number(b.dataset.recipeList);
    if (P.recipes.includes(i)) P.recipes = P.recipes.filter(x => x !== i);
    else { P.recipes.push(i); toast(tx("Tarif alışveriş listesine eklendi.")); }
    await save();
  });
  app.querySelectorAll("[data-shop-days]").forEach(b => b.onclick = async () => { shopPrefs().days = Number(b.dataset.shopDays); await save(); });
  app.querySelectorAll("[data-shop-rdel]").forEach(b => b.onclick = async () => {
    const P = shopPrefs(), i = Number(b.dataset.shopRdel);
    P.recipes = P.recipes.filter(x => x !== i); await save();
  });
  app.querySelectorAll("[data-shop-k]").forEach(b => b.onclick = async () => {
    const P = shopPrefs(), k = b.dataset.shopK;
    if (P.checked[k]) delete P.checked[k]; else P.checked[k] = true;
    await save();
  });
  const clear = document.getElementById("shop-clear");
  if (clear) clear.onclick = async () => { shopPrefs().checked = {}; await save(); };
  const share = document.getElementById("shop-share");
  if (share) share.onclick = async () => {
    const P = shopPrefs();
    const text = shopGroups(shoppingList(program, P, planDay() + mealVariant)).map(([c, xs]) =>
      (CAT_LABELS[c] || c) + "\n" + xs.filter(x => !P.checked[x.k]).map(x => "• " + shopText(x)).join("\n"))
      .filter(s => s.includes("•")).join("\n\n");
    try {
      if (navigator.share){ await navigator.share({ title: tx("Alışveriş listesi"), text }); return; }
      await navigator.clipboard.writeText(text);
      toast(tx("Liste kopyalandı."));
    } catch(e){ /* paylaşım iptal edildi */ }
  };
}
