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

window.STARBOARD_TESTS = TESTS;
