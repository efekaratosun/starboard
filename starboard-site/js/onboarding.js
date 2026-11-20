"use strict";

/* ---- kişiselleştirme verileri ---- */

/* Kaçınılacak bölge: hareketi daha güvenli bir karşılığıyla değiştirir,
   karşılığı yoksa programdan çıkarır. Sıra önemli: özel olan önce. */
const AVOID_ZONES = [["diz",tx("Diz")], ["bel",tx("Bel")], ["omuz",tx("Omuz")], ["bilek",tx("Bilek")]];
const AVOID_SWAP = {
  diz: [
    [/pistol|shrimp|jump squat|lunge sıçrama|sıçrama/, tx("Glute bridge")],
    [/bulgarian|split squat|lunge|step-up|duvar oturuşu/, tx("Glute bridge")],
    [/leg press|leg extension|goblet squat|front squat|sandalye squat|çantalı squat|squat/, tx("Hip thrust")],
    [/nordic|leg curl/, tx("Glute bridge")],
    [/tepe sprint|merdiven sprint|sprint|koşu|yüksek diz|burpee|mountain climber|plank jack|ip atlama/, null]
  ],
  bel: [
    [/romen deadlift|deadlift/, tx("Leg curl")],
    [/barbell row|kettlebell row|havlu kürek|ters kürek|kürek/, tx("Face pull")],
    [/swing|türk kalkışı|farmer|good morning/, tx("Goblet squat")],
    [/superman|dragon flag|hollow rock|hollow hold/, tx("Dead bug")]
  ],
  omuz: [
    [/handstand şınav|handstand|pike şınav/, tx("Face pull")],
    [/omuz press|tek kol press|dumbbell press/, tx("Face pull")],
    [/dips/, tx("Triceps")],
    [/muscle-up/, tx("Barfiks")],
    [/yan omuz/, null]
  ],
  bilek: [
    [/handstand|l-sit|v-sit/, null],
    [/elmas şınav|pike şınav|şınav/, tx("Sandalye dips")],
    [/burpee|mountain climber|plank jack/, tx("Yüksek diz")],
    [/plank serisi|yan plank|plank/, tx("Dead bug")]
  ]
};

/* Hareket metninin set/tekrar kısmını koruyarak adı değiştirir. */
function swapEx(str, rules){
  const m = str.match(/^(.*?)(\s*\d+\s*(?:×|set\b).*)$/);
  const base = (m ? m[1] : str).trim(), tail = m ? m[2] : "";
  if (!base){
    /* Sayıyla başlayan metinler ("8×25 m sprint"): ada yer yok, eşleşirse çıkarılır. */
    const all = str.toLocaleLowerCase("tr");
    return rules.some(([rx]) => rx.test(all)) ? null : str;
  }
  const l = base.toLocaleLowerCase("tr");
  for (const [rx, to] of rules) if (rx.test(l)) return to === null ? null : to + tail;
  return str;
}
const zoneHits = (text, zone) => (AVOID_SWAP[zone] || []).some(([rx]) => rx.test(text.toLocaleLowerCase("tr")));

/* Değişiklik durana kadar bütün bölgeleri uygular; dönüp duruyorsa hareketi çıkarır. */
function applyZones(ex, avoid){
  let cur = ex;
  for (let pass = 0; pass < 5; pass++){
    let changed = false;
    for (const z of avoid){
      const r = swapEx(cur, AVOID_SWAP[z] || []);
      if (r === null) return null;
      if (r !== cur){ cur = r; changed = true; }
    }
    if (!changed) return cur;
  }
  return null;
}

function applyAvoid(b, avoid){
  if (!avoid || !avoid.length || !b) return b;
  /* Devre metni tek parça; içinde kaçınılan hareket varsa devre tümden çıkar. */
  if (/^\d+ tur:/.test(b))
    return avoid.some(z => zoneHits(b, z)) ? tx("Yürüyüş 30 dk") : b;
  const out = [], seen = new Set();
  for (const ex of b.split(" · ")){
    const cur = applyZones(ex, avoid);
    if (!cur) continue;
    const key = parseEx(cur, "gym").name.toLocaleLowerCase("tr");
    if (seen.has(key)) continue;
    seen.add(key); out.push(cur);
  }
  return out.length ? out.join(" · ") : tx("Yürüyüş 30 dk");
}

/* Uyku hedefi: alt sınır profilden, üst sınır iki saat üstü. */
const sleepMin = () => clamp((state && state.profile && state.profile.sleepMin) || 7, 5, 10);
const sleepBand = () => [sleepMin(), sleepMin() + 2];

/* Tema: otomatik ise telefonun ayarı geçerli. */
function applyTheme(t){
  const r = document.documentElement;
  if (t === "light" || t === "dark") r.dataset.theme = t; else delete r.dataset.theme;
  themeNow = t || "auto";
  nativeStatusBar(themeNow === "dark" || (themeNow === "auto" && sysDark()));
}
/* "Telefonu izle" seçiliyken telefon koyu moda geçince durum çubuğu da uysun. */
let themeNow = "auto";
if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (themeNow === "auto") applyTheme("auto"); });

/* Öğün düzeni kalıpları: [ad, saat, kategori, ağırlık] */
const MEAL_PRESETS = [
  [tx("3 öğün"), [[tx("Kahvaltı"),8,"kahvalti",30],[tx("Öğle"),13,"ogle",40],[tx("Akşam"),20,"aksam",40]]],
  [tx("3 öğün + ara öğün"), [[tx("Kahvaltı"),8,"kahvalti",30],[tx("Öğle"),13,"ogle",35],[tx("Ara öğün"),16,"ara",15],[tx("Akşam"),20,"aksam",35]]],
  [tx("2 öğün"), [[tx("Öğle"),13,"ogle",45],[tx("Akşam"),20,"aksam",45]]],
  [tx("5 öğün"), [[tx("Kahvaltı"),8,"kahvalti",25],[tx("Kuşluk"),11,"ara",12],[tx("Öğle"),14,"ogle",30],[tx("İkindi"),17,"ara",12],[tx("Akşam"),20,"aksam",30]]]
];
function mealsFromPreset(i){
  const set = (MEAL_PRESETS[i] || MEAL_PRESETS[1])[1];
  const stamp = Date.now().toString(36);
  return set.map(([name, h, cat, w], j) => ({ id:`m${j}${stamp}`, name, h, cat, w }));
}

