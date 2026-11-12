"use strict";

/* Starboard testleri. Uygulamanın kodu bu dosyadan önce yüklenmiş olur;
   testler onun işlevlerini doğrudan çağırır. Tarayıcıda tests/index.html açılarak çalışır. */

const TESTS = [];
const test = (name, fn) => TESTS.push([name, fn]);
const eq = (got, want, msg) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) throw new Error(`${msg || "eşit değil"}: beklenen ${w}, gelen ${g}`);
};
const ok = (cond, msg) => { if (!cond) throw new Error(msg || "koşul sağlanmadı"); };

/* Testler kullanıcının gerçek kaydına dokunmasın: kaydetme yalnızca bellekte kalır. */
saveState = async () => { calcReset(); };

const loadFixture = async () => {
  const data = await fetch("fixtures/state-v1.json").then(r => r.json());
  return JSON.parse(JSON.stringify(data.state));
};

const BASE = { height:178, age:30, bodyFat:null, sex:"male", activity:"moderate", goal:"maintain",
  noPlan:false, venue:"gym", days:[1,2,4,5], avoid:[], sleepMin:7 };
const profileOf = o => {
  const p = { ...BASE, ...o };
  p.programId = defaultProgramId(p.venue, p.activity, p.days);
  return p;
};

/* ---- tarih ---- */
test("tarih: gün kaydırma ay ve yıl sınırını doğru geçer", () => {
  eq(shiftDays("2026-01-31", 1), "2026-02-01");
  eq(shiftDays("2026-03-01", -1), "2026-02-28");
  eq(shiftDays("2024-02-28", 1), "2024-02-29");
  eq(shiftDays("2026-12-31", 1), "2027-01-01");
  eq(shiftDays("2026-11-11", -7), "2026-11-04");
});
test("tarih: haftanın günü pazartesi 1, pazar 7", () => {
  eq(isoWeekday("2026-11-09"), 1);
  eq(isoWeekday("2026-11-11"), 3);
  eq(isoWeekday("2026-11-15"), 7);
});
test("tarih: bugünün anahtarı YYYY-AA-GG biçiminde", () => {
  ok(/^\d{4}-\d{2}-\d{2}$/.test(today()), "biçim tutmuyor: " + today());
});

/* ---- program hesabı: bugünkü sonuçlar sabitlendi; istemeden değişirse test kalır ---- */
const GOLDEN = [
  [{}, 82, 0, { bmr:1788, tdee:2771, kcal:2771, protein:131, fat:77, carb:389, water:2870, floored:false }],
  [{ goal:"lose" }, 82, 0, { bmr:1788, tdee:2771, kcal:2272, protein:157, fat:63, carb:269, water:2870, floored:false }],
  [{ goal:"gain" }, 82, 0, { bmr:1788, tdee:2771, kcal:3103, protein:144, fat:86, carb:438, water:2870, floored:false }],
  [{ sex:"female", height:163, age:27 }, 60, 0, { bmr:1323, tdee:2050, kcal:2050, protein:96, fat:57, carb:288, water:2100, floored:false }],
  [{ sex:"female", height:163, age:27, goal:"lose" }, 60, 0, { bmr:1323, tdee:2050, kcal:1681, protein:115, fat:47, carb:200, water:2100, floored:false }],
  [{ sex:"none", height:170, age:45 }, 70, 0, { bmr:1460, tdee:2262, kcal:2262, protein:112, fat:63, carb:312, water:2450, floored:false }],
  [{ bodyFat:20 }, 82, 0, { bmr:1787, tdee:2770, kcal:2770, protein:131, fat:77, carb:388, water:2870, floored:false }],
  [{ activity:"sedentary" }, 82, 0, { bmr:1788, tdee:2145, kcal:2145, protein:131, fat:60, carb:270, water:2870, floored:false }],
  [{ activity:"veryActive", goal:"gain" }, 95, 0, { bmr:1918, tdee:3643, kcal:4080, protein:167, fat:113, carb:599, water:3325, floored:false }],
  [{ goal:"lose" }, 82, -150, { bmr:1788, tdee:2771, kcal:2122, protein:157, fat:59, carb:241, water:2870, floored:false }],
  [{ sex:"female", height:150, age:60, goal:"lose" }, 45, 0, { bmr:927, tdee:1436, kcal:1200, protein:86, fat:33, carb:140, water:1575, floored:true }]
];
const KEYS = ["bmr", "tdee", "kcal", "protein", "fat", "carb", "water", "floored"];
GOLDEN.forEach(([o, w, adj, want], i) => {
  test(`program: örnek ${i + 1} (${JSON.stringify(o)}, ${w} kg, ayar ${adj})`, () => {
    const p = buildProgram(profileOf(o), w, adj);
    eq(Object.fromEntries(KEYS.map(k => [k, p[k]])), want);
  });
});
test("program: makroların kalorisi hedef kaloriyle tutarlı", () => {
  for (const [o, w, adj] of GOLDEN) {
    const p = buildProgram(profileOf(o), w, adj);
    const sum = p.protein * 4 + p.carb * 4 + p.fat * 9;
    ok(Math.abs(sum - p.kcal) <= 12, `makro toplamı ${sum}, hedef ${p.kcal} (${JSON.stringify(o)})`);
  }
});
test("program: kilo vermek korumaktan az, kilo almak fazla kalori verir", () => {
  const k = g => buildProgram(profileOf({ goal:g }), 82, 0).kcal;
  ok(k("lose") < k("maintain") && k("maintain") < k("gain"));
});
test("program: antrenman planı seçilen gün sayısıyla uyumlu", () => {
  const plan = trainingPlan(profileOf({}));
  ok(plan && Array.isArray(plan.days) && plan.days.length === 7, "yedi günlük plan bekleniyordu");
  /* "walk" aktif dinlenme günüdür, antrenman sayılmaz. */
  const training = plan.days.filter(d => d.icon !== "rest" && d.icon !== "walk").map(d => d.wd);
  eq(training, [1, 2, 4, 5], "antrenman günleri");
  eq(training.length, plan.freq, "antrenman günü sayısı");
});

