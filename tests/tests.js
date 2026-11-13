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

/* ---- alışveriş listesi ---- */
test("alışveriş listesi: plan ve tarifler toplanır, aynı besin tek satır, işaretleme çalışır", async () => {
  state = await loadFixture(); migrateMeals(); notice = null; viewDate = null; ensureToday();
  const program = buildProgram(state.profile, 82, 0);
  const sumOf = (list, k) => (list.find(x => x.k === k) || { g:0 }).g;
  const plan = buildMeals(program, 0);
  const exp = {};
  for (const m of plan.meals) for (const it of m.items) if (it.key) exp[it.key] = (exp[it.key] || 0) + it.g;
  const one = shoppingList(program, { days:1, recipes:[], checked:{} }, 0);
  for (const [k, g] of Object.entries(exp)) eq(sumOf(one, k), Math.round(g), k);
  eq(new Set(one.map(x => x.k)).size, one.length, "aynı besin iki satırda");
  const three = shoppingList(program, { days:3, recipes:[], checked:{} }, 0);
  ok(three.reduce((a, x) => a + x.g, 0) > one.reduce((a, x) => a + x.g, 0) * 2, "3 günlük liste 1 günlükten büyük olmalı");
  const r = RECIPES[0];
  const withR = shoppingList(program, { days:0, recipes:[0], checked:{} }, 0);
  for (const [k, g] of r.ing) ok(sumOf(withR, k) >= g, "tarif malzemesi eksik: " + k);
  state.shopping = { days:1, recipes:[0], checked:{} };
  tab = "meals"; mealTab = "list"; render();
  const first = app.querySelector("[data-shop-k]");
  ok(first, "liste çizilmedi");
  await first.onclick();
  ok(state.shopping.checked[first.dataset.shopK], "işaretlenmedi");
  tab = "today"; mealTab = "log"; state = null;
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
  eq(unseenNews("1.8.0").length, 1, "aynı sürümün kayıtları tek başlıkta birleşir");
  eq(unseenNews("1.8.0")[0].items, v190.filter(n => !n.native).flatMap(n => n.items), "web'de yalnızca web maddeleri");
  ok(verCmp(WHATS_NEW[0].v, APP_VERSION) <= 0, "yenilik listesi uygulamadan ileride");
  eq(verCmp("1.10.0", "1.9.2") > 0, true);
  /* native: true maddeler yalnızca iPhone uygulamasında gösterilir; testler web'de çalışır. */
  const web = WHATS_NEW.filter(n => !n.native);
  ok(web.length < WHATS_NEW.length, "iPhone'a özel madde yok");
  eq(unseenNews(undefined).length, Math.min(3, web.length));
  eq(unseenNews(APP_VERSION), []);
  eq(unseenNews(web[0].v), [], "web'de iPhone'a özel madde gösterilmemeli");
  state = await loadFixture();
  state.seenVersion = web[1].v;
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
test("yazı tipi: Nunito uygulamanın içinden gelir, dışarıya istek yok, çevrimdışı önbellekte", async () => {
  const get = async p => { const r = await fetch("../starboard-site/" + p); ok(r.ok, p + " açılmadı"); return r.text(); };
  const [html, tokens, sw] = await Promise.all([get("index.html"), get("css/tokens.css"), get("sw.js")]);
  for (const [name, src] of [["index.html", html], ["tokens.css", tokens], ["sw.js", sw]])
    ok(!/fonts\.(googleapis|gstatic)\.com/.test(src), name + " Google Fonts'a bağlanıyor");
  const files = [...tokens.matchAll(/url\("\.\.\/(fonts\/[^"]+)"\)/g)].map(m => m[1]);
  ok(files.length >= 2, "@font-face dosyaları bulunamadı");
  for (const f of files) {
    const r = await fetch("../starboard-site/" + f);
    ok(r.ok && (await r.arrayBuffer()).byteLength > 1000, f + " yok ya da boş");
    ok(sw.includes(`"${f}"`), f + " sw.js SHELL listesinde değil");
  }
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
    for (const p of ["log", "program", "howto"]) { tab = "plan"; planTab = p; render(); check("plan:" + p); }
    for (const m of ["log", "plan", "recipes", "list"]) { tab = "meals"; mealTab = m; render(); check("meals:" + m); }
    for (const m of ["body", "chart", "set"]) { tab = "settings"; meTab = m; render(); check("me:" + m); }
    for (const g of ["kcal", "protein", "water", "sleep", "weigh", "train"]) { tab = "today"; goalOpen = g; render(); check("goal:" + g); }
    goalOpen = null; planTab = "log"; mealTab = "log"; meTab = "body";
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
  tab = "meals"; mealTab = "log"; addOpen = slotList()[0][0]; logQuery = ""; logPick = null; logCat = null; render();
};
const closeAddPanel = () => {
  document.querySelectorAll(".sheet-bg").forEach(e => e.remove());
  addOpen = null; logPick = null; logQuery = ""; logCat = null; state = null; tab = "today";
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
  eq(found.food, { n: "Nutella", br: "Ferrero", p: 6.3, c: 57.5, f: 30.9, lif: 0, serving: null });
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
    eq(rec, { n: "Nutella", p: 6.3, c: 57.5, f: 30.9, lif: 0, i: "grain", bc: "3017620422003", a: "3017620422003 Ferrero",
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
    app.querySelector("#cf-l").value = "3";
    await app.querySelector("#cf-save").onclick();
    const [k, f] = Object.entries(state.customFoods)[0];
    eq([k.startsWith("cf_"), f.n, f.p, f.c, f.f, f.lif, f.i, "bc" in f], [true, "Deneme", 10, 0, 0, 3, "grain", false]);
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
  eq(box.querySelector("#sl-c1").textContent, durTxt(440), "kadran ortası toplam uyku (aralık 8 sa 20 dk)");
  eq(hkTag(e, "sleep"), " · Sağlık'tan");
  eq(hkTag({ ...e, sleep: 8 }, "sleep"), "", "elle değişince kaynak yazılmaz");
  state = null;
});

test("sağlık: kayıt şeması değişmedi; eski kayıt profile.health olmadan açılır", async () => {
  eq(SCHEMA, 2);
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
  ok(tr.includes("Apple Sağlık (yalnızca iPhone uygulaması)") && tr.includes("Yalnızca okuma") && tr.includes("13 Kasım 2026"), "Türkçe gizlilik metni");
  ok(en.includes("Apple Health (iPhone app only)") && en.includes("Read only") && en.includes("November 13, 2026"), "İngilizce gizlilik metni");
  ok(WHATS_NEW[0].native && WHATS_NEW[0].items.some(s => s.includes("Apple Sağlık")), "Neler yeni maddesi yalnızca iPhone'da");
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
    app.querySelector("#cf-c").value = "";
    await app.querySelector("#cf-save").onclick();
    eq(state.customFoods.cf_1, { n: "Mercimek köftesi", p: 8, c: 0, f: 5, lif: 4, i: "grain" }, "boş değer 0 olur, yeni alan eklenmez");
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
    ok(favoriteFoods().some(([k]) => k === "cf_1"), "silmeden önce sık yediklerde");

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
    ok(app.textContent.includes(`${kcalBefore} / `), "günün kalorisi görünür");
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
    viewDate = null; mealTab = "plan"; render();
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

window.STARBOARD_TESTS = TESTS;
