"use strict";

/* ---- vücut ölçüleri ---- */
const BODY = [["bel","Bel"],["gogus","Göğüs"],["kalca","Kalça"],["kol","Kol"],["bacak","Bacak"]];

function bodySection(entry){
  const b = entry.body || {};
  const filled = BODY.filter(([k]) => typeof b[k] === "number").length;
  return `<section><h2>Vücut ölçüleri <span class="count">${filled ? `${filled}/${BODY.length} · cm` : "cm"}</span></h2>
    <div class="entry">
      <div class="entry-main" style="display:flex;align-items:center;gap:12px">
        <label for="bd-yag" style="flex:1;margin:0">Yağ oranı (%)</label>
        <input id="bd-yag" type="number" inputmode="decimal" value="${typeof b.yag==="number"?b.yag:""}" placeholder="${state.profile.bodyFat ?? "—"}" style="flex:0 0 100px">
      </div></div>
    ${BODY.map(([k,l]) => `<div class="entry">
      <div class="entry-main" style="display:flex;align-items:center;gap:12px">
        <label for="bd-${k}" style="flex:1;margin:0">${l}</label>
        <input id="bd-${k}" type="number" inputmode="decimal" value="${typeof b[k]==="number"?b[k]:""}" placeholder="—" style="flex:0 0 100px">
      </div></div>`).join("")}
    <div class="metric-note" style="margin-top:10px">Haftada bir, sabah aç karnına ölç.</div></section>`;
}

/* ---- haftalık özet ---- */
function weeklySummary(){
  const program = currentProgram();
  const t = today();
  const keys = Object.keys(state.days).filter(k => k > shiftDays(t,-7) && k <= t).sort();
  if (!keys.length || !program) return "";

  const kcals = keys.map(k => state.days[k].kcal).filter(v => typeof v === "number");
  const avg = kcals.length ? Math.round(kcals.reduce((a,b)=>a+b,0)/kcals.length) : null;
  const inBand = kcals.filter(v => v >= program.kcal*0.9 && v <= program.kcal*1.1).length;

  let tDone = 0, tAll = 0;
  for (const k of keys){ const ts = state.days[k].tasks || []; tAll += ts.length; tDone += ts.filter(x=>x.done).length; }

  const cur = avgWeights(state, shiftDays(t,-7), t);
  const prev = avgWeights(state, shiftDays(t,-14), shiftDays(t,-7));
  const wch = (cur.length && prev.length)
    ? (cur.reduce((a,b)=>a+b,0)/cur.length) - (prev.reduce((a,b)=>a+b,0)/prev.length) : null;

  const lifts = keys.filter(k => state.days[k].lifts && Object.values(state.days[k].lifts).some(liftHas)).length;

  const row = (l, v, note) => `<div class="macro"><span class="lbl">${l}${note?`<div class="metric-note">${note}</div>`:""}</span><span class="v num">${v}</span></div>`;

  return `<section>
    <h2>Son 7 gün</h2>
    ${row("Ortalama kalori", avg !== null ? `${avg} kcal` : "—", avg !== null ? `hedef ${program.kcal} kcal` : "kalori girilmemiş")}
    ${row("Hedef bandında gün", kcals.length ? `${inBand}/${kcals.length}` : "—", "±%10 aralığı")}
    ${row("Kilo değişimi", wch !== null ? `${wch>0?"+":""}${wch.toFixed(2)} kg` : "—", wch !== null ? "iki haftalık ortalama farkı" : "trend için daha fazla ölçüm gerekli")}
    ${row("Tamamlanan görev", tAll ? `%${Math.round(tDone/tAll*100)}` : "—", tAll ? `${tDone}/${tAll}` : "")}
    ${row("Antrenman kaydı", `${lifts} gün`, "")}
  </section>`;
}

