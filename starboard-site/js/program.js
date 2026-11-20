"use strict";

/* ---------------- program hesabı ---------------- */
const ACTIVITY = {
  sedentary:{label:tx("Hareketsiz"), d:tx("masa başı, spor yok"), m:1.20},
  light:{label:tx("Az hareketli"), d:tx("haftada 1-3 gün hafif spor"), m:1.375},
  moderate:{label:tx("Orta"), d:tx("haftada 3-5 gün spor"), m:1.55},
  active:{label:tx("Aktif"), d:tx("haftada 6-7 gün spor"), m:1.725},
  veryActive:{label:tx("Çok aktif"), d:tx("günde iki antrenman ya da bedensel iş"), m:1.90}
};
const GOAL = {
  lose:{label:tx("Yağ kaybı"), m:0.82, protein:2.4, range:[-1.00,-0.35]},
  maintain:{label:tx("Koruma"), m:1.00, protein:2.0, range:[-0.30,0.30]},
  gain:{label:tx("Kas kazanımı"), m:1.12, protein:2.2, range:[0.15,0.50]}
};

/* Doğum tarihi yerel takvim günü olarak saklanır. Eski profillerde kayıtlı yaş kullanılır. */
function birthDateFromParts(year, month, day){
  if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month) || !/^\d{1,2}$/.test(day)) return null;
  const key = [year, String(month).padStart(2, "0"), String(day).padStart(2, "0")].join("-");
  const date = new Date(key + "T00:00:00");
  return !isNaN(date) && dayKey(date) === key ? key : null;
}
function ageFromBirthDate(key, now = new Date()){
  if (typeof key !== "string" || birthDateFromParts(...key.split("-")) !== key) return null;
  const date = dayKey(now);
  const year = now.getFullYear();
  const age = year - Number(key.slice(0, 4)) - (date < birthdayInYear(key, year) ? 1 : 0);
  return age >= 0 ? age : null;
}
/* 29 Şubat doğumları artık olmayan yıllarda 1 Mart’ta yaş alır. */
function birthdayInYear(key, year){
  const [month, day] = key.slice(5).split("-");
  return birthDateFromParts(String(year), month, day) || year + "-03-01";
}
const profileAge = (p, now) => ageFromBirthDate(p.birthDate, now) ?? p.age;

/* Cinsiyete bağlı sabitler. Belirtilmemişse iki değerin ortalaması kullanılır. */
const sexK = (sex, m, f) => sex === "male" ? m : sex === "female" ? f : (m + f) / 2;

/* Avatarlar: kasklı astronot hayvanlar. Anahtarlar eski uzaylılarla aynı (kayıtlı seçimler korunur);
   her anahtar rengini de korur, böylece Bugün ekranındaki renkler değişmez. Sıra = seçicideki sıra. */
const AVATARS = [["mascot-1", "Kedi", "carb"], ["mascot-6", "Tilki", "kcal"], ["mascot-4", "Panda", "good-vivid"],
  ["mascot-2", "Köpek", "water"], ["mascot-5", "Maymun", "fat"], ["mascot-3", "Koala", "protein"]]
  .map(([k, n, tone]) => [k, tx(n), tone]);
const avKey = p => AVATARS.find(a => a[0] === p.avatar)?.[0] || AVATARS[0][0];
const avColor = p => "var(--" + AVATARS.find(a => a[0] === avKey(p))[2] + ")";
const sexClass = () => "custom";

/* Yüz parçaları (64×64 çizim alanı, vizör merkezi 32,34). mood: { happy, sleepy } */
const astroEyes = (lx, rx, y, m, col = "#1B1F33") => `<g class="as-eyes">${m.sleepy && !m.happy
  ? `<path d="M${lx - 3} ${y}h6M${rx - 3} ${y}h6" stroke="${col}" stroke-width="2" stroke-linecap="round"/>`
  : m.happy
    ? `<path d="M${lx - 3} ${y + 1}q3 -4 6 0M${rx - 3} ${y + 1}q3 -4 6 0" stroke="${col}" stroke-width="2" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="${lx}" cy="${y + .4}" rx="3.4" ry="4" fill="${col}"/><ellipse cx="${rx}" cy="${y + .4}" rx="3.4" ry="4" fill="${col}"/>
       <circle cx="${lx - 1.1}" cy="${y - 1}" r="1.35" fill="#fff"/><circle cx="${rx - 1.1}" cy="${y - 1}" r="1.35" fill="#fff"/>
       <circle cx="${lx + 1.2}" cy="${y + 1.9}" r=".6" fill="#fff" opacity=".85"/><circle cx="${rx + 1.2}" cy="${y + 1.9}" r=".6" fill="#fff" opacity=".85"/>`}</g>`;
