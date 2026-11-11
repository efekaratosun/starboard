"use strict";

/* ---------------- program hesabı ---------------- */
const ACTIVITY = {
  sedentary:{label:"Hareketsiz", d:"masa başı, spor yok", m:1.20},
  light:{label:"Az hareketli", d:"haftada 1-3 gün hafif spor", m:1.375},
  moderate:{label:"Orta", d:"haftada 3-5 gün spor", m:1.55},
  active:{label:"Aktif", d:"haftada 6-7 gün spor", m:1.725},
  veryActive:{label:"Çok aktif", d:"günde iki antrenman ya da bedensel iş", m:1.90}
};
const GOAL = {
  lose:{label:"Yağ kaybı", m:0.82, protein:2.4, range:[-1.00,-0.35]},
  maintain:{label:"Koruma", m:1.00, protein:2.0, range:[-0.30,0.30]},
  gain:{label:"Kas kazanımı", m:1.12, protein:2.2, range:[0.15,0.50]}
};

/* Cinsiyete bağlı sabitler. Belirtilmemişse iki değerin ortalaması kullanılır. */
const sexK = (sex, m, f) => sex === "male" ? m : sex === "female" ? f : (m + f) / 2;

/* Avatarlar: herkes seçebilir. f = yüz konumu [x, y, ölçek] (tepki ifadeleri için). */
const AVATARS = [
  ["m","Erkek",[24,7.8,.42],"human"], ["f","Kadın",[24,8,.42],"human"], ["n","Figür",[24,8.5,.46],"human"],
  ["star","Yıldız",[24,27,.95],"nature"], ["drop","Damla",[24,34,1.05],"nature"], ["leaf","Yaprak",[24,31,.95],"nature"],
  ["fire","Ateş",[24,34,.9],"nature"], ["bolt","Şimşek",[23,27,.7],"nature"], ["mountain","Dağ",[25,37,.8],"nature"],
  ["moon","Ay",[18,25,.85],"nature"], ["heart","Kalp",[24,24,.95],"nature"], ["sun","Güneş",[24,28,.85],"nature"],
  ["run","Koşucu",[29,9,.42],"sport"], ["lift","Halterci",[24,15,.42],"sport"], ["yoga","Yogi",[24,9,.42],"sport"],
  ["swim","Yüzücü",[10,29,.42],"sport"], ["bike","Bisikletçi",[27,11,.42],"sport"], ["box","Boksör",[21,11,.42],"sport"],
  ["ball","Futbolcu",[20,9,.42],"sport"], ["hoop","Basketbolcu",[22,12,.42],"sport"], ["tennis","Tenisçi",[19,10,.42],"sport"],
  ["climb","Tırmanıcı",[26,10,.42],"sport"], ["ski","Kayakçı",[22,14,.42],"sport"], ["dance","Dansçı",[24,8,.42],"sport"],
  ["rocket","Roket",[24,31,.6],"space"], ["planet","Gezegen",[24,30,.95],"space"], ["astro","Astronot",[24,16,.62],"space"],
  ["alien","Uzaylı",[24,24,.95],"space"], ["ufo","UFO",[24,23,.55],"space"], ["comet","Kuyruklu yıldız",[31,21,.7],"space"]
];
const AV_CATS = [["human","İnsan"],["sport","Sporcu"],["nature","Doğa"],["space","Uzay"]];
const AV_COLORS = [["#FF5A3C","Mercan"],["#FF9500","Turuncu"],["#E8B400","Sarı"],["#16B86A","Yeşil"],
  ["#00AFA0","Turkuaz"],["#2F7BEA","Mavi"],["#7C4DFF","Mor"],["#E84A93","Pembe"]];
const avKey = p => AVATARS.some(a => a[0] === p.avatar) ? p.avatar : p.sex === "female" ? "f" : p.sex === "male" ? "m" : "n";
const avSym = k => k === "m" ? "i-body" : k === "f" ? "i-body-f" : "i-av-" + k;
const avColor = p => p.avColor || (p.sex === "female" ? "#E84A93" : p.sex === "male" ? "#2F7BEA" : "#7C4DFF");
function bodyIcon(p){ return avSym(avKey(p)); }
const sexClass = () => "custom";

