"use strict";

/* ---- kişiselleştirme verileri ---- */

/* Kaçınılacak bölge: hareketi daha güvenli bir karşılığıyla değiştirir,
   karşılığı yoksa programdan çıkarır. Sıra önemli: özel olan önce. */
const AVOID_ZONES = [["diz","Diz"], ["bel","Bel"], ["omuz","Omuz"], ["bilek","Bilek"]];
const AVOID_SWAP = {
  diz: [
    [/pistol|shrimp|jump squat|lunge sıçrama|sıçrama/, "Glute bridge"],
    [/bulgarian|split squat|lunge|step-up|duvar oturuşu/, "Glute bridge"],
    [/leg press|leg extension|goblet squat|front squat|sandalye squat|çantalı squat|squat/, "Hip thrust"],
    [/nordic|leg curl/, "Glute bridge"],
    [/tepe sprint|merdiven sprint|sprint|koşu|yüksek diz|burpee|mountain climber|plank jack|ip atlama/, null]
  ],
  bel: [
    [/romen deadlift|deadlift/, "Leg curl"],
    [/barbell row|kettlebell row|havlu kürek|ters kürek|kürek/, "Face pull"],
    [/swing|türk kalkışı|farmer|good morning/, "Goblet squat"],
    [/superman|dragon flag|hollow rock|hollow hold/, "Dead bug"]
  ],
  omuz: [
    [/handstand şınav|handstand|pike şınav/, "Face pull"],
    [/omuz press|tek kol press|dumbbell press/, "Face pull"],
    [/dips/, "Triceps"],
    [/muscle-up/, "Barfiks"],
    [/yan omuz/, null]
  ],
  bilek: [
    [/handstand|l-sit|v-sit/, null],
    [/elmas şınav|pike şınav|şınav/, "Sandalye dips"],
    [/burpee|mountain climber|plank jack/, "Yüksek diz"],
    [/plank serisi|yan plank|plank/, "Dead bug"]
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
    return avoid.some(z => zoneHits(b, z)) ? "Yürüyüş 30 dk" : b;
  const out = [], seen = new Set();
  for (const ex of b.split(" · ")){
    const cur = applyZones(ex, avoid);
    if (!cur) continue;
    const key = parseEx(cur, "gym").name.toLocaleLowerCase("tr");
    if (seen.has(key)) continue;
    seen.add(key); out.push(cur);
  }
  return out.length ? out.join(" · ") : "Yürüyüş 30 dk";
}

/* Uyku hedefi: alt sınır profilden, üst sınır iki saat üstü. */
const sleepMin = () => clamp((state && state.profile && state.profile.sleepMin) || 7, 5, 10);
const sleepBand = () => [sleepMin(), sleepMin() + 2];

/* Tema: otomatik ise telefonun ayarı geçerli. */
function applyTheme(t){
  const r = document.documentElement;
  if (t === "light" || t === "dark") r.dataset.theme = t; else delete r.dataset.theme;
}

/* Öğün düzeni kalıpları: [ad, saat, kategori, ağırlık] */
const MEAL_PRESETS = [
  ["3 öğün", [["Kahvaltı",8,"kahvalti",30],["Öğle",13,"ogle",40],["Akşam",20,"aksam",40]]],
  ["3 öğün + ara", [["Kahvaltı",8,"kahvalti",30],["Öğle",13,"ogle",35],["Ara öğün",16,"ara",15],["Akşam",20,"aksam",35]]],
  ["2 öğün", [["Öğle",13,"ogle",45],["Akşam",20,"aksam",45]]],
  ["5 öğün", [["Kahvaltı",8,"kahvalti",25],["Kuşluk",11,"ara",12],["Öğle",14,"ogle",30],["İkindi",17,"ara",12],["Akşam",20,"aksam",30]]]
];
function mealsFromPreset(i){
  const set = (MEAL_PRESETS[i] || MEAL_PRESETS[1])[1];
  const stamp = Date.now().toString(36);
  return set.map(([name, h, cat, w], j) => ({ id:`m${j}${stamp}`, name, h, cat, w }));
}

/* Sık elenen besinler: rozet başına bir veya daha çok kalem */
const DISLIKE = [
  ["Karaciğer / sakatat", ["karaciger","kokorec","iskembe"]],
  ["Balık ve deniz ürünleri", ["somon","ton","hamsi","uskumru","alabalik","levrek","cipura","karides","izgarabalik","balikekmek","fumesomon","tonyagli","uskumrukonserve","sardalya","midyedolma"]],
  ["Kırmızı et", ["kofte","biftek","kuzu","doner","sucuk","pastirma","kavurma","salam","macarsalam","danafume","danarosto","danajambon","iskender","adanakebap","izgarakofte","guvec"]],
  ["Mantar", ["mantar"]],
  ["Zeytin", ["zeytin","yesilzeytin","zeytinezmesi"]],
  ["Patlıcan", ["patlican","karniyarik","imambayildi","musakka","hunkarbegendi"]],
  ["Baklagil", ["mercimek","yesilmercimek","nohut","kurufasulye","barbunya","bakla","borulce","masfasulye","siyahfasulye","soyafasulye","piyaz"]],
  ["Süt", ["sut","kefir","salep"]]
];

/* Hazır günlük hatırlatmalar */
const ROUTINE_IDEAS = ["D vitamini", "Multivitamin", "Omega-3", "Magnezyum",
  "İlaçlarımı al", "10 bin adım", "Esneme", "Akşam yürüyüşü"];

/* ---- ilk giriş: adım adım ---- */
let obStep = 0, ob = null;

function obDefaults(){
  return { name:"", sex:"", avatar:undefined, avColor:undefined,
    goal:"maintain", targetWeight:null, activity:"moderate", sleepMin:7,
    venue:"gym", days:null, avoid:[],
    diet:"hepsi", mealSet:1, dislike:[],
    theme:"auto", routines:[] };
}
const OB_DEFAULT_DAYS = a => PATTERN[(a === "sedentary" || a === "light") ? 3 : a === "moderate" ? 4 : 5].slice();

/* Seçilen günlerin kaçı gerçekten kullanılacak? Ortamda o frekansta program
   yoksa en yakını seçilir ve fazla günler antrenmansız kalır. */
function dayNote(venue, activity, days){
  const d = days.slice().sort((a,b) => a-b);
  const prog = PROGRAMS[defaultProgramId(venue, activity, d)];
  const used = planDays({ days: d }, prog.freq);
  if (used.length === d.length)
    return `${d.length} gün seçili: ${d.map(n => WD_NAMES[n]).join(", ")}. Program bu günlere kurulur.`;
  return `Bu ortamda en fazla ${prog.freq} günlük program var. `
    + `${used.map(n => WD_NAMES[n]).join(", ")} günleri kullanılacak, kalanı dinlenme olur.`;
}

/* Marka işareti: ikonun aynısı, ilk adımda gösterilir. */
const APP_VERSION = "1.1";
const BRAND_SVG = `<svg viewBox="0 0 180 180" aria-hidden="true"><defs><linearGradient id="sbi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF7A2F"/><stop offset="1" stop-color="#FF3D6E"/></linearGradient></defs><rect width="180" height="180" rx="40" fill="url(#sbi)"/><g fill="#FFFCFA"><rect x="39.0" y="125.2" width="17.6" height="16.9" rx="6.0"/><rect x="63.6" y="107.6" width="17.6" height="34.5" rx="6.0"/><rect x="88.2" y="90.7" width="17.6" height="51.3" rx="6.0"/><rect x="112.9" y="73.1" width="17.6" height="68.9" rx="6.0"/><path d="M121.6 26.7 L125.5 41.1 L139.9 45.0 L125.5 48.9 L121.6 63.3 L117.8 48.9 L103.4 45.0 L117.8 41.1Z"/></g></svg>`;

/* ---- ilk giriş: konuya göre beş ekran ----
   Seçimler yalnızca işaretlenir; sonraki ekrana hep "İleri" ile geçilir. */
const OB_ICON = {
  sex:{ male:"body", female:"body-f", none:"av-n" },
  goal:{ lose:"run", maintain:"yoga", gain:"push" },
  activity:{ sedentary:"rest", light:"walk", moderate:"run", active:"fullbody", veryActive:"skill" },
  venue:{ gym:"push", home:"core", outdoor:"run", calisthenics:"pull", kettlebell:"fullbody", mobility:"yoga", swim:"swim" },
  diet:{ hepsi:"meat", vejetaryen:"egg", vegan:"veg", pesketaryen:"fish", glutensiz:"potato", laktozsuz:"nuts" }
};
const OB_GOAL_D = { lose:"Kalori açığıyla, kası koruyarak", maintain:"Kilonu ve formunu tut", gain:"Hafif kalori fazlasıyla kas ekle" };

function obCard(on, val, ic, label, desc){
  return `<button type="button" class="oc${on ? " on" : ""}" data-oc="${val}" aria-pressed="${on}">
    ${ic ? iconBox(ic) : ""}<span class="oc-m"><b>${label}</b>${desc ? `<i>${desc}</i>` : ""}</span>
    <span class="oc-c" aria-hidden="true">${icon("check")}</span></button>`;
}
const obCards = (field, rows, cls, isNum) => `<div class="ocs${cls ? " " + cls : ""}" data-field="${field}"${isNum ? ' data-num="1"' : ""}>${rows.map(([v, ic, l, d]) =>
  obCard(String(ob[field]) === String(v), v, ic, l, d)).join("")}</div>`;
const obChips = (attr, rows) => `<div class="chips on-chips">${rows.map(([v, l, on]) =>
  `<button type="button" class="chip${on ? " sel" : ""}" data-${attr}="${v}" aria-pressed="${!!on}">${l}</button>`).join("")}</div>`;
const og = (title, inner, opt, id) => `<div class="og"${id ? ` id="${id}"` : ""}>
  <div class="og-t">${title}${opt ? ` <span>isteğe bağlı</span>` : ""}</div>${inner}</div>`;

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
   Yatay kaydırılan çizgili şerit; ortadaki iğnenin altındaki değer seçilir. */
function obRuler(field, min, max, step, tw, majorEvery, midEvery, unit, dec){
  const n = Math.round((max - min) / step);
  let ticks = "";
  for (let i = 0; i <= n; i++){
    const v = min + i * step;
    ticks += i % majorEvery === 0 ? `<i class="M" data-l="${+v.toFixed(1)}"></i>` : i % midEvery === 0 ? `<i class="m"></i>` : `<i></i>`;
  }
  const val = ob[field];
  const txt = dec ? val.toFixed(1).replace(".", ",") : String(val);
  return `<div class="rl" data-rl="${field}" data-min="${min}" data-max="${max}" data-step="${step}" data-tw="${tw}" data-dec="${dec ? 1 : 0}" style="--tw:${tw}px">
    <button type="button" class="rl-v" aria-label="${unit} değerini elle yaz">
      <b class="num rl-n" data-v="${txt}" aria-hidden="true">${rollHTML(txt)}</b><span>${unit}</span></button>
    <div class="rl-w">
      <div class="rl-s" tabindex="0" role="slider" aria-label="${unit}" aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${val}"><div class="rl-t">${ticks}</div></div>
    </div>
  </div>`;
}
function wireRulers(animate){
  app.querySelectorAll(".rl").forEach(rl => {
    const f = rl.dataset.rl, min = +rl.dataset.min, max = +rl.dataset.max, step = +rl.dataset.step, tw = +rl.dataset.tw, dec = rl.dataset.dec === "1";
    const sc = rl.querySelector(".rl-s"), out = rl.querySelector(".rl-n");
    const fmt = v => dec ? v.toFixed(1).replace(".", ",") : String(v);
    const toX = v => (v - min) / step * tw;
    const set = v => {
      v = clamp(+(Math.round(v / step) * step).toFixed(2), min, max);
      if (ob[f] === v) return;
      ob[f] = v;
      rollSet(out, fmt(v));
      sc.setAttribute("aria-valuenow", v);
      rl.classList.add("live"); clearTimeout(rl._t); rl._t = setTimeout(() => rl.classList.remove("live"), 260);
    };
    /* Açılışta cetvel değerine doğru kayarak gelir; bu sırada değer değişmez. */
    const target = ob[f];
    let intro = false;
    const endIntro = () => { if (!intro) return; intro = false; rollSet(out, fmt(ob[f])); };
    if (animate && !reduceMotion()){
      intro = true;
      sc.scrollLeft = Math.max(toX(target) - 14 * tw, 0);
      setTimeout(() => { if (intro) sc.scrollTo({ left: toX(target), behavior:"smooth" }); }, 420);
      setTimeout(() => { if (intro){ endIntro(); sc.scrollLeft = toX(target); } }, 1400);
      sc.addEventListener("touchstart", endIntro, { passive:true });
      sc.addEventListener("pointerdown", endIntro);
      sc.addEventListener("keydown", endIntro);
    } else sc.scrollLeft = toX(target);
    sc.onscroll = () => {
      const v = min + Math.round(sc.scrollLeft / tw) * step;
      if (intro) rollSet(out, fmt(clamp(+v.toFixed(2), min, max))); else set(v);
    };

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
      drag = null; sc.classList.remove("drag");
      sc.scrollTo({ left: toX(ob[f]), behavior: reduceMotion() ? "auto" : "smooth" });
    };
    sc.onpointerup = end; sc.onpointercancel = end;
    sc.onkeydown = ev => {
      const d = { ArrowRight:1, ArrowUp:1, ArrowLeft:-1, ArrowDown:-1, PageUp:10, PageDown:-10 }[ev.key];
      if (!d) return;
      ev.preventDefault();
      const v = clamp(ob[f] + d * step, min, max);
      sc.scrollTo({ left: toX(v), behavior:"auto" });
    };

    /* rakama dokun: elle yaz */
    const vb = rl.querySelector(".rl-v");
    vb.onclick = () => {
      if (vb.querySelector("input")) return;
      const inp = document.createElement("input");
      inp.type = "number"; inp.inputMode = "decimal"; inp.className = "rl-in"; inp.value = ob[f];
      inp.setAttribute("aria-label", vb.getAttribute("aria-label"));
      out.hidden = true; vb.insertBefore(inp, out); inp.focus(); inp.select();
      const done = () => {
        const n = num(inp.value);
        inp.remove(); out.hidden = false;
        if (n !== null){ const v = clamp(n, min, max); sc.scrollTo({ left: toX(v), behavior: reduceMotion() ? "auto" : "smooth" }); set(v); }
      };
      inp.onblur = done;
      inp.onkeydown = ev => { if (ev.key === "Enter"){ ev.preventDefault(); inp.blur(); } };
      inp.onclick = ev => ev.stopPropagation();
    };
  });
}

