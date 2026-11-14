"use strict";

/* ---- takımyıldız ----
   Haftanın yedi günü, haftanın takımyıldızının yedi yıldızıdır: p[0] pazartesi, p[6] pazar.
   Şekiller 320×150 kutuda elle çizildi; e, şekli oluşturan çizgilerin yıldız çiftleri.
   Sıra değişmemeli: kaydı olmayan eski haftaların adı seedOf(ws) % 14 ile bu sıradan gelir.
   Ad kayıtta Türkçe durur, ekranda tx() ile çevrilir. */
const CONSTELLATIONS = [
  { id:"kervan", n:"Kervan", p:[[34,50],[82,86],[126,30],[162,60],[200,30],[250,92],[84,138]], e:[[0,1],[1,2],[2,3],[3,4],[4,5],[1,6]] },
  { id:"lale",   n:"Lale",   p:[[160,138],[110,108],[160,94],[116,22],[160,44],[204,22],[210,108]], e:[[0,2],[0,1],[0,6],[2,3],[3,4],[4,5],[5,2]] },
  { id:"kayik",  n:"Kayık",  p:[[46,84],[96,124],[224,124],[274,84],[160,84],[160,16],[226,66]], e:[[0,1],[1,2],[2,3],[0,4],[4,3],[4,5],[5,6],[6,4]] },
  { id:"yay",    n:"Yay",    p:[[118,14],[158,42],[174,75],[158,108],[118,136],[70,75],[272,75]], e:[[0,1],[1,2],[2,3],[3,4],[0,5],[5,4],[5,6]] },
  { id:"kartal", n:"Kartal", p:[[36,22],[98,62],[160,20],[160,66],[222,62],[284,22],[160,134]], e:[[0,1],[1,3],[2,3],[3,4],[4,5],[3,6]] },
  { id:"nar",    n:"Nar",    p:[[160,138],[106,112],[136,52],[118,12],[202,12],[184,52],[214,112]], e:[[0,1],[1,2],[2,5],[5,6],[6,0],[2,3],[5,4]] },
  { id:"cinar",  n:"Çınar",  p:[[160,138],[160,92],[112,66],[66,40],[160,14],[254,40],[208,66]], e:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,1]] },
  { id:"marti",  n:"Martı",  p:[[26,96],[74,30],[120,48],[160,90],[200,48],[246,30],[294,96]], e:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]] },
  { id:"fener",  n:"Fener",  p:[[128,138],[192,138],[184,58],[136,58],[160,18],[66,36],[254,36]], e:[[0,1],[1,2],[2,3],[3,0],[3,4],[4,2],[4,5],[4,6]] },
  { id:"pusula", n:"Pusula", p:[[160,12],[248,75],[160,138],[72,75],[160,75],[206,40],[114,110]], e:[[0,1],[1,2],[2,3],[3,0],[0,4],[4,2],[3,4],[4,1],[5,4],[4,6]] },
  { id:"kule",   n:"Kule",   p:[[138,140],[138,76],[98,76],[160,10],[222,76],[182,76],[182,140]], e:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0]] },
  { id:"tulpar", n:"Tulpar", p:[[46,34],[104,72],[206,72],[226,138],[88,138],[200,10],[148,26]], e:[[0,1],[1,2],[2,3],[1,4],[1,6],[6,5]] },
  { id:"kandil", n:"Kandil", p:[[52,86],[104,120],[208,120],[262,82],[198,78],[116,78],[52,28]], e:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,6]] },
  { id:"capa",   n:"Çapa",   p:[[160,10],[110,54],[160,54],[210,54],[92,100],[160,138],[228,100]], e:[[0,2],[1,2],[2,3],[2,5],[4,5],[5,6]] }
];
const CONST_NAMES = CONSTELLATIONS.map(c => c.n);
const SKY_W = 320, SKY_H = 150;
const constById = id => CONSTELLATIONS.find(c => c.id === id) || null;
const constName = c => tx(c.n);
const weekStart = k => shiftDays(k, -(isoWeekday(k) - 1));
function rng(seed){ let x = (seed >>> 0) || 1; return () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296; }
const seedOf = k => Number(k.replace(/-/g, ""));
/* Bu özellikten önceki ad: kaydı olmayan haftalar bu adla kalır. */
const legacyConst = ws => CONSTELLATIONS[seedOf(ws) % CONSTELLATIONS.length];
const constOf = ws => constById(state && state.sky && state.sky[ws]) || legacyConst(ws);

/* Damgalı gün her zaman tam sayılır; damgasızsa güncel hesaba bakılır. */
const fullDay = k => {
  const d = state.days[k];
  if (d && d.star) return true;
  const r = dayRatio(k);
  return r !== null && r >= 1;
};

