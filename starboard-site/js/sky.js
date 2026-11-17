"use strict";

/* ---- takımyıldız ----
   Gerçek takımyıldızlar. Her tamamlanan gün sıradaki yıldızı yakar; şeklin bütün yıldızları yanınca
   takımyıldız belirir ve sıradaki başlar (hafta sınırı yok). İlerleme kayıttan türetilir: tam günler
   (fullDay) tarih sırasıyla takımyıldızlara bölünür, yeni alan yok. Eski state.sky (hafta -> kimlik)
   ve state.skyClosed kayıtta durur, silinmez; yalnız 2 -> 3 göçü onları yazar.
   s: yıldızlar [sağ açıklık (saat), dik açıklık (derece)], yaklaşık J2000, çizim sırası = yanma sırası.
   e: şekli oluşturan çizgiler (s dizisinde yıldız çiftleri). m: akşam gökyüzünde (yaklaşık 21:00,
   kuzey yarımküre, Türkiye enlemi) iyi göründüğü aylar. Ad kayıtta Türkçe durur, ekranda tx() ile çevrilir. */
const SKY_W = 320, SKY_H = 180, SKY_PAD = 16;

/* Gökyüzü koordinatını kutuya yerleştirir: doğu solda (haritadaki gibi), enlem payı cos(dik açıklık) ile
   daraltılır, şekil oranı korunur ve kutuya ortalanır. */
