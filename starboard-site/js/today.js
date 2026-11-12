"use strict";

/* ---- bugün ---- */
/* ---- hafta şeridi ----
   Takvime gitmeden son yedi gün arasında gezilir; seçilen gün çok eskiyse
   şerit o günün çevresine kayar. */
const LV_WORD = { e:tx("veri yok"), t:tx("tamamlandı"), 5:tx("tamamlandı"), 4:tx("çoğu tamam"), 3:tx("yarısı tamam"), 2:tx("az tamam"), 1:tx("başlandı") };
function weekStrip(key){
  const t = today();
  let end = t;
  if (key < shiftDays(t, -6)){ const c = shiftDays(key, 3); end = c > t ? t : c; }
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(shiftDays(end, -i));
  return `<div class="wk" role="group" aria-label="${tx("Gün seç")}">${days.map(k => {
    const lv = dayLevel(k);
    return `<button class="wk-d" data-wk="${k}" data-lv="${lv}" aria-current="${k === key}"
      aria-label="${prettyDate(k)} ${weekdayName(k)}, ${k === t ? tx("bugün, ") : ""}${LV_WORD[lv] || ""}">
      <span class="wk-n">${k === t ? tx("Bugün") : WD_SHORT[isoWeekday(k)]}</span><b class="num">${+k.slice(8)}</b><i></i></button>`;
  }).join("")}</div>
  ${key !== t ? `<div class="wk-back"><button class="link" id="back-today">${tx("Bugüne dön")}</button></div>` : ""}`;
}

/* ---- akşam kapanış satırı ----
   21:00'den sonra günün durumu tek cümlede: kaç hedef tamam, ne eksik.
   Eksik olana dokununca girişi açılır. */
const EVE_WORD = [tx("Hiçbir"),tx("Bir"),tx("İki"),tx("Üç"),tx("Dört"),tx("Beş"),tx("Altı"),tx("Yedi"),tx("Sekiz"),tx("Dokuz"),tx("On")];
function eveMiss(kind, entry, program, a){
  switch (kind){
    case "water": { const need = Math.round(program.water * 0.9); return tx("su {0} eksik", [(fmtV(Math.max(need - (entry.water || 0), 0)))]); }
    case "protein": { const need = Math.round(program.protein * 0.9);
      const v = entry.log && entry.log.length ? logTotals(entry).p : 0; return tx("protein {0} g eksik", [(Math.max(need - v, 0))]); }
    case "kcal": { const B = kcalBand(program);
      if (typeof entry.kcal !== "number") return tx("kalori girilmedi");
      return entry.kcal > B.hi ? tx("kalori {0} kcal fazla", [(entry.kcal - B.hi)]) : tx("kalori {0} kcal eksik", [(B.lo - entry.kcal)]); }
    case "sleep": return typeof entry.sleep === "number" ? tx("uyku hedefin altında") : tx("uyku girilmedi");
    case "weigh": return tx("kilo girilmedi");
    case "steps": return tx("{0} adım eksik", [(Math.max(stepGoal() - (entry.steps || 0), 0))]);
    case "train": { const m = /^(\d+)\/(\d+)/.exec(a.txt || ""); return m ? tx("antrenmanda {0} hareket eksik", [(m[2] - m[1])]) : tx("antrenman eksik"); }
  }
  return "";
}
function eveningLine(entry, program, key){
  if (key !== today() || nowHour() < 21 || !program) return "";
  let done = 0, total = 0;
  const miss = [];
  for (const t of entry.tasks){
    if (!t.suggested){
      total++;
      if (t.done) done++; else miss.push(["own", tx("“{0}” duruyor", [(t.title)])]);
      continue;
    }
    const kind = taskKind(t);
    if (skipTask(kind, key, entry)) continue;
    const a = autoInfo(t, entry, program, key);
    if (!a) continue;
    total++;
    if (a.ok) done++; else miss.push([kind, eveMiss(kind, entry, program, a)]);
  }
  if (!total) return "";
  const head = done >= total ? tx("Bütün hedefler tamam")
             : done === 0 ? tx("Henüz tamamlanan hedef yok") : tx("{0} hedef tamam", [(EVE_WORD[done] || done)]);
  return `<div class="eve" role="status">${icon("star4")}
    <div><b>${head}</b>${miss.length ? ", " + miss.slice(0, 2).map(([k, txt]) =>
      `<button data-goto="${k}">${esc(txt)}</button>`).join(", ")
      + (miss.length > 2 ? tx(" ve {0} hedef daha", [(miss.length - 2)]) : "") + "." : tx("; bugünün yıldızı yandı.")}</div></div>`;
}

