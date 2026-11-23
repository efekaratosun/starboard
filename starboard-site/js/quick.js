"use strict";

/* ---- kilo gir ----
   Program henüz yokken Bugün sayfasındaki "Kilonu gir" bu pencereyi açar: kilo girilince program ve hedefler oluşur.
   Hızlı giriş sayfası kalktı: su, uyku, adım ve görev Bugün sayfasındaki satırlarından girilir. */
function openWeightSheet(){
  const k = vKey();
  const el = document.createElement("div");
  el.className = "sheet-bg";
  const close = () => sheetOut(el);
  const lw = lastWeight(), e = ensureDay(k);
  el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ws-h">
    <div class="sheet-h"><span class="qs-logo">${BRAND_SVG}</span><b id="ws-h">${tx("Kilonu gir")}</b>
      <button class="sheet-x" aria-label="${tx("Kapat")}">×</button></div>
    <div class="row">
      <input id="qs-w" aria-label="${tx("Kilo ({0})", [(wUnit())])}" type="text" inputmode="decimal" placeholder="${lw !== null ? wNum(lw) : wUnit()}"
        value="${typeof e.weight === "number" ? wNum(e.weight) : ""}" style="flex:2">
      <button id="qs-w-ok" style="flex:0 0 92px">${tx("Kaydet")}</button>
    </div></div>`;
  document.body.appendChild(el);
  const wi = el.querySelector("#qs-w");
  const save = async () => {
    const n = num(wi.value);
    if (n === null){ toast(tx("Kilonu yaz.")); return; }
    if (wIn(n) < 25 || wIn(n) > 400){ toast(tx("{0} ile {1} arasında bir değer gir.", [(fmtW0(25)), (fmtW0(400))])); return; }
    e.weight = wSave(n);
    await saveState(state); close(); render(); toast(tx("{0} kaydedildi.", [(fmtW(e.weight))]));
  };
  el.querySelector("#qs-w-ok").onclick = save;
  wi.onkeydown = ev => { if (ev.key === "Enter") save(); };
  el.onclick = ev => { if (ev.target === el) close(); };
  el.querySelector(".sheet-x").onclick = close;
  wi.focus({ preventScroll: true });
}

/* ---- hedef ekle ----
   İki katman: uygulamanın önerdiği hazır hedefler (aç/kapat) ve
   kullanıcının kendi yazdığı hedef. */
function openGoalSheet(key){
  const el = document.createElement("div");
  el.className = "sheet-bg";
  const close = () => sheetOut(el);
  let rep = false;
  const commit = async () => { await saveState(state); render(); draw(); };

  const draw = () => {
    const sg = stepGoal();
    const have = new Set((state.routines || []).map(r => r.title));
    const ideas = ROUTINE_IDEAS.filter(x => x !== "10 bin adım" && !have.has(x));
    el.querySelector("#gs-b").innerHTML = `
      <h3 class="gs-h">${tx("Hazır hedefler")}</h3>
      <div class="gs-row">${iconBox("walk")}
        <div class="gs-m"><b>${tx("Adım sayısı")}</b><i>${sg ? tx("Günde {0} adım", [(sg)]) : tx("Kapalı")}</i></div>
        <button class="chip${sg ? " sel" : ""}" id="gs-st-t" aria-pressed="${!!sg}">${sg ? tx("Açık") : tx("Aç")}</button></div>
      ${sg ? `<div class="row" style="margin-top:10px">
        <input id="gs-st-n" type="number" inputmode="numeric" value="${sg}" aria-label="${tx("Günlük adım hedefi")}" style="flex:2">
        <button id="gs-st-ok" style="flex:0 0 110px">${tx("Güncelle")}</button></div>` : ""}      ${ideas.length ? `<label style="margin-top:18px">${tx("Her gün tekrar edenler")}</label>
        <div class="chips">${ideas.map(x => `<button class="chip" data-gs-idea="${esc(x)}">+ ${esc(x)}</button>`).join("")}</div>` : ""}
      <h3 class="gs-h" style="margin-top:24px">${tx("Kendi hedefin")}</h3>
      <div class="row">
        <input id="gs-t" type="text" placeholder="${tx("örn. 20 sayfa kitap")}" aria-label="${tx("Kendi hedefin")}" style="flex:2">
        <button id="gs-t-ok" style="flex:0 0 86px">${tx("Ekle")}</button>
      </div>
      <div class="chips" style="margin-top:8px">
        <button class="chip${rep ? " sel" : ""}" id="gs-rep" aria-pressed="${rep}">${tx("Her gün tekrarla")}</button>
      </div>`;

    const e = ensureDay(key);
    el.querySelector("#gs-st-t").onclick = async () => {
      state.profile.goals = state.profile.goals || {};
      if (stepGoal()) delete state.profile.goals.steps; else state.profile.goals.steps = 8000;
      await commit();
    };
    const ok = el.querySelector("#gs-st-ok");
    if (ok) ok.onclick = async () => {
      const n = num(el.querySelector("#gs-st-n").value);
      if (!n || n < 500 || n > 60000){ toast(tx("500 ile 60.000 arasında bir adım hedefi gir.")); return; }
      state.profile.goals.steps = Math.round(n);
      await commit(); toast(tx("Adım hedefin {0} oldu.", [(Math.round(n))]));
    };
    const addOwn = async (title, daily) => {
      if (!title) return;
      e.tasks.push({ id: Date.now()+Math.random(), title, done:false, suggested:false, rt:!!daily });
      if (daily){
        state.routines = state.routines || [];
        if (!state.routines.some(r => r.title === title))
          state.routines.push({ id: Date.now()+Math.random(), title, days:[1,2,3,4,5,6,7] });
      }
      await commit();
    };
    el.querySelectorAll("[data-gs-idea]").forEach(b => b.onclick = () => addOwn(b.dataset.gsIdea, true));
    const ti = el.querySelector("#gs-t");
    const add = async () => { const v = ti.value.trim(); if (!v) return; const d = rep; rep = false; await addOwn(v, d); toast(tx("Hedef eklendi.")); };
    el.querySelector("#gs-t-ok").onclick = add;
    ti.onkeydown = ev => { if (ev.key === "Enter") add(); };
    el.querySelector("#gs-rep").onclick = ev => {
      rep = !rep;
      ev.currentTarget.classList.toggle("sel", rep);
      ev.currentTarget.setAttribute("aria-pressed", String(rep));
    };
  };

  el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="gs-h">
    <div class="sheet-h"><b id="gs-h">${tx("Hedef ekle")}</b>
      <button class="sheet-x" aria-label="${tx("Kapat")}">×</button></div>
    <div id="gs-b"></div>
  </div>`;
  document.body.appendChild(el);
  draw();
  el.onclick = ev => { if (ev.target === el) close(); };
  el.querySelector(".sheet-x").onclick = close;
}