function plotStars(stars){
  const dec0 = stars.reduce((a, s) => a + s[1], 0) / stars.length, k = Math.cos(dec0 * Math.PI / 180);
  const raw = stars.map(s => [-s[0] * 15 * k, -s[1]]);
  const x0 = Math.min(...raw.map(p => p[0])), y0 = Math.min(...raw.map(p => p[1]));
  const w = Math.max(...raw.map(p => p[0])) - x0, h = Math.max(...raw.map(p => p[1])) - y0;
  const sc = Math.min((SKY_W - 2 * SKY_PAD) / w, (SKY_H - 2 * SKY_PAD) / h);
  const ox = (SKY_W - w * sc) / 2, oy = (SKY_H - h * sc) / 2;
  return raw.map(([x, y]) => [Math.round((ox + (x - x0) * sc) * 10) / 10, Math.round((oy + (y - y0) * sc) * 10) / 10]);
}
const CONSTELLATIONS = [
  { id:"buyukayi", n:"Büyük Ayı", m:[3,4,5,6],      /* Büyük Kepçe: Alkaid, Mizar, Alioth, Megrez, Phecda, Merak, Dubhe */
    s:[[13.792,49.31],[13.399,54.93],[12.900,55.96],[12.257,57.03],[11.897,53.69],[11.031,56.38],[11.062,61.75]],
    e:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]] },
  { id:"kassiopeia", n:"Kassiopeia", m:[9,10,11,12,1],      /* W: Caph, Schedar, Gamma, Ruchbah, Segin */
    s:[[0.153,59.15],[0.675,56.54],[0.945,60.72],[1.430,60.24],[1.907,63.67]],
    e:[[0,1],[1,2],[2,3],[3,4]] },
  { id:"kugu", n:"Kuğu", m:[7,8,9,10,11],      /* Kuzey Haçı: Deneb, Sadr, Eta, Albireo, Delta, Gienah */
    s:[[20.690,45.28],[20.370,40.26],[19.938,35.08],[19.512,27.96],[19.750,45.13],[20.770,33.97]],
    e:[[0,1],[1,2],[2,3],[4,1],[1,5]] },
  { id:"kartal", n:"Kartal", m:[7,8,9,10],      /* Tarazed, Altair, Alshain, Delta, Theta, Lambda, Zeta */
    s:[[19.771,10.61],[19.846,8.87],[19.922,6.41],[19.425,3.11],[20.188,-0.82],[19.104,-4.88],[19.090,13.86]],
    e:[[6,0],[0,1],[1,2],[1,3],[3,5],[2,4]] },
  { id:"orion", n:"Orion", m:[12,1,2,3],      /* Betelgeuse, Meissa, Bellatrix, Mintaka, Alnilam, Alnitak, Saiph, Rigel */
    s:[[5.919,7.41],[5.585,9.93],[5.419,6.35],[5.533,-0.30],[5.603,-1.20],[5.679,-1.94],[5.796,-9.67],[5.242,-8.20]],
    e:[[0,1],[1,2],[0,5],[2,3],[3,4],[4,5],[5,6],[3,7]] },
  { id:"ikizler", n:"İkizler", m:[1,2,3,4],      /* Pollux, Castor, Wasat, Mekbuda, Alhena, Mebsuta, Tejat, Propus */
    s:[[7.755,28.03],[7.577,31.89],[7.335,21.98],[7.069,20.57],[6.628,16.40],[6.732,25.13],[6.383,22.51],[6.248,22.51]],
    e:[[0,2],[2,3],[3,4],[1,5],[2,5],[5,6],[6,7]] },
  { id:"aslan", n:"Aslan", m:[3,4,5,6],      /* Regulus, Eta, Algieba, Adhafera, Rasalas, Epsilon, Zosma, Denebola, Chertan */
    s:[[10.139,11.97],[10.122,16.76],[10.333,19.84],[10.278,23.77],[9.879,26.00],[9.764,23.77],[11.235,20.52],[11.818,14.57],[11.237,15.43]],
    e:[[0,1],[1,2],[2,3],[3,4],[4,5],[2,6],[6,7],[7,8],[8,0],[8,6]] },
  { id:"akrep", n:"Akrep", m:[6,7,8],      /* Graffias, Dschubba, Sigma, Antares, Tau, Epsilon, Zeta, Eta, Theta, Iota, Kappa, Shaula */
    s:[[16.090,-19.81],[16.005,-22.62],[16.353,-25.59],[16.490,-26.43],[16.598,-28.22],[16.836,-34.29],[16.900,-42.36],[17.215,-43.24],[17.622,-43.00],[17.793,-40.13],[17.708,-39.03],[17.560,-37.10]],
    e:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11]] },
  { id:"pegasus", n:"Kanatlı At", m:[9,10,11,12],      /* Büyük Kare (Markab, Scheat, Alpheratz, Algenib) ve boyun: Homam, Biham, Enif, Matar */
    s:[[23.079,15.21],[23.063,28.08],[24.140,29.09],[24.220,15.18],[22.691,10.83],[22.171,6.20],[21.736,9.88],[22.717,30.22]],
    e:[[0,1],[1,2],[2,3],[3,0],[0,4],[4,5],[5,6],[1,7]] }
].map(c => ({ ...c, p: plotStars(c.s) }));
const CONST_NAMES = CONSTELLATIONS.map(c => c.n);
const constById = id => CONSTELLATIONS.find(c => c.id === id) || null;
const constName = c => tx(c.n);
const weekStart = k => shiftDays(k, -(isoWeekday(k) - 1));
function rng(seed){ let x = (seed >>> 0) || 1; return () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296; }
const seedOf = k => Number(k.replace(/-/g, ""));
/* 1.11-1.15 haftalık takımyıldızlarının kimlikleri: 2 -> 3 göçü kayda hâlâ bu adları yazar. */
const LEGACY_SKY_IDS = ["kervan","lale","kayik","yay","kartal","nar","cinar","marti","fener","pusula","kule","tulpar","kandil","capa"];
const legacyConst = ws => ({ id: LEGACY_SKY_IDS[seedOf(ws) % LEGACY_SKY_IDS.length] });

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