/* ---- bugün ---- */
function goalHero(key, sc){
  const now = key === today();
  const pct = sc.total ? clamp(sc.done / sc.total, 0, 1) : 0;
  const full = !!sc.total && sc.done >= sc.total;
  const C = 2 * Math.PI * 34;
  const off = +(C * (1 - pct)).toFixed(1);
  const entering = render.lastTab !== "today" || !!navDir;
  const prevOff = entering || _ringPrev[key] === undefined ? +C.toFixed(1) : _ringPrev[key].off;
  const bump = !entering && _ringPrev[key] && _ringPrev[key].done !== sc.done;
  const rollFrom = String(bump && !reduceMotion() ? _ringPrev[key].done : sc.done);
  _ringPrev[key] = { off, done: sc.done };
  const w = weekInfo(weekStart(today())), streak = streakNow();
  const title = !sc.total ? tx("Hedef yok") : full ? (now ? tx("Bugün tamam") : tx("Gün tamam")) : tx("{0} hedef kaldı", [(sc.total - sc.done)]);
  const sub = !now ? `${prettyDate(key)} · ${weekdayName(key)}`
            : full ? tx("Bugünün yıldızı yandı.") : tx("Satıra dokun, olduğu yerde gir.");
  return `<div class="gh${full ? " full" : ""}${now ? "" : " past"}">
    <div class="gh-ring">
      <svg viewBox="0 0 84 84" aria-hidden="true">
        <circle class="gh-bg" cx="42" cy="42" r="34"/>
        <circle class="gh-fg" cx="42" cy="42" r="34" transform="rotate(-90 42 42)"
          stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${reduceMotion() ? off : prevOff}" data-to="${off}"/>
      </svg>
      <span class="gh-n num${bump ? " bump" : ""}" aria-label="${tx("{0} hedeften {1} tamam", [(sc.total), (sc.done)])}"><b class="roll" data-v="${rollFrom}" data-to="${sc.done}">${rollHTML(rollFrom)}</b>/${sc.total}</span>
    </div>
    <div class="gh-t"><b>${title}</b><i>${sub}</i>
      <button class="gh-s" id="gh-cal">${icon("star4")}<span>${tx("{0} günlük seri · bu hafta {1}/7", [(streak), (w.n)])}</span></button></div>
  </div>`;
}

const GOAL_ICON = { kcal:"grain", protein:"poultry", water:"dairy", sleep:"rest", weigh:"legs", steps:"walk" };

/* Hedefin girişi satırın altında açılır; başka sayfaya gidilmez. */
function goalEditor(kind, entry, program, key){
  const val = v => (typeof v === "number" ? v : "");
  const now = key === today();
  const logged = !!(entry.log && entry.log.length);
  switch (kind){
    case "weigh": return `<div class="g-f"><label for="i-weight">${tx("Kilo ({0})", [(wUnit())])}</label>
      <input id="i-weight" type="number" inputmode="decimal" value="${typeof entry.weight === "number" ? +wOut(entry.weight).toFixed(1) : ""}" placeholder="—"></div>`;
    case "sleep": return sleepHTML(entry);
    case "water": return `
      <div class="lbl-row"><span class="lbl">${tx("Bardak bardak işaretle")}</span><span class="lbl-v num">${vOut(entry.water || 0)}${program ? ` / ${vOut(program.water)}` : ""} ${vUnit()}</span></div>
      ${cupsHTML(entry.water, program && program.water)}
      <div class="water-exact"><label for="i-water">${tx("Tam miktar ({0})", [(vUnit())])}</label>
        <input id="i-water" type="number" inputmode="numeric" value="${typeof entry.water === "number" ? vOut(entry.water) : ""}" placeholder="—"></div>`;
    case "kcal": return `<div class="g-f"><label for="i-kcal">${tx("Kalori (kcal)")}</label>
        <input id="i-kcal" type="number" inputmode="numeric" value="${val(entry.kcal)}" placeholder="—"${logged ? " disabled" : ""}></div>
      ${logged
        ? `<div class="metric-note" style="margin-top:7px">${tx("Beslenme günlüğündeki {0} kalemden hesaplandı.", [(entry.log.length)])}</div>`
        : `<div class="chips"><button class="chip" data-add-kcal="200">+200</button><button class="chip" data-add-kcal="400">+400</button><button class="chip" data-add-kcal="600">+600</button></div>`}
      <button class="ghost" data-goto="kcal" style="margin-top:12px">${logged ? tx("Beslenme günlüğünü aç") : tx("Yediklerini tek tek gir")}</button>`;
    case "steps": return `<div class="g-f"><label for="i-steps">${tx("Adım sayısı")}</label>
        <input id="i-steps" type="number" inputmode="numeric" value="${val(entry.steps)}" placeholder="—"></div>`;
    case "train": {
      const ses = program.training.days.find(d => d.wd === isoWeekday(key));
      if (!ses) return "";
      return `<div class="metric-note">${esc(exText(ses.b))}</div>
        <button class="ghost" id="go-train" style="margin-top:12px">${now ? tx("Antrenmana başla") : tx("Antrenmanı kaydet")}</button>`;
    }
  }
  return "";
}