/* İlk ekranda birkaç besin, aramada kataloğun tamamı. */
function wireObFoods(){
  const input = document.getElementById("ob-exclude");
  const results = document.getElementById("ob-exclude-results");
  const draw = () => {
    const query = input.value.trim();
    const hits = query.length >= 2 ? searchFoods(query, 10).map(([k]) => k)
      : ["mantar", "sut", "patlican", "zeytin"];
    const automatic = query.length >= 2 ? hits : hits.filter(k => automaticFoodAllowed(k, []));
    const keys = [...new Set([...ob.exclude, ...automatic])];
    results.innerHTML = obChips("obfood", keys.map(k => [esc(k), esc(foodOf(k).n), ob.exclude.includes(k)]));
  };
  input.oninput = draw;
  results.onclick = ev => {
    const b = ev.target.closest("[data-obfood]");
    if (!b) return;
    const k = b.dataset.obfood, i = ob.exclude.indexOf(k);
    if (i >= 0) ob.exclude.splice(i, 1); else ob.exclude.push(k);
    b.classList.toggle("sel", i < 0);
    b.setAttribute("aria-pressed", String(i < 0));
  };
  draw();
}

/* Hazır günlük hatırlatmalar */
const ROUTINE_IDEAS = ["D vitamini", tx("Multivitamin"), tx("Omega-3"), tx("Magnezyum"),
  tx("İlaçlarımı al"), tx("10 bin adım"), tx("Esneme"), tx("Akşam yürüyüşü")];

/* ---- ilk giriş: adım adım ---- */
let obStep = 0, ob = null;

/* Birim başlangıcı: bayrak menüsünden yapılan seçim (dil değişince sayfa yenilenir) > Türkçe = metrik > bölge tahmini. */
function obUnitsStart(){
  if (window.STARBOARD_UNITS === "metric" || window.STARBOARD_UNITS === "imperial") return window.STARBOARD_UNITS;
  try { const u = sessionStorage.getItem(OB_UNIT_KEY); if (UNIT_SYSTEMS.some(x => x[0] === u)) return u; } catch(e){}
  return LANG === "tr" ? "metric" : detectUnits();
}
function obDefaults(){
  return { name:"", sex:"", avatar:undefined,
    goal:"maintain", targetWeight:null, activity:"moderate", sleepMin:7,
    venue:"gym", days:null, avoid:[],
    diet:"hepsi", mealSet:1, cuisine:LANG === "tr" ? "tr" : "intl", exclude:[], birthParts:["", "", ""],
    theme:"auto", routines:[], units:obUnitsStart() };
}
const OB_DEFAULT_DAYS = a => PATTERN[(a === "sedentary" || a === "light") ? 3 : a === "moderate" ? 4 : a === "veryActive" ? 7 : 5].slice();

/* Marka işareti: ikonun aynısı, ilk adımda gösterilir. */
const BRAND_SVG = `<svg viewBox="0 0 180 180" aria-hidden="true"><defs><linearGradient id="sbi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--logo-gradient-start)"/><stop offset="1" stop-color="var(--logo-gradient-end)"/></linearGradient></defs><rect width="180" height="180" rx="40" fill="url(#sbi)"/><g fill="var(--logo-ink)"><rect x="39.0" y="125.2" width="17.6" height="16.9" rx="6.0"/><rect x="63.6" y="107.6" width="17.6" height="34.5" rx="6.0"/><rect x="88.2" y="90.7" width="17.6" height="51.3" rx="6.0"/><rect x="112.9" y="73.1" width="17.6" height="68.9" rx="6.0"/><path d="M121.6 26.7 L125.5 41.1 L139.9 45.0 L125.5 48.9 L121.6 63.3 L117.8 48.9 L103.4 45.0 L117.8 41.1Z"/></g></svg>`;

/* ---- ilk giriş: konuya göre beş ekran ----
   Seçimler yalnızca işaretlenir; sonraki ekrana hep "İleri" ile geçilir. */
const OB_ICON = {
  diet:{ hepsi:"meat", vejetaryen:"egg", vegan:"veg", pesketaryen:"fish", glutensiz:"potato", laktozsuz:"nuts", helal:"poultry", koser:"meat" }
};

const OB_MOVES = {
  sedentary:"M12 10v6h6v5M7 13v6h6m-4 0v3m3-10 4 2",
  light:"M12 9v6l-4 6m4-6 5 6M8 14l4-4 5 3",
  moderate:"M13 9l-2 6-6 5m6-5 6 5M7 13l6-3 5 2",
  active:"M14 9l-3 6-6 2m6-2 7 5M8 11l5 1 6-4",
  veryActive:"M15 8l-4 7-6 4m6-4 7 1 3 4M9 12l5-1 6-5M3 9h4m-5 4h3",
  gym:"M12 11v5l-4 6m4-6 4 6M4 5v5m16-5v5M3 7.5h18M7 8l2 5 3-2 3 2 2-5",
  home:"M3 19h18M5 11l4 6h7l4 2m-9-2 3-4 4 1",
  outdoor:"M14 10l-3 6-6 4m6-4 6 1 3 4M8 14l5-3 6-3",
  calisthenics:"M3 3h18M8 3v6l4 3 4-3V3m-4 9v5l-3 5m3-5 3 5",
  kettlebell:"M12 11v5l-5 6m5-6 5 6m-9-9 4 2 4-2m-6 5h4m-3-2v2m2-2v2",
  mobility:"M12 10v6l-6 4h12l-6-4M4 12l4 3 4-4 4 4 4-3",
  swim:"M2 17q2-2 4 0t4 0t4 0t4 0t4 0m-19 4q2-2 4 0t4 0t4 0t4 0l3 1M14 11l-4 3-4 1m7-3-2-6-5-1"
};
function obArt(kind, k){
  let art;
  if (kind === "goal"){
    const planet = { lose:[3,15,-25], maintain:[3.8,17,0], gain:[4.6,19,27] }[k];
    const [size, x, angle] = planet;
    art = `<circle cx="12" cy="12" r="${size}"/><ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(${angle} 12 12)"/>
      <circle cx="${x}" cy="${k === "maintain" ? 17 : 6}" r="2" fill="currentColor"/>`;
  } else if (kind === "meal"){
    const food = ["M8 12h3m4-3v6", "M8 9l2 2m4 0 2 2m-7 3h3", "M9 9v5h6V9z", "M8 15l3-6 4 6z"][k];
    art = `<ellipse cx="12" cy="12" rx="9.5" ry="8"/><ellipse cx="12" cy="12" rx="7.5" ry="6"/><path d="${food}"/>`;
  } else {
    const [x,y] = (kind === "venue"
      ? { gym:[12,7], home:[5,8], outdoor:[14,6], calisthenics:[12,8], kettlebell:[12,7], mobility:[12,7], swim:[17,11] }
      : { sedentary:[12,6], light:[12,5], moderate:[13,5], active:[14,5], veryActive:[16,5] })[k];
    const antenna = kind === "venue" ? `<path d="M${x-1.6} ${y-2}l-1-2m4 2 1-3"/><circle cx="${x-1}" cy="${y}" r=".35"/><circle cx="${x+1}" cy="${y}" r=".35"/>` : "";
    art = `<path d="${OB_MOVES[k]}"/><circle cx="${x}" cy="${y}" r="${kind === "venue" ? 2.7 : 2.1}"/>${antenna}`;
  }
  return `<span class="ico-wrap ob-art" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">${art}</svg></span>`;
}

