"use strict";

/* ---- takvim ---- */
const MEASURES = [["weight","kg"],["sleep","sa"],["kcal","kcal"],["water","ml"]];

function dayStatus(k){
  const d = state.days[k];
  if (!d) return "none";
  const tot = d.tasks ? d.tasks.length : 0;
  const done = d.tasks ? d.tasks.filter(t => t.done).length : 0;
  const hasData = MEASURES.some(([f]) => typeof d[f] === "number");
  if (tot && done === tot) return "done";
  if (tot) return "partial";
  return hasData ? "data" : "none";
}

/* Boş gün: o güne dair hiçbir şey girilmemiş.
   Ölçüm, beslenme günlüğü, antrenman kaydı, vücut ölçüsü ya da
   tamamlanmış bir görev — biri bile varsa gün boş sayılmaz. */
function dayEmpty(k){
  const d = state.days[k];
  if (!d) return true;
  if (dataCount(k)) return false;
  if (d.log && d.log.length) return false;
  if (d.lifts && Object.keys(d.lifts).length) return false;
  if (hasFree(d)) return false;
  if (typeof d.steps === "number") return false;
  if (d.body && Object.keys(d.body).some(f => typeof d.body[f] === "number")) return false;
  if (d.tasks && d.tasks.some(t => t.done)) return false;
  return true;
}

function dataCount(k){
  const d = state.days[k];
  return d ? MEASURES.filter(([f]) => typeof d[f] === "number").length : 0;
}

/* ---- gün puanı ----
   Bir günün ne kadarının tamamlandığı, o günün görev listesinden değil
   verisinden hesaplanır: programın o güne düşürdüğü öneriler tek tek girilen
   veriye karşı değerlendirilir. Gün hiç açılmamış olsa da çalışır, ve geçmiş
   bir güne sonradan veri girilince gün kendiliğinden yeşile kayar.
   Elle eklenen görevler (tekrar edenler dahil) olduğu gibi sayılır. */
let _progCache, _scoreCache = new Map();
/* saveState betiğin başlarında tanımlı; bu satırlar henüz çalışmamış olabilir. */
function calcReset(){ try { _progCache = undefined; _scoreCache.clear(); } catch(e){} }
function cachedProgram(){
  if (_progCache === undefined) _progCache = currentProgram();
  return _progCache;
}

/* O gün için ölçülemeyecek öneri puana katılmaz; yoksa gün hiç tamamlanamaz.
   Protein yalnızca beslenme günlüğünden bilinir: günlüğü olmayan geçmiş bir
   gün kalori, su, uyku, kilo ve antrenmandan değerlendirilir. */
function skipTask(kind, k, d){
  return kind === "protein" && k !== today() && !(d && d.log && d.log.length);
}

/* Puana giren öneriler: görünen listeyle sayacın aynı şeyi söylemesi için. */
function scoredTasks(list, k, d, program){
  return list.filter(t => !skipTask(taskKind(t), k, d)
    && !!autoInfo(t, d || { tasks: [] }, program, k));
}

/* ---- yıldız damgası ----
   Bir gün bir kez tamamlandığında güne damga yazılır. Hedefler sonradan
   değişse de (kilo, ortam, program) o günün yıldızı ve serideki yeri
   korunur; geriye dönük silinmez. Günün bütün verisi silinirse damga da
   kalkar — o zaman kullanıcı o günü bilerek boşaltmıştır. */
function stampStar(k){
  const d = state.days[k];
  if (!d) return false;
  if (dayEmpty(k)){
    if (d.star){ delete d.star; return true; }
    return false;
  }
  const { done, total } = dayScore(k);
  const tam = total && done >= total;
  if (tam && !d.star){ d.star = true; return true; }
  /* Bugün hâlâ düzenlenen gün: yanlış girilen bir değeri silince yıldız da
     geri alınır. Geçmiş günlerin damgası ise dokunulmaz kalır — hedefler
     sonradan değişse bile kazanılmış yıldız silinmesin diye. */
  if (!tam && d.star && k === today()){ delete d.star; return true; }
  return false;
}

/* Sürüm geçişi: şu an tamamlanmış görünen günler damgalanır, böylece
   bu değişiklikten önce kazanılmış yıldızlar olduğu gibi kalır. */
function stampAllStars(){
  let changed = false;
  for (const k of Object.keys(state.days)) if (stampStar(k)) changed = true;
  return changed;
}

