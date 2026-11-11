"use strict";

/* ---------------- uygulama ---------------- */
let state = null, tab = "today", notice = null, mealVariant = 0;
/* Bugün sekmesi herhangi bir güne bakabilir: null ise bugün. */
let viewDate = null;
const vKey = () => viewDate || today();
const onToday = () => !viewDate;
const dayFor = k => state.days[k] || { tasks: [] };
/* Geçmiş bir güne gidilince kayıt açılır; görev tohumlaması yapılmaz. */
function ensureDay(k){
  if (k === today()) { ensureToday(); return state.days[k]; }
  if (!state.days[k]) state.days[k] = { tasks: [] };
  const e = state.days[k];
  if (!e.seeded){
    const p = currentProgram();
    if (p){
      for (const title of suggestedTitles(p, k))
        if (!e.tasks.some(x => x.suggested && x.title === title))
          e.tasks.push({ id: Date.now()+Math.random(), title, done:false, suggested:true });
      e.seeded = true;
    }
  }
  syncOptional(e, k);
  return e;
}
let calMonth = today().slice(0,7), calSel = null;
let mealTab = "log", logQuery = "", logPick = null, logCat = null;
let mealAddOpen = false, mealAddTime = "oglen", addOpen = null;
let fixSlot = null, fixQuery = "", fixPick = null;
let recipeOpen = null, recipeQuery = "", recipeOffset = 0;
let calTab = "cal", newTaskRepeat = false, editLog = null;
let goalOpen = null, meTab = "body";
/* ---- sahne geçişleri ----
   Sayfa değişirken eski içerik bulanarak çıkar, yenisi parça parça girer. */
const TAB_ORDER = ["today","plan","meals","calendar","settings"];
let navDir = 0, navKeep = "", navBusy = false, navPending = null, goalJust = null;
const _ringPrev = {}, _doneSeen = {}, _justAt = {};
function navTo(fn, dir, keep){
  if (navBusy){ navPending = fn; return; }
  const m = app.querySelector("main");
  navDir = dir || 1; navKeep = keep || "";
  if (!m || reduceMotion()){ fn(); return; }
  navBusy = true;
  m.classList.remove("page-in");
  m.classList.add("page-out");
  if (navDir < 0) m.classList.add("rev");
  if (navKeep) m.classList.add(navKeep);
  setTimeout(() => {
    navBusy = false; fn();
    if (navPending){ const p = navPending; navPending = null; p(); }
  }, 170);
}
const segDir = b => { const all = [...b.parentElement.children]; return all.indexOf(b) >= all.findIndex(x => x.getAttribute("aria-current") === "true") ? 1 : -1; };
/* Alt menüdeki işaret eski sekmeden yenisine kayar. */
function tabIndicator(prev){
  const bar = app.querySelector(".tabbar"); if (!bar) return;
  const ind = bar.querySelector(".tab-ind");
  const cur = bar.querySelector('[data-tab][aria-current="true"]');
  if (!ind) return;
  if (!cur){ ind.style.opacity = "0"; return; }
  const place = b => { ind.style.transform = `translateX(${b.offsetLeft + b.offsetWidth / 2 - 23}px)`; };
  const from = prev && prev !== tab ? bar.querySelector(`[data-tab="${prev}"]`) : null;
  if (from && !reduceMotion()){
    ind.style.transition = "none"; place(from); void ind.offsetWidth; ind.style.transition = "";
  } else ind.style.transition = "none";
  place(cur); ind.style.opacity = "1";
  if (!from) requestAnimationFrame(() => { ind.style.transition = ""; });
}
/* Sayfaya girildiğinde: ekranın altında kalan kartlar kaydırdıkça belirir,
   grafikler göründükleri anda çizilir. */