function obCard(on, val, ic, label, desc, showCheck = true){
  return `<button type="button" class="oc${on ? " on" : ""}" data-oc="${val}" aria-pressed="${on}">
    ${Array.isArray(ic) ? obArt(...ic) : ic ? iconBox(ic) : ""}<span class="oc-m"><b>${label}</b>${desc ? `<i>${desc}</i>` : ""}</span>
    ${showCheck ? `<span class="oc-c" aria-hidden="true">${icon("check")}</span>` : ""}</button>`;
}
const obCards = (field, rows, cls, isNum) => `<div class="ocs${cls ? " " + cls : ""}" data-field="${field}"${isNum ? ' data-num="1"' : ""}>${rows.map(([v, ic, l, d]) =>
  obCard(String(ob[field]) === String(v), v, ic, l, d, field !== "sex")).join("")}</div>`;
const obChips = (attr, rows) => `<div class="chips on-chips">${rows.map(([v, l, on]) =>
  `<button type="button" class="chip${on ? " sel" : ""}" data-${attr}="${v}" aria-pressed="${!!on}">${l}</button>`).join("")}</div>`;
const og = (title, inner, opt, id) => `<div class="og"${id ? ` id="${id}"` : ""}>
  <div class="og-t">${title}${opt ? ` <span>${tx("isteğe bağlı")}</span>` : ""}</div>${inner}</div>`;

/* ---- dönen rakamlar ---- */
const ROLL_COL = "0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9";
function rollHTML(str){
  return [...String(str)].map(ch => /\d/.test(ch)
    ? `<span class="rd"><span style="transform:translateY(-${ch}em)">${ROLL_COL}</span></span>`
    : `<span class="rs">${ch}</span>`).join("");
}
function rollSet(el, str){
  str = String(str);
  const cur = el.dataset.v || "";
  if (cur === str) return;
  el.dataset.v = str;
  const same = cur.length === str.length && [...str].every((c, i) => /\d/.test(c) === /\d/.test(cur[i]));
  if (!same || reduceMotion()){ el.innerHTML = rollHTML(str); return; }
  const cols = el.querySelectorAll(".rd > span");
  let j = 0;
  for (const c of str) if (/\d/.test(c)) cols[j++].style.transform = `translateY(-${c}em)`;
}

/* ---- sürüklemeli cetvel ----
   Yatay kaydırılan çizgili şerit; ortadaki iğnenin altındaki değer seçilir.
   Cetvel ekrandaki birimle çalışır (cm ya da inç, kg ya da lb); ob[field] her zaman
   metrik kalır. cv: { to: metrikten ekrana, from: ekrandan metriğe, fmt: değer metni, lbl: çizgi etiketi } */
const RULER_CV = {};
const rulerVal = (f, min, max, step) => clamp(+(Math.round(RULER_CV[f].to(ob[f]) / step) * step).toFixed(2), min, max);
function obRuler(field, min, max, step, tw, majorEvery, midEvery, unit, dec, cv){
  cv = RULER_CV[field] = { to: v => v, from: v => v, fmt: v => dec ? fmtFix(v, 1) : String(v), lbl: v => +v.toFixed(1), ...cv };
  const n = Math.round((max - min) / step);
  let ticks = "";
  for (let i = 0; i <= n; i++){
    const v = min + i * step;
    ticks += i % majorEvery === 0 ? `<i class="M" data-l="${cv.lbl(v)}"></i>` : i % midEvery === 0 ? `<i class="m"></i>` : `<i></i>`;
  }
  const val = rulerVal(field, min, max, step);
  const txt = cv.fmt(val);
  const name = field === "height" ? tx("Boy") : tx("Kilo");
  return `<div class="rl" data-rl="${field}" data-min="${min}" data-max="${max}" data-step="${step}" data-tw="${tw}" style="--tw:${tw}px">
    <button type="button" class="rl-v" aria-label="${tx("{0} değerini elle yaz", [(name)])}">
      <b class="num rl-n" aria-hidden="true">${txt}</b>${unit ? `<span>${unit}</span>` : ""}</button>
    <div class="rl-w">
      <div class="rl-s" tabindex="0" role="slider" aria-label="${name}" aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${val}" aria-valuetext="${txt} ${unit}"><div class="rl-t">${ticks}</div></div>
    </div>
  </div>`;
}
function wireRulers(){
  app.querySelectorAll(".rl").forEach(rl => {
    const f = rl.dataset.rl, min = +rl.dataset.min, max = +rl.dataset.max, step = +rl.dataset.step, tw = +rl.dataset.tw;
    const sc = rl.querySelector(".rl-s"), out = rl.querySelector(".rl-n");
    const cv = RULER_CV[f], fmt = cv.fmt;
    const disp = () => rulerVal(f, min, max, step);
    const toX = v => (v - min) / step * tw;
    const set = v => {
      v = clamp(+(Math.round(v / step) * step).toFixed(2), min, max);
      if (disp() === v) return;
      ob[f] = cv.from(v);
      out.textContent = fmt(v);
      sc.setAttribute("aria-valuenow", v);
      sc.setAttribute("aria-valuetext", fmt(v) + " " + (rl.querySelector(".rl-v span")?.textContent || ""));
    };
    sc.scrollLeft = toX(disp());
    const readPosition = () => {
      if (!sc.isConnected || !ob) return;
      set(min + Math.round(sc.scrollLeft / tw) * step);
    };
    sc.onscroll = readPosition;

    /* fareyle sürükleme (dokunmatikte kaydırma zaten yerel) */
    let drag = null;
    sc.onpointerdown = ev => {
      if (ev.pointerType !== "mouse") return;
      drag = { x: ev.clientX, left: sc.scrollLeft };
      sc.classList.add("drag"); sc.setPointerCapture(ev.pointerId);
    };
    sc.onpointermove = ev => { if (drag) sc.scrollLeft = drag.left - (ev.clientX - drag.x); };
    const end = () => {
      if (!drag) return;
      readPosition();
      drag = null; sc.classList.remove("drag");
      sc.scrollTo({ left: toX(disp()), behavior: reduceMotion() ? "auto" : "smooth" });
    };
    sc.onpointerup = end; sc.onpointercancel = end; sc.onlostpointercapture = end;
    sc.onkeydown = ev => {
      const d = { ArrowRight:1, ArrowUp:1, ArrowLeft:-1, ArrowDown:-1, PageUp:10, PageDown:-10 }[ev.key];
      if (!d && ev.key !== "Home" && ev.key !== "End") return;
      ev.preventDefault();
      set(ev.key === "Home" ? min : ev.key === "End" ? max : disp() + d * step);
      sc.scrollLeft = toX(disp());
    };

    /* rakama dokun: elle yaz */
    const vb = rl.querySelector(".rl-v");
    vb.onclick = () => {
      if (vb.querySelector("input")) return;
      const inp = document.createElement("input");
      inp.type = "number"; inp.inputMode = "decimal"; inp.className = "rl-in"; inp.value = disp();
      inp.setAttribute("aria-label", vb.getAttribute("aria-label"));
      out.hidden = true; vb.insertBefore(inp, out); inp.focus(); inp.select();
      const done = () => {
        const n = num(inp.value);
        inp.remove(); out.hidden = false;
        if (n !== null){ set(n); sc.scrollLeft = toX(disp()); }
      };
      inp.onblur = done;
      inp.onkeydown = ev => { if (ev.key === "Enter"){ ev.preventDefault(); inp.blur(); } };
      inp.onclick = ev => ev.stopPropagation();
    };
  });
}

