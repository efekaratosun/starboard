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

/* ---- genişletilmiş besin veritabanı ---- */
const sourcedFoods = () => Object.entries(FOODS).filter(([,f]) => f.src);
test("besin veritabanı: 1325 yeni kayıt (382 USDA, 943 web) eklendi", () => {
  const added = sourcedFoods();
  eq([added.length, Object.keys(FOODS).length], [1325, 1752]);
  eq(added.filter(([,f]) => f.src.startsWith("USDA ")).length, 382);
  eq(added.filter(([,f]) => f.src.startsWith("web ")).length, 943);
});
test("besin veritabanı: yeni kayıtların makroları geçerli", () => {
  const bad = sourcedFoods().filter(([k,f]) => ![f.p, f.c, f.f, f.lif].every(v => typeof v === "number" && v >= 0 && v <= 100)
    || f.p + f.c + f.f > 100.5 || (f.alk !== undefined && (!Number.isFinite(f.alk) || f.alk < 0 || f.alk > 100)));
  eq(bad.map(([k]) => k), [], "geçersiz yeni besin makroları");
});
test("besin veritabanı: yeni kayıtlar mevcut ad ve anahtarlarla çakışmıyor", () => {
  const base = Object.entries(FOODS).filter(([,f]) => !f.src);
  const baseNames = new Set(base.map(([,f]) => norm(f.n))), baseKeys = new Set(base.map(([k]) => norm(k)));
  const added = sourcedFoods();
  const overlap = added.filter(([k,f]) => baseNames.has(norm(f.n)) || baseKeys.has(norm(k)));
  eq(overlap.map(([k]) => k), [], "yeni kayıt çakışması");
  eq(new Set(added.map(([,f]) => norm(f.n))).size, added.length, "yeni kayıt adları yineleniyor");
});
test("besin veritabanı: alkol 7 kcal/g hesaplanıyor ve yeni günlük kalemine taşınıyor", async () => {
  const alcoholic = sourcedFoods().filter(([,f]) => f.alk > 0);
  eq(alcoholic.length, 35);
  eq(kcalFromMacros({ p:0, c:0, f:0, alk:10 }), 70);
  const oldState = state;
  try {
    state = await loadFixture();
    state.customFoods = state.customFoods || {};
    state.customFoods.alcoholTest = { n:"Test alkolü", p:0, c:0, f:0, alk:10, lif:0, i:"grain" };
    const entry = { log:[] }, item = addFoodDirect(entry, "alcoholTest", 50, "test");
    eq([item.alk, entry.kcal], [10, 35]);
  } finally { state = oldState; }
});
test("besin veritabanı: alkolsüz mevcut besin ve eski günlük kalorileri değişmedi", () => {
  const changed = Object.entries(FOODS).filter(([,f]) => !f.src && !f.alk)
    .filter(([,f]) => Math.abs(kcalFromMacros(f) - (f.p * 4 + f.c * 4 + f.f * 9)) > 1e-9);
  eq(changed.map(([k]) => k), [], "alkolsüz besin kalorisi değişti");
  const old = { log:[{ p:10, c:20, f:5, g:100 }] };
  eq([logTotals(old).kcal, logTotals(old).alk], [165, 0]);
});
test("besin veritabanı: Türkçe adlar veritabanında korunuyor", () => {
  /* "Düğün çorbası" gibi yemekler temel kayıtta (nutrition.js) da olabilir;
      adın korunması bütün veritabanında aranır. */
  const names = new Set(Object.values(FOODS).map(f => f.n));
  ok(names.has("Ada çayı") && names.has("Düğün çorbası") && names.has("Bira"), "örnek Türkçe adlar eksik");
  eq(FOODS.adacayi.n, "Ada çayı");
  eq(FOODS.duguncorbasi.n, "Düğün çorbası");
});
test("besin veritabanı: her yeni Türkçe adın İngilizce karşılığı var", async () => {
  const missing = sourcedFoods().map(([,f]) => f.n).filter(n => !Object.prototype.hasOwnProperty.call(I18N.en, n));
  eq(missing, [], "İngilizce adı olmayan yeni besinler");
  await withLang("en", () => {
    eq(tx("Ada çayı"), "sage tea");
    eq(tx("Düğün çorbası"), "Turkish wedding soup");
    eq(tx("Bira"), "Beer");
  });
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
test("öneriler: yalnızca onaylı havuz kullanılır; yeni kayıt, alkol, sos, baharat ve tatlı çıkmaz", async () => {
  const fixture = await loadFixture();
  const forbidden = /\b(alkol|bira|şarap|votka|viski|rom|sos|soslu|baharat|tarçın|kekre|tatlı|şeker|çikolata|pasta|kek|dessert|cake|cookie|candy|sweet|sauce|spice)\b/i;
  const label = k => `${k} ${FOODS[k] ? FOODS[k].n : ""}`;
  const badPool = [...SUGGEST_FOODS].filter(k => !FOODS[k] || FOODS[k].src || (FOODS[k].alk || 0) > 0
    || !PORTION[k] || NO_SUGGEST.has(k) || forbidden.test(label(k)));
  eq(badPool, [], "onaylı öneri havuzu uygun olmayan besin içeriyor");

  const unapproved = new Set();
  for (const group of Object.values(PLATES)) for (const plate of group) for (const eye of plate.g)
    for (const k of eye.k.concat(eye.big || [], eye.rich || [])) if (!SUGGEST_FOODS.has(k)) unapproved.add(k);
  eq([...unapproved], [], "tabak adayları onaylı havuzda değil");

  const profiles = [
    { sex:"male", goal:"lose", cuisine:"tr", diet:"hepsi", weight:82 },
    { sex:"male", goal:"maintain", cuisine:"intl", diet:"hepsi", weight:82 },
    { sex:"male", goal:"gain", cuisine:"tr", diet:"vejetaryen", weight:82 },
    { sex:"female", goal:"lose", cuisine:"intl", diet:"hepsi", weight:60 },
    { sex:"female", goal:"maintain", cuisine:"tr", diet:"hepsi", weight:60 },
    { sex:"female", goal:"gain", cuisine:"intl", diet:"hepsi", weight:60 }
  ];
  const used = new Set();
  for (const o of profiles) {
    state = JSON.parse(JSON.stringify(fixture));
    Object.assign(state.mealPrefs, { cuisine:o.cuisine, diet:o.diet });
    const p = buildProgram(profileOf(o), o.weight, 0);
    for (let v = 0; v < 14; v++) for (const meal of buildMeals(p, v).meals)
      for (const item of meal.items) if (item.key && !item.fixed) used.add(item.key);
  }
  state = null;
  eq([...used].filter(k => !SUGGEST_FOODS.has(k)), [], "onaylı havuz dışı besin önerildi");
  eq([...used].filter(k => FOODS[k].src), [], "yeni kayıtlı besin önerildi");
  eq([...used].filter(k => (FOODS[k].alk || 0) > 0), [], "alkollü besin önerildi");
  eq([...used].filter(k => forbidden.test(label(k))), [], "alkol, sos, baharat veya tatlı önerildi");
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

/* ---- öğün önerilerinin kuralları: birçok profil, beslenme türü ve 7 gün ---- */
const MEAL_RULES = (() => {
  const F = k => FOODS[k];
  const p0 = k => F(k).unit || (porsOf(F(k))[0] || {}).g || 100;
  const liquid = new Set(["yogurt","suzme","skyr","yunanyogurt","kefir","sut","ayran","cacik","soyasutu","bitkiselyogurt"]);
  /* Bir öğünde akla yatkın en çok miktar (gram); kalıp tablosundan (PORTION) bağımsız. */
  const cap = k => {
    const f = F(k);
    if (k === "yumurta") return 150;
    if (f.unit) return f.unit * 2;
    if (f.i === "egg") return 350;
    if (f.i === "fruit") return fruitServing(k) * 2;
    if (liquid.has(k)) return 300;
    if (["lor","cottage","cokelek"].includes(k)) return 200;
    if (f.i === "dairy") return 100;
    if (["meat","poultry","fish"].includes(f.i)) return 300;
    if (f.i === "bread") return 150;
    if (f.i === "grain") {
      if (BREAKFAST_GRAINS.has(k) || k === "tahilhalka") return 120;
      return /\((pişmiş|haşlanmış)\)/.test(f.n) ? 480 : 180;
    }
    if (f.i === "legume") {
      if (f.n.endsWith("(haşlanmış)")) return 300;
      return f.c >= 45 ? 130 : 250;
    }
    if (["tahin","fistikezmesi","findikezmesi","bademezmesi"].includes(k)) return 32;
    if (f.i === "nuts") return 40;
    if (k === "zeytin" || k === "yesilzeytin") return 40;
    if (f.i === "oil") return 25;
    if (f.i === "avocado") return 150;
    if (f.i === "potato") return 450;
    return 300;
  };
  const meaty = k => ["meat","poultry","fish"].includes(F(k).i) && F(k).cat !== "sarkuteri";
  const dryLegume = k => foodCat(F(k)) === "baklagil" && !READY_LEGUMES.has(k) && F(k).c >= 25;
  /* Bir planın bütün günlük kurallarını denetler; bozulanları metin olarak döndürür. */
  const dayErrors = (m, cats, diet) => {
    const bad = [], seen = {};
    m.meals.forEach((meal, i) => {
      const light = cats[i] === "kahvalti" || cats[i] === "ara";
      const its = meal.items.filter(x => x.key && !x.fixed);
      let fruit = 0;
      for (const it of its) {
        const k = it.key;
        if (it.g > cap(k)) bad.push(`${meal.name}: ${it.text} çok`);
        if (F(k).i === "fruit") fruit += it.g / fruitServing(k);
        if (!foodAllowed(k, diet)) bad.push(`${meal.name}: ${k} diyete uymuyor`);
        if (light && (meaty(k) || dryLegume(k) || MEAL_GRAINS.has(k) || F(k).i === "potato"))
          bad.push(`${meal.name}: ${k} hafif öğüne uymuyor`);
        if (!light && BREAKFAST_GRAINS.has(k)) bad.push(`${meal.name}: ${k} ana öğüne uymuyor`);
        if (F(k).i !== "oil") (seen[k] = seen[k] || []).push(meal.name);
      }
      if (fruit > 2.01) bad.push(`${meal.name}: ${fruit.toFixed(1)} porsiyon meyve`);
      const keys = its.map(x => x.key);
      if (diet === "koser" && keys.some(hasMeatK) && keys.some(hasDairyK)) bad.push(`${meal.name}: koşerde et ve süt`);
      if (keys.filter(k => F(k).i === "legume" && F(k).c >= 25).length > 1) bad.push(`${meal.name}: iki baklagil`);
    });
    for (const [k, ms] of Object.entries(seen)) if (ms.length > 1) bad.push(`${k} gün içinde iki kez (${ms.join(", ")})`);
    return bad;
  };
  const mainOf = (m, cats) => m.meals.map((meal, i) => cats[i] !== "kahvalti" && cats[i] !== "ara"
    ? (meal.items.find(x => x.key && !x.fixed) || {}).key : null);
  const sig = meal => meal.items.map(x => x.key).filter(Boolean).sort().join(",");
  return { dayErrors, mainOf, sig };
})();

test("öğün kuralları: 7 günlük planlarda porsiyon, öğüne uygunluk, diyet, tekrar ve hedef", async () => {
  const fixture = await loadFixture();
  const profiles = [[{}, 82], [{ goal:"lose" }, 82], [{ goal:"gain" }, 82],
    [{ sex:"female", height:163, age:27, goal:"lose" }, 60], [{ sex:"female", height:150, age:60, goal:"lose" }, 45],
    [{ activity:"veryActive", goal:"gain" }, 95]];
  const layouts = [DEFAULT_MEALS, fixture.mealPrefs.meals];
  const bad = [];
  let plans = 0;
  for (const cuisine of ["tr", "intl"]) for (const diet of Object.keys(DIETS)) for (const [o, w] of profiles) for (const meals of layouts) {
    state = JSON.parse(JSON.stringify(fixture));
    Object.assign(state.mealPrefs, { cuisine, diet, meals: meals.map(m => ({ ...m })) });
    const p = buildProgram(profileOf(o), w, 0);
    const list = userMeals(), cats = list.map(m => m.cat);
    const shares = mealShares(list);
    /* Tek öğün 1400 kcal'yi geçiyorsa makul porsiyonlarla tutturulamaz; hedef denetlenmez. */
    const feasible = Math.max(...shares) * p.kcal <= 1400;
    const plant = diet === "vegan" || diet === "vejetaryen";
    let prev = null, sumK = 0;
    for (let d = 0; d < 7; d++) {
      const m = buildMeals(p, 1000 + d); plans++;
      const where = `${cuisine}/${diet} ${JSON.stringify(o)} ${list.length} öğün, gün ${d + 1}`;
      MEAL_RULES.dayErrors(m, cats, diet).forEach(e => bad.push(`${e} · ${where}`));
      const mains = MEAL_RULES.mainOf(m, cats);
      if (prev) {
        mains.forEach(k => { if (k && prev.mains.includes(k)) bad.push(`${k} ardışık günde ana yemek · ${where}`); });
        m.meals.forEach((meal, i) => { if (MEAL_RULES.sig(meal) === prev.sigs[i]) bad.push(`${meal.name} dünküyle aynı · ${where}`); });
      }
      prev = { mains, sigs: m.meals.map(MEAL_RULES.sig) };
      sumK += m.total.kcal;
      const pr = m.total.p / p.protein;
      if (pr > 1.4) bad.push(`protein %${Math.round(pr * 100)} · ${where}`);
      if (feasible) {
        if (Math.abs(m.total.kcal - p.kcal) / p.kcal > 0.2) bad.push(`${m.total.kcal}/${p.kcal} kcal · ${where}`);
        if (pr < (diet === "vegan" ? 0.45 : plant ? 0.55 : 0.7)) bad.push(`protein ${m.total.p}/${p.protein} · ${where}`);
      }
    }
    /* Glutensizde büyük öğünün yanına ekmek gelemediği için çok yüksek hedefte ortalama %10'u biraz aşabiliyor. */
    if (feasible && Math.abs(sumK / 7 - p.kcal) / p.kcal > 0.12)
      bad.push(`7 gün ortalaması ${Math.round(sumK / 7)}/${p.kcal} kcal · ${cuisine}/${diet} ${JSON.stringify(o)} ${list.length} öğün`);
  }
  state = null;
  ok(plans > 1000, "yeterli plan üretilmedi");
  eq(bad.slice(0, 25), [], `${bad.length} kural bozuldu`);
});
test("öğün kuralları: öneri her gün kendiliğinden değişir, kahvaltıda en çok iki porsiyon meyve, üç yumurta", async () => {
  state = await loadFixture();
  const p = buildProgram(state.profile, 82, 0);
  const a = buildMeals(p, planDay()), b = buildMeals(p, planDay() + 1);
  ok(a.meals.some((m, i) => MEAL_RULES.sig(m) !== MEAL_RULES.sig(b.meals[i])), "yarının planı bugünküyle aynı");
  for (let d = 0; d < 30; d++) for (const meal of buildMeals(p, d).meals) for (const it of meal.items.filter(x => x.key)) {
    if (it.key === "yumurta") ok(it.g <= 150, `${it.text}`);
    if (it.key === "muz") ok(it.g <= 180, `${it.text}`);
  }
  /* Her kalıp besininin bir porsiyon kuralı var ve kurallar besin veritabanında. */
  for (const g of Object.values(PLATES)) for (const plate of g) for (const z of plate.g)
    for (const k of z.k.concat(z.big || [], z.rich || [])) ok(FOODS[k] && PORTION[k], `${k} için porsiyon kuralı yok`);
  for (const [k, [lo, hi]] of Object.entries(PORTION)) ok(FOODS[k] && lo > 0 && lo <= hi, `${k}: ${lo}-${hi}`);
  state = null;
});
test("besinler: çiğ et değerleri çiğ ağırlığa göre (pişmiş değil)", () => {
  for (const k of ["tavuk", "hindi", "tavukbut", "kofte", "biftek", "kuzu"])
    ok(FOODS[k].p <= 24, `${k}: 100 g çiğde ${FOODS[k].p} g protein pişmiş değer gibi`);
});

/* ---- kayıtlı öğünler ve beslenme özeti ---- */
test("kayıtlı öğün: bir öğün kaydedilir ve başka öğüne tek dokunuşla eklenir", async () => {
  const oldConfirm = window.confirm; window.confirm = () => true;
  try {
    state = await loadFixture(); migrateMeals(); notice = null; viewDate = null; ensureToday();
    const e = state.days[today()];
    const [s1, s2] = slotList().map(([k]) => k);
    e.log = [
      { id:1, k:"yulaf", n:FOODS.yulaf.n, g:60, p:FOODS.yulaf.p, c:FOODS.yulaf.c, f:FOODS.yulaf.f, lif:FOODS.yulaf.lif, v:[], i:"grain", slot:s1 },
      { id:2, k:"muz", n:FOODS.muz.n, g:120, p:FOODS.muz.p, c:FOODS.muz.c, f:FOODS.muz.f, lif:FOODS.muz.lif, v:[], i:"fruit", slot:s1 }];
    syncKcal(e);
    tab = "meals"; mealTab = "log"; render();
    app.querySelector(`[data-savemeal="${s1}"]`).click();
    app.querySelector("#sm-name").value = "Sabah kasesi";
    await app.querySelector("#sm-save").onclick();
    eq(state.savedMeals.length, 1);
    eq(state.savedMeals[0].name, "Sabah kasesi");
    ok(state.savedMeals[0].items.every(it => it.id === undefined && it.slot === undefined), "kimlik ve öğün kayda girmemeli");
    const before = e.kcal;
    app.querySelector(`[data-addfood="${s2}"]`).click();
    await app.querySelector("[data-saved-add]").onclick();
    const added = e.log.filter(it => it.slot === s2);
    eq(added.map(it => it.k), ["yulaf", "muz"]);
    eq(new Set(e.log.map(it => it.id)).size, 4, "her kalem yeni kimlik almalı");
    eq(e.kcal, before * 2, "günün kalorisi güncellenmeli");
    app.querySelector("[data-saved-del]").click();
    await new Promise(r => setTimeout(r, 0));
    ok(!state.savedMeals, "silinince liste kalkmalı");
  } finally { window.confirm = oldConfirm; state = null; tab = "today"; mealTab = "log"; }
});
test("beslenme özeti: yalnızca günlüğü olan günler, ortalama ve en sık eklenenler", () => {
  const it = (k, g) => ({ k, n:FOODS[k].n, g, p:FOODS[k].p, c:FOODS[k].c, f:FOODS[k].f, lif:FOODS[k].lif || 0, v:[] });
  const days = {
    "2026-11-10": { log:[it("tavuk", 200), it("pirinc", 100), it("muz", 120)] },
    "2026-11-09": { log:[it("tavuk", 100), it("yulaf", 50)] },
    "2026-11-08": { kcal:2000 },
    "2026-11-01": { log:[it("somon", 150)] }
  };
  const program = { kcal:2500, protein:120, carb:300, fat:70 };
  const N = nutritionWeek(days, program, "2026-11-11");
  eq(N.days, 2, "günlüksüz ve 7 günden eski günler sayılmaz");
  const t1 = logTotals(days["2026-11-10"]), t2 = logTotals(days["2026-11-09"]);
  eq([N.kcal, N.p], [Math.round((t1.kcal + t2.kcal) / 2), Math.round((t1.p + t2.p) / 2)]);
  eq(N.top[0], { k:"tavuk", n:FOODS.tavuk.n, times:2 });
  eq(N.proteinDays, [t1, t2].filter(x => x.p >= 108).length);
  eq(nutritionWeek({}, program, "2026-11-11"), null);
});
test("kaynak kalorisi kullanılır, eski kayıtlar makrolardan hesaplanır", () => {
  const source = { log:[{ g:100, p:1, c:2, f:1, lif:0, kcal100:50 }] };
  const legacy = { log:[{ g:100, p:1, c:2, f:1, lif:0 }] };
  eq(logTotals(source).kcal, 50, "kaynak enerji değeri korunmalı");
  eq(logTotals(legacy).kcal, 21, "kcal100 olmayan eski kayıtlar geriye uyumlu kalmalı");
  eq(foodEnergyPer100({ p:1, c:2, f:1, kcal100:0 }), 0, "sıfır enerji kaynağı geçerli olmalı");
  const key = Object.keys(FOODS)[0], food = FOODS[key], previous = food.kcal100;
  food.kcal100 = 50;
  try {
    const recipe = recipeMacros({ ing:[[key,100]], srv:1 });
    eq(recipe.serving.kcal, 50, "tarif kaynak enerjisini kullanmalı");
    eq(recipe.per100.kcal, 50, "tarifin 100 g değeri kaynak enerjisini taşımalı");
    const entry = { log:[] };
    addFoodDirect(entry, key, 100, "kahvalti");
    eq(entry.log[0].kcal100, 50, "günlük kaydı kaynak enerjisini korumalı");
    eq(logTotals(entry).kcal, 50, "günlük toplam kaynak enerjisini kullanmalı");
  } finally {
    if (previous === undefined) delete food.kcal100;
    else food.kcal100 = previous;
  }
});

/* ---- alışveriş listesi ---- */
test("alışveriş listesi: sade iki sekme; elle ürünler ve geçmiş kullanımdan öneriler", async () => {
  state = await loadFixture(); migrateMeals(); notice = null; viewDate = null; ensureToday();
  state.shopping = { days:3, recipes:[0], checked:{ legacy:true } };
  const slot = slotList()[0][0];
  state.days[today()].log = [logItem("yulaf", 40, slot, 1), logItem("yulaf", 40, slot, 2), logItem("muz", 120, slot, 3)];
  tab = "meals"; mealTab = "list"; shopTab = "mine"; render();

  eq(app.querySelector("h2").textContent.trim(), "Alışveriş listem", "liste adı");
  const tabs = [...app.querySelectorAll("[data-shop-tab]")];
  eq(tabs.map(b => [b.dataset.shopTab, b.textContent.trim()]), [["mine", "Listem"], ["suggest", "Öneriler"]], "iki küçük sekme");
  ok(!app.querySelector("[data-shop-days]") && !app.querySelector("[data-shop-rdel]") && !app.querySelector("#shop-share") && !app.querySelector("#shop-clear"), "eski plan, tarif ve paylaşım bölümleri kalktı");
  ok(!app.querySelector("[data-shop-k]"), "plan ürünleri doğrudan listede gösterilmiyor");

  const input = app.querySelector("#shop-item-input");
  input.value = "Zeytinyağı";
  await app.querySelector("#shop-item-add").onclick();
  eq(state.shopping.items.length, 1, "kullanıcının girdiği ürün kaydedildi");
  eq(state.shopping.items[0].n, "Zeytinyağı");
  eq(state.shopping.days, 3, "eski gün verisi korundu");
  eq(state.shopping.recipes, [0], "eski tarif verisi korundu");
  ok(state.shopping.checked.legacy, "eski işaret verisi korundu");

  const row = app.querySelector("[data-shop-item-check]");
  await row.onclick();
  ok(state.shopping.checked[row.dataset.shopItemCheck], "kendi ürünü işaretleme çalışır");

  app.querySelector('[data-shop-tab="suggest"]').onclick();
  const suggestion = app.querySelector('[data-shop-suggest="yulaf"]');
  ok(suggestion, "geçmiş kullanımdan sık ürün önerisi var");
  await suggestion.onclick();
  ok(state.shopping.items.some(x => x.k === "yulaf"), "öneri kendi listesine eklendi");
  app.querySelector('[data-shop-tab="mine"]').onclick();
  eq(app.querySelectorAll("[data-shop-item-check]").length, 2, "kendi listesi yalnızca elle seçilen ürünleri gösterir");

  mealTab = "recipes"; render();
  ok(!app.querySelector("[data-recipe-list]"), "tarif ekranında eski liste düğmesi kalmadı");
  mealTab = "list"; render();
  await withLang("en", async () => {
    render();
    eq(app.querySelector("h2").textContent.trim(), "My shopping list", "İngilizce liste adı");
    eq([...app.querySelectorAll("[data-shop-tab]")].map(b => b.textContent.trim()), ["My list", "Suggestions"], "İngilizce sekmeler");
  });
  tab = "today"; mealTab = "log"; shopTab = "mine"; state = null;
});

/* ---- dinlenme sayacı, yenilikler, hakkında ---- */
test("dinlenme sayacı: set onaylanınca başlar, ± süreyi değiştirip hatırlar, atla kapatır", async () => {
  state = await loadFixture(); migrateMeals(); notice = null;
  const program = currentProgram();
  /* Antrenmanı ağırlık × tekrar olan bir gün seç. */
  let key = null;
  for (let i = 0; i < 7 && !key; i++){
    const k = shiftDays(today(), -i), d = program.training.days.find(x => x.wd === isoWeekday(k));
    if (d && d.b && exercisesOf(d).some(n => ["w", "r", "t"].includes(parseEx(n, venueOf(program)).t))) key = k;
  }
  ok(key, "uygun antrenman günü yok");
  viewDate = key === today() ? null : key;
  try {
    openWorkout();
    const { list, venue } = woList();
    woIdx = list.findIndex(n => ["w", "r", "t"].includes(parseEx(n, venue).t)); drawWO();
    const r = woEl.querySelector('[data-wi="r"][data-wk="0"]') || woEl.querySelector('[data-wi="s"][data-wk="0"]');
    if (!r.value) r.value = "8";
    await woEl.querySelector('[data-wok="0"]').onclick();
    ok(woEl.querySelector("#wo-rest"), "sayaç başlamadı");
    eq(woRest.total, 90);
    await woEl.querySelector('[data-rest="15"]').onclick();
    eq([woRest.total, state.profile.restSec], [105, 105], "süre uzayıp hatırlanmalı");
    woEl.querySelector("#wo-rest-skip").onclick();
    ok(!woEl.querySelector("#wo-rest") && !woRest, "atla kapatmalı");
  } finally { closeWorkout(); viewDate = null; state = null; }
});
test("yenilikler: görülmeyen sürümler gösterilir, bir kez görülünce bir daha çıkmaz", async () => {
  for (let i = 1; i < WHATS_NEW.length; i++) ok(verCmp(WHATS_NEW[i - 1].v, WHATS_NEW[i].v) >= 0, "sürümler yeniden eskiye sıralı olmalı");
  const v190 = WHATS_NEW.filter(n => n.v === "1.9.0");
  ok(v190.some(n => !n.native) && v190.some(n => n.native), "1.9.0 için web'de görünen ve iPhone'a özel madde olmalı");
  const after180 = unseenNews("1.8.0");
  eq(after180.map(n => n.v), [...new Set(WHATS_NEW.filter(n => !n.native && verCmp(n.v, "1.8.0") > 0).map(n => n.v))], "aynı sürümün kayıtları tek başlıkta birleşir");
  eq(after180.find(n => n.v === "1.9.0").items, v190.filter(n => !n.native).flatMap(n => n.items), "web'de yalnızca web maddeleri");
  eq(APP_VERSION, "1.17.0");
  eq(unseenNews("1.9.1").map(n => n.v), ["1.17.0", "1.16.0", "1.15.0", "1.14.0", "1.13.0", "1.12.0", "1.11.0", "1.10.0"], "1.10.0 - 1.17.0 web maddeleri görünür");
  eq(unseenNews("1.12.0").map(n => n.v), ["1.17.0", "1.16.0", "1.15.0", "1.14.0", "1.13.0"], "1.13.0 maddeleri tek başlıkta birleşir");
  eq(unseenNews("1.12.0")[4].items.length, 2, "1.13.0: halkalar ve şerit");
  eq(unseenNews("1.13.0").map(n => n.v), ["1.17.0", "1.16.0", "1.15.0", "1.14.0"], "1.13.0'ı görmüş kullanıcıya 1.17.0, 1.16.0, 1.15.0 ve 1.14.0");
  eq(unseenNews("1.13.0")[0].items.length, 6, "1.17.0: altı kısa kullanıcı maddesi");
  eq(unseenNews("1.13.0")[1].items.length, 8, "1.16.0: sekiz kısa kullanıcı maddesi");
  eq(unseenNews("1.14.0").map(n => n.v), ["1.17.0", "1.16.0", "1.15.0"], "1.14.0'ı görmüş kullanıcıya 1.17.0, 1.16.0 ve 1.15.0");
  eq(unseenNews("1.15.0").map(n => n.v), ["1.17.0", "1.16.0"], "1.15.0'ı görmüş kullanıcıya 1.17.0 ve 1.16.0");
  ok(verCmp(WHATS_NEW[0].v, APP_VERSION) <= 0, "yenilik listesi uygulamadan ileride");
  eq(verCmp("1.10.0", "1.9.2") > 0, true);
  /* native: true maddeler yalnızca iPhone uygulamasında gösterilir; testler web'de çalışır. */
  const web = WHATS_NEW.filter(n => !n.native);
  ok(web.length < WHATS_NEW.length, "iPhone'a özel madde yok");
  eq(unseenNews(undefined).length, Math.min(3, web.length));
  eq(unseenNews(APP_VERSION), []);
  eq(unseenNews(web[0].v), [], "web'de iPhone'a özel madde gösterilmemeli");
  state = await loadFixture();
  state.seenVersion = web.find(n => verCmp(n.v, web[0].v) < 0).v;   /* aynı sürümün birden çok kaydı olabilir */
  maybeShowWhatsNew();
  const sheet = [...document.querySelectorAll(".sheet-bg")].pop();
  ok(sheet && sheet.textContent.includes(web[0].items[0]), "pencere açılmadı");
  sheet.querySelector("#wn-ok").click();
  await new Promise(r => setTimeout(r, 0));
  eq(state.seenVersion, APP_VERSION);
  document.querySelectorAll(".sheet-bg").forEach(e => e.remove());
  maybeShowWhatsNew();
  ok(!document.querySelector(".sheet-bg"), "ikinci kez açılmamalı");
  state = null;
});
test("yenilikler: başlangıçtaki uyarı pencereyi engellemez; yükseltmede bir kez açılır, ilk kurulumda açılmaz", async () => {
  state = await loadFixture();
  const web = WHATS_NEW.filter(n => !n.native);
  const seen = web.find(n => verCmp(n.v, web[0].v) < 0).v;   /* görmüş bir eski sürüm */
  /* Başlangıçta haftalık yenileme uyarısı gibi bir notice görünüyor olsun:
     uyarı yüzünden yenilik penceresi atlanmamalı. */
  notice = "trend için yeterli veri yok";
  state.seenVersion = seen;
  openWelcomeChain();
  let sheet = [...document.querySelectorAll(".sheet-bg")].pop();
  ok(sheet && sheet.querySelector("#wn-t"), "uyarı varken yenilik penceresi açılmadı");
  sheet.querySelector("#wn-ok").click();
  await new Promise(r => setTimeout(r, 0));
  eq(state.seenVersion, APP_VERSION, "görülen sürüm kayda yazılmalı");
  document.querySelectorAll(".sheet-bg").forEach(e => e.remove());
  /* Aynı sürümü görmüş kullanıcıya (ilk kurulumda da böyle) bir daha açılmaz. */
  openWelcomeChain();
  ok(!document.querySelector(".sheet-bg"), "görülmüş sürüm tekrar açılmamalı");
  /* Kullanıcı yeniden yükseltme yaptıysa (eski sürüme dönmüş kayıt) yine bir kez açılır. */
  state.seenVersion = seen;
  openWelcomeChain();
  sheet = [...document.querySelectorAll(".sheet-bg")].pop();
  ok(sheet && sheet.querySelector("#wn-t"), "yükseltmede yeniden açılmalı");
  document.querySelectorAll(".sheet-bg").forEach(e => e.remove());
  notice = null;
  state = null;
});
test("hakkında: sağlık uyarısı, kaynaklar ve gizlilik sayfası yerinde", async () => {
  state = await loadFixture(); migrateMeals(); notice = null; viewDate = null; ensureToday();
  tab = "settings"; meTab = "set"; render();
  eq(app.querySelectorAll("details.about").length, 3);
  ok(app.innerHTML.includes(DISCLAIMER), "sağlık uyarısı yok");
  ok(app.innerHTML.includes("Mifflin-St Jeor"), "kaynaklar yok");
  const res = await fetch("../starboard-site/privacy.html");
  ok(res.ok && (await res.text()).includes("Gizlilik politikası"), "privacy.html yok");
  tab = "today"; meTab = "body"; state = null;
});
test("yazı tipi: Saira uygulamanın içinden gelir (başlık, rakam ve gövde aynı aile), dışarıya istek yok, çevrimdışı önbellekte", async () => {
  const get = async p => { const r = await fetch("../starboard-site/" + p); ok(r.ok, p + " açılmadı"); return r.text(); };
  const css = ["css/tokens.css", "css/components.css", "css/app.css"];
  const [html, sw, ...sheets] = await Promise.all([get("index.html"), get("sw.js"), ...css.map(get)]);
  for (const [name, src] of [["index.html", html], ["sw.js", sw], ...css.map((c, i) => [c, sheets[i]])]){
    ok(!/fonts\.(googleapis|gstatic)\.com/.test(src), name + " Google Fonts'a bağlanıyor");
    ok(!/@import/.test(src), name + " dışarıdan stil alıyor");
  }
  const tokens = sheets[0];
  const faces = [...tokens.matchAll(/@font-face\{([^}]+)\}/g)].map(m => m[1]);
  const files = faces.map(f => (/url\("\.\.\/(fonts\/[^"]+)"\)/.exec(f) || [])[1]);
  eq(files.length, 2, "Saira için latin ve latin-ext olmak üzere iki @font-face beklenir");
  ok(files.every(Boolean), "@font-face dosyaları bulunamadı");
  ok(faces.every(f => f.includes('font-family:"Saira"')), "Saira dışında bir yazı tipi yüklenmemeli");
  ok(faces.some(f => f.includes("latin-ext")) && faces.some(f => /latin\.woff2/.test(f)), "Saira: latin ve latin-ext yok");
  ok(faces.every(f => /unicode-range:/.test(f) && /font-display:swap/.test(f)), "Saira: unicode-range ya da font-display eksik");
  ok(faces.every(f => /font-weight:400 800;/.test(f)), "Saira değişken dosyası 400–800 kalınlığı kapsamalı");
  const latinFace = faces.find(f => /latin\.woff2/.test(f)), extFace = faces.find(f => f.includes("latin-ext"));
  ok(/U\+0131/.test(latinFace), "noktasız ı (U+0131) latin aralığında olmalı");
  ok(/U\+0100-02BA/.test(extFace), "ğ, ş, İ latin-ext aralığında olmalı");
  for (const f of files) {
    const r = await fetch("../starboard-site/" + f);
    ok(r.ok && (await r.arrayBuffer()).byteLength > 1000, f + " yok ya da boş");
    ok(sw.includes(`"${f}"`), f + " sw.js SHELL listesinde değil");
    ok(html.includes(`href="${f}"`) && new RegExp(`<link rel="preload" href="${f}" as="font"`).test(html), f + " index.html içinde preload edilmemiş");
  }
  ok((await get("fonts/Saira-OFL.txt")).includes("SIL Open Font License"), "Saira lisans metni yok");
  ok(!/Barlow|Nunito/.test(tokens + html + sw), "eski yazı tipi izi kaldı");
  ok(/--font:"Saira"/.test(tokens), "gövde yazı tipi jetonu Saira değil");
  ok(/--font-d:var\(--font\)/.test(tokens), "başlık ve rakam yazı tipi gövdeyle aynı aile olmalı");
  /* test sayfasında tokens.css yok: dosyalar gerçek dosyalardan, tokens.css'teki aralıklarla yüklenir */
  const range = f => /unicode-range:([^}]+)/.exec(f)[1];
  const url = f => "url(../starboard-site/" + /url\("\.\.\/([^"]+)"\)/.exec(f)[1] + ")";
  for (const f of [extFace, latinFace]){
    const face = new FontFace("SairaTest", url(f), { weight: "400 800", unicodeRange: range(f) });
    document.fonts.add(await face.load());
  }
  const width = (t, fam, extra = "") => { const s = document.createElement("span"); s.style.cssText = `font:700 40px ${fam};${extra};position:absolute;visibility:hidden;white-space:pre`; s.textContent = t; document.body.appendChild(s); const w = s.getBoundingClientRect().width; s.remove(); return w; };
  for (const ch of ["ğ", "Ğ", "ş", "Ş", "İ", "ı", "ç", "Ç", "ö", "Ö", "ü", "Ü"])
    ok(width(ch, "SairaTest, monospace") !== width(ch, "monospace"), `Türkçe harf "${ch}" Saira'dan gelmiyor`);
  const tab = "font-variant-numeric:tabular-nums";
  eq(Math.round(width("1111", "SairaTest", tab)), Math.round(width("0000", "SairaTest", tab)), "Saira rakamları eşit genişlikte değil (tabular-nums)");
  eq(Math.round(width("1111", "SairaTest", tab)), Math.round(width("8888", "SairaTest", tab)), "Saira rakamları eşit genişlikte değil (tabular-nums)");
});
test("tasarım: makro renk jetonları iki temada da tanımlı; varsayılan tema değişmedi", async () => {
  const tokens = await fetch("../starboard-site/css/tokens.css").then(r => r.text());
  const blocks = [/:root, \.thm-light\{([^}]+)\}/, /:root:not\(\[data-theme="light"\]\)\{([^}]+)\}/, /:root\[data-theme="dark"\], \.thm-dark\{([^}]+)\}/]
    .map(re => (re.exec(tokens) || [])[1]);
  ok(blocks.every(Boolean), "tema blokları bulunamadı");
  for (const b of blocks)
    for (const v of ["--kcal", "--kcal-soft", "--protein", "--protein-soft", "--fat", "--fat-soft", "--carb", "--carb-soft", "--over", "--neon", "--bg", "--ink"])
      ok(new RegExp(v + ":").test(b), v + " eksik");
  eq(THEMES.map(t => t[0]), ["auto", "light", "dark"]);
});