const astroBlush = (y, c = "#FF8FA8") => `<ellipse cx="22.5" cy="${y}" rx="2.6" ry="1.5" fill="${c}" opacity=".55"/><ellipse cx="41.5" cy="${y}" rx="2.6" ry="1.5" fill="${c}" opacity=".55"/>`;
const ASTRO_FACES = {
  "mascot-1": m => `<path d="M18 31 L20 17 L28 24Z M46 31 L44 17 L36 24Z" fill="#A7AEC2"/>
    <path d="M20.5 27 L21.5 20 L25.5 24Z M43.5 27 L42.5 20 L38.5 24Z" fill="#F4A6BC"/>
    <ellipse cx="32" cy="36" rx="14" ry="12.5" fill="#B9C0D3"/>
    <path d="M24 30 q2 -3 4 0 M36 30 q2 -3 4 0" stroke="#949CB2" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    ${astroEyes(26.5, 37.5, 35, m)}${astroBlush(40)}
    <path d="M30.5 39.5h3l-1.5 1.8z" fill="#F07A9B"/>
    <path d="M32 41.3q-1.6 2.2 -3.4 1 M32 41.3q1.6 2.2 3.4 1" stroke="#5B6178" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    <path d="M17 38.5h6M17.5 41.5l5.5 -1M47 38.5h-6M46.5 41.5l-5.5 -1" stroke="#7C8399" stroke-width=".8" stroke-linecap="round"/>`,
  "mascot-6": m => `<path d="M17 30 L18 15 L28 23Z M47 30 L46 15 L36 23Z" fill="#E8742C"/>
    <path d="M18.6 21 L18 15 L22.5 19Z M45.4 21 L46 15 L41.5 19Z" fill="#3A2A2A"/>
    <path d="M32 49.5 C23.5 49.5 17 43.5 17 34 C17.5 26 25 22 32 22 C39 22 46.5 26 47 34 C47 43.5 40.5 49.5 32 49.5Z" fill="#F08A3C"/>
    <path d="M32 49.5 C25.5 49.5 20.5 45.5 19.2 39.5 C23.5 41 28 41 32 44.2 C36 41 40.5 41 44.8 39.5 C43.5 45.5 38.5 49.5 32 49.5Z" fill="#FFF3E6"/>
    ${astroEyes(26, 38, 34, m)}${astroBlush(39.5)}
    <ellipse cx="32" cy="44.6" rx="2.3" ry="1.6" fill="#2A2230"/>
    <path d="M32 46v1.2 M32 47.2q-1.9 2.1 -3.8 .7 M32 47.2q1.9 2.1 3.8 .7" stroke="#2A2230" stroke-width="1.1" fill="none" stroke-linecap="round"/>`,
  "mascot-4": m => `<circle cx="20.5" cy="23.5" r="5.2" fill="#2B2D3A"/><circle cx="43.5" cy="23.5" r="5.2" fill="#2B2D3A"/>
    <ellipse cx="32" cy="36" rx="14.5" ry="13" fill="#F7F7FA"/>
    <ellipse cx="25.8" cy="35.3" rx="4.2" ry="5.2" fill="#2B2D3A" transform="rotate(25 25.8 35.3)"/>
    <ellipse cx="38.2" cy="35.3" rx="4.2" ry="5.2" fill="#2B2D3A" transform="rotate(-25 38.2 35.3)"/>
    ${m.happy || m.sleepy ? astroEyes(26.2, 37.8, 35, m, "#F7F7FA") : `<g class="as-eyes"><ellipse cx="26.2" cy="35.4" rx="3.4" ry="4" fill="#fff"/><ellipse cx="37.8" cy="35.4" rx="3.4" ry="4" fill="#fff"/>
      <circle cx="26.2" cy="35.6" r="2.2" fill="#2B2D3A"/><circle cx="37.8" cy="35.6" r="2.2" fill="#2B2D3A"/><circle cx="25.6" cy="34.8" r=".8" fill="#fff"/><circle cx="37.2" cy="34.8" r=".8" fill="#fff"/></g>`}
    ${astroBlush(41.5)}
    <ellipse cx="32" cy="41.2" rx="2.4" ry="1.6" fill="#2B2D3A"/>
    <path d="M32 42.6q-1.5 2 -3.2 .9 M32 42.6q1.5 2 3.2 .9" stroke="#2B2D3A" stroke-width="1.1" fill="none" stroke-linecap="round"/>`,
  "mascot-2": m => `<ellipse cx="32" cy="35.5" rx="13.5" ry="13" fill="#E3B57A"/>
    <path d="M19 27 C13 29 13 40 17 44 C20 42 21 34 22 29Z M45 27 C51 29 51 40 47 44 C44 42 43 34 42 29Z" fill="#9A6239"/>
    <ellipse cx="38.5" cy="31" rx="4" ry="3.6" fill="#C9935A"/>
    ${astroEyes(26.5, 37.5, 34.5, m)}${astroBlush(40)}
    <ellipse cx="32" cy="42" rx="6.5" ry="5" fill="#F6E1C1"/>
    <ellipse cx="32" cy="39.6" rx="2.8" ry="2" fill="#2A2230"/>
    <path d="M32 41.6v1.6 M32 43.2q-2 1.6 -3.6 .4 M32 43.2q2 1.6 3.6 .4" stroke="#2A2230" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    ${m.happy ? `<path d="M30.4 44.4h3.2v2.2a1.6 1.6 0 0 1 -3.2 0z" fill="#F07A9B"/>` : ""}`,
  "mascot-5": m => `<circle cx="16.5" cy="35" r="4.6" fill="#8B5A3C"/><circle cx="47.5" cy="35" r="4.6" fill="#8B5A3C"/>
    <circle cx="16.5" cy="35" r="2.5" fill="#F2C9A5"/><circle cx="47.5" cy="35" r="2.5" fill="#F2C9A5"/>
    <ellipse cx="32" cy="35" rx="13.5" ry="13.5" fill="#8B5A3C"/>
    <path d="M32 47.5 C24 47.5 20.5 43 21 38.5 C21.4 34.5 24 31 27.5 31.5 C29.5 31.8 30.8 33 32 33 C33.2 33 34.5 31.8 36.5 31.5 C40 31 42.6 34.5 43 38.5 C43.5 43 40 47.5 32 47.5Z" fill="#F2C9A5"/>
    <path d="M27 25 q5 -4 10 0" stroke="#6E4630" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    ${astroEyes(27.2, 36.8, 36, m)}${astroBlush(41, "#E8836F")}
    <path d="M30.6 40.5h2.8" stroke="#6E4630" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M28 43q4 3.2 8 0" stroke="#6E4630" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
  "mascot-3": m => `<circle cx="18.5" cy="27" r="7" fill="#A3ABBE"/><circle cx="45.5" cy="27" r="7" fill="#A3ABBE"/>
    <circle cx="18.5" cy="27" r="4" fill="#EEF0F6"/><circle cx="45.5" cy="27" r="4" fill="#EEF0F6"/>
    <ellipse cx="32" cy="37" rx="14" ry="12.5" fill="#B4BCCD"/>
    ${astroEyes(25.5, 38.5, 35, m)}${astroBlush(41)}
    <ellipse cx="32" cy="39.5" rx="3.6" ry="4.6" fill="#3A3F52"/>
    <ellipse cx="31" cy="37.6" rx="1" ry="1.4" fill="#fff" opacity=".35"/>
    <path d="M29.5 45.5q2.5 1.8 5 0" stroke="#3A3F52" stroke-width="1.1" fill="none" stroke-linecap="round"/>`
};

/* Kasklı astronot (64×64): beyaz kask, karakter renginde vizör halkası, yaka ve anten ışığı; koyu cam,
   sol üstte parlama ve küçük yıldız yansıması. water (0-1) verilirse kaskın beyaz gövdesi alttan suyla
   dolar (yüz her zaman görünür kalır). */
let astroSeq = 0;
function astroArt(key, mood = {}, water = null){
  const k = avKey({ avatar:key }), tone = AVATARS.find(a => a[0] === k)[2], id = "as" + (++astroSeq);
  const wy = water == null ? null : (58.5 - 50 * clamp(water, 0, 1)).toFixed(1);
  return `<g class="astro" style="--as-tone:var(--${tone})">
    <defs><clipPath id="${id}"><circle cx="32" cy="34" r="20.5"/></clipPath>
      ${wy == null ? "" : `<clipPath id="${id}w"><rect x="0" y="${wy}" width="64" height="64"/></clipPath>`}</defs>
    <path d="M32 4.5v4" stroke="var(--helm-line)" stroke-width="1.8" stroke-linecap="round"/>
    <circle class="as-ant" cx="32" cy="4" r="2.6" fill="var(--as-tone)"/>
    <path d="M14 56 Q32 63 50 56 L48 61 Q32 66 16 61Z" fill="var(--as-tone)"/>
    <circle cx="32" cy="33.5" r="25" fill="var(--helm)"/>
    <path d="M10 40 A25 25 0 0 0 54 40 A23 23 0 0 1 10 40Z" fill="var(--helm-shade)"/>
    <circle cx="9.5" cy="34" r="3.3" fill="var(--helm-shade)"/><circle cx="54.5" cy="34" r="3.3" fill="var(--helm-shade)"/>
    ${wy == null ? "" : `<g class="as-water" clip-path="url(#${id}w)"><circle cx="32" cy="33.5" r="25"/><circle cx="9.5" cy="34" r="3.3"/><circle cx="54.5" cy="34" r="3.3"/></g>`}
    <circle cx="32" cy="34" r="22.6" fill="var(--as-tone)"/>
    <circle cx="32" cy="34" r="20.5" fill="var(--visor)"/>
    <g clip-path="url(#${id})"><g transform="translate(32 35) scale(1.12) translate(-32 -35)">${ASTRO_FACES[k](mood)}</g>
      <path d="M15.5 25 A19 19 0 0 1 29.5 14.8" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".5"/>
      <path d="M42.5 17.2l.7 1.9 1.9.7 -1.9.7 -.7 1.9 -.7 -1.9 -1.9 -.7 1.9 -.7z" fill="#fff" opacity=".75"/>
      <circle cx="46.4" cy="22.6" r=".7" fill="#fff" opacity=".6"/><circle cx="35.5" cy="16.6" r="1" fill="#fff" opacity=".45"/></g>
  </g>`;
}
const astroIcon = key => astroArt(key);

function avatarPicker(cur, idp){
  return `<div class="av-pick" role="radiogroup" aria-label="${tx("Avatarın")}">${AVATARS.map(([k,n,tone]) =>
    `<button type="button" class="av${cur === k ? " on" : ""}" data-av="${k}" data-avp="${idp}" role="radio"
      aria-checked="${cur === k}" aria-label="${n}" style="--mascot:var(--${tone})">
      <svg viewBox="0 0 64 64" aria-hidden="true">${astroIcon(k)}</svg>
    </button>`).join("")}</div>`;
}
function wireAvatar(idp, onPick, root){
  const picks = (root || app).querySelectorAll(`[data-av][data-avp="${idp}"]`);
  picks.forEach(b => b.onclick = () => {
    picks.forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); });
    onPick(b.dataset.av);
  });
}

function buildProgram(profile, weightKg, adjustment){
  const age = profileAge(profile);
  const bf = profile.bodyFat;
  const lbm = Number.isFinite(bf) && bf >= 3 && bf <= 60 ? weightKg * (1 - bf / 100) : null;
  const bmr = lbm !== null
    ? 370 + 21.6 * lbm
    : 10*weightKg + 6.25*profile.height - 5*age + sexK(profile.sex, 5, -161);

  const tdee = bmr * ACTIVITY[profile.activity].m;
  const goal = GOAL[profile.goal];
  const floor = Math.max(bmr * 0.95, sexK(profile.sex, 1500, 1200));
  const raw = tdee * goal.m + (adjustment || 0);
  const floored = raw < floor;
  const kcal = Math.round(Math.max(raw, floor));

  const protein = Math.round(Math.min((lbm !== null ? lbm : weightKg*0.8) * goal.protein, weightKg*2.5));
  const fat = Math.round(kcal * 0.25 / 9);
  const carb = Math.round(Math.max((kcal - protein*4 - fat*9) / 4, 0));

  return {
    bmr:Math.round(bmr), tdee:Math.round(tdee), lbm, kcal, protein, fat, carb,
    water: Math.round(weightKg * 35), floored,
    training: trainingPlan(profile)
  };
}

/* Antrenman kategorileri. Program listesi bunlara göre filtrelenir. */
const VENUE = {
  gym:{ label:tx("Spor salonu"), active:tx("30-40 dk yürüyüş veya bisiklet") },
  home:{ label:tx("Evde"), active:tx("25 dk yürüyüş veya ip atlama") },
  outdoor:{ label:tx("Dışarıda"), active:tx("40 dk yürüyüş") },
  calisthenics:{ label:tx("Calisthenics"), active:tx("Mobilite ve esneme 20 dk") },
  kettlebell:{ label:tx("Kettlebell"), active:tx("30 dk yürüyüş") },
  mobility:{ label:tx("Yoga & mobilite"), active:tx("Hafif yürüyüş") },
  swim:{ label:tx("Yüzme"), active:"20 dk esneme" }
};

const PROGRAMS = {
  gym_sl3:{ venue:"gym", label:tx("Başlangıç güç · 5×5"), freq:3,
    desc:tx("Beş temel barbell hareketi, iki antrenman dönüşümlü. Yeni başlayanların en hızlı ilerlediği yapı."),
    note:tx("Her seansta 2.5 kg ekle. Aynı ağırlıkta üç kez takılırsan %10 geri in ve tekrar tırman."),
    s:[{t:tx("Tüm vücut A"),b:tx("Squat 5×5 · Bench press 5×5 · Barbell row 5×5")},
       {t:tx("Tüm vücut B"),b:tx("Squat 5×5 · Omuz press 5×5 · Deadlift 1×5")},
       {t:tx("Tüm vücut A"),b:tx("Squat 5×5 · Bench press 5×5 · Barbell row 5×5 · Plank 3×45 sn")}]},

  gym_ul4:{ venue:"gym", label:tx("Üst / Alt bölünmesi"), freq:4,
    desc:tx("Haftada iki üst, iki alt vücut. Kuvvet ve kas hacmi arasında dengeli, en yaygın orta seviye yapı."),
    note:tx("İlk hareketi ağır ve az tekrarla, sonrakileri daha çok tekrarla çalış."),
    s:[{t:tx("Üst vücut A"),b:tx("Bench press 4×6-8 · Omuz press 3×10 · Kürek 3×10 · Triceps 3×12")},
       {t:tx("Alt vücut A"),b:tx("Squat 4×6-8 · Romen deadlift 3×10 · Leg press 3×12 · Calf raise 3×15")},
       {t:tx("Üst vücut B"),b:tx("Barfiks 4×8 · Incline press 3×10 · Face pull 3×15 · Biceps 3×12")},
       {t:tx("Alt vücut B"),b:tx("Deadlift 3×5 · Bulgarian split squat 3×10 · Leg curl 3×12 · Plank 3×45 sn")}]},

  gym_531:{ venue:"gym", label:tx("5/3/1 temelli güç"), freq:4,
    desc:tx("Dört ana harekete haftada birer gün. Ağırlıklar tahmini tek tekrar maksimumunun %90'ı üzerinden hesaplanır, son set maksimum tekrar."),
    note:tx("Dört haftalık döngü: ağır, daha ağır, en ağır, hafif toparlanma. Her döngü sonunda alt vücutta 5 kg, üst vücutta 2.5 kg ekle."),
    s:[{t:tx("İtiş günü"),b:tx("Omuz press 3 set (%65-75-85) · Barfiks 5×10 · Dips 5×10")},
       {t:tx("Çekiş günü"),b:tx("Deadlift 3 set (%65-75-85) · Leg curl 5×10 · Karın 5×15")},
       {t:tx("İtiş günü"),b:tx("Bench press 3 set (%65-75-85) · Kürek 5×10 · Dumbbell press 5×10")},
       {t:tx("Bacak günü"),b:tx("Squat 3 set (%65-75-85) · Leg press 5×10 · Karın 5×15")}]},

  gym_ppl5:{ venue:"gym", label:tx("Push / Pull / Legs"), freq:5,
    desc:tx("Hareketleri itiş, çekiş ve bacak olarak ayırır. Haftada beş gün ayırabilenler için en verimli hacim dağılımı."),
    note:tx("Toparlanma kritik: aynı kas grubunu üst üste iki gün çalıştırma."),
    s:[{t:tx("İtiş günü"),b:tx("Bench press 4×6-8 · Omuz press 3×10 · Incline dumbbell 3×10 · Triceps 3×12")},
       {t:tx("Çekiş günü"),b:tx("Barfiks 4×8 · Barbell row 4×8 · Face pull 3×15 · Biceps 3×12")},
       {t:tx("Bacak günü"),b:tx("Squat 4×6-8 · Romen deadlift 3×10 · Leg press 3×12 · Calf raise 4×15")},
       {t:tx("Üst vücut"),b:tx("Incline press 4×10 · Kürek 4×10 · Yan omuz 3×15 · Kol süperset 3×12")},
       {t:tx("Alt vücut"),b:tx("Front squat 3×8 · Hip thrust 4×10 · Leg curl 3×12 · Karın 3×15")}]},

  home_bw3:{ venue:"home", label:tx("Vücut ağırlığı · temel"), freq:3,
    desc:tx("Hiç ekipman gerektirmez. Sandalye, havlu ve duvar yeterli."),
    note:tx("Zorluğu tempoyu yavaşlatarak artır: inişi üç saniyede yap."),
    s:[{t:tx("Tüm vücut A"),b:tx("Sandalye squat 3×15 · Şınav 3×10 · Havlu kürek 3×12 · Plank 3×40 sn")},
       {t:tx("Tüm vücut B"),b:tx("Bulgarian split squat 3×10 · Pike şınav 3×8 · Superman 3×12 · Glute bridge 3×15")},
       {t:tx("Tüm vücut C"),b:tx("Duvar oturuşu 3×45 sn · Elmas şınav 3×10 · Masa altı ters kürek 3×8 · Dead bug 3×12")}]},

  home_pack3:{ venue:"home", label:tx("Sırt çantalı kuvvet"), freq:3,
    desc:tx("Kitapla doldurulmuş bir sırt çantası tek ekipman. Vücut ağırlığı yetmemeye başlayınca sıradaki adım."),
    note:tx("Çantaya kademeli ağırlık ekle; sırta değil göğse alarak da çalışabilirsin."),
    s:[{t:tx("Tüm vücut A"),b:tx("Çantalı squat 4×12 · Şınav 4×10 · Çantalı kürek 4×12 · Plank 3×45 sn")},
       {t:tx("Tüm vücut B"),b:tx("Çantalı Romen deadlift 4×10 · Pike şınav 3×10 · Bulgarian split squat 3×10 · Hollow hold 3×30 sn")},
       {t:tx("Tüm vücut C"),b:tx("Çantalı lunge 4×12 · Elmas şınav 3×12 · Ters kürek 3×10 · Dead bug 3×15")}]},

  home_hiit4:{ venue:"home", label:tx("HIIT + kuvvet devresi"), freq:4,
    desc:tx("Kısa ve yoğun. Aralıklı devre günleriyle kuvvet günlerini dönüşümlü uygular, seans 25-30 dakika."),
    note:tx("Devre günlerinde nabız yüksek kalmalı; dinlenme sürelerini uzatma."),
    s:[{t:tx("Tüm vücut A"),b:"4 tur: 40 sn burpee · jump squat · mountain climber · plank jack (20 sn ara)"},
       {t:tx("Üst vücut"),b:tx("Şınav 4×12 · Pike şınav 3×10 · Sandalye dips 3×12 · Havlu kürek 4×12")},
       {t:tx("Tüm vücut B"),b:tx("5 tur: 30 sn yüksek diz · 30 sn lunge sıçrama · 30 sn şınav (60 sn ara)")},
       {t:tx("Alt vücut"),b:tx("Squat 4×20 · Bulgarian split squat 3×12 · Glute bridge 4×20 · Calf raise 4×25")}]},

  out_c25k3:{ venue:"outdoor", label:tx("Sıfırdan 5 km koşu"), freq:3,
    desc:tx("Koşu ve yürüyüş dönüşümlü başlar, koşu süresi her hafta uzar. Dokuz haftada kesintisiz 30 dakika hedeflenir."),
    note:tx("Haftada üç gün, araya en az bir gün koy. Konuşabildiğin tempoda koş; nefes nefese kalıyorsan yavaşla."),
    s:[{t:tx("Koşu-yürüyüş 1"),b:tx("5 dk ısınma · 8 tur (60 sn koşu / 90 sn yürüyüş) · 5 dk soğuma")},
       {t:tx("Koşu-yürüyüş 2"),b:tx("5 dk ısınma · 6 tur (90 sn koşu / 2 dk yürüyüş) · 5 dk soğuma")},
       {t:tx("Sürekli koşu denemesi"),b:tx("5 dk ısınma · 2 × 8 dk koşu (3 dk yürüyüş arası) · 5 dk soğuma")}]},

  out_park4:{ venue:"outdoor", label:tx("Park barı + koşu"), freq:4,
    desc:tx("Bar ve bank üzerine kurulu kuvvet günleriyle koşu günlerini birleştirir."),
    note:tx("Soğuk havada ısınmayı 10 dakikaya çıkar."),
    s:[{t:tx("Tempo koşusu"),b:tx("25 dk tempolu koşu · Bank dips 3×12 · Plank 3×45 sn")},
       {t:tx("Üst vücut"),b:tx("Barfiks 4×max · Ters kürek 4×12 · Bank şınav 4×15 · Karın 3×20")},
       {t:tx("Bacak günü"),b:tx("Tepe sprint 10×20 sn · Bank step-up 3×15 · Lunge 3×20 adım")},
       {t:tx("Uzun koşu"),b:tx("40-50 dk düşük tempo koşu · Esneme 10 dk")}]},

  out_end5:{ venue:"outdoor", label:tx("Dayanıklılık odaklı"), freq:5,
    desc:tx("Haftalık koşu hacmini artırmak isteyenler için; iki kuvvet günü sakatlık önleme amaçlı."),
    note:tx("Haftalık toplam mesafeyi %10'dan fazla artırma."),
    s:[{t:tx("Tempo koşusu"),b:tx("25 dk tempolu koşu · Plank 3×45 sn")},
       {t:tx("Üst vücut"),b:tx("Bank şınav 4×15 · Bank dips 4×12 · Pike şınav 3×10 · Karın 3×20")},
       {t:tx("Bacak günü"),b:tx("Merdiven sprint 10×20 sn · Bank step-up 4×12 · Bulgarian split squat 3×10")},
       {t:tx("Üst vücut"),b:tx("Barfiks 5×max · Ters kürek 4×12 · Hollow hold 3×30 sn")},
       {t:tx("Uzun koşu"),b:tx("45-60 dk düşük tempo koşu")}]},

  cal_basic3:{ venue:"calisthenics", label:tx("Temel progresyon"), freq:3,
    desc:tx("İtiş, çekiş ve bacak günleri. İlerleme kilo değil hareket zorluğu üzerinden."),
    note:tx("Bir progresyonda 3×8 temiz tekrara ulaşınca üst varyasyona geç."),
    s:[{t:tx("İtiş günü"),b:tx("Şınav progresyonu 4×6-10 · Dips 3×6-10 · Pike şınav 3×8 · Plank 3×45 sn")},
       {t:tx("Çekiş günü"),b:tx("Barfiks 4×3-8 · Avustralya kürek 3×10 · Lastik face pull 3×15 · Hollow hold 3×30 sn")},
       {t:tx("Bacak + core"),b:tx("Pistol progresyonu 3×6 · Nordic curl progresyonu 3×5 · Jump squat 3×12 · L-sit 3×15 sn")}]},

  cal_ppl4:{ venue:"calisthenics", label:tx("Push / Pull / Bacak / Skill"), freq:4,
    desc:tx("Kuvvet günlerine ayrı bir beceri günü ekler: handstand, L-sit, dragon flag."),
    note:tx("Beceri çalışmasını yorgun değilken, seansın başında yap."),
    s:[{t:tx("İtiş günü"),b:tx("Dips 4×8 · Şınav varyasyonu 4×10 · Duvar handstand şınav 3×6 · Triceps ext. 3×12")},
       {t:tx("Çekiş günü"),b:tx("Barfiks 5×5 · Chin-up 3×8 · Avustralya kürek 3×12 · Lastik biceps 3×12")},
       {t:tx("Bacak günü"),b:tx("Pistol progresyonu 4×6 · Shrimp squat 3×8 · Nordic curl 3×5 · Calf raise 4×20")},
       {t:tx("Skill + core"),b:tx("Duvarda handstand 5×30 sn · L-sit 4×15 sn · Hollow rock 3×20 · Dragon flag progresyonu 3×6")}]},

  cal_skill5:{ venue:"calisthenics", label:tx("İleri seviye · beceri"), freq:5,
    desc:tx("Muscle-up, front lever ve handstand şınav gibi ileri hareketlere yönelen hacimli program."),
    note:tx("Eklem ve bağ dokusu kasla aynı hızda güçlenmez; ağrı hissedersen bir basamak geri in."),
    s:[{t:tx("İtiş günü"),b:tx("Dips 4×8 · Şınav varyasyonu 4×12 · Handstand şınav progresyonu 3×5 · Plank 3×60 sn")},
       {t:tx("Çekiş günü"),b:tx("Barfiks 5×5 · Ters kürek 4×12 · Muscle-up progresyonu 4×3 · Hollow hold 3×40 sn")},
       {t:tx("Bacak günü"),b:tx("Pistol progresyonu 4×6 · Shrimp squat 3×8 · Jump squat 3×15 · Nordic curl 3×5")},
       {t:tx("Skill"),b:tx("Handstand 6×40 sn · L-sit → V-sit 4×15 sn · Front lever progresyonu 4×10 sn")},
       {t:tx("Tüm vücut · devre"),b:tx("4 tur: 8 barfiks + 12 şınav + 15 squat + 30 sn plank")}]},

  kb_simple3:{ venue:"kettlebell", label:tx("Sade kettlebell"), freq:3,
    desc:tx("İki hareket etrafında kurulu: salınım arka zinciri ve nefesi, Türk kalkışı denge ve omuz sağlamlığını çalıştırır. Tek bir kettlebell yeter."),
    note:tx("Salınım kalçadan gelir, kolla çekilmez. Tekniği oturmadan ağırlık artırma."),
    s:[{t:tx("Salınım + kalkış"),b:tx("Kettlebell swing 10×10 · Türk kalkışı 5×1 (her taraf)")},
       {t:tx("Kuvvet devresi"),b:tx("Goblet squat 5×8 · Tek kol press 5×5 · Kettlebell row 5×8 · Farmer taşıma 3×40 m")},
       {t:tx("Salınım + kalkış"),b:tx("Tek kol swing 10×10 · Türk kalkışı 5×1 · Plank 3×45 sn")}]},

  mob_flow4:{ venue:"mobility", label:tx("Yoga & mobilite akışı"), freq:4,
    desc:tx("Masa başı çalışanlar için kalça açıcı ve omurga hareketliliği odaklı. Kuvvet programının yanında ikinci program olarak da kullanılabilir."),
    note:tx("Pozlarda nefesi tutma; her pozda 5-8 nefes kal."),
    s:[{t:tx("Akış · tüm vücut"),b:tx("Güneş selamı 5 tur · Savaşçı serisi · Köprü · 10 dk nefes çalışması")},
       {t:tx("Kalça ve alt sırt"),b:tx("Güvercin · Kelebek · Kedi-inek · Çocuk pozu (her poz 60-90 sn)")},
       {t:tx("Güç akışı"),b:tx("Plank serisi · Yan plank · Sandalye pozu · Ağaç dengesi (20 dk)")},
       {t:tx("Esneklik"),b:tx("Öne eğilme · Hamstring serisi · Omuz açıcılar · 15 dk gevşeme")}]},

  swim_base3:{ venue:"swim", label:tx("Yüzme · temel"), freq:3,
    desc:tx("Eklem yükü düşük. Diz veya bel şikayeti olanlar ile yüksek kilodan başlayanlar için uygun."),
    note:tx("Mesafeleri kendi seviyene göre ölçekle; teknik hızdan önce gelir."),
    s:[{t:tx("Teknik"),b:tx("200 m ısınma · 8×50 m teknik (nefes, ayak vuruşu) · 200 m serbest")},
       {t:tx("Dayanıklılık"),b:tx("300 m ısınma · 6×100 m serbest (20 sn ara) · 200 m soğuma")},
       {t:tx("Aralıklı"),b:tx("200 m ısınma · 10×50 m hızlı (30 sn ara) · 8×25 m sprint · 200 m soğuma")}]}
};

const PATTERN = { 3:[1,3,5], 4:[1,3,5,7], 5:[1,2,3,5,7], 7:[1,2,3,4,5,6,7] };

/* Antrenman günleri: kullanıcı seçtiyse onunkiler, yoksa varsayılan desen. */
function planDays(profile, freq){
  if (Array.isArray(profile?.days)) return profile.days.slice().sort((a,b) => a-b);
  return PATTERN[freq] || PATTERN[3];
}

function sessionIcon(title, venue){
  const t = title.toLowerCase();
  if (/aktif dinlenme/.test(t)) return "walk";
  if (/^dinlenme/.test(t)) return "rest";
  if (/akış|esneklik|kalça|mobilite/.test(t)) return "yoga";
  if (/teknik|dayanıklılık|aralıklı/.test(t) && venue === "swim") return "swim";
  if (/skill|handstand/.test(t)) return "skill";
  if (/bacak|alt|squat|deadlift/.test(t)) return "legs";
  if (/core/.test(t)) return "core";
  if (/koşu|sprint|hiit/.test(t)) return "run";
  if (/push|itiş|bench|omuz press/.test(t)) return "push";
  if (/pull|çekiş/.test(t)) return "pull";
  if (/üst/.test(t)) return "pull";
  if (venue === "swim") return "swim";
  if (venue === "mobility") return "yoga";
  return "fullbody";
}

/* Varsayılan program: kategori içinde aktivite seviyesine en yakın gün sayısı. */
function defaultProgramId(venue, activity, days){
  /* Gün seçtiyse program frekansı oradan; yoksa aktivite seviyesinden tahmin. */
  const want = Array.isArray(days) ? days.length
             : (activity === "sedentary" || activity === "light") ? 3
             : activity === "moderate" ? 4 : 5;
  const inVenue = Object.entries(PROGRAMS).filter(([,p]) => p.venue === venue);
  if (!inVenue.length) return "gym_ul4";
  inVenue.sort((a,b) => Math.abs(a[1].freq - want) - Math.abs(b[1].freq - want));
  return inVenue[0][0];
}

/* Program kapalı: kullanıcı spor programı istemiyor. Günler boş kalır,
   öneri üretilmez; serbest antrenman kaydı yine de yapılabilir. */
const noPlan = p => !!(p && p.noPlan);
function customCount(p){
  const c = p && p.custom && p.custom.days;
  return c ? Object.values(c).filter(d => d && d.ex && d.ex.length).length : 0;
}

function trainingPlan(profile){
  if (noPlan(profile)){
    const days = [];
    for (let d = 1; d <= 7; d++) days.push({ wd:d, t:"", b:"", icon:"rest" });
    return { id:null, title:tx("Program yok"), freq:0, desc:"", note:"",
             cardio:"", none:true, days };
  }
  const goal = profile.goal;
  const cardio = { lose:tx("Haftada 3 × 30 dk tempolu kardiyo, antrenman sonrası."),
                   maintain:tx("Haftada 2 × 25 dk hafif kardiyo yeterli."),
                   gain:tx("Kardiyoyu haftada 2 × 20 dk ile sınırla.") }[goal];

  /* Kullanıcının kendi yazdığı program: hareketler hazır programlarla aynı
     biçime ("Ad 3×10") çevrilir, böylece kayıt ve antrenman modu aynen çalışır. */
  if (profile.programId === "custom" && customCount(profile)){
    const days = [];
    for (let d = 1; d <= 7; d++){
      const c = profile.custom.days[d];
      const on = c && c.ex && c.ex.length;
      const day = on ? { wd:d, t:c.t || tx("Antrenman"), b:c.ex.map(x => `${x.n} ${x.s}×${x.r}`).join(" · ") }
                     : { wd:d, t:tx("Dinlenme"), b:"" };
      day.icon = sessionIcon(day.t, "gym");
      days.push(day);
    }
    return { id:"custom", custom:true, title:tx("Kendi programın"), freq:customCount(profile),
             desc:"", note:tx("Bunu sen yazdın. Hazır programlardan birine dönmek için yukarıdan seç."), cardio, days };
  }

  const id = PROGRAMS[profile.programId] ? profile.programId
           : defaultProgramId(profile.venue || "gym", profile.activity);
  const prog = PROGRAMS[id];
  const cat = VENUE[prog.venue];
  const wds = planDays(profile, prog.freq);
  const days = [];

  for (let d = 1; d <= 7; d++){
    const i = wds.indexOf(d);
    let day;
    if (i >= 0){
      const session = prog.s[i % prog.s.length];
      day = { wd:d, t:session.t, b:applyAvoid(session.b, profile.avoid) };
    }
    else if (!Array.isArray(profile.days) && wds.length < 5 && d === 6) day = { wd:d, t:tx("Aktif dinlenme"), b:applyAvoid(cat.active, profile.avoid) };
    else day = { wd:d, t:tx("Dinlenme"), b:"" };
    day.icon = sessionIcon(day.t, prog.venue);
    days.push(day);
  }

  return { id, title:`${cat.label} · ${prog.label}`, freq:wds.length,
           desc:prog.desc, note:prog.note, cardio, days };
}

/* Öneri başlıkları kayıtta her dilde Türkçe durur: görevin türü (taskKind) bu
   başlıktan anlaşılır. Ekranda autoInfo ya da tx() ile çevrilir. */
function suggestedTitles(program, key){
  const day = program.training.none ? null : program.training.days.find(d => d.wd === isoWeekday(key));
  const out = [];
  if (day) out.push(day.b ? "Antrenman: " + day.t : "Dinlenme günü — 20 dk esneme");
  out.push(program.kcal + " kcal hedefini tut");
  out.push(program.protein + " g protein al");
  out.push(program.water + " ml su iç");
  out.push(`${sleepBand()[0]}-${sleepBand()[1]} saat uyu`);
  out.push("Haftalık kilo ölçümü");
  if (stepGoal()) out.push(stepGoal() + " adım at");
  return out;
}
/* Kaydedilecek öneri görevi: türü baştan damgalanır. */
const suggestedTask = title => {
  const t = { id: Date.now()+Math.random(), title, done:false, suggested:true };
  const kind = taskKind(t);
  if (kind) t.kind = kind;
  return t;
};