function dayScore(k){
  const hit = _scoreCache.get(k);
  if (hit) return hit;
  const program = cachedProgram();
  const d = state.days[k];
  const e = d || { tasks: [] };
  const stored = (d && d.tasks) || [];
  let done = 0, total = 0;
  if (program){
    for (const title of suggestedTitles(program, k)){
      if (skipTask(taskKind({ title }), k, d)) continue;
      const a = autoInfo({ title, suggested:true }, e, program, k);
      /* Otomatik ölçütü olmayan öneri (dinlenme günü esnemesi) puana girmez:
         hiç açılmamış bir günde işaretlenemeyeceği için günü kilitliyordu.
         Listede öneri olarak durmaya devam eder. */
      if (!a) continue;
      total++;
      if (a.ok) done++;
    }
  }
  for (const x of stored) if (!x.suggested){ total++; if (x.done) done++; }
  const out = { done, total };
  _scoreCache.set(k, out);
  return out;
}

/* Görevlerin ne kadarı bitti: 0..1, değerlendirilecek bir şey yoksa null. */
function dayRatio(k){
  const { done, total } = dayScore(k);
  return total ? done / total : null;
}
/* Yoğunluk basamağı: renk tonunu belirler. */
/* Kırmızıdan yeşile tek bir ölçek: hiç veri yoksa "e" (en kırmızı),
   sonra tamamlanan görev oranına göre 1→5. */
function dayLevel(k){
  if (dayEmpty(k)) return "e";
  const r = dayRatio(k);
  const lit = fullDay(k);
  /* Bugünün en üst basamağı ayrı renk taşır. */
  if (lit && k === today()) return "t";
  if (lit) return 5;
  if (r === null) return 2;          /* veri var ama değerlendirilecek hedef yok */
  if (r >= 1) return 5;
  if (r >= 0.67) return 4;
  if (r >= 0.34) return 3;
  if (r > 0) return 2;
  return 1;
}

/* Bir ayın geçmiş günleri: bu ay için bugüne kadar, eski aylarda tamamı.
   Bugün henüz bitmediği için boş gün sayımına katılmaz. */
function monthCount(y, m){
  const t = today();
  const total = new Date(y, m, 0).getDate();
  let full = 0, logged = 0, empty = 0, days = 0;
  for (let d = 1; d <= total; d++){
    const k = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    if (k > t) break;
    days++;
    if (dayRatio(k) >= 1) full++;
    if (dataCount(k)) logged++;
    if (k !== t && dayEmpty(k)) empty++;
  }
  return { full, logged, empty, days };
}

function monthSummary(y, m, total){
  const t = today();
  const { full, logged, empty } = monthCount(y, m);
  const pm = new Date(y, m - 2, 1);
  const prev = monthCount(pm.getFullYear(), pm.getMonth() + 1);
  /* En uzun seri bugüne kadar geriye doğru, ay sınırını aşarak sayılır. */
  let best = 0, run = 0, cur = 0;
  for (let i = 400; i >= 0; i--){
    const k = shiftDays(t, -i);
    if (k > t) break;
    if (dayRatio(k) >= 1) { run++; best = Math.max(best, run); } else run = 0;
  }
  cur = run;
  return { full, logged, empty, days: monthCount(y, m).days, best, cur, prev,
           prevLabel: pm.toLocaleDateString(locale(), { month:"long" }) };
}

/* Oranlar tam sayıya yuvarlanır; gün yoksa çizgi. */
const pctOf = (n, d) => d ? `%${Math.round(n / d * 100)}` : "—";

/* Geçen ayla kıyas oran üzerinden: yarım ay ile tam ay ancak böyle
   karşılaştırılabilir. Fark yüzde puan olarak verilir. */
function monthCompare(sum){
  if (!sum.prev.days || !sum.days) return "";
  const p = (n, d) => n / d * 100;
  const dF = Math.round(p(sum.full, sum.days) - p(sum.prev.full, sum.prev.days));
  const dE = Math.round(p(sum.empty, sum.days) - p(sum.prev.empty, sum.prev.days));
  const part = (n, iyi, kotu) => n === 0 ? null : `${Math.abs(n)} puan ${n > 0 ? iyi : kotu}`;
  const bits = [part(dF, "daha çok tam gün", "daha az tam gün"),
                part(dE, "daha çok boş gün", "daha az boş gün")].filter(Boolean);
  return `<div class="metric-note" style="margin-top:14px">${bits.length
    ? `${sum.prevLabel} ayına göre ${bits.join(", ")}.`
    : `${sum.prevLabel} ayıyla aynı oranda gidiyorsun.`}</div>`;
}

