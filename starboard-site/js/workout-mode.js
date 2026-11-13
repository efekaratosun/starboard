"use strict";

/* ---- antrenman modu ----
   Tek hareket tam ekran. Her set son antrenmanın değeriyle hazır gelir;
   ✓ onaylar, ± düzeltir. Klavye sadece istersen açılır. */
let woIdx = 0, woEl = null, woDone = false;

/* ---- dinlenme sayacı ----
   Bir set onaylanınca setler arası geri sayım başlar. Süre ekranda ± ile
   değiştirilebilir; son seçilen süre profile.restSec'e yazılır ve sonraki
   setlerde varsayılan olur. Sayaç ekran yeniden çizilse de sürer: bitiş anı
   woRest.end'de durur, her çeyrek saniyede yalnızca yazısı güncellenir. */
let woRest = null, woRestTimer = null;
const restSec = () => clamp((state && state.profile && state.profile.restSec) || 90, 15, 600);
const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
function restBar(){
  if (!woRest) return "";
  const left = Math.max(0, Math.ceil((woRest.end - Date.now()) / 1000));
  return `<div class="wo-rest" id="wo-rest">
    <div class="wo-rest-p"><i id="wo-rest-bar" style="width:${(left / woRest.total * 100).toFixed(1)}%"></i></div>
    <span class="wo-rest-l">${tx("Dinlenme")}</span><b class="num" id="wo-rest-t" role="timer">${mmss(left)}</b>
    <button class="wo-rest-b" data-rest="-15" aria-label="${tx("15 saniye azalt")}">−15</button>
    <button class="wo-rest-b" data-rest="15" aria-label="${tx("15 saniye artır")}">+15</button>
    <button class="wo-rest-b skip" id="wo-rest-skip">${tx("Atla")}</button>
  </div>`;
}
function restDone(){
  if (IS_NATIVE) haptic("warning");
  else try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch(e){}
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25].forEach(t => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = 880; g.gain.value = 0.15;
      o.connect(g); g.connect(ac.destination);
      o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.15);
    });
    setTimeout(() => ac.close(), 800);
  } catch(e){}
  toast(tx("Dinlenme bitti."));
}
function stopRest(){
  woRest = null;
  clearInterval(woRestTimer); woRestTimer = null;
  const b = woEl && woEl.querySelector("#wo-rest");
  if (b) b.remove();
}
function tickRest(){
  if (!woRest || !woEl){ stopRest(); return; }
  const left = Math.max(0, Math.ceil((woRest.end - Date.now()) / 1000));
  const t = woEl.querySelector("#wo-rest-t"), bar = woEl.querySelector("#wo-rest-bar");
  if (t) t.textContent = mmss(left);
  if (bar) bar.style.width = (left / woRest.total * 100).toFixed(1) + "%";
  if (left <= 0){ stopRest(); restDone(); }
}
function startRest(){
  const s = restSec();
  woRest = { end: Date.now() + s * 1000, total: s };
  clearInterval(woRestTimer);
  woRestTimer = setInterval(tickRest, 250);
}
function wireRest(){
  if (!woEl) return;
  woEl.querySelectorAll("[data-rest]").forEach(b => b.onclick = async () => {
    if (!woRest) return;
    const d = Number(b.dataset.rest);
    woRest.end = Math.max(Date.now() + 5000, woRest.end + d * 1000);
    woRest.total = clamp(woRest.total + d, 15, 600);
    state.profile.restSec = woRest.total;
    tickRest();
    await saveState(state);
  });
  const sk = woEl.querySelector("#wo-rest-skip");
  if (sk) sk.onclick = stopRest;
}