/* ---- dışa / içe aktarma ---- */
async function exportData(statusEl){
  const payload = JSON.stringify({ app:"starboard", v:1, exportedAt:new Date().toISOString(), state }, null, 2);
  const filename = `starboard-${today()}.json`;
  const say = m => { if (statusEl) statusEl.textContent = m; };

  /* claude.ai'da yayınlandığında indirme yeteneğinden geçmesi gerekiyor;
     dosyayı doğrudan açtığında (yerel dosya, GitHub Pages) eski yol çalışır. */
  try {
    const dl = window.claude && claude.use ? await claude.use("downloads") : null;
    if (dl) {
      try {
        await dl.save({ filename, data: payload });
        say(`${filename} kaydedildi.`);
      } catch (e) {
        const c = e && e.code;
        if (c === "declined") say("İndirme iptal edildi.");
        else if (c === "rate_limited") say("Az önce bir indirme istendi, birkaç saniye sonra tekrar dene.");
        else say("Bu ortamda dosya indirilemedi.");
      }
      return;
    }
  } catch(e){ /* yetenek yok, aşağıdaki yola düş */ }

  const url = URL.createObjectURL(new Blob([payload], { type:"application/json" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  say(`${filename} indirildi.`);
}

function importData(file, statusEl){
  const rd = new FileReader();
  rd.onload = async () => {
    let data;
    try { data = JSON.parse(rd.result); }
    catch(e){ statusEl.textContent = "Dosya okunamadı: geçerli bir JSON değil."; return; }
    const incoming = data && data.state ? data.state : data;
    if (!incoming || !incoming.profile || !incoming.days){
      statusEl.textContent = "Bu dosya bu uygulamanın yedeği gibi görünmüyor."; return;
    }
    const n = Object.keys(incoming.days).length;
    if (!confirm(`${n} günlük kayıt yüklenecek ve mevcut verilerin silinecek. Devam edilsin mi?`)) return;
    state = incoming;
    state.v = 1;
    await saveState(state);
    tab = "today"; render(); window.scrollTo(0,0);
  };
  rd.onerror = () => { statusEl.textContent = "Dosya okunamadı."; };
  rd.readAsText(file);
}

/* ---- selamlama ---- */
function greetTitle(){
  const h = new Date().getHours();
  const [hi, ic] = h < 5 ? ["İyi geceler","🌙"] : h < 12 ? ["Günaydın","☀️"]
                 : h < 18 ? ["İyi günler","🌤️"] : h < 22 ? ["İyi akşamlar","🌆"] : ["İyi geceler","🌙"];
  const n = state.profile.name ? `, ${esc(state.profile.name)}` : "";
  return `${hi}${n} <span class="wave" aria-hidden="true">${ic}</span>`;
}
function greetSub(program){
  const e = state.days[today()] || { tasks:[] };
  const all = e.tasks.length, left = e.tasks.filter(t => !t.done).length;
  const kcalLeft = program && typeof e.kcal === "number" ? program.kcal - e.kcal : null;
  if (all && !left) return "Bugünkü her şeyi bitirdin, gökyüzünde bir yıldız daha yandı.";
  const parts = [];
  if (all) parts.push(`${left} görevin kaldı`);
  if (kcalLeft !== null && kcalLeft > 0) parts.push(`hedefe ${kcalLeft} kcal var`);
  return parts.length ? "Bugün " + parts.join(", ") + "." : "Güne küçük bir adımla başla.";
}

/* ---- takımyıldız ---- */
const CONST_NAMES = ["Kervan","Lale","Kayık","Yay","Kartal","Nar","Çınar","Martı","Fener","Pusula","Kule","Tulpar","Kandil","Çapa"];
const weekStart = k => shiftDays(k, -(isoWeekday(k) - 1));
function rng(seed){ let x = (seed >>> 0) || 1; return () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296; }
const seedOf = k => Number(k.replace(/-/g, ""));
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

function weekInfo(ws){
  const t = today();
  const days = Array.from({ length:7 }, (_, i) => shiftDays(ws, i));
  const lit = days.map(k => k <= t && fullDay(k));
  const n = lit.filter(Boolean).length;
  const name = n >= 5 ? CONST_NAMES[seedOf(ws) % CONST_NAMES.length] : null;
  return { days, lit, n, name };
}

function skySVG(ws, big){
  const W = 320, H = big ? 150 : 120;
  const r = rng(seedOf(ws));
  const { days, lit } = weekInfo(ws);
  const t = today();
  const pts = days.map((_, i) => [22 + i * ((W - 44) / 6) + (r() - .5) * 18, 24 + r() * (H - 48)]);
  const dust = Array.from({ length: big ? 34 : 22 }, () =>
    `<circle cx="${(r()*W).toFixed(1)}" cy="${(r()*H).toFixed(1)}" r="${(r()*0.9+0.3).toFixed(2)}" fill="var(--star-off)"/>`).join("");
  let lines = "";
  for (let i = 0; i < 6; i++){
    const [a, b] = [pts[i], pts[i+1]];
    const on = lit[i] && lit[i+1];
    lines += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"
      stroke="${on ? "var(--star)" : "var(--star-off)"}" stroke-width="${on ? 1.6 : 1}" ${on ? "" : `stroke-dasharray="2 5"`} stroke-linecap="round" opacity="${on ? .75 : .7}"/>`;
  }
  const stars = pts.map(([x, y], i) => {
    const k = days[i], on = lit[i], isT = k === t, fut = k > t;
    const label = `${WD_NAMES[isoWeekday(k)]}: ${fut ? "henüz gelmedi" : on ? "yıldız yandı" : "yanmadı"}`;
    return `<g><title>${label}</title>
      ${on ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${big ? 11 : 9}" fill="var(--star)" opacity=".18"/>` : ""}
      ${isT ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${big ? 9 : 7.5}" fill="none" stroke="var(--sky-ink)" stroke-width="1.2" stroke-dasharray="2 2.5" opacity=".8"/>` : ""}
      ${on ? `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${big ? 1 : .8})" d="M0-6.5 1.6-1.6 6.5 0 1.6 1.6 0 6.5-1.6 1.6-6.5 0-1.6-1.6Z" fill="var(--star)"/>`
           : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${fut ? 1.6 : 2.4}" fill="${fut ? "var(--star-off)" : "var(--sky-muted)"}" opacity="${fut ? 1 : .75}"/>`}
    </g>`;
  }).join("");
  return `<svg class="sky-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Haftanın takımyıldızı">${dust}${lines}${stars}</svg>`;
}

function skyCard(){
  const ws = weekStart(today());
  const w = weekInfo(ws);
  const streak = streakNow();
  return `<section class="sky">
    <div class="sky-head">
      <div><div class="sky-t">Bu haftanın takımyıldızı</div>
        <div class="sky-s">${w.name ? `“${w.name}” belirdi · ${w.n}/7 yıldız` : `${w.n}/7 yıldız`}</div></div>
      <div class="sky-n"><b class="num">${streak}</b><span>günlük seri</span></div>
    </div>
    ${skySVG(ws, true)}
    <div class="sky-note">Haftada beş yıldız takımyıldızı açar. Toplam ${starTotal()} yıldız.</div>
  </section>`;
}

function skyGallery(){
  const ws = weekStart(today());
  const weeks = Array.from({ length:6 }, (_, i) => shiftDays(ws, -7 * i));
  const fmt = k => new Date(k + "T12:00:00").toLocaleDateString(locale(), { day:"numeric", month:"short" });
  return `<section>
    <h2>Gökyüzün <span class="count">son 6 hafta</span></h2>
    <div class="sky-grid">${weeks.map(k => { const w = weekInfo(k); return `<figure class="sky-mini">
      ${skySVG(k, false)}
      <figcaption><b>${w.name ? w.name : `${w.n}/7`}</b><span>${fmt(k)} – ${fmt(shiftDays(k, 6))}</span></figcaption>
    </figure>`; }).join("")}</div>
  </section>`;
}

/* ---- su bardakları ---- */
const CUP = 250;
function cupsHTML(water, target){
  const n = Math.max(6, Math.min(14, Math.ceil((target || 2000) / CUP)));
  const full = Math.floor((water || 0) / CUP);
  return `<div class="cups" role="group" aria-label="Su bardakları, her biri ${CUP} ml">${Array.from({ length:n }, (_, i) =>
    `<button class="cup${i < full ? " on" : ""}" data-cup="${i}" aria-label="${i+1}. bardak${i < full ? ", içildi" : ""}">
      <svg viewBox="0 0 24 28" aria-hidden="true"><path class="cup-f" d="M5.4 11.5h13.2l-1.2 12.3a1.6 1.6 0 0 1-1.6 1.4H8.2a1.6 1.6 0 0 1-1.6-1.4z"/>
      <path class="cup-o" d="M4 3.5h16l-1.9 20.6a2.2 2.2 0 0 1-2.2 2H8.1a2.2 2.2 0 0 1-2.2-2z"/></svg></button>`).join("")}</div>`;
}

/* ---- uyku kaydırıcısı ---- */
const hm = m => { m = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`; };
const durTxt = m => `${Math.floor(m/60)} sa${m % 60 ? ` ${m % 60} dk` : ""}`;
function sleepTimes(entry){
  const wake = typeof entry.wake === "number" ? ((entry.wake % 1440) + 1440) % 1440 : 420;
  let bed = typeof entry.bed === "number" ? entry.bed
          : typeof entry.sleep === "number" ? wake - Math.round(entry.sleep * 60) : 1380;
  bed = ((Math.round(bed / 5) * 5) % 1440 + 1440) % 1440;
  return { bed, wake };
}
const sleepDur = (bed, wake) => ((wake - bed) % 1440 + 1440) % 1440;

/* 24 saatlik kadran: 00 üstte, 06 sağda, 12 altta, 18 solda. */
const DIAL = { c:120, r:92 };
const dialPt = (m, r = DIAL.r) => { const a = m / 1440 * 2 * Math.PI - Math.PI / 2; return [DIAL.c + r * Math.cos(a), DIAL.c + r * Math.sin(a)]; };
function dialArc(bed, wake){
  const d = sleepDur(bed, wake);
  if (d === 0) return "";
  const [x1, y1] = dialPt(bed), [x2, y2] = dialPt(wake);
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${DIAL.r} ${DIAL.r} 0 ${d > 720 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}
function sleepHTML(entry){
  const { bed, wake } = sleepTimes(entry);
  const has = typeof entry.sleep === "number";
  const ticks = Array.from({ length:24 }, (_, h) => {
    const [x1, y1] = dialPt(h * 60, 74), [x2, y2] = dialPt(h * 60, h % 6 ? 70.5 : 67);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="dial-tick${h % 6 ? "" : " big"}"/>`;
  }).join("");
  const labels = [0, 6, 12, 18].map(h => { const [x, y] = dialPt(h * 60, 58); return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" class="dial-num">${String(h).padStart(2,"0")}</text>`; }).join("");
  const handle = (id, m, icon, label) => { const [x, y] = dialPt(m); return `<g id="${id}" class="dial-h" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"
      tabindex="0" role="slider" aria-label="${label}" aria-valuetext="${hm(m)}">
      <circle r="17"/><text y="5.5" text-anchor="middle">${icon}</text></g>`; };
  const d = sleepDur(bed, wake);
  return `<div class="entry sl-entry">${iconBox("rest")}
    <div class="entry-main">
      <div class="lbl-row"><span class="lbl">Uyku</span><span class="lbl-v num">${has ? durTxt(Math.round(entry.sleep*60)) : "henüz girilmedi"}</span></div>
      <button class="sl-toggle" id="sl-toggle" aria-expanded="false" aria-controls="sl-more">
        <span>${has ? `${hm(bed)} → ${hm(wake)}` : "Saatleri gir"}</span>
        <svg class="ico" aria-hidden="true"><use href="#i-next"/></svg></button>
      <div class="sl-more" id="sl-more" hidden>
      <div class="dial-wrap">
        <svg id="sl-dial" class="dial" viewBox="0 0 240 240" role="group" aria-label="Uyku saati kadranı">
          <defs><linearGradient id="sl-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--sleep)"/><stop offset="1" stop-color="var(--water)"/></linearGradient></defs>
          <circle cx="120" cy="120" r="${DIAL.r}" class="dial-track"/>
          <path id="sl-arc" class="dial-arc" d="${dialArc(bed, wake)}"/>
          ${ticks}${labels}
          <text x="120" y="114" class="dial-dur num" id="sl-c1">${durTxt(d)}</text>
          <text x="120" y="134" class="dial-sub num" id="sl-c2">${hm(bed)} → ${hm(wake)}</text>
          ${handle("sl-h-bed", bed, "🌙", "Yatış saati")}
          ${handle("sl-h-wake", wake, "☀️", "Kalkış saati")}
        </svg>
      </div>
      <div class="dial-legend num"><span>🌙 Yattım <b id="sl-bed-v">${hm(bed)}</b></span><span>☀️ Kalktım <b id="sl-wake-v">${hm(wake)}</b></span></div>
      <div class="metric-note" style="text-align:center;margin-top:6px">Ayı ve güneşi sürükle.</div>
      </div>
    </div></div>`;
}
function wireSleep(entry){
  const tg = document.getElementById("sl-toggle"), more = document.getElementById("sl-more");
  if (tg && more) tg.onclick = () => {
    more.hidden = !more.hidden;
    tg.setAttribute("aria-expanded", String(!more.hidden));
    tg.classList.toggle("on", !more.hidden);
  };
  const svg = document.getElementById("sl-dial");
  if (!svg) return;
  let { bed, wake } = sleepTimes(entry);
  const hb = document.getElementById("sl-h-bed"), hw = document.getElementById("sl-h-wake");
  const draw = () => {
    const [bx, by] = dialPt(bed), [wx, wy] = dialPt(wake);
    hb.setAttribute("transform", `translate(${bx.toFixed(1)} ${by.toFixed(1)})`);
    hw.setAttribute("transform", `translate(${wx.toFixed(1)} ${wy.toFixed(1)})`);
    hb.setAttribute("aria-valuetext", hm(bed)); hw.setAttribute("aria-valuetext", hm(wake));
    document.getElementById("sl-arc").setAttribute("d", dialArc(bed, wake));
    document.getElementById("sl-c1").textContent = durTxt(sleepDur(bed, wake));
    document.getElementById("sl-c2").textContent = `${hm(bed)} → ${hm(wake)}`;
    document.getElementById("sl-bed-v").textContent = hm(bed);
    document.getElementById("sl-wake-v").textContent = hm(wake);
  };
  const save = async (refocus) => {
    entry.bed = bed; entry.wake = wake;
    entry.sleep = Math.round(sleepDur(bed, wake) / 60 * 100) / 100;
    await saveState(state); render();
    if (refocus) document.getElementById(refocus)?.focus();
  };
  const minuteAt = ev => {
    const r = svg.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width * 240 - DIAL.c, y = (ev.clientY - r.top) / r.height * 240 - DIAL.c;
    let a = Math.atan2(y, x) + Math.PI / 2; if (a < 0) a += 2 * Math.PI;
    return (Math.round(a / (2 * Math.PI) * 1440 / 5) * 5) % 1440;
  };
  let drag = null;
  const start = (which) => ev => { drag = which; svg.setPointerCapture(ev.pointerId); ev.preventDefault(); };
  hb.onpointerdown = start("bed"); hw.onpointerdown = start("wake");
  svg.onpointermove = ev => { if (!drag) return; const m = minuteAt(ev); if (drag === "bed") bed = m; else wake = m; draw(); };
  svg.onpointerup = svg.onpointercancel = () => { if (!drag) return; drag = null; save(); };
  const key = (which, id) => ev => {
    const d = { ArrowUp:15, ArrowRight:15, ArrowDown:-15, ArrowLeft:-15 }[ev.key];
    if (!d) return;
    ev.preventDefault();
    if (which === "bed") bed = (bed + d + 1440) % 1440; else wake = (wake + d + 1440) % 1440;
    draw(); save(id);
  };
  hb.onkeydown = key("bed", "sl-h-bed"); hw.onkeydown = key("wake", "sl-h-wake");
}

/* ---- kişisel rekorlar ---- */
const e1rm = (kg, r) => kg * (1 + r / 30);
function records(){
  const best = new Map();
  const put = (name, val, text, k, extra) => {
    const cur = best.get(name);
    if (!cur || val > cur.val) best.set(name, { name, val, text, k, ...extra });
  };
  for (const [k, d] of Object.entries(state.days)){
    for (const [name, rec] of Object.entries(d.lifts || {})){
      if (!liftHas(rec)) continue;
      if (!rec.t){                                   /* eski biçim */
        if (rec.kg) put(name, e1rm(rec.kg, rec.reps || 1), `${fmtN(rec.kg)} kg × ${rec.reps || 1}`, k, { u:"w" });
        continue;
      }
      switch (rec.t){
        case "w": {
          const sets = (rec.sets || []).filter(x => x && x.kg && x.r);
          if (!sets.length) break;
          const b = sets.reduce((a, x) => e1rm(x.kg, x.r) > e1rm(a.kg, a.r) ? x : a);
          put(name, e1rm(b.kg, b.r), `${fmtN(b.kg)} kg × ${b.r}`, k, { u:"w" });
          break;
        }
        case "wc": if (rec.kg) put(name, rec.kg * 100 + (rec.n || 0), `${fmtN(rec.kg)} kg · ${rec.n || 0} set`, k, { u:"w" }); break;
        case "r": { const m = Math.max(0, ...numsOf(rec.sets)); if (m) put(name, m, `${m} tekrar`, k, { u:"r" }); break; }
        case "t": { const m = Math.max(0, ...numsOf(rec.sets)); if (m) put(name, m, `${m} sn`, k, { u:"t" }); break; }
        case "n": if (rec.n) put(name, rec.n, `${rec.n} tur`, k, { u:"n" }); break;
        case "sw": if (rec.n) put(name, rec.n, `${rec.n} tekrar`, k, { u:"n" }); break;
        case "sd": if (rec.m) put(name, rec.m, `${rec.m} m`, k, { u:"d" }); break;
        case "c": if (rec.km) put(name, rec.km, `${fmtN(rec.km)} km${rec.min ? ` · ${pace(rec.min, rec.km)}` : ""}`, k, { u:"d" }); break;
      }
    }
  }
  return [...best.values()].sort((a, b) => (b.k === today()) - (a.k === today()) || b.k.localeCompare(a.k));
}
function prBoard(){
  const all = records();
  const list = all.slice(0, 8);
  return `<section>
    <h2>Kişisel rekorlar ${all.length ? `<span class="count">${all.length} hareket</span>` : ""}</h2>
    ${list.length ? `<div class="prs">${list.map(r => `<div class="pr${r.k === today() ? " new" : ""}">
      <svg class="pr-cup" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-cup"/></svg>
      <div class="pr-m"><span class="pr-n">${esc(parseEx(r.name, venueOf(currentProgram())).name)}</span>
        <span class="pr-v num">${esc(r.text)}</span></div>
      <span class="pr-d">${r.k === today() ? "bugün" : prettyDate(r.k)}</span>
    </div>`).join("")}</div>`
    : `<div class="empty">Antrenman kaydı girdikçe her hareketin en iyisi burada birikir.</div>`}
  </section>`;
}

/* Yeni rekor kırıldıysa kısa kutlama */
function checkPR(name, before){
  const now = records().find(r => r.name === name);
  if (!now || now.k !== vKey()) return;
  if (before && now.val <= before.val + 0.001) return;
  toast(`🏆 Yeni rekor: ${parseEx(name, venueOf(currentProgram())).name} · ${now.text}`);
}

/* ---- kısa bilgi ---- */
function toast(msg){
  document.querySelectorAll(".toast").forEach(x => x.remove());
  const el = document.createElement("div");
  el.className = "toast"; el.setAttribute("role", "status"); el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

/* ---- kutlama ---- */
function celebrate(){
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cols = ["--band-vivid","--star","--good-vivid","--sleep","--water","--g-fruit"];
  const el = document.createElement("div");
  el.className = "party";
  el.innerHTML = (reduce ? "" : Array.from({ length:42 }, (_, i) =>
      `<i style="left:${(Math.random()*100).toFixed(1)}%;animation-delay:${(Math.random()*.5).toFixed(2)}s;--r:${Math.round(Math.random()*360)}deg;background:var(${cols[i % cols.length]})"></i>`).join(""))
    + `<div class="party-card" role="status">
        <svg class="party-star" viewBox="-8 -8 16 16" aria-hidden="true"><path d="M0-6.5 1.6-1.6 6.5 0 1.6 1.6 0 6.5-1.6 1.6-6.5 0-1.6-1.6Z" fill="var(--star)"/></svg>
        <b>Bugün tamam!</b><span>Takımyıldızına bir yıldız eklendi. Seri: ${streakNow()} gün.</span>
        <button id="party-ok">Harika</button></div>`;
  document.body.appendChild(el);
  const close = () => sheetOut(el);
  el.querySelector("#party-ok").onclick = close;
  el.onclick = e => { if (e.target === el) close(); };
  setTimeout(close, 5000);
}

/* ---- vücut kartı ---- */
/* Günün verisine göre avatarın hali */
function avatarMood(e, program){
  const sleepy = typeof e.sleep === "number" && e.sleep < sleepBand()[0] - 0.5;
  const tr = program ? autoInfo({ kind:"train", suggested:true }, e, program) : null;
  const kc = program ? autoInfo({ kind:"kcal", suggested:true }, e, program) : null;
  const trained = !!(tr && tr.ok), happy = !!(kc && kc.ok);
  const line = happy ? "😊 kalori hedefte" : trained ? "⚡ antrenman tamam" : sleepy ? "😴 az uyudun" : "";
  return { sleepy, trained, happy, star: fullDay(today()), line };
}
function avatarSVG(key, sx, wp, mood, uid){
  const sym = "#" + avSym(key);
  const [fx, fy, fs] = (AVATARS.find(a => a[0] === key) || AVATARS[2])[2];
  const yTop = (58 - 55 * wp).toFixed(1);
  const m = mood || {};
  let face = "";
  if (m.happy || m.sleepy){
    const ex = 3.2 * fs, er = 1.15 * fs, ey = fy - 1.2 * fs;
    const eyes = m.sleepy && !m.happy
      ? `<path d="M${fx-ex-er} ${ey} h${er*2} M${fx+ex-er} ${ey} h${er*2}" class="face-l"/>`
      : `<circle cx="${fx-ex}" cy="${ey}" r="${er}" class="face-d"/><circle cx="${fx+ex}" cy="${ey}" r="${er}" class="face-d"/>`;
    const mouth = m.happy ? `<path d="M${fx-2.6*fs} ${fy+1.6*fs} Q${fx} ${fy+4.6*fs} ${fx+2.6*fs} ${fy+1.6*fs}" class="face-l"/>`
                          : `<circle cx="${fx}" cy="${fy+2.6*fs}" r="${.9*fs}" class="face-d" opacity=".7"/>`;
    face = `<g class="face" style="stroke-width:${Math.max(.6, 1.1*fs)}px">${eyes}${mouth}</g>`;
  }
  const spark = (x, y, r) => `<path class="spark" transform="translate(${x} ${y}) scale(${r})" d="M0-5 1.2-1.2 5 0 1.2 1.2 0 5-1.2 1.2-5 0-1.2-1.2Z"/>`;
  return `<svg viewBox="0 0 48 64" role="img" aria-label="Avatar, bugünkü su hedefinin yüzde ${Math.round(wp*100)}'i dolu"${m.trained ? ` class="glow"` : ""}>
      <defs><clipPath id="${uid}-clip"><rect x="0" y="${yTop}" width="48" height="64"/></clipPath></defs>
      <g transform="translate(24 0) scale(${sx.toFixed(3)} 1) translate(-24 0)">
        <use href="${sym}" class="bc-base"/>
        <g clip-path="url(#${uid}-clip)"><use href="${sym}"/></g>
        ${face}
      </g>
      ${m.trained ? spark(4, 18, .55) + spark(44, 30, .45) + spark(7, 44, .4) : ""}
      ${m.star ? `<path class="bc-star" transform="translate(40 8)" d="M0-5 1.2-1.2 5 0 1.2 1.2 0 5-1.2 1.2-5 0-1.2-1.2Z"/>` : ""}
      ${m.sleepy ? `<text x="2" y="12" class="zz">z<tspan dx="1" dy="-4" font-size="8">Z</tspan></text>` : ""}
    </svg>`;
}

/* Avatar galerisi: figüre dokununca açılır */
function openAvatarSheet(){
  const p = state.profile;
  let key = avKey(p), col = avColor(p);
  const e = state.days[today()] || {}, program = currentProgram();
  const wp = program ? clamp((e.water || 0) / program.water, 0, 1) : 0;
  const el = document.createElement("div");
  el.className = "sheet-bg";
  const preview = () => `<div class="bc-fig big" style="--av:${col}">${avatarSVG(key, 1, Math.max(wp, .55), { happy:true, star:false }, "pv")}</div>`;
  el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t">
    <div class="sheet-h"><b id="sh-t">Avatarın</b><button class="sheet-x" aria-label="Kapat">×</button></div>
    <div id="sh-pv" class="sh-pv">${preview()}</div>
    <div class="sh-l">Şekil</div>${avatarPicker(key, "sh")}
    <div class="sh-l">Renk</div>${colorPicker(col, "sh")}    <div class="row" style="margin-top:16px"><button id="sh-save">Kaydet</button><button class="ghost" id="sh-cancel" style="flex:0 0 100px">Vazgeç</button></div>
  </div>`;
  document.body.appendChild(el);
  const sheet = el.querySelector(".sheet");
  sheet.style.setProperty("--av", col);
  const upd = () => { el.querySelector("#sh-pv").innerHTML = preview(); sheet.style.setProperty("--av", col); };
  wireAvatar("sh", k => { key = k; upd(); }, el);
  wireColor("sh", c => { col = c; upd(); }, el);
  const close = () => sheetOut(el);
  el.onclick = ev => { if (ev.target === el) close(); };
  el.querySelector(".sheet-x").onclick = close;
  el.querySelector("#sh-cancel").onclick = close;
  el.querySelector("#sh-save").onclick = async () => {
    p.avatar = key; p.avColor = col;
    await saveState(state); close(); render(); toast("Avatarın güncellendi.");
  };
  el.querySelector("#sh-save").focus();
}

/* ACE yağ oranı sınıfları (erkek / kadın). */
function fatClass(bf, sex){
  const t = sex === "female" ? [14, 21, 25, 32] : sex === "male" ? [6, 14, 18, 25] : [10, 17.5, 21.5, 28.5];
  if (bf < t[0]) return ["çok düşük", "warn"];
  if (bf < t[1]) return ["atletik", "ok"];
  if (bf < t[2]) return ["fit", "ok"];
  if (bf < t[3]) return ["ortalama", "ok"];
  return ["yüksek", "bad"];
}
function bmiClass(b){
  return b < 18.5 ? ["zayıf","warn"] : b < 25 ? ["normal","ok"] : b < 30 ? ["kilolu","warn"] : ["obez","bad"];
}
const kg1 = v => v.toFixed(1).replace(".", ",");

function bodyCard(){
  const p = state.profile, female = p.sex === "female", neutral = p.sex !== "female" && p.sex !== "male";
  const w = lastWeight();
  const h = p.height / 100;
  const bmi = w !== null && h > 0 ? w / (h*h) : null;
  const bf = p.bodyFat > 0 && p.bodyFat < 70 ? p.bodyFat : null;
  const program = currentProgram();
  const e = state.days[today()] || {};

  /* canlı figür: gövde yağ oranına (yoksa BMI'ye) göre genişler, günün suyuyla dolar */
  const wide = bf !== null ? (bf - sexK(p.sex, 15, 22)) * 0.014 : bmi !== null ? (bmi - 22) * 0.025 : 0;
  const sx = clamp(1 + wide, 0.86, 1.28);
  const wp = program ? clamp((e.water || 0) / program.water, 0, 1) : 0;
  const yTop = (58 - 55 * wp).toFixed(1);
  const mood = avatarMood(e, program);
  const fig = `<button class="bc-fig" id="bc-fig" style="--av:${avColor(p)}" aria-label="Avatarını değiştir">
    ${avatarSVG(avKey(p), sx, wp, mood, "bc")}
    <span class="bc-water num">💧 %${Math.round(wp*100)}</span>
    ${mood.line ? `<span class="bc-mood">${mood.line}</span>` : ""}
  </button>`;

  const [bmiTxt, bmiCls] = bmi !== null ? bmiClass(bmi) : ["", ""];
  const [bfTxt, bfCls] = bf !== null ? fatClass(bf, p.sex) : ["", ""];
  const stats = `<div class="stats">
    <div class="stat"><b>${p.height}<small> cm</small></b><span>Boy</span></div>
    <div class="stat"><b>${w !== null ? kg1(w) : "—"}<small> kg</small></b><span>Kilo</span></div>
    <div class="stat"><b>${bf !== null ? kg1(bf) : "—"}<small> %</small></b><span>Yağ oranı${bfTxt ? ` <em class="tag ${bfCls}">${bfTxt}</em>` : ""}</span></div>
    <div class="stat"><b>${bmi !== null ? kg1(bmi) : "—"}</b><span>BMI${bmiTxt ? ` <em class="tag ${bmiCls}">${bmiTxt}</em>` : ""}</span></div>
  </div>`;

  /* hedefe yolculuk */
  let journey;
  const start = p.startWeight, target = p.targetWeight;
  if (typeof target === "number" && typeof start === "number" && w !== null && start !== target){
    const total = start - target, gone = start - w;
    const pct = clamp(gone / total, 0, 1);
    const left = Math.abs(target - w);
    const down = target < start;
    const cur = avgWeights(state, shiftDays(today(), -7), today());
    const prev = avgWeights(state, shiftDays(today(), -14), shiftDays(today(), -7));
    const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
    const rate = cur.length && prev.length ? mean(cur) - mean(prev) : null;
    const right = rate !== null && (down ? rate < -0.05 : rate > 0.05);
    const reached = down ? w <= target : w >= target;
    const eta = reached ? "Hedefe ulaştın 🎉"
      : right ? `bu tempoyla ~${Math.max(1, Math.ceil(left / Math.abs(rate)))} hafta`
      : rate === null ? "tempo için iki haftalık tartı gerekli" : "son hafta hedefin tersine gitti";
    journey = `<div class="bc-sec">
      <div class="bc-h"><span>Hedefe yolculuk</span><b class="num">%${Math.round(pct * 100)}</b></div>
      <div class="jr"><div class="jr-fill" style="width:${(pct*100).toFixed(1)}%"></div><span class="jr-now" style="left:${(pct*100).toFixed(1)}%"></span></div>
      <div class="jr-lbl num"><span><b>${kg1(start)}</b>başlangıç</span><span class="mid"><b>${kg1(w)}</b>şimdi</span><span class="end"><b>${kg1(target)}</b>hedef</span></div>
      <div class="bc-note">${Math.abs(gone) >= 0.05 ? `${kg1(Math.abs(gone))} kg ${gone > 0 ? "verdin" : "aldın"} · ` : ""}${reached ? "" : `${kg1(left)} kg kaldı · `}${eta}</div>
    </div>`;
  } else {
    journey = `<div class="bc-sec">
      <div class="bc-h"><span>Hedefe yolculuk</span></div>
      <div class="tw-row"><label for="tw" class="tw-l">Hedef kilon kaç?</label>
        <input id="tw" type="number" inputmode="decimal" placeholder="kg">
        <button id="tw-save">Kaydet</button></div>
      <div class="bc-note">Hedef kilonu girince ilerlemen burada görünür.</div>
    </div>`;
  }

  /* kompozisyon */
  let comp;
  if (bf !== null && w !== null){
    const fatKg = w * bf / 100, lean = w - fatKg;
    comp = `<div class="bc-sec">
      <div class="bc-h"><span>Vücut kompozisyonu</span></div>
      <div class="comp" role="img" aria-label="Yağsız kütle ${kg1(lean)} kg, yağ ${kg1(fatKg)} kg">
        <i class="lean" style="width:${(100 - bf).toFixed(1)}%"></i><i class="fat" style="width:${bf.toFixed(1)}%"></i></div>
      <div class="comp-lbl num"><span><i class="dot lean"></i>Yağsız <b>${kg1(lean)} kg</b></span><span><i class="dot fat"></i>Yağ <b>${kg1(fatKg)} kg</b></span></div>
      <div class="bc-note">${neutral ? "Fit aralık erkekte %14–17, kadında %21–24; ortalama erkekte %18–24, kadında %25–31 (ACE). Etiket iki sınırın ortalamasına göre verilir."
        : `${female ? "Kadında" : "Erkekte"} fit aralık %${female ? "21–24" : "14–17"}, ortalama %${female ? "25–31" : "18–24"} (ACE).`}</div>
    </div>`;
  } else {
    comp = `<div class="bc-sec"><div class="bc-h"><span>Vücut kompozisyonu</span></div>
      <div class="bc-note">Yağ oranını girince vücut bileşimin burada görünür.</div></div>`;
  }

  return `<section class="bc">
    <div class="bc-top">${fig}${stats}</div>
    ${journey}
    ${comp}
  </section>`;
}

function wireHome(){
  const fg = document.getElementById("bc-fig");
  if (fg) fg.onclick = openAvatarSheet;
  const b = document.getElementById("tw-save");
  if (!b) return;
  const i = document.getElementById("tw");
  const save = async () => {
    const n = num(i.value);
    if (!n || n < 30 || n > 300){ toast("30 ile 300 kg arasında bir hedef gir."); return; }
    state.profile.targetWeight = Math.round(n * 10) / 10;
    await saveState(state); render();
  };
  b.onclick = save;
  i.onkeydown = e => { if (e.key === "Enter") save(); };
}

/* ---- ana sayfa ---- */
function homeView(){
  const p = state.profile;
  const w = lastWeight();
  const h = p.height / 100;
  const bmi = (w !== null && h > 0) ? w / (h*h) : null;
  const lbm = (w !== null && p.bodyFat > 0 && p.bodyFat < 70) ? w * (1 - p.bodyFat/100) : null;
  const change = (w !== null && typeof p.startWeight === "number") ? w - p.startWeight : null;

  const bmiCat = bmi === null ? "" : bmi < 18.5 ? "zayıf" : bmi < 25 ? "normal" : bmi < 30 ? "kilolu" : "obez";
  const goalDown = p.goal === "lose";

  return `${bodyCard()}${chartsView()}`;
}

/* ---- öğün dilimleri ---- */
/* Şu saate en yakın öğün seçili gelir; öğün sayısı değişse de çalışır. */
function defaultSlot(){
  const now = new Date().getHours() + new Date().getMinutes()/60;
  const list = userMeals();
  if (!list.length) return "aksam";
  return list.reduce((best, m) =>
    Math.abs((m.h ?? 12) - now) < Math.abs((best.h ?? 12) - now) ? m : best, list[0]).id;
}

/* ---- tekrar eden görevler ---- */
function routinesForDay(key){
  const wd = isoWeekday(key);
  return (state.routines || []).filter(r => r.days.includes(wd));
}
