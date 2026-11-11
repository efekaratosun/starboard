"use strict";

/* ---- antrenman modu ----
   Tek hareket tam ekran. Her set son antrenmanın değeriyle hazır gelir;
   ✓ onaylar, ± düzeltir. Klavye sadece istersen açılır. */
let woIdx = 0, woEl = null, woDone = false;

const tgNum = tg => { const m = String(tg ?? "").match(/\d+/); return m ? +m[0] : null; };
const woStep = (f, v) => f === "kg" ? 2.5 : f === "km" ? 0.5 : f === "min" ? 5 : f === "m" ? 25 : 1;
const woRound = (f, v) => f === "kg" || f === "km" || f === "min" ? Math.round(v * 100) / 100 : Math.round(v);

function woList(){
  const p = currentProgram();
  const ses = p ? p.training.days.find(d => d.wd === isoWeekday(vKey())) : null;
  return { ses, list: exercisesOf(ses), venue: venueOf(p) };
}

/* Bugünün kaydı; yoksa açılır. */
function woRec(name, t){
  const e = ensureDay(vKey());
  e.lifts = e.lifts || {};
  let r = e.lifts[name];
  if (!r || !r.t) r = e.lifts[name] = {};
  r.t = t;
  return r;
}
function woTidy(name){
  const e = state.days[vKey()] || {};
  if (e.lifts && !liftHas(e.lifts[name])) delete e.lifts[name];
}

/* Bir alanın önerilen değeri: bugün girilen > bugünkü önceki set > geçen antrenman > programdaki hedef. */
function woSug(ex, rec, prev, k){
  const S = rec.sets || [], P = (prev && prev.sets) || [];
  if (ex.t === "w"){
    const s = S[k] || {}, p = P[k] || {};
    const back = (k > 0 && S[k-1] && S[k-1].kg) || null;
    return { kg: s.kg ?? back ?? p.kg ?? (prev && prev.kg) ?? null,
             r:  s.r  ?? p.r  ?? tgNum(ex.tg) };
  }
  const own = typeof S[k] === "number" ? S[k] : null;
  const back = k > 0 && typeof S[k-1] === "number" ? S[k-1] : null;
  const p = typeof P[k] === "number" ? P[k] : null;
  return { v: own ?? back ?? p ?? tgNum(ex.tg) };
}
const woSetDone = (ex, rec, k) => ex.t === "w"
  ? !!(rec.sets && rec.sets[k] && rec.sets[k].r)
  : !!(rec.sets && typeof rec.sets[k] === "number");

/* ---- parçalar ---- */
function woField(f, v, label, k){
  return `<div class="wo-f">
    <button class="wo-pm" data-wpm="${f}" data-wk="${k}" data-wd="-1" aria-label="${label} azalt" tabindex="-1">−</button>
    <label class="wo-v"><input type="text" inputmode="decimal" enterkeyhint="done" data-wi="${f}" data-wk="${k}"
      value="${v === null || v === undefined ? "" : fmtN(v)}" aria-label="${label}"><span>${label}</span></label>
    <button class="wo-pm" data-wpm="${f}" data-wk="${k}" data-wd="1" aria-label="${tx("{0} artır", [(label)])}" tabindex="-1">+</button>
  </div>`;
}
const woTick = `<svg aria-hidden="true"><use href="#i-check"/></svg>`;
function woSetRow(ex, rec, prev, k){
  const on = woSetDone(ex, rec, k), s = woSug(ex, rec, prev, k);
  const fields = ex.t === "w"
    ? woField("kg", s.kg, "kg", k) + woField("r", s.r, "tekrar", k)
    : woField("s", s.v, ex.t === "t" ? "saniye" : "tekrar", k);
  return `<div class="wo-set${on ? " on" : ""}">
    <span class="wo-no">${k+1}</span>
    <div class="wo-fields">${fields}</div>
    <button class="wo-ok" data-wok="${k}" aria-pressed="${on}" aria-label="${k+1}. seti ${on ? "geri al" : tx("tamamlandı olarak işaretle")}">${woTick}</button>
  </div>`;
}
function woChips(cur, max, unit){
  return `<div class="wo-chips" role="group" aria-label="Tamamlanan ${unit}">${Array.from({ length:max }, (_, i) =>
    `<button class="wo-chip${i < cur ? " on" : ""}" data-wc="${i+1}" aria-pressed="${i < cur}"
      aria-label="${i+1}. ${unit}">${i+1}</button>`).join("")}</div>
    <div class="wo-note">${tx("{0}/{1} {2} tamam. Kaçıncı {3} bittiyse ona dokun; aynısına tekrar dokunursan geri alır.", [(cur), (max), (unit), (unit)])}</div>`;
}