function goalRow(t, entry, program, key){
  const info = t.suggested ? autoInfo(t, entry, program, key) : null;
  if (!info){
    /* Elle işaretlenen hedef: kendi görevlerin ve dinlenme günü esnemesi. */
    return `<div class="g" data-done="${t.done ? 1 : 0}"${t.suggested ? "" : " data-own"}>
      <div class="g-h">
        <button class="check" data-done="${t.done ? 1 : 0}" data-id="${t.id}" aria-label="${esc(t.title)}: ${tx("tamamlandı olarak işaretle")}"></button>
        <span class="g-m"><b>${esc(t.suggested ? tx(t.title) : t.title)}</b>${t.rt ? `<i>${tx("her gün tekrar eder")}</i>` : ""}</span>
        ${t.suggested ? "" : `<button class="del" data-del="${t.id}" aria-label="${esc(t.title)}: ${tx("sil")}">×</button>`}
      </div></div>`;
  }
  const kind = taskKind(t), open = goalOpen === kind;
  const ses = kind === "train" ? program.training.days.find(d => d.wd === isoWeekday(key)) : null;
  const ic = kind === "train" ? ((ses && ses.icon) || "fullbody") : GOAL_ICON[kind];
  const seen = _doneSeen[key];
  if (info.ok && seen && !seen.has(kind)) _justAt[key + kind] = Date.now();
  const just = info.ok && Date.now() - (_justAt[key + kind] || 0) < 1000;
  return `<div class="g${open ? " open" : ""}${just ? " just" : ""}" data-done="${info.ok ? 1 : 0}" data-kind="${kind}">
    <button class="g-h" data-goal="${kind}" aria-expanded="${open}">
      ${iconBox(ic)}
      <span class="g-m"><b>${esc(info.label || info.title)}</b><i${info.warn ? ` class="warn"` : ""}>${esc(info.txt)}</i>
        ${info.ok ? "" : `<span class="task-bar"><i style="width:${clamp(info.pct * 100, 0, 100).toFixed(0)}%"></i></span>`}</span>
      ${info.ok ? `<span class="g-ok" aria-label="${tx("tamam")}">${icon("star4")}</span>`
                : `<svg class="ico task-chev" aria-hidden="true"><use href="#i-next"/></svg>`}
    </button>
    ${open ? `<div class="g-b${goalJust === kind ? " anim" : ""}"><div class="g-bi">${goalEditor(kind, entry, program, key)}</div></div>` : ""}
  </div>`;
}

