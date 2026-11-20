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

const AVATARS = ["carb", "water", "protein", "good-vivid", "fat", "kcal"]
  .map((tone, i) => ["mascot-" + (i + 1), tx("Uzaylı {0}", [i + 1]), tone]);
const avKey = p => AVATARS.find(a => a[0] === p.avatar)?.[0] || AVATARS[0][0];
const avColor = p => "var(--" + AVATARS.find(a => a[0] === avKey(p))[2] + ")";
const sexClass = () => "custom";

const ALIEN_HEADS = [
  "M5 36 C5 16 43 16 43 36 C43 59 5 59 5 36Z",
  "M8 28 Q24 12 40 28 Q48 51 24 57 Q0 51 8 28Z",
  "M4 37 Q5 20 24 21 Q43 20 44 37 Q40 54 24 54 Q8 54 4 37Z",
  "M8 25 Q24 16 40 25 L43 43 Q40 57 24 56 Q8 57 5 43Z",
  "M5 32 Q9 19 24 23 Q39 19 43 32 Q47 54 24 56 Q1 54 5 32Z",
  "M6 28 Q24 17 42 28 Q47 44 31 54 Q24 62 17 54 Q1 44 6 28Z"
];
const ALIEN_ANTENNAS = [
  ["M24 25 Q28 16 24 9", [[24,9]]],
  ["M17 26 L12 13 M31 26 L36 13", [[12,13],[36,13]]],
  ["M17 25 Q16 14 8 15 M31 25 Q32 14 40 15", [[8,15],[40,15]]],
  ["M20 25 Q21 18 15 11 M29 25 Q29 18 33 16", [[15,11],[33,16]]],
  ["M24 24 Q15 18 21 10", [[21,10]]],
  ["M14 27 Q7 22 8 16 M24 24 V10 M34 27 Q41 22 40 16", [[8,16],[24,10],[40,16]]]
];
function alienShape(k, cls = ""){
  const i = Math.max(0, AVATARS.findIndex(a => a[0] === k));
  const [stem, tips] = ALIEN_ANTENNAS[i];
  return `<g class="${cls}" fill="currentColor"><path d="${stem}" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    ${tips.map(([x,y]) => `<circle cx="${x}" cy="${y}" r="3.2"/>`).join("")}
    <path d="${ALIEN_HEADS[i]}"/></g>`;
}
const ALIEN_MOUTHS = ["M19 43q5 7 10 0", "M21 44q3 3 6 0", "M20 43q4 7 9 -1",
  "M22 43a2 2 0 1 0 4 0a2 2 0 1 0 -4 0", "M20 45q4 -3 8 0", "M18 43q6 5 12 0"];
function alienFace(key, mood = {}){
  const i = Math.max(0, AVATARS.findIndex(a => a[0] === key));
  const eyes = mood.sleepy && !mood.happy
    ? '<path d="M13 36h6m10 0h6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'
    : `<ellipse cx="15.5" cy="35" rx="5.2" ry="6.5"/><ellipse cx="32.5" cy="35" rx="5.2" ry="6.5"/>
       <circle cx="14" cy="33" r="1.7" fill="var(--mascot-eye-glint)"/><circle cx="31" cy="33" r="1.7" fill="var(--mascot-eye-glint)"/>`;
  return `<g class="alien-face" fill="currentColor">${eyes}
    <path d="${mood.happy ? ALIEN_MOUTHS[0] : ALIEN_MOUTHS[i]}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></g>`;
}
const alienIcon = key => `${alienShape(key)}${alienFace(key)}`;

function avatarPicker(cur, idp){
  return `<div class="av-pick" role="radiogroup" aria-label="${tx("Avatarın")}">${AVATARS.map(([k,n,tone]) =>
    `<button type="button" class="av${cur === k ? " on" : ""}" data-av="${k}" data-avp="${idp}" role="radio"
      aria-checked="${cur === k}" aria-label="${n}" style="--mascot:var(--${tone})">
      <svg viewBox="0 0 64 64" aria-hidden="true"><g transform="translate(8 0)">${alienIcon(k)}</g></svg>
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