function woBody(ex, name, rec, prev){
  switch (ex.t){
    case "w": case "r": case "t": {
      const n = ex.n || 1;
      const all = Array.from({ length:n }, (_, k) => woSetDone(ex, rec, k)).every(Boolean);
      const canCopy = !all && (prev || (ex.t !== "w" && tgNum(ex.tg) !== null));
      return `${canCopy ? `<button class="ghost wo-copy" id="wo-copy">${prev ? tx("Hepsi geçen seferki gibi") : tx("Hepsini hedefe göre doldur")}</button>` : ""}
        <div class="wo-sets">${Array.from({ length:n }, (_, k) => woSetRow(ex, rec, prev, k)).join("")}</div>
        <div class="wo-note">${tx("Değerler {0} geliyor. Aynıysa ✓'e bas, farklıysa − / + ile düzelt ya da sayıya dokunup yaz.", [(prev ? tx("geçen antrenmandan") : "programdaki hedeften")])}</div>`;
    }
    case "wc": {
      const s = { kg: rec.kg ?? (prev && prev.kg) ?? null };
      return `<div class="wo-fields" style="margin-bottom:14px">${woField("kg", s.kg, "kg", "")}</div>
        ${woChips(rec.n || 0, ex.n, exText(ex.unit || "set"))}`;
    }
    case "n": return woChips(rec.n || 0, ex.n, exText(ex.unit || "tur"));
    case "sw": return `${woChips(rec.n || 0, ex.n, "tekrar")}
      <div class="wo-fields" style="margin-top:14px">${woField("min", rec.min ?? (prev && prev.min) ?? null, "dakika", "")}</div>`;
    case "sd": return `<div class="wo-fields">${woField("m", rec.m ?? ex.d ?? null, "metre", "")}${woField("min", rec.min ?? (prev && prev.min) ?? null, "dakika", "")}</div>`;
    case "c": {
      const min = rec.min ?? tgNum(ex.tg), km = rec.km ?? (prev && prev.km) ?? null;
      return `<div class="wo-fields">${woField("min", min, "dakika", "")}${ex.km ? woField("km", km, "km", "") : ""}</div>
        ${rec.min && rec.km ? `<div class="wo-note">${tx("Tempo:")} <b>${pace(rec.min, rec.km)}</b></div>`
          : ""}`;
    }
    default:
      return `<button class="wo-big${rec.ok ? " on" : ""}" id="wo-ok1" aria-pressed="${rec.ok ? "true" : "false"}">${woTick}${rec.ok ? tx("Yapıldı") : tx("Yaptım")}</button>`;
  }
}

