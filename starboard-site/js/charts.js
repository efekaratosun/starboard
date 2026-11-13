"use strict";

/* ---- grafik ---- */
/* ---- grafik ----
   Trend ölçümleri (kilo, yağ, bel) dolgulu alan; günlük miktarlar (kalori, uyku)
   sıfırdan büyüyen çubuk. Sağlıklı aralık arkada yumuşak bir bant olarak durur;
   değerler grafiğe dokununca baloncukta, son değer ise her zaman etiketli. */
const CHARTS = {};
let chartSeq = 0;

/* Eksen işaretleri yuvarlak sayılara otursun: 1 / 2 / 2,5 / 5 / 10 adımları. */
function niceTicks(lo, hi, n){
  const span = hi - lo;
  if (!(span > 0)) return [lo];
  const mag = Math.pow(10, Math.floor(Math.log10(span / n)));
  const u = (span / n) / mag;
  const step = (u <= 1 ? 1 : u <= 2 ? 2 : u <= 2.5 ? 2.5 : u <= 5 ? 5 : 10) * mag;
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-6; v += step) out.push(+v.toFixed(6));
  return out.length ? out : [lo];
}

/* Catmull-Rom → kübik Bezier; gerginlik düşük tutulur ki eğri veriyi aşmasın. */
function smoothPath(pts){
  if (pts.length < 3) return pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++){
    const p0 = pts[i-1] || pts[i], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2] || p2, t = 0.18;
    d += ` C${(p1[0] + (p2[0]-p0[0])*t).toFixed(1)} ${(p1[1] + (p2[1]-p0[1])*t).toFixed(1)}`
       + ` ${(p2[0] - (p3[0]-p1[0])*t).toFixed(1)} ${(p2[1] - (p3[1]-p1[1])*t).toFixed(1)}`
       + ` ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

const chFmt = (v, dec) => fmtN(+v.toFixed(dec ?? 0));

/* Çubuk: veri ucu 4px yuvarlak, taban çizgisinde köşeli. */
function barPath(x0, y0, w, h, r){
  r = Math.min(r, w/2, h);
  return `M${x0.toFixed(1)} ${(y0+h).toFixed(1)} L${x0.toFixed(1)} ${(y0+r).toFixed(1)}`
    + ` Q${x0.toFixed(1)} ${y0.toFixed(1)} ${(x0+r).toFixed(1)} ${y0.toFixed(1)}`
    + ` L${(x0+w-r).toFixed(1)} ${y0.toFixed(1)} Q${(x0+w).toFixed(1)} ${y0.toFixed(1)} ${(x0+w).toFixed(1)} ${(y0+r).toFixed(1)}`
    + ` L${(x0+w).toFixed(1)} ${(y0+h).toFixed(1)} Z`;
}

function trendChart(series, o){
  o = o || {};
  const dec = o.dec ?? 0, unit = o.unit || "";
  if (series.length < 2)
    return `<div class="empty">${tx("Grafik için en az iki günlük veri gerekiyor. Şu an {0} kayıt var.", [(series.length)])}</div>`;

  const W = 320, H = 168, L = 34, R = 10, T = 16, B = 24;
  const bar = o.kind === "bar";
  const id = "ch" + (++chartSeq);
  const vals = series.map(s => s.v);
  const band = (o.band && o.band[1] > o.band[0]) ? o.band : null;

  /* Çubukta taban sıfır (uzunluk miktarı temsil eder); çizgide aralık veriden gelir. */
  let lo, hi;
  if (bar){
    lo = 0;
    hi = Math.max(...vals, band ? band[1] : 0) * 1.18 || 1;
  } else {
    lo = Math.min(...vals); hi = Math.max(...vals);
    const sp = (hi - lo) || Math.max(1, Math.abs(hi) * 0.08);
    lo -= sp * 0.2; hi += sp * 0.2;
  }
  const y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const yc = v => clamp(y(v), T, H - B);
  const n = series.length;
  const x = i => n === 1 ? (L + W - R) / 2
    : bar ? L + (W - L - R) * ((i + 0.5) / n)
          : L + (W - L - R) * (i / (n - 1));

  /* Sağlıklı aralık: arkada yumuşak bant, çizgi yok. Bant görünür alanın
     neredeyse tamamını kaplıyorsa çizilmez; zemini boyamaktan başka iş görmez. */
  const bh = band ? yc(band[0]) - yc(band[1]) : 0;
  const bandOn = !!band && band[0] < hi && band[1] > lo && bh > 3 && bh < (H - T - B) * 0.88;
  const bandRect = bandOn
    ? `<rect class="ch-band" x="${L}" y="${yc(band[1]).toFixed(1)}" width="${(W-L-R).toFixed(1)}"
        height="${bh.toFixed(1)}" rx="4"/>` : "";

  const ticks = niceTicks(lo, hi, 3).filter(t => y(t) >= T - 0.5 && y(t) <= H - B + 0.5);
  const grid = ticks.map(t => `<line class="ch-grid" x1="${L}" y1="${y(t).toFixed(1)}" x2="${W-R}" y2="${y(t).toFixed(1)}"/>
    <text class="ch-lbl" x="${L-6}" y="${(y(t)+3.4).toFixed(1)}" text-anchor="end">${chFmt(t, dec)}</text>`).join("");

  const pts = series.map((s, i) => [x(i), y(s.v)]);
  const last = series[n-1];

  let marks = "";
  if (bar){
    /* çubuklar: 24px'i geçmez, komşuyla arasında 2px yüzey boşluğu, ucu 4px yuvarlak */
    const slot = (W - L - R) / n;
    const w = Math.max(2, Math.min(22, slot * 0.66));
    marks = series.map((s, i) => {
      const h = Math.max(2, (H - B) - y(s.v));
      return `<path class="ch-bar" data-i="${i}" style="--i:${i}" d="${barPath(x(i) - w/2, y(s.v), w, h, 4)}"/>`;
    }).join("");
  } else {
    const line = smoothPath(pts);
    const area = `${line} L${pts[n-1][0].toFixed(1)} ${H-B} L${pts[0][0].toFixed(1)} ${H-B} Z`;
    let avg = "";
    if (o.average && n >= 4){
      const ap = series.map((s, i) => {
        const win = series.slice(Math.max(0, i-6), i+1).map(z => z.v);
        return [x(i), y(win.reduce((a,b) => a+b, 0) / win.length)];
      });
      avg = `<path class="ch-avg" d="${smoothPath(ap)}"/>`;
    }
    marks = `<defs><linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="currentColor" stop-opacity=".26"/>
        <stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
      <path class="ch-area" d="${area}" fill="url(#${id}-g)"/>${avg}
      <path class="ch-line" pathLength="1" d="${line}"/>
      <circle class="ch-end" cx="${pts[n-1][0].toFixed(1)}" cy="${pts[n-1][1].toFixed(1)}" r="4.5"/>`;
  }

  /* Son değer her zaman yazılı: değer okumak dokunmaya bağlı kalmasın.
     Çizgi sona doğru iniyorsa etiket noktanın altına geçer ki çizgiyi kesmesin. */
  const falling = !bar && n > 1 && pts[n-1][1] > pts[n-2][1] + 0.5;
  const ey = bar ? T + 9 : clamp(pts[n-1][1] + (falling ? 15 : -11), T + 9, H - B - 5);
  const endLabel = `<text class="ch-end-t" x="${W-R}" y="${ey.toFixed(1)}" text-anchor="end">${chFmt(last.v, dec)}${unit ? " " + unit : ""}</text>`;

  CHARTS[id] = { xs: series.map((s, i) => x(i)), ys: series.map(s => bar ? y(s.v) : y(s.v)),
    ks: series.map(s => s.k), vs: vals, dec, unit, W, H, T, B, L, R, bar };

  return `<div class="ch-wrap" data-ch="${id}" data-c="${o.color || "weight"}">
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img"
      aria-label="${esc(o.label || "trend")}: ${chFmt(series[0].v, dec)} → ${chFmt(last.v, dec)} ${esc(unit)}">
      ${bandRect}${grid}${marks}
      <g class="ch-cur" hidden><line x1="0" y1="${T}" x2="0" y2="${H-B}"/><circle r="4.5" cx="0" cy="0"/></g>
      ${endLabel}
      <text class="ch-lbl" x="${L}" y="${H-7}">${prettyDate(series[0].k)}</text>
      <text class="ch-lbl" x="${W-R}" y="${H-7}" text-anchor="end">${prettyDate(last.k)}</text>
      <rect class="ch-hit" x="0" y="0" width="${W}" height="${H}" tabindex="0"
        aria-label="${tx("{0} grafiği; sağ ve sol okla günler arasında gezin", [(esc(o.label || tx("trend")))])}"/>
    </svg>
    <div class="ch-tip" hidden><b></b><span></span></div>
  </div>`;
}

function bandNote(txt){
  return `<div class="ch-key"><i></i>${txt}</div>`;
}

function wireCharts(){
  app.querySelectorAll(".ch-wrap[data-ch]").forEach(wrap => {
    const c = CHARTS[wrap.dataset.ch];
    if (!c) return;
    const svg = wrap.querySelector("svg"), tip = wrap.querySelector(".ch-tip");
    const cur = wrap.querySelector(".ch-cur");
    const line = cur.querySelector("line"), dot = cur.querySelector("circle");
    const bars = wrap.querySelectorAll(".ch-bar");
    let at = -1;

    const show = i => {
      if (i < 0 || i >= c.xs.length) return;
      at = i;
      const r = svg.getBoundingClientRect();
      const px = c.xs[i] / c.W * r.width;
      if (c.bar){
        bars.forEach((b, j) => b.classList.toggle("on", j === i));
        cur.hidden = true;
      } else {
        line.setAttribute("x1", c.xs[i]); line.setAttribute("x2", c.xs[i]);
        dot.setAttribute("cx", c.xs[i]); dot.setAttribute("cy", c.ys[i]);
        cur.hidden = false;
      }
      tip.firstChild.textContent = chFmt(c.vs[i], c.dec) + (c.unit ? " " + c.unit : "");
      tip.lastChild.textContent = prettyDate(c.ks[i]);
      tip.hidden = false;
      const w = tip.offsetWidth || 90;
      tip.style.left = clamp(px - w/2, 2, Math.max(2, r.width - w - 2)) + "px";
      tip.style.top = Math.max(0, c.ys[i] / c.H * r.height - tip.offsetHeight - 15) + "px";
    };
    const hide = () => { at = -1; tip.hidden = true; cur.hidden = true; bars.forEach(b => b.classList.remove("on")); };
    const nearest = ev => {
      const r = svg.getBoundingClientRect();
      const ux = (ev.clientX - r.left) / r.width * c.W;
      let best = 0;
      for (let i = 1; i < c.xs.length; i++) if (Math.abs(c.xs[i] - ux) < Math.abs(c.xs[best] - ux)) best = i;
      return best;
    };
    svg.onpointermove = ev => { ev.preventDefault(); show(nearest(ev)); };
    svg.onpointerdown = ev => { ev.preventDefault(); show(nearest(ev)); };
    svg.onpointerleave = hide;
    svg.onpointercancel = hide;
    const hit = wrap.querySelector(".ch-hit");
    hit.onfocus = () => show(at < 0 ? c.xs.length - 1 : at);
    hit.onblur = hide;
    hit.onkeydown = ev => {
      const d = { ArrowRight:1, ArrowLeft:-1 }[ev.key];
      if (!d) { if (ev.key === "Escape") hide(); return; }
      ev.preventDefault();
      show(clamp((at < 0 ? c.xs.length - 1 : at) + d, 0, c.xs.length - 1));
    };
  });
}

/* Bir alanın son 'days' günlük serisi: [{ k: tarih, v: değer }]. src ve t verilmezse geçerli kayıt ve bugün. */
function seriesOf(field, days, src, t){
  src = src || state.days; t = t || today();
  const from = shiftDays(t, -days);
  return Object.keys(src).sort()
    .filter(k => k > from && k <= t && typeof src[k][field] === "number")
    .map(k => ({ k, v: src[k][field] }));
}

function bodySeries(field, days, src, t){
  src = src || state.days; t = t || today();
  const from = shiftDays(t, -days);
  return Object.keys(src).sort()
    .filter(k => k > from && k <= t && src[k].body && typeof src[k].body[field] === "number")
    .map(k => ({ k, v: src[k].body[field] }));
}

/* ---- grafik verisi ----
   Hesap ve ekran ayrıdır: chartData() seriler, sağlıklı aralıklar ve farkları döndürür;
   değerler metriktir, metin, birim ya da HTML içermez. chartsView() bunları çizer.
   Sağlıklı aralıklar: kilo BMI 18,5–24,9; kalori hedefin ±%10'u; uyku kişinin hedefi;
   yağ oranı ACE'nin fit–ortalama bandı (fat.ace: [atletik, fit, ortalama, üst]). */
function chartData(days, profile, program, sleepRange, t){
  const h = profile.height / 100;
  const diff = s => s.length >= 2 ? s[s.length-1].v - s[0].v : null;
  const w = seriesOf("weight", 60, days, t), yag = bodySeries("yag", 365, days, t), bel = bodySeries("bel", 120, days, t);
  const ace = profile.sex === "female" ? [14,21,25,32] : profile.sex === "male" ? [6,14,18,25] : [10,17.5,21.5,28.5];
  const last = yag.length ? yag[yag.length-1].v : null;
  return {
    weight: { series: w, delta: diff(w), band: h > 0 ? [18.5*h*h, 24.9*h*h] : null },
    kcal:   { series: seriesOf("kcal", 21, days, t), band: program ? [program.kcal*0.9, program.kcal*1.1] : null },
    sleep:  { series: seriesOf("sleep", 21, days, t), band: sleepRange },
    fat:    { series: yag, delta: diff(yag), ace, band: [ace[1], ace[3]],
              pos: last === null ? null : last < ace[1] ? "below" : last > ace[3] ? "above" : "inside" },
    waist:  { series: bel, delta: diff(bel) }
  };
}

/* Beslenme günlüğünün son 7 günü; hesap nutritionWeek() (widgets.js). */
function nutritionCard(program){
  const N = nutritionWeek(state.days, program, today());
  if (!N) return "";
  /* Besin adı o anki dilde: kayıttaki ad, eklendiği dilde yazılmış olabilir. */
  const nm = x => x.k && FOODS[x.k] ? FOODS[x.k].n : x.n;
  const row = (l, v) => `<div class="macro"><span class="lbl">${l}</span><span class="v num">${v}</span></div>`;
  return `<section>
    <h2>${tx("Beslenme")} <span class="count">${tx("son 7 günde {0} gün kayıt", [(N.days)])}</span></h2>
    ${macroRow(tx("Kalori"), N.kcal, program.kcal, "", "grain", "band")}
    ${macroRow(tx("Protein"), N.p, program.protein, " g", "poultry", "mp")}
    ${macroRow(tx("Karbonhidrat"), N.c, program.carb, " g", "bread", "mc")}
    ${macroRow(tx("Yağ"), N.f, program.fat, " g", "oil", "mf")}
    ${macroRow(tx("Lif"), N.lif, N.fiberTarget, " g", "veg", "ml")}
    <div class="metric-note" style="margin:10px 0 6px">${tx("Kayıt girilen günlerin ortalaması.")}</div>
    ${row(tx("Protein hedefi tutan gün"), `${N.proteinDays}/${N.days}`)}
    ${row(tx("Lif hedefi tutan gün"), `${N.fiberDays}/${N.days}`)}
    <div class="metric-note" style="margin:14px 0 6px">${tx("En sık eklediklerin")}</div>
    ${N.top.map(x => row(esc(nm(x)), tx("{0} kez", [(x.times)]))).join("")}
  </section>`;
}

function chartsView(){
  chartSeq = 0;
  for (const k of Object.keys(CHARTS)) delete CHARTS[k];
  const D = chartData(state.days, state.profile, currentProgram(), sleepBand(), today());
  const w = D.weight.series, kcal = D.kcal.series, sleep = D.sleep.series, yag = D.fat.series, bel = D.waist.series;
  const wBand = D.weight.band, kBand = D.kcal.band, fT = D.fat.ace;

  const card = (title, count, chart, note) => `<section>
    <h2>${title}${count ? ` <span class="count">${count}</span>` : ""}</h2>
    ${chart}${note || ""}
  </section>`;

  return `
  ${weeklySummary()}
  ${nutritionCard(currentProgram())}
  ${prBoard()}
  ${card(tx("Kilo"), D.weight.delta !== null ? `${D.weight.delta>0?"+":""}${fmtN(+wOut(D.weight.delta).toFixed(1))} ${wUnit()}` : "",
    trendChart(w.map(x => ({ ...x, v:wOut(x.v) })), { color:"weight", dec:1, unit:wUnit(), average:true, band:wBand && wBand.map(wOut), label:tx("kilo trendi") }),
    w.length >= 2 ? bandNote(tx("Bant sağlıklı kilo aralığın{0}. Kesikli çizgi 7 günlük ortalama: günlük dalgalanma su ve glikojenden gelir, asıl yön ortalamada görünür.", [(wBand ? ` (${Math.round(wOut(wBand[0]))}–${fmtW0(wBand[1])})` : "")])) : "")}
  ${card(tx("Kalori"), tx("son {0} gün", [(kcal.length)]),
    trendChart(kcal, { color:"kcal", kind:"bar", unit:"kcal", band:kBand, label:tx("günlük kalori") }),
    kcal.length >= 2 && kBand ? bandNote(tx("Bant hedefin ±%10'u: {0}–{1} kcal.", [(Math.round(kBand[0])), (Math.round(kBand[1]))])) : "")}
  ${card(tx("Uyku"), tx("son {0} gün", [(sleep.length)]),
    trendChart(sleep, { color:"sleep", kind:"bar", dec:1, unit:tx("sa"), band:D.sleep.band, label:tx("günlük uyku") }),
    sleep.length >= 2 ? bandNote(tx("Bant senin uyku hedefin: {0}–{1} saat.", [(D.sleep.band[0]), (D.sleep.band[1])])) : "")}
  ${card(tx("Yağ oranı"), D.fat.delta !== null ? `${D.fat.delta > 0 ? "+" : ""}${fmtN(+D.fat.delta.toFixed(1))} ${tx("puan")}` : "",
    yag.length >= 2 ? trendChart(yag, { color:"fat", dec:1, unit:"%", band:D.fat.band, label:tx("yağ oranı") })
      : `<div class="empty">${tx("Yağ oranını girdikçe grafik oluşur.{0}", [(yag.length ? tx(" Şu an 1 ölçüm var.") : "")])}</div>`,
    yag.length >= 2 ? bandNote(tx("Fit–ortalama aralığı %{0}–{1} (ACE); {2}. Ev tartılarının ölçümü günden güne birkaç puan oynar; haftada bir, aynı saatte ölç.", [(fmtN(fT[1])), (fmtN(fT[3])), ({ inside:tx("şu an bu aralıktasın"), below:tx("şu an bu aralığın altındasın"), above:tx("şu an bu aralığın üstündesin") }[D.fat.pos])])) : "")}
  ${bel.length >= 2 ? card(tx("Bel çevresi"), `${fmtN(+(+lOut(D.waist.delta)).toFixed(1))} ${lUnit()}`,
    trendChart(bel.map(x => ({ ...x, v:lOut(x.v) })), { color:"waist", dec:1, unit:lUnit(), label:tx("bel çevresi") })) : ""}`;
}