function obProfile(){
  const profile = {
    height: ob.height, birthDate: ob.birthDate, age: ageFromBirthDate(ob.birthDate), startWeight: ob.weight,
    name: ob.name || undefined,
    bodyFat: ob.bodyFat,
    sex: ob.sex, avatar: avKey(ob),
    activity: ob.activity, goal: ob.goal, noPlan: !!ob.noPlan,
    venue: ob.venue, days: ob.days || OB_DEFAULT_DAYS(ob.activity),
    avoid: ob.avoid.slice(), sleepMin: ob.sleepMin, theme: ob.theme, units: ob.units
  };
  if (ob.targetWeight) profile.targetWeight = Math.round(ob.targetWeight * 10) / 10;
  if (obWeightRange() && ob.targetWeeks) profile.targetWeeks = ob.targetWeeks.slice();
  profile.programId = defaultProgramId(profile.venue, profile.activity, profile.days);
  return profile;
}

const obVal = id => { const e = document.getElementById(id); return e ? e.value : null; };

function obPersonalGoals(){
  const goals = [
    ["sleep", tx("Daha düzenli yatmak")],
    ["water", tx("Daha düzenli su içmek")]
  ];
  return `<details class="og ob-personal" ${ob.personalOpen ? "open" : ""}>
    <summary>${tx("Kişisel hedeflerim")}</summary>
    ${goals.map(([k, label]) => `<label class="ob-check"><input id="ob-personal-${k}" type="checkbox"${ob[k + "Goal"] ? " checked" : ""}>${label}</label>`).join("")}
    ${IS_NATIVE ? `<label class="ob-check"><input id="ob-sleep-notify" type="checkbox"${ob.sleepNotify ? " checked" : ""}>${tx("Yatma vakti hatırlatması")}</label>
      <label class="ob-check"><input id="ob-water-notify" type="checkbox"${ob.waterNotify ? " checked" : ""}>${tx("Su hatırlatması")}</label>
      <label for="ob-med-time">${tx("İlaç hatırlatma saati")}</label><input id="ob-med-time" type="time" value="${ob.medicationAt || ""}">` : ""}
    <label for="ob-personal-custom">${tx("Kişisel hedef ekle")}</label><input id="ob-personal-custom" maxlength="80" value="${esc(ob.customGoal || "")}">
  </details>`;
}

/* İhtiyatlı bir planlama aralığı. Günlük kalori hedefi bu aralığa göre değiştirilmez. */
function obWeightRange(){
  const age = ageFromBirthDate(ob.birthDate);
  const loss = ob.weight - ob.targetWeight;
  const height2 = (ob.height / 100) ** 2;
  if (!ob.weightPlanning || ob.goal !== "lose" || age === null || age < 18
      || !ob.targetWeight || loss <= 0 || loss > ob.weight * .10
      || ob.weight / height2 < 25 || ob.targetWeight / height2 < 20) return null;
  return [Math.max(4, Math.ceil(loss / .5)), Math.max(8, Math.ceil(loss / .25))];
}