/* ---- ekran ---- */
function woScreen(){
  const { list, venue } = woList();
  const lifts = (state.days[vKey()] || {}).lifts || {};
  const nDone = list.filter(n => liftHas(lifts[n])).length;

  if (woDone || woIdx >= list.length){
    return `<div class="wo-top"><button class="wo-x" id="wo-x" aria-label="${tx("Kapat")}">×</button>
      <span class="wo-count">${tx("ÖZET")}</span><span style="flex:0 0 38px"></span></div>
    <div class="wo-main">
      <div class="wo-done"><b>${nDone === list.length ? tx("Antrenman tamam 💪") : tx("Kaydedildi")}</b>
        <span>${nDone}/${list.length} hareket kaydettin.${nDone < list.length ? tx(" Eksikleri sonra da girebilirsin.") : ""}</span></div>
      <section style="margin-top:16px">${list.map(name => {
        const ex = parseEx(name, venue), rec = lifts[name];
        const has = liftHas(rec), sum = has ? liftSummary(rec, ex) : "";
        return `<div class="wo-sum${has ? "" : " skip"}">
          <svg class="ico" aria-hidden="true"><use href="#i-${has ? "check" : "cross"}"/></svg>
          <div class="m"><h3>${esc(exText(ex.name))}</h3><p>${has ? esc(sum || tx("yapıldı")) : tx("girilmedi")}</p></div>
        </div>`;
      }).join("")}</section>
    </div>
    <div class="wo-nav"><div>
      <button class="ghost wo-prev" id="wo-back">${tx("Geri")}</button>
      <button id="wo-finish">${tx("Bitir")}</button>
    </div></div>`;
  }

  const name = list[woIdx], ex = parseEx(name, venue);
  const rec = (lifts[name] && lifts[name].t === ex.t) ? lifts[name] : (lifts[name] || {});
  const prev = lastLift(name, vKey());
  const ps = prev ? liftSummary(prev, ex) : "";
  const ids = guidesFor(name);

  return `<div class="wo-top">
      <button class="wo-x" id="wo-x" aria-label="${tx("Antrenman modunu kapat")}">×</button>
      <span class="wo-count">${tx("HAREKET {0} / {1}", [(woIdx+1), (list.length)])}</span>
      <span style="flex:0 0 38px"></span>
    </div>
    <div class="wo-dots" aria-hidden="true">${list.map((n, i) =>
      `<i class="${i === woIdx ? "cur" : liftHas(lifts[n]) ? "on" : ""}"></i>`).join("")}</div>
    <div class="wo-main">
      <div class="wo-h">${esc(exText(ex.name))}</div>
      <div class="wo-s">${esc(exText(ex.sub || ""))}${ex.sub && LIFT_KIND[ex.t] ? " · " : ""}${LIFT_KIND[ex.t] || ""}</div>
      <div class="wo-last">${ps ? tx("Geçen sefer: <b>{0}</b> · {1}", [(esc(ps)), (prettyDate(prev.k))]) : tx("Bu hareketi ilk kez kaydediyorsun.")}
        ${ids.length ? `<button class="how-link" data-wohow="${ids[0]}">${tx("Nasıl yapılır")}</button>` : ""}</div>
      ${woBody(ex, name, rec, prev)}
    </div>
    <div class="wo-nav"><div>
      <button class="ghost wo-prev" id="wo-back"${woIdx ? "" : " disabled"}>${tx("Geri")}</button>
      <button id="wo-next">${woIdx === list.length - 1 ? tx("Bitir") : tx("Sonraki hareket")}</button>
    </div></div>`;
}

function drawWO(){
  if (!woEl) return;
  woEl.innerHTML = woScreen();
  wireWO();
  woEl.querySelector(".wo-main").scrollTop = 0;
}

function openWorkout(){
  const { list } = woList();
  if (!list.length) return;
  const lifts = (state.days[vKey()] || {}).lifts || {};
  const first = list.findIndex(n => !liftHas(lifts[n]));
  woIdx = first < 0 ? 0 : first;
  woDone = false;
  woEl = document.createElement("div");
  woEl.className = "wo";
  woEl.setAttribute("role", "dialog");
  woEl.setAttribute("aria-modal", "true");
  woEl.setAttribute("aria-label", tx("Antrenman modu"));
  document.body.appendChild(woEl);
  document.body.style.overflow = "hidden";
  drawWO();
}
function closeWorkout(){
  if (!woEl) return;
  woEl.remove(); woEl = null;
  document.body.style.overflow = "";
  render();
}

