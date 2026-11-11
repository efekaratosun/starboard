"use strict";

/* ---------------- ölçüm değerlendirme ---------------- */
function evaluate(entry, profile, program, weight){
  const h = profile.height / 100;
  const out = [];

  if (typeof entry.weight === "number") {
    const bmi = entry.weight / (h*h);
    out.push(bar("Kilo", entry.weight.toFixed(1)+" kg", entry.weight, 18.5*h*h, 24.9*h*h,
      `BMI ${bmi.toFixed(1)} · normal aralık ${(18.5*h*h).toFixed(0)}–${(24.9*h*h).toFixed(0)} kg`));
  } else out.push(blank("Kilo", "Bugün girilmedi"));

  if (typeof entry.sleep === "number")
    out.push(bar("Uyku", entry.sleep.toFixed(1)+" saat", entry.sleep, sleepBand()[0], sleepBand()[1], `Senin hedefin ${sleepBand()[0]}–${sleepBand()[1]} saat`));
  else out.push(blank("Uyku", "Bugün girilmedi"));

  if (weight === null) { out.push(blank("Kalori","Kilo girilmeden hesaplanamaz")); out.push(blank("Su","Kilo girilmeden hesaplanamaz")); return out; }

  if (typeof entry.kcal === "number")
    out.push(bar("Kalori", entry.kcal+" kcal", entry.kcal, program.kcal*0.9, program.kcal*1.1,
      `Hedef ${program.kcal} kcal · bant ${Math.round(program.kcal*0.9)}–${Math.round(program.kcal*1.1)}`));
  else out.push(blank("Kalori", `Hedef ${program.kcal} kcal`));

  if (typeof entry.water === "number")
    out.push(bar("Su", entry.water+" ml", entry.water, program.water*0.85, program.water*1.15, `Hedef ${program.water} ml`));
  else out.push(blank("Su", `Hedef ${program.water} ml`));

  return out;
}

function bar(name, valText, value, low, high, note){
  const span = high - low;
  const min = low - span*0.9, max = high + span*0.9;
  const pos = clamp((value - min) / (max - min) * 100, 0, 100);
  const zl = (low - min) / (max - min) * 100, zw = span / (max - min) * 100;
  const status = value < low ? "Az" : value > high ? "Fazla" : "Yeterli";
  const out = status !== "Yeterli";
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