/* Bir takvim haftası (Pzt-Paz): tam günler. Yalnız 2 -> 3 göçü (eski haftalık adlar) kullanır. */
function weekInfo(ws){
  const t = today();
  const days = Array.from({ length:7 }, (_, i) => shiftDays(ws, i));
  const lit = days.map(k => k <= t && fullDay(k));
  const n = lit.filter(Boolean).length;
  return { days, lit, n, done: n >= 5 };
}

/* Yeni takımyıldız: başladığı ayın akşam gökyüzündekilerden; önce en az kazanılan, bir önceki tekrar etmez.
   Seçim yalnız başlangıç ayından ve kazanılanlardan gelir, aynı girdi aynı sonucu verir. */
function pickConst(start, earned, avoid){
  const month = Number(start.slice(5, 7));
  let pool = CONSTELLATIONS.filter(c => c.m.includes(month));
  const cnt = c => (earned[c.id] || []).length;
  const min = Math.min(...pool.map(cnt));
  pool = pool.filter(c => cnt(c) === min);
  if (pool.length > 1 && avoid) pool = pool.filter(c => c.id !== avoid);
  return pool[(Number(start.slice(0, 4)) * 12 + month) % pool.length];
}

/* Bugüne kadarki bütün tam günler, tarih sırasıyla takımyıldızlara bölünür.
   Dönen: [{ c, days (yanan günler), n, done, start, end }]; sonuncusu bitmemiş (boş olabilir) olandır. */
function skyRuns(){
  const t = today();
  const days = Object.keys(state.days).filter(k => k <= t && fullDay(k)).sort();
  const runs = [], earned = {};
  let i = 0, prev = null;
  for (;;){
    const start = days[i] || t, c = pickConst(start, earned, prev);
    const take = days.slice(i, i + c.p.length), done = take.length === c.p.length;
    const run = { c, days: take, n: take.length, done, start: take[0] || start, end: done ? take[take.length - 1] : null };
    runs.push(run);
    if (!done) return runs;
    (earned[c.id] = earned[c.id] || []).push(run);
    prev = c.id; i += c.p.length;
  }
}
/* Ekranda gösterilen takımyıldız: devam eden; bugün biri tamamlandıysa yeni başlayana geçmeden o gün kalır. */
function skyNow(){
  const runs = skyRuns(), cur = runs[runs.length - 1], prev = runs[runs.length - 2];
  return cur.n === 0 && prev && prev.end === today() ? prev : cur;
}
/* Kazanılan takımyıldızlar: { kimlik: [tamamlanan seriler] } */
function skyEarned(){
  const out = {};
  for (const r of skyRuns()) if (r.done) (out[r.c.id] = out[r.c.id] || []).push(r);
  return out;
}
/* Yıldızların parlaklığı (0..1; yanan 1, bugünün yarım kalan yıldızı oranı, ardından halka). */
function runLv(R){
  const t = today(), N = R.c.p.length;
  const lv = Array.from({ length: N }, (_, i) => i < R.n ? 1 : null);
  if (R.n < N && !R.days.includes(t)){ const r = dayRatio(t); lv[R.n] = r ? clamp(r, 0, 0.99) : 0; }
  return lv;
}
/* Bugünün yıldızının sırası: yandıysa onunki, yanmadıysa sıradaki. */
function runToday(R){
  const i = R.days.indexOf(today());
  return i >= 0 ? i : R.n < R.c.p.length ? R.n : -1;
}

const STAR_D = "M0-6.5 1.6-1.6 6.5 0 1.6 1.6 0 6.5-1.6 1.6-6.5 0-1.6-1.6Z";
const fillLv = (c, v) => Array(c.p.length).fill(v);