function wireWO(){
  const { list, venue } = woList();
  const q = s => woEl.querySelectorAll(s);
  const el = i => woEl.querySelector(i);
  const save = async () => { await saveState(state); };

  el("#wo-x").onclick = closeWorkout;
  const back = el("#wo-back");
  if (back && !back.disabled) back.onclick = () => {
    if (woDone){ woDone = false; woIdx = list.length - 1; } else woIdx--;
    drawWO();
  };
  const fin = el("#wo-finish");
  if (fin) fin.onclick = closeWorkout;
  const next = el("#wo-next");
  if (next) next.onclick = () => {
    if (woIdx === list.length - 1) woDone = true; else woIdx++;
    drawWO();
  };
  q("[data-wohow]").forEach(b => b.onclick = () => {
    const id = b.dataset.wohow;
    closeWorkout();
    tab = "plan"; planTab = "howto"; howQuery = ""; howOpen = id;
    render();
    const t = app.querySelector(`[data-how="${id}"]`);
    if (t) t.scrollIntoView({ block:"center" }); else window.scrollTo(0,0);
  });

  if (woDone || woIdx >= list.length) return;

  const name = list[woIdx], ex = parseEx(name, venue), prev = lastLift(name, vKey());
  const val = (f, k) => {
    const i = woEl.querySelector(`[data-wi="${f}"][data-wk="${k}"]`);
    if (!i) return null;
    const n = num(i.value);
    return n !== null && n >= 0 ? n : null;
  };

  /* ± düğmeleri: kutuyu değiştirir, kaydetmez (✓ kaydeder) */
  q("[data-wpm]").forEach(b => b.onclick = () => {
    const f = b.dataset.wpm, k = b.dataset.wk;
    const i = woEl.querySelector(`[data-wi="${f}"][data-wk="${k}"]`);
    if (!i) return;
    const cur = num(i.value) ?? 0;
    i.value = fmtN(Math.max(0, woRound(f, cur + woStep(f) * (+b.dataset.wd))));
    i.dispatchEvent(new Event("input", { bubbles:true }));
    if (["kg","min","km","m"].includes(f) && !["w","r","t"].includes(ex.t)) i.onchange();
  });

  /* set onayı */
  q("[data-wok]").forEach(b => b.onclick = async () => {
    const k = +b.dataset.wok;
    const rec = woRec(name, ex.t);
    rec.sets = rec.sets || [];
    const before = records().find(r => r.name === name);
    if (woSetDone(ex, rec, k)){
      rec.sets[k] = ex.t === "w" ? null : null;
      woTidy(name); await save(); drawWO(); return;
    }
    if (ex.t === "w"){
      const r = val("r", k);
      if (r === null || r === 0){ toast(tx("Kaç tekrar yaptığını gir.")); return; }
      const kg = val("kg", k);
      rec.sets[k] = kg === null ? { r } : { kg, r };
    } else {
      const v = val("s", k);
      if (v === null || v === 0){ toast(ex.t === "t" ? tx("Kaç saniye tuttuğunu gir.") : tx("Kaç tekrar yaptığını gir.")); return; }
      rec.sets[k] = v;
    }
    for (let j = 0; j < rec.sets.length; j++) if (rec.sets[j] === undefined) rec.sets[j] = null;
    await save(); drawWO();
    checkPR(name, before);
  });

  /* hepsi geçen seferki gibi */
  const copy = el("#wo-copy");
  if (copy) copy.onclick = async () => {
    const rec = woRec(name, ex.t);
    rec.sets = rec.sets || [];
    const before = records().find(r => r.name === name);
    let n = 0;
    for (let k = 0; k < (ex.n || 1); k++){
      if (woSetDone(ex, rec, k)) continue;
      const s = woSug(ex, rec, prev, k);
      if (ex.t === "w"){
        /* kilo bilinmiyorsa toplu doldurma o seti atlar; elle ✓ hâlâ mümkün */
        if (s.r === null || s.r === undefined || s.kg === null || s.kg === undefined) continue;
        rec.sets[k] = { kg:s.kg, r:s.r };
      } else {
        if (s.v === null || s.v === undefined) continue;
        rec.sets[k] = s.v;
      }
      n++;
    }
    if (!n){ toast(tx("Doldurulacak bir değer yok; sayıları elle gir.")); return; }
    for (let j = 0; j < rec.sets.length; j++) if (rec.sets[j] === undefined) rec.sets[j] = null;
    await save(); drawWO();
    checkPR(name, before);
    toast(`${n} set kaydedildi.`);
  };

  /* tur / set rozetleri */
  q("[data-wc]").forEach(b => b.onclick = async () => {
    const v = +b.dataset.wc, rec = woRec(name, ex.t);
    const before = records().find(r => r.name === name);
    rec.n = rec.n === v ? v - 1 : v;
    if (!rec.n) delete rec.n;
    woTidy(name); await save(); drawWO();
    checkPR(name, before);
  });

  /* tek alanlı tipler: değer değişince kaydet */
  q("[data-wi]").forEach(i => {
    const f = i.dataset.wi;
    if (["w","r","t"].includes(ex.t)) return;
    i.onchange = async () => {
      const rec = woRec(name, ex.t);
      const before = records().find(r => r.name === name);
      const n = num(i.value);
      const v = n !== null && n >= 0 ? (f === "m" ? Math.round(n) : n) : null;
      if (v === null) delete rec[f]; else rec[f] = v;
      woTidy(name); await save();
      const ae = document.activeElement === i;
      drawWO();
      if (ae) woEl.querySelector(`[data-wi="${f}"][data-wk="${i.dataset.wk}"]`)?.focus();
      checkPR(name, before);
    };
  });

  /* "yaptım" düğmesi */
  const ok1 = el("#wo-ok1");
  if (ok1) ok1.onclick = async () => {
    const rec = woRec(name, ex.t);
    if (rec.ok) delete rec.ok; else rec.ok = 1;
    woTidy(name); await save(); drawWO();
  };
}