function obWeightPreview(){
  const range = ob.targetWeeks || obWeightRange();
  const p = buildProgram(obProfile(), ob.weight, 0);
  const meals = buildMeals(p, 0, { meals:mealsFromPreset(ob.mealSet), diet:ob.diet, cuisine:ob.cuisine, exclude:ob.exclude });
  return `<p>${tx("Hedef kilo ({0})", [wUnit()])} · <b>${fmtW(ob.targetWeight)}</b></p>
    <p>${p.kcal} ${tx("kcal / gün")} · ${p.protein} g ${tx("protein")} · ${p.carb} g ${tx("Karbonhidrat")} · ${p.fat} g ${tx("Yağ")} · ${fmtV(p.water)} ${tx("su")}</p>
    ${p.lbm !== null ? `<p class="metric-note">${tx("Yağ oranı kalori tahminine katıldı.")}</p>` : ""}
    ${og(tx("Önerilen süre aralığı (hafta)"), `<div class="ob-birth">
      <label>${tx("En kısa")}<input id="ob-week-min" type="number" inputmode="numeric" min="${obWeightRange()[0]}" max="104" value="${range[0] ?? ""}"></label>
      <label>${tx("En uzun")}<input id="ob-week-max" type="number" inputmode="numeric" min="${obWeightRange()[0]}" max="104" value="${range[1] ?? ""}"></label></div>
      <p class="metric-note">${tx("Bu aralığı planlama için kullan. Sonuç ve süre kişiden kişiye değişir.")}</p>`)}
    ${og(tx("Örnek öğünler"), `<ul class="ob-example">${meals.meals.filter(m => m.items.some(it => it.key)).map(m =>
      `<li><b>${esc(m.name)}</b><span>${m.items.filter(it => it.key).map(it => esc(it.text)).join(" · ")}</span></li>`).join("")}</ul>`)}`;
}
const OB_STEPS = [
  { id:"welcome" },
  { id:"you", t:tx("Seni tanıyalım"),
    body: () => og(tx("İsmin nedir?"), `<input id="ob-name" class="on-text" type="text" value="${esc(ob.name || "")}" autocomplete="given-name" maxlength="30" aria-label="${tx("İsmin nedir?")}" required>`)
      + og(tx("Cinsiyet"), obCards("sex", [["male", "", tx("Erkek")], ["female", "", tx("Kadın")], ["none", "", tx("Belirtmek İstemiyorum")]], "tri"))
      + og(tx("Avatarın"), avatarPicker(avKey(ob), "on")),
    read: () => { const v = obVal("ob-name"); if (v !== null) ob.name = v.trim().slice(0, 30); },
    wire: () => wireAvatar("on", k => { ob.avatar = k; }),
    valid: () => !ob.name ? [tx("İsmini gir."), "ob-name"]
      : ob.sex ? "" : tx("Bir cinsiyet seçeneği işaretle.") },
  { id:"body", t:tx("Ölçülerin"),
    body: () => {
      if (ob.height == null) ob.height = ob.sex === "female" ? 163 : ob.sex === "male" ? 176 : 170;
      if (ob.weight == null) ob.weight = ob.sex === "female" ? 60 : ob.sex === "male" ? 78 : 70;
      /* İmperialde boy inç cinsinden kayar, 5′10″ diye yazılır; kilo lb. */
      const rulers = isImp()
        ? og(tx("Boy"), obRuler("height", 48, 87, 1, 12, 12, 6, "", false,
              { to: v => v / CM_PER_IN, from: v => Math.round(v * CM_PER_IN * 10) / 10,
                fmt: v => `${Math.floor(v / 12)}′${v % 12}″`, lbl: v => `${v / 12}′` }))
          + og(tx("Kilo"), obRuler("weight", 60, 440, 1, 10, 10, 5, "lb", false,
              { to: v => v / KG_PER_LB, from: v => Math.round(v * KG_PER_LB * 1000) / 1000 }))
        : og(tx("Boy"), obRuler("height", 120, 220, 1, 12, 10, 5, "cm", false))
          + og(tx("Kilo"), obRuler("weight", 30, 200, 0.5, 10, 10, 2, "kg", true));
      return rulers + og(tx("Doğum tarihi"), `<div class="ob-birth" role="group" aria-label="${tx("Doğum tarihi")}">
        ${["Gün", "Doğum ayı", "Yıl"].map((label, i) => `<label>${tx(label)}
          <input id="ob-birth-${i}" type="text" inputmode="numeric" maxlength="${i === 2 ? 4 : 2}"
            autocomplete="bday-${["day", "month", "year"][i]}" value="${esc(ob.birthParts[i])}" required></label>`).join("")}
        </div>`)
        + og(tx("Yağ oranı (%)"), `<input id="ob-bf" aria-label="${tx("Yağ oranı (%)")}" type="number" inputmode="decimal" value="${ob.bodyFat ?? ""}" placeholder="${tx("Opsiyonel")}">`);
    },
    wire: wireRulers,
    read: () => {
      ob.birthParts = [0, 1, 2].map(i => obVal("ob-birth-" + i).trim());
      const [day, month, year] = ob.birthParts;
      ob.birthDate = birthDateFromParts(year, month, day);
      ob.bodyFat = num(obVal("ob-bf"));
    },
    valid: () => {
      const age = ageFromBirthDate(ob.birthDate);
      if (age === null || age < 10 || age > 100) return [tx("10 ile 100 yaş aralığına uyan geçerli bir doğum tarihi gir."), "ob-birth-0"];
      return ob.bodyFat !== null && !(ob.bodyFat >= 3 && ob.bodyFat <= 60) ? [tx("Yağ oranını %3 ile %60 arasında gir ya da boş bırak."), "ob-bf"] : "";
    } },
  { id:"goal", t:tx("Hedefin"),
    body: () => obCards("goal", Object.entries(GOAL).map(([k, v]) => [k, ["goal", k], v.label]))
      + og(tx("Hedef kilon ({0})", [(wUnit())]), `<input id="ob-tw" aria-label="${tx("Hedef kilon ({0})", [(wUnit())])}" type="number" inputmode="decimal" value="${ob.targetWeight != null ? +wOut(ob.targetWeight).toFixed(1) : ""}" placeholder="${Math.round(wOut(ob.weight || 75) * (ob.goal === "gain" ? 1.05 : ob.goal === "lose" ? 0.9 : 1))}">`, true)
      + og(tx("Günlük hareketin"), obCards("activity", Object.entries(ACTIVITY).map(([k, v]) => [k, ["activity", k], v.label, v.d[0].toLocaleUpperCase("tr") + v.d.slice(1)])))
      + `<label class="ob-check" id="ob-planning-label" ${ob.goal === "lose" ? "" : "hidden"}><input id="ob-planning" type="checkbox"${ob.weightPlanning ? " checked" : ""}>
        ${tx("Kilo hedefim için süre aralığı göster. Hamile veya emziriyor değilim ve kilo kaybı için tıbbi gözetim gerektiren bir durumum yok.")}</label>`
      + obPersonalGoals(),
    read: () => {
      const n = num(obVal("ob-tw")), target = n === null ? null : wSave(n);
      if (target !== ob.targetWeight) ob.targetWeeks = null;
      ob.targetWeight = target;
      ob.weightPlanning = document.getElementById("ob-planning").checked;
      ob.personalOpen = app.querySelector(".ob-personal").open;
      for (const [id, k] of [["personal-sleep","sleepGoal"],["personal-water","waterGoal"],["sleep-notify","sleepNotify"],["water-notify","waterNotify"]])
        ob[k] = !!document.getElementById("ob-" + id)?.checked;
      ob.customGoal = obVal("ob-personal-custom").trim().slice(0, 80);
      ob.medicationAt = obVal("ob-med-time");
    },
    valid: () => ob.targetWeight === null || (ob.targetWeight >= 30 && ob.targetWeight <= 300) ? "" : [tx("Hedef kiloyu {0} ile {1} arasında gir ya da boş bırak.", [(fmtW0(30)), (fmtW0(300))]), "ob-tw"] },
  { id:"train", t:tx("Antrenman"),
    body: () => {
      if (!ob.days) ob.days = OB_DEFAULT_DAYS(ob.activity);
      const more = ob.noPlan ? "" : `<div id="og-plan">`
        + og(tx("Nerede?"), obCards("venue", Object.entries(VENUE).map(([k, v]) => [k, ["venue", k], v.label]), "duo"))
        + og(tx("Hangi günler?"), obChips("obday", [1,2,3,4,5,6,7].map(n => [n, WD_SHORT[n], ob.days.includes(n)])))
        + og(tx("Kaçınman gereken bölge"), obChips("obavoid", AVOID_ZONES.map(([k, l]) => [k, l, ob.avoid.includes(k)]))
            + `<div class="metric-note" style="margin-top:10px">${tx("Ağrı veya mevcut bir rahatsızlık durumunda antrenmana başlamadan önce hekiminize danışın.")}</div>`, true)
        + `</div>`;
      return og(tx("Spor programı"), `<div class="ocs" data-field="plan">
          ${obCard(!ob.noPlan, "on", "plan", tx("Program kur"))}
          ${obCard(!!ob.noPlan, "off", "rest", tx("Şimdilik istemiyorum"))}</div>`) + more;
    } },
  { id:"food", t:tx("Beslenme"),
    body: () => og(tx("Nasıl besleniyorsun?"), obCards("diet", dietOptions().map(([k, l]) => [k, OB_ICON.diet[k] || "grain", l]), "duo"))
      + og(tx("Günde kaç öğün besleniyorsun?"), obCards("mealSet", MEAL_PRESETS.map(([l, set], i) => [i, ["meal", i], l, set.map(m => m[0]).join(" · ")]), "", true))
      + og(tx("Yemediklerin"), `<input id="ob-exclude" type="search" aria-label="${tx("Besin ara")}" placeholder="${tx("Besin ara")}" autocomplete="off" aria-controls="ob-exclude-results">
        <div id="ob-exclude-results"></div>`, true),
    wire: wireObFoods },
  { id:"weight-plan", t:tx("Hedef kilo planın"), body:obWeightPreview,
    read: () => { ob.targetWeeks = [num(obVal("ob-week-min")), num(obVal("ob-week-max"))]; },
    valid: () => {
      const [lo, hi] = ob.targetWeeks;
      return Number.isInteger(lo) && Number.isInteger(hi) && lo >= obWeightRange()[0] && hi >= lo && hi <= 104
        ? "" : [tx("Önerilen alt sınırdan başlayarak 104 haftayı aşmayan bir aralık gir."), "ob-week-min"];
    } },
  /* Yalnızca iPhone uygulamasında: hatırlatmalar kapalı gelir, burada açılabilir. */
  { id:"remind", t:tx("Hatırlatmalar"), s:tx("Su, antrenman, uyku ve doğum günü bildirimleri. Sonradan Ayarlar’dan değiştirebilirsin."),
    body: () => `<div class="ocs" data-field="remind">${obCard(ob.remind === "on", "on", "day", tx("Hatırlatmaları aç"))}${obCard(ob.remind !== "on", "off", "rest", tx("Şimdilik istemiyorum"))}</div>` },
  { id:"summary" }
];
const obList = () => OB_STEPS.filter(s => (s.id !== "remind" || IS_NATIVE) && (s.id !== "weight-plan" || obWeightRange()));