function obProfile(){
  const profile = {
    height: ob.height, age: ob.age, startWeight: ob.weight,
    name: ob.name || undefined,
    bodyFat: ob.bodyFat,
    sex: ob.sex, avatar: ob.avatar, avColor: ob.avColor,
    activity: ob.activity, goal: ob.goal, noPlan: !!ob.noPlan,
    venue: ob.venue, days: ob.days || OB_DEFAULT_DAYS(ob.activity),
    avoid: ob.avoid.slice(), sleepMin: ob.sleepMin, theme: ob.theme
  };
  if (ob.targetWeight) profile.targetWeight = Math.round(ob.targetWeight * 10) / 10;
  profile.programId = defaultProgramId(profile.venue, profile.activity, profile.days);
  return profile;
}

const obVal = id => { const e = document.getElementById(id); return e ? e.value : null; };
const OB_STEPS = [
  { id:"welcome" },
  { id:"you", t:"Seni tanıyalım", s:"Sana nasıl seslenelim, nasıl görünelim?",
    body: () => {
      let av = "";
      if (ob.sex){
        if (!ob.avatar) ob.avatar = ob.sex === "female" ? "f" : ob.sex === "male" ? "m" : "n";
        if (!ob.avColor) ob.avColor = avColor({ sex: ob.sex });
        av = og("Avatarın", `<div class="av-field" id="av-field" style="--av:${ob.avColor}">${avatarPicker(ob.avatar, "on")}
          <div class="sh-l">Renk</div>${colorPicker(ob.avColor, "on")}</div>`, false, "og-av");
      }
      return og("Adın", `<input id="ob-name" class="on-text" type="text" value="${esc(ob.name || "")}" placeholder="Adın" autocomplete="given-name" maxlength="30" aria-label="Adın">`, true)
        + og("Cinsiyet", obCards("sex", [["male", OB_ICON.sex.male, "Erkek"], ["female", OB_ICON.sex.female, "Kadın"], ["none", OB_ICON.sex.none, "Belirtmem"]], "tri")
            + `<div class="metric-note" style="margin-top:8px">Kalori hesabında kullanılır. Belirtmezsen iki cinsiyetin ortalaması alınır.</div>`)
        + av;
    },
    read: () => { const v = obVal("ob-name"); if (v !== null) ob.name = v.trim().slice(0, 30); },
    wire: () => {
      if (!document.getElementById("av-field")) return;
      wireAvatar("on", k => { ob.avatar = k; });
      wireColor("on", c => { ob.avColor = c; document.getElementById("av-field").style.setProperty("--av", c); });
    },
    valid: () => ob.sex ? "" : "Cinsiyet seç; istemiyorsan “Belirtmem” de." },
  { id:"body", t:"Ölçülerin", s:"Cetveli sağa sola sürükle. Rakama dokunup elle de yazabilirsin.",
    body: () => {
      if (ob.height == null) ob.height = ob.sex === "female" ? 163 : ob.sex === "male" ? 176 : 170;
      if (ob.weight == null) ob.weight = ob.sex === "female" ? 60 : ob.sex === "male" ? 78 : 70;
      return og("Boy", obRuler("height", 120, 220, 1, 12, 10, 5, "cm", false))
        + og("Kilo", obRuler("weight", 30, 200, 0.5, 10, 10, 2, "kg", true))
        + `<div class="og-row">`
        + og("Yaş", `<input id="ob-age" type="number" inputmode="numeric" value="${ob.age ?? ""}" placeholder="30">`)
        + og("Yağ oranı (%)", `<input id="ob-bf" type="number" inputmode="decimal" value="${ob.bodyFat ?? ""}" placeholder="bilmiyorsan boş">`, true)
        + `</div>`;
    },
    read: () => { ob.age = num(obVal("ob-age")); ob.bodyFat = num(obVal("ob-bf")); },
    valid: () => !(ob.age >= 10 && ob.age <= 100) ? ["Yaşını 10 ile 100 arasında gir.", "ob-age"]
      : ob.bodyFat !== null && !(ob.bodyFat >= 3 && ob.bodyFat <= 60) ? ["Yağ oranını %3 ile %60 arasında gir ya da boş bırak.", "ob-bf"] : "" },
  { id:"goal", t:"Hedefin", s:"Kalori ve makro hedeflerin bunlara göre kurulur.",
    body: () => og("Ne istiyorsun?", obCards("goal", Object.entries(GOAL).map(([k, v]) => [k, OB_ICON.goal[k], v.label, OB_GOAL_D[k]])))
      + og("Hedef kilon (kg)", `<input id="ob-tw" type="number" inputmode="decimal" value="${ob.targetWeight ?? ""}" placeholder="${Math.round((ob.weight || 75) * (ob.goal === "gain" ? 1.05 : ob.goal === "lose" ? 0.9 : 1))}">
          <div class="metric-note" style="margin-top:7px">Girersen hedefe ilerlemen ve tahmini süre görünür.</div>`, true)
      + og("Günlük hareketin", obCards("activity", Object.entries(ACTIVITY).map(([k, v]) => [k, OB_ICON.activity[k], v.label, v.d[0].toLocaleUpperCase("tr") + v.d.slice(1)])))
      + og("Uyku hedefin", obChips("obsleep", [6,7,8,9].map(n => [n, `${n}-${n+2} saat`, ob.sleepMin === n]))
          + `<div class="metric-note" style="margin-top:8px">Yetişkinler için yaygın öneri 7 saat ve üstü.</div>`),
    read: () => { ob.targetWeight = num(obVal("ob-tw")); },
    valid: () => ob.targetWeight === null || (ob.targetWeight >= 30 && ob.targetWeight <= 300) ? "" : ["Hedef kiloyu 30 ile 300 kg arasında gir ya da boş bırak.", "ob-tw"] },
  { id:"train", t:"Antrenman", s:"İstemezsen görevlerinde antrenman çıkmaz; sonra istediğin zaman kurarsın.",
    body: () => {
      if (!ob.days) ob.days = OB_DEFAULT_DAYS(ob.activity);
      const more = ob.noPlan ? "" : `<div id="og-plan">`
        + og("Nerede?", obCards("venue", Object.entries(VENUE).map(([k, v]) => [k, OB_ICON.venue[k] || "fullbody", v.label]), "duo"))
        + og("Hangi günler?", obChips("obday", [1,2,3,4,5,6,7].map(n => [n, WD_SHORT[n], ob.days.includes(n)]))
            + `<div class="metric-note" id="day-note" style="margin-top:10px">${dayNote(ob.venue, ob.activity, ob.days)}</div>`)
        + og("Kaçınman gereken bölge", obChips("obavoid", AVOID_ZONES.map(([k, l]) => [k, l, ob.avoid.includes(k)]))
            + `<div class="metric-note" style="margin-top:10px">Seçtiğin bölgeyi zorlayan hareketler çıkar ya da değişir. Ağrın varsa önce bir hekime görün.</div>`, true)
        + `</div>`;
      return og("Spor programı", `<div class="ocs" data-field="plan">
          ${obCard(!ob.noPlan, "on", "plan", "Program kur", "Haftalık antrenmanların görevlerine eklenir")}
          ${obCard(!!ob.noPlan, "off", "rest", "Şimdilik istemiyorum", "Spor yaptığın günleri tek tek ekleyebilirsin")}</div>`) + more;
    } },
  { id:"food", t:"Beslenme", s:"Öneriler ve tarifler bu tercihlere göre gelir.",
    body: () => og("Nasıl besleniyorsun?", obCards("diet", Object.entries(DIETS).map(([k, l]) => [k, OB_ICON.diet[k] || "grain", l]), "duo"))
      + og("Günde kaç öğün?", obCards("mealSet", MEAL_PRESETS.map(([l, set], i) => [i, "", l, set.map(m => m[0]).join(" · ")]), "", true))
      + og("Yemediklerin", obChips("obdis", DISLIKE.map(([l], i) => [i, l, ob.dislike.includes(i)]))
          + `<div class="metric-note" style="margin-top:10px">Seçtiklerin öneri ve tariflerde çıkmaz.</div>`, true) },
  { id:"summary" }
];
const obList = () => OB_STEPS;