/* ---- besin verisi ---- */
test("besinler: her kaydın adı ve geçerli makroları var", () => {
  const bad = [];
  for (const [k, f] of Object.entries(FOODS)) {
    const nums = [f.p, f.c, f.f].every(v => typeof v === "number" && v >= 0);
    if (!f.n || !nums || f.p + f.c + f.f > 100.5) bad.push(k);
  }
  eq(bad, [], "hatalı besin kayıtları");
});
test("besinler: porsiyon metni ve gramı üretilir", () => {
  const r = portion(FOODS.yumurta, 150);
  ok(r && typeof r.text === "string" && r.text.includes("Yumurta"), "metin eksik");
  ok(r.g > 0, "gram eksik");
});

/* ---- öğün önerileri ---- */
test("öğünler: önerilen menünün kalorisi hedefe yakın", async () => {
  state = await loadFixture();
  const p = buildProgram(state.profile, 82, 0);
  const m = buildMeals(p, 0);
  eq(m.meals.length, state.mealPrefs.meals.length, "öğün sayısı");
  const sum = m.meals.reduce((a, x) => a + x.kcal, 0);
  ok(Math.abs(sum - p.kcal) / p.kcal <= 0.1, `menü ${sum} kcal, hedef ${p.kcal} kcal`);
});
test("öğünler: istenmeyen besin önerilerde çıkmaz", async () => {
  state = await loadFixture();
  const p = buildProgram(state.profile, 82, 0);
  const keysOf = m => m.meals.flatMap(x => x.items.map(i => i.key).filter(Boolean));
  const first = keysOf(buildMeals(p, 0));
  ok(first.length > 0, "öneride besin yok");
  state.mealPrefs.exclude = [first[0]];
  for (let v = 0; v < 4; v++)
    ok(!keysOf(buildMeals(p, v)).includes(first[0]), `${first[0]} ${v}. seçenekte yine çıktı`);
});

test("öğünler: her öğün gerçek bir tabak gibi (tek et ya da balık, en fazla dört besin)", async () => {
  const fixture = await loadFixture();
  const meaty = k => FOODS[k] && ["meat", "poultry", "fish"].includes(FOODS[k].i);
  const profiles = [[{}, 82], [{ goal:"lose" }, 82], [{ goal:"gain" }, 82],
    [{ sex:"female", height:163, age:27 }, 60], [{ sex:"female", height:163, age:27, goal:"lose" }, 60],
    [{ activity:"veryActive", goal:"gain" }, 95], [{ activity:"sedentary" }, 82]];
  for (const [o, w] of profiles) for (let v = 0; v < 6; v++) {
    state = JSON.parse(JSON.stringify(fixture));
    const p = buildProgram(profileOf(o), w, 0);
    const m = buildMeals(p, v);
    const where = `${JSON.stringify(o)}, seçenek ${v}`;
    for (const meal of m.meals) {
      const keys = meal.items.map(i => i.key).filter(Boolean);
      ok(keys.filter(meaty).length <= 1, `${meal.name}: birden çok et ya da balık (${keys.join(", ")}) · ${where}`);
      ok(keys.length <= 4, `${meal.name}: ${keys.length} besin (${keys.join(", ")}) · ${where}`);
      eq(new Set(keys).size, keys.length, `${meal.name}: aynı besin iki kez · ${where}`);
    }
    ok(Math.abs(m.total.kcal - p.kcal) / p.kcal <= 0.1, `menü ${m.total.kcal} kcal, hedef ${p.kcal} kcal · ${where}`);
  }
});