let _io = null;
function motionAfter(m, entered){
  if (!m || !entered || reduceMotion() || !("IntersectionObserver" in window)) return;
  if (_io) _io.disconnect();
  _io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    if (el.classList.contains("ch-wrap")){ el.classList.remove("ch-pre"); el.classList.add("draw"); }
    else { el.classList.remove("rv"); el.classList.add("rv-in"); }
    _io.unobserve(el);
  }), { rootMargin:"0px 0px -6% 0px" });
  const charts = [...m.querySelectorAll(".ch-wrap")];
  charts.forEach(el => el.classList.add("ch-pre"));
  requestAnimationFrame(() => {
    if (!m.isConnected) return;
    const vh = window.innerHeight;
    [...m.children].forEach(el => {
      if (el.getBoundingClientRect().top > vh * 0.94){ el.classList.add("rv"); _io.observe(el); }
    });
    charts.forEach(el => _io.observe(el));
  });
}
/* Kartlar basıldığı noktaya doğru hafifçe eğilir. */
let _tilt = null;
const TILT = ".oc,.os-t,.os-p,.own,.eve,.gh-s,.g-h,.fav button,.bt";
document.addEventListener("pointerdown", e => {
  if (reduceMotion() || !e.target.closest) return;
  const el = e.target.closest(TILT);
  if (!el) return;
  const r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
  const k = Math.min(7, 900 / Math.max(r.width, 1));
  el.style.transition = "transform .12s ease-out";
  el.style.transform = `perspective(700px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * k).toFixed(2)}deg) scale(.985)`;
  _tilt = el;
}, { passive:true });
const untilt = () => {
  if (!_tilt) return;
  const t = _tilt; _tilt = null;
  t.style.transition = "transform .5s cubic-bezier(.34,1.45,.64,1)";
  t.style.transform = "";
  setTimeout(() => { t.style.transition = ""; }, 520);
};
["pointerup","pointercancel","scroll"].forEach(ev => document.addEventListener(ev, untilt, { passive:true, capture:true }));