/* ---- hareket ---- */
test("hareket: countAt sıfırdan hedefe yavaşlayarak sayar, uçlarda tam değer verir", () => {
  eq(countAt(0, 100, 0), 0);
  eq(countAt(0, 100, 1), 100);
  eq(countAt(0, 100, 2), 100, "1'den büyük ilerleme hedefte kalır");
  eq(countAt(0, 100, -1), 0);
  eq(countAt(0, 100, 0.5), 88, "yavaşlayan eğri: yarı sürede %87,5");
  eq(countAt(80, 40, 1), 40, "aşağı da sayar");
  eq(countAt(0, 1, 0.5, 2), 0.88, "ondalık basamak");
  let prev = -1;
  for (let i = 0; i <= 20; i++){ const v = countAt(0, 2400, i / 20); ok(v >= prev, "azalmamalı"); prev = v; }
});
test("hareket: Bugün halkası sayfaya girerken .fx-ring ile sıfırdan dolar, sayfa içinde sınıf taşımaz", async () => {
  state = await loadFixture(); migrateMeals(); notice = null; viewDate = null; ensureToday();
  try {
    tab = "plan"; render();
    tab = "today"; render();
    const fg = app.querySelector(".gh-fg");
    ok(fg && fg.classList.contains("fx-ring"), "girişte fx-ring yok");
    ok(/--fx-len:\d/.test(fg.getAttribute("style")), "çevre uzunluğu yok");
    eq(fg.getAttribute("stroke-dashoffset"), fg.dataset.to, "son değer HTML'de");
    render();
    ok(!app.querySelector(".gh-fg").classList.contains("fx-ring"), "aynı sekmede yeniden çizim halkayı baştan doldurmamalı");
  } finally { state = null; }
});
test("hareket: countUp görünmeyen ya da hareketi azaltılmış öğeye dokunmaz; sayfa girişinde sayaçlar sıfırdan başlar", async () => {
  const el = document.createElement("span");
  el.textContent = "1.234";
  countUp(el, 0, 1234);
  eq(el.textContent, "1.234", "görünmeyen öğe son değerde kalır");
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;left:0;top:0";
  box.innerHTML = `<span data-count="tst" data-v="500">500</span>`;
  document.body.appendChild(box);
  const span = box.firstChild;
  const realApp = app.querySelectorAll;
  try {
    app.querySelectorAll = sel => box.querySelectorAll(sel);
    animateCounts(true);
    if (!reduceMotion()){
      ok(+span.textContent.replace(/\D/g, "") < 500, "girişte sıfırdan sayar: " + span.textContent);
    }
    await new Promise(r => setTimeout(r, 1000));
    eq(span.textContent, "500", "sonunda çizilen değer");
  } finally { app.querySelectorAll = realApp; box.remove(); }
});

/* ---- hatırlatmalar ---- */
test("hatırlatmalar: 7 günlük plan, geçmiş saat yok, tamamlanan hedef atlanır, iOS sınırı aşılmaz", async () => {
  const st = await loadFixture();
  const program = buildProgram(st.profile, 82, 0);
  const now = new Date("2026-11-11T09:00:00");
  eq(reminderPlan(st, program, now), [], "hatırlatma seçilmemişse plan boş");
  st.profile.reminders = { water:true, train:true, sleep:true, weigh:true, eve:true, trainAt:"18:30" };
  const t = "2026-11-11";
  st.days[t] = { ...(st.days[t] || {}), weight:82, water:program.water, tasks:[] };
  st.days["2026-11-10"].bed = 23 * 60 + 30;
  const plan = reminderPlan(st, program, now);
  ok(plan.length > 0 && plan.length <= 64, "plan boyutu: " + plan.length);
  eq(new Set(plan.map(n => n.id)).size, plan.length, "kimlikler benzersiz olmalı");
  ok(plan.every(n => n.at > now), "geçmiş saate bildirim kurulmamalı");
  ok(!plan.some(n => dayKey(n.at) === t && (n.kind === "water" || n.kind === "weigh")), "bugün su ve tartı tamam, hatırlatma olmamalı");
  ok(plan.some(n => n.kind === "water" && dayKey(n.at) === shiftDays(t, 1)), "yarın su hatırlatması olmalı");
  for (const n of plan.filter(x => x.kind === "train")) {
    const d = program.training.days.find(x => x.wd === isoWeekday(dayKey(n.at)));
    ok(d && d.b, "antrenman olmayan güne antrenman hatırlatması");
    eq([n.at.getHours(), n.at.getMinutes()], [18, 30]);
  }
  const sl = plan.find(n => n.kind === "sleep");
  eq([sl.at.getHours(), sl.at.getMinutes()], [23, 0], "yatma saatinden 30 dk önce");
  /* Kullanıcının seçtiği saatler: boş bırakılan su saati kullanılmaz; uyku saati
     elle seçildiyse o, silindiyse yeniden otomatik. */
  for (const d of Object.values(st.days)) delete d.weight; /* haftalık tartı: yakın tartı kaydı hedefi erteler */
  Object.assign(st.profile.reminders, { waterAt:["09:30", "", "15:00", "20:00"], weighAt:"07:15", eveAt:"22:00", sleepAt:"22:45" });
  const tm = shiftDays(t, 1);
  const hm = kind => reminderPlan(st, program, now).filter(n => n.kind === kind && dayKey(n.at) === tm).map(n => minToHm(n.at.getHours() * 60 + n.at.getMinutes()));
  eq(hm("water"), ["09:30", "15:00", "20:00"]);
  eq([hm("weigh"), hm("eve"), hm("sleep")], [["07:15"], ["22:00"], ["22:45"]]);
  delete st.profile.reminders.sleepAt;
  eq(hm("sleep"), ["23:00"], "saat silinince otomatiğe dönmeli");
  eq(hmToMin("07:05"), 425);
  eq(typicalBedtime({}, 7), 1410, "kayıt yoksa 07:00 kalkışa göre 7,5 saat önce");
});

/* ---- mutfak, helal ve koşer ---- */
const planKeys = m => m.meals.flatMap(x => x.items.map(i => i.key).filter(Boolean));
const PROFILES_M = [[{}, 82], [{ goal:"lose" }, 82], [{ goal:"gain" }, 82], [{ sex:"female", height:163, age:27 }, 60]];