function streakNow(){
  let k = today(), n = 0;
  if (!fullDay(k)) k = shiftDays(k, -1);   /* bugün henüz bitmediyse seri dünden sayılır */
  while (fullDay(k) && n < 3650){ n++; k = shiftDays(k, -1); }
  return n;
}
function starTotal(){ return Object.keys(state.days).filter(fullDay).length; }

/* Bir hafta: lit tam günler (yalnızca bunlar beşe sayılır), lv yıldızların parlaklığı
   (0..1; damgalı ya da tam gün 1, gelecek gün null). */
function weekInfo(ws){
  const t = today();
  const days = Array.from({ length:7 }, (_, i) => shiftDays(ws, i));
  const lit = days.map(k => k <= t && fullDay(k));
  const lv = days.map((k, i) => k > t ? null : lit[i] ? 1 : clamp(dayRatio(k) || 0, 0, 0.99));
  const n = lit.filter(Boolean).length;
  const c = constOf(ws);
  return { days, lit, lv, n, c, done: n >= 5 };
}

/* Kazanılan takımyıldızlar: { kimlik: [hafta başları] }. before verilirse o haftadan öncekiler. */
function skyEarned(before){
  const t = today();
  const weeks = [...new Set(Object.keys(state.days).filter(k => k <= t).map(weekStart))].sort();
  const out = {};
  for (const ws of weeks){
    if (before && ws >= before) continue;
    const w = weekInfo(ws);
    if (w.done) (out[w.c.id] = out[w.c.id] || []).push(ws);
  }
  return out;
}

/* Yeni haftanın takımyıldızı: önce hiç kazanılmamışlar, hepsi kazanıldıysa en az kazanılanlar;
   mümkünse geçen haftanınki tekrar etmez. Seçim hafta başından gelir, tekrarlanabilir. */
function pickConst(ws, earned, avoid){
  const cnt = c => (earned[c.id] || []).length;
  const min = Math.min(...CONSTELLATIONS.map(cnt));
  let pool = CONSTELLATIONS.filter(c => cnt(c) === min);
  if (pool.length > 1 && avoid) pool = pool.filter(c => c.id !== avoid);
  return pool[seedOf(ws) % pool.length].id;
}

/* Haftanın ilk açılışında bu haftanın takımyıldızı kayda yazılır. Değiştiyse true. */
function ensureSkyWeek(){
  if (!state || !state.days) return false;
  const ws = weekStart(today());
  if (state.sky && state.sky[ws]) return false;
  const id = pickConst(ws, skyEarned(ws), constOf(shiftDays(ws, -7)).id);
  if (!state.sky) state.sky = {};
  state.sky[ws] = id;
  return true;
}

/* Hafta ortası satırı. n: tam gün, left: bugün dahil henüz yanmamış kalan gün.
   Dönen: { done } | { need } | null (kalan günler yetmiyor). */
function skyMid(n, left){
  if (n >= 5) return { done: true };
  const need = 5 - n;
  return need <= left ? { need } : null;
}

const STAR_D = "M0-6.5 1.6-1.6 6.5 0 1.6 1.6 0 6.5-1.6 1.6-6.5 0-1.6-1.6Z";
const FULL7 = [1,1,1,1,1,1,1], GHOST7 = [0,0,0,0,0,0,0];

/* Takımyıldızın çizimi. lv: yedi yıldızın parlaklığı (null gelecek gün).
   o: { mini, anim (kendini çizer), today (bugünün yıldız sırası), seed } */
function skySVG(c, lv, o){
  o = o || {};
  const r = rng(o.seed || seedOf("2026-01-05") + c.id.length);
  const f = v => v.toFixed(1);
  const dust = Array.from({ length: o.mini ? 10 : 30 }, () =>
    `<circle cx="${f(r()*SKY_W)}" cy="${f(r()*SKY_H)}" r="${(r()*0.9+0.4).toFixed(2)}" class="sk-dust"/>`).join("");
  const on = i => lv[i] === 1;
  const step = o.anim ? 1.2 / Math.max(c.e.length, 1) : 0;
  const lines = c.e.map(([a, b], j) => {
    const lit = on(a) && on(b);
    const [x1, y1] = c.p[a], [x2, y2] = c.p[b];
    return `<line class="sk-l${lit ? " on" : ""}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${lit && o.anim ? ` pathLength="1"` : ""}${o.anim ? ` style="--d:${(j * step).toFixed(2)}s"` : ""}/>`;
  }).join("");
  /* Küçük çizimde (atlas) yıldızlar büyür ki küçültülünce de seçilsin. */
  const z = o.mini ? 2 : 1;
  const stars = c.p.map(([x, y], i) => {
    const v = lv[i], d = o.anim ? ` style="--d:${(i * 0.16).toFixed(2)}s"` : "";
    const ring = o.today === i ? `<circle cx="${x}" cy="${y}" r="10" class="sk-today"/>` : "";
    if (v === null || v === undefined) return `${ring}<circle cx="${x}" cy="${y}" r="2.6" class="sk-f"/>`;
    if (v <= 0) return `${ring}<circle cx="${x}" cy="${y}" r="${2.4 * z}" class="sk-d"${d}/>`;
    const full = v >= 1;
    return `${ring}<g class="sk-s${full ? " on" : ""}" transform="translate(${x} ${y})"${d}>
      ${full ? `<circle r="${12 * z}" class="sk-glow"/>` : ""}
      <path d="${STAR_D}" transform="scale(${full ? 1.15 * z : (0.6 + 0.35 * v).toFixed(2)})" opacity="${full ? 1 : (0.3 + 0.5 * v).toFixed(2)}"/></g>`;
  }).join("");
  return `<svg class="sky-svg${o.anim ? " sk-anim" : ""}" viewBox="0 0 ${SKY_W} ${SKY_H}" aria-hidden="true">${dust}${lines}${stars}</svg>`;
}