/* Girişte logo canlıdır: çubuklar yükselir, yıldız parlar. */
const OB_LOGO = BRAND_SVG.replace(/<rect x=/g, '<rect class="lg-b" x=').replace('<path d=', '<path class="lg-s" d=');
let obBusy = false;

/* Karşılama: logo + slogan + düğme tek blok; altta iki bayrak ve gizlilik satırı.
   Dil yazısı yok: bayraklar simge. İngiltere bayrağı birim menüsünü açar. */
const OB_UNIT_KEY = "starboard-onb-units";
const OB_UNIT_OPTS = [["metric", "kg / cm"], ["imperial", "lb / ft-in"]];
function obWelcome(){
  const flag = k => `<button type="button" class="fl${LANG === k ? " on" : ""}" data-flag="${k}" aria-label="${LANGS.find(l => l[0] === k)[1]}" aria-pressed="${LANG === k}"${k === "en" ? ' aria-haspopup="menu" aria-expanded="false"' : ""}>${FLAG_SVG[k]}</button>`;
  return `<div class="on-q on-w">
    <div class="on-w-brand">
      ${scenePlanet()}
      <span class="on-logo" role="img" aria-label="Starboard">${OB_LOGO}</span>
    </div>
    <h1 class="sr-only">Starboard</h1>
    <p class="on-tag on-slogan">${tx("Her gün, bir önceki günden daha parlak.")}</p>
    <div class="on-w-foot">
      <div class="fl-row">${flag("tr")}<span class="fl-w">${flag("en")}
        <div class="fl-menu" id="fl-menu" role="menu" hidden>${OB_UNIT_OPTS.map(([k, l]) =>
          `<button type="button" role="menuitemradio" aria-checked="${ob.units === k}" data-obunit="${k}"><span>${l}</span><i aria-hidden="true">${icon("check")}</i></button>`).join("")}</div></span></div>
      <p class="on-privacy">${tx("Veriler yalnızca bu cihazda saklanır")}</p>
    </div>
  </div>`;
}

/* Sorular bitince kısa bir ara sahne: plan kurulurken logo çalışır. */
const OB_BUILD = ["mamba mentality", "starboard era"];
function obBuild(){
  return `<div class="on-q on-w on-build">
    <span class="on-lw"><span class="on-orbit" aria-hidden="true"><i></i><i></i><i></i></span><span class="on-logo">${OB_LOGO}</span></span>
    <h1 tabindex="-1" id="ob-build-title">${tx("Planın hazırlanıyor")}</h1>
    <p class="on-tag" id="ob-bl">${OB_BUILD[0]}</p>
  </div>`;
}