test("mutfak: tarif malzemeleri ve hazır menülerin besinleri veritabanında var", () => {
  const bad = [];
  RECIPES.forEach(r => r.ing.forEach(([k]) => { if (!FOODS[k]) bad.push(`${r.n}: ${k}`); }));
  MEAL_SETS.forEach(s => s.meals.forEach(m => ["p", "c", "f"].forEach(x => { if (!FOODS[m[x]]) bad.push(`${s.name}: ${m[x]}`); })));
  eq(bad, [], "eksik besinler");
  ok(MEAL_SETS.filter(s => cuisineOk(s, "intl")).length >= 6, "uluslararası mutfakta yeterli hazır menü yok");
  /* Bir mutfağın hazır menüsü o mutfakta önerilmeyen besin içermesin; yoksa yerine
     rastgele bir besin geçer ("Vejetaryen" menüde tavuk gibi). */
  for (const cu of ["tr", "intl"]) MEAL_SETS.filter(s => cuisineOk(s, cu)).forEach(s => s.meals.forEach(m =>
    ["p", "c", "f"].forEach(x => { if (!cuisineOk(FOODS[m[x]], cu)) bad.push(`${cu}/${s.name}: ${m[x]}`); })));
  eq(bad, [], "menüde mutfağa uymayan besin");
  ok(RECIPES.filter(r => cuisineOk(r, "intl")).length >= 15, "uluslararası mutfakta yeterli tarif yok");
});
test("mutfak: cihaz dili varsayılanı belirler; elle seçim korunur ve Ayarlar'dan değiştirilebilir", async () => {
  const fixture = await loadFixture();
  const oldState = state, oldTab = tab, oldMeTab = meTab, oldLang = LANG;
  const savedState = localStorage.getItem(KEY);
  const nav = Object.getOwnPropertyDescriptor(Navigator.prototype, "languages");
  const setNav = list => Object.defineProperty(navigator, "languages", { get: () => list, configurable: true });
  try {
    state = JSON.parse(JSON.stringify(fixture));
    state.mealPrefs = state.mealPrefs || {};
    delete state.mealPrefs.cuisine;

    setNav(["tr-TR"]); LANG = "en";
    eq(currentCuisine(), "tr", "Türkçe cihazda Türk mutfağı varsayılanı");
    eq(obDefaults().cuisine, "intl", "ilk kurulum İngilizce seçimiyle uluslararası mutfakla başlar");
    setNav(["en-US"]); LANG = "tr";
    eq(currentCuisine(), "intl", "İngilizce cihazda uluslararası mutfak varsayılanı");
    eq(obDefaults().cuisine, "tr", "ilk kurulum Türkçe seçimiyle Türk mutfağıyla başlar");

    state.mealPrefs.cuisine = "intl";
    setNav(["tr-TR"]);
    eq(currentCuisine(), "intl", "kayıtlı elle seçim cihaz dilinden bağımsız korunur");
    eq(state.mealPrefs.cuisine, "intl", "kayıtlı seçim değiştirilmez veya silinmez");

    tab = "settings"; meTab = "set"; render();
    const btn = app.querySelector('[data-scuisine="tr"]');
    ok(btn && btn.getAttribute("aria-pressed") === "false", "Ayarlar'da iki mutfak seçeneği var");
    await btn.onclick();
    eq(state.mealPrefs.cuisine, "tr", "Ayarlar'dan yapılan seçim kaydedilir");
    eq(currentCuisine(), "tr", "yeni elle seçim geçerli olur");
    render();
    ok(app.querySelector('[data-scuisine="tr"]').classList.contains("sel"), "seçili mutfak Ayarlar'da işaretlidir");
    setNav(["en-US"]);
    eq(currentCuisine(), "tr", "cihaz dili sonradan değişse de elle seçim korunur");
  } finally {
    state = oldState; tab = oldTab; meTab = oldMeTab; LANG = oldLang;
    if (savedState === null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, savedState);
    delete navigator.languages;
    if (nav) Object.defineProperty(Navigator.prototype, "languages", nav);
  }
});
test("mutfak: öneriler seçili mutfaktan gelir; Türk mutfağında domuz eti önerilmez", async () => {
  const fixture = await loadFixture();
  for (const cuisine of ["tr", "intl"]) for (const diet of ["hepsi", "vejetaryen"]) for (const [o, w] of PROFILES_M) for (let v = 0; v < 5; v++) {
    state = JSON.parse(JSON.stringify(fixture));
    state.mealPrefs.cuisine = cuisine; state.mealPrefs.diet = diet;
    const p = buildProgram(profileOf(o), w, 0);
    const m = buildMeals(p, v);
    const where = `${cuisine}/${diet} ${JSON.stringify(o)} seçenek ${v}`;
    for (const k of planKeys(m)) {
      ok(cuisineOk(FOODS[k], cuisine), `${k} bu mutfağa ait değil · ${where}`);
      if (cuisine === "tr") ok(!FOODS[k].pork, `${k} domuz eti · ${where}`);
    }
    ok(Math.abs(m.total.kcal - p.kcal) / p.kcal <= 0.1, `menü ${m.total.kcal} kcal, hedef ${p.kcal} kcal · ${where}`);
  }
  state = null;
});
test("helal ve koşer: domuz eti ve kabuklu deniz ürünü yok, koşerde et ile süt aynı öğünde değil", async () => {
  const fixture = await loadFixture();
  for (const diet of ["helal", "koser"]) for (const [o, w] of PROFILES_M) for (let v = 0; v < 6; v++) {
    state = JSON.parse(JSON.stringify(fixture));
    state.mealPrefs.cuisine = "intl"; state.mealPrefs.diet = diet;
    const p = buildProgram(profileOf(o), w, 0);
    const m = buildMeals(p, v);
    const where = `${diet} ${JSON.stringify(o)} seçenek ${v}`;
    for (const meal of m.meals) {
      const keys = meal.items.map(i => i.key).filter(Boolean);
      for (const k of keys) ok(foodAllowed(k, diet) && !FOODS[k].pork, `${meal.name}: ${k} · ${where}`);
      if (diet === "koser") ok(!(keys.some(hasMeatK) && keys.some(hasDairyK)), `${meal.name}: et ve süt bir arada (${keys.join(", ")}) · ${where}`);
    }
    ok(Math.abs(m.total.kcal - p.kcal) / p.kcal <= 0.1, `menü ${m.total.kcal} kcal, hedef ${p.kcal} kcal · ${where}`);
  }
  ok(!foodAllowed("bacon", "helal") && !foodAllowed("karides", "koser") && foodAllowed("karides", "helal"));
  ok(!foodAllowed("cheeseburger", "koser") && foodAllowed("cheeseburger", "helal"));
  const bolo = RECIPES.find(r => r.ing.some(([k]) => k === "parmesan") && r.ing.some(([k]) => k === "kofte"));
  ok(bolo && !recipeAllowed(bolo, "koser") && recipeAllowed(bolo, "helal"), "koşerde et ve peynirli tarif çıkmalı");
  state = null;
});
test("helal ve koşer: Türkçede yalnızca seçiliyse listede", () => {
  const keys = cur => dietOptions(cur).map(([k]) => k);
  ok(!keys("hepsi").includes("helal") && !keys("hepsi").includes("koser"), "Türkçede gizli olmalı");
  ok(keys("koser").includes("koser"), "seçiliyse görünmeli");
  const old = LANG; LANG = "en";
  try { ok(keys("hepsi").includes("helal") && keys("hepsi").includes("koser"), "İngilizcede görünmeli"); }
  finally { LANG = old; }
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
  tab = "plan"; planTab = "how"; howQuery = "squat"; howOpen = "squat";
  render();
  const svg = app.querySelector('.how-anim[data-anim="squat"] svg');
  ok(svg, "sahne kurulmadı");
  ok(svg.querySelector('[data-j="leg"]').getAttribute("points").split(" ").length === 3, "bacak çizilmedi");
  howOpen = null; howQuery = ""; planTab = "today"; tab = "today"; render();
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
    ok(app.innerHTML.includes("Every day, brighter than the last."), "karşılama ekranı İngilizce çizilmedi");
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

/* ---- erişilebilirlik ---- */
test("erişilebilirlik: her alanın etiketi, her düğmenin adı var", async () => {
  const fixture = await loadFixture();
  const bad = [];
  const check = where => {
    for (const el of app.querySelectorAll("input, select, textarea")) {
      if (el.type === "hidden") continue;
      const lab = el.id && app.querySelector(`label[for="${el.id}"]`);
      if (!lab && !el.closest("label") && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby"))
        bad.push(`${where}: etiketsiz ${el.id || el.outerHTML.slice(0, 60)}`);
    }
    for (const el of app.querySelectorAll("button, [role=button]"))
      if (!(el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || "").trim())
        bad.push(`${where}: adsız düğme ${el.outerHTML.slice(0, 60)}`);
  };
  for (const lang of ["tr", "en"]) await withLang(lang, () => {
    state = JSON.parse(JSON.stringify(fixture)); migrateMeals(); notice = null; viewDate = null; ensureToday();
    for (const t of ["today", "plan", "meals", "calendar"]) { tab = t; render(); check(t); }
    for (const p of ["today", "program", "how"]) { tab = "plan"; planTab = p; render(); check("plan:" + p); }
    for (const m of ["log", "recipes", "list"]) { tab = "meals"; mealTab = m; render(); check("meals:" + m); }
    for (const m of ["body", "chart", "set"]) { tab = "settings"; meTab = m; render(); check("me:" + m); }
    for (const g of ["kcal", "protein", "water", "sleep", "weigh", "train"]) { tab = "today"; goalOpen = g; render(); check("goal:" + g); }
    goalOpen = null; planTab = "today"; mealTab = "log"; meTab = "body";
    state = null; ob = obDefaults(); ob.sex = "male";
    for (let i = 0; i < OB_STEPS.length - 1; i++) { obStep = i; render(); check("ilk giriş " + OB_STEPS[i].id); }
    ob = null; obStep = 0;
  });
  eq([...new Set(bad)], [], "erişilebilirlik sorunları");
  tab = "today"; state = null;
});

/* ---- hesap ve ekran ayrımı ---- */
/* Sonuçta metin olmamalı: yalnızca sayı, mantık, null ve bilinen durum adları. */
const plainResult = (o, allowed) => JSON.stringify(o, (k, v) =>
  typeof v === "string" && !allowed.includes(v) ? (() => { throw new Error(`metin döndü: ${k}=${v}`); })() : v);

test("görev durumu: hesap sayı ve durum döndürür, dil ve birimden etkilenmez", async () => {
  const fixture = await loadFixture();
  state = fixture;
  const program = buildProgram(profileOf({ goal:"lose" }), 82, 0);
  const ctx = { today:"2026-11-11", hour:12, profile:profileOf({ goal:"lose" }), sleep:[7, 9], steps:8000 };
  const entry = { kcal:1500, water:2700, sleep:9.8, weight:82, steps:3000, log:[] };
  const kinds = ["kcal", "protein", "water", "sleep", "weigh", "steps", "train"];
  const STATES = [...kinds, "empty", "over", "under", "short", "ok", "long", "lose", "gain", "maintain"];
  const run = () => kinds.map(k => taskStatus(k, entry, program, "2026-11-11", ctx));
  const tr = run();
  for (const s of tr) if (s && s.session) delete s.session;
  plainResult(tr, STATES);
  const en = await withLang("en", () => withUnits("imperial", run));
  for (const s of en) if (s && s.session) delete s.session;
  eq(en, tr, "dil ya da birim hesabı değiştirdi");
  const [kcal, , water, sleep, , steps] = tr;
  eq([kcal.state, kcal.warn, kcal.lo > 1500], ["short", false, true], "gün içinde az yemek uyarı değil");
  eq(taskStatus("kcal", entry, program, "2026-11-11", { ...ctx, hour:21 }).state, "under", "akşam olunca uyarı");
  eq([water.need, water.ok], [Math.round(program.water * 0.9), water.value >= Math.round(program.water * 0.9)]);
  eq([sleep.state, sleep.warn], ["long", true]);
  eq([steps.target, steps.left, steps.ok], [8000, 5000, false]);
  eq(taskStatus("steps", entry, program, "2026-11-11", { ...ctx, steps:0 }), null, "adım hedefi yoksa görev yok");
  state = null;
});
test("görev durumu: ekrandaki metin hesapla aynı sonucu söyler", async () => {
  state = await loadFixture(); ensureToday();
  const program = currentProgram(), e = state.days[today()];
  for (const k of ["kcal", "protein", "water", "sleep", "weigh", "steps", "train"]) {
    const s = taskStatus(k, e, program), a = autoInfo({ kind:k }, e, program);
    eq(!!a, !!s, k + " görünürlüğü");
    if (s) eq([a.ok, a.pct], [s.ok, s.pct], k);
  }
  state = null;
});
test("grafik verisi: seriler, aralıklar ve farklar metinsiz hesaplanır", () => {
  const days = { "2026-11-01":{ weight:83, kcal:2000, body:{ bel:90, yag:22 } }, "2026-11-08":{ weight:82, sleep:7.5, body:{ bel:88, yag:21 } },
    "2026-11-10":{ weight:81.5 }, "2025-01-01":{ weight:99 } };
  const D = chartData(days, profileOf({ height:180, sex:"male" }), { kcal:2500 }, [7, 9], "2026-11-11");
  plainResult(D, ["2026-11-01", "2026-11-08", "2026-11-10", "inside", "below", "above"]);
  eq(D.weight.series.map(x => x.v), [83, 82, 81.5], "eski kayıt pencere dışında kalmalı");
  eq(D.weight.delta, -1.5);
  eq(D.weight.band.map(v => Math.round(v * 10) / 10), [59.9, 80.7]);
  eq(D.kcal.band, [2250, 2750]);
  eq(D.sleep.band, [7, 9]);
  eq([D.fat.delta, D.fat.band, D.fat.pos], [-1, [14, 25], "inside"]);
  eq(D.waist.delta, -2);
});
test("haftalık özet: sayılar kayıttan hesaplanır", () => {
  const days = {
    "2026-11-10":{ kcal:2600, weight:80, tasks:[{ done:true }, { done:false }] },
    "2026-11-09":{ kcal:3500, weight:80.4, lifts:{ "Squat":{ t:"w", sets:[{ kg:60, r:5 }] } } },
    "2026-11-01":{ weight:81 }
  };
  const S = weekStats(days, { kcal:2500 }, "2026-11-11");
  eq([S.avg, S.kcalDays, S.inBand, S.tDone, S.tAll, S.lifts], [3050, 2, 1, 1, 2, 1]);
  eq(Math.round(S.wch * 100) / 100, -0.8);
  eq(weekStats({}, { kcal:2500 }, "2026-11-11"), null);
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
test("haftalık tartı: son tartıdan 7 gün dolmadan hedef yok, eski kayıt korunur", () => {
  const k = "2026-11-20", prog = { kcal:2000, protein:120, water:2500, training:{ none:true, days:[] } };
  const ctx = days => ({ today:k, hour:9, profile:{ goal:"maintain" }, sleep:[7, 9], steps:0, days });
  eq(taskStatus("weigh", {}, prog, k, ctx({ [shiftDays(k, -3)]:{ weight:80 } })), null, "3 gün önce tartıldıysa bugün hedef yok");
  eq(taskStatus("weigh", {}, prog, k, ctx({ [shiftDays(k, -7)]:{ weight:80 } })).ok, false, "7 gün olunca tartı hedefi gelir");
  eq(taskStatus("weigh", { weight:79.5 }, prog, k, ctx({ [shiftDays(k, -2)]:{ weight:80 } })).ok, true, "bugün tartıldıysa sayılır");
  eq(taskStatus("weigh", {}, prog, k, ctx({})).ok, false, "hiç kayıt yoksa hedef var");
  eq(taskKind({ title:"Haftalık kilo ölçümü" }), "weigh");
  eq(taskKind({ title:"Sabah kilo ölçümü" }), "weigh", "eski başlık da tanınır");
  eq(taskKind({ title:"Weekly weigh-in" }), "weigh");
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

/* ---- barkod okuma ---- */
const offFx = name => fetch("fixtures/" + name + ".json").then(r => r.json());
const cloneJson = o => JSON.parse(JSON.stringify(o));
const a11yBad = where => {
  const bad = [];
  for (const el of app.querySelectorAll("input, select, textarea")) {
    const lab = el.id && app.querySelector(`label[for="${el.id}"]`);
    if (!lab && !el.closest("label") && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby"))
      bad.push(`${where}: etiketsiz ${el.id || el.outerHTML.slice(0, 60)}`);
  }
  for (const el of app.querySelectorAll("button, [role=button]"))
    if (!(el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || "").trim())
      bad.push(`${where}: adsız düğme ${el.outerHTML.slice(0, 60)}`);
  const ids = [...app.querySelectorAll("[id]")].map(e => e.id);
  ids.filter((x, i) => ids.indexOf(x) !== i).forEach(x => bad.push(`${where}: yinelenen kimlik ${x}`));
  return bad;
};
/* Kamera ve ağ yok: tarama ve istek işlevleri geçici olarak sahtesiyle değiştirilir. */
const withBarcode = async fn => {
  const keep = { barcodeAvailable, nativeScan, nativeGet };
  barcodeAvailable = () => true;
  try { return await fn(); }
  finally { barcodeAvailable = keep.barcodeAvailable; nativeScan = keep.nativeScan; nativeGet = keep.nativeGet; bcBusy = false; }
};
const openAddPanel = async () => {
  state = await loadFixture(); migrateMeals(); notice = null; viewDate = null; ensureToday();
  tab = "meals"; mealTab = "log"; addOpen = slotList()[0][0]; logQuery = ""; logPick = null; render();
};
const closeAddPanel = () => {
  document.querySelectorAll(".sheet-bg").forEach(e => e.remove());
  addOpen = null; logPick = null; logQuery = ""; state = null; tab = "today";
};
const confirmBarcodeInfo = async flow => {
  const sheet = [...document.querySelectorAll(".sheet-bg")].pop();
  ok(sheet && sheet.querySelector("#bc-go"), "bilgi penceresi yok");
  sheet.querySelector("#bc-go").click();
  await flow;
};

test("barkod: validGtin sağlama basamağını, uzunluğu ve rakam şartını denetler; normGtin tek biçime getirir", () => {
  for (const c of ["4006381333931", "96385074", "036000291452", "3017620422003", "614141999996", "00614141999996"])
    ok(validGtin(c), c + " geçerli sayılmalı");
  for (const c of ["3017620422004", "30176204220A3", "3017620422", "", "301762042200312", " 3017620422003", "12345678"])
    ok(!validGtin(c), JSON.stringify(c) + " reddedilmeli");
  ok(!validGtin(3017620422003) && !validGtin(null) && !validGtin(undefined), "yalnızca metin kabul edilir");
  eq(normGtin("036000291452"), "0036000291452", "UPC-A 13 haneye tamamlanır");
  eq(normGtin("00614141999996"), "0614141999996", "başı 0 olan GTIN-14 kısalır");
  eq(normGtin("3017620422003"), "3017620422003");
  eq(normGtin("96385074"), "96385074");
  ok(validGtin(normGtin("036000291452")) && validGtin(normGtin("00614141999996")), "normalleşmiş kod da geçerli kalır");
});

test("barkod: offToFood örnek yanıtları doğru duruma ve 100 g değerlerine çevirir", async () => {
  const found = offToFood(await offFx("off-found"), "tr");
  eq(found.status, "ok");
  eq(found.food, { n: "Nutella", br: "Ferrero", p: 6.3, c: 57.5, f: 30.9, alk: 0, lif: 0, serving: null });
  eq([found.flags.ml, found.flags.fromServing, found.flags.kcalMismatch, found.flags.labelKcal], [false, false, false, 539]);

  const part = offToFood(await offFx("off-partial"), "tr");
  eq([part.status, part.food.p, part.food.c, part.food.f], ["partial", 12.5, null, null]);
  eq(part.food.n, "Örnek yoğurt");
  eq(offToFood(await offFx("off-partial"), "en").food.n, "Sample yoghurt", "dile göre ad");

  const none = offToFood(await offFx("off-notfound"), "tr");
  eq([none.status, none.food], ["notfound", null]);
  eq(offToFood(null, "tr").status, "notfound");
  eq(offToFood({ status: 1, product: "x" }, "tr").status, "notfound");

  const serv = offToFood(await offFx("off-serving-only"), "tr");
  eq(serv.status, "ok");
  eq([serv.food.p, serv.food.c, serv.food.f, serv.food.lif, serv.food.serving], [10, 60, 20, 5, 30], "porsiyondan 100 g'a");
  eq([serv.flags.fromServing, serv.flags.labelKcal], [true, 420]);

  const kj = offToFood(await offFx("off-kj-only"), "tr");
  eq([kj.status, kj.flags.labelKcal, kj.flags.kcalMismatch], ["ok", 359, false], "kJ / 4,184");
});

test("barkod: offToFood saçma değerleri reddeder, birimi ve kalori farkını işaretler", async () => {
  const base = await offFx("off-found");
  const mod = fn => { const j = cloneJson(base); fn(j.product); return offToFood(j, "tr"); };
  const mismatch = mod(p => { p.nutriments.carbohydrates_100g = 5; p.nutriments.fat_100g = 0; p.nutriments.proteins_100g = 0; });
  eq([mismatch.status, mismatch.flags.kcalMismatch, mismatch.flags.labelKcal], ["ok", true, 539]);
  const alcoholic = mod(p => { p.nutriments.alcohol_100g = 10; });
  eq([alcoholic.status, alcoholic.food.alk, alcoholic.flags.kcalMismatch], ["ok", 10, false]);
  eq(Math.round(kcalFromMacros(alcoholic.food) * 10) / 10, 603.3, "alkol 7 kcal/g katılmalı");
  const alcoholicMismatch = mod(p => {
    p.nutriments.proteins_100g = 0; p.nutriments.carbohydrates_100g = 0; p.nutriments.fat_100g = 0;
    p.nutriments.alcohol_100g = 20;
  });
  eq([alcoholicMismatch.food.alk, alcoholicMismatch.flags.kcalMismatch], [20, true], "alkol kalorisi etiketle karşılaştırılmalı");
  eq(mod(p => { p.product_quantity_unit = "ml"; }).flags.ml, true);
  eq(mod(p => { p.serving_quantity_unit = "ml"; delete p.product_quantity_unit; }).flags.ml, true);
  const big = mod(p => { p.nutriments.carbohydrates_100g = 250; });
  eq([big.status, big.food.c, big.flags.absurd], ["partial", null, true]);
  const sum = mod(p => { p.nutriments.proteins_100g = 60; p.nutriments.carbohydrates_100g = 60; p.nutriments.fat_100g = 20; });
  eq([sum.status, sum.food.p, sum.food.c, sum.food.f, sum.flags.absurd], ["partial", null, null, null, true], "toplam 105'i aşarsa hiçbiri güvenilmez");
  eq(mod(p => { p.nutriments.proteins_100g = -1; }).status, "partial");
  eq(mod(p => { p.nutriments.proteins_100g = "abc"; }).status, "partial");
  const str = mod(p => { p.nutriments.proteins_100g = "6.3"; });
  eq([str.status, str.food.p], ["ok", 6.3], "sayı gibi metin kabul edilir");
  eq(mod(p => { p.nutriments.fiber_100g = 500; }).food.lif, 0, "saçma lif sıfırlanır, durumu bozmaz");
  eq(mod(p => { p.nutriments = { "energy-kcal_100g": 539 }; }).status, "partial", "yalnızca kalori yetmez");
  eq(mod(p => { delete p.product_name; delete p.product_name_en; }).food.n, "3017620422003", "ad yoksa barkod");
  eq(mod(p => { p.serving_quantity = 40; }).food.serving, 40);
  eq(mod(p => { p.serving_quantity = -3; }).food.serving, null);
  eq(mod(p => { delete p.nutriments; }).status, "partial");
  /* Tahmini değerler (nutriments_estimated) ayrı bir alandır; kullanılmaz. */
  const est = cloneJson(base);
  est.product.nutriments = {};
  est.product.nutriments_estimated = { proteins_100g: 5, carbohydrates_100g: 5, fat_100g: 5 };
  eq(offToFood(est, "tr").status, "partial");
});

test("barkod: lookupBarcode yalnızca barkodu içeren adrese gider; hata türlerini ayırır", async () => {
  state = await loadFixture();
  try {
    const found = await offFx("off-found");
    const calls = [];
    const get = res => async (...args) => { calls.push(args); if (res instanceof Error) throw res; return res; };
    const r = await lookupBarcode("3017620422003", get({ status: 200, data: found }));
    eq(r.status, "ok");
    eq(calls.length, 1);
    const [url, headers, timeout, ...rest] = calls[0];
    ok(/^https:\/\/world\.openfoodfacts\.org\/api\/v2\/product\/\d{8,14}\.json\?fields=[a-z_,]+$/.test(url), "adres biçimi: " + url);
    eq(rest, [], "istek yalnızca adres, başlık ve süre alır; gövde yok");
    eq(Object.keys(headers).sort(), ["Accept", "User-Agent"]);
    ok(headers["User-Agent"].startsWith(`Starboard/${APP_VERSION} (github.com/efekaratosun/starboard)`));
    eq(timeout, 8000);
    const leak = [state.profile.name, JSON.stringify(state.profile.height), "starboard-state"];
    for (const s of leak) ok(!url.includes(String(s)), "profil verisi adrese sızdı: " + s);
    ok(!/[?&](?!fields=)[a-z]+=/i.test(url), "fields dışında sorgu parametresi olmamalı");

    calls.length = 0;
    await lookupBarcode("036000291452", get({ status: 200, data: found }));
    ok(calls[0][0].includes("/product/0036000291452.json"), "UPC-A 13 haneye tamamlanarak sorulur");

    const timeoutErr = new Error("t"); timeoutErr.name = "TimeoutError";
    eq((await lookupBarcode("3017620422003", get(new TypeError("Failed to fetch")))).status, "offline");
    eq((await lookupBarcode("3017620422003", get(timeoutErr))).status, "error");
    eq((await lookupBarcode("3017620422003", get({ status: 404, data: await offFx("off-notfound") }))).status, "notfound");
    eq((await lookupBarcode("3017620422003", get({ status: 200, data: await offFx("off-notfound") }))).status, "notfound");
    eq((await lookupBarcode("3017620422003", get({ status: 500, data: null }))).status, "error");
    eq((await lookupBarcode("3017620422003", get({ status: 200, data: null }))).status, "error");
    eq((await lookupBarcode("3017620422003", get({ status: 200, data: await offFx("off-partial") }))).status, "partial");
  } finally { state = null; }
});

test("barkod: nativeScan web'de null döner; nativeGet fetch yedeğinde yalnızca Accept gönderir ve süreyi izler", async () => {
  eq(await nativeScan({}), null);
  eq(SCAN_ERRORS, { "OS-PLUG-BARC-0006": "cancel", "OS-PLUG-BARC-0007": "denied" });
  const realFetch = window.fetch;
  let seen;
  try {
    window.fetch = async (url, init) => { seen = { url, init }; return { status: 200, json: async () => ({ a: 1 }) }; };
    eq(await nativeGet("https://example.test/x", { "User-Agent": "X", Accept: "a" }, 1000), { status: 200, data: { a: 1 } });
    eq([Object.keys(seen.init.headers), seen.init.credentials, seen.init.referrerPolicy, seen.init.body], [["Accept"], "omit", "no-referrer", undefined]);
    const fail = async () => { try { await nativeGet("https://example.test/x", {}, 20); } catch(e){ return e; } };
    window.fetch = (url, init) => new Promise((res, rej) => init.signal.addEventListener("abort", () => rej(new DOMException("x", "AbortError"))));
    eq((await fail()).name, "TimeoutError");
    window.fetch = async () => { throw new TypeError("net"); };
    eq((await fail()).name, "TypeError", "bağlantı hatası olduğu gibi atılır");
  } finally { window.fetch = realFetch; }
});

test("barkod: kayıt kopya oluşturmaz, barkodla ve adla bulunur; dışarıdan metin unitName'e girmez", async () => {
  state = await loadFixture(); migrateMeals();
  try {
    const key = saveBarcodeFood("3017620422003", { n: "Nutella", p: 6.3, c: 57.5, f: 30.9, lif: 0, br: "Ferrero", serving: 15, src: "off" });
    eq(key, "bc_3017620422003");
    const rec = state.customFoods[key];
    eq(rec, { n: "Nutella", p: 6.3, c: 57.5, f: 30.9, alk: 0, lif: 0, i: "grain", bc: "3017620422003", a: "3017620422003 Ferrero",
      br: "Ferrero", src: "off", por: [{ n: "porsiyon", g: 15 }] });
    ok(!("unit" in rec) && !("unitName" in rec), "unit/unitName yazılmamalı");
    saveBarcodeFood("3017620422003", { n: "Nutella (düzenlendi)", p: 7, c: 57, f: 30, lif: 1, br: "Ferrero", src: "off" });
    eq(Object.keys(state.customFoods).filter(k => k.startsWith("bc_")), ["bc_3017620422003"], "aynı barkod kopya oluşturmamalı");
    eq(state.customFoods[key].n, "Nutella (düzenlendi)");
    ok(!("por" in state.customFoods[key]), "porsiyon yoksa yazılmaz");

    eq(foodByBarcode("3017620422003")[0], key);
    eq(foodByBarcode("96385074"), null);
    saveBarcodeFood("036000291452", { n: "Mısır gevreği", p: 7, c: 84, f: 1 });
    eq(foodByBarcode("0036000291452")[0], "bc_0036000291452", "UPC-A iki biçimde de bulunur");
    eq(foodByBarcode("036000291452")[0], "bc_0036000291452");
    const alcoholicKey = saveBarcodeFood("4006381333931", { n: "Bira", p: 0, c: 0, f: 0, alk: 5, lif: 0 });
    eq(state.customFoods[alcoholicKey].alk, 5, "alkol kayda taşınmalı");
    delete state.customFoods[alcoholicKey];
    state.customFoods.bc_x = { n: "Eski kayıt", p: 1, c: 1, f: 1, lif: 0, i: "grain", bc: "96385074" };
    eq(foodByBarcode("96385074")[0], "bc_x", "anahtarı farklı ama bc alanı eşleşen kayıt");

    for (const q of ["düzenlendi", "3017620422003", "ferrero", "mısır gevreği"])
      ok(searchFoods(q, 8).some(([k]) => k === key || k === "bc_0036000291452"), q + " ile bulunamadı");
    eq(searchFoods("3017620422003", 8)[0][0], key, "numarayla arama");

    logPick = key; logQuery = "Nutella";
    tab = "meals"; mealTab = "log"; addOpen = slotList()[0][0]; render();
    ok(app.querySelector("#pick-amt"), "miktar kartı açılmalı");
  } finally { closeAddPanel(); }
});

test("barkod: kötü niyetli ürün adı temizlenir, kaçışsız basılacak yer kalmaz", async () => {
  const res = offToFood(await offFx("off-xss"), "en");
  eq(res.status, "ok");
  ok(!/[<>]/.test(res.food.n) && !/[<>]/.test(res.food.br), "ad ve marka < > içermemeli: " + res.food.n);
  ok(!/[<>]/.test(offToFood(await offFx("off-xss"), "tr").food.n));
  const long = cloneJson(await offFx("off-found"));
  long.product.product_name = "x".repeat(500);
  eq(offToFood(long, "tr").food.n.length, 80);

  /* Temizleme atlansa bile ekran kaçışlıdır: arama, günlük, miktar kartı ve önizleme. */
  window.__xss = undefined;
  await openAddPanel();
  const evil = '<img src=x onerror="window.__xss=1">Kötü';
  state.customFoods = { bc_evil: { n: evil, p: 5, c: 5, f: 5, lif: 0, i: "grain", a: "onerror", br: evil } };
  state.days[today()].log = [{ id: 1, k: "bc_evil", n: evil, g: 100, p: 5, c: 5, f: 5, lif: 0, v: [], i: "grain", slot: slotList()[0][0] }];
  try {
    await withBarcode(async () => {
      logQuery = "onerror"; logPick = "bc_evil"; render();
      ok(app.innerHTML.includes("&lt;img"), "ad kaçışlı basılmalı");
      eq(app.querySelectorAll('img[src="x"]').length, 0, "ad HTML olarak yorumlanmamalı");
      bcShow(customFoodForm({ n: evil, br: evil, bc: "3017620422003",
        notes: [[tx("Marka: {0}", [esc(evil)]), false]] }));
      eq(app.querySelectorAll('img[src="x"]').length, 0, "önizleme HTML yorumlamamalı");
      eq(app.querySelector("#cf-n").value, evil, "alanın değeri metin olarak durmalı");
      eq(window.__xss, undefined);
    });
  } finally { closeAddPanel(); }
});

test("barkod: web'de düğme çizilmez, panel eskisi gibi kalır; uygulamada düğme ve erişilebilir alanlar var", async () => {
  await openAddPanel();
  try {
    eq(barcodeAvailable(), false, "testler web'de çalışır");
    ok(!app.querySelector("#bc-scan") && !app.querySelector("#bc-box"), "web'de barkod arayüzü olmamalı");
    ok(app.querySelector("#custom-toggle") && app.querySelector("#add-close"));
    eq(app.querySelector("#add-close").getAttribute("style"), "flex:0 0 92px", "web'de Kapat düğmesi eski yerinde");
    /* Elle tanımlama: lif alanı ve canlı kalori eklendi, eski davranış korunur. */
    app.querySelector("#custom-toggle").onclick();
    eq(a11yBad("kendi besinin"), []);
    app.querySelector("#cf-save").onclick();
    eq(Object.keys(state.customFoods || {}), [], "adsız kayıt yazılmaz");
    app.querySelector("#cf-n").value = "Deneme";
    app.querySelector("#cf-p").value = "10"; app.querySelector("#cf-p").oninput();
    ok(app.querySelector("#cf-kcal").textContent.includes("40"), "canlı kalori");
    app.querySelector("#cf-c").value = "3";
    app.querySelector("#cf-f").value = "0";
    app.querySelector("#cf-l").value = "3";
    await app.querySelector("#cf-save").onclick();
    const [k, f] = Object.entries(state.customFoods)[0];
    eq([k.startsWith("cf_"), f.n, f.p, f.c, f.f, f.lif, f.i, "bc" in f], [true, "Deneme", 10, 3, 0, 3, "grain", false]);
    eq(logPick, k);
  } finally { closeAddPanel(); }
  await openAddPanel();
  try {
    await withBarcode(async () => {
      render();
      const b = app.querySelector("#bc-scan");
      ok(b && b.textContent.trim(), "uygulamada barkod düğmesi çizilmeli");
      ok(app.querySelector("#custom-toggle") && app.querySelector("#add-close") && app.querySelector("#bc-box"));
      eq(a11yBad("barkod düğmesi"), []);
    });
  } finally { closeAddPanel(); }
});

/* Akışın bütün durumları iki dilde sürülür; İngilizcede sözlükte olmayan metin kalmamalı. */
const driveBarcodeFlow = async lang => {
  const found = await offFx("off-found"), partial = await offFx("off-partial"), none = await offFx("off-notfound");
  await openAddPanel();
  const box = () => app.querySelector("#bc-box");
  let scans = 0, gets = [];
  nativeScan = async () => { scans++; return { status: "ok", code: "3017620422003" }; };
  nativeGet = async (url) => { gets.push(url); return { status: 200, data: found }; };

  /* ilk kullanım: bilgi penceresi, onaydan sonra tarama, önizleme */
  eq(state.bcOk, undefined);
  const flow = startBarcodeFlow();
  eq(scans, 0, "onaydan önce kamera açılmamalı");
  const sheet = [...document.querySelectorAll(".sheet-bg")].pop();
  ok(sheet && sheet.textContent.includes("Open Food Facts"), "bilgi penceresi Open Food Facts'i anmalı");
  ok(sheet.querySelector('[role="dialog"][aria-labelledby]') && sheet.querySelector(".sheet-x").getAttribute("aria-label"), "pencere erişilebilir olmalı");
  await confirmBarcodeInfo(flow);
  eq([state.bcOk, scans, gets.length], [1, 1, 1]);
  ok(box().querySelector("#cf-card"), "önizleme kartı");
  eq(app.querySelector("#cf-n").value, "Nutella");
  eq(["cf-p", "cf-c", "cf-f", "cf-l"].map(id => +app.querySelector("#" + id).value), [6.3, 57.5, 30.9, 0]);
  ok(app.querySelector("#cf-kcal").textContent.includes("533"), "hesaplanan kalori: " + app.querySelector("#cf-kcal").textContent);
  ok(box().textContent.includes("Open Food Facts") && box().textContent.includes("Ferrero"), "kaynak ve marka");
  ok(!app.querySelector("#custom-form #cf-card"), "tek form açık olmalı");
  eq(a11yBad("önizleme"), []);
  app.querySelector("#cf-p").value = "7"; app.querySelector("#cf-p").oninput();
  await app.querySelector("#cf-save").onclick();
  const rec = state.customFoods.bc_3017620422003;
  eq([rec.p, rec.bc, rec.src, rec.i, logPick, logQuery], [7, "3017620422003", "off", "grain", "bc_3017620422003", "Nutella"]);
  ok(app.querySelector("#pick-amt"), "miktar kartı açılmalı");

  /* aynı barkod ikinci kez: ağa çıkılmaz, bilgi penceresi bir daha çıkmaz */
  logPick = null; render();
  await startBarcodeFlow();
  eq([scans, gets.length, logPick], [2, 1, "bc_3017620422003"]);
  ok(!document.querySelector(".sheet-bg:not(.out)"), "bilgi penceresi bir kez çıkar");

  /* kamera izni yok: elle numara girişi */
  nativeGet = async () => { throw new Error("ağ çağrılmamalı"); };
  nativeScan = async () => ({ status: "denied" });
  logPick = null; render(); await startBarcodeFlow();
  ok(box().querySelector(".cf-warn") && app.querySelector("#bc-num"), "izin yoksa uyarı ve numara alanı");
  eq(a11yBad("izin yok"), []);
  app.querySelector("#bc-num").value = "123"; app.querySelector("#bc-find").onclick();
  ok(app.querySelector("#bc-err").textContent.length > 0, "geçersiz numara uyarısı");
  nativeGet = async () => ({ status: 200, data: partial });
  app.querySelector("#bc-num").value = "96385074"; await app.querySelector("#bc-find").onclick();
  ok(app.querySelector("#cf-card"), "elle girilen numara aranır");

  /* vazgeçme sessizdir; geçersiz kod ve tarayıcı hatası tekrar dene / elle gir sunar */
  nativeScan = async () => ({ status: "cancel" });
  render(); await startBarcodeFlow();
  eq(box().innerHTML, "");
  nativeScan = async () => ({ status: "ok", code: "1234567890123" });
  await startBarcodeFlow();
  ok(app.querySelector("#bc-retry") && app.querySelector("#bc-enter"), "geçersiz kod");
  eq(a11yBad("geçersiz kod"), []);
  nativeScan = async () => ({ status: "error" });
  await startBarcodeFlow();
  ok(app.querySelector("#bc-retry") && app.querySelector("#bc-enter"), "tarayıcı hatası");
  app.querySelector("#bc-enter").onclick();
  ok(app.querySelector("#bc-num"), "elle gir numara alanını açar");

  /* bağlantı yok: tekrar dene ve elle gir */
  nativeScan = async () => ({ status: "ok", code: "4006381333931" });
  nativeGet = async () => { throw new TypeError("Failed to fetch"); };
  render(); await startBarcodeFlow();
  ok(app.querySelector("#bc-retry") && app.querySelector("#bc-enter"), "bağlantı yok");
  eq(a11yBad("bağlantı yok"), []);
  nativeGet = async () => ({ status: 200, data: partial });
  await app.querySelector("#bc-retry").onclick();
  eq(app.querySelector("#cf-n").value, lang === "en" ? "Sample yoghurt" : "Örnek yoğurt", "ürün adı dile göre");

  /* eksik değerli ürün: dolu olanlar gelir, kalanı kullanıcı tamamlar */
  eq([app.querySelector("#cf-p").value, app.querySelector("#cf-c").value, app.querySelector("#cf-f").value], ["12.5", "", ""]);
  ok(box().querySelector(".cf-warn"), "eksik değer uyarısı");
  await app.querySelector("#cf-save").onclick();
  ok(app.querySelector("#cf-err").textContent.length > 0 && !state.customFoods.bc_4006381333931, "eksik değerle kayıt olmaz");
  app.querySelector("#cf-c").value = "5"; app.querySelector("#cf-f").value = "101";
  await app.querySelector("#cf-save").onclick();
  ok(app.querySelector("#cf-err").textContent.length > 0 && !state.customFoods.bc_4006381333931, "100'ü aşan değerle kayıt olmaz");
  app.querySelector("#cf-f").value = "3";
  await app.querySelector("#cf-save").onclick();
  eq([state.customFoods.bc_4006381333931.f, state.customFoods.bc_4006381333931.src], [3, "off"]);

  /* bulunamadı: boş form, barkodla kaydedilir, bir dahaki okutmada cihazdan gelir */
  nativeScan = async () => ({ status: "ok", code: "96385074" });
  delete state.customFoods.bc_x;
  for (const k of Object.keys(state.customFoods)) if (state.customFoods[k].bc === "96385074") delete state.customFoods[k];
  nativeGet = async () => ({ status: 404, data: none });
  logPick = null; render(); await startBarcodeFlow();
  eq([app.querySelector("#cf-n").value, app.querySelector("#cf-p").value], ["", ""]);
  eq(a11yBad("bulunamadı"), []);
  await app.querySelector("#cf-save").onclick();
  eq(Object.keys(state.customFoods).filter(k => state.customFoods[k].bc === "96385074"), [], "adsız kayıt yazılmaz");
  app.querySelector("#cf-n").value = "Su";
  for (const id of ["cf-p", "cf-c", "cf-f"]) app.querySelector("#" + id).value = "0";
  await app.querySelector("#cf-save").onclick();
  const manual = state.customFoods.bc_96385074;
  eq([manual.n, manual.p, manual.bc, "src" in manual], ["Su", 0, "96385074", false], "elle girilen ürün Open Food Facts kaynaklı sayılmaz");
  nativeGet = async () => { throw new Error("ağ çağrılmamalı"); };
  logPick = null; render(); await startBarcodeFlow();
  eq(logPick, "bc_96385074");
};

test("barkod akışı: bilgi penceresi, tarama, önizleme, kayıt, ikinci okutma ve bütün hata durumları", async () => {
  try { await withBarcode(() => driveBarcodeFlow("tr")); }
  finally { closeAddPanel(); }
});
test("barkod akışı: İngilizcede de çalışır ve sözlükte olmayan metin kalmaz", async () => {
  try {
    await withBarcode(() => withLang("en", async () => {
      I18N_MISSING.clear();
      await driveBarcodeFlow("en");
      eq([...I18N_MISSING], [], "İngilizce karşılığı olmayan metinler");
    }));
  } finally { closeAddPanel(); }
});

test("barkod: gizlilik metinleri, kaynaklar, bağımlılık ve iOS beyanları yerinde", async () => {
  const get = async p => { const r = await fetch("../" + p); ok(r.ok, p + " açılmadı"); return r.text(); };
  const [tr, en] = (await get("starboard-site/privacy.html")).split('<article id="en"');
  ok(tr.includes("Open Food Facts") && tr.includes("Barkod okuma") && tr.includes("world.openfoodfacts.org/privacy"), "Türkçe gizlilik metni");
  ok(en && en.includes("Open Food Facts") && en.includes("Barcode scanning") && en.includes("world.openfoodfacts.org/privacy"), "İngilizce gizlilik metni");
  ok(SOURCES.some(([, s]) => s.includes("Open Food Facts") && s.includes("ODbL")), "kaynaklarda Open Food Facts yok");
  for (const s of SOURCES.flat().concat(WHATS_NEW.flatMap(n => n.items)))
    ok(Object.prototype.hasOwnProperty.call(I18N.en, s), "İngilizce karşılığı yok: " + s.slice(0, 50));
  state = await loadFixture(); migrateMeals(); notice = null; viewDate = null; ensureToday();
  tab = "settings"; meTab = "set"; render();
  ok(!app.innerHTML.includes("Tek istisna"), "web'de barkod istisnası yazılmamalı");
  ok(!app.innerHTML.includes("Tek istisna"), "web'de barkod istisnası yazılmamalı");
  ok(app.innerHTML.includes("hiçbir yere gönderilmez"), "web'deki söz aynen durmalı");
  state = null; tab = "today"; meTab = "body";

  eq(/^\d+\.\d+\.\d+$/.test(JSON.parse(await get("package.json")).dependencies["@capacitor/barcode-scanner"]), true, "eklenti tam sürümle sabitlenmeli");
  ok((await get("ios/App/CapApp-SPM/Package.swift")).includes("CapacitorBarcodeScanner"), "Package.swift eklentiyi içermiyor (npx cap sync ios)");
  const plist = await get("ios/App/App/Info.plist");
  ok(plist.includes("NSCameraUsageDescription"), "kamera izni Info.plist'te yok");
  for (const l of ["en", "tr"]) ok((await get(`ios/App/App/${l}.lproj/InfoPlist.strings`)).includes("NSCameraUsageDescription"), l + " kamera izni metni yok");
  const priv = await get("ios/App/App/PrivacyInfo.xcprivacy");
  ok(priv.includes("NSPrivacyCollectedDataTypeSearchHistory") && priv.includes("NSPrivacyCollectedDataTypePurposeAppFunctionality"), "gizlilik bildirimi Arama Geçmişi'ni beyan etmeli");
  ok(/NSPrivacyCollectedDataTypeLinked<\/key>\s*<false\/>/.test(priv) && /NSPrivacyCollectedDataTypeTracking<\/key>\s*<false\/>/.test(priv), "ilişkilendirilmez ve izleme yok");

  const idx = await get("starboard-site/index.html"), sw = await get("starboard-site/sw.js");
  const scripts = [...idx.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
  eq(scripts.filter(s => !sw.includes(`"${s}"`)), [], "sw.js SHELL listesinde olmayan kod dosyaları");
  ok(scripts.indexOf("js/barcode.js") > scripts.indexOf("js/meals.js"), "barcode.js, meals.js'ten sonra yüklenmeli");
});

/* ---- Apple Sağlık ---- */
/* Örnekler yerel saatle kurulur; testler hangi saat diliminde çalışırsa çalışsın aynı sonucu verir. */
const hkT = (d, h, m, s) => new Date(2026, 10, d, h, m || 0, s || 0).toISOString();
const hkSleep = (src, name, state, d1, h1, m1, d2, h2, m2) =>
  ({ sourceId: src, sourceName: name, sleepState: state, startDate: hkT(d1, h1, m1), endDate: hkT(d2, h2, m2) });

test("sağlık: adım günlük kovası yerel güne düşer, gece yarısı sınırı doğru, sıfır yazılmaz", () => {
  const out = hkStepsByDay([
    { startDate: hkT(10, 0), endDate: hkT(11, 0), value: 8240.4 },
    { startDate: hkT(11, 0), endDate: hkT(12, 0), value: 0 },
    { startDate: hkT(12, 23, 30), endDate: hkT(12, 23, 59), value: 120 },
    { startDate: hkT(13, 0, 10), endDate: hkT(13, 0, 20), value: 30 },
    { startDate: "bozuk", value: 50 }
  ]);
  eq(out, { "2026-11-10": 8240, "2026-11-12": 120, "2026-11-13": 30 });
  eq(hkStepsByDay(undefined), {});
});

test("sağlık: uyku tek kaynak, awake ve inBed dışarıda, kalkılan güne yazılır, şekerleme yok sayılır", () => {
  const W = "com.apple.health.W", P = "com.apple.health.P";
  const samples = [
    /* Watch: aşamalı, 03:00-03:20 arası uyanık */
    hkSleep(W, "Efe's Apple Watch", "inBed", 9, 22, 50, 10, 7, 0),
    hkSleep(W, "Efe's Apple Watch", "light", 9, 23, 10, 10, 1, 0),
    hkSleep(W, "Efe's Apple Watch", "deep", 10, 1, 0, 10, 3, 0),
    hkSleep(W, "Efe's Apple Watch", "awake", 10, 3, 0, 10, 3, 20),
    hkSleep(W, "Efe's Apple Watch", "rem", 10, 3, 20, 10, 6, 50),
    /* aynı gece iPhone'dan çakışan, daha uzun kayıt: Watch seçilmeli */
    hkSleep(P, "iPhone", "asleep", 9, 23, 0, 10, 7, 30),
    /* şekerleme: 1 saat */
    hkSleep(W, "Efe's Apple Watch", "light", 10, 14, 0, 10, 15, 0),
    /* yalnızca yatakta ve uyanık: uyku sayılmaz */
    hkSleep(P, "iPhone", "inBed", 11, 23, 0, 12, 7, 0),
    hkSleep(P, "iPhone", "awake", 12, 2, 0, 12, 3, 0),
    /* kendi kaynağımız okunmaz */
    hkSleep("app.starboard.health", "Starboard", "asleep", 12, 23, 0, 13, 7, 0),
    /* yalnızca iPhone olan gece, saniyeli saatler: 5 dakikaya yuvarlanır */
    { sourceId: P, sourceName: "iPhone", sleepState: "asleep", startDate: hkT(13, 23, 12, 40), endDate: hkT(14, 6, 58, 10) }
  ];
  const out = hkSleepByDay(samples);
  eq(Object.keys(out).sort(), ["2026-11-10", "2026-11-14"], "uyku günleri");
  eq(out["2026-11-10"], { sleep: 7.33, bed: 23 * 60 + 10, wake: 6 * 60 + 50 }, "Watch, uyanık süre düşülmüş, toplam uyku");
  eq(out["2026-11-14"], { sleep: 7.76, bed: 23 * 60 + 15, wake: 7 * 60 }, "yuvarlama");
  for (const v of Object.values(out)){
    for (const m of [v.bed, v.wake]) ok(m >= 0 && m <= 1439 && m % 5 === 0, "bed/wake 0–1439 ve 5'in katı: " + m);
    eq(v.sleep, Math.round(v.sleep * 100) / 100, "2 ondalık");
  }
  /* gece yarısını geçen uyku, yatılan değil kalkılan güne */
  eq(Object.keys(hkSleepByDay([hkSleep(P, "iPhone", "asleep", 20, 23, 30, 21, 7, 0)])), ["2026-11-21"]);
  /* uzun bir gece uyanması oturumu böler; kısa kalan parça şekerleme sayılır */
  eq(hkSleepByDay([hkSleep(P, "iPhone", "asleep", 20, 0, 0, 20, 1, 0), hkSleep(P, "iPhone", "asleep", 20, 3, 0, 20, 8, 0)])["2026-11-20"].sleep, 5);
});

test("sağlık: kilo günün ilk ölçümü, sınır dışı ve kendi kaynağımız atılır", () => {
  const w = (d, h, v, src) => ({ startDate: hkT(d, h), endDate: hkT(d, h), value: v, sourceId: src || "com.withings.wiscale2" });
  eq(hkWeightByDay([
    w(10, 8, 81.44), w(10, 7, 81.9), w(10, 20, 82.5),
    w(11, 8, 500), w(11, 9, 10),
    w(12, 6, 80, "app.starboard.health"), w(12, 7, 80.26)
  ]), { "2026-11-10": 81.9, "2026-11-12": 80.3 });
});

test("sağlık: kayda yazma; doldurur, kendi yazdığını günceller, elle gireni ezmez, silineni geri getirmez", () => {
  const st = { profile: { health: { on: true } }, days: {
    "2026-11-02": { tasks: [], steps: 5000 },                                   /* elle girilmiş */
    "2026-11-03": { tasks: [], steps: 3000, hk: { steps: 3000 } },              /* bizim yazdığımız */
    "2026-11-04": { tasks: [], hk: { steps: 4000 } },                           /* kullanıcı silmiş */
    "2026-11-05": { tasks: [], steps: 6000, hk: { steps: 4000 } },              /* kullanıcı değiştirmiş */
    "2026-11-06": { tasks: [], sleep: 7, bed: 1380, wake: 400, hk: { sleep: 7, bed: 1380, wake: 360 } }   /* kalkışı elle kaydırmış */
  } };
  const data = {
    steps: { "2026-10-20": 999, "2026-11-01": 8240, "2026-11-02": 9000, "2026-11-03": 7000, "2026-11-04": 9000, "2026-11-05": 9000 },
    sleep: { "2026-11-01": { sleep: 7.5, bed: 1390, wake: 420 }, "2026-11-06": { sleep: 8, bed: 1380, wake: 420 } },
    weight: { "2026-11-01": 81.4 }
  };
  const before = cloneJson(st.days);
  ok(applyHealth(st, data, "2026-11-01", "2026-11-14"), "değişiklik var, true dönmeli");
  const d = st.days;
  eq(d["2026-11-01"], { tasks: [], hk: { steps: 8240, sleep: 7.5, bed: 1390, wake: 420, weight: 81.4 }, steps: 8240, sleep: 7.5, bed: 1390, wake: 420, weight: 81.4 }, "boş gün dolar, görev tohumlanmaz");
  ok(!("seeded" in d["2026-11-01"]), "yeni açılan geçmiş güne görev tohumlaması yapılmaz");
  eq(d["2026-11-02"], before["2026-11-02"], "elle girilen ezilmez");
  eq([d["2026-11-03"].steps, d["2026-11-03"].hk.steps], [7000, 7000], "kendi yazdığımız güncellenir");
  eq(d["2026-11-04"], before["2026-11-04"], "silinen geri gelmez");
  eq(d["2026-11-05"], before["2026-11-05"], "değiştirilen ezilmez");
  eq(d["2026-11-06"], before["2026-11-06"], "uyku grubunda bir alan değiştiyse hiçbiri yazılmaz");
  ok(!d["2026-10-20"], "pencere dışındaki güne dokunulmaz");
  eq(applyHealth(st, data, "2026-11-01", "2026-11-14"), false, "aynı veri ikinci kez: değişiklik yok");

  /* kapalı türe dokunulmaz */
  const st2 = { profile: { health: { on: true, weight: false, sleep: false } }, days: {} };
  ok(applyHealth(st2, data, "2026-11-01", "2026-11-14"));
  eq(Object.keys(st2.days["2026-11-01"]).sort(), ["hk", "steps", "tasks"]);
  eq(applyHealth({ profile: { health: { on: true, steps: false, sleep: false, weight: false } }, days: {} }, data, "2026-11-01", "2026-11-14"), false);
  /* bozuk veri yazılmaz */
  eq(applyHealth({ profile: {}, days: {} }, { steps: { "2026-11-01": NaN }, sleep: { "2026-11-01": { sleep: 7 } } }, "2026-11-01", "2026-11-01"), false);
});

test("sağlık: Sağlık'tan gelen adım hedefi işaretler, kilo tartı hatırlatmasını susturur", async () => {
  const st = await loadFixture();
  const k = "2026-11-11", program = buildProgram(st.profile, 82, 0);
  delete st.days[k];
  for (const d of Object.values(st.days)) delete d.weight; /* son 7 günde tartı yok */
  st.profile.health = { on: true };
  st.profile.reminders = { weigh: true };
  const now = new Date("2026-11-11T06:00:00");
  ok(reminderPlan(st, program, now).some(n => n.kind === "weigh" && dayKey(n.at) === k), "önce tartı hatırlatması var");
  ok(applyHealth(st, { steps: { [k]: 9100 }, weight: { [k]: 81.6 } }, shiftDays(k, -13), k));
  const ctx = { today: k, hour: 12, profile: st.profile, sleep: [7, 9], steps: 8000 };
  const s = taskStatus("steps", st.days[k], program, k, ctx);
  eq([s.ok, s.value], [true, 9100]);
  eq(taskStatus("weigh", st.days[k], program, k, ctx).ok, true);
  ok(!reminderPlan(st, program, now).some(n => n.kind === "weigh" && dayKey(n.at) === k), "tartıldıysa hatırlatma atlanır");
  ok(!st.profile.goals || !st.profile.goals.steps, "kapalı adım hedefi kendiliğinden açılmaz");
});

test("sağlık: okuma çağrıları (yalnızca okuma, günlük kova, uyku sınırı) ve hata veren tür ötekileri bozmaz", async () => {
  const calls = [];
  const P = {
    queryAggregated: async o => { calls.push(["agg", o]); return { samples: [{ startDate: hkT(10, 0), endDate: hkT(11, 0), value: 5000 }] }; },
    readSamples: async o => { calls.push(["read", o]); if (o.dataType === "sleep") throw new Error("izin yok"); return { samples: [{ startDate: hkT(10, 8), value: 80, sourceId: "x" }] }; }
  };
  const start = new Date(2026, 10, 10), end = new Date(2026, 10, 11, 9);
  const data = await hkRead(P, { on: true }, start, end);
  eq(data, { steps: { "2026-11-10": 5000 }, sleep: {}, weight: { "2026-11-10": 80 } });
  const agg = calls.find(c => c[0] === "agg")[1], sl = calls.find(c => c[1].dataType === "sleep")[1];
  eq([agg.dataType, agg.bucket, agg.aggregation, agg.startDate], ["steps", "day", "sum", start.toISOString()]);
  ok(sl.limit >= 1000, "uyku için örnek sınırı yükseltilmeli");
  ok(Date.parse(sl.startDate) < start.getTime(), "uyku pencerenin ilk gününe biten geceyi de almalı");
  calls.length = 0;
  await hkRead(P, { on: true, sleep: false, weight: false }, start, end);
  eq(calls.map(c => c[1].dataType), ["steps"], "kapalı türler istenmez");
  eq(hkReadTypes({ sleep: false }), ["steps", "weight"]);
  /* pencere: ilk eşitlemede 14 gün, sonra son eşitlemeden bu yana (2–14) */
  eq(hkWindow(undefined, "2026-11-13"), 14);
  eq(hkWindow(new Date(2026, 10, 13, 8).toISOString(), "2026-11-13"), 2);
  eq(hkWindow(new Date(2026, 10, 8, 8).toISOString(), "2026-11-13"), 6);
  eq(hkWindow(new Date(2026, 9, 1).toISOString(), "2026-11-13"), 14);
});

test("uyku: Dünkü gibi seçili günden önceki en yakın kaydı kopyalar", async () => {
  const saved = { state, viewDate, tab, goalOpen };
  try {
    state = await loadFixture();
    migrateMeals();
    const now = today(), past = shiftDays(now, -8);
    const entry = { tasks: [], bed: 1410, wake: 450, sleep: 8 };
    state.days = {
      [shiftDays(now, -10)]: { tasks: [], bed: 1320, wake: 360, sleep: 8 },
      [shiftDays(now, -9)]: { tasks: [], bed: 1350, wake: 390, sleep: 8 },
      [past]: entry,
      [shiftDays(now, -1)]: { tasks: [], bed: 1380, wake: 420, sleep: 8 }
    };
    viewDate = past; tab = "today"; goalOpen = "sleep";
    render();
    const copy = document.getElementById("sl-last");
    eq(copy.textContent, "Dünkü gibi: 22:30 → 06:30");
    copy.click();
    await Promise.resolve();
    eq([entry.bed, entry.wake, entry.sleep], [1350, 390, 8]);

    viewDate = null;
    render();
    eq(document.getElementById("sl-last").textContent, "Dünkü gibi: 23:00 → 07:00");
  } finally {
    ({ state, viewDate, tab, goalOpen } = saved);
  }
});

test("sağlık: web'de bölüm yok; uygulamada bölüm erişilebilir ve İngilizcesi tam; kadran toplam uykuyu gösterir", async () => {
  eq([healthAvailable(), healthSection()], [false, ""], "web'de Sağlık bölümü olmamalı");
  eq(await syncHealth(), null, "web'de eşitleme çalışmaz");
  state = await loadFixture(); migrateMeals(); notice = null; viewDate = null; ensureToday();
  tab = "settings"; meTab = "set";
  const keep = healthAvailable;
  try {
    render();
    ok(!app.querySelector("[data-hk-type]") && !app.innerHTML.includes("Apple Sağlık"), "web'de Sağlık arayüzü ve metni yok");
    healthAvailable = () => true;
    for (const lang of ["tr", "en"]) await withLang(lang, async () => {
      I18N_MISSING.clear();
      delete state.profile.health; render();
      ok(app.querySelector("#hk-connect") && app.querySelectorAll("[data-hk-type]").length === 3, "bağlan düğmesi ve tür seçimi");
      ok([...app.querySelectorAll("[data-hk-type]")].every(b => b.getAttribute("aria-pressed") === "true"), "türler varsayılan açık");
      eq(a11yBad("sağlık bağlı değil"), []);
      state.profile.health = { on: true, sleep: false, lastSync: new Date().toISOString() };
      hkNote = tx("Sağlık'tan veri gelmedi. İzin vermediysen: Sağlık uygulaması › profil › Gizlilik › Uygulamalar › Starboard.");
      render();
      ok(app.querySelector("#hk-sync") && app.querySelector("#hk-off") && !app.querySelector("#hk-connect"), "bağlıyken eşitle ve kes");
      eq(app.querySelector('[data-hk-type="sleep"]').getAttribute("aria-pressed"), "false");
      ok(app.querySelector('[role="status"]').textContent.includes(lang === "en" ? "No data came" : "veri gelmedi"), "yardım metni");
      eq(a11yBad("sağlık bağlı"), []);
      hkNote = "";
      eq([...I18N_MISSING], [], "İngilizce karşılığı olmayan metinler");
    });
    /* bağlantıyı kes: eşitleme kapanır, alınan değerler kalır */
    state.days[today()].steps = 1234; state.days[today()].hk = { steps: 1234 };
    await app.querySelector("#hk-off").onclick();
    eq([state.profile.health.on, state.days[today()].steps], [false, 1234]);
  } finally { healthAvailable = keep; hkNote = ""; tab = "today"; meTab = "body"; }
  /* Bugün satırı kaynağı söyler; kadranın ortasında kayıttaki toplam uyku */
  const e = { tasks: [], sleep: 7.33, bed: 1390, wake: 410, hk: { sleep: 7.33, bed: 1390, wake: 410 } };
  const box = document.createElement("div"); box.innerHTML = sleepHTML(e);
  eq(box.querySelector("#sl-c1").textContent, durTxt(440), "kayıttaki toplam uyku (aralık 8 sa 20 dk)");
  eq([box.querySelector("#sl-bed").value, box.querySelector("#sl-wake").value], ["23:10", "06:50"], "kayıtlı saatler girişte görünür");
  /* tek ekran: yatış ve kalkıştan süre otomatik, kayıt bicimi (sleep, bed, wake) aynı */
  eq(sleepDur(23 * 60 + 30, 7 * 60), 450);
  eq([parseHm("07:05"), parseHm("24:00") === 0, parseHm("")], [425, true, null]);
  state.days[shiftDays(today(), -1)] = { bed: 1410, wake: 420, sleep: 8 };
  box.innerHTML = sleepHTML({ tasks: [] });
  eq(box.querySelector("#sl-last").textContent.includes("23:30 → 07:00"), true, "son girilen değer tek dokunuşla");
  eq(hkTag(e, "sleep"), " · Sağlık'tan");
  eq(hkTag({ ...e, sleep: 8 }, "sleep"), "", "elle değişince kaynak yazılmaz");
  state = null;
});

test("sağlık: kayıt şeması değişmedi; eski kayıt profile.health olmadan açılır", async () => {
  eq(SCHEMA, 3, "Sağlık şemayı artırmadı; 3 takımyıldız kaydı (1.11.0)");
  const st = await loadFixture();
  ok(!st.profile.health, "örnek kayıtta Sağlık ayarı yok");
  const m = migrateState(st);
  eq(m.newer, false);
  eq(healthOf(st.profile), {});
  eq(applyHealth(st, {}, "2026-11-01", "2026-11-14"), false);
  state = st; migrateMeals(); notice = null; viewDate = null; ensureToday();
  tab = "settings"; meTab = "set"; render();
  ok(app.querySelector("#s-save"), "ayarlar açılmalı");
  tab = "today"; render(); ok(app.querySelector("#goal-list"), "bugün açılmalı");
  state = null;
});

test("sağlık: eklenti, yetki, gizlilik metinleri ve iOS beyanları yerinde", async () => {
  const get = async p => { const r = await fetch("../" + p); ok(r.ok, p + " açılmadı"); return r.text(); };
  eq(/^\d+\.\d+\.\d+$/.test(JSON.parse(await get("package.json")).dependencies["@capgo/capacitor-health"]), true, "eklenti tam sürümle sabitlenmeli");
  ok((await get("ios/App/CapApp-SPM/Package.swift")).includes("CapgoCapacitorHealth"), "Package.swift eklentiyi içermiyor (npx cap sync ios)");
  const ent = await get("ios/App/App/App.entitlements");
  ok(/<key>com\.apple\.developer\.healthkit<\/key>\s*<true\/>/.test(ent), "HealthKit yetkisi yok");
  ok(/<key>com\.apple\.developer\.healthkit\.access<\/key>\s*<array\/>/.test(ent), "klinik kayıt istenmemeli (boş dizi)");
  ok(!/health-records|background-delivery/.test(ent), "gereksiz HealthKit yetkisi");
  ok(/com\.apple\.HealthKit = \{\s*enabled = 1;/.test(await get("ios/App/App.xcodeproj/project.pbxproj")), "projede HealthKit yeteneği yok");
  const plist = await get("ios/App/App/Info.plist");
  ok(plist.includes("NSHealthShareUsageDescription") && plist.includes("NSHealthUpdateUsageDescription"), "Sağlık izin metinleri Info.plist'te yok");
  ok(!/<string>healthkit<\/string>/.test(plist), "healthkit cihaz şartı olmamalı (eski iPad'ler dışarıda kalır)");
  const priv = await get("ios/App/App/PrivacyInfo.xcprivacy");
  ok(!/NSPrivacyCollectedDataType(Health|Fitness)/.test(priv), "Sağlık verisi cihazdan çıkmadığı için beyan edilmez");
  const [tr, en] = (await get("starboard-site/privacy.html")).split('<article id="en"');
  ok(tr.includes("Apple Sağlık (yalnızca iPhone uygulaması)") && tr.includes("Yalnızca okuma") && tr.includes("16 Kasım 2026"), "Türkçe gizlilik metni");
  ok(en.includes("Apple Health (iPhone app only)") && en.includes("Read only") && en.includes("November 16, 2026"), "İngilizce gizlilik metni");
  ok(WHATS_NEW.some(n => n.native && n.items.some(s => s.includes("Apple Sağlık"))), "Neler yeni maddesi yalnızca iPhone'da");
  ok(!WHATS_NEW.some(n => !n.native && n.items.some(s => s.includes("Apple Sağlık"))), "Sağlık maddesi web'de görünmemeli");
  const scripts = [...(await get("starboard-site/index.html")).matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
  ok(scripts.indexOf("js/health.js") > scripts.indexOf("js/reminders.js") && scripts.indexOf("js/health.js") < scripts.indexOf("js/main.js"), "health.js sırası");
  ok((await get("starboard-site/sw.js")).includes('"js/health.js"'), "health.js sw.js SHELL listesinde değil");
  state = await loadFixture(); migrateMeals(); notice = null; viewDate = null; ensureToday();
  tab = "settings"; meTab = "set"; render();
  ok(!app.innerHTML.includes("Apple Sağlık'a bağlanırsan"), "web'de Sağlık gizlilik cümlesi yazılmamalı");
  state = null; tab = "today"; meTab = "body";
});

/* ---- kendi yiyeceklerim: düzenleme ve silme ---- */
const NUTELLA = "bc_3017620422003";
const myFoodsFixture = async () => {
  await openAddPanel();
  const slot = slotList()[0][0];
  state.customFoods = {
    cf_1: { n: "Annemin mercimek köftesi", p: 8, c: 20, f: 5, lif: 4, i: "grain" },
    [NUTELLA]: { n: "Nutella", p: 6.3, c: 57.5, f: 30.9, lif: 0, i: "grain", bc: "3017620422003", a: "3017620422003 Ferrero",
      br: "Ferrero", src: "off", por: [{ n: "porsiyon", g: 15 }] }
  };
  const past = shiftDays(today(), -3);
  const line = (id, k, g, f) => ({ id, k, n: f.n, g, p: f.p, c: f.c, f: f.f, lif: f.lif, v: [], i: "grain", slot });
  state.days[past] = { tasks: [], seeded: true, log: [line(101, "cf_1", 150, state.customFoods.cf_1), line(102, NUTELLA, 30, state.customFoods[NUTELLA])] };
  syncKcal(state.days[past]);
  state.days[today()].log = [line(103, "cf_1", 100, state.customFoods.cf_1)];
  syncKcal(state.days[today()]);
  myFoodsOpen = false; myFoodEdit = null;
  render();
  return { slot, past };
};
const closeMyFoods = () => { myFoodsOpen = false; myFoodEdit = null; viewDate = null; editLog = null; mealTab = "log"; closeAddPanel(); };
const clickYes = async (btn, yes) => {
  const done = btn.onclick();
  const sheet = [...document.querySelectorAll(".sheet-bg")].pop();
  ok(sheet && sheet.querySelector("#ask-ok"), "onay sayfası açılmalı");
  sheet.querySelector(yes ? "#ask-ok" : "#ask-no").click();
  await done;
  document.querySelectorAll(".sheet-bg").forEach(e => e.remove());
};

test("kendi yiyeceklerim: liste yalnızca yiyecek varsa çıkar; ad, marka, 100 g kalori ve barkod işareti", async () => {
  await openAddPanel();
  try {
    ok(!app.querySelector("#mf-toggle"), "kendi yiyeceği olmayana düğme çizilmez");
    closeMyFoods();
    await myFoodsFixture();
    ok(app.querySelector("#mf-toggle") && !app.querySelector(".mf-row"), "liste kapalı başlar");
    eq(app.querySelector("#mf-toggle").getAttribute("aria-expanded"), "false");
    app.querySelector("#mf-toggle").onclick();
    eq(app.querySelector("#mf-toggle").getAttribute("aria-expanded"), "true");
    const rows = [...app.querySelectorAll(".mf-row")];
    eq(rows.length, 2);
    const nut = app.querySelector(`[data-mf-edit="${NUTELLA}"]`).closest(".mf-row");
    ok(nut.textContent.includes("Nutella") && nut.textContent.includes("Ferrero") && nut.textContent.includes("533"), "ad, marka, kcal: " + nut.textContent);
    ok(nut.querySelector(".bc-mark"), "barkodlu üründe işaret");
    const mine = app.querySelector('[data-mf-edit="cf_1"]').closest(".mf-row");
    ok(mine.textContent.includes("157") && !mine.querySelector(".bc-mark"), "barkodsuzda işaret yok");
    eq(app.querySelectorAll(".bc-mark").length, 1);
    for (const b of app.querySelectorAll(".mf-row button")) ok((b.getAttribute("aria-label") || b.textContent).trim().length > 2, "düğme adı");
    eq(a11yBad("kendi yiyeceklerim"), []);
    app.querySelector("#mf-toggle").onclick();
    ok(!app.querySelector(".mf-row"), "tekrar basınca kapanır");
  } finally { closeMyFoods(); }
});

test("kendi yiyeceklerim: düzenleme alanları dolu gelir, barkod ve ek alanlar kalır, geçersiz değer reddedilir", async () => {
  const { slot, past } = await myFoodsFixture();
  try {
    app.querySelector("#mf-toggle").onclick();
    app.querySelector(`[data-mf-edit="${NUTELLA}"]`).onclick();
    eq(app.querySelector(`[data-mf-edit="${NUTELLA}"]`).getAttribute("aria-expanded"), "true");
    eq(app.querySelector("#cf-n").value, "Nutella");
    eq(["cf-p", "cf-c", "cf-f", "cf-l"].map(id => +app.querySelector("#" + id).value), [6.3, 57.5, 30.9, 0]);
    ok(app.querySelector("#mf-edit").textContent.includes("3017620422003"), "barkod başlıkta görünür");
    ok(!app.querySelector("#mf-edit input[id*='bc'], #mf-edit [id*='bc-num']"), "barkod alanı düzenlenemez");
    eq(app.querySelectorAll("#cf-n").length, 1);
    eq(a11yBad("düzenleme"), []);

    /* geçersiz: ad boş, değer 100'ü aşıyor, barkodlu üründe değer boş */
    const before = JSON.stringify(state.customFoods);
    const errNow = () => app.querySelector("#cf-err").textContent;
    app.querySelector("#cf-n").value = "";
    await app.querySelector("#cf-save").onclick();
    ok(errNow().length > 0, "ad zorunlu");
    app.querySelector("#cf-err").textContent = "";
    app.querySelector("#cf-n").value = "Nutella";
    app.querySelector("#cf-p").value = "101";
    await app.querySelector("#cf-save").onclick();
    ok(errNow().length > 0, "100'ü aşan değer");
    app.querySelector("#cf-err").textContent = "";
    app.querySelector("#cf-p").value = "";
    await app.querySelector("#cf-save").onclick();
    ok(errNow().length > 0, "barkodlu üründe boş değer");
    eq(JSON.stringify(state.customFoods), before, "geçersiz kayıt hiçbir şeyi değiştirmemeli");

    /* vazgeç */
    app.querySelector("#cf-cancel").onclick();
    ok(!app.querySelector("#mf-edit"), "vazgeçince form kapanır");
    eq(JSON.stringify(state.customFoods), before);

    /* kaydet: yalnızca ad ve değerler değişir; anahtar, barkod, marka, porsiyon, kaynak kalır */
    const pastBefore = JSON.stringify(state.days[past]);
    app.querySelector(`[data-mf-edit="${NUTELLA}"]`).onclick();
    app.querySelector("#cf-n").value = "Fındık kreması";
    app.querySelector("#cf-p").value = "7"; app.querySelector("#cf-p").oninput();
    ok(app.querySelector("#cf-kcal").textContent.includes("536"), "canlı kalori: " + app.querySelector("#cf-kcal").textContent);
    app.querySelector("#cf-l").value = "2";
    await app.querySelector("#cf-save").onclick();
    eq(Object.keys(state.customFoods).sort(), [NUTELLA, "cf_1"], "kopya oluşmamalı");
    eq(state.customFoods[NUTELLA], { n: "Fındık kreması", p: 7, c: 57.5, f: 30.9, lif: 2, i: "grain", bc: "3017620422003",
      a: "3017620422003 Ferrero", br: "Ferrero", src: "off", por: [{ n: "porsiyon", g: 15 }] });
    ok(!app.querySelector("#mf-edit") && myFoodEdit === null, "kayıttan sonra form kapanır");
    eq(logPick, null, "düzenleme besin ekleme akışını başlatmamalı");
    ok(app.querySelector(".mf-row").textContent.length > 0 && app.innerHTML.includes("Fındık kreması"), "liste güncellenir");
    eq(foodByBarcode("3017620422003")[0], NUTELLA, "barkodla hâlâ bulunur");
    eq(searchFoods("3017620422003", 8)[0][0], NUTELLA);
    eq(searchFoods("fındık kreması", 8)[0][0], NUTELLA);
    eq(JSON.stringify(state.days[past]), pastBefore, "geçmiş gün kaydı düzenlemeden etkilenmemeli");
    const lastPast = state.days[past].log.find(it => it.k === NUTELLA);
    eq([lastPast.n, lastPast.p], ["Nutella", 6.3], "eski kalem eklendiği andaki değerlerini korur");
    addFoodDirect(state.days[today()], NUTELLA, 30, slot);
    const added = state.days[today()].log.at(-1);
    eq([added.n, added.p, added.lif], ["Fındık kreması", 7, 2], "yeni kalem yeni değerleri alır");

    /* barkodsuz yiyecek: ad ve değerler değişir, barkod alanı eklenmez */
    app.querySelector('[data-mf-edit="cf_1"]').onclick();
    eq(app.querySelector("#cf-n").value, "Annemin mercimek köftesi");
    ok(!app.querySelector("#mf-edit").textContent.includes("Barkod"), "barkodsuzda barkod başlığı yok");
    app.querySelector("#cf-n").value = "Mercimek köftesi";
    app.querySelector("#cf-c").value = "3";
    await app.querySelector("#cf-save").onclick();
    eq(state.customFoods.cf_1, { n: "Mercimek köftesi", p: 8, c: 3, f: 5, lif: 4, i: "grain" }, "1 g lif farkı kabul edilir, yeni alan eklenmez");
  } finally { closeMyFoods(); }
});

test("kendi yiyeceklerim: başka form açılınca düzenleme formu kapanır, kimlikler çakışmaz", async () => {
  await myFoodsFixture();
  try {
    await withBarcode(async () => {
      render();
      app.querySelector("#mf-toggle").onclick();
      app.querySelector('[data-mf-edit="cf_1"]').onclick();
      ok(app.querySelector("#mf-edit #cf-card"));
      app.querySelector("#custom-toggle").onclick();
      ok(!app.querySelector("#mf-edit") && myFoodEdit === null, "elle tanımlama düzenlemeyi kapatır");
      eq(app.querySelectorAll("#cf-card").length, 1);
      eq(a11yBad("elle tanımlama"), []);
      app.querySelector('[data-mf-edit="cf_1"]').onclick();
      eq(app.querySelectorAll("#cf-card").length, 1, "düzenleme açılınca eski form silinir");
      bcShow(customFoodForm({ n: "Su", bc: "96385074" }));
      ok(!app.querySelector("#mf-edit"), "barkod önizlemesi düzenlemeyi kapatır");
      eq(a11yBad("barkod önizleme"), []);
    });
  } finally { closeMyFoods(); }
});

test("kendi yiyeceklerim: silme onay ister; vazgeçilirse kalır", async () => {
  await myFoodsFixture();
  try {
    app.querySelector("#mf-toggle").onclick();
    const sheetTitle = () => [...document.querySelectorAll(".sheet-bg")].pop().textContent;
    const btn = app.querySelector('[data-mf-del="cf_1"]');
    const done = btn.onclick();
    ok(sheetTitle().includes("Annemin mercimek köftesi"), "onay sayfası yiyeceğin adını anar");
    ok(state.customFoods.cf_1, "onaydan önce silinmemeli");
    [...document.querySelectorAll(".sheet-bg")].pop().querySelector("#ask-no").click();
    await done;
    document.querySelectorAll(".sheet-bg").forEach(e => e.remove());
    ok(state.customFoods.cf_1 && app.querySelector('[data-mf-del="cf_1"]'), "vazgeçilince kalır");
    await clickYes(app.querySelector('[data-mf-del="cf_1"]'), true);
    ok(!state.customFoods.cf_1 && !app.querySelector('[data-mf-del="cf_1"]'), "onaylanınca silinir");
    eq(Object.keys(state.customFoods), [NUTELLA]);
  } finally { closeMyFoods(); }
});

test("kendi yiyeceklerim: silinen yiyeceğin geçmiş günlerdeki kayıtları bozulmaz", async () => {
  const { slot, past } = await myFoodsFixture();
  try {
    mealPrefs().exclude.push("cf_1");
    mealPrefs().fixed[slot] = [{ k: "cf_1", g: 100 }, { k: "yulaf", g: 50 }];
    state.shopping = { days: 1, recipes: [], checked: { cf_1: true, yulaf: true } };
    state.savedMeals = [{ id: "s1", name: "Köfteli", items: [{ k: "cf_1", n: "Annemin mercimek köftesi", g: 100, p: 8, c: 20, f: 5, lif: 4, v: [], i: "grain" }] }];
    const pastBefore = JSON.stringify(state.days[past]), todayBefore = JSON.stringify(state.days[today()]);
    const totBefore = logTotals(state.days[past]);
    const kcalBefore = state.days[past].kcal;
    ok(!favoriteFoods().some(([k]) => k === "cf_1"), "hariç tutulan ürün sık yediklerde görünmez");

    app.querySelector("#mf-toggle").onclick();
    await clickYes(app.querySelector('[data-mf-del="cf_1"]'), true);
    ok(!state.customFoods.cf_1 && !foodOf("cf_1"), "yiyecek silindi");

    /* günlük kayıtları kendi değerlerini taşır: toplamlar ve satırlar aynı kalır */
    eq(JSON.stringify(state.days[past]), pastBefore, "geçmiş gün dokunulmadan kalmalı");
    eq(JSON.stringify(state.days[today()]), todayBefore, "bugünün kaydı dokunulmadan kalmalı");
    eq(logTotals(state.days[past]), totBefore);
    eq(state.days[past].kcal, kcalBefore);
    eq(totBefore.kcal, 395, "150 g mercimek köftesi + 30 g Nutella");
    viewDate = past; tab = "meals"; mealTab = "log"; addOpen = null; render();
    ok(app.innerHTML.includes("Annemin mercimek köftesi") && app.innerHTML.includes("Nutella"), "geçmiş günde satırlar görünür");
    ok(app.querySelector(".moon-kcal .mn-t i").textContent.startsWith(`${fmtN(kcalBefore)} / `), "günün kalorisi kartta görünür");
    const line = [...app.querySelectorAll(".log-line")].find(l => l.textContent.includes("Annemin"));
    ok(line && line.textContent.includes("150 g") && line.textContent.includes("236"), "silinen yiyeceğin satırı gramla ve kaloriyle durur: " + (line && line.textContent));
    editLog = "101"; render();
    ok(app.querySelector("#le-amt") && +app.querySelector("#le-amt").value === 150, "silinen yiyeceğin kalemi hâlâ düzenlenebilir");
    editLog = null;
    eq(a11yBad("geçmiş gün"), []);

    /* bağlı olduğu yerlerden temizlenir, çizim hata vermez */
    ok(!favoriteFoods().some(([k]) => k === "cf_1"), "sık yediklerden düşer");
    ok(!mealPrefs().exclude.includes("cf_1"), "öneri dışlamalarından düşer");
    eq(mealPrefs().fixed[slot], [{ k: "yulaf", g: 50 }], "sabit öğünlerden düşer");
    eq(state.shopping.checked, { yulaf: true });
    eq(state.savedMeals[0].items[0].n, "Annemin mercimek köftesi", "kayıtlı öğün kendi değerlerini taşır");
    eq(itemsKcal(state.savedMeals[0].items), 157);
    viewDate = null; mealTab = "log"; render();
    mealTab = "list"; render();
    mealTab = "log"; render();
    ok(app.querySelector(".seg"), "ekranlar çizilir");
  } finally { closeMyFoods(); }
});

test("kendi yiyeceklerim: son yiyecek silinince liste ve düğme kalkar; barkod yeniden okutulunca kayıt yeniden oluşur", async () => {
  const { past } = await myFoodsFixture();
  try {
    app.querySelector("#mf-toggle").onclick();
    await clickYes(app.querySelector('[data-mf-del="cf_1"]'), true);
    await clickYes(app.querySelector(`[data-mf-del="${NUTELLA}"]`), true);
    eq(state.customFoods, undefined, "boşalınca alan kalkar");
    ok(!app.querySelector("#mf-toggle") && !app.querySelector(".mf-row") && myFoodsOpen === false, "düğme ve liste kalkar");
    eq(foodByBarcode("3017620422003"), null, "barkod artık cihazda yok");
    ok(state.days[past].log.length === 2 && state.days[past].log[1].n === "Nutella", "geçmiş kayıtlar yerinde");
    ok(!favoriteFoods().some(([k]) => k === "cf_1" || k === NUTELLA), "silinenler sık yediklerde çıkmaz");
    saveBarcodeFood("3017620422003", { n: "Nutella", p: 6.3, c: 57.5, f: 30.9, lif: 0, br: "Ferrero" });
    eq(foodByBarcode("3017620422003")[0], NUTELLA, "aynı barkod aynı anahtarla yeniden kaydedilir");
    ok(favoriteFoods().some(([k]) => k === NUTELLA), "geçmiş kalem aynı anahtara yeniden bağlanır");
    eq(deleteCustomFood("yok"), false, "olmayan anahtar sessizce geçilir");
  } finally { closeMyFoods(); }
});

test("kendi yiyeceklerim: İngilizcede de çalışır ve sözlükte olmayan metin kalmaz", async () => {
  await myFoodsFixture();
  try {
    await withLang("en", async () => {
      I18N_MISSING.clear();
      render();
      app.querySelector("#mf-toggle").onclick();
      ok(app.querySelector("#mf-toggle").textContent.trim() === "My foods", "düğme İngilizce");
      ok(app.querySelector(".bc-mark").getAttribute("aria-label") === "Barcode product");
      app.querySelector(`[data-mf-edit="${NUTELLA}"]`).onclick();
      ok(app.querySelector("#mf-edit").textContent.includes("Barcode 3017620422003"));
      eq(a11yBad("edit en"), []);
      app.querySelector("#cf-cancel").onclick();
      const done = app.querySelector('[data-mf-del="cf_1"]').onclick();
      const sheet = [...document.querySelectorAll(".sheet-bg")].pop();
      ok(sheet.textContent.includes("Delete “Annemin mercimek köftesi”?") && sheet.querySelector("#ask-ok").textContent === "Delete", "onay sayfası İngilizce: " + sheet.textContent);
      sheet.querySelector("#ask-no").click(); await done;
      document.querySelectorAll(".sheet-bg").forEach(e => e.remove());
      eq([...I18N_MISSING], [], "İngilizce karşılığı olmayan metinler");
    });
  } finally { closeMyFoods(); }
});

/* ---- kolay besin ekleme ---- */
const clearToasts = () => document.querySelectorAll(".toast").forEach(x => x.remove());
const logItem = (k, g, slot, id) => { const f = FOODS[k]; return { id, k, n: f.n, g, p: f.p, c: f.c, f: f.f, lif: f.lif || 0, v: f.v || [], i: f.i, slot }; };
/* Geçmiş: yulaf 3 kez (ilk öğünde), muz ve yumurta (ikinci öğünde) birer kez; dünün ilk öğünü yulaf + muz. */
const quickFixture = async () => {
  await openAddPanel();
  const [s0, s1] = slotList().map(x => x[0]);
  const hist = [[3, [logItem("yulaf", 40, s0, 5)]],
    [2, [logItem("yulaf", 40, s0, 3), logItem("yumurta", 100, s1, 4)]],
    [1, [logItem("yulaf", 80, s0, 1), logItem("muz", 120, s0, 2)]]];
  for (const [back, items] of hist){
    const d = shiftDays(today(), -back);
    state.days[d] = { tasks: [], seeded: true, log: items }; syncKcal(state.days[d]);
  }
  delete state.days[today()].log;
  render();
  return { s0, s1 };
};
const closeQuick = () => { clearToasts(); viewDate = null; editLog = null; mealTab = "log"; closeAddPanel(); };
const undoToast = async () => {
  const t = document.querySelector(".toast.act");
  ok(t && t.querySelector("button"), "Geri al düğmesi olan toast yok");
  await t.querySelector("button").onclick();
};

test("arama: Türkçe karakter ve büyük/küçük harf fark etmez; ad ve takma adda bulur", async () => {
  state = await loadFixture(); state.customFoods = {
    cf_x: { n: "Annemin mercimek köftesi", a: "ev yapımı", p: 8, c: 20, f: 5, lif: 4, i: "grain" } };
  try {
    const keys = q => searchFoods(q, 30).map(([k]) => k);
    ok(keys("yogurt").includes("yogurt"), "yogurt bulunamadı");
    eq(keys("YOĞURT"), keys("yogurt"), "büyük harf ve ğ");
    eq(keys("Yoğurt"), keys("yogurt"));
    eq(keys("TAVUK GÖĞSÜ")[0], "tavuk");
    eq(keys("SÜT")[0], keys("sut")[0], "süt/sut");
    ok(keys("PEYNİR").includes("beyazpeynir"), "İ harfi ve takma ad (peynir)");
    ok(keys("inek sutu").includes("sut"), "takma ad: inek sütü");
    ok(keys("ev yapimi").includes("cf_x") && keys("EV YAPIMI").includes("cf_x"), "kendi besininin takma adı");
    /* Eşit puanda kendi besinler kullanım sıklığından hemen sonra öne geçer:
       genel "kofte" sorgusunda bile ilk 30'da yerini alır. */
    ok(keys("kofte").includes("cf_x"), "kendi besinin adı");
  } finally { state = null; }
});

test("besin arama ipuçları öğün türüne göre değişir ve katalogda bulunur", async () => {
  const previous = { state, addOpen, logQuery, logPick };
  state = await loadFixture();
  try {
    mealPrefs().meals = [...DEFAULT_MEALS, ...MEAL_TIMES.map(time => ({
      ...time, id: `test_${time.key}`, name: time.label
    }))];
    const cases = [
      [["kahvalti", "test_sabah"], "haşlanmış yumurta, beyaz peynir, yeşil zeytin", ["haslanmisyumurta", "beyazpeynir", "yesilzeytin"]],
      [["ogle", "test_oglen"], "mercimek çorbası, tavuk göğsü, pirinç pilavı", ["mercimekcorba", "tavuk", "pilav"]],
      [["aksam", "test_aksam"], "somon, bulgur pilavı, çoban salata", ["somon", "bulgurpilav", "cobansalata"]],
      [["ara", "test_ikindi", "test_gece"], "elma, yoğurt, badem", ["elma", "yogurt", "badem"]],
      [["bilinmeyen"], "muz, yulaf, domates", ["muz", "yulaf", "domates"]]
    ];
    const panel = document.createElement("div");
    const placeholders = new Set();
    logQuery = ""; logPick = null;
    for (const [slots, examples, foodKeys] of cases){
      for (const slot of slots){
        addOpen = slot;
        panel.innerHTML = addPanel();
        const input = panel.querySelector("#food-q");
        eq(input.placeholder, `Ara: ${examples}…`, slot);
        eq(input.getAttribute("aria-label"), "Besin ara", slot);
        placeholders.add(input.placeholder);
      }
      examples.split(", ").forEach((query, i) => {
        const key = foodKeys[i];
        ok(FOODS[key] && !FOODS[key].cigYenmez, query);
        ok(searchFoods(query, 12).some(([k]) => k === key), `${query} → ${key}`);
      });
    }
    eq(placeholders.size, cases.length);
  } finally { ({ state, addOpen, logQuery, logPick } = previous); }
});

test("besin seçimi: çiğ yenmeyen katalog kayıtları süzülür, kişisel besinler ve günlük korunur", async () => {
  const previous = state;
  state = await loadFixture();
  try {
    state.customFoods = { cf_firik: { ...FOODS.firikkuru } };
    const entry = { log: [] };
    const slot = userMeals()[0].id;
    state.days = { "2026-11-19": entry };
    addFoodDirect(entry, "firikkuru", 60, slot);
    addFoodDirect(entry, "cf_firik", 60, slot);
    mealPrefs().fixed[slot] = [{ k: "firikkuru", g: 60 }, { k: "cf_firik", g: 60 }];
    for (const k of ["tavuk","yumurta","hindi","somon","palamut","mangokuru","kurukayisi","kuruuzum"])
      ok(searchFoods(FOODS[k].n, 30).some(([key]) => key === k), FOODS[k].n + " görünmeli");
    eq(searchFoods("Firik (kuru)", 30).map(([k]) => k), ["cf_firik"]);
    for (const rows of [favoriteFoods(), quickFoods(slot)]) eq(rows.map(([k]) => k), ["cf_firik"]);
    eq(entry.log.map(it => it.k), ["firikkuru","cf_firik"]);
    const menu = buildMeals(buildProgram(state.profile, 82, 0), 0);
    const keys = menu.meals.flatMap(m => m.items.map(it => it.key));
    ok(keys.includes("cf_firik"), "sabit kişisel besin korunmalı");
    eq(keys.filter(k => FOODS[k]?.cigYenmez), []);
  } finally { state = previous; }
});

test("arama: küçük yazım hatalarına tolerans; doğru yazımın sırası bozulmaz, kısa ya da saçma sorgu eşleşmez", async () => {
  state = await loadFixture(); state.customFoods = {
    cf_x: { n: "Annemin mercimek köftesi", a: "ev yapımı", p: 8, c: 20, f: 5, lif: 4, i: "grain" } };
  try {
    const keys = q => searchFoods(q, 30).map(([k]) => k);
    ok(keys("peynr").includes("beyazpeynir"), "eksik harf");
    ok(keys("yogrt").includes("yogurt"), "eksik harf (yoğurt)");
    ok(keys("tavk").includes("tavuk"), "yarım ve eksik yazım");
    ok(keys("elam").includes("elma"), "yer değiştirmiş harf");
    ok(keys("peynirr").includes("beyazpeynir"), "fazla harf");
    ok(keys("mrcimek").includes("cf_x") && keys("mecrimek").includes("cf_x"), "kendi besinin adında");
    ok(keys("inke sutu").includes("sut"), "takma adda yer değiştirmiş harf");
    ok(keys("ev yapmi").includes("cf_x"), "çok sözcüklü: biri tam, biri hatalı");
    ok(!keys("tavuk").some(k => k === "cf_x"), "doğru yazımda hata payı devreye girmez");
    eq(keys("qzxwv"), [], "alakasız sorgu");
    ok(!nearWord("elm", "elma") && !nearWord("sut", "su") && nearWord("emla", "elma"), "dört harften kısa sözcükte hata payı yok");
    eq(keys("1234"), [], "rakamlar için hata payı yok");
    eq(editDist("yogurt", "yogrt"), 1); eq(editDist("elma", "emla"), 1); eq(editDist("abc", "xyz"), 3);
  } finally { state = null; }
});

test("kolay ekleme: sık yediklerin panelin başında öğüne göre sıralanır; tek dokunuşla son miktarla eklenir, panel açık kalır, Geri al geri alır", async () => {
  const { s0 } = await quickFixture();
  try {
    const chips = [...app.querySelectorAll(".pick .fav [data-qadd]")];
    eq(chips.map(b => b.dataset.qadd), ["yulaf", "muz", "yumurta"], "bu öğünde en çok yenen önce");
    eq(chips[0].dataset.qg, "80", "son yenen miktar");
    ok(chips[0].textContent.includes("Yulaf ezmesi") && chips[0].textContent.includes("2 porsiyon"), chips[0].textContent);
    eq(app.querySelector(".pick").firstElementChild.textContent.trim(), "Sık yediklerin", "panelin en üstünde");
    ok(!app.querySelector("[data-fav]"), "panel açıkken aynı liste ikinci kez çizilmez");
    const before = JSON.stringify(state.days[today()]);
    await chips[0].onclick();
    const e = state.days[today()];
    eq(e.log.map(x => [x.k, x.g, x.slot]), [["yulaf", 80, s0]], "açık panelin öğününe yazılır");
    eq(e.kcal, foodKcal(FOODS.yulaf, 80), "günün kalorisi güncellenir");
    eq(addOpen, s0, "panel açık kalır"); ok(app.querySelector("#food-q"), "panel çizili");
    eq(app.querySelectorAll(".log-line").length, 1, "günlük satırı çizildi");
    const t = document.querySelector(".toast.act");
    ok(t && t.textContent.includes("Yulaf ezmesi eklendi") && t.textContent.includes(`${e.kcal} kcal`) && t.textContent.includes("Geri al"), t && t.textContent);
    ok(!t.hasAttribute("aria-hidden"), "düğmeli toast ekran okuyucudan gizlenmez");
    await new Promise(r => setTimeout(r, 120));
    ok(document.getElementById("sr-live").textContent.includes("Yulaf ezmesi eklendi"), "ekran okuyucuya bildirilir");
    await undoToast();
    eq(JSON.stringify(state.days[today()]), before, "geri alma günü eski haline getirir");
    eq(app.querySelectorAll(".log-line").length, 0);
    eq(addOpen, s0, "geri alınca da panel açık");
    ok(!document.querySelector(".toast.act") && document.querySelector(".toast").textContent === "Geri alındı.");
  } finally { closeQuick(); }
});

test("kolay ekleme: geri alma kalori durumunu, öncesinde yazılı olanları ve başka kalemleri korur", async () => {
  const { s0 } = await quickFixture();
  try {
    state.days[today()].kcal = 300;
    await app.querySelector('[data-qadd="muz"]').onclick();
    eq(state.days[today()].log.length, 1);
    ok(state.days[today()].kcal !== 300);
    await undoToast();
    eq([state.days[today()].kcal, state.days[today()].log], [300, undefined], "boş güne geri dönünce yazılı kalori geri gelir");
    await app.querySelector('[data-qadd="muz"]').onclick();
    await app.querySelector('[data-qadd="yulaf"]').onclick();
    eq(state.days[today()].log.map(x => x.k), ["muz", "yulaf"]);
    await undoToast();
    eq(state.days[today()].log.map(x => x.k), ["muz"], "yalnızca son eklenen geri alınır");
    eq(state.days[today()].kcal, foodKcal(FOODS.muz, 120), "kalori kalan kalemlerden hesaplanır");
    ok(await undoLogAdd(today(), [999], logSnap(state.days[today()])) === false, "olmayan kalem sessizce geçilir");
  } finally { closeQuick(); }
});

test("kolay ekleme: çift dokunuş iki kalem eklemez", async () => {
  const { s0 } = await quickFixture();
  try {
    const b = app.querySelector('[data-qadd="yulaf"]');
    await Promise.all([b.onclick(), b.onclick()]);
    eq(state.days[today()].log.length, 1);
  } finally { closeQuick(); }
});

test("kolay ekleme: arama sonucunda + varsayılan porsiyonla ekler; satır miktarı ve kaloriyi yazar; arama temizlenir, panel açık kalır", async () => {
  await openAddPanel();
  try {
    eq([defaultGrams("yumurta"), defaultGrams("yulaf"), defaultGrams("elma"), defaultGrams("ekmek")], [50, 40, 180, 30], "1 adet / 1 porsiyon");
    logQuery = "yumurta"; render();
    const plus = app.querySelector('#food-results [data-qadd="yumurta"]');
    ok(plus && plus.dataset.qg === "50", "+ düğmesi");
    const item = plus.closest(".item");
    ok(item.textContent.includes("1 adet (50 g)") && item.textContent.includes(`${foodKcal(FOODS.yumurta, 50)} kcal`), item.textContent);
    ok(plus.getAttribute("aria-label").startsWith("Yumurta, 1 adet") && plus.getAttribute("aria-label").endsWith("Ekle"), plus.getAttribute("aria-label"));
    ok(item.querySelector("[data-food]"), "satıra dokunmak miktar kartını açar");
    await plus.onclick();
    eq(state.days[today()].log.map(x => [x.k, x.g]), [["yumurta", 50]]);
    eq([logQuery, logPick, addOpen === slotList()[0][0]], ["", null, true]);
    ok(!app.querySelector("#food-results [data-qadd]"), "sonuç listesi temizlendi");
    ok(document.querySelector(".toast.act"), "geri al toast'ı");
    /* ikinci kez: son yenen miktar sunulur */
    logQuery = "yumurta"; render();
    eq(app.querySelector('#food-results [data-qadd="yumurta"]').dataset.qg, "50");
    state.days[today()].log[0].g = 150;
    logQuery = "yumurta"; render();
    eq(app.querySelector('#food-results [data-qadd="yumurta"]').dataset.qg, "150", "en son kaydedilen miktar");
    ok(app.querySelector('#food-results [data-qadd="yumurta"]').closest(".item").textContent.includes("3 adet (150 g)"));
  } finally { closeQuick(); }
});

test("besin ekleme paneli: yalnız arama; sık yedikler, barkod, kayıtlı öğün ve Kendi yiyeceklerim kalır", async () => {
  await withBarcode(async () => {
    await openAddPanel();
    try {
      const custom = { cf_x:{ n:"Ev yapımı yoğurt", p:4, c:5, f:3, lif:0, i:"dairy" } };
      const saved = [{ id:"s1", name:"Sabah kahvaltısı", items:[{ k:"yulaf", n:FOODS.yulaf.n, g:40, p:FOODS.yulaf.p, c:FOODS.yulaf.c, f:FOODS.yulaf.f, lif:FOODS.yulaf.lif, v:[], i:"grain" }] }];
      state.customFoods = custom;
      state.savedMeals = saved;
      state.days[shiftDays(today(), -1)] = { tasks:[], seeded:true, log:[logItem("yulaf", 40, slotList()[0][0], 1)] };
      render();

      const panel = app.querySelector(".pick");
      ok(panel.querySelector("#food-q"), "arama alanı var");
      ok(!panel.querySelector("[data-cat]"), "kategori rozetleri kalmadı");
      for (const label of ["Sarküteri", "Kahvaltılık", "Spor & protein", "Ara öğün"])
        ok(!panel.textContent.includes(label), "kategori etiketi kalmadı: " + label);
      eq(panel.querySelector("#food-results").children.length, 0, "sorgu olmadan kategori önerisi yok");
      ok(panel.querySelector(".fav [data-qadd='yulaf']"), "sık yediklerin düğmeleri kaldı");
      ok(panel.querySelector("[data-saved-add='s1']"), "kayıtlı öğün düğmesi kaldı");
      ok(panel.querySelector("#bc-scan"), "barkod düğmesi kaldı");
      ok(panel.querySelector("#custom-toggle"), "kendi besin tanımlama düğmesi kaldı");
      ok(panel.querySelector("#mf-toggle"), "Kendi yiyeceklerim düğmesi kaldı");

      eq(state.customFoods, custom, "kendi yiyecek verisi silinmedi");
      eq(state.savedMeals, saved, "kayıtlı öğün verisi silinmedi");
      ok(state.days[shiftDays(today(), -1)].log.length === 1, "geçmiş kullanım verisi silinmedi");

      logQuery = "yogurt"; render();
      ok(app.querySelector("#food-results [data-qadd='yogurt']"), "arama sonuçları çalışıyor");
    } finally { closeQuick(); }
  });
});

test("kolay ekleme: miktar kartı varsayılan porsiyonla açılır; +/− ve hazır düğmeler miktarı ve kaloriyi günceller; Ekle toast'la geri alınır", async () => {
  await openAddPanel();
  try {
    logPick = "yulaf"; render();
    const amt = () => app.querySelector("#pick-amt");
    const kcal = () => app.querySelector("#pick-kcal").textContent;
    eq(amt().value, "40", "1 porsiyonla başlar");
    eq(kcal(), `${foodKcal(FOODS.yulaf, 40)} kcal`);
    eq([...app.querySelectorAll("[data-amt].sel")].map(b => b.textContent), ["1 porsiyon"], "seçili hazır düğme");
    eq(app.querySelectorAll("[data-pick-step]").length, 2);
    app.querySelector('[data-pick-step="1"]').onclick();
    eq(amt().value, "45"); eq(kcal(), `${foodKcal(FOODS.yulaf, 45)} kcal`);
    ok(!app.querySelector("[data-amt].sel"), "hazır olmayan miktarda seçili düğme yok");
    app.querySelector('[data-pick-step="-1"]').onclick(); app.querySelector('[data-pick-step="-1"]').onclick();
    eq(amt().value, "35");
    app.querySelector("[data-amt='80']").onclick();
    eq(amt().value, "80"); eq(kcal(), `${foodKcal(FOODS.yulaf, 80)} kcal`);
    ok(app.querySelector("[data-amt='80']").classList.contains("sel"));
    amt().value = "abc"; amt().oninput && amt().oninput();
    eq(kcal(), "—");
    amt().value = "80"; amt().oninput();
    await app.querySelector("#pick-add").onclick();
    eq(state.days[today()].log.map(x => [x.k, x.g]), [["yulaf", 80]]);
    eq([logPick, logQuery], [null, ""]); ok(app.querySelector("#food-q"), "panel açık");
    await undoToast();
    eq(state.days[today()].log, undefined);
    /* birimli besin: giriş birim cinsinden */
    logPick = "yumurta"; render();
    eq(amt().value, "1"); eq(kcal(), `${foodKcal(FOODS.yumurta, 50)} kcal`);
    app.querySelector('[data-pick-step="1"]').onclick();
    eq(amt().value, "2"); eq(kcal(), `${foodKcal(FOODS.yumurta, 100)} kcal`);
    await app.querySelector("#pick-add").onclick();
    eq(state.days[today()].log.map(x => [x.k, x.g]), [["yumurta", 100]]);
    /* sonraki sefer son miktarla açılır */
    logPick = "yumurta"; render();
    eq(amt().value, "2", "son yenen miktar");
  } finally { closeQuick(); }
});

test("kolay ekleme: dünkü öğünü ve dünün tamamını kopyalamak toast'tan geri alınır; sık yedikler tek dokunuşla eklenir", async () => {
  const { s0 } = await quickFixture();
  try {
    addOpen = null; render();
    const btn = app.querySelector(`[data-copymeal="${s0}"]`);
    ok(btn, "boş öğünde dünkü öğünü kopyala düğmesi");
    await btn.onclick();
    eq(state.days[today()].log.map(x => x.k), ["yulaf", "muz"]);
    ok(document.querySelector(".toast.act").textContent.includes("2 kalem kopyalandı."));
    const ids = state.days[today()].log.map(x => String(x.id));
    ok(!state.days[shiftDays(today(), -1)].log.some(x => ids.includes(String(x.id))), "kopyalar yeni kimlik alır");
    await undoToast();
    eq(state.days[today()].log, undefined, "kopya geri alındı");
    eq(state.days[shiftDays(today(), -1)].log.length, 2, "dünkü gün dokunulmadan kalır");

    await app.querySelector("#copy-y").onclick();
    eq(state.days[today()].log.length, 2);
    await undoToast();
    eq(state.days[today()].log, undefined);

    /* sayfanın başındaki sık yedikler: toast'lı ve geri alınır */
    const fav = app.querySelector('[data-fav="yulaf"]');
    ok(fav && fav.textContent.includes("2 porsiyon"), "sık yediklerde miktar");
    await fav.onclick();
    eq(state.days[today()].log.map(x => [x.k, x.g, x.slot]), [["yulaf", 80, s0]]);
    await undoToast();
    eq(state.days[today()].log, undefined);
  } finally { closeQuick(); }
});

test("kolay ekleme: kayıtlı öğün eklenince panel açık kalır ve geri alınır", async () => {
  const { s0, s1 } = await quickFixture();
  try {
    addOpen = s1;
    state.savedMeals = [{ id: "s1", name: "Kahvaltım", items: [{ k: "yulaf", n: FOODS.yulaf.n, g: 40, p: 13, c: 60, f: 7, lif: 10, v: [], i: "grain" }] }];
    render();
    await app.querySelector('[data-saved-add="s1"]').onclick();
    eq(state.days[today()].log.map(x => [x.k, x.slot]), [["yulaf", s1]], "açık panelin öğününe");
    eq(addOpen, s1, "panel açık kalır");
    await undoToast();
    eq(state.days[today()].log, undefined);
  } finally { closeQuick(); }
});

test("kolay ekleme: panel açılırken sık yediklerin yoksa arama kutusu odaklanır, varsa odaklanmaz", async () => {
  await openAddPanel();
  app.style.display = "block";           /* odak için öğe görünür olmalı */
  try {
    addOpen = null; render();
    app.querySelector(`[data-addfood="${slotList()[0][0]}"]`).onclick();
    eq(document.activeElement && document.activeElement.id, "food-q", "geçmiş yokken arama kutusu odakta");
    document.activeElement.blur();
    state.days[shiftDays(today(), -1)] = { tasks: [], seeded: true, log: [logItem("yulaf", 40, slotList()[0][0], 1)] };
    addOpen = null; render();
    app.querySelector(`[data-addfood="${slotList()[0][0]}"]`).onclick();
    ok(document.activeElement && document.activeElement.id !== "food-q", "sık yedikler varken klavye açılmaz");
    ok(app.querySelector('.pick [data-qadd="yulaf"]'));
  } finally { app.style.display = ""; closeQuick(); }
});

test("kolay ekleme: erişilebilirlik (etiketler, adlı düğmeler, toast'ta düğme) ve İngilizce", async () => {
  const { s0 } = await quickFixture();
  try {
    logQuery = "yogrt"; render();
    ok(app.querySelector("#food-results [data-qadd='yogurt']"), "yazım hatalı arama sonuç verir");
    for (const b of app.querySelectorAll("[data-qadd]")) ok((b.getAttribute("aria-label") || b.textContent).trim().length > 3, "adsız ekle düğmesi");
    logPick = "yulaf"; render();
    eq(a11yBad("kolay ekleme"), []);
    for (const b of app.querySelectorAll("[data-pick-step]")) ok(b.getAttribute("aria-label"), "adımlama düğmesi etiketli");
    logPick = null; logQuery = ""; render();
    await withLang("en", async () => {
      I18N_MISSING.clear();
      render();
      eq(app.querySelector(".pick").firstElementChild.textContent.trim(), "Your frequent foods");
      logQuery = "yogrt"; render();
      ok(app.querySelector("#food-results [data-qadd='yogurt']").getAttribute("aria-label").endsWith("Add"));
      logPick = "yulaf"; render();
      ok(app.querySelector('[data-pick-step="1"]').getAttribute("aria-label") === "Increase");
      logPick = null; logQuery = ""; render();
      await app.querySelector('[data-qadd="yulaf"]').onclick();
      const t = document.querySelector(".toast.act");
      ok(t.textContent.includes("added") && t.textContent.includes("Undo") && t.textContent.includes("kcal"), t.textContent);
      await undoToast();
      ok(document.querySelector(".toast").textContent === "Undone.");
      addOpen = null; render();
      await app.querySelector(`[data-copymeal="${s0}"]`).onclick();
      ok(document.querySelector(".toast.act").textContent.includes("items copied."));
      await undoToast();
      eq([...I18N_MISSING], [], "İngilizce karşılığı olmayan metinler");
    });
  } finally { closeQuick(); }
});

test("kolay ekleme: yenilik maddesi, sürüm ve İngilizcesi", () => {
  eq(APP_VERSION, "1.17.0");
  for (const v of ["1.9.1", "1.10.0", "1.11.0", "1.12.0", "1.14.0"]) {
    const n = WHATS_NEW.find(x => x.v === v);
    ok(n && !n.native && n.items.length === 1, v + " için web'de görünen kısa madde");
    ok(STARBOARD_EN[n.items[0]], v + " maddesinin İngilizcesi");
  }
  for (const v of ["1.13.0", "1.14.0", "1.15.0", "1.16.0", "1.17.0"]) for (const n of WHATS_NEW.filter(x => x.v === v)) for (const it of n.items) ok(STARBOARD_EN[it] && STARBOARD_EN[it] !== it, v + " maddesinin İngilizcesi: " + it);
});

/* ---- sade beslenme ekranı ---- */
const sugFixture = async () => {
  state = await loadFixture(); migrateMeals(); notice = null; viewDate = null; ensureToday();
  delete state.days[today()].log; mealVariant = 0; addOpen = null; logQuery = ""; logPick = null;
  tab = "meals"; mealTab = "log"; render();
  const program = currentProgram();
  const plan = () => buildMeals(program, planDay() + mealVariant);
  const slots = slotList().map(x => x[0]);
  const keyed = m => m.items.filter(i => i.key && i.g);
  return { program, plan, slots, keyed };
};
const closeSug = () => {
  clearToasts(); document.querySelectorAll(".sheet-bg").forEach(e => e.remove());
  resetMealUI(); recipeQuery = ""; recipeOpen = null;
  viewDate = null; mealVariant = 0; addOpen = null; editLog = null; mealTab = "log"; tab = "today"; state = null;
};
const sectionOf = slot => {
  const b = app.querySelector(`[data-addfood="${slot}"]`);
  return b && b.closest("section");
};
const suggestionToggle = slot => app.querySelector(`[data-sug-toggle="${slot}"]`);
const showSuggestions = () => {
  for (const [slot] of slotList()){
    const toggle = suggestionToggle(slot);
    if (toggle?.getAttribute("aria-expanded") === "false") toggle.click();
  }
};

test("sade beslenme: sekmeler Bugün · Tarifler · Liste; Günlüğüm ve Öneriler sekmesi yok; eski plan sekmesi Bugün'e düşer", async () => {
  await sugFixture();
  try {
    const tabs = () => [...app.querySelectorAll("[data-meal-tab]")];
    eq(tabs().map(b => [b.dataset.mealTab, b.textContent.trim()]), [["log", "Bugün"], ["recipes", "Tarifler"], ["list", "Liste"]]);
    eq(tabs().filter(b => b.getAttribute("aria-current") === "true").map(b => b.dataset.mealTab), ["log"]);
    mealTab = "plan"; render();
    eq(tabs().filter(b => b.getAttribute("aria-current") === "true").map(b => b.dataset.mealTab), ["log"], "bilinmeyen sekme Bugün olur");
    ok(app.querySelector("[data-addfood]"), "Bugün ekranı çizilir");
    ok(!app.querySelector("#reroll") && !app.querySelector("[data-fixadd]"), "eski öneri ekranı kalmadı");
    mealTab = "recipes"; render();
    const search = app.querySelector("#rec-q"), results = app.querySelector("#rec-results");
    eq(search.closest("section").children.length, 1, "başlangıçta yalnızca arama");
    eq(results.children.length, 0, "boş sorguda sonuç yok");
    search.value = "mercimek"; search.dispatchEvent(new Event("input"));
    const match = results.querySelector("[data-recipe]");
    ok(match && !results.querySelector(".metric-note"), "eşleşmeler tarif sayısı olmadan gösterilir");
    match.click();
    ok(results.querySelector(".rec-body"), "tarif açılır");
    search.value = ""; search.dispatchEvent(new Event("input"));
    eq(results.children.length, 0, "arama temizlenince liste gizlenir");
    mealTab = "list"; render(); ok(app.querySelector('h2') && app.querySelector("h2").textContent.includes("Alışveriş listem") && app.querySelectorAll("[data-shop-tab]").length === 2, "sade liste");
  } finally { closeSug(); }
});

test("öneri: boş öğünde soluk tabak (besinler, toplam kcal, Ekle, Başka); günün planıyla aynı", async () => {
  const { plan, slots, keyed } = await sugFixture();
  try {
    const available = slots.filter(s => suggestionToggle(s));
    const [first, second] = available;
    ok(available.length >= 2 && !app.querySelector(".sug"), "öneriler başlangıçta kapalı");
    for (const s of available){
      const toggle = suggestionToggle(s), card = sectionOf(s);
      eq(card.querySelector(".fold-i button").dataset.addfood, s, "Besin ekle öğün içindeki ilk eylem");
      eq(toggle.getAttribute("aria-expanded"), "false");
      ok(document.getElementById(toggle.getAttribute("aria-controls")).hidden);
    }
    suggestionToggle(first).click();
    eq(suggestionToggle(first).getAttribute("aria-expanded"), "true");
    eq(document.activeElement, suggestionToggle(first));
    eq(suggestionToggle(second).getAttribute("aria-expanded"), "false");
    suggestionToggle(second).click();
    suggestionToggle(first).click();
    ok(!sectionOf(first).querySelector(".sug") && sectionOf(second).querySelector(".sug"), "öğünler bağımsız açılır ve kapanır");
    showSuggestions();
    const p = plan();
    let shown = 0;
    for (const s of slots) {
      const m = p.meals.find(x => x.slot === s), card = sectionOf(s), box = card.querySelector(".sug");
      if (!m || !m.items.length) { ok(!box, "öneri olmayan öğünde tabak çizilmez"); continue; }
      shown++;
      ok(box && box.getAttribute("role") === "group" && box.getAttribute("aria-label") === "Öneri", "tabak adlı grup");
      const k = keyed(m).reduce((a, i) => a + foodKcal(foodOf(i.key), i.g), 0);
      ok(box.querySelector(".sug-h").textContent.includes(`${k} kcal`), "toplam kcal: " + box.querySelector(".sug-h").textContent);
      for (const i of keyed(m)) ok(box.textContent.includes(foodOf(i.key).n), "besin adı: " + i.key);
      const add = box.querySelector(`[data-sug-add="${s}"]`), other = box.querySelector(`[data-sug-other="${s}"]`);
      ok(add && add.textContent === "Ekle" && other && other.textContent === "Başka", "Ekle ve Başka");
      ok(add.getAttribute("aria-label").endsWith("Ekle") && other.getAttribute("aria-label").endsWith("Başka"), "düğmeler öğünle adlı");
      ok(!card.querySelector(".empty"), "öneri varken boş öğün yazısı yok");
      ok(!box.querySelector(".log-line"), "öneri günlük satırı değildir");
    }
    ok(shown >= 2, "en az iki öğünde öneri var");
    eq(state.days[today()].log, undefined, "çizim günlüğe bir şey yazmaz");
    eq(a11yBad("öneri"), []);
  } finally { closeSug(); }
});

test("öneri: kayıt olan öğünde, besin ekle paneli açıkken ve geçmiş günde gösterilmez", async () => {
  const { slots } = await sugFixture();
  try {
    const [s0, s1] = slots;
    state.days[today()].log = [logItem("yulaf", 40, s0, 1)]; syncKcal(state.days[today()]); render();
    showSuggestions();
    ok(!sectionOf(s0).querySelector(".sug"), "dolu öğünde öneri yok");
    ok(sectionOf(s1).querySelector(".sug"), "boş öğünde öneri sürer");
    addOpen = s1; render();
    ok(!app.querySelector(`[data-sug-add="${s1}"]`) && app.querySelector("#food-q"), "panel açıkken tabak gizli");
    addOpen = null;
    state.days[today()].log = [logItem("yulaf", 40, "kayip_ogun", 2)]; render();
    ok(app.querySelectorAll(".sug").length >= 1, "öğünü bilinmeyen kayıt öneriyi saklamaz");
    const past = shiftDays(today(), -2);
    state.days[past] = { tasks: [], seeded: true }; viewDate = past; render();
    ok(!app.querySelector(".sug") && !app.querySelector("[data-sug-add]"), "geçmiş günde öneri yok");
    ok(!app.querySelector("#prefs-open"), "geçmiş günde Ayarla yok");
    ok(app.querySelectorAll("[data-addfood]").length === slots.length, "geçmiş günde besin ekle sürer");
  } finally { closeSug(); }
});

test("öneri: Ekle bütün tabağı tek dokunuşla öğüne yazar, kalori güncellenir, Geri al eski haline getirir; çift dokunuş iki kez eklemez", async () => {
  const { plan, slots, keyed } = await sugFixture();
  try {
    const s = slots.find(k => keyed(plan().meals.find(m => m.slot === k)).length >= 2) || slots[0];
    const items = keyed(plan().meals.find(m => m.slot === s));
    const before = JSON.stringify(state.days[today()]);
    suggestionToggle(s).click();
    const b = app.querySelector(`[data-sug-add="${s}"]`);
    await Promise.all([b.onclick(), b.onclick()]);
    const e = state.days[today()];
    eq(e.log.map(x => [x.k, x.g, x.slot]), items.map(i => [i.key, Math.round(i.g), s]), "tabaktaki her besin, doğru öğünde");
    eq(new Set(e.log.map(x => x.id)).size, e.log.length, "kimlikler ayrı");
    eq(e.kcal, logTotals(e).kcal, "günün kalorisi günlükten");
    ok(!sectionOf(s).querySelector(".sug") && sectionOf(s).querySelectorAll(".log-line").length === items.length, "öneri yerini günlük satırlarına bırakır");
    const t = document.querySelector(".toast.act");
    ok(t && t.textContent.includes("eklendi") && t.textContent.includes(`${e.kcal} kcal`) && t.textContent.includes("Geri al"), t && t.textContent);
    await undoToast();
    eq(JSON.stringify(state.days[today()]), before, "geri alma günü eski haline getirir");
    ok(sectionOf(s).querySelector(".sug"), "geri alınca öneri geri gelir");
    state.days[today()].kcal = 300; state.days[today()].kcalManual = true;
    const yes = app.querySelector(`[data-sug-add="${s}"]`).onclick();
    const sheet = [...document.querySelectorAll(".sheet-bg")].pop();
    ok(sheet && sheet.querySelector("#ask-ok"), "elle girilmiş kalori sorulur");
    sheet.querySelector("#ask-no").click(); await yes;
    eq(state.days[today()].log, undefined, "vazgeçilince eklenmez");
  } finally { closeSug(); }
});

test("öneri: Başka günün planını bir sonrakine geçirir; tarif bağlantısı çalışır", async () => {
  const { slots, keyed } = await sugFixture();
  try {
    showSuggestions();
    const text = () => [...app.querySelectorAll(".sug")].map(x => x.textContent).join("|");
    const t0 = text(), v0 = mealVariant;
    app.querySelector("[data-sug-other]").onclick();
    eq(mealVariant, v0 + 1, "mealVariant artar");
    ok(text() !== t0, "öneri değişir");
    /* tarifi olan bir besin çıkana kadar günleri çevir */
    let link = null;
    for (let v = 0; v < 40 && !link; v++) { mealVariant = v; render(); link = app.querySelector(".sug [data-recipefor]"); }
    ok(link, "önerilen tabakta tarif bağlantısı var");
    ok(link.textContent.trim().length > 2 && link.closest(".item").querySelector(".chev"), "bağlantı adlı ve işaretli");
    const key = link.dataset.recipefor, rec = recipeFor(key);
    link.onclick();
    eq(mealTab, "recipes", "bağlantı Tarifler'e götürür");
    eq(recipeQuery, rec.q);
    ok(app.querySelector("#rec-q"), "tarifler çizildi");
    recipeQuery = ""; recipeOpen = null;
  } finally { closeSug(); }
});

test("öneri: bir besini önerilerden çıkarma tabaktan çalışır ve Ayarlar sayfasındaki pencereden geri alınır", async () => {
  await sugFixture();
  try {
    showSuggestions();
    const x = app.querySelector(".sug [data-mex]");
    ok(x && x.getAttribute("aria-label").includes(","), "× düğmesi besin adıyla adlı");
    const key = x.dataset.mex;
    await x.onclick();
    ok(mealPrefs().exclude.includes(key), "dışlandı");
    ok(!app.querySelector(`.sug [data-mex="${key}"]`), "tabaktan çıktı");
    ok(!app.querySelector("#prefs-open"), "Bugün'de Ayarla düğmesi yok");
    tab = "settings"; meTab = "set"; render();
    app.querySelector("#s-meal-prefs").onclick();
    const sheet = [...document.querySelectorAll(".sheet-bg")].pop();
    const chip = sheet.querySelector(`[data-munex="${key}"]`);
    ok(chip && chip.textContent.includes("geri al"), "pencerede geri al düğmesi");
    await chip.onclick();
    ok(!mealPrefs().exclude.includes(key), "geri alındı");
    ok(!sheet.querySelector("[data-munex]"), "pencere tazelendi");
  } finally { closeSug(); }
});

test("özet: dört ay görünür; Lif ve mikro besinler tek katlanır Ayrıntılar altında (varsayılan kapalı)", async () => {
  const { slots } = await sugFixture();
  try {
    ok(!app.querySelector('[data-fold="detail"]'), "kayıt yokken Ayrıntılar yok");
    const moons = app.querySelector(".moons");
    eq(moons.querySelectorAll(".moon").length, 4);
    ok(moons.firstElementChild.matches(".moon-kcal"), "kalori kartı ilk sırada");
    eq(moons.previousElementSibling.textContent.trim(), "Bugün aldığın", "başlıkta kalori sayacı yok");
    eq(app.querySelectorAll(".macro").length, 0, "çubuk kalmadı");
    state.days[today()].log = [logItem("yulaf", 60, slots[0], 1), logItem("muz", 120, slots[0], 2)]; syncKcal(state.days[today()]); render();
    const macros = [...app.querySelectorAll(".macro")];
    eq(macros.length, 1, "yalnızca katlanmış lif çubuk olarak kalır");
    ok(macros[0].closest(".fold"), "lif katlı bölümde");
    eq([...app.querySelectorAll(".moon .mn-t b")].map(b => b.textContent), ["Kalori", "Protein", "Karbonhidrat", "Yağ"]);
    const h = app.querySelector('[data-fold="detail"]');
    ok(h && h.textContent.includes("Ayrıntılar"), "Ayrıntılar başlığı");
    eq(h.getAttribute("aria-expanded"), "false", "kapalı başlar");
    const totals = logTotals(state.days[today()]);
    eq(h.querySelector(".count").textContent, `Lif ${totals.lif}/${fiberTarget(currentProgram())} g · ${totals.micros.size}/14 mikro`);
    ok(h.closest(".fold").classList.contains("shut"));
    const inside = h.closest(".fold");
    ok(inside.querySelector(".macro").textContent.includes("Lif") && inside.querySelector(".pills"), "lif ve mikro besinler içeride");
    eq(app.querySelectorAll('[data-fold="micro"]').length, 0, "ayrı mikro besin bölümü yok");
    await h.onclick();
    eq(h.getAttribute("aria-expanded"), "true"); ok(!inside.classList.contains("shut"), "açılır");
    eq(state.ui.fold.detail, true, "durum kaydedilir");
    eq(a11yBad("özet"), []);
  } finally { closeSug(); }
});

test("öğün kartları kapalı başlar; başlıkta kalori veya boş ipucu görünür ve seçim korunur", async () => {
  const { slots } = await sugFixture();
  try {
    const [slot] = slots;
    const entry = state.days[today()];
    entry.log = [logItem("yulaf", 40, slot, 1), logItem("muz", 80, "kayip_ogun", 2)];
    syncKcal(entry); render();
    const header = k => app.querySelector(`[data-fold="meal_${k}"]`);
    for (const k of [...slots, "__other"]) eq(header(k).getAttribute("aria-expanded"), "false");
    eq(header(slot).querySelector(".fold-t").textContent, slotLabel(slot));
    eq(header(slot).querySelector(".count").textContent, `${itemsKcal([entry.log[0]])} kcal`);
    ok(!header(slot).querySelector(".meal-empty"), "dolu öğünde boş ipucu yok");
    eq(header(slots[1]).querySelector(".count .meal-empty").textContent, "boş");
    eq(header("__other").querySelector(".fold-t").textContent, "Diğer");
    await header(slot).onclick(); render();
    eq(header(slot).getAttribute("aria-expanded"), "true");
    eq(header(slots[1]).getAttribute("aria-expanded"), "false");
    await header(slot).onclick(); render();
    eq(state.ui.fold["meal_" + slot], false);
    eq(header(slot).getAttribute("aria-expanded"), "false");
  } finally { closeSug(); }
});

test("öğün kartı ekleme, kaydetme ve öneriler açıkken kayıtlı seçimi değiştirmeden açık kalır", async () => {
  const { slots } = await sugFixture();
  try {
    const slot = slots.find(k => suggestionToggle(k));
    const key = "meal_" + slot;
    const header = () => app.querySelector(`[data-fold="${key}"]`);
    const locked = async () => {
      eq(header().getAttribute("aria-expanded"), "true");
      await header().onclick();
      eq(header().getAttribute("aria-expanded"), "true");
      eq(isOpen(key), false);
    };
    suggestionToggle(slot).click();
    await locked();
    suggestionToggle(slot).click();
    eq(header().getAttribute("aria-expanded"), "false");
    addOpen = slot; render();
    ok(app.querySelector("#food-q").closest(".fold") === header().closest(".fold"));
    await locked();
    addOpen = null;
    const entry = state.days[today()];
    entry.log = [logItem("yulaf", 40, slot, 1), logItem("muz", 80, slot, 2)];
    saveMealOpen = slot; render();
    ok(app.querySelector("#sm-name").closest(".fold") === header().closest(".fold"));
    await locked();
  } finally { closeSug(); }
});

test("tek dokunuşla besin ekleme ve geri alma, öğün kartının kayıtlı durumu açıkken de kapalıyken de çalışır", async () => {
  const { s0 } = await quickFixture();
  try {
    for (const open of [false, true]) {
      const key = "meal_" + s0;
      const header = () => app.querySelector(`[data-fold="${key}"]`);
      addOpen = null; render();
      if (open) {
        await header().onclick();
        app.querySelector(`[data-addfood="${s0}"]`).click();
      } else {
        await app.querySelector('[data-fold="favs"]').onclick();
        await app.querySelector('[data-fav="yulaf"]').onclick();
        ok(header().closest(".fold").classList.contains("shut"));
        ok(header().querySelector(".count").textContent.includes("kcal"));
        await undoToast();
        eq(header().querySelector(".count .meal-empty").textContent, "boş");
        continue;
      }
      await app.querySelector('[data-qadd="yulaf"]').onclick();
      eq(state.days[today()].log.map(it => it.slot), [s0]);
      ok(header().querySelector(".count").textContent.includes("kcal"));
      ok(document.querySelector(".toast.act").textContent.includes("Geri al"));
      await undoToast();
      eq(header().querySelector(".count .meal-empty").textContent, "boş");
      eq(header().getAttribute("aria-expanded"), "true");
    }
  } finally { closeQuick(); }
});

test("Ayrıntılar: üç grup, eksikler önde, tek kaynak satırların altında açılır ve tamamlanan grup vurgulanır", async () => {
  const { slots } = await sugFixture();
  try {
    const entry = state.days[today()];
    entry.log = [{ ...logItem("yulaf", 40, slots[0], 1), v: ["A", "demir", "omega3"] }];
    syncKcal(entry); render();
    await app.querySelector('[data-fold="detail"]').onclick();
    const groups = [...app.querySelectorAll(".micro-group")];
    eq(groups.map(g => g.querySelector("h3").textContent), ["Vitaminler1/8", "Mineraller1/5", "Omega-31/1"]);
    for (const [group, missing] of [[groups[0], 7], [groups[1], 4], [groups[2], 0]]) {
      const pills = [...group.querySelectorAll(".pill")];
      eq(pills.map(p => p.matches("button")), [...Array(missing).fill(true), false]);
      ok(pills.at(-1).querySelector('use[href="#i-check"]'));
      eq(group.querySelector("h3").classList.contains("complete"), missing === 0);
    }
    const sourceButton = k => app.querySelector(`[data-micro-source="${k}"]`);
    const source = k => document.getElementById(sourceButton(k).getAttribute("aria-controls"));
    const uiBefore = JSON.stringify(state.ui);
    ok(source("C").hidden);
    sourceButton("C").click();
    eq(sourceButton("C").getAttribute("aria-expanded"), "true");
    ok(sourceButton("C").parentElement === groups[0].querySelector(".pills"), "etiket kendi satırında kalır");
    ok(!sourceButton("C").closest(".expanded"), "etiket tam genişlik sınıfını almaz");
    ok(source("C").parentElement === groups[0], "not grubun doğrudan altında");
    ok(groups[0].querySelector(".pills").compareDocumentPosition(source("C")) & Node.DOCUMENT_POSITION_FOLLOWING);
    eq(source("C").textContent, tx("Şuralardan alabilirsin: {0}", [NUTRIENTS.C.src]));
    ok(!source("C").hidden && source("D").hidden);
    render();
    ok(!source("C").hidden, "yeniden çizimde kaynak açık");
    sourceButton("D").click();
    ok(source("C").hidden && !source("D").hidden, "aynı grupta kaynak değişir");
    eq(sourceButton("C").getAttribute("aria-expanded"), "false");
    sourceButton("kalsiyum").click();
    ok(source("D").hidden && !source("kalsiyum").hidden, "gruplar arasında kaynak değişir");
    sourceButton("kalsiyum").click();
    ok(!app.querySelector(".micro-source:not([hidden])"), "ikinci dokunuş kaynağı kapatır");
    eq(JSON.stringify(state.ui), uiBefore, "kaynak durumu kayda yazılmaz");
    entry.log[0].v = Object.keys(NUTRIENTS); render();
    eq(app.querySelectorAll(".micro-title.complete").length, 3);
    eq(app.querySelectorAll("[data-micro-source]").length, 0);
  } finally { openMicroSource = null; closeSug(); }
});

test("Ayrıntılar: eksik etiket kenarlığı ve zemini marka tonunu kullanır", async () => {
  const css = await fetch("../starboard-site/css/components.css").then(r => r.text());
  const rules = [...css.matchAll(/\.pill\.micro-missing[^{}]*\{([^}]+)\}/g)];
  eq(rules.length, 2);
  for (const [, rule] of rules) {
    const border = rule.match(/border(?:-color)?:([^;]+)/)?.[1];
    const background = rule.match(/background:([^;}]+)/)?.[1];
    for (const color of [border, background]) {
      ok(color?.includes("var(--band)"), "marka tonu kullanılır");
      ok(!/--(?:moon-)?over\b/.test(color), "aşım tonu kullanılmaz");
    }
  }
});

/* ---- beslenme özeti ay evreleri (1.14.0) ve katlanır Sık yediklerin (1.13.0) ---- */
test("ay: moonInfo kalanı ve fazlalığı hesaplar; aşım yalnızca hedefin üstünde başlar", () => {
  eq(moonInfo(0, 2000), { pct: 0, over: false, left: 2000, extra: 0 });
  eq(moonInfo(1140, 2000), { pct: 0.57, over: false, left: 860, extra: 0 });
  eq(moonInfo(2000, 2000), { pct: 1, over: false, left: 0, extra: 0 }, "tam hedefte aşım yok");
  eq(moonInfo(2001, 2000), { pct: 1, over: true, left: 0, extra: 1 }, "bir üstü aşım");
  eq(moonInfo(2120, 2000), { pct: 1, over: true, left: 0, extra: 120 }, "ay dolunay kalır, fazlalık ayrı");
  eq(moonInfo(50, 0), { pct: 0, over: false, left: 0, extra: 0 }, "hedef yok: bölme hatası yok");
});

test("ay: gölge kayması oran x çap; 0'da ay karanlık, 1'de dolunay, aşımda da dolunay", () => {
  eq(moonShift(0), 0, "oran 0: gölge ayı tamamen örter");
  eq(moonShift(1), -68, "oran 1: gölge ayın dışında (çap = 68)");
  eq(moonShift(0.5), -34, "yarım oran yarım çap");
  eq(moonShift(1.7), -68, "oran 1'in üstüne çıkmaz");
  eq(moonShift(-1), 0, "oran 0'ın altına inmez");
  eq(MOON_R * 2, 68);
});

const moonLog = (program, slot, c) => [{ id: 1, k: "yulaf", n: "Deneme", g: 100, p: 0, c, f: 0, lif: 0, v: [], i: "grain", slot }];
const moonOf = id => app.querySelectorAll(".moon")[["kcal", "protein", "carb", "fat"].indexOf(id)];

test("ay: dört ay sırayla kalan miktarı yazar ve makro rengini taşır; gölge dairesi ayın içine kırpılır; hedef aşılınca dolunay ve +fazlalık", async () => {
  const { program, slots } = await sugFixture();
  try {
    eq([...app.querySelectorAll(".moon .mn-t b")].map(b => b.textContent), ["Kalori", "Protein", "Karbonhidrat", "Yağ"]);
    eq(app.querySelectorAll(".mring, .mrings, .mr-fg").length, 0, "eski halka kalmadı");
    let say = [...app.querySelectorAll(".moon")].map(r => r.getAttribute("aria-label"));
    eq(say, [`Kalori: ${fmtN(program.kcal)} kcal kaldı`, `Protein: ${program.protein} g kaldı`,
      `Karbonhidrat: ${program.carb} g kaldı`, `Yağ: ${program.fat} g kaldı`], "boş günde hedefin tamamı kalır");
    ok([...app.querySelectorAll(".moon")].every(m => m.getAttribute("role") === "img"), "ekran okuyucu etiketi (role=img)");
    let k = moonOf("kcal");
    ok(k.querySelector(".mn-lit") && k.querySelector(".mn-sh") && k.querySelector(".mn-halo"), "ay grafiği");
    eq(+k.querySelector(".mn-sh").dataset.to, 0, "boş günde gölge ayı örter (ay karanlık)");
    const lit = k.querySelector(".mn-lit"), sh = k.querySelector(".mn-sh");
    eq(sh.getAttribute("r"), lit.getAttribute("r"), "gölge ayın yarıçapında");
    eq([sh.getAttribute("cx"), sh.getAttribute("cy")], [lit.getAttribute("cx"), lit.getAttribute("cy")], "gölge ayla aynı merkezde başlar");
    const clip = sh.parentNode;
    eq(clip.tagName.toLowerCase(), "g");
    const cid = /url\(#([^)]+)\)/.exec(clip.getAttribute("clip-path"))[1];
    const cp = k.querySelector("#" + cid + " circle");
    ok(cp && cp.getAttribute("r") === lit.getAttribute("r"), "gölge ayın dairesine kırpılır");
    const c = Math.floor(program.carb * 0.6);
    state.days[today()].log = moonLog(program, slots[0], c); syncKcal(state.days[today()]); render();
    const left = program.kcal - 4 * c;
    ok(left > 0 && c < program.carb, "deneme verisi hedefin altında kalmalı");
    k = moonOf("kcal");
    eq(k.querySelector(".mn-v").textContent, fmtN(left), "altta kalan kalori");
    eq(k.querySelector(".mn-u").textContent, "kcal kaldı", "kcal kaldı biçimi");
    eq(k.style.getPropertyValue("--c"), "var(--moon-kcal)");
    eq(k.style.getPropertyValue("--cs"), "var(--moon-kcal-soft)", "gölge zemin rengi -soft jetonu");
    ok(!k.classList.contains("over"), "aşım yok");
    eq(moonOf("protein").querySelector(".mn-u").textContent, "g kaldı");
    eq(k.querySelector(".mn-t i").textContent, `${fmtN(4 * c)} / ${fmtN(program.kcal)} kcal`, "kaloride tüketilen / hedef");
    eq(moonOf("protein").querySelector(".mn-t i").textContent, `0 / ${fmtN(program.protein)} g`, "proteinde tüketilen / hedef");
    eq(moonOf("fat").querySelector(".mn-t i").textContent, `0 / ${fmtN(program.fat)} g`);
    eq(moonOf("carb").style.getPropertyValue("--c"), "var(--moon-carb)");
    eq(moonOf("carb").style.getPropertyValue("--cs"), "var(--moon-carb-soft)");
    eq(moonOf("fat").style.getPropertyValue("--c"), "var(--moon-fat)");
    eq(moonOf("protein").style.getPropertyValue("--c"), "var(--moon-protein)");
    ok(Math.abs(+k.querySelector(".mn-sh").dataset.to - moonShift(4 * c / program.kcal)) < 0.1, "gölge kayması hedefe göre");
    ok(+k.querySelector(".mn-sh").dataset.to < 0 && +k.querySelector(".mn-sh").dataset.to > -68, "ay kısmen aydınlık");
    eq(moonOf("protein").querySelector(".mn-sh").dataset.to, "0", "boş protein karanlık kalır");

    /* hedefin 120 kcal üstü: kalori ve karbonhidrat aşar, protein ve yağ aşmaz */
    const c2 = Math.ceil((program.kcal + 120) / 4);
    state.days[today()].log = moonLog(program, slots[0], c2); syncKcal(state.days[today()]); render();
    k = moonOf("kcal");
    ok(k.classList.contains("over"), "kalori aştı");
    eq(k.querySelector(".mn-v").textContent, "+" + fmtN(4 * c2 - program.kcal), "altta +fazlalık");
    eq(k.querySelector(".mn-u").textContent, "kcal");
    eq(k.querySelector(".mn-t i").textContent, `${fmtN(4 * c2)} / ${fmtN(program.kcal)} kcal`, "aşımda da tüketilen / hedef");
    eq(k.style.getPropertyValue("--c"), "var(--moon-kcal)", "aşımda kalori rengi");
    eq(k.style.getPropertyValue("--cs"), "var(--moon-kcal-soft)", "aşımda kalori gölgesi");
    eq(k.getAttribute("aria-label"), `Kalori: ${fmtN(4 * c2 - program.kcal)} kcal aşıldı`);
    eq(+k.querySelector(".mn-sh").dataset.to, -68, "aşan ay dolunay (gölge dışarıda)");
    ok(moonOf("carb").classList.contains("over") && moonOf("carb").querySelector(".mn-v").textContent === "+" + fmtN(c2 - program.carb), "karbonhidrat aştı");
    ok(!moonOf("protein").classList.contains("over") && !moonOf("fat").classList.contains("over"), "diğerleri aşmadı");
    eq(moonOf("protein").style.getPropertyValue("--c"), "var(--moon-protein)");
    ok(!app.querySelector(".metric-note .out"), "eski 'Hedefi aştın' satırı yok");
    eq(a11yBad("ay"), []);
  } finally { closeSug(); }
});

test("ay: kraterler diskte, ayrık, makroya özgü ve kararlı", () => {
  const root = document.createElement("div");
  const draw = id => {
    root.innerHTML = macroMoon(id, 95, 100, "g", id);
    return [...root.querySelectorAll(".mn-crater")].map(crater => {
      eq(crater.getAttribute("aria-hidden"), "true");
      ok(root.querySelector(".mn-lit").compareDocumentPosition(crater) & Node.DOCUMENT_POSITION_FOLLOWING);
      ok(crater.compareDocumentPosition(root.querySelector(".mn-sh")) & Node.DOCUMENT_POSITION_FOLLOWING);
      const circle = crater.querySelector("circle");
      return ["cx", "cy", "r"].map(attr => +circle.getAttribute(attr));
    });
  };
  const layouts = ["kcal", "protein", "carb", "fat"].map(id => {
    const craters = draw(id);
    ok(craters.length >= 6 && craters.length <= 9, "krater sayısı");
    const radii = craters.map(([, , r]) => r);
    ok(Math.max(...radii) / Math.min(...radii) >= 2.5, "krater boyutları belirgin farklı");
    const large = radii.filter(r => r >= 5 && r <= 7).length;
    const medium = radii.filter(r => r >= 3 && r <= 4).length;
    const small = radii.filter(r => r >= 1.3 && r <= 2.5).length;
    ok(large >= 1 && large <= 2 && medium >= 2 && medium <= 3 && small >= 2, "üç krater boyutu");
    eq(large + medium + small, craters.length);
    eq(draw(id), craters, "ardışık çizimde aynı yüzey");
    craters.forEach(([x, y, r], index) => {
      ok(Math.hypot(x - 48, y - 48) + r + 0.45 < MOON_R, "krater ve açık kenarı disk içinde");
      for (const [otherX, otherY, otherR] of craters.slice(0, index)){
        ok(Math.hypot(x - otherX, y - otherY) > r + otherR + 0.9, "kraterler çakışmaz");
      }
    });
    return JSON.stringify(craters.map(([x, y]) => [x, y].join(",")).sort());
  });
  eq(new Set(layouts).size, 4, "her makronun konum kümesi farklı");
});

test("ay: ışıma dolulukla artar, yüksek dolulukta parıltı ve aşımda işaretler görünür", () => {
  const root = document.createElement("div");
  const corners = ["kcal", "protein", "carb", "fat"].map(id => {
    root.innerHTML = macroMoon(id, 60, 100, "g", id);
    eq(root.querySelector(".mn-spark"), null);
    root.innerHTML = macroMoon(id, 61, 100, "g", id);
    const spark = root.querySelector(".mn-spark");
    ok(spark, "%60 üstünde parıltı var");
    const {e: x, f: y} = spark.transform.baseVal.getItem(0).matrix;
    return [Math.sign(x - 48), Math.sign(y - 48)].join(",");
  });
  ok(corners.every(corner => !corner.includes("0")), "parıltılar köşelerde");
  eq(new Set(corners).size, 4, "her makronun parıltı köşesi farklı");
  const levels = [0, 50, 95, 100, 110].map(got => {
    root.innerHTML = macroMoon("Kalori", got, 100, "kcal", "kcal");
    const halo = root.querySelector(".mn-halo");
    const spark = root.querySelector(".mn-spark");
    eq(halo.getAttribute("aria-hidden"), "true");
    eq(spark?.getAttribute("aria-hidden"), got > 60 ? "true" : undefined);
    for (const selector of [".mn-over-ring", ".mn-over-mark"]){
      const indicator = root.querySelector(selector);
      eq(!!indicator, got > 100);
      if (indicator) ok(spark.compareDocumentPosition(indicator) & Node.DOCUMENT_POSITION_FOLLOWING);
    }
    return [+halo.style.getPropertyValue("--mn-level"), parseFloat(halo.style.getPropertyValue("--mn-blur"))];
  });
  eq(levels[0], [0, 0], "boş ay ışımaz");
  eq(levels[3], levels[4], "aşım ışımanın üst sınırını değiştirmez");
  for (let i = 1; i <= 3; i++){
    ok(levels[i].every((value, j) => value > levels[i - 1][j]), "ışıma gücü ve yarıçapı artar");
  }
});

test("ay: aşımda makro rengi ve kart zemini korunur, halka ve ünlem yalnızca aşımda görünür", async () => {
  const styles = document.createElement("style");
  const css = await Promise.all(["tokens", "app"].map(name =>
    fetch(`../starboard-site/css/${name}.css`).then(r => r.text())
  ));
  styles.textContent = css.join("\n");
  const cards = document.createElement("div");
  cards.innerHTML = ["kcal", "protein", "carb", "fat"].map(id =>
    macroMoon(id, 101, 100, "g", id) + macroMoon(id, 100, 100, "g", id)
  ).join("");
  const pixel = document.createElement("canvas");
  pixel.width = pixel.height = 1;
  const ctx = pixel.getContext("2d", { willReadFrequently: true });
  const luminance = color => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const channels = Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
    const [r, g, b] = channels.map(value => {
      const s = value / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => {
    const [x, y] = [luminance(a), luminance(b)];
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  document.head.append(styles);
  document.body.append(cards);
  try {
    for (const theme of ["light", "dark"]) {
      cards.className = "thm-" + theme;
      for (let i = 0; i < cards.children.length; i += 2) {
        const over = cards.children[i], normal = cards.children[i + 1];
        const overFill = getComputedStyle(over.querySelector(".mn-lit")).fill;
        eq(overFill, getComputedStyle(normal.querySelector(".mn-lit")).fill);
        eq(getComputedStyle(over).backgroundColor, getComputedStyle(normal).backgroundColor);
        const ring = over.querySelector(".mn-over-ring");
        ok(ring && !normal.querySelector(".mn-over-ring"), "halka yalnızca aşımda");
        const mark = over.querySelector(".mn-over-mark");
        ok(mark && !normal.querySelector(".mn-over-mark"), "ünlem yalnızca aşımda");
        eq(mark.getAttribute("aria-hidden"), "true", "ünlem erişilebilirlik ağacından gizli");
        eq(getComputedStyle(mark).fill, getComputedStyle(ring).stroke, "ünlem ve halka aynı renkte");
        eq(getComputedStyle(ring).fill, "none");
        const strokeWidth = parseFloat(getComputedStyle(ring).strokeWidth);
        eq(strokeWidth, 5);
        const radius = Number(ring.getAttribute("r"));
        ok(radius + strokeWidth / 2 < Number(over.querySelector(".mn-lit").getAttribute("r")), "halka disk içinde");
        eq(getComputedStyle(over.querySelector(".mn-v")).fontWeight, "800");
        eq(getComputedStyle(normal.querySelector(".mn-v")).fontWeight, "800");
        eq(getComputedStyle(over.querySelector(".mn-v")).fontSize, getComputedStyle(normal.querySelector(".mn-v")).fontSize);
        eq(getComputedStyle(ring).stroke, theme === "light" ? "rgb(255, 255, 255)" : "rgb(6, 10, 25)");
        if (theme === "light") {
          const numberColor = getComputedStyle(over.querySelector(".mn-v")).color;
          ok(contrast(overFill, getComputedStyle(ring).stroke) >= 3, over.className + " halka kontrastı");
          ok(contrast(numberColor, getComputedStyle(over).backgroundColor) >= 4.5, over.className + " aşım rakamı kontrastı");
        }
        ok(getComputedStyle(ring).stroke !== getComputedStyle(over.querySelector(".mn-v")).color);
        ok(overFill !== getComputedStyle(ring).stroke, "ay ve halka farklı renklerde");
      }
    }
  } finally { cards.remove(); styles.remove(); }
});

test("ay: renk ve zemin jetonları üç tema bloğunda tanımlı", async () => {
  const css = await fetch("../starboard-site/css/app.css").then(r => r.text());
  const tokens = await fetch("../starboard-site/css/tokens.css").then(r => r.text());
  const blocks = [/:root, \.thm-light\{([^}]+)\}/, /:root:not\(\[data-theme="light"\]\)\{([^}]+)\}/, /:root\[data-theme="dark"\], \.thm-dark\{([^}]+)\}/]
    .map(re => (re.exec(tokens) || [])[1]);
  ok(blocks.every(Boolean), "tema blokları bulunamadı");
  for (const b of blocks) for (const v of ["--moon-kcal-soft", "--moon-protein-soft", "--moon-carb-soft", "--moon-fat-soft", "--moon-over", "--moon-mark"]) ok(new RegExp(v + ":").test(b), v + " eksik");
  ok(!/\.mring|\.mrings|\.mr-(r|n|t|bg|fg)\b/.test(css), "eski özet halkası stilleri kalmış");
  ok(/\.fx-moon/.test(css) && /@keyframes fxMoon/.test(css), "ay giriş animasyonu yok");
  ok(/\.mn-sh\{[^}]*transition:transform/.test(css), "gölge kayması geçişi yok");
});

test("ay: sayfaya girerken fx-moon ile gölge kayarak açılır; hareket azaltılmışsa eski değerden değil doğrudan son değerde durur", async () => {
  const { program, slots } = await sugFixture();
  const realMM = window.matchMedia;
  try {
    window.matchMedia = () => ({ matches: false });
    tab = "plan"; render(); tab = "meals"; render();
    ok(app.querySelector(".mn-sh").classList.contains("fx-moon"), "girişte fx-moon");
    ok(app.querySelector(".mn-v [data-count]"), "rakam data-count ile sayılır (countUp)");
    render();
    ok(!app.querySelector(".mn-sh").classList.contains("fx-moon"), "aynı sayfada yeniden çizim baştan açmaz");
    const before = parseFloat(app.querySelector(".mn-sh").style.transform.replace("translateX(", ""));
    state.days[today()].log = moonLog(program, slots[0], 100); syncKcal(state.days[today()]); render();
    const sh = app.querySelector(".mn-sh");
    eq(parseFloat(sh.style.transform.replace("translateX(", "")), before, "yeni değere eski yerinden geçer");
    ok(+sh.dataset.to !== before, "yeni değer farklı");
    window.matchMedia = q => ({ matches: /reduce/.test(q) });
    state.days[today()].log = moonLog(program, slots[0], 150); syncKcal(state.days[today()]); render();
    const rm = app.querySelector(".mn-sh");
    eq(rm.style.transform, `translateX(${rm.dataset.to}px)`, "hareket azaltılmış: animasyonsuz son değer");
    const css = await fetch("../starboard-site/css/app.css").then(r => r.text());
    ok(/prefers-reduced-motion: reduce\)\{\s*\*\{transition:none !important;animation:none !important\}/.test(css), "azaltılmış harekette geçişler kapalı");
  } finally { window.matchMedia = realMM; closeSug(); }
});

test("ay: İngilizcede de çalışır (kcal left, g left, +fazlalık), eksik çeviri kalmaz", async () => {
  const { program, slots } = await sugFixture();
  try {
    await withLang("en", async () => {
      I18N_MISSING.clear(); render();
      eq([...app.querySelectorAll(".moon .mn-t b")].map(b => b.textContent), ["Calories", "Protein", "Carbs", "Fat"]);
      eq([...app.querySelectorAll(".moon .mn-u")].map(b => b.textContent), ["kcal left", "g left", "g left", "g left"]);
      eq(moonOf("kcal").getAttribute("aria-label"), `Calories: ${fmtN(program.kcal)} kcal left`);
      const c2 = Math.ceil((program.kcal + 120) / 4);
      state.days[today()].log = moonLog(program, slots[0], c2); syncKcal(state.days[today()]); render();
      eq(moonOf("kcal").querySelector(".mn-v").textContent, "+" + fmtN(4 * c2 - program.kcal));
      eq(moonOf("kcal").getAttribute("aria-label"), `Calories: ${fmtN(4 * c2 - program.kcal)} kcal over`);
      eq([...I18N_MISSING], [], "İngilizce karşılığı olmayan metinler");
    });
  } finally { closeSug(); }
});

test("Sık yediklerin: katlanır, varsayılan kapalı, dokununca açılır; dünü kopyala düğmesi dışarıda kalır; İngilizcesi var", async () => {
  await quickFixture();
  try {
    addOpen = null; render();
    const h = app.querySelector('[data-fold="favs"]');
    ok(h && h.textContent.includes("Sık yediklerin"), "başlık");
    eq(h.querySelector(".count").textContent, "", "başlıkta ekleme talimatı yok");
    eq(h.getAttribute("aria-expanded"), "false", "varsayılan kapalı");
    const box = h.closest(".fold");
    ok(box.classList.contains("shut"), "kapalı görünür");
    ok(box.querySelector('[data-fav="yulaf"]'), "besin düğmeleri katlı bölümün içinde");
    const cy = app.querySelector("#copy-y");
    ok(cy && !cy.closest(".fold"), "dünü kopyala katlı bölümün dışında");
    ok(!app.querySelector('[data-fold="favs"]').closest(".favs"), "ayrı bölüm");
    await h.onclick();
    eq(h.getAttribute("aria-expanded"), "true", "dokununca açılır");
    ok(!box.classList.contains("shut"));
    eq(state.ui.fold.favs, true, "durum kaydedilir");
    render();
    eq(app.querySelector('[data-fold="favs"]').getAttribute("aria-expanded"), "true", "yeniden çizimde açık kalır");
    await app.querySelector('[data-fold="favs"]').onclick();
    eq(state.ui.fold.favs, false, "yeniden dokununca kapanır");
    render();
    ok(app.querySelector('[data-fold="favs"]').closest(".fold").classList.contains("shut"));
    await withLang("en", async () => {
      I18N_MISSING.clear(); render();
      const e = app.querySelector('[data-fold="favs"]');
      eq(e.textContent.trim(), "Your frequent foods");
      eq([...I18N_MISSING], [], "İngilizce karşılığı olmayan metinler");
    });
    addOpen = slotList()[0][0]; render();
    ok(!app.querySelector('[data-fold="favs"]'), "besin ekle paneli açıkken liste panelde, katlı bölüm çizilmez");
    eq(a11yBad("favs"), []);
  } finally { closeQuick(); }
});

test("öğünlerim ve kayıtlı öğünler günlüğün altında katlıdır (varsayılan kapalı); içindeki işlemler çalışır", async () => {
  const { slots } = await sugFixture();
  try {
    state.savedMeals = [{ id: "s1", name: "Sabah kasesi", items: [{ k: "yulaf", n: "Yulaf ezmesi", g: 40, p: 13, c: 60, f: 7, lif: 10, v: [], i: "grain" }] }]; render();
    const hs = ["mymeals", "saved"].map(k => app.querySelector(`[data-fold="${k}"]`));
    ok(hs.every(Boolean), "iki başlık da var");
    eq(hs.map(h => h.getAttribute("aria-expanded")), ["false", "false"]);
    eq(hs.map(h => h.querySelector(".count").textContent), [String(slots.length), "1"], "sayılar başlıkta");
    ok(hs.every(h => h.closest(".fold").classList.contains("shut")));
    const cards = [...app.querySelectorAll("[data-addfood]")].map(b => b.closest("section"));
    ok(cards.every(c => c.compareDocumentPosition(hs[0]) & Node.DOCUMENT_POSITION_FOLLOWING), "öğün kartlarının altında");
    ok(app.querySelector("#ml-add") && app.querySelector("[data-saved-del]"), "içerik gövdede durur");
    await app.querySelector("#ml-add").onclick();
    ok(app.querySelector("#ml-name"), "Öğün ekle formu açılır");
    mealAddOpen = false;
    ok(!app.querySelector("#reroll"));
  } finally { mealAddOpen = false; closeSug(); }
});

test("Ayarlar: Bugün'de Ayarla düğmesi yok; tercihler Ayarlar sayfasındaki tek satırdan pencerede açılır, değişiklik kaydedilir ve öneriyi yeniler", async () => {
  await sugFixture();
  try {
    eq(app.querySelectorAll("#prefs-open").length, 0, "Bugün'de Ayarla düğmesi yok");
    ok(!app.querySelector("#cuisine-sel") && !app.querySelector("#diet-sel") && !app.querySelector("#use-mine"), "tercihler sayfada yok");
    tab = "settings"; meTab = "set"; render();
    eq(app.querySelectorAll("#s-meal-prefs").length, 1, "Ayarlar sayfasında tek tercih satırı");
    const btn = app.querySelector("#s-meal-prefs");
    ok(btn.textContent.trim() === "Önerileri kendine göre ayarla" && btn.getAttribute("aria-haspopup") === "dialog", "adlı düğme");
    btn.onclick();
    const sheet = [...document.querySelectorAll(".sheet-bg")].pop();
    const dlg = sheet.querySelector('.sheet[role="dialog"]');
    ok(dlg && dlg.getAttribute("aria-modal") === "true" && sheet.querySelector("#" + dlg.getAttribute("aria-labelledby")).textContent === "Önerileri kendine göre ayarla", "adlı pencere");
    for (const id of ["cuisine-sel", "diet-sel"]) ok(sheet.querySelector(`label[for="${id}"]`) && sheet.querySelector("#" + id), id + " etiketli");
    ok(sheet.querySelector("#use-mine").getAttribute("aria-pressed") === "false");
    for (const b of sheet.querySelectorAll("button")) ok((b.getAttribute("aria-label") || b.textContent).trim(), "adsız düğme");
    const ds = sheet.querySelector("#diet-sel");
    ds.value = "vegan"; await ds.onchange();
    eq(mealPrefs().diet, "vegan", "beslenme türü kaydedildi");
    tab = "meals"; mealTab = "log"; render();
    const keysOf = () => app.querySelector(".sug") ? [...app.querySelectorAll(".sug [data-mex]")].map(b => b.dataset.mex) : [];
    ok(keysOf().every(k => foodAllowed(k, "vegan")), "arkadaki öneri yeni türe uyar");
    ok(sheet.querySelector("#diet-sel").value === "vegan" && document.activeElement.id === "diet-sel", "pencere tazelenir, odak kalır");
    await sheet.querySelector("#use-mine").onclick();
    eq(mealPrefs().useMine, true);
    eq(sheet.querySelector("#use-mine").getAttribute("aria-pressed"), "true");
    const cs = sheet.querySelector("#cuisine-sel");
    cs.value = Object.keys(CUISINES).find(k => k !== currentCuisine()); await cs.onchange();
    eq(mealPrefs().cuisine, cs.value, "mutfak kaydedildi");
    sheet.querySelector(".sheet-x").onclick();
    await new Promise(r => setTimeout(r, 300));
    ok(!sheet.isConnected, "kapanır");
    ok(!app.querySelector("#prefs-open"), "Bugün'de Ayarla düğmesi kalmadı");
    tab = "settings"; meTab = "set"; render();
    ok(app.querySelector("#s-meal-prefs"), "ayarlar satırı yerinde");
  } finally { closeSug(); }
});

test("sade beslenme: İngilizcede de çalışır, sözlükte olmayan metin kalmaz", async () => {
  const { slots } = await sugFixture();
  try {
    await withLang("en", async () => {
      I18N_MISSING.clear(); render();
      eq([...app.querySelectorAll("[data-meal-tab]")].map(b => b.textContent.trim()), ["Today", "Recipes", "List"]);
      showSuggestions();
      const s = slots.find(k => sectionOf(k).querySelector(".sug"));
      const box = sectionOf(s).querySelector(".sug");
      ok(box.getAttribute("aria-label") === "Suggestion" && box.querySelector("[data-sug-add]").textContent === "Add" && box.querySelector("[data-sug-other]").textContent === "Another", "tabak İngilizce");
      ok(!app.querySelector("#prefs-open"), "Bugün'de Ayarla düğmesi yok");
      state.days[today()].log = [logItem("yulaf", 60, slots[0], 1)]; syncKcal(state.days[today()]); render();
      ok(app.querySelector('[data-fold="detail"]').textContent.includes("Details"), "Details");
      ok(app.querySelector('[data-fold="mymeals"]').textContent.includes("My meals"), "My meals");
      tab = "settings"; meTab = "set"; render();
      const prefsBtn = app.querySelector("#s-meal-prefs");
      ok(prefsBtn && prefsBtn.textContent.trim() === "Tune the suggestions", prefsBtn && prefsBtn.textContent);
      prefsBtn.onclick();
      const sheet = [...document.querySelectorAll(".sheet-bg")].pop();
      ok(sheet.textContent.includes("Tune the suggestions") && sheet.querySelector("#pf-ok").textContent === "OK", sheet.textContent);
      sheet.remove();
      tab = "meals"; mealTab = "log"; delete state.days[today()].log; mealVariant = 0; render();
      await app.querySelector("[data-sug-add]").onclick();
      ok(document.querySelector(".toast.act").textContent.includes("added") && document.querySelector(".toast.act").textContent.includes("Undo"));
      eq([...I18N_MISSING], [], "İngilizce karşılığı olmayan metinler");
    });
  } finally { closeSug(); }
});

/* ---- antrenman ekranlarının sadeleşmesi (1.10.0) ---- */
/* Bugünün antrenman günü olduğu (on) ya da dinlenme günü olduğu bir profil; haftanın günü ne olursa olsun çalışsın diye 5 günlük program. */
const trainFx = async on => {
  state = await loadFixture(); migrateMeals(); notice = null; viewDate = null;
  const wd = isoWeekday(today()), others = [1, 2, 3, 4, 5, 6, 7].filter(d => d !== wd);
  state.profile.programId = "gym_ppl5"; state.profile.venue = "gym"; delete state.profile.noPlan;
  state.profile.days = (on ? [wd, ...others.slice(0, 4)] : others.slice(0, 5)).sort((a, b) => a - b);
  state.days = {};
  calcReset(); ensureToday();
  return currentProgram();
};
const trainReset = () => { freeOpenKey = null; woDone = false; viewDate = null; howOpen = null; howQuery = ""; planTab = "today"; tab = "today"; state = null; };
const sections = () => app.querySelectorAll("main > section").length;

test("antrenman: alt sekmeler Bugün, Program ve Nasıl yapılır; rehber sekmesinde arama ile açılır", async () => {
  try {
    await trainFx(true);
    tab = "plan"; planTab = "today"; render();
    eq([...app.querySelectorAll("[data-plan-tab]")].map(b => b.dataset.planTab), ["today", "program", "how"]);
    eq([...app.querySelectorAll("[data-plan-tab]")].map(b => b.textContent.trim()), ["Bugün", "Program", "Nasıl yapılır"]);
    ok(!app.querySelector("#how-q"), "rehber Bugün'de değil");
    planTab = "program"; render();
    ok(!app.querySelector("#how-q"), "rehber Program sekmesinde değil");
    planTab = "how"; render();
    ok(app.querySelector("#how-q") && !app.querySelector('[data-fold="how"]'), "rehber kendi sekmesinde, katlanır bölüm yok");
    const q = app.querySelector("#how-q");
    q.value = "squat"; q.oninput();
    ok(app.querySelectorAll("[data-how]").length > 0, "arama rehber kartı buldu");
    /* program dışındaki bir hareket de bulunur */
    q.value = "plank"; q.oninput();
    ok(app.querySelector('[data-how="plank"]'), "tüm rehbere ulaşılır");
    eq(a11yBad("program"), []);
  } finally { trainReset(); }
});

test("antrenman: hareket önizleme her harekette menü olarak durur, açık durumu korunur", async () => {
  try {
    await trainFx(true);
    tab = "plan"; planTab = "today"; render();
    openWorkout();
    const { list } = woList();
    /* İki kez "sonraki"ye basılacağı için en az üç animasyonlu hareket gerekir. */
    woIdx = list.findIndex((n, i) => i < list.length - 2 &&
      exAnimFor(guidesFor(n)[0]) && exAnimFor(guidesFor(list[i + 1])[0]));
    ok(woIdx >= 0, "animasyonu olan hareketlerden oluşan bir gün bulundu");
    drawWO();
    const id = guidesFor(list[woIdx])[0];
    let btn = woEl.querySelector("#wo-how-t"), panel = woEl.querySelector("#wo-how-b");
    ok(btn && panel, "hareketin altında hareket önizleme menüsü var");
    eq(btn.textContent.trim(), "Hareket önizleme", "menü başlığı");
    eq(btn.getAttribute("aria-expanded"), "false", "varsayılan kapalı");
    eq(panel.hidden, true, "kapalıyken panel gizli");
    ok(panel.hasAttribute("hidden"), "kapalıyken hidden özniteliği var");
    ok(!panel.querySelector(".how-anim svg"), "kapalıyken animasyon çizilmemiş");
    btn.onclick();
    btn = woEl.querySelector("#wo-how-t"); panel = woEl.querySelector("#wo-how-b");
    eq(btn.getAttribute("aria-expanded"), "true", "bir dokunuşla açılır");
    eq(panel.hidden, false, "panel görünür");
    ok(panel.querySelector(`.how-anim[data-anim="${id}"]`), "hareketin animasyonu");
    ok(panel.querySelectorAll("li").length > 0, "nasıl yapıldığını anlatan yazı");
    ok(panel.querySelector(".how-x").textContent.includes("Dikkat"), "dikkat notu");
    btn.onclick();
    eq(woEl.querySelector("#wo-how-t").getAttribute("aria-expanded"), "false", "tekrar dokunuşla kapanır");
    eq(woEl.querySelector("#wo-how-b").hidden, true, "panel yeniden gizlenir");
    ok(!woEl.querySelector("#wo-how-b .how-anim").children.length, "kapanınca animasyon temizlenir");
    /* Kullanıcı bir kez açtıysa sonraki hareketlerde de açık kalır. */
    woEl.querySelector("#wo-how-t").onclick();
    eq(woEl.querySelector("#wo-how-t").getAttribute("aria-expanded"), "true");
    woEl.querySelector("#wo-next").onclick();
    btn = woEl.querySelector("#wo-how-t"); panel = woEl.querySelector("#wo-how-b");
    eq(btn.getAttribute("aria-expanded"), "true", "sonraki harekette açık kalır");
    eq(panel.hidden, false, "sonraki harekette panel görünür");
    ok(panel.querySelectorAll("li").length > 0, "sonraki hareketin adımları");
    ok(panel.querySelector(".how-anim[data-anim]"), "sonraki hareketin animasyonu");
    /* Kapatıldıysa sonraki hareket de kapalı başlar. */
    btn.onclick();
    woEl.querySelector("#wo-next").onclick();
    eq(woEl.querySelector("#wo-how-t").getAttribute("aria-expanded"), "false", "kapatıldıysa sonraki harekette kapalı");
    /* Rehberi olmayan harekette de menü vardır; hareket adıyla yedek anlatım gösterir. */
    closeWorkout();
    state.profile.programId = "custom";
    state.profile.custom = { days: { [isoWeekday(today())]: { t:"Test günü", ex:[{ n:"Özel hareket", s:3, r:10 }] } } };
    calcReset();
    openWorkout();
    btn = woEl.querySelector("#wo-how-t");
    ok(btn, "rehberi olmayan harekette de menü var");
    eq(btn.textContent.trim(), "Hareket önizleme", "menü başlığı aynı");
    eq(btn.getAttribute("aria-expanded"), "false", "yine kapalı başlar");
    eq(woEl.querySelector("#wo-how-b").hidden, true);
    btn.onclick();
    panel = woEl.querySelector("#wo-how-b");
    eq(panel.hidden, false, "yedek anlatım açılır");
    ok(panel.querySelector(".how-x") && panel.querySelector(".how-x").textContent.includes("Özel hareket"), "hareket adı yedek metinde");
    eq(panel.querySelectorAll("li").length, 0, "rehbersiz harekette adım yok");
    /* Antrenman modu kapanıp yeniden açılınca menü kapalı başlar. */
    closeWorkout();
    openWorkout();
    eq(woEl.querySelector("#wo-how-t").getAttribute("aria-expanded"), "false", "yeniden açılışta kapalı");
    eq(woEl.querySelector("#wo-how-b").hidden, true, "panel gizli");
  } finally { if (woEl) closeWorkout(); trainReset(); }
});

test("antrenman: Bugün tek bölüm, salt okunur liste; giriş alanı ve rekor panosu yok", async () => {
  try {
    const program = await trainFx(true);
    const ses = program.training.days.find(d => d.wd === isoWeekday(today()));
    const list = exercisesOf(ses);
    tab = "plan"; planTab = "today"; render();
    eq(sections(), 1);
    eq(app.querySelectorAll(".lift").length, list.length, "bugünün hareketleri listelenir");
    eq(app.querySelectorAll("main input, main select, main textarea").length, 0, "set girişi yalnızca antrenman modunda");
    ok(!app.querySelector(".prs") && !app.innerHTML.includes("Kişisel rekorlar"), "rekor panosu burada değil");
    ok(!app.querySelector('[data-fold="lifts"]'), "tek tek giriş bölümü yok");
    ok(app.querySelector("h2 .count").textContent.includes(`0/${list.length}`), "ilerleme sayısı");
    ok(app.querySelector("#wo-start").textContent.trim() === "Antrenmanı başlat");
    ok(app.querySelector(".lift-sub").textContent.trim().length > 0, "set × tekrar yazar");
    eq(a11yBad("bugün"), []);
    /* bir hareket kaydedilince sayı ve düğme değişir */
    state.days[today()].lifts = { [list[0]]: { t: "ok", ok: 1 } };
    render();
    ok(app.querySelector("h2 .count").textContent.includes(`1/${list.length}`));
    ok(app.querySelector("#wo-start").textContent.trim() === "Antrenman moduna dön");
    ok(app.querySelectorAll(".lift-tick").length === 1);
    app.querySelector("#wo-start").onclick();
    ok(woEl, "düğme antrenman modunu açar");
    closeWorkout();
    /* serbest antrenman kartı antrenman gününde bağlantısız */
    ok(!app.querySelector("#free-open"));
  } finally { if (woEl) closeWorkout(); trainReset(); }
});

test("antrenman: dinlenme günü tek kart; serbest antrenman kartı bağlantıyla açılır", async () => {
  try {
    const program = await trainFx(false);
    const nx = nextSession(program, today());
    ok(nx, "sıradaki antrenman bulunur");
    tab = "plan"; planTab = "today"; render();
    eq(sections(), 1);
    const h = app.querySelector("main section h2").textContent;
    eq(h, `Bugün dinlenme · Sıradaki: ${WD_NAMES[nx.wd]}, ${nx.t}`);
    ok(app.querySelector("#free-open") && !app.querySelector("#free-add"), "kart kapalı, bağlantı var");
    ok(!app.querySelector(".prs"), "rekor panosu yok");
    eq(a11yBad("dinlenme"), []);
    app.querySelector("#free-open").onclick();
    ok(app.querySelector("#free-add") && !app.querySelector("#free-open"), "bağlantı kartı açtı");
    eq(sections(), 2);
    eq(a11yBad("dinlenme, kart açık"), []);
    /* kayıtlı serbest antrenman kartı kendiliğinden görünür */
    freeOpenKey = null;
    ensureDay(today()).free = { k: "walk", min: 30, note: null };
    render();
    ok(app.querySelector("#free-del") && !app.querySelector("#free-open"));
    /* geçmiş gün: sıradaki yazılmaz */
    delete state.days[today()].free;
    viewDate = shiftDays(today(), -1); ensureDay(viewDate); render();
    ok(app.querySelector("main section h2") && !app.querySelector("main section h2").textContent.includes("Sıradaki"), "geçmiş günde sıradaki yok");
  } finally { trainReset(); }
});

test("antrenman: program kapalıyken de tek kart ve küçük serbest antrenman bağlantısı", async () => {
  try {
    await trainFx(false);
    state.profile.noPlan = true; calcReset();
    tab = "plan"; planTab = "today"; render();
    eq(sections(), 1);
    ok(app.querySelector("#plan-on") && app.querySelector("#free-open") && !app.querySelector(".prs"));
    eq(a11yBad("program kapalı"), []);
    planTab = "program"; render();
    ok(app.querySelector("#plan-on") && !app.querySelector("#how-q"), "kapalıyken Program sekmesi");
    planTab = "how"; render();
    ok(app.querySelector("#how-q"), "kapalıyken de rehber aranabilir");
  } finally { trainReset(); }
});

test("rekorlar: panosu Ben › Grafikler'de; yeni rekor kutlaması sürer", async () => {
  try {
    await trainFx(true);
    state.days[today()].lifts = { "Bench press 4×6-8": { t: "w", sets: [{ kg: 60, r: 5 }] } };
    ok(records().length === 1);
    tab = "settings"; meTab = "chart"; render();
    ok(app.querySelector(".prs .pr.new"), "rekor panosu grafiklerde");
    ok(app.innerHTML.includes("Kişisel rekorlar"));
    tab = "plan"; planTab = "today"; render();
    ok(!app.querySelector(".prs"), "antrenman ekranında yok");
    tab = "today"; render();
    ok(!app.querySelector(".prs"));
    tab = "settings"; meTab = "body"; render();
    ok(!app.querySelector(".prs"), "Vücudum'da yok");
    /* kutlama: önceki en iyiden yüksekse bildirim çıkar */
    const before = records().find(r => r.name === "Bench press 4×6-8");
    state.days[today()].lifts["Bench press 4×6-8"].sets.push({ kg: 80, r: 5 });
    document.querySelectorAll(".toast").forEach(e => e.remove());
    checkPR("Bench press 4×6-8", before);
    ok(document.querySelector(".toast") && document.querySelector(".toast").textContent.includes("Yeni rekor"), "rekor kutlaması");
    document.querySelectorAll(".toast").forEach(e => e.remove());
  } finally { trainReset(); }
});

test("antrenman modu: ek ağırlık, süre, kardiyo ve ağırlık×tekrar eksiksiz girilir; onaylı set düzeltilir", async () => {
  try {
    await trainFx(true);
    state.profile.programId = "custom";
    state.profile.custom = { days: { [isoWeekday(today())]: { t: "Deneme", ex: [
      { n: "Barfiks", s: 4, r: 8 }, { n: "Plank", s: 3, r: "45 sn" }, { n: "20 dk koşu", s: 1, r: 1 }, { n: "Squat", s: 3, r: 10 }] } } };
    calcReset();
    const L = () => state.days[today()].lifts;
    tab = "plan"; planTab = "today"; render();
    eq(app.querySelectorAll(".lift").length, 4);
    openWorkout();
    const { list, venue } = woList();
    eq(list.map(n => parseEx(n, venue).t), ["r", "t", "c", "w"]);
    const set = async (sel, v) => { const i = woEl.querySelector(sel); i.value = v; await i.onchange(); };

    /* ek ağırlıklı tekrar (barfiks): ek kg setlerden önce de saklanır */
    woIdx = 0; drawWO();
    ok(woEl.querySelector('[data-wi="kg2"]'), "ek ağırlık alanı");
    await set('[data-wi="kg2"]', "10");
    eq(L()["Barfiks 4×8"].kg2, 10);
    await set('[data-wi="s"][data-wk="0"]', "8");
    await woEl.querySelector('[data-wok="0"]').onclick();
    eq(L()["Barfiks 4×8"].sets[0], 8);
    stopRest();
    await set('[data-wi="s"][data-wk="0"]', "9");
    eq(L()["Barfiks 4×8"].sets[0], 9, "onaylı set değişince kaydedilir");
    ok(liftHas(L()["Barfiks 4×8"]));

    /* süre (plank) */
    woIdx = 1; drawWO();
    await set('[data-wi="s"][data-wk="0"]', "45");
    await woEl.querySelector('[data-wok="0"]').onclick();
    stopRest();
    eq(L()["Plank 3×45 sn"].sets[0], 45);

    /* kardiyo: süre ve mesafe */
    woIdx = 2; drawWO();
    ok(woEl.querySelector('[data-wi="min"]') && woEl.querySelector('[data-wi="km"]'), "süre ve mesafe alanları");
    await set('[data-wi="min"]', "20");
    await set('[data-wi="km"]', "3,5");
    eq([L()["20 dk koşu 1×1"].min, L()["20 dk koşu 1×1"].km], [20, 3.5]);

    /* ağırlık × tekrar */
    woIdx = 3; drawWO();
    await set('[data-wi="kg"][data-wk="0"]', "60");
    await set('[data-wi="r"][data-wk="0"]', "5");
    await woEl.querySelector('[data-wok="0"]').onclick();
    stopRest();
    eq(L()["Squat 3×10"].sets[0], { kg: 60, r: 5 });
    await set('[data-wi="kg"][data-wk="0"]', "65");
    eq(L()["Squat 3×10"].sets[0], { kg: 65, r: 5 }, "onaylı setin kilosu düzeltilir");

    /* özet ekranı hepsini gösterir */
    woDone = true; drawWO();
    eq(woEl.querySelectorAll(".wo-sum:not(.skip)").length, 4);
    closeWorkout();
    ok(app.querySelector("h2 .count").textContent.includes("4/4"), "Bugün ekranında ilerleme 4/4");
  } finally { if (woEl) closeWorkout(); trainReset(); }
});

test("kısa yol: saate göre öğün, sıraya göre dilim; yapılan iş atlanır, iş kalmadıysa düğme yok", () => {
  const M3 = ["kahvalti", "ara", "aksam"];
  const pick = (hour, o) => shortcutPick({ today: true, hour, meals: M3, logged: [], train: "none", ...o });
  const slot = (h, o) => { const p = pick(h, o); return p && p.kind === "meal" ? p.slot : p && p.kind; };
  /* öğünler listedeki sıraya göre 05:00-22:00 arasına eşit dağılır */
  eq(slot(4.9), null, "gece öğün yok");
  eq([5, 7, 10].map(h => slot(h)), ["kahvalti", "kahvalti", "kahvalti"]);
  eq([11, 13, 15].map(h => slot(h)), ["ara", "ara", "ara"]);
  eq([17, 19, 21.9].map(h => slot(h)), ["aksam", "aksam", "aksam"]);
  eq(slot(22), null, "22:00'den sonra yok");
  /* öğün sayısı değişince dilimler de değişir */
  const five = h => slot(h, { meals: ["a", "b", "c", "d", "e"] });
  eq([5, 8, 9, 12, 14, 16, 18, 21].map(five), ["a", "a", "b", "c", "c", "d", "d", "e"]);
  eq(slot(12, { meals: ["tek"] }), "tek");
  eq(slot(12, { meals: [] }), null);
  /* günlüğü dolu öğün atlanır: antrenman gününde antrenmana geçer */
  eq(slot(8, { logged: ["kahvalti"] }), null, "iş yoksa gizlenir");
  eq(slot(8, { logged: ["kahvalti"], train: "todo" }), "train");
  eq(slot(8, { train: "todo" }), "kahvalti", "önce o saatin öğünü");
  eq(slot(13, { logged: ["ara"], train: "todo" }), "train");
  eq(slot(13, { logged: ["kahvalti", "aksam"], train: "todo" }), "ara", "başka öğünün kaydı bu öğünü saklamaz");
  /* antrenman bitti ya da bugün antrenman yok */
  eq(slot(13, { logged: ["ara"], train: "done" }), null);
  eq(slot(13, { logged: ["ara"], train: "none" }), null);
  /* antrenman uygun saatte */
  eq(slot(5.5, { meals: [], train: "todo" }), null, "çok erken");
  eq(slot(6, { meals: [], train: "todo" }), "train");
  eq(slot(21.9, { logged: ["aksam"], train: "todo" }), "train");
  eq(slot(22.5, { logged: ["aksam"], train: "todo" }), null);
  /* geçmiş günde ya da program yokken çıkmaz */
  eq(pick(8, { today: false }), null);
  eq(shortcutPick(null), null);
  /* sonuç metin içermez */
  eq(Object.keys(pick(8)).sort(), ["kind", "slot"]);
});

test("kısa yol: bağlam kayıttan okunur; düğme yalnızca bugün çıkar; öğün düğmesi günlüğün besin panelini açar", async () => {
  try {
    const program = await trainFx(true);
    const entry = state.days[today()];
    const ses = program.training.days.find(d => d.wd === isoWeekday(today()));
    eq(shortcutCtx(entry, program, today()).train, "todo");
    entry.lifts = Object.fromEntries(exercisesOf(ses).map(n => [n, { t: "ok", ok: 1 }]));
    eq(shortcutCtx(entry, program, today()).train, "done");
    delete entry.lifts; entry.free = { k: "walk", min: 20, note: null };
    eq(shortcutCtx(entry, program, today()).train, "done", "serbest antrenman da sayılır");
    delete entry.free;
    const ids = userMeals().map(m => m.id);
    eq(shortcutCtx(entry, program, today()).meals, ids, "öğün listesinden, sırayla");
    entry.log = [{ id: 1, n: "Yulaf", g: 50, p: 5, c: 30, f: 3, lif: 3, slot: ids[0] }];
    eq(shortcutCtx(entry, program, today()).logged, [ids[0]]);
    delete entry.log;
    eq(shortcutCtx(entry, program, today()).today, true);
    eq(shortcutCtx(entry, program, shiftDays(today(), -1)).today, false);

    const real = shortcutPick;
    try {
      /* öğün düğmesi: adı kullanıcının öğün listesinden gelir */
      shortcutPick = () => ({ kind: "meal", slot: ids[1] });
      tab = "today"; render();
      const b = app.querySelector("#today-sc");
      ok(b && b.textContent.includes(slotLabel(ids[1])) && b.textContent.includes("ekle"), "düğme: " + (b && b.textContent));
      eq(app.querySelectorAll("#today-sc").length, 1, "tek düğme");
      eq(a11yBad("bugün kısa yol"), []);
      b.onclick();
      await new Promise(r => setTimeout(r, 400));
      eq([tab, mealTab, addOpen], ["meals", "log", ids[1]]);
      ok(app.querySelector("#food-q"), "besin ekleme paneli açık");
      addOpen = null; resetMealUI();

      /* antrenman düğmesi antrenman modunu açar */
      shortcutPick = () => ({ kind: "train" });
      tab = "today"; render();
      const t = app.querySelector("#today-sc");
      ok(t && t.textContent.trim() === "Antrenmanı başlat");
      t.onclick();
      ok(woEl, "antrenman modu açıldı");
      closeWorkout();
    } finally { shortcutPick = real; }

    /* geçmiş günde düğme çıkmaz (gerçek karar işleviyle) */
    viewDate = shiftDays(today(), -1); ensureDay(viewDate); tab = "today"; render();
    ok(!app.querySelector("#today-sc"), "geçmiş günde kısa yol yok");
  } finally { if (woEl) closeWorkout(); addOpen = null; trainReset(); }
});

test("antrenman: yeni ekranlar İngilizcede tam çevrilir ve erişilebilir", async () => {
  try {
    await withLang("en", async () => {
      const program = await trainFx(false);
      I18N_MISSING.clear();
      tab = "plan"; planTab = "today"; render();
      ok(app.querySelector("main section h2").textContent.startsWith("Rest today · Next: "), app.querySelector("main section h2").textContent);
      ok(app.querySelector("#free-open").textContent.trim() === "Add a free workout");
      eq([...app.querySelectorAll("[data-plan-tab]")].map(b => b.textContent.trim()), ["Today", "Plan", "How to"]);
      freeOpenKey = today(); render();
      eq(a11yBad("en dinlenme"), []);
      freeOpenKey = null;
      await trainFx(true);
      tab = "plan"; planTab = "today"; render();
      ok(app.querySelector("#wo-start").textContent.trim() === "Start workout");
      eq(a11yBad("en bugün"), []);
      planTab = "how"; howOpen = "squat"; render();
      eq(a11yBad("en program"), []);
      const real = shortcutPick;
      try {
        shortcutPick = () => ({ kind: "meal", slot: userMeals()[0].id });
        tab = "today"; render();
        ok(/^Add /.test(app.querySelector("#today-sc").textContent.trim()), app.querySelector("#today-sc").textContent);
      } finally { shortcutPick = real; }
      tab = "settings"; meTab = "chart"; render();
      ok(app.querySelector(".prs") || app.innerHTML.includes("Personal records"));
      eq([...I18N_MISSING], [], "İngilizce karşılığı olmayan metinler");
    });
  } finally { trainReset(); meTab = "body"; }
});

/* ---- haftanın takımyıldızı (1.11.0) ---- */
/* Programsız profil; full(k) günü eksiksiz, part(k) suyu eksik doldurur. Testler geçmiş haftaları kullanır
   ki haftanın hangi günü çalıştığı fark etmesin. */
const skyFx = async () => {
  state = await loadFixture(); migrateMeals(); notice = null; viewDate = null;
  state.profile.noPlan = true; state.days = {}; delete state.sky; delete state.skyClosed;
  calcReset();
  const p = buildProgram(state.profile, 82, state.adjustment || 0);
  const full = k => { state.days[k] = { weight: 82, sleep: 8, kcal: p.kcal, water: p.water, tasks: [] }; calcReset(); };
  const part = k => { state.days[k] = { weight: 82, sleep: 8, kcal: p.kcal, tasks: [] }; calcReset(); };
  return { p, full, part, cw: weekStart(today()) };
};
const skyDone = () => {
  document.querySelectorAll(".sheet-bg").forEach(e => e.remove());
  viewDate = null; tab = "today"; meTab = "body"; state = null;
};
const skyDom = s => { const d = document.createElement("div"); d.innerHTML = s; return d; };

/* n tam gün, son günü bugünden endOff gün önce biter; ilk günden başlayarak takımyıldız ilerler. */
const skyLit = (full, n, endOff = 1) => Array.from({ length: n }, (_, i) => { const k = shiftDays(today(), -endOff - (n - 1 - i)); full(k); return k; });
const skyStamp = k => { state.days[k] = { weight: 82, tasks: [], star: true }; calcReset(); };

test("takımyıldız: 9 gerçek takımyıldız; her biri kendi yıldız sayısında, geçerli çizgilerle, ayları kapsar", () => {
  eq(CONSTELLATIONS.map(c => c.n), ["Büyük Ayı","Kassiopeia","Kuğu","Kartal","Orion","İkizler","Aslan","Akrep","Kanatlı At"]);
  eq(new Set(CONSTELLATIONS.map(c => c.id)).size, 9, "kimlikler tekil");
  const N = Object.fromEntries(CONSTELLATIONS.map(c => [c.id, c.p.length]));
  eq(N, { buyukayi: 7, kassiopeia: 5, kugu: 6, kartal: 7, orion: 8, ikizler: 8, aslan: 9, akrep: 12, pegasus: 8 }, "gerçek yıldız sayıları");
  for (const c of CONSTELLATIONS){
    eq(c.s.length, c.p.length);
    for (const [x, y] of c.p) ok(x >= 4 && x <= SKY_W - 4 && y >= 4 && y <= SKY_H - 4, `${c.id} kutunun dışında: ${x},${y}`);
    for (let i = 0; i < c.p.length; i++) for (let j = i + 1; j < c.p.length; j++){
      ok(Math.hypot(c.p[i][0] - c.p[j][0], c.p[i][1] - c.p[j][1]) >= 6, `${c.id}: ${i} ile ${j} üst üste`);
    }
    const seen = new Set();
    for (const [a, b] of c.e){
      ok(Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b >= 0 && a < c.p.length && b < c.p.length && a !== b, `${c.id} geçersiz çizgi ${a}-${b}`);
      const k = Math.min(a, b) + "-" + Math.max(a, b);
      ok(!seen.has(k), `${c.id} çizgi iki kez: ${k}`); seen.add(k);
    }
    const reach = new Set([0]);
    for (let r = 0; r < c.p.length; r++) for (const [a, b] of c.e){ if (reach.has(a)) reach.add(b); if (reach.has(b)) reach.add(a); }
    eq(reach.size, c.p.length, c.id + " şekli kopuk");
    ok(STARBOARD_EN[c.n], c.n + " İngilizcesi");
    ok(c.m.length >= 3 && c.m.every(m => m >= 1 && m <= 12), c.id + " ayları");
  }
  /* her ay akşam gökyüzünde en az iki seçenek var */
  for (let m = 1; m <= 12; m++) ok(CONSTELLATIONS.filter(c => c.m.includes(m)).length >= 2, "ay " + m);
  /* gerçek şekle sadakat: Orion'un kemeri üç yıldız, doğrusal; Betelgeuse üstte, Rigel altta */
  const o = constById("orion").p, [m3, m4, m5] = [o[3], o[4], o[5]];
  const cross = (m4[0] - m3[0]) * (m5[1] - m3[1]) - (m4[1] - m3[1]) * (m5[0] - m3[0]);
  ok(Math.abs(cross) < 0.2 * Math.hypot(m5[0] - m3[0], m5[1] - m3[1]) * 8, "Orion kemeri doğrusal");
  ok(o[0][1] < m4[1] && o[7][1] > m4[1], "Betelgeuse kemerin üstünde, Rigel altında");
  /* Büyük Ayı: kepçenin dört yıldızı kapalı bir kutu, sap kutunun bir köşesinden çıkar */
  const b = constById("buyukayi");
  ok(b.e.some(([x, y]) => (x === 6 && y === 3) || (x === 3 && y === 6)), "kepçe kapanır");
  /* Kassiopeia W: çizgi sırası zikzak */
  const k = constById("kassiopeia").p, zig = [1, 2, 3].map(i => Math.sign(k[i][1] - k[i - 1][1]));
  ok(zig[0] * zig[1] < 0 && zig[1] * zig[2] < 0, "Kassiopeia W biçiminde");
});

test("takımyıldız: mevsime göre seçilir; kazanılmamış önce, geçen tekrar etmez, aynı girdi aynı sonuç", () => {
  for (let m = 1; m <= 12; m++){
    const k = `2026-${String(m).padStart(2, "0")}-10`, c = pickConst(k, {}, null);
    ok(c.m.includes(m), `${k}: ${c.id} bu ay akşam gökyüzünde değil`);
    ok(pickConst(k, {}, c.id).id !== c.id, "geçen tekrar etmez");
    eq(pickConst(k, {}, null).id, c.id, "aynı girdi aynı seçim");
  }
  eq(pickConst("2026-01-10", { orion: [1], ikizler: [1] }, null).id, "kassiopeia", "tek kazanılmamış");
  const used = { orion: [1, 2], ikizler: [1], kassiopeia: [1] };
  ok(["ikizler", "kassiopeia"].includes(pickConst("2026-01-10", used, null).id));
  ok(!CONSTELLATIONS.filter(c => c.m.includes(12)).some(c => c.id === "akrep"), "Akrep Aralık akşamında yok");
  eq(pickConst("2026-11-10", {}, null).m.includes(11), true);
});

test("takımyıldız: her tam gün sıradaki yıldızı yakar; şekil tamamlanınca sıradaki başlar; hafta sınırı yok", async () => {
  try {
    const { full, part } = await skyFx();
    const c0 = skyRuns()[0].c, N = c0.p.length;
    eq(skyRuns().length, 1, "boş kayıtta tek, boş seri");
    eq([skyNow().n, skyNow().done], [0, false]);
    /* hafta sınırını aşan günler: bir hafta öncesine uzanan N-2 gün */
    const days = skyLit(full, N - 2);
    let R = skyNow();
    eq([R.days, R.n, R.done, R.c.id], [days, N - 2, false, skyRuns()[0].c.id]);
    const lv = runLv(R);
    eq(lv.slice(0, N - 2), Array(N - 2).fill(1));
    ok(lv[N - 2] === 0 || (lv[N - 2] > 0 && lv[N - 2] < 1), "bugünün yıldızı henüz sönük ya da kısmi");
    eq(lv[N - 1], null, "gelmemiş yıldız halka");
    part(today());
    ok(runLv(skyNow())[N - 2] > 0 && runLv(skyNow())[N - 2] < 1, "kısmi gün oranıyla parlar: " + dayRatio(today()));
    eq(runToday(skyNow()), N - 2, "bugünün yıldızı sıradaki");
    /* iki gün daha: tamamlanır (dünden bir gün önceye sığmaz, bu yüzden bugün damgalanır) */
    skyStamp(shiftDays(today(), -N - 5)); skyStamp(today());
    const runs = skyRuns();
    eq(runs.length, 2, "ikinci seri başladı");
    eq([runs[0].done, runs[0].n, runs[0].days.length], [true, N, N]);
    eq(runs[0].end, today());
    eq([runs[1].n, runs[1].done], [0, false]);
    ok(runs[1].c.id !== runs[0].c.id, "tekrar etmez");
    eq(skyNow(), runs[0], "bugün tamamlanan, yarına kadar ekranda kalır");
    eq(runToday(skyNow()), N - 1, "bugünün yıldızı sonuncu");
    delete state.days[today()]; skyStamp(shiftDays(today(), -1)); calcReset();
    ok(skyNow().n <= N, "gün silinince geri sayılır");
    /* tam gün olmayan gün sayılmaz */
    eq(skyRuns().flatMap(r => r.days).every(k => fullDay(k)), true);
  } finally { skyDone(); }
});

test("takımyıldız: eski kayıt (state.sky, skyClosed) silinmez, okunmaya devam eder; yeni model eski haftalık adlara bağlı değil", async () => {
  try {
    const { full, cw } = await skyFx();
    const old = shiftDays(cw, -14);
    for (let i = 0; i < 5; i++) full(shiftDays(old, i));
    state.sky = { [old]: "lale", [shiftDays(old, 7)]: "kandil", [cw]: "yay" };
    state.skyClosed = shiftDays(cw, -7);
    const snap = () => JSON.stringify({ sky: state.sky, skyClosed: state.skyClosed, old: Object.keys(state.days).filter(k => k < today()).map(k => state.days[k]) });
    const before = snap();
    eq(weekInfo(old).n, 5, "hafta sayacı eski günlerden okunur");
    eq(weekInfo(old).done, true);
    ok(skyNow() && skyRuns().length >= 1, "eski günler yeni modelde yıldız olur");
    eq(skyRuns()[0].days.length, Math.min(5, skyRuns()[0].c.p.length));
    tab = "today"; render();
    ok(app.querySelector("#wk-open"), "şerit eski kayıtla çizilir");
    openSky();
    document.querySelectorAll(".sheet-bg").forEach(e => e.remove());
    eq(snap(), before, "eski kayıt çizimle değişmez");
    eq(legacyConst(old).id, LEGACY_SKY_IDS[seedOf(old) % 14]);
    eq(LEGACY_SKY_IDS.length, 14);
  } finally { skyDone(); }
});

test("takımyıldız: tam şema; yanan yıldıza ve bugünün yıldızına dokunulur, kalan yıldız sayısı yazar", async () => {
  try {
    const { full } = await skyFx();
    const days = skyLit(full, 3), N = skyRuns()[0].c.p.length;
    tab = "today"; render();
    ok(!app.querySelector(".sky-b"), "Bugün ekranında yıldız düğmeleri yok (şema pencerede)");
    const R = skyNow(), name = constName(R.c);
    const sw = openSky();
    eq(sw.querySelector("#sw-t").textContent, name);
    const bs = [...sw.querySelectorAll(".sky-stage .sky-b")];
    eq(bs.map(b => b.dataset.skyDay), [...days, today()], "yanan üç yıldız ve bugünün yıldızı");
    for (const b of bs) ok(b.getAttribute("aria-label") === `${prettyDate(b.dataset.skyDay)} · ${weekdayName(b.dataset.skyDay)}`, b.getAttribute("aria-label"));
    eq(sw.querySelector(".sky-s").textContent, `3/${N} yıldız`);
    const note = sw.querySelector(".sky-note").textContent;
    ok(note.includes(name) && note.includes("belirecek") && note.includes(String(N - 3)), note);
    eq(sw.querySelector(".sky-n b").textContent, String(streakNow()), "seri pencerede");
    eq(sw.querySelectorAll(".atl").length, 9, "atlas pencerede");
    eq(a11yBad("takımyıldız şeması"), []);
    for (const b of sw.querySelectorAll("button")) ok((b.getAttribute("aria-label") || b.textContent).trim(), "pencerede adsız düğme");
    bs[1].click();
    ok(document.querySelector("#sd-go") && document.querySelector("#sd-t").textContent.includes(prettyDate(days[1])), "yıldız günün hedeflerini açar");
  } finally { skyDone(); }
});

test("takımyıldız: yıldıza dokununca günün hedefleri tamam/eksik; O güne git günü açar", async () => {
  try {
    const { part } = await skyFx();
    const k = shiftDays(today(), -1);
    part(k);
    const sc = dayScore(k);
    openSkyDay(k);
    const sh = [...document.querySelectorAll(".sheet-bg")].pop();
    ok(sh && sh.querySelector("#sd-t").textContent.includes(prettyDate(k)), "pencere açılmadı");
    eq(sh.querySelectorAll(".sd-l li").length, sc.total);
    eq(sh.querySelectorAll(".sd-l li.ok").length, sc.done);
    eq([...sh.querySelectorAll(".sd-l li:not(.ok) i")].map(x => x.textContent), ["eksik"]);
    sh.querySelector("#sd-go").click();
    eq([viewDate, tab], [k, "today"]);
    document.querySelectorAll(".sheet-bg").forEach(e => e.remove());
    const n = document.querySelectorAll(".sheet-bg").length;
    openSkyDay(shiftDays(today(), 1));
    eq(document.querySelectorAll(".sheet-bg").length, n, "gelecek gün açılmaz");
    viewDate = null; render();
    /* tam şemadaki bugünün yıldızından: gün penceresi üstte açılır, O güne git ikisini de kapatır */
    const sw = openSky();
    sw.querySelector(`.sky-b[data-sky-day="${today()}"]`).click();
    ok(document.querySelector(".sheet-bg #sd-go"), "bugünün yıldızı da açılır");
    eq(document.querySelectorAll(".sheet-bg[data-sky]").length, 2, "tam şema altta kalır");
    document.querySelector("#sd-go").click();
    await new Promise(r => setTimeout(r, 300));
    eq(document.querySelectorAll(".sheet-bg[data-sky]").length, 0, "O güne git bütün pencereleri kapatır");
  } finally { skyDone(); }
});

test("takımyıldız: yıldız düğmesi basılıyken yerinden kaymaz (button:active transform'u konumu bozmaz)", async () => {
  const css = await fetch("../starboard-site/css/components.css").then(r => r.text());
  const rule = css.match(/\.sky-b\{[^}]*\}/)[0];
  ok(!/transform/.test(rule), "konum transform ile verilmemeli: " + rule);
  ok(/aspect-ratio:1/.test(rule), "düğme kare");
  ok(/\.sky-b:active\{transform:none/.test(css), "basılı düğme kaymaz");
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  try {
    const { full } = await skyFx(); skyLit(full, 4); tab = "today"; render();
    const sw = openSky(), R = skyNow();
    const stg = sw.querySelector(".sky-stage").getBoundingClientRect();
    for (const b of sw.querySelectorAll(".sky-stage .sky-b")){
      ok(!/transform/.test(b.getAttribute("style")), "satır içi transform yok");
      const cs = getComputedStyle(b), r = b.getBoundingClientRect();
      const i = [...b.parentNode.querySelectorAll(".sky-b")].indexOf(b), [x, y] = R.c.p[i];
      ok(Math.abs(r.width - r.height) < 1, "düğme kare");
      ok(r.width / stg.width * SKY_W >= 19 && r.width / stg.width * SKY_W <= 46.5, "boyut (46 birimi aşmaz): " + r.width);
      eq(cs.transform, "none");
      ok(Math.abs(r.left + r.width / 2 - (stg.left + stg.width * x / SKY_W)) < 1.5, "yatay merkez yıldızın üstünde");
      ok(Math.abs(r.top + r.height / 2 - (stg.top + stg.height * y / SKY_H)) < 1.5, "dikey merkez yıldızın üstünde");
    }
  } finally { st.remove(); skyDone(); }
});

test("şerit: Bugün ekranının en üstü devam eden takımyıldız ve son yedi gün; şekil tam şemayı, günler hedefleri açar", async () => {
  try {
    const { full } = await skyFx();
    skyLit(full, 3);
    tab = "today"; render();
    const main = app.querySelector("main"), box = app.querySelector(".wk-sky"), fig = app.querySelector("#wk-open");
    ok(box && main.firstElementChild === box, "şerit sayfanın en üstünde");
    eq(fig.tagName, "BUTTON");
    ok(fig.getAttribute("aria-haspopup") === "dialog", "pencere açtığı bildirilir");
    ok(!app.querySelector("[data-wk], section.sky, .sky-b, .atlas"), "eski gün düğmeleri, büyük kart ve atlas yok");
    const R = skyNow(), N = R.c.p.length;
    eq(fig.getAttribute("aria-label"), `${constName(R.c)}, 3/${N} yıldız`);
    eq(fig.querySelectorAll(".sk-s, .sk-d, .sk-f").length, N, "şeklin bütün yıldızları");
    eq(fig.querySelectorAll(".sk-s.on").length, 3, "yanan yıldızlar");
    eq(fig.querySelectorAll(".sk-l").length, R.c.e.length, "şeklin çizgileri");
    eq(fig.querySelectorAll(".sk-today").length, 1, "bugünün yıldızı halkalı");
    ok(fig.textContent.includes(`3/${N}`), "ilerleme yazısı");
    /* son yedi gün: bugün sağda, her biri ayrı düğme */
    const chips = [...box.querySelectorAll(".wk-d .wk-day")];
    eq(chips.length, 7);
    eq(chips.map(b => b.dataset.skyDay), Array.from({ length: 7 }, (_, i) => shiftDays(today(), i - 6)));
    eq(chips.filter(b => b.classList.contains("now")).map(b => b.dataset.skyDay), [today()], "bugün belirgin");
    eq(chips.filter(b => b.classList.contains("on")).length, 3, "tam günlerin harfi yanık");
    for (const b of chips) ok(/^\S+: yüzde \d+$/.test(b.getAttribute("aria-label")), b.getAttribute("aria-label"));
    ok(!fig.contains(chips[0]) && chips.every(b => b.tagName === "BUTTON"), "günler şeklin içinde değil, ayrı düğme");
    const css = await fetch("../starboard-site/css/app.css").then(r => r.text());
    ok(/\.wk-fig \.sky-svg\{height:68px/.test(css), "şekil 68 px yüksekliğinde");
    eq(a11yBad("takımyıldız şeridi"), []);
    /* bir güne dokununca o günün hedefleri */
    chips[4].click();
    ok(document.querySelector("#sd-t").textContent.includes(prettyDate(chips[4].dataset.skyDay)), "gün penceresi");
    document.querySelectorAll(".sheet-bg").forEach(e => e.remove());
    /* geçmiş günde de aynı şerit; Bugüne dön bağlantısı kalır */
    viewDate = shiftDays(today(), -1); ensureDay(viewDate); render();
    ok(app.querySelector("#wk-open") && app.querySelector("#back-today"), "geçmiş günde şerit ve Bugüne dön");
    viewDate = null; render();
    ok(!document.querySelector(".sheet-bg"), "pencere kendiliğinden açılmaz");
    app.querySelector("#wk-open").click();
    const sw = document.querySelector('.sheet-bg[data-sky="sw"]');
    ok(sw, "şekle dokununca tam şema açılır");
    eq(sw.querySelector("#sw-t").textContent, constName(R.c));
    eq(sw.querySelectorAll(".sky-stage .sky-b").length, 4, "yanan üç yıldız ve bugünün yıldızı dokunulur");
    ok(!/hafta/.test(app.querySelector("#gh-cal").textContent) && app.querySelector("#gh-cal").textContent.includes(`3/${N} yıldız`), "Bugün başlığında haftalık sayaç yok, takımyıldız ilerlemesi var: " + app.querySelector("#gh-cal").textContent);
    ok(sw.querySelector(".sky-n b"), "seri pencerede");
    ok(!app.querySelector(".sky-n, .sky-note"), "seri ve ilerleme satırı Bugün ekranında yok");
  } finally { skyDone(); }
});

test("pencere: Escape hafta penceresini kapatır", async () => {
  try {
    const { full, cw } = await skyFx();
    full(cw); tab = "today"; render();
    const sw = openSky();
    const ev = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    document.activeElement.dispatchEvent(ev);
    ok(ev.defaultPrevented, "Escape ele alınmalı");
    ok(sw.classList.contains("out") || !sw.isConnected, "pencere kapanmalı");
    await new Promise(r => setTimeout(r, 300));
    ok(!sw.isConnected, "pencere kaldırılmalı");
    ok(!document.querySelector(".sheet-bg"), "açık pencere kalmamalı");
  } finally { skyDone(); }
});

test("pencere: açık pencere yokken Escape hata vermez", () => {
  document.querySelectorAll(".sheet-bg").forEach(e => e.remove());
  const errs = [];
  const onErr = e => errs.push(e.message);
  window.addEventListener("error", onErr);
  try {
    const ev = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    document.body.dispatchEvent(ev);
    ok(!ev.defaultPrevented, "Escape ele alınmamalı");
    ok(!document.querySelector(".sheet-bg"), "pencere açılmamalı");
    eq(errs, [], "hata olmamalı");
  } finally { window.removeEventListener("error", onErr); }
});

test("şerit: gün tamamlanınca bugünün yıldızı bir kez yansır ve tek titreşim olur; ilk çizimde ve tekrar çizimde olmaz", async () => {
  const realHaptic = haptic, calls = [];
  haptic = k => calls.push(k);
  try {
    const { p, full, part } = await skyFx();
    /* bugünün proteini de yazılı olsun: tam gün için kayıt gerekir */
    const fullToday = () => { full(today()); const e = state.days[today()]; e.log = [{ id: 1, k: "yulaf", n: "Deneme", g: 100, p: p.protein, c: Math.round((p.kcal - 4 * p.protein) / 4), f: 0, lif: 0, v: [], i: "grain", slot: slotList()[0][0] }]; syncKcal(e); calcReset(); };
    _starPrev.k = null; goalRow.buzz = false; skyStrip.buzz = false;
    Object.keys(_doneSeen).forEach(k => delete _doneSeen[k]);
    part(today());
    tab = "today"; render();
    ok(!fullDay(today()), "gün henüz tamam değil");
    ok(!app.querySelector(".sk-flash"), "tamam olmayan günde yansıma yok");
    eq(calls, []);
    fullToday();
    ok(fullDay(today()), "gün tamam sayılmalı: " + JSON.stringify(skyDayGoals(today())));
    render();
    eq(app.querySelectorAll("#wk-open .sk-flash").length, 1, "bugünün yıldızı yansır");
    ok(app.querySelector("#wk-open .sk-flash").closest(".sk-s"), "yıldızın içinde");
    eq(calls, ["success"], "tek titreşim (hedefin kendi titreşimi ayrıca eklenmez)");
    eq(goalRow.buzz, false);
    render();
    ok(!app.querySelector(".sk-flash"), "tekrar çizimde yansımaz");
    eq(calls, ["success"], "ikinci titreşim yok");
    /* oturumun ilk çizimi gün zaten tamamsa yansımaz */
    _starPrev.k = null; render();
    ok(!app.querySelector(".sk-flash") && calls.length === 1, "açılışta yansıma ve titreşim yok");
    /* gün bozulup yeniden tamamlanırsa yine yansır */
    part(today()); render();
    ok(!fullDay(today()) && !app.querySelector(".sk-flash"));
    fullToday(); render();
    ok(app.querySelector(".sk-flash") && calls.length === 2, "yeniden tamamlanınca yine yansır");
    const comp = await fetch("../starboard-site/css/components.css").then(r => r.text());
    const app_ = await fetch("../starboard-site/css/app.css").then(r => r.text());
    ok(/\.sk-flash\{[^}]*opacity:0/.test(comp), "yansıma yalnızca animasyonla görünür");
    ok(/prefers-reduced-motion: reduce\)\{\s*\*\{transition:none !important;animation:none !important\}/.test(app_), "azaltılmış harekette animasyon kapalı");
  } finally { haptic = realHaptic; skyDone(); }
});

test("atlas: tam şemada 9 takımyıldız, kazanılanlar sayılır; dokununca kazanıldığı tarihler; Grafikler'de yok", async () => {
  try {
    const { full } = await skyFx();
    const c0 = skyRuns()[0].c, N = c0.p.length;
    const days = skyLit(full, N, 3);
    calcReset();
    const E = skyEarned();
    eq(Object.keys(E), [c0.id]);
    eq([E[c0.id].length, E[c0.id][0].start, E[c0.id][0].end], [1, days[0], days[N - 1]]);
    tab = "settings"; meTab = "chart"; render();
    ok(!app.querySelector(".atlas, .atl"), "Grafikler'de atlas yok");
    tab = "today"; render();
    ok(!app.querySelector(".atlas, .atl"), "Bugün ekranında atlas yok");
    const swin = openSky();
    eq(swin.querySelector(".sw-atlas h2 .count").textContent, "1 / 9");
    eq(swin.querySelectorAll(".atl").length, 9);
    eq(swin.querySelectorAll(".atl.on").length, 1);
    const card = swin.querySelector(`.atl[data-atlas="${c0.id}"]`);
    eq(card.querySelector("i").textContent, "1");
    eq(card.getAttribute("aria-label"), `${constName(c0)}, 1 kez kazanıldı`);
    const other = CONSTELLATIONS.find(c => c.id !== c0.id);
    eq(swin.querySelector(`.atl[data-atlas="${other.id}"]`).getAttribute("aria-label"), `${constName(other)}, henüz kazanılmadı`);
    card.click();
    const sh = [...document.querySelectorAll(".sheet-bg")].pop();
    eq(sh.querySelector("#at-t").textContent, constName(c0));
    eq(sh.querySelectorAll(".at-l li").length, 1);
    ok(sh.querySelector(".at-l li").textContent.includes(`${N}/${N} yıldız`));
    ok(sh.querySelectorAll(".sk-s.on").length === N, "kazanılan tam yanık");
    tab = "calendar"; render();
    ok(!app.querySelector(".atl, .sky-grid"), "takvimde eski galeri yok");
  } finally { skyDone(); }
});

test("takımyıldız tamamlanınca: bir kez çıkar, eskisi sessiz geçer, Neler yeni ile aynı anda açılmaz", async () => {
  try {
    const { full } = await skyFx();
    const c0 = skyRuns()[0].c, N = c0.p.length;
    const days = skyLit(full, N, 2);
    state.seenVersion = APP_VERSION;
    const r = skyCloseDue();
    ok(r && r.done && r.end === days[N - 1], "tamamlanan seri çıkacak");
    eq(maybeShowSkyClose(), true);
    const sh = [...document.querySelectorAll(".sheet-bg")].pop();
    eq(sh.querySelector("#wc-t").textContent, constName(c0) + " belirdi");
    eq(sh.querySelector(".wc-line").textContent, `${N}/${N} yıldız · ${rangeLabel(days[0], days[N - 1])} · 0 antrenman`);
    eq(!!sh.querySelector(".sky-svg.sk-anim"), !reduceMotion(), "kendini çizer (azaltılmış harekette çizmez)");
    eq(state.skyClosed, days[N - 1]);
    document.querySelectorAll(".sheet-bg").forEach(e => e.remove());
    eq(maybeShowSkyClose(), false, "ikinci kez çıkmaz");
    ok(!document.querySelector(".sheet-bg"));
    /* eski hafta başı tarihi (eski kayıt) yeni tamamlanmayı bastırmaz */
    state.skyClosed = shiftDays(today(), -30);
    eq(maybeShowSkyClose(), true, "eski kayıttaki kapanış tarihinden sonraki tamamlanma gösterilir");
    document.querySelectorAll(".sheet-bg").forEach(e => e.remove());
    /* iki haftadan eski tamamlanma sessizce işaretlenir */
    state.days = {}; calcReset();
    skyLit(full, N, 40); delete state.skyClosed;
    eq(maybeShowSkyClose(), false);
    ok(state.skyClosed, "işaretlendi");
    ok(!document.querySelector(".sheet-bg"));
    /* tamamlanma yokken çıkmaz */
    state.days = {}; delete state.skyClosed; calcReset(); skyLit(full, 2);
    eq(maybeShowSkyClose(), false);
    /* Neler yeni açıkken beklenir, kapanınca gelir */
    state.days = {}; calcReset(); skyLit(full, N, 2); delete state.skyClosed;
    state.seenVersion = "1.10.0";
    maybeShowWhatsNew(maybeShowSkyClose);
    ok(document.querySelector("#wn-t") && !document.querySelector("#wc-t"), "önce yalnızca Neler yeni");
    document.querySelector("#wn-ok").click();
    ok(document.querySelector("#wc-t"), "kapanınca takımyıldız penceresi");
  } finally { skyDone(); }
});

test("veri sürümü: 2 -> 3 takımyıldız kaydı; eski haftalar eski adıyla, yedekle uyumlu", async () => {
  const s = await loadFixture();
  migrateState(s);
  eq(s.v, 3);
  const cw = weekStart(today());
  const past = [...new Set(Object.keys(s.days).map(weekStart))].filter(ws => ws < cw);
  ok(past.length, "örnekte geçmiş hafta var");
  for (const ws of past) eq(s.sky[ws], legacyConst(ws).id, "eski hafta eski adla yazılır: " + ws);
  eq(s.skyClosed, shiftDays(cw, -7), "kapanış gelecek haftadan başlar");
  const before = JSON.stringify(s);
  eq(migrateState(s).changed, false);
  eq(JSON.stringify(s), before, "ikinci göç değiştirmez");
  /* sürüm 2 yedeği: bu hafta beşi tamamlamışsa adı korunur, yoksa yazılmaz */
  const b = await loadFixture();
  b.v = 2; b.starred = 1; b.days = {};
  const lit = [0, 1, 2, 3, 4, 5, 6].map(i => shiftDays(cw, i)).filter(k => k <= today());
  for (const k of lit) b.days[k] = { weight: 82, tasks: [], star: true };
  migrateState(b);
  if (lit.length >= 5) eq(b.sky[cw], legacyConst(cw).id, "bu hafta belirdiyse adı aynı kalır");
  else ok(!b.sky[cw], "bu hafta henüz belirmediyse seçim ilk açılışa kalır");
  /* dışa aktarılan yedek aynen geri yüklenir */
  const back = JSON.parse(JSON.stringify({ v: SCHEMA, state: s })).state;
  eq(migrateState(back), { changed: false, newer: false });
  eq(back.sky, s.sky);
});

test("takımyıldız: İngilizcede tam çevrilir; pencereler erişilebilir", async () => {
  try {
    await withLang("en", async () => {
      const { full } = await skyFx();
      const c0 = skyRuns()[0].c, N = c0.p.length;
      skyLit(full, N, 2);
      I18N_MISSING.clear();
      tab = "today"; render();
      ok(/^[A-Za-z ]+, \d+\/\d+ stars$/.test(app.querySelector("#wk-open").getAttribute("aria-label")), app.querySelector("#wk-open").getAttribute("aria-label"));
      ok(/^\S+: \d+ percent$/.test(app.querySelector(".wk-day").getAttribute("aria-label")), app.querySelector(".wk-day").getAttribute("aria-label"));
      eq(a11yBad("en şerit"), []);
      const sw = openSky();
      ok(/^[A-Za-z ]+$/.test(sw.querySelector("#sw-t").textContent), sw.querySelector("#sw-t").textContent);
      ok(sw.textContent.includes("Sky atlas") && sw.textContent.includes("day streak"), "atlas ve seri İngilizce");
      openAtlas(c0.id);
      openSkyDay(shiftDays(today(), -1));
      maybeShowSkyClose();
      const wc = document.querySelector("#wc-t");
      ok(wc && / appeared$/.test(wc.textContent), wc && wc.textContent);
      ok(new RegExp(`^${N}/${N} stars · .+ · 0 workouts$`).test(document.querySelector(".wc-line").textContent), document.querySelector(".wc-line").textContent);
      for (const sh of document.querySelectorAll(".sheet-bg .sheet")){
        ok(sh.getAttribute("aria-labelledby") && sh.querySelector("#" + sh.getAttribute("aria-labelledby")), "pencere başlığı");
        for (const b of sh.querySelectorAll("button")) ok((b.getAttribute("aria-label") || b.textContent).trim(), "adsız düğme");
      }
      eq([...I18N_MISSING], [], "İngilizce karşılığı olmayan metinler");
    });
  } finally { skyDone(); }
});
test("C-08: günlük kilo kg ve lb olarak doğrulanır, bozuk kilo hedefleri bozmaz", async () => {
  const previous = state;
  const originalRender = render;
  try {
    state = await loadFixture();
    render = () => {};
    const entry = state.days["2026-11-11"];
    for (const [units, min, max] of [["metric", 30, 200], ["imperial", 60, 440]]){
      state.profile.units = units;
      app.innerHTML = goalEditor("weigh", entry, null);
      wireDailyWeight(entry);
      const el = app.querySelector("#i-weight");
      const err = app.querySelector("#i-weight-err");
      const enter = async value => { el.value = value; await el.onchange(); };
      const before = entry.weight;
      for (const invalid of ["-80", "0", String(min - 1), String(max + 1), "10000", "80kg", "abc", "NaN"]){
        await enter(invalid);
        eq(entry.weight, before, invalid);
        eq(el.getAttribute("aria-invalid"), "true");
        ok(err.textContent.includes(String(min)) && err.textContent.includes(String(max)));
      }
      for (const valid of [String(min), String(max), "80,5", "81.5"]){
        await enter(valid);
        eq(entry.weight, wSave(Number(valid.replace(",", "."))));
        eq(el.getAttribute("aria-invalid"), null);
        eq(err.textContent, "");
      }
      await enter("");
      ok(!Object.hasOwn(entry, "weight"), "boş alan ölçümü kaldırmalı");
      entry.weight = 82;
    }
    for (const weight of [-80, 0, 10000, NaN, Infinity, "80"]){
      entry.weight = weight;
      const program = currentProgram();
      for (const k of ["protein", "water", "kcal", "fat", "carb"])
        ok(Number.isFinite(program[k]) && program[k] >= 0, k + " hedefi");
    }
    state.profile.startWeight = NaN;
    eq(buildProgram(state.profile, NaN, NaN).water, 2450);
  } finally {
    render = originalRender; state = previous; calcReset(); app.innerHTML = "";
  }
});

test("C-07 / D-03 / D-01: özel besin alanları doğrulanır, geçerli besin kaydedilir", async () => {
  await openAddPanel();
  try {
    app.querySelector("#custom-toggle").onclick();
    const $ = id => app.querySelector("#cf-" + id);
    $("n").value = "Deneme";
    const before = JSON.stringify(state.customFoods);
    const reject = async field => {
      await $("save").onclick();
      ok($("err").textContent && $("err").getAttribute("role") === "alert");
      eq($(field).getAttribute("aria-invalid"), "true");
      eq(JSON.stringify(state.customFoods), before);
    };
    await reject("p");
    ok($("err").textContent.includes("Protein, karbonhidrat ve yağı"));
    for (const [p, c, f, l, invalid] of [
      [-10, 30, 10, 2, "p"], [10, 30, 10, -3, "l"], [10, 30, 200, 2, "f"],
      [40, 40, 26, 2, "f"], [10, 5, 10, 7, "l"]
    ]){
      for (const [k, value] of Object.entries({ p, c, f, l })) $(k).value = value;
      await reject(invalid);
    }
    $("c").value = "30";
    await $("save").onclick();
    eq(state.customFoods[logPick], { n:"Deneme", p:10, c:30, f:10, alk:0, lif:7, i:"grain" });
    const alcoholForm = document.createElement("div");
    const pre = { n:"İçecek", p:0, c:20, f:0, alk:101, bc:"4006381333931" };
    alcoholForm.innerHTML = customFoodForm(pre);
    wireCustomForm(alcoholForm, pre);
    await alcoholForm.querySelector("#cf-save").onclick();
    eq(alcoholForm.querySelector("#cf-alk").getAttribute("aria-invalid"), "true");
    ok(!state.customFoods.bc_4006381333931);
  } finally { closeAddPanel(); }
});

test("C-01: yedek önce doğrulanır, eski sürüm yüklenirken göç eder", async () => {
  const previous = state, previousTab = tab;
  const originalConfirm = window.confirm, originalSave = saveState, originalRender = render;
  const status = document.createElement("div");
  let confirmed = 0, writes = [];
  window.confirm = () => { confirmed++; return true; };
  saveState = async s => { writes.push(JSON.stringify(s)); calcReset(); };
  render = () => {};
  try {
    const old = await loadFixture();
    state = await loadFixture();
    state.profile.name = "Mevcut kayıt";
    const original = state, before = JSON.stringify(state);
    // Dosya okumasını bellekten tamamla; test doğrulama ve göçü denetler.
    const loadText = text => importData({ text: async () => text }, status);
    const load = data => loadText(JSON.stringify(data));
    await loadText("{");
    ok(status.textContent.includes("Bu dosya okunamadı"), status.textContent);
    ok(state === original);
    eq(JSON.stringify(state), before);
    eq([confirmed, writes.length], [0, 0]);
    for (const [patch, message] of [
      [{ profile:{ ...old.profile, height:"178" } }, "Boy"],
      [{ profile:{ ...old.profile, age:0 } }, "Yaş"],
      [{ profile:{ ...old.profile, startWeight:-80 } }, "Başlangıç kilosu"],
      [{ profile:{ ...old.profile, targetWeight:301 } }, "Hedef kilo"],
      [{ profile:{ ...old.profile, goal:["maintain"] } }, "Hedef"],
      [{ days:[] }, "günlük kayıtlar"],
      [{ days:{ "2026-11-10":{ tasks:{}, weight:82 } } }, "2026-11-10"],
      [{ customFoods:{ cf_bad:{ n:"Hatalı besin", p:10, c:5, f:10, lif:7 } } }, "Hatalı besin"],
      [{ v:"1" }, "sürümü tanınmıyor"], [{ v:SCHEMA + 1 }, "daha yeni"]
    ]){
      await load({ v:1, state:{ ...old, ...patch } });
      ok(status.textContent.includes(message), status.textContent);
      ok(state === original);
      eq(JSON.stringify(state), before);
      eq([confirmed, writes.length], [0, 0]);
    }
    const customFoods = { cf_test:{ n:"Kendi besinim", p:10, c:30, f:10, lif:7, i:"grain" } };
    await load({ v:SCHEMA, state:{ ...old, v:SCHEMA, customFoods } });
    eq([state.v, state.profile.name, confirmed, writes.length], [SCHEMA, old.profile.name, 1, 1]);
    eq(state.customFoods, customFoods);
    eq(writes[0], JSON.stringify(state));
    await load({ v:1, state:old });
    eq([state.v, confirmed, writes.length], [SCHEMA, 2, 2]);
    ok(state.starred && state.sky && state.skyClosed, "eski sürüm göç etmeli");
    eq(writes[1], JSON.stringify(state));
  } finally {
    window.confirm = originalConfirm; saveState = originalSave; render = originalRender;
    state = previous; tab = previousTab; calcReset();
  }
});

window.STARBOARD_TESTS = TESTS;

test("profil: doğum tarihi, eski yaş, nötr katsayı ve ölçülmüş yağ oranı", () => {
  eq(birthDateFromParts("2000", "2", "29"), "2000-02-29");
  for (const [month, day] of [["2", "30"], ["13", "1"], ["5", "0"], ["1", "x"]])
    eq(birthDateFromParts("2000", month, day), null);
  eq(ageFromBirthDate("2000-02-29", new Date(2025, 1, 28)), 24);
  eq(ageFromBirthDate("2000-02-29", new Date(2025, 2, 1)), 25);
  eq(ageFromBirthDate("2090-01-01", new Date(2025, 2, 1)), null);
  eq(profileAge({ age:41 }), 41);
  const birthDate = shiftDays(today(), -365 * 30);
  const base = profileOf({ sex:"none", birthDate, age:15 });
  const age = ageFromBirthDate(birthDate);
  const neutral = buildProgram(base, 82, 0);
  eq(neutral.bmr, Math.round(10 * 82 + 6.25 * base.height - 5 * age - 78));
  eq(neutral.lbm, null);
  const measured = { ...base, bodyFat:20 };
  eq(buildProgram(measured, 82, 0).bmr, Math.round(370 + 21.6 * 82 * .8));
  eq(buildProgram({ ...measured, bodyFatReferenceWeight:82 }, 86, 0).lbm, 86 * .8);
  eq(buildProgram({ ...measured, birthDate:null, age:36 }, 82, 0).lbm, 82 * .8);
});
test("antrenman: yedi gün ve eski manuel günler planlanır", () => {
  eq(OB_DEFAULT_DAYS("moderate"), [1,3,5,7]);
  eq(OB_DEFAULT_DAYS("veryActive"), [1,2,3,4,5,6,7]);
  for (const days of [[], [2,6], [1,2,4,5], OB_DEFAULT_DAYS("veryActive")]){
    const p = trainingPlan(profileOf({ days }));
    eq(p.freq, days.length);
    eq(p.days.filter(d => d.b).map(d => d.wd), days);
  }
});
test("bildirim: doğum günü yılda bir, ilaç yalnız seçilen saatte", () => {
  const now = new Date(2026, 10, 19, 8);
  const st = { profile:{ birthDate:"2000-11-20", reminders:{} }, days:{} };
  eq(reminderPlan(st, null, now), []);
  st.profile.reminders = { birthday:true, medicationAt:"08:00" };
  const plan = reminderPlan(st, null, now);
  eq(plan.map(n => n.kind), ["birthday", "medication"]);
  eq(plan[0].calendar, { month:11, day:20, hour:0, minute:0, second:0 });
  eq(plan[0].at.getHours(), 0);
  eq(dayKey(plan[1].at), "2026-11-20");
  eq(dayKey(reminderPlan(st, null, new Date(2026, 10, 20, 0)).find(n => n.kind === "birthday").at), "2027-11-20");
  eq(birthdayCelebrationKey(st.profile, now), null);
  eq(birthdayCelebrationKey(st.profile, plan[0].at), "2026-11-20");
  st.profile.birthDate = "2000-02-29";
  eq(reminderPlan(st, null, now).filter(n => n.kind === "birthday").map(n => dayKey(n.at)),
    ["2027-03-01", "2028-02-29", "2029-03-01", "2030-03-01"]);
  delete st.profile.birthDate;
  eq(reminderPlan(st, null, now).map(n => n.kind), ["medication"]);
});
test("besin filtresi: tarif, hızlı liste ve sabit plan süzülür, açık arama ve geçmiş korunur", async () => {
  const old = { state, LANG };
  state = await loadFixture();
  LANG = "tr";
  try {
    const slot = userMeals()[0].id, k = today(), entry = { log:[], tasks:[] };
    state.days[k] = entry;
    mealPrefs().cuisine = "intl";
    mealPrefs().exclude = ["domates"];
    mealPrefs().fixed[slot] = [{ k:"bacon", g:30 }, { k:"domates", g:120 }];
    for (const key of ["bacon", "domates", "yulaf"]) addFoodDirect(entry, key, 100, slot);
    const before = JSON.stringify(entry);
    for (const list of [quickFoods(slot), favoriteFoods(), shoppingSuggestions().map(x => [x.k])])
      ok(!list.some(([key]) => ["bacon", "domates"].includes(key)));
    for (const key of ["bacon", "domates"]) ok(searchFoods(FOODS[key].n, 15).some(([k]) => k === key));
    const recipe = RECIPES.find(r => r.ing.some(([k]) => k === "domates"));
    ok(recipe && !visibleRecipe(recipe));
    ok(!visibleRecipe({ ing:[["bacon", 30]] }));
    ok(!automaticFoodAllowed("prosciuttoefunghipizza"));
    for (let i = 0; i < 6; i++){
      const meals = buildMeals(buildProgram(state.profile, 82, 0), i).meals;
      ok(meals.every(m => m.items.every(it => !["bacon", "domates"].includes(it.key) && (it.key || !it.text.includes("domates")))));
    }
    eq(JSON.stringify(entry), before);
    LANG = "en";
    ok(visibleRecipe({ ing:[["bacon", 30]] }));
    ok(!visibleRecipe(recipe));
  } finally { ({ state, LANG } = old); }
});

test("ölçü cetveli: sahneden ayrılan kaydırma olayı ölçüyü değiştirmez", () => {
  const prev = { ob, state };
  try {
    state = null;
    ob = { weight:70 };
    app.innerHTML = obRuler("weight", 30, 200, .5, 10, 10, 2, "kg", true);
    wireRulers(false);
    const slider = app.querySelector("[role=slider]");
    app.replaceChildren();
    slider.dispatchEvent(new Event("scroll"));
    eq(ob.weight, 70);
  } finally { ({ ob, state } = prev); }
});

test("profil kurulumu: zorunlu isim, simgesiz seçenekler ve altı ortak maskot", () => {
  const prev = ob;
  try {
    const step = OB_STEPS.find(s => s.id === "you");
    ob = { ...obDefaults(), sex:"none" };
    app.innerHTML = step.body();
    step.wire();
    eq(app.querySelectorAll("[data-field=sex] button").length, 3);
    eq(app.querySelectorAll("[data-field=sex] svg").length, 0);
    eq(app.querySelectorAll("[data-av]").length, 6);
    eq(avKey({ avatar:"alien", sex:"female" }), AVATARS[0][0]);
    eq(avKey({ avatar:"m", sex:"male" }), AVATARS[0][0]);
    app.querySelector('[data-av="mascot-6"]').click();
    eq(avKey(ob), "mascot-6");
    app.querySelector("#ob-name").value = "  ";
    step.read();
    eq(step.valid()[1], "ob-name");
    app.querySelector("#ob-name").value = "  Deniz  ";
    step.read();
    eq(ob.name, "Deniz");
    eq(step.valid(), "");
  } finally {
    ob = prev;
    app.replaceChildren();
  }
});

test("karşılama: logo + tek slogan, dikdörtgen bayraklar, birim menüsü ve halkalı gezegen", async () => {
  const keep = { st:state, ob, set:window.setLang, sess:sessionStorage.getItem("starboard-onb-units") };
  let asked = null;
  window.setLang = l => { asked = l; };
  try {
    state = null; ob = null; obStep = 0; app.innerHTML = "";
    renderOnboarding();
    const w = app.querySelector(".on-w");
    ok(w, "karşılama çizilmedi");
    /* Görünen yazı yalnızca slogan ve gizlilik satırı: eski özellik listesi, dil yazısı, 'Sürüm' yok. */
    const c = w.cloneNode(true);
    c.querySelectorAll(".sr-only,.fl-menu").forEach(e => e.remove());
    const txt = c.textContent.replace(/\s+/g, " ").trim();
    eq(txt, tx("Her gün, bir önceki günden daha parlak.") + " " + tx("Veriler yalnızca bu cihazda saklanır"));
    eq(tx("Her gün, bir önceki günden daha parlak."), "Her gün, bir önceki günden daha parlak.");
    eq(STARBOARD_EN["Her gün, bir önceki günden daha parlak."], "Every day, brighter than the last.");
    eq(STARBOARD_EN["Veriler yalnızca bu cihazda saklanır"], "Your data stays on this device only");
    ok(!/Sürüm|Türkçe|English|Sağlığın için/.test(txt), "eski yazılar kalmış: " + txt);
    /* iki bayrak simgesi, ikisi de adlı düğme; emoji yok */
    const flags = [...w.querySelectorAll("[data-flag]")];
    eq(flags.map(f => f.dataset.flag), ["tr", "en"]);
    ok(flags.every(f => f.querySelector("svg") && f.getAttribute("aria-label") && !f.textContent.trim()), "bayrak düğmesi simge + etiket olmalı");
    for (const flag of flags){
      const { width, height } = flag.querySelector("svg").viewBox.baseVal;
      eq(width / height, 44 / 30);
    }
    /* İngiltere bayrağı menüyü açar; seçim birim ayarına yazılır ve İngilizceye geçer */
    const menu = document.getElementById("fl-menu");
    ok(menu.hidden, "menü kapalı başlamalı");
    eq([...menu.querySelectorAll("button")].map(b => b.textContent.trim()), ["kg / cm", "lb / ft-in"]);
    w.querySelector("[data-flag=en]").click();
    ok(!menu.hidden, "bayrağa dokununca menü açılmalı");
    menu.querySelector("[data-obunit=imperial]").click();
    eq(ob.units, "imperial");
    eq(asked, "en");
    eq(sessionStorage.getItem("starboard-onb-units"), "imperial", "dil değişince birim geri gelmeli");
    ok(menu.hidden, "seçimden sonra menü kapanmalı");
    /* Türkiye bayrağı: Türkçe = metrik */
    asked = null;
    w.querySelector("[data-flag=tr]").click();
    eq(ob.units, "metric");
    eq(asked, null, "zaten Türkçe: sayfa yenilenmemeli");
    /* Yıldızlar arka planda; gezegen logoya sabit, halka diskin iki yanında. */
    const bg = document.getElementById("on-bg");
    ok(bg.classList.contains("welcome"));
    ok(bg.querySelectorAll(".sk-t").length >= 20, "yanıp sönen yıldız az");
    ok(bg.querySelector(".sk-shoot"), "kayan yıldız yok");
    ok(!bg.querySelector("canvas"));
    const planets = [...app.querySelectorAll("svg.sk-planet")];
    eq(planets.length, 1);
    const [planet] = planets;
    eq(planet.getAttribute("aria-hidden"), "true");
    ok(planet.matches(".on-w-brand > .sk-planet"));
    ok(planet.nextElementSibling.matches(".on-logo"));
    eq([...planet.children].map(part => part.getAttribute("class")), ["sk-planet-ring", "sk-planet-disc", "sk-planet-ring"]);
    const rings = [...planet.querySelectorAll(".sk-planet-ring")];
    eq(rings.map(ring => ring.children.length), [4, 4]);
    eq([...rings[0].children].map(band => band.getAttribute("stroke-width")),
      [...rings[1].children].map(band => band.getAttribute("stroke-width")));
    ok(planet.querySelector(".sk-planet-disc .mn-crater") && planet.querySelector(".sk-planet-shade"));
    /* Sürüm etiketi: 'v' + numara, 'Sürüm' kelimesi yok */
    const main = await (await fetch("../starboard-site/js/main.js")).text();
    ok(main.includes('"v" + APP_VERSION') && !main.includes('tx("Sürüm {0}", [APP_VERSION]);\n  document'), "sürüm etiketi v + numara olmalı");
    /* Sahne dosyası önbellekte ve sayfada */
    const sw = await (await fetch("../starboard-site/sw.js")).text();
    ok(sw.includes('"js/welcome-scene.js"'), "welcome-scene.js sw.js SHELL listesinde değil");
    const css = await (await fetch("../starboard-site/css/tokens.css")).text();
    for (const v of ["--sky-top", "--sky-bot", "--sky-star", "--sky-deep-op"]) ok(css.includes(v + ":"), v + " tokens.css'te yok");
    for (const v of ["--sky-planet", "--sky-planet-ring"]) ok(css.includes(v + ":"), v + " tokens.css'te yok");
  } finally {
    sceneActive(false); sceneState = null;
    window.setLang = keep.set; state = keep.st; ob = keep.ob; app.innerHTML = "";
    if (keep.sess === null) sessionStorage.removeItem("starboard-onb-units"); else sessionStorage.setItem("starboard-onb-units", keep.sess);
  }
});