test("öğünler: diyet seçiliyken de öğüne yakışan besinler çıkar", async () => {
  const fixture = await loadFixture();
  const legume = k => foodCat(FOODS[k]) === "baklagil";
  for (const diet of ["vejetaryen", "vegan", "pesketaryen", "glutensiz", "laktozsuz"]) for (let v = 0; v < 4; v++) {
    state = JSON.parse(JSON.stringify(fixture));
    state.mealPrefs.diet = diet;
    const p = buildProgram(profileOf({}), 82, 0);
    const m = buildMeals(p, v);
    const where = `${diet}, seçenek ${v}`;
    m.meals.forEach((meal, i) => {
      const keys = meal.items.map(x => x.key).filter(Boolean);
      const cat = state.mealPrefs.meals.slice().sort((a, b) => a.h - b.h)[i].cat;
      for (const k of keys) ok(foodAllowed(k, diet), `${meal.name}: ${k} bu diyete uymuyor · ${where}`);
      ok(keys.filter(legume).length <= 1, `${meal.name}: birden çok baklagil (${keys.join(", ")}) · ${where}`);
      if (cat === "kahvalti" || cat === "ara") {
        ok(!keys.some(k => legume(k) && !READY_LEGUMES.has(k)), `${meal.name}: kuru baklagil (${keys.join(", ")}) · ${where}`);
        ok(!keys.some(k => MEAL_GRAINS.has(k)), `${meal.name}: yemeklik tahıl (${keys.join(", ")}) · ${where}`);
      }
    });
    ok(Math.abs(m.total.kcal - p.kcal) / p.kcal <= 0.1, `menü ${m.total.kcal} kcal, hedef ${p.kcal} kcal · ${where}`);
  }
});