function todayView(entry, program, key){
  key = key || today();
  const now = key === today();
  const vis = entry.tasks.filter(t => !t.suggested || !skipTask(taskKind(t), key, entry));
  /* Veriyle işaretlenenler üstte, elle işaretlenenler altta. */
  const auto = t => !!(t.suggested && autoInfo(t, entry, program, key));
  const shown = vis.filter(auto).concat(vis.filter(t => !auto(t)));
  const sc = dayScore(key);
  const rows = shown.map(t => goalRow(t, entry, program, key)).join("");
  _doneSeen[key] = new Set(shown.filter(t => t.suggested).map(t => [taskKind(t), autoInfo(t, entry, program, key)])
    .filter(([, a]) => a && a.ok).map(([k2]) => k2));

  return `
  ${weekStrip(key)}
  ${eveningLine(entry, program, key)}
  ${program ? goalHero(key, sc) : `<section class="welcome">
    <span class="brand-i">${BRAND_SVG}</span>
    <b>${tx("Starboard hazır")}</b>
    <i>${tx("Kilonu girdiğinde günün hedefleri burada belirir.")}</i>
    <button id="np-go">${tx("Kilonu gir")}</button>
  </section>`}

  <section class="gl" id="goal-list">
    ${rows}
    <button class="ghost" id="goal-add">${tx("＋ Hedef ekle")}</button>
  </section>

  ${notice && now ? `<div class="notice">${iconBox("day")}<div>${esc(notice)}</div></div>` : ""}

  ${now ? skyCard() : ""}`;
}

/* Kapalıyken de bir şey söylesin: son kilo ve kaç günlük veri var. */
function reviewCount(){
  const w = lastWeight();
  const n = Object.keys(state.days || {}).filter(k => typeof state.days[k].weight === "number").length;
  return w !== null ? tx("{0} · {1} ölçüm", [(fmtW(w)), (n)]) : tx("henüz ölçüm yok");
}

/* ---- otomatik güncellenen program önerileri ----
   Her öneri girilen verilerden hesaplanır: başlık güncel hedefi taşır,
   koşul sağlanınca kendiliğinden işaretlenir. Elle işaretleme de çalışır;
   veri koşulu sağladığında elle verilen karar yerini otomatiğe bırakır. */
/* Kalori aralığı hedefe göre değişir.
   Yağ kaybı: hedefin altı serbest ama güvenli sınıra kadar. Alt sınır üç
   ölçünün en yükseği: hedefin 500 kcal altı, bakım kalorisinin 1000 kcal
   altı (NICE'ın denetimsiz önerdiği en büyük açık) ve bazal metabolizmaya
   dayalı taban (erkekte 1500, kadında 1200 kcal'den az değil).
   Koruma: hedefin ±%10'u. Kas kazanımı: bakımın %5-20 üstü (Iraki ve ark. 2019). */
function kcalBand(program){
  const T = program.tdee, G = program.kcal, goal = state.profile.goal;
  const floor = Math.round(Math.max(program.bmr * 0.95, sexK(state.profile.sex, 1500, 1200)));
  if (goal === "lose"){
    const lo = Math.round(Math.max(floor, G - 500, T - 1000)), hi = Math.round(G * 1.05);
    return { G, T, lo, hi,
      okMsg: v => v < G ? tx("açığın {0} kcal, güvenli aralıkta", [(T - v)]) : tx("hedefte"),
      overMsg: v => v > T ? tx("bakım kalorinin üstündesin, bugün açık oluşmadı") : tx("hedefin {0} kcal üstündesin, açık küçüldü", [(v - G)]),
      underMsg: v => tx("açık {0} kcal; bu kadar düşük kalori kas kaybı ve yorgunluk riskini artırır, {1} kcal altına inme", [(T - v), (lo)]) };
  }
  if (goal === "gain"){
    const lo = Math.round(T * 1.05), hi = Math.round(T * 1.20);
    return { G, T, lo, hi,
      okMsg: v => tx("fazlalığın {0} kcal", [(v - T)]),
      overMsg: v => tx("fazlalık {0} kcal; bu kadarı kas yerine çoğunlukla yağ olarak depolanır", [(v - T)]),
      underMsg: v => v < T ? tx("bakım kalorinin altındasın, kas kazanımı için fazlalık gerekli") : tx("fazlalık kas kazanımı için yetersiz kaldı") };
  }
  const lo = Math.round(G * 0.9), hi = Math.round(G * 1.1);
  return { G, T, lo, hi,
    okMsg: v => Math.abs(v - G) < 20 ? tx("tam hedefte") : v > G ? tx("hedefin {0} kcal üstü, tolerans içinde", [(v - G)]) : tx("hedefin {0} kcal altı, tolerans içinde", [(G - v)]),
    overMsg: v => tx("hedefin {0} kcal üstündesin, uzun sürerse kilo artışı olur", [(v - G)]),
    underMsg: v => tx("hedefin {0} kcal altındasın, uzun sürerse kilo kaybı olur", [(G - v)]) };
}