/* Takımyıldızın çizimi. lv: yıldızların parlaklığı (null henüz yanmamış).
   o: { mini, anim (kendini çizer), today (bugünün yıldız sırası), glint (kısa an yansıyan yıldızın sırası), seed } */
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
  /* Küçük çizimde (şerit, atlas) yıldızlar büyür ki küçültülünce de seçilsin. */
  const z = o.mini ? 2 : 1;
  const stars = c.p.map(([x, y], i) => {
    const v = lv[i], d = o.anim ? ` style="--d:${(i * 0.16).toFixed(2)}s"` : "";
    const ring = o.today === i ? `<circle cx="${x}" cy="${y}" r="${10 * (o.mini ? 1.3 : 1)}" class="sk-today"/>` : "";
    if (v === null || v === undefined) return `${ring}<circle cx="${x}" cy="${y}" r="${2.6 * (o.mini ? 1.4 : 1)}" class="sk-f"/>`;
    if (v <= 0) return `${ring}<circle cx="${x}" cy="${y}" r="${2.4 * z}" class="sk-d"${d}/>`;
    const full = v >= 1;
    return `${ring}<g class="sk-s${full ? " on" : ""}" transform="translate(${x} ${y})"${d}>
      ${full ? `<circle r="${12 * z}" class="sk-glow"/>` : ""}${full && o.glint === i ? `<circle r="${14 * z}" class="sk-flash"/>` : ""}
      <path d="${STAR_D}" transform="scale(${full ? 1.15 * z : (0.6 + 0.35 * v).toFixed(2)})" opacity="${full ? 1 : (0.3 + 0.5 * v).toFixed(2)}"/></g>`;
  }).join("");
  return `<svg class="sky-svg${o.anim ? " sk-anim" : ""}" viewBox="0 0 ${SKY_W} ${SKY_H}" aria-hidden="true">${dust}${lines}${stars}</svg>`;
}

const skyPct = (x, w) => (x / w * 100).toFixed(2) + "%";
const dayPct = v => Math.round(v >= 1 ? 100 : v * 100);

/* Bugün ekranının en üstündeki şerit: devam eden takımyıldız (~68 px) ve altında son yedi gün (bugün sağda).
   Şekle dokununca tam şema açılır (openSky); her günün harfi ayrı düğme, dokununca günün hedefleri açılır.
   Gün tamamlanınca (önceki çizimde tamam değildi, şimdi tamam) bugünün yıldızı kısa bir an yansır:
   skyStrip.buzz, wireToday'de haptic. */
const _starPrev = { k: null, lit: false };
function skyStrip(){
  const t = today(), R = skyNow(), N = R.c.p.length, lit = fullDay(t);
  const glint = _starPrev.k === t && !_starPrev.lit && lit;
  _starPrev.k = t; _starPrev.lit = lit;
  if (glint) skyStrip.buzz = true;
  const ti = runToday(R);
  const days = Array.from({ length: 7 }, (_, i) => shiftDays(t, i - 6));
  const chips = days.map(k => {
    const wd = isoWeekday(k), r = fullDay(k) ? 1 : dayRatio(k);
    const label = `${WD_NAMES[wd]}: ${tx("yüzde {0}", [dayPct(r || 0)])}`;
    return `<button class="wk-day${k === t ? " now" : ""}${fullDay(k) ? " on" : ""}" data-sky-day="${k}" aria-label="${esc(label)}"><i aria-hidden="true">${[...WD_SHORT[wd]][0].toUpperCase()}</i></button>`;
  }).join("");
  const label = `${constName(R.c)}, ${tx("{0}/{1} yıldız", [R.n, N])}`;
  return `<div class="wk-sky">
    <button class="wk-fig" id="wk-open" aria-haspopup="dialog" aria-label="${esc(label)}">${skySVG(R.c, runLv(R), { mini: true, today: ti, glint: glint ? ti : -1, seed: seedOf(R.start) })}
      <span class="wk-n num" aria-hidden="true">${constName(R.c)} · ${R.n}/${N}</span></button>
    <div class="wk-d" role="group" aria-label="${tx("Son 7 gün")}">${chips}</div>
  </div>`;
}