const tgNum = tg => { const m = String(tg ?? "").match(/\d+/); return m ? +m[0] : null; };
const woStep = (f, v) => f === "kg" || f === "kg2" ? liftStep() : f === "km" ? 0.5 : f === "min" ? 5 : f === "m" ? 25 : 1;
const woRound = (f, v) => f === "kg" || f === "kg2" || f === "km" || f === "min" ? Math.round(v * 100) / 100 : Math.round(v);

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
  const r = e.lifts && e.lifts[name];
  if (r && !liftHas(r) && !r.kg2) delete e.lifts[name];   /* ek ağırlık, setlerden önce girilebilir */
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
    <button class="wo-pm" data-wpm="${f}" data-wk="${k}" data-wd="-1" aria-label="${tx("{0} azalt", [(label)])}" tabindex="-1">−</button>
    <label class="wo-v"><input type="text" inputmode="decimal" enterkeyhint="done" data-wi="${f}" data-wk="${k}"
      value="${v === null || v === undefined ? "" : fmtN(v)}" aria-label="${label}"><span>${label}</span></label>
    <button class="wo-pm" data-wpm="${f}" data-wk="${k}" data-wd="1" aria-label="${tx("{0} artır", [(label)])}" tabindex="-1">+</button>
  </div>`;
}
const woTick = `<svg aria-hidden="true"><use href="#i-check"/></svg>`;
function woSetRow(ex, rec, prev, k){
  const on = woSetDone(ex, rec, k), s = woSug(ex, rec, prev, k);
  const fields = ex.t === "w"
    ? woField("kg", s.kg == null ? s.kg : liftOut(s.kg), wUnit(), k) + woField("r", s.r, tx("tekrar"), k)
    : woField("s", s.v, ex.t === "t" ? tx("saniye") : tx("tekrar"), k);
  return `<div class="wo-set${on ? " on" : ""}">
    <span class="wo-no">${k+1}</span>
    <div class="wo-fields">${fields}</div>
    <button class="wo-ok" data-wok="${k}" aria-pressed="${on}" aria-label="${on ? tx("{0}. seti geri al", [(k+1)]) : tx("{0}. seti tamamlandı olarak işaretle", [(k+1)])}">${woTick}</button>
  </div>`;
}
function woChips(cur, max, unit){
  return `<div class="wo-chips" role="group" aria-label="${tx("Tamamlanan {0}", [(unit)])}">${Array.from({ length:max }, (_, i) =>
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
        ${ex.xkg ? `<div class="wo-fields" style="margin-top:14px">${woField("kg2", (rec.kg2 ?? (prev && prev.kg2) ?? null) === null ? null : liftOut(rec.kg2 ?? prev.kg2), tx("Ek {0}", [(wUnit())]), "")}</div>` : ""}
        <div class="wo-note">${tx("Değerler {0} geliyor. Aynıysa ✓'e bas, farklıysa − / + ile düzelt ya da sayıya dokunup yaz.", [(prev ? tx("geçen antrenmandan") : tx("programdaki hedeften"))])}</div>`;
    }
    case "wc": {
      const s = { kg: rec.kg ?? (prev && prev.kg) ?? null };
      return `<div class="wo-fields" style="margin-bottom:14px">${woField("kg", s.kg == null ? s.kg : liftOut(s.kg), wUnit(), "")}</div>
        ${woChips(rec.n || 0, ex.n, exText(ex.unit || "set"))}`;
    }
    case "n": return woChips(rec.n || 0, ex.n, exText(ex.unit || "tur"));
    case "sw": return `${woChips(rec.n || 0, ex.n, tx("tekrar"))}
      <div class="wo-fields" style="margin-top:14px">${woField("min", rec.min ?? (prev && prev.min) ?? null, tx("dakika"), "")}</div>`;
    case "sd": return `<div class="wo-fields">${woField("m", rec.m ?? ex.d ?? null, tx("metre"), "")}${woField("min", rec.min ?? (prev && prev.min) ?? null, tx("dakika"), "")}</div>`;
    case "c": {
      const min = rec.min ?? tgNum(ex.tg), km = rec.km ?? (prev && prev.km) ?? null;
      return `<div class="wo-fields">${woField("min", min, tx("dakika"), "")}${ex.km ? woField("km", km, "km", "") : ""}</div>
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
        <span>${tx("{0}/{1} hareket kaydettin.", [(nDone), (list.length)])}${nDone < list.length ? tx(" Eksikleri sonra da girebilirsin.") : ""}</span></div>
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
    ${restBar()}
    <div class="wo-nav"><div>
      <button class="ghost wo-prev" id="wo-back"${woIdx ? "" : " disabled"}>${tx("Geri")}</button>
      <button id="wo-next">${woIdx === list.length - 1 ? tx("Bitir") : tx("Sonraki hareket")}</button>
    </div></div>`;
}

function drawWO(){
  if (!woEl) return;
  woEl.innerHTML = woScreen();
  wireWO();
  wireRest();
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
  stopRest();
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
    goHow(id);
  });

  if (woDone || woIdx >= list.length) return;

  const name = list[woIdx], ex = parseEx(name, venue), prev = lastLift(name, vKey());
  const val = (f, k) => {
    const i = woEl.querySelector(`[data-wi="${f}"][data-wk="${k}"]`);
    if (!i) return null;
    const n = num(i.value);
    return n !== null && n >= 0 ? n : null;
  };

  /* Onaylı bir setin değeri değişince yeniden kaydedilir; ✓'e iki kez basmak gerekmez. */
  const resave = async k => {
    const cur = ((state.days[vKey()] || {}).lifts || {})[name];
    if (!cur || !woSetDone(ex, cur, k)) return;
    const before = records().find(r => r.name === name);
    if (ex.t === "w"){
      const r = val("r", k);
      if (!r) return;
      const kgIn = val("kg", k);
      cur.sets[k] = kgIn === null ? { r } : { kg: liftIn(kgIn), r };
    } else {
      const v = val("s", k);
      if (!v) return;
      cur.sets[k] = v;
    }
    await save();
    checkPR(name, before);
  };
  const setField = f => ["w","r","t"].includes(ex.t) && f !== "kg2";

  /* ± düğmeleri: kutuyu değiştirir; ✓ kaydeder, onaylı setlerde değişiklik hemen kaydedilir */
  q("[data-wpm]").forEach(b => b.onclick = () => {
    const f = b.dataset.wpm, k = b.dataset.wk;
    const i = woEl.querySelector(`[data-wi="${f}"][data-wk="${k}"]`);
    if (!i) return;
    const cur = num(i.value) ?? 0;
    i.value = fmtN(Math.max(0, woRound(f, cur + woStep(f) * (+b.dataset.wd))));
    i.dispatchEvent(new Event("input", { bubbles:true }));
    if (setField(f)) resave(+k);
    else if (i.onchange) i.onchange();
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
      const kgIn = val("kg", k), kg = kgIn === null ? null : liftIn(kgIn);
      rec.sets[k] = kg === null ? { r } : { kg, r };
    } else {
      const v = val("s", k);
      if (v === null || v === 0){ toast(ex.t === "t" ? tx("Kaç saniye tuttuğunu gir.") : tx("Kaç tekrar yaptığını gir.")); return; }
      rec.sets[k] = v;
    }
    for (let j = 0; j < rec.sets.length; j++) if (rec.sets[j] === undefined) rec.sets[j] = null;
    await save();
    haptic("light");
    startRest();
    drawWO();
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
    toast(tx("{0} set kaydedildi.", [(n)]));
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
    if (setField(f)){ i.onchange = () => resave(+i.dataset.wk); return; }
    i.onchange = async () => {
      const rec = woRec(name, ex.t);
      const before = records().find(r => r.name === name);
      const n = num(i.value);
      const v = n !== null && n >= 0 ? (f === "m" ? Math.round(n) : f === "kg" || f === "kg2" ? liftIn(n) : n) : null;
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
    ${open ? `<div class="how-b">${exAnimFor(id) ? `<div class="how-anim" data-anim="${id}" role="img" aria-label="${esc(g.n)}"></div>` : ""}<ol>${g.s.map(x => `<li>${x}</li>`).join("")}</ol>
      <div class="how-x"><b>${tx("Dikkat:")}</b> ${g.x}</div></div>` : ""}
  </div>`;
}

function howList(program){
  const q = norm(howQuery.trim());
  if (q.length >= 2){
    const hits = GUIDE.filter(g => matchScore(g.n, q) > 0);
    return hits.length ? hits.map(g => howCard(g.id)).join("")
      : `<div class="empty">${tx("\"{0}\" için anlatım bulunamadı.", [(esc(howQuery))])}</div>`;
  }
  const seen = new Set();
  return program.training.days.filter(d => d.b).map(d => {
    const ids = [];
    for (const ex of exercisesOf(d)) for (const id of guidesFor(ex))
      if (!seen.has(id)){ seen.add(id); ids.push(id); }
    if (!ids.length) return "";
    return `<div class="lbl" style="margin:14px 0 2px">${WD_NAMES[d.wd]} · ${esc(d.t)}</div>${ids.map(howCard).join("")}`;
  }).join("");
}

/* Program sekmesinin altındaki hareket rehberi: arama ve açılır liste. */
function howtoView(program){
  return fold("how", tx("Nasıl yapılır"), "", `
    <input id="how-q" type="text" aria-label="${tx("Hareket ara")}" placeholder="${tx("Hareket ara: squat, barfiks, plank…")}" value="${esc(howQuery)}" autocomplete="off">
    <div class="metric-note" style="margin:10px 0 4px">${tx("Ağrı hissedersen dur.")}</div>
    <div id="how-res">${howList(program)}</div>`);
}

function wireHowto(){
  mountExAnim(app);
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
