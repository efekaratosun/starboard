"use strict";

/* ---------------- alışveriş listesi ----------------
   Liste iki küçük sekmeye ayrılır:
      1) Listem: kullanıcının kendi girdiği ürünler.
      2) Öneriler: geçmiş günlük kullanımından sık çıkan ürünler.
   Eski plan günleri ve tarif seçimleri ekranda gösterilmez. Eski kayıt alanları
   (days, recipes, checked) silinmez; yalnızca yeni elle girilen ürünler items
   içinde tutulur. */
let shopTab = "mine";

function shopPrefs(){
  if (!state.shopping) state.shopping = { days:1, recipes:[], checked:{} };
  if (!state.shopping.checked || typeof state.shopping.checked !== "object") state.shopping.checked = {};
  return state.shopping;
}

function shopItems(){
  const items = state.shopping && state.shopping.items;
  return Array.isArray(items) ? items : [];
}
function shopOwnItems(){
  const manual = shopItems();
  const names = new Set(manual.map(x => shopNorm(shopItemName(x))));
  const custom = Object.entries(state.customFoods || {}).filter(([, f]) => f && typeof f.n === "string")
    .filter(([k, f]) => automaticFoodAllowed(k) && !names.has(shopNorm(f.n)))
    .map(([k, f]) => ({ id:k, n:f.n, k, custom:true }));
  return custom.concat(manual);
}
function ensureShopItems(){
  const P = shopPrefs();
  if (!Array.isArray(P.items)) P.items = [];
  return P.items;
}
const shopNorm = s => String(s || "").trim().toLocaleLowerCase("tr");
const shopItemName = x => typeof x === "string" ? x : (x && x.n) || "";
const shopItemId = x => typeof x === "string" ? "item_" + shopNorm(x) : x && x.id;

function addShopItem(name, fromKey){
  const clean = String(name || "").trim().slice(0, 80);
  if (!clean) return null;
  const items = ensureShopItems();
  if (shopOwnItems().some(x => shopNorm(shopItemName(x)) === shopNorm(clean))) return null;
  const id = "item_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  items.push(fromKey ? { id, n:clean, k:fromKey } : { id, n:clean });
  return id;
}

/* Öneriler yalnızca geçmişte gerçekten kullanılan besinlerden gelir. */
function shoppingSuggestions(){
  return favoriteFoods().filter(([k]) => !(state.customFoods || {})[k]).map(([k, v]) => ({
    k, n:(foodOf(k) || {}).n || v.name || k, count:v.n || 0
  }));
}

function shoppingView(){
  const P = shopPrefs(), items = shopOwnItems();
  const tabs = [["mine", tx("Listem")], ["suggest", tx("Öneriler")]].map(([k, label]) =>
    `<button role="tab" data-shop-tab="${k}" aria-selected="${shopTab === k}">${label}</button>`).join("");

  if (shopTab === "suggest"){
    const suggestions = shoppingSuggestions();
    const ownNames = new Set(items.map(x => shopNorm(shopItemName(x))));
    return `<section>
      <h2>${tx("Alışveriş listem")}</h2>
      <div class="shop-tabs" role="tablist" aria-label="${tx("Alışveriş listem")}">${tabs}</div>
      ${suggestions.length ? suggestions.map(s => {
        const added = ownNames.has(shopNorm(s.n)) || items.some(x => x && x.k === s.k);
        return `<div class="rt">
          <div class="m"><h3>${esc(s.n)}</h3><p>${s.count} ×</p></div>
          <button class="ghost" data-shop-suggest="${esc(s.k)}"${added ? " disabled" : ""}>${tx("Ekle")}</button>
        </div>`;
      }).join("") : `<div class="empty">${tx("Öneri yok.")}</div>`}
    </section>`;
  }

  const rows = items.map(x => {
    const id = shopItemId(x), on = !!P.checked[id];
    return `<div class="shop-entry">
      <button class="shop-row${on ? " on" : ""}" data-shop-item-check="${esc(id)}" aria-pressed="${on}">
        <span class="shop-ck" aria-hidden="true">${on ? icon("check") : ""}</span><span class="shop-t">${esc(shopItemName(x))}</span>
      </button>
      ${x.custom ? "" : `<button class="del" data-shop-item-del="${esc(id)}" aria-label="${tx("Listeden çıkar")}">×</button>`}
    </div>`;
  }).join("");

  return `<section>
    <h2>${tx("Alışveriş listem")}</h2>
    <div class="shop-tabs" role="tablist" aria-label="${tx("Alışveriş listem")}">${tabs}</div>
    <div class="shop-add">
      <input id="shop-item-input" type="text" maxlength="80" aria-label="${tx("Ürün adı")}" placeholder="${tx("Ürün adı")}" autocomplete="off">
      <button id="shop-item-add">${tx("Ekle")}</button>
    </div>
    ${rows || `<div class="empty">${tx("Listen boş.")}</div>`}
  </section>`;
}

function wireShopping(){
  const save = async () => { await saveState(state); render(); };

  app.querySelectorAll("[data-shop-tab]").forEach(b => b.onclick = () => {
    if (b.dataset.shopTab === shopTab) return;
    shopTab = b.dataset.shopTab;
    render();
  });

  const input = document.getElementById("shop-item-input");
  const add = async () => {
    if (!input) return;
    const id = addShopItem(input.value);
    if (!id) return;
    input.value = "";
    await save();
    const next = document.getElementById("shop-item-input");
    if (next) next.focus();
  };
  const addBtn = document.getElementById("shop-item-add");
  if (addBtn) addBtn.onclick = add;
  if (input) input.onkeydown = ev => { if (ev.key === "Enter"){ ev.preventDefault(); add(); } };

  app.querySelectorAll("[data-shop-item-check]").forEach(b => b.onclick = async () => {
    const P = shopPrefs(), id = b.dataset.shopItemCheck;
    if (P.checked[id]) delete P.checked[id]; else P.checked[id] = true;
    await save();
  });
  app.querySelectorAll("[data-shop-item-del]").forEach(b => b.onclick = async () => {
    const P = shopPrefs(), id = b.dataset.shopItemDel;
    const items = ensureShopItems();
    P.items = items.filter(x => shopItemId(x) !== id);
    delete P.checked[id];
    await save();
  });
  app.querySelectorAll("[data-shop-suggest]").forEach(b => b.onclick = async () => {
    const s = shoppingSuggestions().find(x => x.k === b.dataset.shopSuggest);
    if (!s || !addShopItem(s.n, s.k)) return;
    await save();
  });
}