/* Tam şema: devam eden takımyıldızın büyük hali (yanan yıldıza dokununca o günün hedefleri), seri, ilerleme satırı ve atlas. */
function openSky(){
  const t = today(), R = skyNow(), c = R.c, N = c.p.length, name = constName(c);
  const lv = runLv(R), ti = runToday(R);
  /* Düğme boyutu en yakın komşuya göre: sıkışık yıldızlar (Orion kemeri) üst üste binmesin. */
  const near = i => Math.min(...c.p.map((q, j) => j === i ? 1e9 : Math.hypot(q[0] - c.p[i][0], q[1] - c.p[i][1])));
  const btns = c.p.map(([x, y], i) => {
    const k = i < R.n ? R.days[i] : i === R.n && !R.days.includes(t) ? t : null;
    if (!k) return "";
    const w = (clamp(near(i) * 0.9, 20, 46) / SKY_W * 100);
    const label = `${prettyDate(k)} · ${weekdayName(k)}`;
    return `<button class="sky-b" data-sky-day="${k}" style="left:${skyPct(x, SKY_W)};top:${skyPct(y, SKY_H)};width:${w.toFixed(2)}%;margin:-${(w / 2).toFixed(2)}% 0 0 -${(w / 2).toFixed(2)}%" aria-label="${esc(label)}"></button>`;
  }).join("");
  const left = N - R.n;
  const { el } = skySheet("sw", `${sheetHead("sw", name)}
    <div class="sky-pan sw-pan">
      <div class="sky-head">
        <div><div class="sky-s">${tx("{0}/{1} yıldız", [R.n, N])}</div></div>
        <div class="sky-n"><b class="num">${streakNow()}</b><span>${tx("günlük seri")}</span></div>
      </div>
      <div class="sky-stage" role="group" aria-label="${tx("Takımyıldızı")}">${skySVG(c, lv, { today: ti, seed: seedOf(R.start) })}${btns}</div>
      ${left > 0 ? `<div class="sky-note">${left === 1 ? tx("Bir yıldız daha, {0} belirecek", [name]) : tx("{0} yıldız daha, {1} belirecek", [left, name])}</div>`
        : `<div class="sky-note">${tx("{0} belirdi", [name])}</div>`}
    </div>
    ${skyAtlas()}`);
  wireSkyIn(el);
  el.querySelector(".sheet-x").focus();
  return el;
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
  el.dataset.sky = id;
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
  const { el } = skySheet("sd", `${sheetHead("sd", `${prettyDate(k)} · ${weekdayName(k)}`)}
    ${items.length ? `<ul class="sd-l">${items.map(x => `<li class="${x.ok ? "ok" : ""}">${icon(x.ok ? "star4" : "next")}<span>${esc(x.t)}</span><i>${x.ok ? tx("tamam") : tx("eksik")}</i></li>`).join("")}</ul>`
      : `<div class="empty">${tx("Hedef yok")}</div>`}
    <button id="sd-go" style="margin-top:14px">${tx("O güne git")}</button>`);
  /* tam şemadan açıldıysa o da kapanır: gün ekranı açık kalan pencerenin arkasında kalmasın */
  el.querySelector("#sd-go").onclick = () => { document.querySelectorAll(".sheet-bg[data-sky]").forEach(sheetOut); goToDay(k); };
  el.querySelector("#sd-go").focus();
}

function goToDay(k){
  resetMealUI();
  if (k !== today()) ensureDay(k);
  viewDate = k === today() ? null : k;
  tab = "today";
  saveState(state); render(); window.scrollTo(0, 0);
}

const rangeLabel = (a, b) => {
  const fmt = k => new Date(k + "T12:00:00").toLocaleDateString(locale(), { day:"numeric", month:"short" });
  return a === b ? fmt(a) : `${fmt(a)} – ${fmt(b)}`;
};