const skyPct = (x, w) => (x / w * 100).toFixed(2) + "%";

function skyCard(){
  const t = today(), ws = weekStart(t), w = weekInfo(ws);
  const name = constName(w.c);
  const left = w.days.filter((k, i) => k >= t && !w.lit[i]).length;
  const mid = skyMid(w.n, left);
  const ti = w.days.indexOf(t);
  const btns = w.c.p.map(([x, y], i) => {
    const k = w.days[i], v = w.lv[i];
    const label = `${WD_NAMES[i + 1]}: ${v === null ? tx("henüz gelmedi") : tx("yüzde {0}", [Math.round(v >= 1 ? 100 : v * 100)])}`;
    return `<button class="sky-b" data-sky-day="${k}" style="left:${skyPct(x, SKY_W)};top:${skyPct(y, SKY_H)}"${v === null ? ` aria-disabled="true"` : ""} aria-label="${label}"></button>`;
  }).join("");
  return `<section class="sky">
    <div class="sky-head">
      <div><div class="sky-t">${tx("Bu hafta: {0}", [name])}</div>
        <div class="sky-s">${tx("{0}/7 yıldız", [w.n])}</div></div>
      <div class="sky-n"><b class="num">${streakNow()}</b><span>${tx("günlük seri")}</span></div>
    </div>
    <div class="sky-stage" role="group" aria-label="${tx("Haftanın takımyıldızı")}">${skySVG(w.c, w.lv, { today: ti, seed: seedOf(ws) })}${btns}</div>
    ${mid ? `<div class="sky-note">${mid.done ? tx("{0} belirdi", [name])
      : mid.need === 1 ? tx("Bir yıldız daha, {0} belirecek", [name]) : tx("{0} yıldız daha, {1} belirecek", [mid.need, name])}</div>` : ""}
  </section>`;
}

/* Bir günün hedefleri: gün puanıyla (dayScore) aynı liste. [{ t: başlık, ok }] */
function skyDayGoals(k){
  const program = currentProgram(), d = state.days[k], e = d || { tasks: [] }, out = [];
  if (program) for (const title of suggestedTitles(program, k)){
    const kind = taskKind({ title });
    if (skipTask(kind, k, d)) continue;
    const a = autoInfo({ title, kind, suggested: true }, e, program, k);
    if (!a) continue;
    out.push({ t: a.label || a.title, ok: !!a.ok });
  }
  for (const x of (d && d.tasks) || []) if (!x.suggested) out.push({ t: x.title, ok: !!x.done });
  return out;
}

