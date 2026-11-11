"use strict";

/* ---- hızlı giriş ----
   Sabit + düğmesi: hangi sekmede olursan ol günün verisi tek yerden girilir.
   Yazılan gün her zaman görüntülenen gündür, geçmiş bir gün de olabilir. */

/* Bir önceki günün değeri; "dünün aynısı" düğmeleri bunu kullanır. */
function prevVal(k, field){
  const p = state.days[shiftDays(k, -1)];
  return p && typeof p[field] === "number" && p[field] > 0 ? p[field] : null;
}

function openQuickSheet(){
  const k = vKey();
  const el = document.createElement("div");
  el.className = "sheet-bg";
  /* Fonksiyon bildirimi: close, esc'ten önce çağrılabilir. */
  function esc(ev){ if (ev.key === "Escape") close(); }
  const close = () => { sheetOut(el); document.removeEventListener("keydown", esc); };
  const past = k !== today();

  const draw = () => {
    const e = ensureDay(k), program = currentProgram();
    const lw = lastWeight(), rw = prevVal(k, "water"), rk = prevVal(k, "kcal");
    const { bed, wake } = sleepTimes(e);
    const logged = !!(e.log && e.log.length);
    const session = program ? program.training.days.find(d => d.wd === isoWeekday(k)) : null;

    el.querySelector("#qs-b").innerHTML = `
      <div class="qs-row">
        <div class="qs-h">${iconBox("dairy")}<div><b>${tx("Su")}</b>
          <i>${e.water || 0}${program ? ` / ${program.water}` : ""} ml</i></div></div>
        <div class="chips">
          <button class="chip" data-qw="250">+250</button>
          <button class="chip" data-qw="500">+500</button>
          <button class="chip" data-qw="1000">+1000</button>
          ${rw ? `<button class="chip rep" data-qwset="${rw}">${tx("↺ önceki gün {0} ml", [(rw)])}</button>` : ""}
          ${e.water ? `<button class="chip" data-qwset="0">${tx("Sıfırla")}</button>` : ""}
        </div>
      </div>

      <div class="qs-row">
        <div class="qs-h">${iconBox("legs")}<div><b>${tx("Kilo")}</b>
          <i>${typeof e.weight === "number" ? tx("{0} {1} kg girildi", [(past ? tx("o gün") : tx("bugün")), (kg1(e.weight))])
              : lw !== null ? tx("son ölçüm {0} kg", [(kg1(lw))]) : tx("henüz ölçüm yok")}</i></div></div>
        <div class="row">
          <input id="qs-w" type="text" inputmode="decimal" placeholder="${lw !== null ? kg1(lw) : "kg"}"
            value="${typeof e.weight === "number" ? fmtN(e.weight) : ""}" style="flex:2">
          <button id="qs-w-ok" style="flex:0 0 92px">${tx("Kaydet")}</button>
        </div>
      </div>

      ${stepGoal() ? `<div class="qs-row">
        <div class="qs-h">${iconBox("walk")}<div><b>${tx("Adım")}</b>
          <i>${tx("{0} / {1} adım", [(e.steps || 0), (stepGoal())])}</i></div></div>
        <div class="row">
          <input id="qs-st" type="text" inputmode="numeric" placeholder="${tx("adım sayısı")}"
            value="${typeof e.steps === "number" ? e.steps : ""}" style="flex:2">
          <button id="qs-st-ok" style="flex:0 0 92px">${tx("Kaydet")}</button>
        </div>
      </div>` : ""}

      <div class="qs-row">
        <div class="qs-h">${iconBox("rest")}<div><b>${tx("Uyku")}</b>
          <i>${typeof e.sleep === "number" ? durTxt(Math.round(e.sleep * 60)) : tx("henüz girilmedi")}</i></div></div>
        <div class="qs-times">
          <input id="qs-bed" type="time" value="${hm(bed)}" aria-label="${tx("Yattığın saat")}">
          <span aria-hidden="true">→</span>
          <input id="qs-wake" type="time" value="${hm(wake)}" aria-label="${tx("Kalktığın saat")}">
        </div>
        <button id="qs-s-ok" style="margin-top:9px">${tx("Uykuyu kaydet")}</button>
      </div>

      <div class="qs-row">
        <div class="qs-h">${iconBox("grain")}<div><b>${tx("Kalori")}</b>
          <i>${logged ? tx("günlükteki {0} kalemden {1} kcal", [(e.log.length), (e.kcal || 0)])
              : `${e.kcal || 0}${program ? ` / ${program.kcal}` : ""} kcal`}</i></div></div>
        ${logged ? "" : `<div class="chips">
          <button class="chip" data-qk="200">+200</button>
          <button class="chip" data-qk="400">+400</button>
          <button class="chip" data-qk="600">+600</button>
          ${rk ? `<button class="chip rep" data-qkset="${rk}">${tx("↺ önceki gün {0} kcal", [(rk)])}</button>` : ""}
        </div>`}
        <button class="qs-go" id="qs-meals" style="margin-top:10px">
          ${logged ? tx("Beslenme günlüğünü aç") : tx("Yediklerini tek tek gir")}
          <svg class="ico" aria-hidden="true"><use href="#i-next"/></svg></button>
      </div>

      ${session && session.b ? `<div class="qs-row">
        <div class="qs-h">${iconBox(session.icon)}<div><b>${tx("Antrenman")}</b><i>${esc(session.t)}</i></div></div>
        <button class="qs-go" id="qs-train">${tx("Antrenmanı kaydet")}
          <svg class="ico" aria-hidden="true"><use href="#i-next"/></svg></button>
      </div>` : ""}

      <div class="qs-row">
        <div class="qs-h">${iconBox("day")}<div><b>${tx("Görev")}</b>
          <i>${e.tasks.filter(t => !t.suggested).length} kendi görevin var</i></div></div>
        <div class="row">
          <input id="qs-t" type="text" placeholder="${tx("Yeni görev")}" style="flex:2">
          <button id="qs-t-ok" style="flex:0 0 92px">${tx("Ekle")}</button>
        </div>
      </div>`;
    wire();
  };

  /* Sayfa arkada da tazelensin: sayfayı yeniden çizip sayfayı üstte tutar. */
  const commit = async () => { await saveState(state); render(); draw(); };

  const wire = () => {
    const e = ensureDay(k);
    el.querySelectorAll("[data-qw]").forEach(b => b.onclick = async () => {
      e.water = (e.water || 0) + +b.dataset.qw; await commit();
    });
    el.querySelectorAll("[data-qwset]").forEach(b => b.onclick = async () => {
      const v = +b.dataset.qwset;
      if (v) e.water = v; else delete e.water;
      await commit();
    });
    el.querySelectorAll("[data-qk]").forEach(b => b.onclick = async () => {
      e.kcal = (e.kcal || 0) + +b.dataset.qk; e.kcalManual = true; await commit();
    });
    el.querySelectorAll("[data-qkset]").forEach(b => b.onclick = async () => {
      e.kcal = +b.dataset.qkset; e.kcalManual = true; await commit();
    });

    const wi = el.querySelector("#qs-w");
    const saveW = async () => {
      const n = num(wi.value);
      if (n === null){ delete e.weight; await commit(); return; }
      if (n < 25 || n > 400){ toast(tx("25 ile 400 kg arasında bir değer gir.")); return; }
      e.weight = Math.round(n * 10) / 10;
      await commit(); toast(`${kg1(e.weight)} kg kaydedildi.`);
    };
    el.querySelector("#qs-w-ok").onclick = saveW;
    wi.onkeydown = ev => { if (ev.key === "Enter") saveW(); };

    el.querySelector("#qs-s-ok").onclick = async () => {
      const toMin = v => { const m = /^(\d{1,2}):(\d{2})$/.exec(v || ""); return m ? (+m[1] % 24) * 60 + (+m[2] % 60) : null; };
      const b = toMin(el.querySelector("#qs-bed").value), w = toMin(el.querySelector("#qs-wake").value);
      if (b === null || w === null){ toast(tx("Yatış ve kalkış saatini gir.")); return; }
      e.bed = b; e.wake = w; e.sleep = Math.round(sleepDur(b, w) / 60 * 100) / 100;
      await commit(); toast(`${durTxt(Math.round(e.sleep * 60))} uyku kaydedildi.`);
    };

    const so = el.querySelector("#qs-st-ok");
    if (so) so.onclick = async () => {
      const n = num(el.querySelector("#qs-st").value);
      if (n === null || n < 0) delete e.steps; else e.steps = Math.round(n);
      await commit();
      if (typeof e.steps === "number") toast(tx("{0} adım kaydedildi.", [(e.steps)]));
    };

    const ti = el.querySelector("#qs-t");
    const addT = async () => {
      const title = ti.value.trim();
      if (!title) return;
      e.tasks.push({ id: Date.now() + Math.random(), title, done:false, suggested:false });
      ti.value = ""; await commit();
      el.querySelector("#qs-t").focus();
    };
    el.querySelector("#qs-t-ok").onclick = addT;
    ti.onkeydown = ev => { if (ev.key === "Enter") addT(); };

    const gm = el.querySelector("#qs-meals");
    if (gm) gm.onclick = () => { close(); tab = "meals"; mealTab = "log"; render(); window.scrollTo(0,0); };
    const gt = el.querySelector("#qs-train");
    if (gt) gt.onclick = () => { close(); goToTask("train", k); };
  };

  el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="qs-t-h">
    <div class="sheet-h"><span class="qs-logo">${BRAND_SVG}</span>
      <b id="qs-t-h">${tx("Hızlı giriş")}</b>
      <button class="sheet-x" aria-label="${tx("Kapat")}">×</button></div>
    ${past ? `<div class="metric-note" style="margin:-2px 0 4px">${tx("{0} gününe yazılıyor.", [(prettyDate(k))])}</div>` : ""}
    <div id="qs-b"></div>
  </div>`;
  document.body.appendChild(el);
  draw();
  el.onclick = ev => { if (ev.target === el) close(); };
  el.querySelector(".sheet-x").onclick = close;
  document.addEventListener("keydown", esc);
}

/* ---- hedef ekle ----
   İki katman: uygulamanın önerdiği hazır hedefler (aç/kapat) ve
   kullanıcının kendi yazdığı hedef. */
function openGoalSheet(key){
  const el = document.createElement("div");
  el.className = "sheet-bg";
  function escK(ev){ if (ev.key === "Escape") close(); }
  const close = () => { sheetOut(el); document.removeEventListener("keydown", escK); };
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
  document.addEventListener("keydown", escK);
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
  function escK(ev){ if (ev.key === "Escape") close(); }
  const close = () => { sheetOut(el); document.removeEventListener("keydown", escK); };
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
  document.addEventListener("keydown", escK);
}
