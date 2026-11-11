"use strict";

/* ---- serbest antrenman ----
   Program yokken (ya da dinlenme gününde) yapılan bir antrenman buraya
   yazılır: tür ve süre yeter. Görev değildir, zorunlu değildir; yapıldıysa
   kayda geçsin diye vardır. Takvimde program antrenmanıyla aynı işareti alır. */
const FREE_KINDS = [
  ["walk", "Yürüyüş"], ["run", "Koşu"], ["bike", "Bisiklet"],
  ["swim", "Yüzme"], ["gym", "Ağırlık"], ["other", "Diğer"]
];
const FREE_ICON = { walk:"walk", run:"walk", bike:"walk", swim:"walk", gym:"plan", other:"plan" };
const freeLabel = f => (FREE_KINDS.find(([k]) => k === f.k) || ["", "Antrenman"])[1];

function hasFree(d){ return !!(d && d.free && d.free.k); }

function freeCard(entry, key){
  const f = entry.free;
  const now = key === today();
  return `<section>
    <h2>${f ? "Kaydettiğin antrenman" : (now ? "Bugün antrenman yaptın mı?" : "O gün antrenman yaptın mı?")}</h2>
    ${f ? `<div class="item">${iconBox(FREE_ICON[f.k] || "plan")}
        <div class="item-main"><h3>${esc(freeLabel(f))}</h3>
          <p>${f.min ? `${f.min} dakika` : "süre girilmedi"}${f.note ? ` · ${esc(f.note)}` : ""}</p></div>
        <button class="del" id="free-del" aria-label="Sil">×</button></div>
      <button class="ghost" id="free-add" style="margin-top:12px">Değiştir</button>`
     : `<div class="metric-note" style="margin-bottom:12px">Bugün dinlenme günü.</div>
        <button id="free-add">Antrenman ekle</button>`}
  </section>`;
}