function taskKind(t){
  if (t.kind) return t.kind;
  const x = t.title || "";
  /* Yeni görevler Türkçe başlıkla kaydedilir. 1.5.0'dan önce İngilizce modda
     oluşturulanlar İngilizce başlık taşır; onlar da tanınır. */
  if (/^Workout:/.test(x)) return "train";
  if (/^(Walk )?[\d.,]+ steps$/.test(x)) return "steps";
  if (/^Keep calories between|kcal target$/.test(x)) return "kcal";
  if (/g of protein$/.test(x)) return "protein";
  if (/ml of water$|^Drink .* of water$/.test(x)) return "water";
  if (/^Sleep [\d-]+ hours$/.test(x)) return "sleep";
  if (/^Morning weigh-in$/.test(x)) return "weigh";
  return /^Antrenman:/.test(x) ? "train" : /kcal hedefini tut/.test(x) ? "kcal"
       : /g protein al/.test(x) ? "protein" : /ml su iç/.test(x) ? "water"
       : /saat uyu/.test(x) ? "sleep" : /kilo ölçümü/.test(x) ? "weigh"
       : /^\d+ adım at$/.test(x) ? "steps" : null;
}

function autoInfo(t, entry, program, key){
  key = key || today();
  const kind = taskKind(t);
  if (!kind || !program) return null;
  switch (kind){
    case "kcal": {
      const B = kcalBand(program);
      const has = typeof entry.kcal === "number";
      const v = has ? entry.kcal : 0;
      const title = tx("Kaloriyi {0}–{1} kcal arasında tut", [(B.lo), (B.hi)]);
      /* gün bitmeden az yemek henüz sorun değil; geçmiş günde gün zaten bitti */
      const late = key < today() || new Date().getHours() >= 20;
      if (!has) return { title, ok:false, pct:0, txt:tx("Hedef {0} kcal · kalori girilmedi", [(B.G)]),
        why:tx("Kalori ya da beslenme günlüğü girilince kendiliğinden işaretlenir.") };
      if (v > B.hi) return { title, ok:false, pct:1, warn:true, txt:`${v} kcal · ${B.overMsg(v)}`,
        why:tx("Üst sınır {0} kcal. {1}.", [(B.hi), (B.overMsg(v))]) };
      if (v < B.lo){
        const gap = B.lo - v;
        return late
          ? { title, ok:false, pct:v/B.lo, warn:true, txt:`${v} kcal · ${B.underMsg(v)}`, why:B.underMsg(v) + "." }
          : { title, ok:false, pct:v/B.lo, txt:tx("{0} kcal · aralığa {1} kcal kaldı", [(v), (gap)]),
              why:tx("Alt sınır {0} kcal; {1} kcal daha alınca işaretlenir.", [(B.lo), (gap)]) };
      }
      return { title, ok:true, pct:1, txt:`${v} kcal · ${B.okMsg(v)}` };
    }
    case "protein": {
      const has = entry.log && entry.log.length;
      const v = has ? logTotals(entry).p : 0, g = program.protein, need = Math.round(g*0.9);
      return { title:tx("{0} g protein al", [g]), ok: v >= need, pct: v/need,
        txt: has ? `${v} / ${g} g` : tx("Beslenme günlüğüne ekledikçe dolar"),
        why:tx("Hedefin %90'ı olan {0} g'a ulaşınca işaretlenir. Şu an {1} g.", [(need), (v)]) };
    }
    case "water": {
      const v = entry.water || 0, g = program.water, need = Math.round(g*0.9);
      return { title:tx("{0} su iç", [(fmtV(g))]), ok: v >= need, pct: v/need, txt:`${vOut(v)} / ${fmtV(g)}`,
        why:tx("{0} olunca işaretlenir. {1} kaldı.", [(fmtV(need)), (fmtV(Math.max(need - v, 0)))]) };
    }
    case "sleep": {
      const v = typeof entry.sleep === "number" ? entry.sleep : null;
      const [lo, hi] = sleepBand();
      const long = v !== null && v > hi + 0.5;
      return { title:tx("{0}-{1} saat uyu", [lo, hi]), ok: v !== null && v >= lo, pct: v === null ? 0 : v/lo, warn: long || (v !== null && v < lo - 1),
        txt: v === null ? tx("Uyku girilmedi") : durTxt(Math.round(v*60)) + (long ? tx(" · düzenli olarak {0} saati aşmak yorgunluk işareti olabilir", [(hi)]) : v < lo ? tx(" · {0} saatin altında", [(lo)]) : ""),
        why: v === null ? tx("Uyku kadranıyla girince işaretlenir.") : tx("Kendi hedefin en az {0} saat.", [(lo)]) };
    }
    case "weigh": {
      const v = typeof entry.weight === "number" ? entry.weight : null;
      const gun = key === today() ? tx("Bugün") : tx("O gün");
    return { title:tx("Sabah kilo ölçümü"), ok: v !== null, pct: v === null ? 0 : 1,
        txt: v === null ? tx("{0} tartılmadın", [(gun)]) : tx("{0} girildi", [(fmtW(v))]),
        why:tx("{0}ün kilosu girilince işaretlenir.", [(gun)]) };
    }
    case "steps": {
      const g = stepGoal();
      if (!g) return null;
      const v = typeof entry.steps === "number" ? entry.steps : 0;
      return { title:tx("{0} adım at", [(g)]), ok: v >= g, pct: v/g, txt:tx("{0} / {1} adım", [(v), (g)]),
        why:tx("{0} adıma ulaşınca işaretlenir. {1} adım kaldı.", [(g), (Math.max(g - v, 0))]) };
    }
    case "train": {
      const ses = program.training.days.find(d => d.wd === isoWeekday(key));
      if (!ses || !ses.b) return null;
      const list = exercisesOf(ses);
      const n = list.filter(x => liftHas((entry.lifts || {})[x])).length;
      /* title kayıtta görevi tanıtır; ekranda gün adı zaten "Antrenman A" gibiyse önek tekrarlanmaz. */
      const word = tx("Antrenman").toLocaleLowerCase();
      const label = ses.t.toLocaleLowerCase().includes(word) ? ses.t : tx("Antrenman: {0}", [(ses.t)]);
      return { title:tx("Antrenman: {0}", [(ses.t)]), label, ok: n === list.length, pct: n/list.length,
        txt:tx("{0}/{1} hareket kaydedildi", [(n), (list.length)]),
        why:tx("Antrenman kaydındaki bütün hareketler girilince işaretlenir.") };
    }
  }
  return null;
}

