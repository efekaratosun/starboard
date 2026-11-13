"use strict";

/* ---- serbest antrenman ----
   Program yokken (ya da dinlenme gününde) yapılan bir antrenman buraya
   yazılır: tür ve süre yeter. Görev değildir, zorunlu değildir; yapıldıysa
   kayda geçsin diye vardır. Takvimde program antrenmanıyla aynı işareti alır. */
const FREE_KINDS = [
  ["walk", tx("Yürüyüş")], ["run", tx("Koşu")], ["bike", tx("Bisiklet")],
  ["swim", tx("Yüzme")], ["gym", tx("Ağırlık")], ["other", tx("Diğer")]
];
const FREE_ICON = { walk:"walk", run:"walk", bike:"walk", swim:"walk", gym:"plan", other:"plan" };
const freeLabel = f => (FREE_KINDS.find(([k]) => k === f.k) || ["", tx("Antrenman")])[1];

function hasFree(d){ return !!(d && d.free && d.free.k); }

/* Serbest antrenman kartı kapalı durur; "Serbest antrenman ekle" bağlantısı o günün kartını açar. */
let freeOpenKey = null;

function freeCard(entry, key){
  const f = entry.free;
  const now = key === today();
  return `<section>
    <h2>${f ? tx("Kaydettiğin antrenman") : (now ? tx("Bugün antrenman yaptın mı?") : tx("O gün antrenman yaptın mı?"))}</h2>
    ${f ? `<div class="item">${iconBox(FREE_ICON[f.k] || "plan")}
        <div class="item-main"><h3>${esc(freeLabel(f))}</h3>
          <p>${f.min ? `${f.min} dakika` : tx("süre girilmedi")}${f.note ? ` · ${esc(f.note)}` : ""}</p></div>
        <button class="del" id="free-del" aria-label="${tx("Sil")}">×</button></div>
      <button class="ghost" id="free-add" style="margin-top:12px">${tx("Değiştir")}</button>`
     : `<button id="free-add">${tx("Antrenman ekle")}</button>`}
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
    <div class="sheet-h"><b id="fr-t">${tx("Antrenman ekle")}</b>
      <button class="sheet-x" aria-label="${tx("Kapat")}">×</button></div>
    ${key === today() ? "" : `<div class="metric-note" style="margin:-2px 0 12px">${tx("{0} gününe yazılır.", [(prettyDate(key))])}</div>`}
    <label>${tx("Ne yaptın?")}</label>
    <div class="chips" id="fr-kinds">${FREE_KINDS.map(([k, l]) =>
      `<button class="chip${sel === k ? " sel" : ""}" data-frk="${k}">${l}</button>`).join("")}</div>
    <div class="field" style="margin-top:16px"><label for="fr-min">${tx("Kaç dakika?")}</label>
      <input id="fr-min" type="number" inputmode="numeric" placeholder="${tx("örn. 40")}"
        value="${e.free && e.free.min ? e.free.min : ""}"></div>
    <div class="field"><label for="fr-note">${tx("Not")} <span style="opacity:.7">${tx("(isteğe bağlı)")}</span></label>
      <input id="fr-note" type="text" placeholder="${tx("örn. tempolu, 5 km")}"
        value="${e.free && e.free.note ? esc(e.free.note) : ""}"></div>
    <div class="row" style="margin-top:16px">
      <button id="fr-ok">${tx("Kaydet")}</button>
      <button class="ghost" id="fr-no" style="flex:0 0 110px">${tx("Vazgeç")}</button>
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
    freeOpenKey = null;
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
    return { t:"n", n:+m[1], name:tx("Devre"), sub:s.replace(/^\d+ tur:\s*/,"").replace(/ · /g,", "), unit:"tur" };
  if ((m = l.match(/(\d+) tur\b/))){
    const rest = s.replace(/\s*\d+ tur\b/,"").trim();
    if (/^\(/.test(rest)) return { t:"n", n:+m[1], name:tx("Koşu-yürüyüş aralığı"), sub:`${m[1]} tur · ${rest.slice(1,-1)}`, unit:"tur" };
    return { t:"n", n:+m[1], name:rest || s, sub:m[1]+" tur", unit:"tur" };
  }
  if ((m = l.match(/^(\d+)\s*×\s*(\d+) dk koşu/)))
    return { t:"n", n:+m[1], name:tx("Koşu"), sub:s, unit:"blok" };
  if ((m = l.match(/(\d+)×(\d+) m\b/))){
    if (venue === "swim") return { t:"sw", n:+m[1], d:+m[2], name:s.replace(/^\d+×\d+ m\s*/,"").replace(/^./,c=>c.toLocaleUpperCase("tr")), sub:`${m[1]} × ${m[2]} m` };
    return { t:"wc", n:+m[1], name:base, sub:`${m[1]} × ${m[2]} m`, unit:"set" };
  }
  if ((m = l.match(/^(\d+) m (ısınma|soğuma)/)))
    return { t:"ok", name:m[2][0].toLocaleUpperCase("tr")+m[2].slice(1), sub:m[1]+" m" };
  if ((m = l.match(/^(\d+) m\s*(.*)$/)))
    return { t:"sd", d:+m[1], name:(m[2]||tx("yüzme")).replace(/^./,c=>c.toLocaleUpperCase("tr")), sub:m[1]+" m" };
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
    const sub = `${n} set × ${tg === "max" ? "max" : tg}${m[3] ? tx(" adım") : ""}`;
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

function pace(min, km){
  if (!min || !km) return "";
  const p = min / km, mm = Math.floor(p), ss = Math.round((p - mm) * 60);
  return `${mm}:${String(ss === 60 ? 0 : ss).padStart(2,"0")} /km`;
}

function liftSummary(l, ex){
  if (!l.t)          // eski kayıt biçimi
    return `${l.kg ? fmtLift(l.kg) + " " + wUnit() : ""}${l.kg && l.reps ? " × " : ""}${l.reps ? l.reps + " tekrar" : ""}`;
  const sets = l.sets || [];
  switch (ex.t){
    case "w": {
      const done = sets.filter(x => x && x.r);
      if (!done.length) return "";
      const kgs = [...new Set(done.map(x => x.kg || 0))];
      return kgs.length === 1
        ? exText(`${kgs[0] ? fmtLift(kgs[0]) + " " + wUnit() + " · " : ""}${done.map(x => x.r).join("-")} tekrar`)
        : done.map(x => `${fmtLift(x.kg || 0)}×${x.r}`).join(", ");
    }
    case "r": { const r = numsOf(sets); return r.length ? exText(`${r.join("-")} tekrar${l.kg2 ? ` · +${fmtLift(l.kg2)} ${wUnit()}` : ""}`) : ""; }
    case "t": { const r = numsOf(sets); return r.length ? exText(`${r.join("-")} sn`) : ""; }
    case "wc": return `${l.kg ? fmtLift(l.kg) + " " + wUnit() + " · " : ""}${l.n || 0}/${ex.n} ${exText(ex.unit)}`;
    case "n":  return `${l.n || 0}/${ex.n} ${exText(ex.unit)}`;
    case "sw": return exText(`${l.n || 0}/${ex.n} × ${ex.d} m${l.min ? ` · ${fmtN(l.min)} dk` : ""}`);
    case "sd": return exText(`${l.m || ex.d} m${l.min ? ` · ${fmtN(l.min)} dk` : ""}`);
    case "c":  return [l.min ? tx("{0} dk", [(fmtN(l.min))]) : "", l.km ? fmtN(l.km) + " km" : "", pace(l.min, l.km)].filter(Boolean).join(" · ");
    default:   return l.ok ? tx("yapıldı") : "";
  }
}

const LIFT_KIND = { w:tx("Ağırlık × tekrar"), r:tx("Tekrar"), t:tx("Süre"), wc:tx("Ağırlık + set"), n:tx("Tur"), sw:tx("Tekrar + süre"), sd:tx("Mesafe + süre"), c:tx("Süre + mesafe"), ok:"" };

function howLink(name){
  const ids = guidesFor(name);
  return ids.length ? `<button class="how-link" data-howgo="${ids[0]}">${tx("Nasıl yapılır")}</button>` : "";
}

/* Hareket rehberi Program sekmesindedir; her "nasıl yapılır" bağlantısı oraya açar. */
function goHow(id){
  tab = "plan"; planTab = "program"; howQuery = ""; howOpen = id; openFold("how");
  render();
  const el = app.querySelector(`[data-how="${id}"]`);
  if (el) el.scrollIntoView({ block:"center" }); else window.scrollTo(0,0);
}

/* ---- Program › Bugün ----
   Salt okunur: bugünün antrenmanı, ilerleme ve hareket listesi. Set girişi
   yalnızca antrenman modunda yapılır. */
function trainTodayView(entry, program, key){
  key = key || today();
  const none = program.training.none;
  const session = none ? null : program.training.days.find(d => d.wd === isoWeekday(key));
  const now = key === today();
  const freeOn = hasFree(entry) || freeOpenKey === key;
  const freeLink = freeOn ? "" : `<div><button class="link" id="free-open">${tx("Serbest antrenman ekle")}</button></div>`;

  if (none) return `
    <section>
      <h2>${tx("Spor programın kapalı")}</h2>
      <button class="ghost" id="plan-on">${tx("Spor programı kur")}</button>
      ${freeLink}
    </section>
    ${freeOn ? freeCard(entry, key) : ""}`;

  if (!session || !session.b){
    const nx = now ? nextSession(program, key) : null;
    const head = !now ? tx("O gün dinlenme günüydü")
      : nx ? tx("Bugün dinlenme · Sıradaki: {0}, {1}", [WD_NAMES[nx.wd], esc(nx.t)]) : tx("Bugün dinlenme");
    return `
    <section>
      <h2>${head}</h2>
      ${freeLink}
    </section>
    ${freeOn ? freeCard(entry, key) : ""}`;
  }

  const list = exercisesOf(session);
  const venue = venueOf(program);
  const lifts = entry.lifts || {};
  const doneN = list.filter(n => liftHas(lifts[n])).length;

  return `
  <section>
    <h2>${esc(session.t)} <span class="count">${tx("{0}/{1} hareket", [(doneN), (list.length)])}</span></h2>
    ${list.map(name => {
      const ex = parseEx(name, venue);
      return `<div class="lift lift-ok">
        <div class="lift-main"><div class="lift-name">${esc(exText(ex.name))}</div>${ex.sub ? `<div class="lift-sub">${esc(exText(ex.sub))}</div>` : ""}${howLink(name)}</div>
        ${liftHas(lifts[name]) ? `<svg class="ico lift-tick" role="img" aria-label="${tx("tamam")}"><use href="#i-check"/></svg>` : ""}
      </div>`;
    }).join("")}
    <button id="wo-start" style="margin-top:14px;padding:18px 16px;font-size:17px">${doneN ? tx("Antrenman moduna dön") : tx("Antrenmanı başlat")}</button>
  </section>
  ${hasFree(entry) ? freeCard(entry, key) : ""}`;
}

/* Bugün antrenman yoksa sıradaki antrenman günü. */
function nextSession(program, key){
  const days = program.training.days.filter(d => d.b);
  const wd = isoWeekday(key);
  let best = null, bestGap = 99;
  for (const d of days){
    const gap = ((d.wd - wd) % 7 + 7) % 7 || 7;
    if (gap < bestGap){ bestGap = gap; best = d; }
  }
  return best;
}

function wireTrain(key){
  const woBtn = document.getElementById("wo-start");
  if (woBtn) woBtn.onclick = openWorkout;
  app.querySelectorAll("[data-howgo]").forEach(b => b.onclick = () => goHow(b.dataset.howgo));
  const fo = document.getElementById("free-open");
  if (fo) fo.onclick = () => { freeOpenKey = key; render(); };
  wireFree(key);
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
        <button class="sheet-x" aria-label="${tx("Kapat")}">×</button></div>
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
    title: tx("Kalori nereden hesaplansın?"),
    body: tx("Bu güne elle <b>{0} kcal</b> girilmişti. Beslenme günlüğüne kalem eklersen kalori bundan sonra günlükten hesaplanır ve elle girdiğin değer kaybolur.", [(entry.kcal)]),
    ok: tx("Günlükten hesapla"), cancel: tx("Vazgeç") });
  if (yes) delete entry.kcalManual;
  return yes;
}
