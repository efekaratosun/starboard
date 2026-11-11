"use strict";

/* ---------------- ölçüm değerlendirme ----------------
   Hesap ve ekran ayrıdır: assess() yalnızca sayıları ve durumu döndürür (metin,
   HTML ya da dil bilgisi içermez), evaluate() bunları ekrana çevirir. */

/* Bir günün ölçümlerini hedef aralıklarıyla karşılaştırır.
   Dönen her kalem: { id, value, low, high, status } — status "low" | "ok" | "high".
   Değer girilmemişse value null, status null olur; aralık biliniyorsa yine verilir.
   weight: kalori ve su hedefinin dayandığı kilo; null ise bu ikisi hesaplanamaz. */
function assess(entry, profile, program, weight, sleepRange){
  const h = profile.height / 100;
  const item = (id, value, low, high, extra) => {
    const has = typeof value === "number";
    return { id, value: has ? value : null, low, high,
      status: !has ? null : value < low ? "low" : value > high ? "high" : "ok", ...extra };
  };
  const out = [
    item("weight", entry.weight, 18.5 * h * h, 24.9 * h * h,
      { bmi: typeof entry.weight === "number" ? entry.weight / (h * h) : null }),
    item("sleep", entry.sleep, sleepRange[0], sleepRange[1])
  ];
  if (weight === null){
    out.push({ id:"kcal", value:null, low:null, high:null, status:null, unknown:true });
    out.push({ id:"water", value:null, low:null, high:null, status:null, unknown:true });
    return out;
  }
  out.push(item("kcal", entry.kcal, program.kcal * 0.9, program.kcal * 1.1, { target: program.kcal }));
  out.push(item("water", entry.water, program.water * 0.85, program.water * 1.15, { target: program.water }));
  return out;
}

function evaluate(entry, profile, program, weight){
  const names = { weight:tx("Kilo"), sleep:tx("Uyku"), kcal:tx("Kalori"), water:tx("Su") };
  return assess(entry, profile, program, weight, sleepBand()).map(a => {
    const name = names[a.id];
    if (a.unknown) return blank(name, tx("Kilo girilmeden hesaplanamaz"));
    switch (a.id){
      case "weight":
        return a.value === null ? blank(name, tx("Bugün girilmedi"))
          : bar(name, a.value.toFixed(1)+" kg", a,
              tx("BMI {0} · normal aralık {1}–{2} kg", [(a.bmi.toFixed(1)), (a.low.toFixed(0)), (a.high.toFixed(0))]));
      case "sleep":
        return a.value === null ? blank(name, tx("Bugün girilmedi"))
          : bar(name, tx("{0} saat", [(a.value.toFixed(1))]), a, tx("Senin hedefin {0}–{1} saat", [(a.low), (a.high)]));
      case "kcal":
        return a.value === null ? blank(name, tx("Hedef {0} kcal", [(a.target)]))
          : bar(name, a.value+" kcal", a,
              tx("Hedef {0} kcal · bant {1}–{2}", [(a.target), (Math.round(a.low)), (Math.round(a.high))]));
      default:
        return a.value === null ? blank(name, tx("Hedef {0} ml", [(a.target)]))
          : bar(name, a.value+" ml", a, tx("Hedef {0} ml", [(a.target)]));
    }
  });
}

function bar(name, valText, a, note){
  const { value, low, high } = a;
  const span = high - low;
  const min = low - span*0.9, max = high + span*0.9;
  const pos = clamp((value - min) / (max - min) * 100, 0, 100);
  const zl = (low - min) / (max - min) * 100, zw = span / (max - min) * 100;
  const status = a.status === "low" ? tx("Az") : a.status === "high" ? tx("Fazla") : tx("Yeterli");
  const out = a.status !== "ok";
  return `<div class="metric">
    <div class="metric-top"><span class="metric-name">${name}</span><span class="metric-val num">${valText}</span></div>
    <div class="track"><div class="zone" style="left:${zl}%;width:${zw}%"></div><div class="mark${out?" out":""}" style="left:${pos}%"></div></div>
    <div class="metric-note"><b class="${out?"out":""}">${status}</b> · ${note}</div>
  </div>`;
}

function blank(name, note){
  return `<div class="metric">
    <div class="metric-top"><span class="metric-name">${name}</span><span class="metric-val num">—</span></div>
    <div class="track"></div><div class="metric-note">${note}</div>
  </div>`;
}