function obSummary(){
  const pr = obProfile();
  const p = buildProgram(pr, ob.weight, 0);
  const tr = p.training;
  const tile = (ic, v, u, l) => `<div class="os-t">${iconBox(ic)}<b class="num">${v}<small>${u}</small></b><i>${l}</i></div>`;
  return `<div class="on-q on-s">
    <span class="on-logo sm">${OB_LOGO}</span>
    <h1>${ob.name ? tx("{0}, planın hazır", [(esc(ob.name))]) : tx("Planın hazır")}</h1>
    <p class="on-tag">${tx("{0} hedefine göre günlük hedeflerin:", [(GOAL[ob.goal].label)])}</p>
    <div class="os-k"><b class="num" id="os-kn" data-to="${p.kcal}">${p.kcal}</b><span>${tx("kcal / gün")}</span></div>
    ${p.lbm !== null ? `<p class="metric-note">${tx("Yağ oranı kalori tahminine katıldı.")}</p>` : ""}
    <div class="os-g">
      ${tile("poultry", p.protein, " g", tx("protein"))}
      ${isImp() ? tile("dairy", vOut(p.water), " fl oz", tx("su")) : tile("dairy", fmtFix(p.water / 1000, 1), " L", tx("su"))}
      ${tile("rest", `${ob.sleepMin}-${ob.sleepMin + 2}`, " " + tx("sa"), tx("uyku"))}
    </div>
    <div class="os-p">${iconBox(tr.none ? "rest" : "plan")}<span><b>${tr.none ? tx("Spor programı yok") : esc(tr.title)}</b>
      <i>${tr.none ? tx("İstediğin zaman Program sekmesinden kurabilir ya da kendi programını yazabilirsin.")
        : tx("Haftada {0} gün · {1}", [(tr.freq), (tr.days.filter(d => d.b && !/dinlenme/i.test(d.t)).map(d => WD_SHORT[d.wd]).join(", "))])}</i></span></div>
    <div class="metric-note" style="text-align:center;margin-top:14px">${tx("Hepsini sonradan değiştirebilirsin.")}</div>
    <div class="metric-note" style="text-align:center;margin-top:6px">${tx("Starboard tıbbi danışmanlık sunmaz. Sağlıkla ilgili sorularınız için hekiminize danışın.")}</div>
  </div>`;
}

function obQuestion(st){
  return `<div class="on-q">
    <h1>${st.t}</h1>
    ${st.s ? `<p class="on-sub">${st.s}</p>` : ""}
    <div class="on-body">${st.body()}</div>
    <div id="ob-err" role="alert"></div>
  </div>`;
}

/* Sahneyi yerleştirir; parçalar sırayla belirir. */
const OB_PARTS = "h1,.on-sub,.on-tag,.og,.on-feat li,.os-k,.os-t,.os-p,.on-s .metric-note,.on-foot,.on-lw";
function obMount(stage, html, dir){
  stage.innerHTML = html;
  const q = stage.firstElementChild;
  q.querySelectorAll(OB_PARTS).forEach((el, i) => el.style.setProperty("--i", Math.min(i, 12)));
  q.classList.add("in");
  if (dir === -1) q.classList.add("rev");
  return q;
}
/* Eski sahne çıkar, sonra yenisi girer. */
function obSwap(stage, dir, then){
  const old = stage.firstElementChild;
  if (!old || !dir || reduceMotion()){ then(); return; }
  obBusy = true;
  old.classList.remove("in");
  old.classList.add("out");
  if (dir === -1) old.classList.add("rev");
  setTimeout(() => { obBusy = false; then(); }, 200);
}

function obCountUp(){
  const el = document.getElementById("os-kn");
  if (!el || reduceMotion()) return;
  const to = +el.dataset.to, t0 = performance.now(), dur = 1100;
  el.textContent = "0";
  const step = now => {
    if (!el.isConnected) return;
    const p = Math.min(1, (now - t0) / dur);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
    if (p < 1) requestAnimationFrame(step); else sparkle(el);
  };
  setTimeout(() => requestAnimationFrame(step), 260);
}

function renderOnboarding(dir){
  if (!ob) { ob = obDefaults(); obStep = 0; }
  applyTheme(ob.theme);
  const list = obList();
  obStep = clamp(obStep, 0, list.length - 1);
  const st = list[obStep];
  let stage = document.getElementById("on-stage");
  if (!stage){
    app.innerHTML = `<div class="on-bg" id="on-bg" aria-hidden="true"></div>
    <main class="on">
      <div class="on-top hide" id="on-top">
        <button class="on-back" id="ob-back" aria-label="${tx("Geri")}">${icon("prev")}</button>
        <div class="on-bar" id="on-bar" role="progressbar" aria-valuemin="1"><i></i></div>
      </div>
      <div class="on-stage" id="on-stage"></div>
      <div class="on-nav" id="on-nav"><button id="ob-next">${tx("İleri")}</button></div>
    </main>`;
    stage = document.getElementById("on-stage");
    sceneMount(document.getElementById("on-bg"));
  }
  const n = list.length - 2;                         /* karşılama ve özet sayılmaz */
  const first = st.id === "welcome", sum = st.id === "summary";
  document.getElementById("on-top").classList.toggle("hide", first);
  document.getElementById("on-bg").classList.toggle("welcome", first);
  document.querySelector("main.on").classList.toggle("is-w", first);
  sceneActive(first);
  const bar = document.getElementById("on-bar");
  bar.firstElementChild.style.width = (sum ? 100 : obStep / n * 100).toFixed(1) + "%";
  bar.setAttribute("aria-valuemax", n); bar.setAttribute("aria-valuenow", Math.min(obStep, n));
  bar.setAttribute("aria-label", sum ? tx("Sorular tamam") : tx("Profil oluşturma ilerlemesi"));
  document.getElementById("on-nav").classList.remove("hide");
  document.getElementById("ob-next").textContent = first ? tx("Başlayalım") : sum ? tx("Başla") : tx("İleri");

  obSwap(stage, dir, () => {
    obMount(stage, first ? obWelcome() : sum ? obSummary() : obQuestion(st), dir);
    wireOb(st, true);
    if (sum) obCountUp();
  });
}

/* Aynı ekranda bir seçim yeni soruları açtığında: sahne yerinde tazelenir,
   yalnızca yeni açılan bölüm belirerek gelir. */
function obRefresh(revealSel){
  const st = obList()[obStep], stage = document.getElementById("on-stage");
  if (st.read) st.read();
  const y = window.scrollY;
  stage.innerHTML = obQuestion(st);
  wireOb(st);
  window.scrollTo(0, y);
  const el = revealSel && stage.querySelector(revealSel);
  if (el && !reduceMotion()) el.classList.add("reveal");
}

/* Son sorudan özete geçerken oynayan ara sahne. */
function obPlayBuild(){
  const stage = document.getElementById("on-stage");
  document.getElementById("on-nav").classList.add("hide");
  document.getElementById("on-bar").firstElementChild.style.width = "100%";
  obSwap(stage, 1, () => {
    obMount(stage, obBuild(), 1);
    obBusy = true;
    document.getElementById("ob-build-title").focus({ preventScroll:true });
    const line = document.getElementById("ob-bl");
    setTimeout(() => {
      line.textContent = OB_BUILD[1];
      if (!reduceMotion()) line.classList.add("flip");
    }, 1500);
    setTimeout(() => { obBusy = false; renderOnboarding(1); window.scrollTo(0, 0); }, 3100);
  });
}