function avatarPicker(cur, idp){
  const curCat = (AVATARS.find(a => a[0] === cur) || AVATARS[0])[3];
  return `<div class="av-cats" role="tablist" aria-label="Avatar sınıfları">${AV_CATS.map(([c,l]) =>
      `<button type="button" class="chip${c === curCat ? " sel" : ""}" role="tab" aria-selected="${c === curCat}" data-avcat="${c}" data-avp="${idp}">${l}</button>`).join("")}</div>
    ${AV_CATS.map(([c,l]) => `<div class="av-pick" role="radiogroup" aria-label="${l} avatarları" data-avgrid="${c}" data-avp="${idp}"${c === curCat ? "" : " hidden"}>
      ${AVATARS.filter(a => a[3] === c).map(([k,n]) =>
        `<button type="button" class="av${cur === k ? " on" : ""}" data-av="${k}" data-avp="${idp}" role="radio" aria-checked="${cur === k}" aria-label="${n}" title="${n}">
          <svg viewBox="0 0 48 64" aria-hidden="true"><use href="#${avSym(k)}"/></svg></button>`).join("")}</div>`).join("")}`;
}
function colorPicker(cur, idp){
  return `<div class="av-cols" role="radiogroup" aria-label="Avatar rengi">${AV_COLORS.map(([c,l]) =>
    `<button type="button" class="avc${cur === c ? " on" : ""}" data-avc="${c}" data-avp="${idp}" role="radio" aria-checked="${cur === c}"
      aria-label="${l}" style="--c:${c}"></button>`).join("")}</div>`;
}
function wireAvatar(idp, onPick, root){
  const r = root || app;
  r.querySelectorAll(`[data-avcat][data-avp="${idp}"]`).forEach(b => b.onclick = () => {
    r.querySelectorAll(`[data-avcat][data-avp="${idp}"]`).forEach(x => { x.classList.toggle("sel", x === b); x.setAttribute("aria-selected", x === b); });
    r.querySelectorAll(`[data-avgrid][data-avp="${idp}"]`).forEach(g => { g.hidden = g.dataset.avgrid !== b.dataset.avcat; });
  });
  r.querySelectorAll(`[data-av][data-avp="${idp}"]`).forEach(b => b.onclick = () => {
    r.querySelectorAll(`[data-av][data-avp="${idp}"]`).forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); });
    onPick(b.dataset.av);
  });
}
function wireColor(idp, onPick, root){
  const r = root || app;
  r.querySelectorAll(`[data-avc][data-avp="${idp}"]`).forEach(b => b.onclick = () => {
    r.querySelectorAll(`[data-avc][data-avp="${idp}"]`).forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); });
    onPick(b.dataset.avc);
  });
}

function buildProgram(profile, weightKg, adjustment){
  const bf = profile.bodyFat;
  const lbm = (bf > 0 && bf < 70) ? weightKg * (1 - bf/100) : null;
  const bmr = lbm !== null
    ? 370 + 21.6 * lbm
    : 10*weightKg + 6.25*profile.height - 5*profile.age + sexK(profile.sex, 5, -161);

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
  gym:{ label:"Spor salonu", active:"30-40 dk yürüyüş veya bisiklet" },
  home:{ label:"Evde", active:"25 dk yürüyüş veya ip atlama" },
  outdoor:{ label:"Dışarıda", active:"40 dk yürüyüş" },
  calisthenics:{ label:"Calisthenics", active:"Mobilite ve esneme 20 dk" },
  kettlebell:{ label:"Kettlebell", active:"30 dk yürüyüş" },
  mobility:{ label:"Yoga & mobilite", active:"Hafif yürüyüş" },
  swim:{ label:"Yüzme", active:"20 dk esneme" }
};

