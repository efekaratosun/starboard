"use strict";

/* ---------------- yemek kısayolu: + düğmesi ----------------
   Sabit + düğmesi artık yemek ekler: "Ne yedin?" yazılır (ya da klavyedeki mikrofonla söylenir),
   cümle kendi besin listenle eşleşir, onay listesinde düzeltilir ve öğüne eklenir.
   Her şey cihazda olur; ağa hiçbir şey çıkmaz (eşleştirme: voice-parse.js).
   Su, kilo, uyku, adım ve görev girişleri Bugün sayfasındaki kendi satırlarındadır. */

function mealSheetParse(text){
  const use = foodUsage();
  return parseMeal(text, allFoods(), { usage: k => use[k] || 0, pop: vpPopularity(foodPop) }).items;
}

function openMealSheet(){
  const k = vKey();
  const past = k !== today();
  let slot = defaultSlot();
  let text = "";
  let rows = null;        /* null: yazı ekranı; dizi: onay listesi */
  let extras = [];
  let open = -1;          /* "Değiştir" listesi açık olan kalem */
  let busy = false;

  const el = document.createElement("div");
  el.className = "sheet-bg";
  const close = () => sheetOut(el);

  const slotChips = () => `<div class="chips vs-slots" role="group" aria-label="${tx("Öğün")}">${slotList().map(([id, name]) =>
    `<button class="chip${id === slot ? " sel" : ""}" data-vs-slot="${esc(id)}" aria-pressed="${id === slot}">${esc(name)}</button>`).join("")}</div>`;
  const slotName = () => (slotList().find(([id]) => id === slot) || [, ""])[1];
  const kcalOf = (key, g) => { const f = foodOf(key); return f ? foodKcal(f, g) : 0; };

  const hookSlots = () => el.querySelectorAll("[data-vs-slot]").forEach(b => b.onclick = () => {
    slot = b.dataset.vsSlot;
    el.querySelectorAll("[data-vs-slot]").forEach(x => {
      x.classList.toggle("sel", x === b); x.setAttribute("aria-pressed", String(x === b));
    });
    const add = el.querySelector("#vs-add");
    if (add) add.textContent = tx("{0} öğününe ekle", [slotName()]);
  });

  const links = () => `<div class="vs-links">
      ${barcodeAvailable() ? `<button class="link" id="vs-bc">${icon("barcode")}${tx("Barkod okut")}</button>` : ""}
      <button class="link" id="vs-hand">${tx("Elle ekle")}</button></div>`;
  const hookLinks = () => {
    const bc = el.querySelector("#vs-bc");
    if (bc) bc.onclick = () => { close(); startBarcodeFlow(); };
    el.querySelector("#vs-hand").onclick = () => {
      close(); tab = "meals"; mealTab = "log"; addOpen = slot; render(); window.scrollTo(0, 0);
    };
  };

  /* ---- 1. yazı ekranı ---- */
  const drawWrite = err => {
    el.querySelector("#vs-b").innerHTML = `
      ${slotChips()}
      <label class="vs-l" for="vs-t">${tx("Ne yedin?")}</label>
      <textarea id="vs-t" class="vs-t" rows="3" maxlength="400" autocomplete="off" autocapitalize="sentences"
        placeholder="${tx("örn. iki yumurta, beş zeytin, bir dilim beyaz peynir")}">${esc(text)}</textarea>
      <div class="vs-hint">${tx("İstersen klavyedeki mikrofona basıp söyle. Yazı yalnızca bu telefonda eşleştirilir.")}</div>
      <div class="metric-note cf-warn" id="vs-err" role="alert">${err ? esc(err) : ""}</div>
      <button class="vs-go" id="vs-list">${tx("Listele")}</button>
      ${links()}`;
    hookSlots(); hookLinks();
    const ta = el.querySelector("#vs-t");
    ta.oninput = () => { text = ta.value; };
    const go = () => {
      text = ta.value.trim();
      if (!text){ drawWrite(tx("Önce ne yediğini yaz ya da söyle.")); return; }
      const found = mealSheetParse(text);
      if (!found.some(it => it.key)){ drawWrite(tx("Anlayamadım. Besinin adını biraz farklı söyle ya da Elle ekle'yi dene.")); return; }
      rows = found.map(it => ({ ...it, keep: true }));
      extras = [];
      found.forEach((it, i) => (it.extras || []).forEach(x => extras.push({ ...x, on: !!x.auto })));
      open = -1;
      drawConfirm();
    };
    el.querySelector("#vs-list").onclick = go;
    ta.focus({ preventScroll: true });
  };

  /* ---- 2. onay listesi ---- */
  const total = () => {
    let t = 0;
    for (const r of rows) if (r.keep && r.key && !r.water) t += kcalOf(r.key, r.g);
    for (const x of extras) if (x.on) t += kcalOf(x.key, x.g);
    return t;
  };
  const itemCount = () => rows.filter(r => r.keep && r.key).length + extras.filter(x => x.on).length;

  const rowHTML = (r, i) => {
    if (!r.key){
      return `<div class="vs-it vs-miss"><div class="vs-m"><b>${tx("Bulamadım")}</b><i>«${esc(r.raw)}»</i></div>
        <button class="vs-x" data-vs-del="${i}" aria-label="${tx("Kaldır")}">×</button></div>`;
    }
    if (r.water){
      return `<div class="vs-it${r.keep ? "" : " off"}"><div class="vs-m"><b>${tx("Su")}</b><i>${tx("{0} ml · su takibine yazılır", [r.ml])}</i></div>
        <button class="vs-x" data-vs-del="${i}" aria-label="${tx("Kaldır")}">×</button></div>`;
    }
    const f = foodOf(r.key);
    const low = r.conf === "low" && r.alts && r.alts.length > 1;
    const note = low ? `<span class="vs-q">${tx("Hangisi?")}</span>` : (r.approx ? `<span class="vs-q">${tx("miktar tahmini")}</span>` : "");
    return `<div class="vs-it${r.keep ? "" : " off"}">
        <div class="vs-m"><b>${esc(f ? f.n : r.name)}</b>
          <i>${esc(amountText({ k: r.key, g: r.g }))} · ${tx("{0} kcal", [kcalOf(r.key, r.g)])} ${note}</i>
          ${low ? `<button class="link vs-chg" data-vs-chg="${i}" aria-expanded="${open === i}">${tx("Değiştir")}</button>` : ""}</div>
        <input class="vs-g" data-vs-g="${i}" type="text" inputmode="decimal" value="${r.g}" aria-label="${tx("Gram")}"><span class="vs-gu" aria-hidden="true">g</span>
        <button class="vs-x" data-vs-del="${i}" aria-label="${tx("Kaldır")}">×</button>
      </div>
      ${open === i ? `<div class="vs-alts">${r.alts.map((a, j) => `<button class="vs-alt${a.key === r.key ? " sel" : ""}" data-vs-alt="${i}:${j}">
          <b>${esc(a.name)}</b><i>${esc(amountText({ k: a.key, g: a.g }))} · ${tx("{0} kcal", [kcalOf(a.key, a.g)])}</i></button>`).join("")}</div>` : ""}`;
  };

  const drawConfirm = () => {
    const n = itemCount();
    el.querySelector("#vs-b").innerHTML = `
      <div class="vs-note">${tx("Anladıklarım. Yanlış varsa düzelt, sen onaylamadan hiçbir şey yazılmaz.")}</div>
      <div class="vs-list">${rows.map(rowHTML).join("")}</div>
      ${extras.length ? `<div class="vs-ex">${extras.map((x, i) => `<label class="vs-xr">
          <input type="checkbox" data-vs-ex="${i}"${x.on ? " checked" : ""}>
          <span><b>${tx("Üstüne")} ${esc(x.name)}</b><i>${esc(shortAmount(x.key, x.g))} · ${tx("{0} kcal", [kcalOf(x.key, x.g)])}${x.auto ? "" : " · " + tx("istersen ekle")}</i></span></label>`).join("")}</div>` : ""}
      <div class="vs-foot">
        <div class="vs-tot"><span>${tx("Toplam")}</span><b>${tx("{0} kcal", [total()])}</b></div>
        <button class="vs-go" id="vs-add"${n ? "" : " disabled"}>${tx("{0} öğününe ekle", [slotName()])}</button>
        <button class="link vs-back" id="vs-back">${tx("Yeniden söyle ya da düzenle")}</button>
      </div>`;
    wireConfirm();
  };

  const wireConfirm = () => {
    el.querySelectorAll("[data-vs-del]").forEach(b => b.onclick = () => {
      rows.splice(+b.dataset.vsDel, 1); open = -1; drawConfirm();
    });
    el.querySelectorAll("[data-vs-g]").forEach(inp => inp.onchange = () => {
      const i = +inp.dataset.vsG, n = num(inp.value);
      if (n !== null && n > 0 && n < 5000) rows[i].g = Math.round(n * 10) / 10;
      drawConfirm();
    });
    el.querySelectorAll("[data-vs-chg]").forEach(b => b.onclick = () => {
      const i = +b.dataset.vsChg; open = open === i ? -1 : i; drawConfirm();
    });
    el.querySelectorAll("[data-vs-alt]").forEach(b => b.onclick = () => {
      const [i, j] = b.dataset.vsAlt.split(":").map(Number), a = rows[i].alts[j];
      rows[i] = { ...rows[i], key: a.key, name: a.name, g: a.g, approx: a.approx, conf: "high" };
      open = -1; drawConfirm();
    });
    el.querySelectorAll("[data-vs-ex]").forEach(c => c.onchange = () => { extras[+c.dataset.vsEx].on = c.checked; drawConfirm(); });
    el.querySelector("#vs-back").onclick = () => drawWrite();
    el.querySelector("#vs-add").onclick = addAll;
  };

  const addAll = async () => {
    if (busy) return;
    busy = true;
    try {
      const entry = ensureDay(k);
      const foods = rows.filter(r => r.keep && r.key && !r.water), water = rows.filter(r => r.keep && r.water);
      const adds = extras.filter(x => x.on);
      if ((foods.length || adds.length) && !(await guardKcal(entry))) return;
      const snap = logSnap(entry), prevWater = entry.water, ids = [];
      for (const r of foods){ const it = addFoodDirect(entry, r.key, Math.round(r.g), slot); if (it) ids.push(it.id); }
      for (const x of adds){ const it = addFoodDirect(entry, x.key, Math.round(x.g), slot); if (it) ids.push(it.id); }
      const ml = water.reduce((a, r) => a + r.ml, 0);
      if (ml) entry.water = Math.round((entry.water || 0) + ml);
      const kc = foods.reduce((a, r) => a + kcalOf(r.key, Math.round(r.g)), 0) + adds.reduce((a, x) => a + kcalOf(x.key, Math.round(x.g)), 0);
      await saveState(state);
      close(); render();
      const parts = [];
      if (ids.length) parts.push(tx("{0} kalem eklendi · {1} kcal", [ids.length, kc]));
      if (ml) parts.push(tx("{0} ml su", [ml]));
      toast(parts.join(" · "), { label: tx("Geri al"), fn: async () => {
        if (ids.length && !undoLogAdd(k, ids, snap)) return;
        const e = state.days[k];
        if (ml && e){ if (prevWater === undefined) delete e.water; else e.water = prevWater; }
        await saveState(state); render();
        toast(tx("Geri alındı."));
      } });
    } finally { busy = false; }
  };

  el.innerHTML = `<div class="sheet vs" role="dialog" aria-modal="true" aria-labelledby="vs-t-h">
    <div class="sheet-h"><span class="qs-logo">${BRAND_SVG}</span>
      <b id="vs-t-h">${tx("Yemek ekle")}</b>
      <button class="sheet-x" aria-label="${tx("Kapat")}">×</button></div>
    ${past ? `<div class="metric-note" style="margin:-2px 0 4px">${tx("{0} gününe yazılıyor.", [prettyDate(k)])}</div>` : ""}
    <div id="vs-b"></div>
  </div>`;
  document.body.appendChild(el);
  drawWrite();
  el.onclick = ev => { if (ev.target === el) close(); };
  el.querySelector(".sheet-x").onclick = close;
}