/* Girişte logo canlıdır: çubuklar yükselir, yıldız parlar. */
const OB_LOGO = BRAND_SVG.replace(/<rect x=/g, '<rect class="lg-b" x=').replace('<path d=', '<path class="lg-s" d=');
let obBusy = false;

function obWelcome(){
  return `<div class="on-q on-w">
    <span class="on-logo">${OB_LOGO}</span>
    <h1>Starboard</h1>
    <p class="on-tag">Sağlığın için tek bir pano.</p>
    <ul class="on-feat">
      <li>${iconBox("day")}<span><b>Günün hedefleri tek listede</b><i>Su, uyku, kalori ve antrenman; dokun, yerinde gir.</i></span></li>
      <li>${iconBox("plan")}<span><b>Sana göre kurulur</b><i>Kalori, protein ve antrenman programın ölçülerinden hesaplanır.</i></span></li>
      <li>${iconBox("star4")}<span><b>Her tamamlanan gün bir yıldız</b><i>Haftada beş yıldız takımyıldızını tamamlar.</i></span></li>
    </ul>
    <div class="on-foot">Beş kısa ekran. Veriler yalnızca bu cihazda saklanır.</div>
  </div>`;
}

/* Sorular bitince kısa bir ara sahne: plan kurulurken logo çalışır. */
const OB_BUILD = ["Kalori ihtiyacın hesaplanıyor", "Protein ve su hedefin ayarlanıyor", "Programın kuruluyor"];
function obBuild(){
  return `<div class="on-q on-w on-build">
    <span class="on-lw"><span class="on-orbit" aria-hidden="true"><i></i><i></i><i></i></span><span class="on-logo">${OB_LOGO}</span></span>
    <h1>Planın hazırlanıyor</h1>
    <p class="on-tag" id="ob-bl" role="status">${OB_BUILD[0]}</p>
  </div>`;
}