function openFreeSheet(key, onDone){
  const e = ensureDay(key);
  let sel = (e.free && e.free.k) || "walk";
  const el = document.createElement("div");
  el.className = "sheet-bg";
  function esc2(ev){ if (ev.key === "Escape") close(); }
  const close = () => { sheetOut(el); document.removeEventListener("keydown", esc2); };

  el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="fr-t">
    <div class="sheet-h"><b id="fr-t">Antrenman ekle</b>
      <button class="sheet-x" aria-label="Kapat">×</button></div>
    <div class="metric-note" style="margin:-2px 0 12px">${prettyDate(key)} gününe yazılır.</div>
    <label>Ne yaptın?</label>
    <div class="chips" id="fr-kinds">${FREE_KINDS.map(([k, l]) =>
      `<button class="chip${sel === k ? " sel" : ""}" data-frk="${k}">${l}</button>`).join("")}</div>
    <div class="field" style="margin-top:16px"><label for="fr-min">Kaç dakika?</label>
      <input id="fr-min" type="number" inputmode="numeric" placeholder="örn. 40"
        value="${e.free && e.free.min ? e.free.min : ""}"></div>
    <div class="field"><label for="fr-note">Not <span style="opacity:.7">(isteğe bağlı)</span></label>
      <input id="fr-note" type="text" placeholder="örn. tempolu, 5 km"
        value="${e.free && e.free.note ? esc(e.free.note) : ""}"></div>
    <div class="row" style="margin-top:16px">
      <button id="fr-ok">Kaydet</button>
      <button class="ghost" id="fr-no" style="flex:0 0 110px">Vazgeç</button>
    </div></div>`;
  document.body.appendChild(el);
  document.addEventListener("keydown", esc2);
  el.onclick = ev => { if (ev.target === el) close(); };
  el.querySelector(".sheet-x").onclick = close;
  el.querySelector("#fr-no").onclick = close;
  el.querySelectorAll("[data-frk]").forEach(b => b.onclick = () => {
    sel = b.dataset.frk;
    el.querySelectorAll("[data-frk]").forEach(x => x.classList.toggle("sel", x === b));
  });
  el.querySelector("#fr-ok").onclick = async () => {
    const min = num(el.querySelector("#fr-min").value);
    const note = el.querySelector("#fr-note").value.trim();
    e.free = { k: sel, min: min ? Math.round(min) : null, note: note || null };
    close();
    await saveState(state);
    if (onDone) onDone();
    toast(`${freeLabel(e.free)} kaydedildi.`);
  };
  el.querySelector("#fr-ok").focus();
}

function wireFree(key){
  const a = document.getElementById("free-add");
  if (a) a.onclick = () => openFreeSheet(key, () => render());
  const d = document.getElementById("free-del");
  if (d) d.onclick = async () => {
    delete ensureDay(key).free;
    await saveState(state); render();
  };
}

/* ---- antrenman kaydı ---- */
function exercisesOf(session){
  if (!session || !session.b) return [];
  if (/^\d+ tur:/.test(session.b)) return [session.b];   // devre: tek kalem
  return session.b.split(" · ");
}

function venueOf(program){
  const p = program && program.training && PROGRAMS[program.training.id];
  return p ? p.venue : "gym";
}

const BW_RX = /barfiks|chin-up|dips|plank|karın|hollow|şınav|l-sit|handstand|lever|muscle-up|pistol|shrimp|nordic|dragon|jump squat|superman|dead bug|glute bridge|step-up|sandalye|duvar|sıçrama|burpee|avustralya|havlu|ters kürek|lastik/;
const XKG_RX = /^(barfiks|chin-up|dips)/;

/* Hareket metnini giriş tipine çevirir:
   w  = set başına kg + tekrar     r  = set başına tekrar
   t  = set başına saniye           wc = kg + tamamlanan set
   n  = tamamlanan tur              c  = süre (+ mesafe)
   sw = yüzme: tamamlanan tekrar + süre   sd = mesafe + süre
   ok = yapıldı işareti */
function parseEx(s, venue){
  const l = s.toLocaleLowerCase("tr");
  let m;
  const base = s.replace(/\s*\d+\s*(×|set\b).*$/,"").trim() || s;
  if ((m = l.match(/^(\d+) tur:\s*(.*)$/)))
    return { t:"n", n:+m[1], name:"Devre", sub:s.replace(/^\d+ tur:\s*/,"").replace(/ · /g,", "), unit:"tur" };
  if ((m = l.match(/(\d+) tur\b/))){
    const rest = s.replace(/\s*\d+ tur\b/,"").trim();
    if (/^\(/.test(rest)) return { t:"n", n:+m[1], name:"Koşu-yürüyüş aralığı", sub:`${m[1]} tur · ${rest.slice(1,-1)}`, unit:"tur" };
    return { t:"n", n:+m[1], name:rest || s, sub:m[1]+" tur", unit:"tur" };
  }
  if ((m = l.match(/^(\d+)\s*×\s*(\d+) dk koşu/)))
    return { t:"n", n:+m[1], name:"Koşu", sub:s, unit:"blok" };
  if ((m = l.match(/(\d+)×(\d+) m\b/))){
    if (venue === "swim") return { t:"sw", n:+m[1], d:+m[2], name:s.replace(/^\d+×\d+ m\s*/,"").replace(/^./,c=>c.toLocaleUpperCase("tr")), sub:`${m[1]} × ${m[2]} m` };
    return { t:"wc", n:+m[1], name:base, sub:`${m[1]} × ${m[2]} m`, unit:"set" };
  }
  if ((m = l.match(/^(\d+) m (ısınma|soğuma)/)))
    return { t:"ok", name:m[2][0].toLocaleUpperCase("tr")+m[2].slice(1), sub:m[1]+" m" };
  if ((m = l.match(/^(\d+) m\s*(.*)$/)))
    return { t:"sd", d:+m[1], name:(m[2]||"yüzme").replace(/^./,c=>c.toLocaleUpperCase("tr")), sub:m[1]+" m" };
  if (/(\d+)×(\d+) sn/.test(l) && /sprint/.test(l)){
    m = l.match(/(\d+)×(\d+) sn/);
    return { t:"n", n:+m[1], name:base, sub:`${m[1]} × ${m[2]} sn`, unit:"tekrar" };
  }
  if ((m = l.match(/(\d+)×(\d+) sn/)))
    return { t:"t", n:+m[1], tg:m[2], name:base, sub:`${m[1]} set × ${m[2]} sn` };
  if (/koşu|yürüyüş|bisiklet|ip atlama/.test(l)){
    m = l.match(/(\d+(?:-\d+)?) dk/);
    return { t:"c", tg:m ? m[1] : "", km:/koşu|yürüyüş|bisiklet/.test(l),
             name:s.replace(/^\d+(-\d+)? dk\s*/,"").replace(/^./,c=>c.toLocaleUpperCase("tr")), sub:m ? m[1]+" dk" : "" };
  }
  if ((m = l.match(/(\d+)(?:-\d+)? dk/)) || !/\d/.test(l) || /\(\d+ dk\)|her poz/.test(l))
    return { t:"ok", name:s.replace(/\s*\(.*\)$/,""), sub:(s.match(/\(([^)]*)\)$/)||[])[1] || "" };
  const heavy = /çantalı/.test(l) || ((venue === "gym" || venue === "kettlebell") && !BW_RX.test(l));
  if ((m = l.match(/(\d+)×(max|\d+(?:-\d+)?)( adım)?/))){
    const n = +m[1], tg = m[2];
    const sub = `${n} set × ${tg === "max" ? "max" : tg}${m[3] ? " adım" : ""}`;
    if (heavy && (n > 6 || tg === "1")) return { t:"wc", n, name:base, sub:sub + (/her taraf/.test(l) ? " (her taraf)" : ""), unit:"set" };
    if (heavy) return { t:"w", n, tg, name:base, sub };
    return { t:"r", n, tg, name:base, sub, xkg:XKG_RX.test(l) };
  }
  if ((m = l.match(/(\d+) set(?: \(%([\d-]+)\))?/))){
    const pc = m[2] ? m[2].split("-").map(x => "%"+x) : [];
    return { t:"w", n:+m[1], tg:"", pc, name:base, sub:`${m[1]} set${pc.length?" · "+pc.join(" / ")+" 1TM":""}` };
  }
  return { t:"ok", name:s, sub:"" };
}

const numsOf = a => (a || []).filter(v => typeof v === "number");
function liftHas(l){
  if (!l) return false;
  if (l.kg || l.reps || l.n || l.ok || l.min || l.km || l.m) return true;
  return (l.sets || []).some(x => x && (typeof x === "number" ? x : (x.kg || x.r)));
}

/* Aynı hareketin son kaydı */
function lastLift(name, before){
  const t = before || today();
  for (const k of Object.keys(state.days).sort().reverse()){
    if (k >= t) continue;
    const l = state.days[k].lifts && state.days[k].lifts[name];
    if (liftHas(l)) return { ...l, k };
  }
  return null;
}

const fmtN = v => String(v).replace(".", ",");
function pace(min, km){
  if (!min || !km) return "";
  const p = min / km, mm = Math.floor(p), ss = Math.round((p - mm) * 60);
  return `${mm}:${String(ss === 60 ? 0 : ss).padStart(2,"0")} /km`;
}

function liftSummary(l, ex){
  if (!l.t)          // eski kayıt biçimi
    return `${l.kg ? fmtN(l.kg) + " kg" : ""}${l.kg && l.reps ? " × " : ""}${l.reps ? l.reps + " tekrar" : ""}`;
  const sets = l.sets || [];
  switch (ex.t){
    case "w": {
      const done = sets.filter(x => x && x.r);
      if (!done.length) return "";
      const kgs = [...new Set(done.map(x => x.kg || 0))];
      return kgs.length === 1
        ? `${kgs[0] ? fmtN(kgs[0]) + " kg · " : ""}${done.map(x => x.r).join("-")} tekrar`
        : done.map(x => `${fmtN(x.kg || 0)}×${x.r}`).join(", ");
    }
    case "r": { const r = numsOf(sets); return r.length ? `${r.join("-")} tekrar${l.kg2 ? ` · +${fmtN(l.kg2)} kg` : ""}` : ""; }
    case "t": { const r = numsOf(sets); return r.length ? `${r.join("-")} sn` : ""; }
    case "wc": return `${l.kg ? fmtN(l.kg) + " kg · " : ""}${l.n || 0}/${ex.n} ${ex.unit}`;
    case "n":  return `${l.n || 0}/${ex.n} ${ex.unit}`;
    case "sw": return `${l.n || 0}/${ex.n} × ${ex.d} m${l.min ? ` · ${fmtN(l.min)} dk` : ""}`;
    case "sd": return `${l.m || ex.d} m${l.min ? ` · ${fmtN(l.min)} dk` : ""}`;
    case "c":  return [l.min ? fmtN(l.min) + " dk" : "", l.km ? fmtN(l.km) + " km" : "", pace(l.min, l.km)].filter(Boolean).join(" · ");
    default:   return l.ok ? "yapıldı" : "";
  }
}

const LIFT_KIND = { w:"Ağırlık × tekrar", r:"Tekrar", t:"Süre", wc:"Ağırlık + set", n:"Tur", sw:"Tekrar + süre", sd:"Mesafe + süre", c:"Süre + mesafe", ok:"" };

function liftInput(i, f, k, val, ph, dec, label){
  return `<label class="lf-cell">${label ? `<span>${label}</span>` : ""}<input type="number" inputmode="${dec?"decimal":"numeric"}"
    data-lx="${i}" data-f="${f}"${k !== undefined ? ` data-k="${k}"` : ""} value="${val ?? ""}" placeholder="${ph ?? ""}"></label>`;
}

function stepper(i, cur, max, unit){
  return `<div class="lf-step">
    <button class="lf-sb" data-lstep="${i}" data-d="-1" aria-label="Azalt"${cur <= 0 ? " disabled" : ""}>−</button>
    <div class="lf-sv num"><b>${cur}</b> / ${max} <span>${unit}</span></div>
    <button class="lf-sb" data-lstep="${i}" data-d="1" aria-label="Artır"${cur >= max ? " disabled" : ""}>+</button>
  </div>`;
}

function liftBody(i, ex, cur, prev){
  const sets = cur.sets || [];
  const pSets = prev && prev.sets || [];
  const idx = Array.from({ length: ex.n || 0 }, (_, k) => k);
  switch (ex.t){
    case "w": return `<div class="lf-sets">${idx.map(k => {
        const s = sets[k] || {}, p = pSets[k] || {};
        const prevKg = (k > 0 && sets[k-1] && sets[k-1].kg) || undefined;
        const kgPh = ex.pc && ex.pc[k] ? ex.pc[k] : (p.kg ?? prevKg ?? (prev && prev.kg) ?? "kg");
        return `<div class="lf-set"><span class="lf-no">${k+1}</span>
          ${liftInput(i,"kg",k,s.kg,kgPh === "kg" ? "kg" : kgPh,true,"kg")}
          ${liftInput(i,"r",k,s.r,p.r ?? ex.tg ?? "",false,"tekrar")}</div>`;
      }).join("")}</div>`;
    case "r": case "t": return `<div class="lf-grid">${idx.map(k =>
        liftInput(i,"s",k,sets[k],(typeof pSets[k] === "number" ? pSets[k] : ex.tg),false,`${k+1}. set${ex.t==="t"?" · sn":""}`)).join("")}
        ${ex.xkg ? liftInput(i,"kg2",undefined,cur.kg2,prev && prev.kg2 || "",true,"Ek kg") : ""}</div>`;
    case "wc": return `<div class="lf-row">${liftInput(i,"kg",undefined,cur.kg,prev && prev.kg || "",true,"Ağırlık (kg)")}</div>${stepper(i, cur.n || 0, ex.n, ex.unit)}`;
    case "n":  return stepper(i, cur.n || 0, ex.n, ex.unit);
    case "sw": return `${stepper(i, cur.n || 0, ex.n, "× " + ex.d + " m")}<div class="lf-row">${liftInput(i,"min",undefined,cur.min,prev && prev.min || "",true,"Süre (dk)")}</div>`;
    case "sd": return `<div class="lf-row">${liftInput(i,"m",undefined,cur.m,ex.d,false,"Mesafe (m)")}${liftInput(i,"min",undefined,cur.min,prev && prev.min || "",true,"Süre (dk)")}</div>`;
    case "c":  return `<div class="lf-row">${liftInput(i,"min",undefined,cur.min,ex.tg || "",true,"Süre (dk)")}${ex.km ? liftInput(i,"km",undefined,cur.km,prev && prev.km || "",true,"Mesafe (km)") : ""}</div>
                 ${cur.min && cur.km ? `<div class="metric-note">Tempo: <b>${pace(cur.min, cur.km)}</b></div>` : ""}`;
    default:   return "";
  }
}

function howLink(name){
  const ids = guidesFor(name);
  return ids.length ? `<button class="how-link" data-howgo="${ids[0]}">Nasıl yapılır</button>` : "";
}

/* ---- antrenman kaydı ----
   Beslenmedeki günlükle aynı mantık: kayıt kendi sekmesinde durur,
   Bugün sayfası yalnızca "bugün ne var" der ve buraya gönderir. */
function trainLogView(entry, program, key){
  key = key || today();
  const none = program.training.none;
  const session = none ? null : program.training.days.find(d => d.wd === isoWeekday(key));
  const now = key === today();

  if (none) return `
    ${freeCard(entry, key)}
    <section>
      <h2>Spor programın kapalı</h2>
      <div class="metric-note">Program kurulu değil. Ayarlar'dan açabilirsin.</div>
      <button class="ghost" id="plan-on" style="margin-top:12px">Spor programı kur</button>
    </section>
    ${prBoard()}`;

  if (!session || !session.b) return `
    <section>
      <h2>${now ? "Bugün dinlenme" : "O gün dinlenme günüydü"}</h2>
      <div class="metric-note">${session && session.t ? esc(session.t) + ". " : ""}Programında bu güne antrenman düşmüyor.</div>
    </section>
    ${freeCard(entry, key)}
    ${nextSessionCard(program, key)}
    ${prBoard()}`;

  const list = exercisesOf(session);
  const lifts = entry.lifts || {};
  const doneN = list.filter(n => liftHas(lifts[n])).length;

  return `
  <section>
    <h2>${esc(session.t)} <span class="count">${doneN}/${list.length} hareket</span></h2>
    <div class="metric-note" style="margin-bottom:13px">${esc(session.b)}</div>
    <button id="wo-start">${doneN ? "Antrenman moduna dön" : "Antrenman modunu başlat"}</button>  </section>
  ${liftsSection(entry, session, key)}
  ${freeCard(entry, key)}
  ${prBoard()}`;
}

/* Bugün antrenman yoksa sıradaki günü söyler. */
function nextSessionCard(program, key){
  const days = program.training.days.filter(d => d.b);
  if (!days.length) return "";
  const wd = isoWeekday(key);
  let best = null, bestGap = 99;
  for (const d of days){
    const gap = ((d.wd - wd) % 7 + 7) % 7 || 7;
    if (gap < bestGap){ bestGap = gap; best = d; }
  }
  if (!best) return "";
  return `<section>
    <h2>Sıradaki antrenman</h2>
    <div class="item">${iconBox(best.icon)}
      <div class="item-main"><h3>${esc(best.t)}</h3>
        <p>${WD_NAMES[best.wd]}${bestGap === 1 ? " · yarın" : ` · ${bestGap} gün sonra`}</p></div></div>
  </section>`;
}

function liftsSection(entry, session, key){
  key = key || today();
  const list = exercisesOf(session);
  if (!list.length) return "";
  const venue = venueOf(currentProgram());
  const lifts = entry.lifts || {};
  const doneN = list.filter(n => liftHas(lifts[n])).length;
  return fold("lifts", "Hareketleri tek tek gir", `${doneN}/${list.length}`, `
    ${list.map((name, i) => {
      const ex = parseEx(name, venue);
      const cur = lifts[name] || {};
      const prev = lastLift(name, key);
      const has = liftHas(cur);
      const ps = prev ? liftSummary(prev, ex) : "";
      if (ex.t === "ok") return `<div class="lift lift-ok">
        <button class="check" data-done="${cur.ok?1:0}" data-ltog="${i}" aria-label="${esc(ex.name)} tamamlandı"></button>
        <div class="lift-main"><div class="lift-name">${esc(ex.name)}</div>${ex.sub?`<div class="lift-sub">${esc(ex.sub)}</div>`:""}${howLink(name)}</div>
      </div>`;
      return `<div class="lift${has?" on":""}">
        <div class="lift-head">
          <div class="lift-main"><div class="lift-name">${esc(ex.name)}</div>
            <div class="lift-sub">${esc(ex.sub)}${LIFT_KIND[ex.t] ? ` · ${LIFT_KIND[ex.t]}` : ""}</div>${howLink(name)}</div>
          ${has ? `<svg class="ico lift-tick" aria-hidden="true"><use href="#i-check"/></svg>` : ""}
        </div>
        ${liftBody(i, ex, cur, prev)}
        <div class="metric-note">${ps ? `Son: ${esc(ps)} · ${prettyDate(prev.k)}` : "İlk kez kaydediyorsun."}</div>
      </div>`;
    }).join("")}`);
}

function wireLifts(entry, key){
  key = key || today();
  const session = currentProgram()
    ? currentProgram().training.days.find(d => d.wd === isoWeekday(key)) : null;
  const list = exercisesOf(session);
  const venue = venueOf(currentProgram());
  const recOf = i => {
    entry.lifts = entry.lifts || {};
    const name = list[i];
    let r = entry.lifts[name];
    if (!r || !r.t) r = entry.lifts[name] = {};
    r.t = parseEx(name, venue).t;
    return r;
  };
  const tidy = i => { const n = list[i]; if (entry.lifts && !liftHas(entry.lifts[n])) delete entry.lifts[n]; };

  app.querySelectorAll("[data-lx]").forEach(el => el.onchange = async () => {
    const i = +el.dataset.lx, f = el.dataset.f, k = el.dataset.k;
    const before = records().find(r => r.name === list[i]);
    const rec = recOf(i);
    let n = num(el.value);
    if (n !== null && n < 0) n = null;
    const intF = f === "r" || f === "s" || f === "m";
    if (n !== null && intF) n = Math.round(n);
    if (k === undefined){
      if (n === null) delete rec[f]; else rec[f] = n;
    } else {
      rec.sets = rec.sets || [];
      const kk = +k;
      if (f === "s") rec.sets[kk] = n;
      else {
        const s = rec.sets[kk] = rec.sets[kk] || {};
        if (n === null) delete s[f]; else s[f] = n;
        // tekrar girilip kg boşsa önceki setin kilosunu devral
        if (f === "r" && n !== null && s.kg === undefined && kk > 0 && rec.sets[kk-1] && rec.sets[kk-1].kg) s.kg = rec.sets[kk-1].kg;
      }
      for (let j = 0; j < rec.sets.length; j++) if (rec.sets[j] === undefined) rec.sets[j] = null;
    }
    tidy(i);
    await saveState(state); render();
    checkPR(list[i], before);
  });
  app.querySelectorAll("[data-lstep]").forEach(b => b.onclick = async () => {
    const i = +b.dataset.lstep, ex = parseEx(list[i], venue), rec = recOf(i);
    const before = records().find(r => r.name === list[i]);
    rec.n = Math.max(0, Math.min(ex.n, (rec.n || 0) + (+b.dataset.d)));
    if (!rec.n) delete rec.n;
    tidy(i);
    await saveState(state); render();
    checkPR(list[i], before);
  });
  const woBtn = document.getElementById("wo-start");
  if (woBtn) woBtn.onclick = openWorkout;
  app.querySelectorAll("[data-howgo]").forEach(b => b.onclick = () => {
    tab = "plan"; planTab = "howto"; howQuery = ""; howOpen = b.dataset.howgo;
    render();
    const el = app.querySelector(`[data-how="${howOpen}"]`);
    if (el) el.scrollIntoView({ block:"center" }); else window.scrollTo(0,0);
  });
  app.querySelectorAll("[data-ltog]").forEach(b => b.onclick = async () => {
    const i = +b.dataset.ltog, rec = recOf(i);
    if (rec.ok) delete rec.ok; else rec.ok = 1;
    tidy(i);
    await saveState(state); render();
  });
}

/* ---- onay sayfası ----
   window.confirm yerine uygulamanın kendi sayfası: metin uzun olabilir ve
   iki seçenek de adıyla anılır. Söz veren bir Promise döndürür. */
function askSheet({ title, body, ok, cancel }){
  return new Promise(resolve => {
    const el = document.createElement("div");
    el.className = "sheet-bg";
    let done = false;
    const close = v => { if (done) return; done = true; sheetOut(el); resolve(v); };
    el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ask-t">
      <div class="sheet-h"><b id="ask-t">${title}</b>
        <button class="sheet-x" aria-label="Kapat">×</button></div>
      <div class="metric-note" style="margin:2px 0 4px">${body}</div>
      <div class="row" style="margin-top:16px">
        <button id="ask-ok">${ok}</button>
        <button class="ghost" id="ask-no" style="flex:0 0 110px">${cancel}</button>
      </div></div>`;
    document.body.appendChild(el);
    el.onclick = ev => { if (ev.target === el) close(false); };
    el.querySelector(".sheet-x").onclick = () => close(false);
    el.querySelector("#ask-no").onclick = () => close(false);
    el.querySelector("#ask-ok").onclick = () => close(true);
    el.querySelector("#ask-ok").focus();
  });
}

/* Elle girilmiş kalori, günlüğe ilk kalem eklenince sessizce silinmesin. */
async function guardKcal(entry){
  const manual = entry.kcalManual && typeof entry.kcal === "number" && entry.kcal > 0;
  if (!manual || (entry.log && entry.log.length)) return true;
  const yes = await askSheet({
    title: "Kalori nereden hesaplansın?",
    body: `Bu güne elle <b>${entry.kcal} kcal</b> girilmişti. Beslenme günlüğüne kalem eklersen kalori bundan sonra günlükten hesaplanır ve elle girdiğin değer kaybolur.`,
    ok: "Günlükten hesapla", cancel: "Vazgeç" });
  if (yes) delete entry.kcalManual;
  return yes;
}