const PROGRAMS = {
  gym_sl3:{ venue:"gym", label:"Başlangıç güç · 5×5", freq:3,
    desc:"Beş temel barbell hareketi, iki antrenman dönüşümlü. Yeni başlayanların en hızlı ilerlediği yapı.",
    note:"Her seansta 2.5 kg ekle. Aynı ağırlıkta üç kez takılırsan %10 geri in ve tekrar tırman.",
    s:[{t:"Antrenman A",b:"Squat 5×5 · Bench press 5×5 · Barbell row 5×5"},
       {t:"Antrenman B",b:"Squat 5×5 · Omuz press 5×5 · Deadlift 1×5"},
       {t:"Antrenman A",b:"Squat 5×5 · Bench press 5×5 · Barbell row 5×5 · Plank 3×45 sn"}]},

  gym_ul4:{ venue:"gym", label:"Üst / Alt bölünmesi", freq:4,
    desc:"Haftada iki üst, iki alt vücut. Kuvvet ve kas hacmi arasında dengeli, en yaygın orta seviye yapı.",
    note:"İlk hareketi ağır ve az tekrarla, sonrakileri daha çok tekrarla çalış.",
    s:[{t:"Üst A · itiş",b:"Bench press 4×6-8 · Omuz press 3×10 · Kürek 3×10 · Triceps 3×12"},
       {t:"Alt A · bacak",b:"Squat 4×6-8 · Romen deadlift 3×10 · Leg press 3×12 · Calf raise 3×15"},
       {t:"Üst B · çekiş",b:"Barfiks 4×8 · Incline press 3×10 · Face pull 3×15 · Biceps 3×12"},
       {t:"Alt B · bacak",b:"Deadlift 3×5 · Bulgarian split squat 3×10 · Leg curl 3×12 · Plank 3×45 sn"}]},

  gym_531:{ venue:"gym", label:"5/3/1 temelli güç", freq:4,
    desc:"Dört ana harekete haftada birer gün. Ağırlıklar tahmini tek tekrar maksimumunun %90'ı üzerinden hesaplanır, son set maksimum tekrar.",
    note:"Dört haftalık döngü: ağır, daha ağır, en ağır, hafif toparlanma. Her döngü sonunda alt vücutta 5 kg, üst vücutta 2.5 kg ekle.",
    s:[{t:"Omuz press günü",b:"Omuz press 3 set (%65-75-85) · Barfiks 5×10 · Dips 5×10"},
       {t:"Deadlift günü",b:"Deadlift 3 set (%65-75-85) · Leg curl 5×10 · Karın 5×15"},
       {t:"Bench günü",b:"Bench press 3 set (%65-75-85) · Kürek 5×10 · Dumbbell press 5×10"},
       {t:"Squat günü",b:"Squat 3 set (%65-75-85) · Leg press 5×10 · Karın 5×15"}]},

  gym_ppl5:{ venue:"gym", label:"Push / Pull / Legs", freq:5,
    desc:"Hareketleri itiş, çekiş ve bacak olarak ayırır. Haftada beş gün ayırabilenler için en verimli hacim dağılımı.",
    note:"Toparlanma kritik: aynı kas grubunu üst üste iki gün çalıştırma.",
    s:[{t:"Push",b:"Bench press 4×6-8 · Omuz press 3×10 · Incline dumbbell 3×10 · Triceps 3×12"},
       {t:"Pull",b:"Barfiks 4×8 · Barbell row 4×8 · Face pull 3×15 · Biceps 3×12"},
       {t:"Bacak",b:"Squat 4×6-8 · Romen deadlift 3×10 · Leg press 3×12 · Calf raise 4×15"},
       {t:"Üst · hacim",b:"Incline press 4×10 · Kürek 4×10 · Yan omuz 3×15 · Kol süperset 3×12"},
       {t:"Alt · hacim",b:"Front squat 3×8 · Hip thrust 4×10 · Leg curl 3×12 · Karın 3×15"}]},

  home_bw3:{ venue:"home", label:"Vücut ağırlığı · temel", freq:3,
    desc:"Hiç ekipman gerektirmez. Sandalye, havlu ve duvar yeterli.",
    note:"Zorluğu tempoyu yavaşlatarak artır: inişi üç saniyede yap.",
    s:[{t:"Tüm vücut A",b:"Sandalye squat 3×15 · Şınav 3×10 · Havlu kürek 3×12 · Plank 3×40 sn"},
       {t:"Tüm vücut B",b:"Bulgarian split squat 3×10 · Pike şınav 3×8 · Superman 3×12 · Glute bridge 3×15"},
       {t:"Tüm vücut C",b:"Duvar oturuşu 3×45 sn · Elmas şınav 3×10 · Masa altı ters kürek 3×8 · Dead bug 3×12"}]},

  home_pack3:{ venue:"home", label:"Sırt çantalı kuvvet", freq:3,
    desc:"Kitapla doldurulmuş bir sırt çantası tek ekipman. Vücut ağırlığı yetmemeye başlayınca sıradaki adım.",
    note:"Çantaya kademeli ağırlık ekle; sırta değil göğse alarak da çalışabilirsin.",
    s:[{t:"Yüklü tüm vücut A",b:"Çantalı squat 4×12 · Şınav 4×10 · Çantalı kürek 4×12 · Plank 3×45 sn"},
       {t:"Yüklü tüm vücut B",b:"Çantalı Romen deadlift 4×10 · Pike şınav 3×10 · Bulgarian split squat 3×10 · Hollow hold 3×30 sn"},
       {t:"Yüklü tüm vücut C",b:"Çantalı lunge 4×12 · Elmas şınav 3×12 · Ters kürek 3×10 · Dead bug 3×15"}]},

  home_hiit4:{ venue:"home", label:"HIIT + kuvvet devresi", freq:4,
    desc:"Kısa ve yoğun. Aralıklı devre günleriyle kuvvet günlerini dönüşümlü uygular, seans 25-30 dakika.",
    note:"Devre günlerinde nabız yüksek kalmalı; dinlenme sürelerini uzatma.",
    s:[{t:"HIIT devresi A",b:"4 tur: 40 sn burpee · jump squat · mountain climber · plank jack (20 sn ara)"},
       {t:"Kuvvet · üst",b:"Şınav 4×12 · Pike şınav 3×10 · Sandalye dips 3×12 · Havlu kürek 4×12"},
       {t:"HIIT devresi B",b:"5 tur: 30 sn yüksek diz · 30 sn lunge sıçrama · 30 sn şınav (60 sn ara)"},
       {t:"Kuvvet · alt",b:"Squat 4×20 · Bulgarian split squat 3×12 · Glute bridge 4×20 · Calf raise 4×25"}]},

  out_c25k3:{ venue:"outdoor", label:"Sıfırdan 5 km koşu", freq:3,
    desc:"Koşu ve yürüyüş dönüşümlü başlar, koşu süresi her hafta uzar. Dokuz haftada kesintisiz 30 dakika hedeflenir.",
    note:"Haftada üç gün, araya en az bir gün koy. Konuşabildiğin tempoda koş; nefes nefese kalıyorsan yavaşla.",
    s:[{t:"Koşu-yürüyüş 1",b:"5 dk ısınma · 8 tur (60 sn koşu / 90 sn yürüyüş) · 5 dk soğuma"},
       {t:"Koşu-yürüyüş 2",b:"5 dk ısınma · 6 tur (90 sn koşu / 2 dk yürüyüş) · 5 dk soğuma"},
       {t:"Sürekli koşu denemesi",b:"5 dk ısınma · 2 × 8 dk koşu (3 dk yürüyüş arası) · 5 dk soğuma"}]},

  out_park4:{ venue:"outdoor", label:"Park barı + koşu", freq:4,
    desc:"Bar ve bank üzerine kurulu kuvvet günleriyle koşu günlerini birleştirir.",
    note:"Soğuk havada ısınmayı 10 dakikaya çıkar.",
    s:[{t:"Tempo koşusu",b:"25 dk tempolu koşu · Bank dips 3×12 · Plank 3×45 sn"},
       {t:"Üst vücut · bar",b:"Barfiks 4×max · Ters kürek 4×12 · Bank şınav 4×15 · Karın 3×20"},
       {t:"Sprint + bacak",b:"Tepe sprint 10×20 sn · Bank step-up 3×15 · Lunge 3×20 adım"},
       {t:"Uzun koşu",b:"40-50 dk düşük tempo koşu · Esneme 10 dk"}]},

  out_end5:{ venue:"outdoor", label:"Dayanıklılık odaklı", freq:5,
    desc:"Haftalık koşu hacmini artırmak isteyenler için; iki kuvvet günü sakatlık önleme amaçlı.",
    note:"Haftalık toplam mesafeyi %10'dan fazla artırma.",
    s:[{t:"Tempo koşusu",b:"25 dk tempolu koşu · Plank 3×45 sn"},
       {t:"Üst vücut · itiş",b:"Bank şınav 4×15 · Bank dips 4×12 · Pike şınav 3×10 · Karın 3×20"},
       {t:"Sprint + bacak",b:"Merdiven sprint 10×20 sn · Bank step-up 4×12 · Bulgarian split squat 3×10"},
       {t:"Üst vücut · çekiş",b:"Barfiks 5×max · Ters kürek 4×12 · Hollow hold 3×30 sn"},
       {t:"Uzun koşu",b:"45-60 dk düşük tempo koşu"}]},

  cal_basic3:{ venue:"calisthenics", label:"Temel progresyon", freq:3,
    desc:"İtiş, çekiş ve bacak günleri. İlerleme kilo değil hareket zorluğu üzerinden.",
    note:"Bir progresyonda 3×8 temiz tekrara ulaşınca üst varyasyona geç.",
    s:[{t:"Push",b:"Şınav progresyonu 4×6-10 · Dips 3×6-10 · Pike şınav 3×8 · Plank 3×45 sn"},
       {t:"Pull",b:"Barfiks 4×3-8 · Avustralya kürek 3×10 · Lastik face pull 3×15 · Hollow hold 3×30 sn"},
       {t:"Bacak + core",b:"Pistol progresyonu 3×6 · Nordic curl progresyonu 3×5 · Jump squat 3×12 · L-sit 3×15 sn"}]},

  cal_ppl4:{ venue:"calisthenics", label:"Push / Pull / Bacak / Skill", freq:4,
    desc:"Kuvvet günlerine ayrı bir beceri günü ekler: handstand, L-sit, dragon flag.",
    note:"Beceri çalışmasını yorgun değilken, seansın başında yap.",
    s:[{t:"Push",b:"Dips 4×8 · Şınav varyasyonu 4×10 · Duvar handstand şınav 3×6 · Triceps ext. 3×12"},
       {t:"Pull",b:"Barfiks 5×5 · Chin-up 3×8 · Avustralya kürek 3×12 · Lastik biceps 3×12"},
       {t:"Bacak",b:"Pistol progresyonu 4×6 · Shrimp squat 3×8 · Nordic curl 3×5 · Calf raise 4×20"},
       {t:"Skill + core",b:"Duvarda handstand 5×30 sn · L-sit 4×15 sn · Hollow rock 3×20 · Dragon flag progresyonu 3×6"}]},

  cal_skill5:{ venue:"calisthenics", label:"İleri seviye · beceri", freq:5,
    desc:"Muscle-up, front lever ve handstand şınav gibi ileri hareketlere yönelen hacimli program.",
    note:"Eklem ve bağ dokusu kasla aynı hızda güçlenmez; ağrı hissedersen bir basamak geri in.",
    s:[{t:"Push",b:"Dips 4×8 · Şınav varyasyonu 4×12 · Handstand şınav progresyonu 3×5 · Plank 3×60 sn"},
       {t:"Pull",b:"Barfiks 5×5 · Ters kürek 4×12 · Muscle-up progresyonu 4×3 · Hollow hold 3×40 sn"},
       {t:"Bacak",b:"Pistol progresyonu 4×6 · Shrimp squat 3×8 · Jump squat 3×15 · Nordic curl 3×5"},
       {t:"Skill",b:"Handstand 6×40 sn · L-sit → V-sit 4×15 sn · Front lever progresyonu 4×10 sn"},
       {t:"Tüm vücut · devre",b:"4 tur: 8 barfiks + 12 şınav + 15 squat + 30 sn plank"}]},

  kb_simple3:{ venue:"kettlebell", label:"Sade kettlebell", freq:3,
    desc:"İki hareket etrafında kurulu: salınım arka zinciri ve nefesi, Türk kalkışı denge ve omuz sağlamlığını çalıştırır. Tek bir kettlebell yeter.",
    note:"Salınım kalçadan gelir, kolla çekilmez. Tekniği oturmadan ağırlık artırma.",
    s:[{t:"Salınım + kalkış",b:"Kettlebell swing 10×10 · Türk kalkışı 5×1 (her taraf)"},
       {t:"Kuvvet devresi",b:"Goblet squat 5×8 · Tek kol press 5×5 · Kettlebell row 5×8 · Farmer taşıma 3×40 m"},
       {t:"Salınım + kalkış",b:"Tek kol swing 10×10 · Türk kalkışı 5×1 · Plank 3×45 sn"}]},

  mob_flow4:{ venue:"mobility", label:"Yoga & mobilite akışı", freq:4,
    desc:"Masa başı çalışanlar için kalça açıcı ve omurga hareketliliği odaklı. Kuvvet programının yanında ikinci program olarak da kullanılabilir.",
    note:"Pozlarda nefesi tutma; her pozda 5-8 nefes kal.",
    s:[{t:"Akış · tüm vücut",b:"Güneş selamı 5 tur · Savaşçı serisi · Köprü · 10 dk nefes çalışması"},
       {t:"Kalça ve alt sırt",b:"Güvercin · Kelebek · Kedi-inek · Çocuk pozu (her poz 60-90 sn)"},
       {t:"Güç akışı",b:"Plank serisi · Yan plank · Sandalye pozu · Ağaç dengesi (20 dk)"},
       {t:"Esneklik",b:"Öne eğilme · Hamstring serisi · Omuz açıcılar · 15 dk gevşeme"}]},

  swim_base3:{ venue:"swim", label:"Yüzme · temel", freq:3,
    desc:"Eklem yükü düşük. Diz veya bel şikayeti olanlar ile yüksek kilodan başlayanlar için uygun.",
    note:"Mesafeleri kendi seviyene göre ölçekle; teknik hızdan önce gelir.",
    s:[{t:"Teknik",b:"200 m ısınma · 8×50 m teknik (nefes, ayak vuruşu) · 200 m serbest"},
       {t:"Dayanıklılık",b:"300 m ısınma · 6×100 m serbest (20 sn ara) · 200 m soğuma"},
       {t:"Aralıklı",b:"200 m ısınma · 10×50 m hızlı (30 sn ara) · 8×25 m sprint · 200 m soğuma"}]}
};