/* Dinlenme günü esnemesi: otomatik ölçütü yok, elle işaretlenir. */
const isRestTask = t => /^(Dinlenme günü|Rest day)/.test(t.title || "");

/* Bugünün önerilerini verilerle eşitler; bir şey değiştiyse true döner. */
function syncSuggested(entry, program, key){
  let changed = false;
  for (const t of entry.tasks){
    if (!t.suggested) continue;
    const a = autoInfo(t, entry, program, key);
    if (!a) continue;
    const kind = taskKind(t);
    if (t.kind !== kind){ t.kind = kind; changed = true; }
    /* Kayıttaki başlık Türkçe kalır; başka dilde yalnızca ekranda çevrilir. */
    if (LANG === "tr" && t.title !== a.title){ t.title = a.title; changed = true; }
    if (t.man !== undefined){ delete t.man; changed = true; }
    if (t.done !== a.ok){ t.done = a.ok; changed = true; }
  }
  return changed;
}

/* Öneriye dokununca verinin girildiği yere gidilir. */
const GOTO_LABEL = { kcal:tx("beslenme günlüğüne git"), protein:tx("beslenme günlüğüne git"), water:tx("su girişine git"),
  sleep:tx("uyku girişine git"), weigh:tx("kilo girişine git"), train:tx("antrenman kaydına git"), steps:tx("adım girişine git") };