function calendarView(){
  const [y, m] = calMonth.split("-").map(Number);
  const firstWd = (() => { const w = new Date(y, m-1, 1).getDay(); return w === 0 ? 7 : w; })();
  const total = new Date(y, m, 0).getDate();
  const t = today();
  const thisMonth = t.slice(0,7);
  const program = currentProgram();

  const cells = [];
  for (let i = 1; i < firstWd; i++) cells.push(`<div class="cal-day blank"></div>`);

  for (let d = 1; d <= total; d++){
    const k = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const isToday = k === t, isFuture = k > t;
    /* Bugün henüz bitmedi; boş diye kırmızıya boyanmaz. */
    const empty = !isFuture && !isToday && dayEmpty(k);
    const lv = isFuture ? 0 : (isToday && dayEmpty(k)) ? 0 : dayLevel(k);
    const r = isFuture ? null : dayRatio(k);
  
    const cls = ["cal-day", isFuture ? "future" : "", isToday ? "now" : "", calSel === k ? "sel" : ""]
      .filter(Boolean).join(" ");
    const label = empty ? "hiç veri girilmemiş"
      : r === null ? "kayıt yok"
      : r >= 1 ? "tüm görevler tamam" : `görevlerin %${Math.round(r*100)}'i`;

    cells.push(`<button class="${cls}" data-day="${k}" data-lv="${lv}"
        aria-label="${d} ${WD_NAMES[isoWeekday(k)]}, ${label}${isFuture ? "" : marksLabel(k, program) + " — özetini aç"}">
      <span class="cal-n">${d}</span>
      ${isFuture ? "" : dayMarks(k, program)}
    </button>`);
  }

  const monthLabel = new Date(y, m-1, 1).toLocaleDateString(locale(), { month:"long", year:"numeric" });
  const sum = monthSummary(y, m, total);

  return `
  <section>
    <div class="cal-head">
      <button class="cal-nav" id="cal-prev" aria-label="Önceki ay"><svg class="ico" aria-hidden="true"><use href="#i-prev"/></svg></button>
      <div class="m">${monthLabel}</div>
      <button class="cal-nav" id="cal-next" aria-label="Sonraki ay" ${calMonth >= thisMonth ? "disabled" : ""}><svg class="ico" aria-hidden="true"><use href="#i-next"/></svg></button>
    </div>
    <div class="cal-grid">
      ${["Pt","Sa","Ça","Pe","Cu","Ct","Pz"].map(w => `<div class="cal-wd">${w}</div>`).join("")}
      ${cells.join("")}
    </div>
    <div class="cal-scale">
      <i data-lv="e"></i><span>veri yok</span>
      ${[1,2,3,4,5].map(n => `<i data-lv="${n}"></i>`).join("")}
      <span>görevler tamam</span>
      <i data-lv="t"></i><span>bugün tamam</span>
    </div>
    <div class="cal-key">
      <span><i class="m-w"></i>kilo</span>
      <span><i class="m-k"></i>kalori hedefte</span>
      <span><i class="m-k out"></i>hedef dışında</span>
      <span><svg class="ico cal-lift" aria-hidden="true"><use href="#i-plan"/></svg>antrenman</span>
    </div>
  </section>

  ${skyGallery()}
  <section>
    <h2>${monthLabel}</h2>
    <div class="cal-stats">
      <div class="stat"><b>${pctOf(sum.full, sum.days)}</b><span>tam gün</span></div>
      <div class="stat"><b>${pctOf(sum.empty, sum.days)}</b><span>boş gün</span></div>
      <div class="stat"><b>${streakNow()}</b><span>güncel seri</span></div>
      <div class="stat"><b>${sum.best}</b><span>en uzun seri</span></div>
    </div>
    ${monthCompare(sum)}
    <div class="metric-note" style="margin-top:8px">Oranlar ${monthLabel} içinde geçen ${sum.days} güne göre. Seriler her zaman bugüne kadar sayılır.</div>
  </section>
  <div id="day-detail">${dayDetail()}</div>`;
}

/* ---- takvim işaretleri ----
   Hücrede üç sessiz işaret: kare = kilo ölçülmüş, daire = kalori girilmiş
   (içi dolu ise hedef bandında, halka ise dışında), dambıl = antrenman
   kaydedilmiş. Hepsi currentColor ile çizilir ki koyu ve açık hücrelerde
   aynı okunurlukta kalsın; renk yerine biçim ayırt eder. */
function kcalMark(k, program){
  const d = state.days[k];
  if (!d || typeof d.kcal !== "number" || !program) return null;
  return (d.kcal > program.kcal * 1.1 || d.kcal < program.kcal * 0.9) ? "out" : "ok";
}
function liftMark(k){
  const d = state.days[k];
  if (hasFree(d)) return true;
  return !!(d && d.lifts && Object.values(d.lifts).some(liftHas));
}
function dayMarks(k, program){
  const d = state.days[k];
  if (!d) return "";
  const w = typeof d.weight === "number";
  const kc = kcalMark(k, program);
  const lf = liftMark(k);
  if (!w && !kc && !lf) return "";
  return `<span class="cal-marks" aria-hidden="true">
    ${w ? `<i class="m-w"></i>` : ""}
    ${kc ? `<i class="m-k${kc === "out" ? " out" : ""}"></i>` : ""}
    ${lf ? `<svg class="ico cal-lift" aria-hidden="true"><use href="#i-plan"/></svg>` : ""}
  </span>`;
}
function marksLabel(k, program){
  const d = state.days[k];
  if (!d) return "";
  const out = [];
  if (typeof d.weight === "number") out.push(`${kg1(d.weight)} kg`);
  const kc = kcalMark(k, program);
  if (kc) out.push(`${d.kcal} kcal, hedef bandının ${kc === "ok" ? "içinde" : "dışında"}`);
  if (liftMark(k)) out.push(hasFree(state.days[k])
    ? `${freeLabel(state.days[k].free)} kaydı var` : "antrenman kaydı var");
  return out.length ? ", " + out.join(", ") : "";
}