function obErr(msg){
  const box = document.getElementById("ob-err");
  if (!box) return;
  box.textContent = msg || "";
  box.classList.toggle("show", !!msg);
  if (msg) box.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block:"nearest" });
}

function wireOb(st){
  const go = d => {
    if (obBusy) return;
    const list = obList();
    const nxt = list[obStep + d];
    obStep += d;
    if (d > 0 && nxt && nxt.id === "summary"){ obPlayBuild(); return; }
    renderOnboarding(d); window.scrollTo(0, 0);
  };
  const next = async () => {
    if (obBusy) return;
    if (st.read) st.read();
    const err = st.valid ? st.valid() : "";
    if (err){
      const [msg, focus] = Array.isArray(err) ? err : [err, null];
      obErr(msg);
      const f = focus && document.getElementById(focus);
      if (f){ f.focus(); f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake"); }
      return;
    }
    if (st.id === "summary"){ await obFinish(); return; }
    if (st.id === "welcome"){ sceneWarp(() => go(1)); return; }   /* ışık hızı geçişi; hareket azaltmada doğrudan geçer */
    go(1);
  };
  document.getElementById("ob-next").onclick = next;
  document.getElementById("ob-back").onclick = () => { if (obBusy) return; if (st.read) st.read(); go(-1); };
  if (st.wire) st.wire();
  app.querySelectorAll(".on-q input").forEach(i => i.addEventListener("input", () => obErr("")));

  /* seçim kartları: yalnızca işaretler, ekranı değiştirmez */
  app.querySelectorAll(".ocs [data-oc]").forEach(b => b.onclick = () => {
    const box = b.closest(".ocs"), f = box.dataset.field, v = b.dataset.oc;
    if (f === "plan"){ const was = !!ob.noPlan; ob.noPlan = v === "off"; ob.planTouched = true; if (was !== ob.noPlan){ obRefresh("#og-plan"); return; } }
    else ob[f] = box.dataset.num ? Number(v) : v;
    if (f === "goal") document.getElementById("ob-planning-label").hidden = v !== "lose";
    if (f === "activity"){
      if (!ob.planTouched) ob.noPlan = v === "sedentary";
      if (!ob.daysTouched) ob.days = null;
    }
    box.querySelectorAll("[data-oc]").forEach(x => {
      x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b));
    });
    obErr("");
  });

  /* Karşılama: bayraklar. Türkiye = Türkçe + metrik. İngiltere = menü; seçilen birimle İngilizce. */
  const menu = document.getElementById("fl-menu"), enBtn = app.querySelector("[data-flag=en]");
  if (menu){
    const setOpen = o => { menu.hidden = !o; enBtn.setAttribute("aria-expanded", String(o)); };
    const pickLang = (l, units) => {
      ob.units = units;
      try { sessionStorage.setItem(OB_UNIT_KEY, units); } catch(e){}
      if (l !== LANG) setLang(l);          /* sayfa yenilenir; birim sessionStorage ile geri gelir */
    };
    app.querySelector("[data-flag=tr]").onclick = () => { setOpen(false); pickLang("tr", "metric"); };
    enBtn.onclick = e => { e.stopPropagation(); setOpen(menu.hidden); };
    menu.querySelectorAll("[data-obunit]").forEach(b => b.onclick = e => {
      e.stopPropagation();
      menu.querySelectorAll("[data-obunit]").forEach(x => x.setAttribute("aria-checked", String(x === b)));
      pickLang("en", b.dataset.obunit);
      setOpen(false);
    });
    const away = e => {
      if (!document.body.contains(menu)){ document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); return; }
      if (!menu.hidden && !menu.parentElement.contains(e.target)) setOpen(false);
    };
    const esc = e => { if (e.key === "Escape" && !menu.hidden){ setOpen(false); enBtn.focus(); } };
    document.addEventListener("pointerdown", away); document.addEventListener("keydown", esc);
  }

  /* çok seçimli rozetler */
  const toggle = (attr, field, cast) => app.querySelectorAll(`[data-${attr}]`).forEach(b => b.onclick = () => {
    const v = cast(b.dataset[attr]);
    const i = ob[field].indexOf(v);
    if (i >= 0) ob[field].splice(i, 1); else ob[field].push(v);
    b.classList.toggle("sel", i < 0); b.setAttribute("aria-pressed", String(i < 0));
  });
  toggle("obavoid", "avoid", String);

  /* Antrenman günleri */
  app.querySelectorAll("[data-obday]").forEach(b => b.onclick = () => {
    const n = Number(b.dataset.obday);
    ob.days = (ob.days || OB_DEFAULT_DAYS(ob.activity)).slice();
    const i = ob.days.indexOf(n);
    ob.daysTouched = true;
    if (i >= 0) ob.days.splice(i, 1); else ob.days.push(n);
    ob.days.sort((a, b2) => a - b2);
    b.classList.toggle("sel", i < 0); b.setAttribute("aria-pressed", String(i < 0));
  });
}

async function obFinish(){
  const profile = obProfile();
  const reminders = ob.remind === "on" ? { water:true, train:true, sleep:true, birthday:true } : {};
  if (ob.sleepNotify) reminders.sleep = true;
  if (ob.waterNotify) reminders.water = true;
  if (hmToMin(ob.medicationAt) !== null) reminders.medicationAt = ob.medicationAt;
  if (Object.keys(reminders).length && await askNotifyPermission()) profile.reminders = reminders;
  state = { v:SCHEMA, starred:1, profile, adjustment:0, lastRefreshAt:null, days:{}, seenVersion:APP_VERSION };
  state.mealPrefs = { exclude:ob.exclude.slice(), useMine:false, fixed:{}, diet:ob.diet, cuisine:ob.cuisine, meals:mealsFromPreset(ob.mealSet) };
  state.routines = [ob.sleepGoal && tx("Daha düzenli yatmak"), ob.waterGoal && tx("Daha düzenli su içmek"), ob.customGoal]
    .filter(Boolean).map(title => ({ id:Date.now() + Math.random(), title, days:[1,2,3,4,5,6,7] }));

  state.days[today()] = { weight: ob.weight, tasks:[] };
  ensureToday();
  await saveState(state);
  applyTheme(profile.theme);
  /* Giriş sahnesi kararır, uygulama açılır. */
  const shell = app.querySelector("main.on");
  if (shell && !reduceMotion()){
    obBusy = true; shell.classList.add("bye");
    await new Promise(r => setTimeout(r, 300));
    obBusy = false;
  }
  ob = null; obStep = 0;
  tab = "today"; viewDate = null;
  render(); window.scrollTo(0,0);
}