function skySheet(id, inner){
  const el = document.createElement("div");
  el.className = "sheet-bg";
  el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="${id}-t">${inner}</div>`;
  document.body.appendChild(el);
  const close = () => sheetOut(el);
  el.onclick = ev => { if (ev.target === el) close(); };
  el.querySelectorAll(".sheet-x, [data-close]").forEach(b => b.onclick = close);
  return { el, close };
}
const sheetHead = (id, title) => `<div class="sheet-h"><b id="${id}-t">${title}</b><button class="sheet-x" aria-label="${tx("Kapat")}">×</button></div>`;

function openSkyDay(k){
  if (!k || k > today()) return;
  const items = skyDayGoals(k);
  const { el, close } = skySheet("sd", `${sheetHead("sd", `${prettyDate(k)} · ${weekdayName(k)}`)}
    ${items.length ? `<ul class="sd-l">${items.map(x => `<li class="${x.ok ? "ok" : ""}">${icon(x.ok ? "star4" : "next")}<span>${esc(x.t)}</span><i>${x.ok ? tx("tamam") : tx("eksik")}</i></li>`).join("")}</ul>`
      : `<div class="empty">${tx("Hedef yok")}</div>`}
    <button id="sd-go" style="margin-top:14px">${tx("O güne git")}</button>`);
  el.querySelector("#sd-go").onclick = () => { close(); goToDay(k); };
  el.querySelector("#sd-go").focus();
}

function goToDay(k){
  resetMealUI();
  if (k !== today()) ensureDay(k);
  viewDate = k === today() ? null : k;
  tab = "today";
  saveState(state); render(); window.scrollTo(0, 0);
}

const weekRange = ws => {
  const fmt = k => new Date(k + "T12:00:00").toLocaleDateString(locale(), { day:"numeric", month:"short" });
  return `${fmt(ws)} – ${fmt(shiftDays(ws, 6))}`;
};

/* ---- gökyüzü atlası (Ben › Grafikler) ---- */
function skyAtlas(){
  const earned = skyEarned();
  const got = CONSTELLATIONS.filter(c => earned[c.id]).length;
  return `<section>
    <h2>${tx("Gökyüzü atlası")} <span class="count num">${got} / ${CONSTELLATIONS.length}</span></h2>
    <div class="atlas">${CONSTELLATIONS.map(c => {
      const n = (earned[c.id] || []).length;
      return `<button class="atl${n ? " on" : ""}" data-atlas="${c.id}" aria-label="${n ? tx("{0}, {1} kez kazanıldı", [constName(c), n]) : tx("{0}, henüz kazanılmadı", [constName(c)])}">
        ${skySVG(c, n ? FULL7 : GHOST7, { mini: true })}
        <b>${constName(c)}</b>${n ? `<i class="num" aria-hidden="true">${n}</i>` : ""}</button>`;
    }).join("")}</div>
  </section>`;
}

function openAtlas(id){
  const c = constById(id);
  if (!c) return;
  const weeks = skyEarned()[id] || [];
  skySheet("at", `${sheetHead("at", constName(c))}
    <div class="sky-pan">${skySVG(c, weeks.length ? FULL7 : GHOST7)}</div>
    ${weeks.length ? `<ul class="at-l">${weeks.slice().reverse().map(ws => `<li><span>${weekRange(ws)}</span><b class="num">${tx("{0}/7 yıldız", [weekInfo(ws).n])}</b></li>`).join("")}</ul>`
      : `<div class="empty">${tx("Henüz kazanılmadı.")}</div>`}`);
}

/* ---- hafta kapanışı ----
   Hafta bittikten sonraki ilk açılışta bir kez: geçen haftanın takımyıldızı kendini çizer.
   Gösterilen hafta state.skyClosed'a yazılır. Geçen haftaya hiç veri girilmediyse sessizce geçilir. */
function weekCloseDue(){
  if (!state || !state.profile || !state.days) return null;
  const pw = shiftDays(weekStart(today()), -7);
  return state.skyClosed && state.skyClosed >= pw ? null : pw;
}
/* Kapanış özeti: yalnızca sayılar. best: en yüksek puanlı gün (yoksa null), train: antrenmanlı gün. */
function weekSummary(ws){
  const w = weekInfo(ws);
  let best = null, top = 0;
  w.days.forEach((k, i) => { if (w.lv[i] !== null && w.lv[i] > top){ top = w.lv[i]; best = k; } });
  return { ...w, best, train: w.days.filter(liftMark).length, any: w.days.some(k => !dayEmpty(k)) };
}
function maybeShowWeekClose(){
  const pw = weekCloseDue();
  if (!pw) return false;
  state.skyClosed = pw;
  saveState(state);
  const S = weekSummary(pw);
  if (!S.any) return false;
  const name = constName(S.c);
  const line = [tx("{0}/7 yıldız", [S.n])]
    .concat(S.best ? [tx("en iyi gün {0}", [WD_NAMES[isoWeekday(S.best)]])] : [])
    .concat([tx("{0} antrenman", [S.train])]).join(" · ");
  const { el, close } = skySheet("wc", `${sheetHead("wc", S.done ? tx("{0} belirdi", [name]) : tx("Geçen hafta: {0}", [name]))}
    <div class="sky-pan" role="img" aria-label="${esc(line)}">${skySVG(S.c, S.lv, { anim: !reduceMotion(), seed: seedOf(pw) })}</div>
    <div class="wc-line num">${line}</div>
    <button data-close style="margin-top:14px">${tx("Tamam")}</button>`);
  el.querySelector("[data-close]").onclick = close;
  el.querySelector("[data-close]").focus();
  return true;
}

function wireSky(){
  app.querySelectorAll("[data-sky-day]").forEach(b => b.onclick = () => {
    if (b.getAttribute("aria-disabled") === "true") return;
    openSkyDay(b.dataset.skyDay);
  });
  app.querySelectorAll("[data-atlas]").forEach(b => b.onclick = () => openAtlas(b.dataset.atlas));
}