function openFold(key){
  state.ui = state.ui || {}; state.ui.fold = state.ui.fold || {};
  state.ui.fold[key] = true;
}
function goToTask(kind, key){
  if (kind === "kcal" || kind === "protein"){
    tab = "meals"; mealTab = "log"; render(); window.scrollTo(0,0); return;
  }
  if (kind === "train"){
    tab = "plan"; planTab = "log"; render(); window.scrollTo(0,0); return;
  }
  tab = "today";
  if (kind !== "own"){ if (goalOpen !== kind) goalJust = kind; goalOpen = kind; }
  render();
  const el = kind === "own" ? app.querySelector(".g[data-own]")
           : app.querySelector(`[data-goal="${kind}"]`)?.closest(".g");
  if (!el) return;
  el.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block:"center" });
  el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1400);
  if (kind === "weigh") setTimeout(() => document.getElementById("i-weight")?.focus({ preventScroll:true }), 350);
  if (kind === "steps") setTimeout(() => document.getElementById("i-steps")?.focus({ preventScroll:true }), 350);
}

function taskRow(t, info){
  return `<div class="task" data-done="${t.done?1:0}">
    <button class="check" data-done="${t.done?1:0}" data-id="${t.id}" aria-label="${tx("Tamamlandı olarak işaretle")}"></button>
    ${info ? `<button class="task-title task-go" data-goto="${taskKind(t)}" aria-label="${esc(t.title)}: ${GOTO_LABEL[taskKind(t)]}">` : `<span class="task-title">`}<span class="tt">${esc((info && info.label) || (t.suggested ? tx(t.title) : t.title))}</span>${info ? `<span class="task-sub${info.warn ? " warn" : ""}">${info.warn ? "⚠️ " : ""}${esc(info.txt)}</span>
      ${info.ok ? "" : `<span class="task-bar"><i style="width:${clamp(info.pct*100,0,100).toFixed(0)}%"></i></span>`}` : ""}${info ? `</button><svg class="ico task-chev" aria-hidden="true"><use href="#i-next"/></svg>` : `</span>`}
    ${t.suggested ? "" : `<button class="del" data-del="${t.id}" aria-label="${tx("Sil")}">×</button>`}
  </div>`;
}

function wirePastBar(key){
  const bt = document.getElementById("back-today");
  if (bt) bt.onclick = () => {
    viewDate = null; calSel = today();
    saveState(state); render(); window.scrollTo(0,0);
  };
  const go = d => {
    const k = shiftDays(key, d);
    if (k >= today()) { viewDate = null; calSel = today(); }
    else { ensureDay(k); viewDate = k; calSel = k; }
    resetMealUI();          /* açık besin paneli başka güne taşınmasın */
    saveState(state); render(); window.scrollTo(0,0);
  };
  const pp = document.getElementById("pd-prev"); if (pp) pp.onclick = () => go(-1);
  const pn = document.getElementById("pd-next"); if (pn) pn.onclick = () => go(1);
}