/* ---- gün özeti ----
   Takvimde bir güne dokununca o gün buraya açılır; düzenlemek istersen
   giriş ekranına oradan geçilir. Sekme değiştirmeden gezinmeyi sağlar. */
function dayDetail(){
  if (!calSel) return `<section><div class="empty">Bir güne dokun: o günün özeti burada açılır.</div></section>`;
  const k = calSel, t = today();
  if (k > t) return `<section><div class="empty">${prettyDate(k)} henüz gelmedi.</div></section>`;

  const d = state.days[k] || {};
  const program = currentProgram();
  const empty = dayEmpty(k);
  const tasks = d.tasks || [];
  const doneT = tasks.filter(x => x.done).length;
  const session = (program && !program.training.none)
    ? program.training.days.find(x => x.wd === isoWeekday(k)) : null;
  const exN = session && session.b ? exercisesOf(session) : [];
  const liftN = exN.filter(n => liftHas((d.lifts || {})[n])).length;
  const logN = (d.log || []).length;

  const row = (lbl, val, note) => `<div class="macro"><span class="lbl">${lbl}${
    note ? `<div class="metric-note">${note}</div>` : ""}</span><span class="v num">${val}</span></div>`;

  return `<section>
    <div class="dd-h">
      <div><b>${prettyDate(k)}</b><i>${weekdayName(k)}${k === t ? " · bugün" : ""}</i></div>
      <button class="ghost" id="dd-edit">${empty ? "Veri gir" : "Düzenle"}</button>
    </div>
    ${empty ? `<div class="empty" style="margin-top:14px">Bu güne hiç veri girilmemiş.${
        k === t ? " Gün bitmediği için takvimde kırmızı görünmüyor." : " Takvimde kırmızı görünmesinin sebebi bu."}</div>` : `
    ${row("Kilo", typeof d.weight === "number" ? `${kg1(d.weight)} kg` : "—")}
    ${row("Kalori", typeof d.kcal === "number" ? `${d.kcal} kcal` : "—",
        typeof d.kcal === "number" && program
          ? (kcalMark(k, program) === "ok" ? "hedef bandında" : `hedef ${program.kcal} kcal`)
          : logN ? `${logN} kalem girilmiş` : "")}
    ${row("Uyku", typeof d.sleep === "number" ? durTxt(Math.round(d.sleep * 60)) : "—")}
    ${row("Su", typeof d.water === "number" ? `${d.water} ml` : "—",
        program && typeof d.water === "number" ? `hedef ${program.water} ml` : "")}
    ${session && session.b ? row("Antrenman", `${liftN}/${exN.length}`, esc(session.t)) : ""}
    ${hasFree(d) ? row("Antrenman", d.free.min ? `${d.free.min} dk` : "yapıldı", esc(freeLabel(d.free))) : ""}
    ${tasks.length ? row("Görevler", `${doneT}/${tasks.length}`) : ""}`}
  </section>`;
}

function wireCalendar(){
  const step = n => {
    const [y,m] = calMonth.split("-").map(Number);
    const d = new Date(y, m-1+n, 1);
    calMonth = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    render();
  };
  document.getElementById("cal-prev").onclick = () => step(-1);
  const next = document.getElementById("cal-next");
  if (!next.disabled) next.onclick = () => step(1);

  app.querySelectorAll("[data-day]").forEach(b => b.onclick = () => {
    const k = b.dataset.day;
    if (k > today()) { toast("Gelecek bir gün; girişi o gün geldiğinde açılır."); return; }
    calSel = k;
    saveState(state); render();
    document.getElementById("day-detail")?.scrollIntoView({ behavior:"smooth", block:"center" });
  });

  const edit = document.getElementById("dd-edit");
  if (edit) edit.onclick = () => {
    const k = calSel;
    resetMealUI();
    if (k !== today()) ensureDay(k);
    viewDate = k === today() ? null : k;
    tab = "today";
    saveState(state); render(); window.scrollTo(0,0);
  };

}
