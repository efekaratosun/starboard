"use strict";

/* ---------------- hedef durumu ----------------
   Hesap ve ekran ayrıdır: taskStatus() bir günün hedefini verilerle karşılaştırır ve
   yalnızca sayı ve durum döndürür; metin, HTML, dil ya da birim bilgisi içermez.
   Ekrandaki karşılığı autoInfo()'dur (today.js). Gün puanı, yıldızlar ve avatar
   doğrudan bu hesabı kullanır.

   ctx, hesabın kayıt dışından aldığı her şeydir: bugünün tarihi, saat, profil, uyku
   aralığı ve adım hedefi. Verilmezse goalCtx() geçerli kayıttan kurar; testler kendi
   ctx'lerini verebilir. */
function goalCtx(){
  return { today: today(), hour: nowHour(), profile: state.profile, sleep: sleepBand(), steps: stepGoal() };
}

/* Kalori bandı.
   Yağ kaybı: hedefin altı serbest ama güvenli sınıra kadar. Alt sınır üç
   ölçünün en yükseği: hedefin 500 kcal altı, bakım kalorisinin 1000 kcal
   altı (NICE'ın denetimsiz önerdiği en büyük açık) ve bazal metabolizmaya
   dayalı taban (erkekte 1500, kadında 1200 kcal'den az değil).
   Koruma: hedefin ±%10'u. Kas kazanımı: bakımın %5-20 üstü (Iraki ve ark. 2019).
   Dönen: { goal, G: hedef, T: bakım, lo, hi } */
function kcalRange(program, profile){
  const T = program.tdee, G = program.kcal, goal = profile.goal;
  if (goal === "lose"){
    const floor = Math.round(Math.max(program.bmr * 0.95, sexK(profile.sex, 1500, 1200)));
    return { goal, G, T, lo: Math.round(Math.max(floor, G - 500, T - 1000)), hi: Math.round(G * 1.05) };
  }
  if (goal === "gain") return { goal, G, T, lo: Math.round(T * 1.05), hi: Math.round(T * 1.20) };
  return { goal: "maintain", G, T, lo: Math.round(G * 0.9), hi: Math.round(G * 1.1) };
}

/* Bir hedefin o günkü durumu. Hedef o gün geçerli değilse null döner
   (adım hedefi yok, antrenman günü değil). Her sonuçta:
     kind, ok (hedef tamam), pct (0..1+ ilerleme), value (girilen değer; yoksa null)
   ve türe göre: target, need (işaretlenme eşiği), left (eşiğe kalan), warn (uyarı),
   state (kcal ve sleep için durum adı). */
function taskStatus(kind, entry, program, key, ctx){
  if (!kind || !program) return null;
  ctx = ctx || goalCtx();
  key = key || ctx.today;
  entry = entry || {};
  switch (kind){
    case "kcal": {
      const R = kcalRange(program, ctx.profile);
      if (typeof entry.kcal !== "number") return { kind, ...R, value: null, ok: false, pct: 0, state: "empty" };
      const v = entry.kcal;
      if (v > R.hi) return { kind, ...R, value: v, ok: false, pct: 1, warn: true, state: "over" };
      if (v < R.lo){
        /* Gün bitmeden az yemek henüz sorun değil; geçmiş günde gün zaten bitti. */
        const late = key < ctx.today || ctx.hour >= 20;
        return { kind, ...R, value: v, ok: false, pct: v / R.lo, warn: late, state: late ? "under" : "short", left: R.lo - v };
      }
      return { kind, ...R, value: v, ok: true, pct: 1, state: "ok" };
    }
    case "protein": {
      const has = !!(entry.log && entry.log.length);
      const v = has ? logTotals(entry).p : 0, target = program.protein, need = Math.round(target * 0.9);
      return { kind, value: has ? v : null, target, need, left: Math.max(need - v, 0), ok: v >= need, pct: v / need };
    }
    case "water": {
      const v = entry.water || 0, target = program.water, need = Math.round(target * 0.9);
      return { kind, value: typeof entry.water === "number" ? v : null, target, need, left: Math.max(need - v, 0), ok: v >= need, pct: v / need };
    }
    case "sleep": {
      const v = typeof entry.sleep === "number" ? entry.sleep : null;
      const [lo, hi] = ctx.sleep;
      const state = v === null ? "empty" : v > hi + 0.5 ? "long" : v < lo ? "short" : "ok";
      return { kind, value: v, lo, hi, ok: v !== null && v >= lo, pct: v === null ? 0 : v / lo,
        warn: state === "long" || (v !== null && v < lo - 1), state };
    }
    case "weigh": {
      const v = typeof entry.weight === "number" ? entry.weight : null;
      return { kind, value: v, ok: v !== null, pct: v === null ? 0 : 1, today: key === ctx.today };
    }
    case "steps": {
      const target = ctx.steps;
      if (!target) return null;
      const v = typeof entry.steps === "number" ? entry.steps : 0;
      return { kind, value: typeof entry.steps === "number" ? v : null, target, left: Math.max(target - v, 0), ok: v >= target, pct: v / target };
    }
    case "train": {
      const ses = program.training.days.find(d => d.wd === isoWeekday(key));
      if (!ses || !ses.b) return null;
      const list = exercisesOf(ses);
      const done = list.filter(x => liftHas((entry.lifts || {})[x])).length;
      return { kind, session: ses, done, total: list.length, value: done, ok: done === list.length, pct: done / list.length };
    }
  }
  return null;
}

/* Kayda yazılan görev başlığı: Türkçe ve metrik, birimden bağımsız. Tek istisna
   antrenman günü adı: programdan geldiği için o anki dilde yazılır; görevin türü
   ayrıca kind alanında durduğu için bu bir şey bozmaz.
   Ekranda bu değil autoInfo()'nun çevrilmiş başlığı görünür. */
function taskTitle(s){
  switch (s.kind){
    case "kcal":    return `Kaloriyi ${s.lo}–${s.hi} kcal arasında tut`;
    case "protein": return `${s.target} g protein al`;
    case "water":   return `${s.target} ml su iç`;
    case "sleep":   return `${s.lo}-${s.hi} saat uyu`;
    case "weigh":   return "Sabah kilo ölçümü";
    case "steps":   return `${s.target} adım at`;
    case "train":   return "Antrenman: " + s.session.t;
  }
  return "";
}