function wireToday(entry, program, key){
  key = key || today();
  /* mark: elle girildiğini kaydeden bayrak; günlük devralmadan önce sorulur. */
  /* conv: ekrandaki birimden kayıttaki metrik değere çevirir (units.js). */
  const bind = (id, field, int, mark, conv) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.onchange = async () => {
      const n = num(el.value);
      if (n === null){ delete entry[field]; if (mark) delete entry[mark]; }
      else { entry[field] = conv ? conv(n) : int ? Math.round(n) : n; if (mark) entry[mark] = true; }
      await saveState(state); render();
    };
  };
  bind("i-weight","weight",false,null,wSave);
  wireSleep(entry);
  app.querySelectorAll("[data-cup]").forEach(b => b.onclick = async () => {
    const i = +b.dataset.cup, cur = cupsOf(entry.water);
    const n = (i + 1 === cur) ? i : i + 1;          /* son dolu bardağa dokunmak onu boşaltır */
    if (n) entry.water = Math.round(n * cupMl()); else delete entry.water;
    await saveState(state); render();
  });
  bind("i-kcal","kcal",true,"kcalManual"); bind("i-water","water",true,null,vIn);
  const st = document.getElementById("i-steps");
  if (st) st.onchange = async () => {
    const n = num(st.value);
    if (n === null || n < 0) delete entry.steps; else entry.steps = Math.round(n);
    await saveState(state); render();
  };

  app.querySelectorAll("[data-goal]").forEach(b => b.onclick = () => {
    const k = b.dataset.goal;
    if (k === "protein"){ navTo(() => goToTask("protein", key), 1); return; }
    if (goalOpen === k){
      const row = b.closest(".g");
      goalOpen = null;
      if (reduceMotion()){ render(); return; }
      row.classList.add("closing");
      setTimeout(render, 190);
      return;
    }
    goalOpen = k; goalJust = k;
    render();
  });
  goalJust = null;
  /* halka eski değerinden yenisine dolar; yeni biten hedef parıldar */
  const fg = app.querySelector(".gh-fg[data-to]");
  if (fg) requestAnimationFrame(() => requestAnimationFrame(() => { fg.style.strokeDashoffset = fg.dataset.to; }));
  app.querySelectorAll(".g.just .g-ok").forEach(el => setTimeout(() => sparkle(el), 200));
  const rn = app.querySelector(".gh-n b.roll");
  if (rn && rn.dataset.to !== rn.dataset.v) requestAnimationFrame(() => requestAnimationFrame(() => rollSet(rn, rn.dataset.to)));
  app.querySelectorAll("[data-wk]").forEach(b => b.onclick = () => {
    const k = b.dataset.wk;
    if (k === key) return;
    navTo(() => {
      if (k >= today()){ viewDate = null; calSel = today(); }
      else { ensureDay(k); viewDate = k; calSel = k; }
      goalOpen = null; resetMealUI();
      saveState(state); render();
    }, k > key ? 1 : -1, "k-day");
  });
  const ga = document.getElementById("goal-add");
  if (ga) ga.onclick = () => openGoalSheet(key);
  const gc = document.getElementById("gh-cal");
  if (gc) gc.onclick = () => { tab = "calendar"; render(); window.scrollTo(0,0); };

  const quick = (attr, field) => app.querySelectorAll(`[data-${attr}]`).forEach(b => b.onclick = async () => {
    entry[field] = (entry[field] || 0) + parseInt(b.dataset[attr === "add-water" ? "addWater" : "addKcal"], 10);
    if (field === "kcal") entry.kcalManual = true;
    await saveState(state); render();
  });
  quick("add-water","water"); quick("add-kcal","kcal");

  app.querySelectorAll(".check[data-id]").forEach(b => b.onclick = async () => {
    const t = entry.tasks.find(x => String(x.id) === b.dataset.id);
    if (!t) return;
    const info = t.suggested ? autoInfo(t, entry, currentProgram(), key) : null;
    if (info){
      toast(info.ok ? tx("Bu görev girdiğin verilerden işaretlendi.") : tx("Henüz tamamlanmadı. {0}", [(info.why || "")]));
      return;
    }
    t.done = !t.done;
    await saveState(state); render();
    if (t.done){
      const nb = app.querySelector(`.check[data-id="${b.dataset.id}"]`);
      sparkle(nb);
    }
  });

  app.querySelectorAll("[data-goto]").forEach(b => b.onclick = () => goToTask(b.dataset.goto, key));

  app.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
    entry.tasks = entry.tasks.filter(x => String(x.id) !== b.dataset.del);
    await saveState(state); render();
  });

  const gtr = document.getElementById("go-train");
  if (gtr) gtr.onclick = () => { tab = "plan"; planTab = "log"; render(); window.scrollTo(0,0); };
  wireFolds();

}

/* Vücut ölçüleri Ben sayfasında girilir. */
function wireBody(entry){
  if (!entry) return;
  const yagEl = document.getElementById("bd-yag");
  if (yagEl) yagEl.onchange = async () => {
    const n = num(yagEl.value);
    entry.body = entry.body || {};
    if (n === null || n <= 2 || n >= 70) delete entry.body.yag; else entry.body.yag = Math.round(n*10)/10;
    if (!Object.keys(entry.body).length) delete entry.body;
    /* Program hesabı en son girilen yağ oranını kullansın. */
    const last = bodySeries("yag", 3650).pop();
    if (last) state.profile.bodyFat = last.v;
    await saveState(state); render();
  };

  BODY.forEach(([k]) => {
    const el = document.getElementById("bd-" + k);
    if (!el) return;
    el.onchange = async () => {
      entry.body = entry.body || {};
      const n = num(el.value);
      if (n === null) delete entry.body[k]; else entry.body[k] = lIn(n);
      if (!Object.keys(entry.body).length) delete entry.body;
      await saveState(state); render();
    };
  });
}