/* ---- gökyüzü atlası (tam şemanın altında) ---- */
function skyAtlas(){
  const earned = skyEarned();
  const got = CONSTELLATIONS.filter(c => earned[c.id]).length;
  return `<div class="sw-atlas">
    <h2>${tx("Gökyüzü atlası")} <span class="count num">${got} / ${CONSTELLATIONS.length}</span></h2>
    <div class="atlas">${CONSTELLATIONS.map(c => {
      const n = (earned[c.id] || []).length;
      return `<button class="atl${n ? " on" : ""}" data-atlas="${c.id}" aria-label="${n ? tx("{0}, {1} kez kazanıldı", [constName(c), n]) : tx("{0}, henüz kazanılmadı", [constName(c)])}">
        ${skySVG(c, fillLv(c, n ? 1 : 0), { mini: true })}
        <b>${constName(c)}</b>${n ? `<i class="num" aria-hidden="true">${n}</i>` : ""}</button>`;
    }).join("")}</div>
  </div>`;
}

function openAtlas(id){
  const c = constById(id);
  if (!c) return;
  const runs = skyEarned()[id] || [];
  skySheet("at", `${sheetHead("at", constName(c))}
    <div class="sky-pan">${skySVG(c, fillLv(c, runs.length ? 1 : 0))}</div>
    ${runs.length ? `<ul class="at-l">${runs.slice().reverse().map(r => `<li><span>${rangeLabel(r.start, r.end)}</span><b class="num">${tx("{0}/{1} yıldız", [r.n, c.p.length])}</b></li>`).join("")}</ul>`
      : `<div class="empty">${tx("Henüz kazanılmadı.")}</div>`}`);
}

/* ---- takımyıldız tamamlanınca ----
   Tamamlandıktan sonraki ilk açılışta bir kez: takımyıldız kendini çizer. Gösterilen serinin son günü
   state.skyClosed'a yazılır (eski kayıttaki hafta başı tarihleri de aynı karşılaştırmayla geçer).
   İki haftadan eski bir tamamlanma sessizce işaretlenir. */
function skyCloseDue(){
  if (!state || !state.profile || !state.days) return null;
  const done = skyRuns().filter(r => r.done), r = done[done.length - 1];
  return r && !(state.skyClosed && state.skyClosed >= r.end) ? r : null;
}
function maybeShowSkyClose(){
  const r = skyCloseDue();
  if (!r) return false;
  state.skyClosed = r.end;
  saveState(state);
  if (r.end < shiftDays(today(), -14)) return false;
  const name = constName(r.c), N = r.c.p.length;
  const line = [tx("{0}/{1} yıldız", [N, N]), rangeLabel(r.start, r.end), tx("{0} antrenman", [r.days.filter(liftMark).length])].join(" · ");
  const { el, close } = skySheet("wc", `${sheetHead("wc", tx("{0} belirdi", [name]))}
    <div class="sky-pan" role="img" aria-label="${esc(line)}">${skySVG(r.c, fillLv(r.c, 1), { anim: !reduceMotion(), seed: seedOf(r.start) })}</div>
    <div class="wc-line num">${line}</div>
    <button data-close style="margin-top:14px">${tx("Tamam")}</button>`);
  el.querySelector("[data-close]").onclick = close;
  el.querySelector("[data-close]").focus();
  return true;
}

/* Şeride dokununca tam şema; günlerin harfleri günün hedeflerini, atlas kartları takımyıldızı açar. */
function wireSky(){
  const b = document.getElementById("wk-open");
  if (b) b.onclick = () => openSky();
  const s = document.querySelector(".wk-sky");
  if (s) wireSkyIn(s);
}
function wireSkyIn(root){
  root.querySelectorAll("[data-sky-day]").forEach(b => b.onclick = () => {
    if (b.getAttribute("aria-disabled") === "true") return;
    openSkyDay(b.dataset.skyDay);
  });
  root.querySelectorAll("[data-atlas]").forEach(b => b.onclick = () => openAtlas(b.dataset.atlas));
}