/* Alttan açılan paneller kapanırken de kayarak iner. */
function sheetOut(el){
  if (!el || !el.isConnected) return;
  if (reduceMotion() || !el.classList.contains("sheet-bg")){ el.remove(); return; }
  el.classList.add("out");
  setTimeout(() => el.remove(), 240);
}
const nowHour = () => new Date().getHours();
/* Hazır hedefler: açılıp kapanabilen, veriyle işaretlenen ek hedefler. */
const stepGoal = () => { const g = state && state.profile && state.profile.goals; return g && g.steps > 0 ? g.steps : 0; };
function syncOptional(entry, k){
  if (!entry || !entry.seeded) return;
  /* Program gün içinde değişirse antrenman / dinlenme satırı da ona uysun. */
  const p = cachedProgram();
  if (p){
    const day = p.training.none ? null : p.training.days.find(d => d.wd === isoWeekday(k));
    const isT = x => x.suggested && /^Antrenman:/.test(x.title), isR = x => x.suggested && /^Dinlenme günü/.test(x.title);
    const wantT = !!(day && day.b), wantR = !!(day && !day.b);
    if (entry.tasks.some(x => (isT(x) && !wantT) || (isR(x) && !wantR)))
      entry.tasks = entry.tasks.filter(x => !(isT(x) && !wantT) && !(isR(x) && !wantR));
    if (wantT && !entry.tasks.some(isT)) entry.tasks.unshift({ id: Date.now()+Math.random(), title:"Antrenman: " + day.t, done:false, suggested:true });
    if (wantR && !entry.tasks.some(isR)) entry.tasks.unshift({ id: Date.now()+Math.random(), title:"Dinlenme günü — 20 dk esneme", done:false, suggested:true });
  }
  const want = stepGoal();
  const i = entry.tasks.findIndex(x => x.suggested && taskKind(x) === "steps");
  if (want && i < 0) entry.tasks.push({ id: Date.now()+Math.random(), title: want + " adım at", done:false, suggested:true, kind:"steps" });
  if (!want && i >= 0) entry.tasks.splice(i, 1);
}
const app = document.getElementById("app");
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const num = v => { const n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : null; };
const icon = (id, cls) => `<svg class="ico ${cls||""}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const iconBox = (id, plain) => `<span class="ico-wrap${plain?" plain":""}" data-i="${id}">${icon(id)}</span>`;

function lastWeight(){
  const keys = Object.keys(state.days).sort().reverse();
  for (const k of keys) if (typeof state.days[k].weight === "number") return state.days[k].weight;
  /* Profil kaydı eksikse undefined dönmesin: null kontrolleri buna dayanıyor. */
  return (state.profile && typeof state.profile.startWeight === "number") ? state.profile.startWeight : null;
}

function currentProgram(){
  const w = lastWeight();
  return w === null ? null : buildProgram(state.profile, w, state.adjustment);
}

function ensureToday(){
  const t = today();
  if (!state.days[t]) state.days[t] = { tasks: [] };
  const entry = state.days[t];
  if (!entry.seeded) {
    const p = currentProgram();
    if (p) {
      for (const title of suggestedTitles(p, t))
        entry.tasks.push({ id: Date.now()+Math.random(), title, done:false, suggested:true });
      entry.seeded = true;
    }
  }
  /* Tekrar eden görevler programdan bağımsız; her gün ayrıca kontrol edilir. */
  for (const r of routinesForDay(t))
    if (!entry.tasks.some(x => x.rt && x.title === r.title))
      entry.tasks.push({ id: Date.now()+Math.random(), title:r.title, done:false, suggested:false, rt:true });
  syncOptional(entry, t);
}

/* ---- tema önizlemesi ----
   Seçilen tema, sayfanın geri kalanı değişmeden küçük bir uygulama maketinde
   gösterilir: maket kendi jeton kümesini taşır (.thm-light / .thm-dark). */
const THEMES = [["auto","Telefonu izle"],["light","Açık"],["dark","Koyu"]];
const sysDark = () => !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
const themeClass = t => (t === "dark" || (t === "auto" && sysDark())) ? "thm-dark" : "thm-light";

function themeMock(t){
  return `<div class="tp ${themeClass(t)}" aria-hidden="true">
    <div class="tp-h"><div><b>${tx("İyi akşamlar, Efe")}</b><i>${tx("Bugün 2 görevin kaldı.")}</i></div><span class="tp-gear"></span></div>
    <div class="tp-sky"><b>${tx("Bu haftanın takımyıldızı")}</b><i>${tx("5/7 yıldız yandı")}</i>
      <svg viewBox="0 0 120 34"><path d="M8 24 34 12 60 20 86 8 112 16" fill="none" stroke="var(--star)" stroke-width="1.2" opacity=".7"/>
        ${[[8,24],[34,12],[60,20],[86,8],[112,16]].map(([x,y],i)=>
          `<circle cx="${x}" cy="${y}" r="${i<3?2.6:1.6}" fill="${i<3?"var(--star)":"var(--star-off)"}"/>`).join("")}</svg></div>
    <div class="tp-card"><div class="tp-hero"><span class="tp-ring"></span>
      <div><b>${tx("420 kcal")}</b><i>${tx("hedefe kalan")}</i></div></div></div>
    <div class="tp-card">
      <div class="tp-task"><span class="tp-ck on"></span><span>${tx("2.200 kcal hedefini tut")}</span></div>
      <div class="tp-task"><span class="tp-ck"></span><span>${tx("2.800 ml su iç")}</span></div>
      <div class="tp-chart"><i style="height:38%"></i><i style="height:62%"></i><i style="height:50%"></i><i style="height:78%"></i><i style="height:66%"></i></div>
    </div>
    <div class="tp-bar">${[0,1,2,3,4].map(i => `<i class="${i===1?"on":""}"></i>`).join("")}</div>
  </div>`;
}

/* Tema seçimi: önizlemeyi göster, onaylayınca uygula. */
function openThemeSheet(cur, onPick){
  let sel = cur || "auto";
  const el = document.createElement("div");
  el.className = "sheet-bg";
  const draw = () => {
    el.querySelector("#tp-box").innerHTML = themeMock(sel);
    el.querySelectorAll("[data-tp]").forEach(b => {
      const on = b.dataset.tp === sel;
      b.setAttribute("aria-current", on); b.setAttribute("aria-selected", on);
    });
    el.querySelector("#tp-note").textContent = sel === "auto"
      ? `Telefonun ayarı geçerli olur; şu an ${sysDark() ? "koyu" : "açık"} görünüyor ve akşam değişebilir.`
      : sel === "dark" ? "Her zaman koyu kalır, telefonun ayarı ne olursa olsun."
      : "Her zaman açık kalır, telefonun ayarı ne olursa olsun.";
  };
  el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="tp-t">
    <div class="sheet-h"><b id="tp-t">${tx("Tema")}</b><button class="sheet-x" aria-label="${tx("Kapat")}">×</button></div>
    <div class="seg" role="tablist" aria-label="${tx("Tema seçenekleri")}">${THEMES.map(([k,l]) =>
      `<button data-tp="${k}" role="tab" aria-current="false" aria-selected="false">${l}</button>`).join("")}</div>
    <div id="tp-box"></div>
    <div class="metric-note" id="tp-note" style="margin-top:12px"></div>
    <div class="row" style="margin-top:16px">
      <button id="tp-ok">${tx("Bunu kullan")}</button>
      <button class="ghost" id="tp-cancel" style="flex:0 0 100px">${tx("Vazgeç")}</button>
    </div>
  </div>`;
  document.body.appendChild(el);
  draw();
  el.querySelectorAll("[data-tp]").forEach(b => b.onclick = () => { sel = b.dataset.tp; draw(); });
  const close = () => sheetOut(el);
  el.onclick = ev => { if (ev.target === el) close(); };
  el.querySelector(".sheet-x").onclick = close;
  el.querySelector("#tp-cancel").onclick = close;
  el.querySelector("#tp-ok").onclick = () => { close(); onPick(sel); };
  el.querySelector("#tp-ok").focus();
}