/* ---- ölçüm değerlendirme ---- */
test("değerlendirme: az, yeterli ve fazla doğru etiketlenir", async () => {
  state = await loadFixture();
  const p = buildProgram(state.profile, 82, 0);
  const label = kcal => {
    const html = evaluate({ weight:82, sleep:8, kcal, water:p.water }, state.profile, p, 82)[2];
    return (html.match(/<b class="[^"]*">([^<]+)<\/b>/) || [])[1];
  };
  eq(label(Math.round(p.kcal * 0.5)), "Az");
  eq(label(p.kcal), "Yeterli");
  eq(label(Math.round(p.kcal * 1.5)), "Fazla");
});

test("değerlendirme: hesap ekrandan bağımsız, yalnızca sayı ve durum döndürür", async () => {
  state = await loadFixture();
  const p = buildProgram(state.profile, 82, 0);
  const a = assess({ weight:82, sleep:5, kcal:p.kcal, water:p.water * 2 }, state.profile, p, 82, [7, 9]);
  eq(a.map(x => [x.id, x.status]), [["weight", "high"], ["sleep", "low"], ["kcal", "ok"], ["water", "high"]]);
  eq(Math.round(a[0].bmi * 10) / 10, 25.9, "BMI");
  eq([a[2].low, a[2].high], [p.kcal * 0.9, p.kcal * 1.1], "kalori bandı");
  ok(!JSON.stringify(a).includes("<"), "hesap çıktısında HTML olmamalı");
  /* Kilo bilinmiyorsa kalori ve su hesaplanamaz. */
  const b = assess({}, state.profile, p, null, [7, 9]);
  eq(b.map(x => [x.id, x.value, !!x.unknown]), [["weight", null, false], ["sleep", null, false], ["kcal", null, true], ["water", null, true]]);
});
test("dil: kayıtlı seçim yoksa eski kullanıcı Türkçe kalır, yeni kullanıcı tarayıcı dilini alır", () => {
  const names = [LANG_KEY, KEY, ...OLD_KEYS];
  const saved = names.map(k => localStorage.getItem(k));
  const force = window.STARBOARD_LANG;
  const nav = Object.getOwnPropertyDescriptor(Navigator.prototype, "languages");
  const setNav = list => Object.defineProperty(navigator, "languages", { get: () => list, configurable: true });
  try {
    delete window.STARBOARD_LANG;
    names.forEach(k => localStorage.removeItem(k));
    setNav(["en-US"]); eq(detectLang(), "en", "yeni kullanıcı, İngilizce tarayıcı");
    setNav(["tr-TR"]); eq(detectLang(), "tr", "yeni kullanıcı, Türkçe tarayıcı");
    setNav(["de-DE"]); eq(detectLang(), "en", "desteklenmeyen dil İngilizceye düşer");
    localStorage.setItem(KEY, "{}");
    setNav(["en-US"]); eq(detectLang(), "tr", "kaydı olan eski kullanıcı Türkçe kalır");
    localStorage.setItem(LANG_KEY, "en"); eq(detectLang(), "en", "Ayarlar'daki seçim hepsinin önüne geçer");
  } finally {
    delete navigator.languages;
    if (nav) Object.defineProperty(Navigator.prototype, "languages", nav);
    window.STARBOARD_LANG = force;
    names.forEach((k, i) => { if (saved[i] === null) localStorage.removeItem(k); else localStorage.setItem(k, saved[i]); });
  }
});

/* ---- eski kayıt uyumluluğu ---- */
test("yedek: sürüm 1 kaydı açılır ve bütün sekmeler çizilir", async () => {
  state = await loadFixture();
  migrateMeals();
  notice = null; viewDate = null;
  ensureToday();
  for (const t of ["today", "plan", "meals", "calendar", "settings"]) {
    tab = t; render();
    ok(app.innerHTML.length > 500, `${t} sekmesi boş çizildi`);
  }
  ok(state.days["2026-11-10"].weight === 82.2, "eski gün verisi korunmadı");
});
test("ilk giriş: kayıt yokken karşılama ekranı çizilir", () => {
  state = null; tab = "today";
  render();
  ok(app.innerHTML.includes("Starboard"), "karşılama ekranı gelmedi");
});

/* ---- gün puanı ve yıldızlar ---- */
/* Antrenmansız bir profil ve dün için eksiksiz veri: kilo, uyku, kalori, su. */
const scoreSetup = async () => {
  state = await loadFixture();
  state.profile.noPlan = true;
  state.days = {};
  const k = shiftDays(today(), -1);
  state.days[k] = { weight: 82, tasks: [] };
  calcReset();
  const p = currentProgram();
  Object.assign(state.days[k], { sleep: 8, kcal: p.kcal, water: p.water });
  calcReset();
  return { k, p };
};
test("gün puanı: bütün veriler hedefteyse gün tamam sayılır", async () => {
  const { k } = await scoreSetup();
  const s = dayScore(k);
  ok(s.total >= 4, `en az dört ölçüt bekleniyordu, ${s.total} çıktı`);
  eq(s.done, s.total, "tamamlanan ölçüt sayısı");
  eq(dayRatio(k), 1);
});
test("gün puanı: eksik veri puanı düşürür, elle eklenen görev sayılır", async () => {
  const { k } = await scoreSetup();
  const full = dayScore(k).total;
  delete state.days[k].water; calcReset();
  eq(dayScore(k), { done: full - 1, total: full }, "su girilmeyince");
  state.days[k].tasks.push({ id: 1, title: "Kitap oku", done: false }); calcReset();
  eq(dayScore(k), { done: full - 1, total: full + 1 }, "elle görev eklenince");
  state.days[k].tasks[0].done = true; calcReset();
  eq(dayScore(k), { done: full, total: full + 1 }, "elle görev bitince");
});
test("gün puanı: günlüğü olmayan geçmiş günde protein puana girmez", async () => {
  const { k } = await scoreSetup();
  const without = dayScore(k).total;
  state.days[k].log = [{ k: "yumurta", g: 100, p: 12.6, c: 0.8, f: 10, n: "Yumurta" }]; calcReset();
  eq(dayScore(k).total, without + 1, "günlük girilince protein ölçütü eklenmeli");
});
test("yıldız: tamamlanan gün damgalanır ve hedef sonradan değişse de kalır", async () => {
  const { k } = await scoreSetup();
  eq(stampStar(k), true, "ilk damga");
  eq(state.days[k].star, true);
  eq(stampStar(k), false, "ikinci kez damgalamak değişiklik yapmamalı");
  /* Geçmiş bir günün verisi eksilse de kazanılmış yıldız silinmez. */
  delete state.days[k].water; calcReset();
  stampStar(k);
  eq(state.days[k].star, true, "geçmiş günün yıldızı korunmalı");
});
test("yıldız: günün bütün verisi silinirse damga kalkar", async () => {
  const { k } = await scoreSetup();
  stampStar(k);
  state.days[k] = { tasks: [], star: true }; calcReset();
  eq(stampStar(k), true);
  ok(!state.days[k].star, "boşaltılan günün yıldızı kalkmalı");
});

/* ---- haftalık yenileme ---- */
/* Bu hafta ve geçen hafta için üçer tartı; cur ve prev haftalık ortalamalardır. */
const refreshSetup = async (goal, prev, cur, adjustment) => {
  const s = await loadFixture();
  s.profile.goal = goal; s.adjustment = adjustment || 0; s.lastRefreshAt = null; s.days = {};
  const t = today();
  for (const n of [1, 2, 3]) s.days[shiftDays(t, -n)] = { weight: cur, tasks: [] };
  for (const n of [8, 9, 10]) s.days[shiftDays(t, -n)] = { weight: prev, tasks: [] };
  return s;
};
test("haftalık yenileme: yedi gün dolmadan çalışmaz", async () => {
  const s = await refreshSetup("lose", 82, 82);
  s.lastRefreshAt = shiftDays(today(), -3);
  eq(weeklyRefresh(s), null);
});
test("haftalık yenileme: yeterli tartı yoksa hedefe dokunmaz", async () => {
  const s = await refreshSetup("lose", 82, 82);
  delete s.days[shiftDays(today(), -1)];
  const r = weeklyRefresh(s);
  eq([r.save, s.adjustment, s.lastRefreshAt], [false, 0, null]);
});
test("haftalık yenileme: kilo verilmiyorsa kalori düşer, çok hızlı veriliyorsa artar", async () => {
  let s = await refreshSetup("lose", 82, 82);
  let r = weeklyRefresh(s);
  eq([r.save, s.adjustment, s.lastRefreshAt], [true, -STEP, today()], "kilo sabit");
  s = await refreshSetup("lose", 82, 79);
  weeklyRefresh(s);
  eq(s.adjustment, STEP, "çok hızlı kayıp");
});
test("haftalık yenileme: hedeflenen hızdaysa kalori değişmez", async () => {
  const [lo, hi] = GOAL.lose.range;
  const s = await refreshSetup("lose", 82, +(82 * (1 + (lo + hi) / 200)).toFixed(3));
  const r = weeklyRefresh(s);
  eq([r.save, s.adjustment, s.lastRefreshAt], [true, 0, today()]);
});
test("haftalık yenileme: kilo almada yön tersine işler ve düzeltme sınırı aşılmaz", async () => {
  let s = await refreshSetup("gain", 70, 70);
  weeklyRefresh(s);
  eq(s.adjustment, STEP, "kilo alınmıyorsa kalori artmalı");
  s = await refreshSetup("lose", 82, 82, -MAX_ADJ);
  const r = weeklyRefresh(s);
  eq([r.save, s.adjustment], [true, -MAX_ADJ], "sınırda kalmalı");
});

/* ---- hareket animasyonları ---- */
test("animasyon: rehberdeki her hareketin bir animasyonu var", () => {
  const missing = GUIDE.filter(g => !exAnimFor(g.id)).map(g => g.id);
  eq(missing, [], "animasyonu olmayan hareketler");
  const unknown = Object.entries(EX_ANIM_OF).filter(([id, key]) => !GUIDE_BY_ID[id] || !EX_ANIMS[key]).map(([id]) => id);
  eq(unknown, [], "rehberde ya da animasyon listesinde karşılığı olmayan eşleşmeler");
});
test("animasyon: bütün pozlar çizim alanının içinde kalır", () => {
  const bad = [];
  for (const [key, a] of Object.entries(EX_ANIMS)) {
    ok(a.f.length >= 2 && a.d > 0, `${key}: en az iki poz ve bir süre gerekli`);
    const frames = a.f.map(exPose);
    ok(frames.every(p => p.on === frames[0].on), `${key}: pozlar aynı ekleme sabitlenmeli`);
    for (const v of [0, 0.25, 0.5, 0.75, 1]) {
      const j = exJoints(exAt(frames, v));
      for (const [name, [x, y]] of Object.entries(j)) {
        const inside = Number.isFinite(x) && Number.isFinite(y)
          && x >= 0 && x <= EXA.W && y >= EXA.TOP && y <= EXA.FLOOR + 6;
        if (!inside) bad.push(`${key} ${name} @${v}: ${x.toFixed(0)},${y.toFixed(0)}`);
      }
    }
  }
  eq(bad, [], "alan dışına taşan eklemler");
});
test("animasyon: açık rehber kartında sahne kurulur ve Motion ile oynar", async () => {
  ok(window.Motion && typeof Motion.animate === "function", "Motion kütüphanesi yüklenmedi");
  state = await loadFixture();
  migrateMeals(); notice = null; viewDate = null;
  tab = "plan"; planTab = "howto"; howQuery = "squat"; howOpen = "squat";
  render();
  const svg = app.querySelector('.how-anim[data-anim="squat"] svg');
  ok(svg, "sahne kurulmadı");
  ok(svg.querySelector('[data-j="leg"]').getAttribute("points").split(" ").length === 3, "bacak çizilmedi");
  howOpen = null; howQuery = ""; planTab = "log"; tab = "today"; render();
  exAnimStop();
});

/* ---- veri sürümü ve depolama ---- */
test("veri sürümü: sürümsüz eski kayıt güncel biçime taşınır", async () => {
  const s = await loadFixture();
  delete s.v; delete s.starred; delete s.profile.venue;
  const m = migrateState(s);
  eq([m.changed, m.newer], [true, false]);
  eq(s.v, SCHEMA, "sürüm");
  eq(s.profile.venue, "gym", "eksik ortam alanı doldurulmalı");
  eq(s.starred, 1, "yıldız damgası işareti");
  eq(s.days["2026-11-10"].weight, 82.2, "gün verisi korunmalı");
  /* İkinci kez çalıştırmak hiçbir şeyi değiştirmemeli. */
  const before = JSON.stringify(s);
  eq(migrateState(s).changed, false);
  eq(JSON.stringify(s), before);
});
test("veri sürümü: her eski sürüm için bir göç adımı var", () => {
  for (let v = 1; v < SCHEMA; v++) ok(typeof MIGRATIONS[v] === "function", `${v} sürümünden ${v + 1} sürümüne adım eksik`);
});
test("veri sürümü: daha yeni biçimdeki kayda dokunulmaz", async () => {
  const s = await loadFixture();
  s.v = SCHEMA + 1;
  const before = JSON.stringify(s);
  eq(migrateState(s), { changed:false, newer:true });
  eq(JSON.stringify(s), before);
});
test("depolama: eski adla duran kayıt okunur, yeni adla yazılır, silince ikisi de gider", async () => {
  /* Bu test tarayıcı deposuna dokunur; mevcut değerleri saklayıp geri koyar. */
  const names = [KEY, ...OLD_KEYS];
  const saved = names.map(k => localStorage.getItem(k));
  const realSave = saveState;
  try {
    names.forEach(k => localStorage.removeItem(k));
    eq(await loadState(), null, "boş depoda kayıt olmamalı");

    const fixture = await loadFixture();
    localStorage.setItem(OLD_KEYS[0], JSON.stringify(fixture));
    const s = await loadState();
    ok(s && s.profile.name === "Test", "eski adla duran kayıt okunmadı");
    eq(loadedFromOldKey, true);

    saveState = async x => { localStorage.setItem(KEY, JSON.stringify(x)); };
    migrateState(s);
    await saveState(s);
    const again = await loadState();
    eq([again.v, loadedFromOldKey], [SCHEMA, false], "ikinci açılış yeni addan okumalı");
    ok(localStorage.getItem(OLD_KEYS[0]) !== null, "eski kayıt yedek olarak yerinde kalmalı");

    await clearState();
    eq(await loadState(), null, "silme sonrası eski kayıt geri gelmemeli");
  } finally {
    saveState = realSave;
    names.forEach((k, i) => { if (saved[i] === null) localStorage.removeItem(k); else localStorage.setItem(k, saved[i]); });
  }
});

/* ---- çeviri ---- */
const withLang = async (lang, fn) => { const old = LANG; LANG = lang; try { return await fn(); } finally { LANG = old; } };

test("çeviri: Türkçede metin aynen döner, yer tutucular dolar", () => {
  eq(tx("Kaydet"), "Kaydet");
  eq(tx("{0} tarif bulundu", [3]), "3 tarif bulundu");
  eq(tx("{0} / {1} adım", [10, 20]), "10 / 20 adım");
});
test("çeviri: İngilizcede sözlükteki karşılık gelir, olmayan metin Türkçe kalır", async () => {
  await withLang("en", () => {
    eq(tx("Kaydet"), "Save");
    eq(tx("{0} tarif bulundu", [3]), "3 recipes found");
    eq(tx("{0} beslenmeye uyan {1} tarif", ["Vegan", 5]), "5 recipes for the Vegan diet", "yer tutucu sırası değişebilmeli");
    eq(tx("Sözlükte olmayan bir metin"), "Sözlükte olmayan bir metin");
  });
});
test("çeviri: sözlükteki her karşılık anahtarıyla aynı yer tutucuları taşır", () => {
  const holes = s => [...new Set(s.match(/\{\d+\}/g) || [])].sort();
  const bad = [];
  for (const [k, v] of Object.entries(I18N.en)) {
    const a = holes(k), b = holes(v);
    /* Karşılık bir yer tutucuyu bilerek atlayabilir, ama anahtarda olmayanı kullanamaz. */
    if (b.some(h => !a.includes(h)) || typeof v !== "string" || !v) bad.push(k);
  }
  eq(bad, [], "hatalı sözlük kayıtları");
  ok(Object.keys(I18N.en).length > 1300, "sözlük beklenenden küçük");
});
test("çeviri: besin adları, porsiyonlar ve tarifler İngilizcede çevrilir", async () => {
  await withLang("en", () => {
    eq(tx("Yumurta"), "Egg");
    eq(tx("Tam buğday ekmeği"), "Whole wheat bread");
    eq(tx("yemek kaşığı"), "tbsp");
    eq(tx("Fırını 200°C'ye ısıt."), "Heat the oven to 200°C.");
    /* Mikro besin kodu kodda anahtar olarak kullanılır; çevrilirse eşleşme bozulur. */
    eq(tx("çinko"), "çinko");
  });
  const untranslated = Object.values(FOODS).map(f => f.n).filter(n => !Object.prototype.hasOwnProperty.call(I18N.en, n));
  eq(untranslated, [], "İngilizce karşılığı olmayan besin adları");
});
test("çeviri: İngilizce modda bütün sekmeler ve giriş ekranları çizilir", async () => {
  const fixture = await loadFixture();
  await withLang("en", () => {
    state = fixture; migrateMeals(); notice = null; viewDate = null; ensureToday();
    for (const t of ["today", "plan", "meals", "calendar", "settings"]) {
      tab = t; render();
      ok(app.innerHTML.length > 500, `${t} sekmesi boş çizildi`);
    }
    tab = "settings"; render();
    ok(app.innerHTML.includes("My body") && app.innerHTML.includes("Settings"), "Ben sekmesi İngilizce çizilmedi");
    state = null; tab = "today"; render();
    ok(app.innerHTML.includes("One board for your health."), "karşılama ekranı İngilizce çizilmedi");
  });
});

test("çeviri: antrenman satırları yalnızca gösterirken çevrilir", async () => {
  /* Türkçede metin aynen döner. */
  eq(exText("Omuz press 3×10 · 20 dk koşu"), "Omuz press 3×10 · 20 dk koşu");
  await withLang("en", () => {
    EX_KEYS = null;
    eq(exText("Omuz press 3×10 · Kürek 3×10 · Plank 3×45 sn"), "Shoulder press 3×10 · Row 3×10 · Plank 3×45 s");
    eq(exText("Çantalı Romen deadlift 3×10"), "Backpack Romanian deadlift 3×10");
    eq(exText("5 tur: 30 sn yüksek diz · 30 sn şınav (60 sn ara)"), "5 rounds: 30 s high knees · 30 s push-up (60 s rest)");
    eq(exText("3 set · %65 / %75 / %85 1TM"), "3 sets · %65 / %75 / %85 1RM");
    /* Hazır programların hiçbir satırında Türkçe harf kalmamalı. */
    const left = [];
    for (const p of Object.values(PROGRAMS)) for (const d of p.s)
      if (d.b && /[çğıöşüÇĞİÖŞÜ]/.test(exText(d.b))) left.push(exText(d.b));
    eq(left, [], "çevrilmeden kalan antrenman satırları");
  });
  EX_KEYS = null;
});
test("çeviri: antrenman satırları kodda Türkçe kalır (ayrıştırma ve rehber buna bağlı)", () => {
  /* Bu satırlar sözlüğe yazılırsa tx() onları ayrıştırmadan önce çevirir ve kayıtlar kopar. */
  const inDict = [];
  for (const p of Object.values(PROGRAMS)) for (const d of p.s)
    if (d.b && Object.prototype.hasOwnProperty.call(I18N.en, d.b)) inDict.push(d.b);
  eq(inDict, [], "sözlüğe yazılmış antrenman satırları");
  const ex = parseEx("Omuz press 3×10", "gym");
  eq([ex.t, ex.name, ex.n], ["w", "Omuz press", 3]);
  ok(guidesFor("Omuz press 3×10").length === 1, "rehber eşleşmedi");
});
test("çeviri: hareket rehberinin adları ve adımları İngilizcede çevrilir", () => {
  const missing = [];
  for (const g of GUIDE) for (const s of [g.n, g.x, ...g.s])
    if (!Object.prototype.hasOwnProperty.call(I18N.en, s)) missing.push(s);
  eq(missing, [], "İngilizce karşılığı olmayan rehber metinleri");
});

/* ---- görevler başka dilde ---- */
test("görevler: İngilizcede öneriler Türkçe başlık ve türle kaydedilir, tekrar çizimde çoğalmaz", async () => {
  const fixture = await loadFixture();
  await withLang("en", () => {
    state = fixture; migrateMeals(); notice = null; viewDate = null;
    delete state.days[today()];
    for (let i = 0; i < 5; i++) { ensureToday(); tab = "today"; render(); }
    const tasks = state.days[today()].tasks.filter(t => t.suggested);
    const kinds = tasks.map(t => taskKind(t));
    eq(kinds.filter(k => k === "train").length <= 1, true, "antrenman görevi çoğaldı");
    for (const k of ["kcal", "protein", "water", "sleep", "weigh"]) ok(kinds.includes(k), `${k} görevi tanınmadı`);
    ok(tasks.every(t => !/^(Workout|Rest day|Morning)/.test(t.title)), "başlık İngilizce kaydedildi");
  });
  state = null;
});
test("görevler: eski İngilizce başlıklar tanınır, birikmiş kopyalar temizlenir", async () => {
  eq(taskKind({ title:"2870 ml of water" }), "water");
  eq(taskKind({ title:"Drink 97 fl oz of water" }), "water");
  eq(taskKind({ title:"Morning weigh-in" }), "weigh");
  eq(taskKind({ title:"Workout: Upper B" }), "train");
  eq(taskKind({ title:"8000 steps" }), "steps");
  const fixture = await loadFixture();
  state = fixture;
  const p = currentProgram(), k = today();
  const day = p.training.days.find(d => d.wd === isoWeekday(k));
  const t = day && day.b ? "Workout: " + day.t : "Rest day — 20 min stretching";
  state.days[k] = { seeded:true, tasks: [1, 2, 3].map(i => ({ id:i, title:t, done:false, suggested:true })) };
  syncOptional(state.days[k], k);
  const left = state.days[k].tasks.filter(x => x.suggested && (taskKind(x) === "train" || isRestTask(x)));
  eq(left.length, 1, "kopyalar kalmamalı");
  state = null;
});

test("hızlı giriş: penceredeki metinler boş ya da undefined çıkmaz", async () => {
  state = await loadFixture(); migrateMeals(); viewDate = null; ensureToday();
  openQuickSheet();
  const sheets = [...document.querySelectorAll(".sheet-bg")];
  const html = sheets.map(e => e.innerHTML).join("");
  sheets.forEach(e => e.remove());
  ok(!/>undefined</.test(html), "pencerede undefined yazıyor");
  const ses = currentProgram().training.days.find(d => d.wd === isoWeekday(today()));
  if (ses && ses.b) ok(html.includes(esc(ses.t)), "antrenman adı görünmüyor");
  state = null;
});

/* ---- birimler ---- */
/* Birim seçimi state.profile.units'ten okunur; testler geçici bir kayıtla seçer. */
const withUnits = async (units, fn, base) => {
  const old = state;
  state = base || { profile: { units } };
  if (base) state.profile.units = units;
  try { return await fn(); } finally { state = old; }
};

test("birimler: bölgeye göre varsayılan sistem", () => {
  eq(unitsForLocale("en-US"), "imperial");
  eq(unitsForLocale("en_us"), "imperial");
  eq(unitsForLocale("en-GB"), "metric");
  eq(unitsForLocale("tr-TR"), "metric");
  eq(unitsForLocale("en"), "metric", "bölgesiz dil metrik sayılır");
  eq(unitsForLocale(""), "metric");
});
test("birimler: metrikte değerler olduğu gibi, Türkçede ondalık virgül", async () => {
  await withUnits("metric", () => {
    eq(fmtW(75.34), "75,3 kg");
    eq(fmtV(2870), "2870 ml");
    eq(fmtLift(22.5), "22,5");
    eq(fmtHeight(178), "178 cm");
    eq(wSave(75.36), 75.4);
    eq(cupMl(), 250);
  });
});
test("birimler: İngilizcede ondalık nokta", async () => {
  await withLang("en", () => withUnits("metric", () => {
    eq(fmtW(75.34), "75.3 kg");
    eq(fmtN(22.5), "22.5");
  }));
});
test("birimler: imperialde lb, ft·in ve fl oz; kayıt metrik kalır", async () => {
  await withUnits("imperial", () => {
    /* 180 lb yazan kişi geri 180,0 lb görür */
    const kg = wSave(180);
    ok(Math.abs(kg - 81.647) < 0.001, "kg karşılığı yanlış: " + kg);
    eq(wNum(kg), "180,0");
    eq(fmtW(kg), "180,0 lb");
    /* kaldırılan ağırlık: 45 lb kaydedilip yine 45 lb görünür */
    eq(fmtLift(liftIn(45)), "45");
    eq(liftStep(), 5);
    /* boy */
    eq(fmtHeight(177.8), "5′10″");
    eq(heightFtIn(177.8), [5, 10]);
    eq(heightFromFtIn(5, 10), 177.8);
    /* su: 8 fl oz'luk bardaklar, dolu bardak sayısı yuvarlamadan şaşmaz */
    eq(fmtV(2870), "97 fl oz");
    for (let n = 1; n <= 14; n++) eq(cupsOf(Math.round(n * cupMl())), n, `${n} bardak`);
    eq(vIn(8), 237);
    /* vücut ölçüsü */
    eq(lOut(lIn(32)), 32);
    /* antrenman özeti: kg olarak kayıtlı set lb ile görünür */
    const ex = parseEx("Squat 3×5", "gym");
    eq(liftSummary({ t:"w", sets:[{ kg:liftIn(135), r:5 }, { kg:liftIn(135), r:5 }] }, ex), "135 lb · 5-5 tekrar");
  });
});
test("birimler: imperial seçiliyken bütün sekmeler lb ile çizilir, metrik kayıt değişmez", async () => {
  const fixture = await loadFixture();
  await withLang("en", () => withUnits("imperial", () => {
    migrateMeals(); notice = null; viewDate = null; ensureToday();
    /* Görev listesi çizimde güncellenebilir; burada yalnızca ölçümlere bakılır. */
    const measures = () => JSON.stringify(Object.entries(state.days).map(([k, d]) => [k, d.weight, d.water, d.body, d.lifts]));
    const snap = measures();
    for (const t of ["today", "plan", "meals", "calendar", "settings"]) {
      tab = t; render();
      ok(app.innerHTML.length > 500, `${t} sekmesi boş çizildi`);
    }
    tab = "settings";
    const oldMe = meTab;
    for (const m of ["body", "chart"]) {
      meTab = m; render();
      ok(/\d lb\b|<small> lb<\/small>/.test(app.innerHTML), `Ben › ${m}: lb yok`);
      ok(!/\d kg\b|<small> kg<\/small>/.test(app.innerHTML), `Ben › ${m}: kg kaldı`);
    }
    meTab = "set"; render();
    ok(app.innerHTML.includes('data-sunit="imperial"'), "birim seçimi yok");
    ok(app.innerHTML.includes('id="s-hft"'), "boy ft·in olarak sorulmuyor");
    meTab = oldMe;
    eq(measures(), snap, "çizim ölçümleri değiştirmemeli");
  }, fixture));
  tab = "today"; state = null;
});

window.STARBOARD_TESTS = TESTS;