function howCard(id){
  const g = GUIDE_BY_ID[id];
  const open = howOpen === id;
  return `<div class="how${open ? " on" : ""}">
    <button class="how-h" data-how="${id}" aria-expanded="${open}">
      <span>${esc(g.n)}</span><svg class="ico fold-c" aria-hidden="true"><use href="#i-next"/></svg>
    </button>
    ${open ? `<div class="how-b"><ol>${g.s.map(x => `<li>${x}</li>`).join("")}</ol>
      <div class="how-x"><b>${tx("Dikkat:")}</b> ${g.x}</div></div>` : ""}
  </div>`;
}

function howList(program){
  const q = norm(howQuery.trim());
  let body;
  if (q.length >= 2){
    const hits = GUIDE.filter(g => matchScore(g.n, q) > 0);
    body = `<section>${hits.length ? hits.map(g => howCard(g.id)).join("")
      : `<div class="empty">${tx("\"{0}\" için anlatım bulunamadı.", [(esc(howQuery))])}</div>`}</section>`;
  } else {
    const seen = new Set();
    body = program.training.days.filter(d => d.b).map(d => {
      const ids = [];
      for (const ex of exercisesOf(d)) for (const id of guidesFor(ex))
        if (!seen.has(id)){ seen.add(id); ids.push(id); }
      if (!ids.length) return "";
      return `<section><h2>${WD_NAMES[d.wd]} · ${esc(d.t)}</h2>${ids.map(howCard).join("")}</section>`;
    }).join("");
  }
  return body;
}

function howtoView(program){
  return `<section>
    <input id="how-q" type="text" placeholder="${tx("Hareket ara: squat, barfiks, plank…")}" value="${esc(howQuery)}" autocomplete="off">
    <div class="metric-note" style="margin-top:10px">${tx("Ağrı hissedersen dur.")}</div>
  </section>
  <div id="how-res">${howList(program)}</div>`;
}

function wireHowto(){
  app.querySelectorAll("[data-how]").forEach(b => b.onclick = () => {
    howOpen = howOpen === b.dataset.how ? null : b.dataset.how;
    const res = document.getElementById("how-res");
    const y = window.scrollY;
    res.innerHTML = howList(currentProgram());
    window.scrollTo(0, y);
    wireHowto();
  });
  const q = document.getElementById("how-q");
  if (q && !q.dataset.w){
    q.dataset.w = 1;
    q.oninput = () => {
      howQuery = q.value; howOpen = null;
      document.getElementById("how-res").innerHTML = howList(currentProgram());
      wireHowto();
    };
  }
}