const PATTERN = { 3:[1,3,5], 4:[1,2,4,5], 5:[1,2,3,5,6] };

/* Antrenman günleri: kullanıcı seçtiyse onunkiler, yoksa varsayılan desen. */
function planDays(profile, freq){
  const d = ((profile && profile.days) || []).slice().sort((a,b) => a-b);
  if (d.length === freq) return d;
  if (d.length > freq) return d.slice(0, freq);
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
  const want = (days && days.length >= 3) ? Math.max(3, Math.min(5, days.length))
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
    return { id:null, title:"Program yok", freq:0, desc:"", note:"",
             cardio:"", none:true, days };
  }
  const goal = profile.goal;
  const cardio = { lose:"Haftada 3 × 30 dk tempolu kardiyo, antrenman sonrası.",
                   maintain:"Haftada 2 × 25 dk hafif kardiyo yeterli.",
                   gain:"Kardiyoyu haftada 2 × 20 dk ile sınırla." }[goal];

  /* Kullanıcının kendi yazdığı program: hareketler hazır programlarla aynı
     biçime ("Ad 3×10") çevrilir, böylece kayıt ve antrenman modu aynen çalışır. */
  if (profile.programId === "custom" && customCount(profile)){
    const days = [];
    for (let d = 1; d <= 7; d++){
      const c = profile.custom.days[d];
      const on = c && c.ex && c.ex.length;
      const day = on ? { wd:d, t:c.t || "Antrenman", b:c.ex.map(x => `${x.n} ${x.s}×${x.r}`).join(" · ") }
                     : { wd:d, t:"Dinlenme", b:"" };
      day.icon = sessionIcon(day.t, "gym");
      days.push(day);
    }
    return { id:"custom", custom:true, title:"Kendi programın", freq:customCount(profile),
             desc:"", note:"Bunu sen yazdın. Hazır programlardan birine dönmek için yukarıdan seç.", cardio, days };
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
    if (i >= 0) day = { wd:d, t:prog.s[i].t, b:applyAvoid(prog.s[i].b, profile.avoid) };
    else if (prog.freq < 5 && d === 6) day = { wd:d, t:"Aktif dinlenme", b:applyAvoid(cat.active, profile.avoid) };
    else day = { wd:d, t:"Dinlenme", b:"" };
    day.icon = sessionIcon(day.t, prog.venue);
    days.push(day);
  }

  return { id, title:`${cat.label} · ${prog.label}`, freq:prog.freq,
           desc:prog.desc, note:prog.note, cardio, days };
}

function suggestedTitles(program, key){
  const day = program.training.none ? null : program.training.days.find(d => d.wd === isoWeekday(key));
  const out = [];
  if (day) out.push(day.b ? "Antrenman: " + day.t : "Dinlenme günü — 20 dk esneme");
  out.push(program.kcal + " kcal hedefini tut");
  out.push(program.protein + " g protein al");
  out.push(program.water + " ml su iç");
  out.push(`${sleepBand()[0]}-${sleepBand()[1]} saat uyu`);
  out.push("Sabah kilo ölçümü");
  if (stepGoal()) out.push(stepGoal() + " adım at");
  return out;
}