function obSummary(){
  const pr = obProfile();
  const p = buildProgram(pr, ob.weight, 0);
  const tr = p.training;
  const tile = (ic, v, u, l) => `<div class="os-t">${iconBox(ic)}<b class="num">${v}<small>${u}</small></b><i>${l}</i></div>`;
  return `<div class="on-q on-s">
    <span class="on-logo sm">${OB_LOGO}</span>
    <h1>${ob.name ? `${esc(ob.name)}, planın hazır` : "Planın hazır"}</h1>
    <p class="on-tag">${GOAL[ob.goal].label} hedefine göre günlük hedeflerin:</p>
    <div class="os-k"><b class="num" id="os-kn" data-to="${p.kcal}">${p.kcal}</b><span>kcal / gün</span></div>
    <div class="os-g">
      ${tile("poultry", p.protein, " g", "protein")}
      ${tile("dairy", (p.water / 1000).toFixed(1).replace(".", ","), " L", "su")}
      ${tile("rest", `${ob.sleepMin}-${ob.sleepMin + 2}`, " sa", "uyku")}
    </div>
    <div class="os-p">${iconBox(tr.none ? "rest" : "plan")}<span><b>${tr.none ? "Spor programı yok" : esc(tr.title)}</b>
      <i>${tr.none ? "İstediğin zaman Program sekmesinden kurabilir ya da kendi programını yazabilirsin."
        : `Haftada ${tr.freq} gün · ${tr.days.filter(d => d.b && !/dinlenme/i.test(d.t)).map(d => WD_SHORT[d.wd]).join(", ")}`}</i></span></div>
    <div class="metric-note" style="text-align:center;margin-top:14px">Hepsini sonradan Ben sayfasından değiştirebilirsin. Kilon değiştikçe hedefler kendiliğinden güncellenir.</div>
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
    app.innerHTML = `<div class="on-bg" id="on-bg" aria-hidden="true"><i></i><i></i>${[0,1,2,3,4,5].map(() => `<b>${icon("star4")}</b>`).join("")}</div>
    <main class="on">
      <div class="on-top hide" id="on-top">
        <button class="on-back" id="ob-back" aria-label="Geri">${icon("prev")}</button>
        <div class="on-bar" id="on-bar" role="progressbar" aria-valuemin="1"><i></i></div>
        <span class="on-cnt num" id="on-cnt"></span>
      </div>
      <div class="on-stage" id="on-stage"></div>
      <div class="on-nav" id="on-nav"><button id="ob-next">İleri</button></div>
    </main>`;
    stage = document.getElementById("on-stage");
  }
  const n = list.length - 2;                         /* karşılama ve özet sayılmaz */
  const first = st.id === "welcome", sum = st.id === "summary";
  document.getElementById("on-top").classList.toggle("hide", first);
  const bar = document.getElementById("on-bar");
  bar.firstElementChild.style.width = (sum ? 100 : obStep / n * 100).toFixed(1) + "%";
  bar.setAttribute("aria-valuemax", n); bar.setAttribute("aria-valuenow", Math.min(obStep, n));
  bar.setAttribute("aria-label", sum ? "Sorular tamam" : `Adım ${obStep} / ${n}`);
  document.getElementById("on-cnt").textContent = first || sum ? "" : `${obStep}/${n}`;
  document.getElementById("on-bg").style.setProperty("--p", (obStep / (list.length - 1)).toFixed(3));
  document.getElementById("on-nav").classList.remove("hide");
  document.getElementById("ob-next").textContent = first ? "Başlayalım" : sum ? "Başla" : "İleri";

  obSwap(stage, dir, () => {
    obMount(stage, first ? obWelcome() : sum ? obSummary() : obQuestion(st), dir);
    wireOb(st, list, true);
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
  wireOb(st, obList(), false);
  window.scrollTo(0, y);
  const el = revealSel && stage.querySelector(revealSel);
  if (el && !reduceMotion()) el.classList.add("reveal");
}

/* Son sorudan özete geçerken oynayan ara sahne. */
function obPlayBuild(){
  const stage = document.getElementById("on-stage");
  document.getElementById("on-nav").classList.add("hide");
  document.getElementById("on-bar").firstElementChild.style.width = "100%";
  document.getElementById("on-cnt").textContent = "";
  obSwap(stage, 1, () => {
    obMount(stage, obBuild(), 1);
    obBusy = true;
    let i = 0;
    const line = document.getElementById("ob-bl");
    const tick = setInterval(() => {
      i++;
      if (i >= OB_BUILD.length || !line.isConnected){ clearInterval(tick); return; }
      line.classList.remove("flip"); void line.offsetWidth;
      line.textContent = OB_BUILD[i]; line.classList.add("flip");
    }, 620);
    setTimeout(() => { clearInterval(tick); obBusy = false; renderOnboarding(1); window.scrollTo(0, 0); }, 1950);
  });
}

function obErr(msg){
  const box = document.getElementById("ob-err");
  if (!box) return;
  box.textContent = msg || "";
  box.classList.toggle("show", !!msg);
  if (msg) box.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block:"nearest" });
}

function wireOb(st, list, animate){
  const go = d => {
    if (obBusy) return;
    const nxt = list[obStep + d];
    obStep += d;
    if (d > 0 && nxt && nxt.id === "summary" && !reduceMotion()){ obPlayBuild(); return; }
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
    go(1);
  };
  document.getElementById("ob-next").onclick = next;
  document.getElementById("ob-back").onclick = () => { if (obBusy) return; if (st.read) st.read(); go(-1); };
  if (st.wire) st.wire();
  wireRulers(animate);
  app.querySelectorAll(".on-q input").forEach(i => i.addEventListener("input", () => obErr("")));

  /* seçim kartları: yalnızca işaretler, ekranı değiştirmez */
  app.querySelectorAll(".ocs [data-oc]").forEach(b => b.onclick = () => {
    const box = b.closest(".ocs"), f = box.dataset.field, v = b.dataset.oc;
    if (f === "plan"){ const was = !!ob.noPlan; ob.noPlan = v === "off"; ob.planTouched = true; if (was !== ob.noPlan){ obRefresh("#og-plan"); return; } }
    else if (f === "sex"){
      const was = ob.sex; ob.sex = v;
      if (was !== v){ ob.avatar = undefined; ob.avColor = undefined; obRefresh(was ? null : "#og-av"); return; }
    }
    else ob[f] = box.dataset.num ? Number(v) : v;
    if (f === "activity" && ob.planTouched !== true){ ob.noPlan = v === "sedentary"; ob.days = null; }
    box.querySelectorAll("[data-oc]").forEach(x => {
      x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b));
    });
    if (f === "venue"){ const note = document.getElementById("day-note"); if (note) note.textContent = dayNote(ob.venue, ob.activity, ob.days); }
    obErr("");
  });

  /* uyku: tek seçimli rozet */
  app.querySelectorAll("[data-obsleep]").forEach(b => b.onclick = () => {
    ob.sleepMin = Number(b.dataset.obsleep);
    app.querySelectorAll("[data-obsleep]").forEach(x => { x.classList.toggle("sel", x === b); x.setAttribute("aria-pressed", String(x === b)); });
  });

  /* çok seçimli rozetler */
  const toggle = (attr, field, cast) => app.querySelectorAll(`[data-${attr}]`).forEach(b => b.onclick = () => {
    const v = cast(b.dataset[attr]);
    const i = ob[field].indexOf(v);
    if (i >= 0) ob[field].splice(i, 1); else ob[field].push(v);
    b.classList.toggle("sel", i < 0); b.setAttribute("aria-pressed", String(i < 0));
  });
  toggle("obavoid", "avoid", String);
  toggle("obdis", "dislike", Number);

  /* antrenman günleri: 3-5 arası */
  app.querySelectorAll("[data-obday]").forEach(b => b.onclick = () => {
    const n = Number(b.dataset.obday);
    ob.days = (ob.days || OB_DEFAULT_DAYS(ob.activity)).slice();
    const i = ob.days.indexOf(n);
    if (i >= 0){
      if (ob.days.length <= 3){ toast("En az 3 antrenman günü gerekli."); return; }
      ob.days.splice(i, 1);
    } else {
      if (ob.days.length >= 5){ toast("En fazla 5 gün seçebilirsin."); return; }
      ob.days.push(n);
    }
    ob.days.sort((a, b2) => a - b2);
    b.classList.toggle("sel", i < 0); b.setAttribute("aria-pressed", String(i < 0));
    const note = document.getElementById("day-note");
    if (note) note.textContent = dayNote(ob.venue, ob.activity, ob.days);
  });
}

async function obFinish(){
  const profile = obProfile();
  state = { profile, adjustment:0, lastRefreshAt:null, days:{} };
  state.mealPrefs = { exclude:[], useMine:false, fixed:{}, diet: ob.diet, meals: mealsFromPreset(ob.mealSet) };
  const ex = new Set();
  for (const i of ob.dislike) for (const k of (DISLIKE[i] || [])[1] || []) if (FOODS[k]) ex.add(k);
  state.mealPrefs.exclude = [...ex];
  state.routines = [];

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