/* ---- kendi programını yaz ----
   Gün gün hareket, set ve tekrar. Kaydedilince hazır programlarla aynı yoldan
   görevlere, antrenman kaydına ve antrenman moduna girer. */
function openProgramEditor(){
  const p = state.profile;
  const draft = JSON.parse(JSON.stringify((p.custom && p.custom.days) || {}));
  let sel = isoWeekday(today());
  const el = document.createElement("div");
  el.className = "sheet-bg";
  const close = () => sheetOut(el);
  const day = () => (draft[sel] = draft[sel] || { t:"", ex:[] });
  const filled = n => !!(draft[n] && draft[n].ex && draft[n].ex.some(x => (x.n || "").trim()));

  const draw = focusLast => {
    const d = day();
    el.querySelector("#pe-b").innerHTML = `
      <div class="pe-days" role="group" aria-label="${tx("Gün seç")}">${[1,2,3,4,5,6,7].map(n =>
        `<button class="chip${n === sel ? " sel" : ""}${filled(n) ? " has" : ""}" data-pe-day="${n}"
           aria-pressed="${n === sel}" aria-label="${WD_NAMES[n]}${filled(n) ? ", hareket var" : ""}">${WD_SHORT[n]}</button>`).join("")}</div>
      <div class="field"><label for="pe-t">${tx("{0} antrenmanının adı", [(WD_NAMES[sel])])}</label>
        <input id="pe-t" type="text" value="${esc(d.t || "")}" placeholder="${tx("örn. Göğüs ve kol")}" maxlength="40"></div>
      ${d.ex.length ? `<div class="pe-head" aria-hidden="true"><span>${tx("Hareket")}</span><span>${tx("Set")}</span><span>${tx("Tekrar")}</span><span></span></div>`
        : `<div class="empty" style="margin:6px 0 4px">${tx("Hareket eklemezsen {0} dinlenme günü sayılır.", [(WD_NAMES[sel])])}</div>`}
      ${d.ex.map((x, i) => `<div class="pe-x">
        <input data-pe-n="${i}" type="text" value="${esc(x.n || "")}" placeholder="${tx("Hareket")}" aria-label="${tx("Hareket adı")}" maxlength="40">
        <input data-pe-s="${i}" type="text" inputmode="numeric" value="${esc(x.s ?? "")}" aria-label="${tx("Set sayısı")}">
        <input data-pe-r="${i}" type="text" inputmode="numeric" value="${esc(x.r ?? "")}" aria-label="${tx("Tekrar sayısı")}">
        <button class="del" data-pe-del="${i}" aria-label="${tx("Hareketi sil")}">×</button></div>`).join("")}
      <button class="ghost" id="pe-add" style="margin-top:10px">${tx("＋ Hareket ekle")}</button>`;

    el.querySelectorAll("[data-pe-day]").forEach(b => b.onclick = () => { sel = +b.dataset.peDay; draw(); });
    el.querySelector("#pe-t").oninput = ev => { d.t = ev.target.value; };
    const dots = () => el.querySelectorAll("[data-pe-day]").forEach(b => b.classList.toggle("has", filled(+b.dataset.peDay)));
    el.querySelectorAll("[data-pe-n]").forEach(i => i.oninput = () => { d.ex[+i.dataset.peN].n = i.value; dots(); });
    el.querySelectorAll("[data-pe-s]").forEach(i => i.oninput = () => { d.ex[+i.dataset.peS].s = i.value; });
    el.querySelectorAll("[data-pe-r]").forEach(i => i.oninput = () => { d.ex[+i.dataset.peR].r = i.value; });
    el.querySelectorAll("[data-pe-del]").forEach(b => b.onclick = () => { d.ex.splice(+b.dataset.peDel, 1); draw(); });
    el.querySelector("#pe-add").onclick = () => {
      if (d.ex.length >= 14){ toast(tx("Bir güne en fazla 14 hareket ekleyebilirsin.")); return; }
      d.ex.push({ n:"", s:3, r:"10" }); draw(true);
    };
    if (focusLast){ const all = el.querySelectorAll("[data-pe-n]"); if (all.length) all[all.length - 1].focus(); }
  };

  const clean = () => {
    const out = {};
    for (let n = 1; n <= 7; n++){
      const d = draft[n];
      if (!d) continue;
      const seen = new Set(), ex = [];
      for (const x of (d.ex || [])){
        const name = String(x.n || "").replace(/[·×]/g, " ").replace(/\s+/g, " ").trim();
        if (!name) continue;
        const s = clamp(Math.round(num(x.s) || 3), 1, 12);
        let r = String(x.r ?? "").toLowerCase().replace(/\s/g, "").replace(/[–—]/g, "-");
        if (!/^(max|\d{1,3}(-\d{1,3})?)$/.test(r)) r = "10";
        const id = `${name} ${s}×${r}`;
        if (seen.has(id)) continue;
        seen.add(id); ex.push({ n:name, s, r });
      }
      if (ex.length) out[n] = { t: String(d.t || "").replace(/\s+/g, " ").trim().slice(0, 40), ex };
    }
    return out;
  };

  el.innerHTML = `<div class="sheet pe" role="dialog" aria-modal="true" aria-labelledby="pe-h">
    <div class="sheet-h"><b id="pe-h">${tx("Kendi programın")}</b>
      <button class="sheet-x" aria-label="${tx("Kapat")}">×</button></div>
    <div class="metric-note" style="margin:-2px 0 14px">${tx("Boş günler dinlenme olur.")}</div>
    <div id="pe-b"></div>
    <div class="row pe-foot">
      <button id="pe-ok">${tx("Kaydet ve kullan")}</button>
      <button class="ghost" id="pe-no" style="flex:0 0 104px">${tx("Vazgeç")}</button>
    </div>
  </div>`;
  document.body.appendChild(el);
  draw();
  el.querySelector(".sheet-x").onclick = close;
  el.querySelector("#pe-no").onclick = close;
  el.querySelector("#pe-ok").onclick = async () => {
    const days = clean();
    if (!Object.keys(days).length){ toast(tx("En az bir güne hareket ekle.")); return; }
    p.custom = { days };
    p.programId = "custom";
    delete p.noPlan;
    close();
    await saveState(state); render();
    toast(tx("Programın kaydedildi: haftada {0} gün.", [(Object.keys(days).length)]));
  };
}
