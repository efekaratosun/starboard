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

/* Cinsiyete bağlı sabitler. Belirtilmemişse iki değerin ortalaması kullanılır. */
const sexK = (sex, m, f) => sex === "male" ? m : sex === "female" ? f : (m + f) / 2;

/* Avatarlar: herkes seçebilir. f = yüz konumu [x, y, ölçek] (tepki ifadeleri için). */
const AVATARS = [
  ["m",tx("Erkek"),[24,7.8,.42],"human"], ["f",tx("Kadın"),[24,8,.42],"human"], ["n",tx("Figür"),[24,8.5,.46],"human"],
  ["star",tx("Yıldız"),[24,27,.95],"nature"], ["drop",tx("Damla"),[24,34,1.05],"nature"], ["leaf",tx("Yaprak"),[24,31,.95],"nature"],
  ["fire",tx("Ateş"),[24,34,.9],"nature"], ["bolt",tx("Şimşek"),[23,27,.7],"nature"], ["mountain",tx("Dağ"),[25,37,.8],"nature"],
  ["moon",tx("Ay"),[18,25,.85],"nature"], ["heart",tx("Kalp"),[24,24,.95],"nature"], ["sun",tx("Güneş"),[24,28,.85],"nature"],
  ["run",tx("Koşucu"),[29,9,.42],"sport"], ["lift",tx("Halterci"),[24,15,.42],"sport"], ["yoga",tx("Yogi"),[24,9,.42],"sport"],
  ["swim",tx("Yüzücü"),[10,29,.42],"sport"], ["bike",tx("Bisikletçi"),[27,11,.42],"sport"], ["box",tx("Boksör"),[21,11,.42],"sport"],
  ["ball",tx("Futbolcu"),[20,9,.42],"sport"], ["hoop",tx("Basketbolcu"),[22,12,.42],"sport"], ["tennis",tx("Tenisçi"),[19,10,.42],"sport"],
  ["climb",tx("Tırmanıcı"),[26,10,.42],"sport"], ["ski",tx("Kayakçı"),[22,14,.42],"sport"], ["dance",tx("Dansçı"),[24,8,.42],"sport"],
  ["rocket",tx("Roket"),[24,31,.6],"space"], ["planet",tx("Gezegen"),[24,30,.95],"space"], ["astro",tx("Astronot"),[24,16,.62],"space"],
  ["alien",tx("Uzaylı"),[24,24,.95],"space"], ["ufo","UFO",[24,23,.55],"space"], ["comet",tx("Kuyruklu yıldız"),[31,21,.7],"space"]
];
const AV_CATS = [["human",tx("İnsan")],["sport",tx("Sporcu")],["nature",tx("Doğa")],["space",tx("Uzay")]];
const AV_COLORS = [["#FF5A3C",tx("Mercan")],["#FF9500",tx("Turuncu")],["#E8B400",tx("Sarı")],["#16B86A",tx("Yeşil")],
  ["#00AFA0",tx("Turkuaz")],["#2F7BEA",tx("Mavi")],["#7C4DFF",tx("Mor")],["#E84A93",tx("Pembe")]];
const avKey = p => AVATARS.some(a => a[0] === p.avatar) ? p.avatar : p.sex === "female" ? "f" : p.sex === "male" ? "m" : "n";
const avSym = k => k === "m" ? "i-body" : k === "f" ? "i-body-f" : "i-av-" + k;
const avColor = p => p.avColor || (p.sex === "female" ? "#E84A93" : p.sex === "male" ? "#2F7BEA" : "#7C4DFF");
function bodyIcon(p){ return avSym(avKey(p)); }
const sexClass = () => "custom";

function avatarPicker(cur, idp){
  const curCat = (AVATARS.find(a => a[0] === cur) || AVATARS[0])[3];
  return `<div class="av-cats" role="tablist" aria-label="${tx("Avatar sınıfları")}">${AV_CATS.map(([c,l]) =>
      `<button type="button" class="chip${c === curCat ? " sel" : ""}" role="tab" aria-selected="${c === curCat}" data-avcat="${c}" data-avp="${idp}">${l}</button>`).join("")}</div>
    ${AV_CATS.map(([c,l]) => `<div class="av-pick" role="radiogroup" aria-label="${tx("{0} avatarları", [(l)])}" data-avgrid="${c}" data-avp="${idp}"${c === curCat ? "" : " hidden"}>
      ${AVATARS.filter(a => a[3] === c).map(([k,n]) =>
        `<button type="button" class="av${cur === k ? " on" : ""}" data-av="${k}" data-avp="${idp}" role="radio" aria-checked="${cur === k}" aria-label="${n}" title="${n}">
          <svg viewBox="0 0 48 64" aria-hidden="true"><use href="#${avSym(k)}"/></svg></button>`).join("")}</div>`).join("")}`;
}
function colorPicker(cur, idp){
  return `<div class="av-cols" role="radiogroup" aria-label="${tx("Avatar rengi")}">${AV_COLORS.map(([c,l]) =>
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
    s:[{t:tx("Antrenman A"),b:tx("Squat 5×5 · Bench press 5×5 · Barbell row 5×5")},
       {t:tx("Antrenman B"),b:tx("Squat 5×5 · Omuz press 5×5 · Deadlift 1×5")},
       {t:tx("Antrenman A"),b:tx("Squat 5×5 · Bench press 5×5 · Barbell row 5×5 · Plank 3×45 sn")}]},

  gym_ul4:{ venue:"gym", label:tx("Üst / Alt bölünmesi"), freq:4,
    desc:tx("Haftada iki üst, iki alt vücut. Kuvvet ve kas hacmi arasında dengeli, en yaygın orta seviye yapı."),
    note:tx("İlk hareketi ağır ve az tekrarla, sonrakileri daha çok tekrarla çalış."),
    s:[{t:tx("Üst A · itiş"),b:tx("Bench press 4×6-8 · Omuz press 3×10 · Kürek 3×10 · Triceps 3×12")},
       {t:tx("Alt A · bacak"),b:tx("Squat 4×6-8 · Romen deadlift 3×10 · Leg press 3×12 · Calf raise 3×15")},
       {t:tx("Üst B · çekiş"),b:tx("Barfiks 4×8 · Incline press 3×10 · Face pull 3×15 · Biceps 3×12")},
       {t:tx("Alt B · bacak"),b:tx("Deadlift 3×5 · Bulgarian split squat 3×10 · Leg curl 3×12 · Plank 3×45 sn")}]},

  gym_531:{ venue:"gym", label:tx("5/3/1 temelli güç"), freq:4,
    desc:tx("Dört ana harekete haftada birer gün. Ağırlıklar tahmini tek tekrar maksimumunun %90'ı üzerinden hesaplanır, son set maksimum tekrar."),
    note:tx("Dört haftalık döngü: ağır, daha ağır, en ağır, hafif toparlanma. Her döngü sonunda alt vücutta 5 kg, üst vücutta 2.5 kg ekle."),
    s:[{t:tx("Omuz press günü"),b:tx("Omuz press 3 set (%65-75-85) · Barfiks 5×10 · Dips 5×10")},
       {t:tx("Deadlift günü"),b:tx("Deadlift 3 set (%65-75-85) · Leg curl 5×10 · Karın 5×15")},
       {t:tx("Bench günü"),b:tx("Bench press 3 set (%65-75-85) · Kürek 5×10 · Dumbbell press 5×10")},
       {t:tx("Squat günü"),b:tx("Squat 3 set (%65-75-85) · Leg press 5×10 · Karın 5×15")}]},

  gym_ppl5:{ venue:"gym", label:tx("Push / Pull / Legs"), freq:5,
    desc:tx("Hareketleri itiş, çekiş ve bacak olarak ayırır. Haftada beş gün ayırabilenler için en verimli hacim dağılımı."),
    note:tx("Toparlanma kritik: aynı kas grubunu üst üste iki gün çalıştırma."),
    s:[{t:tx("Push"),b:tx("Bench press 4×6-8 · Omuz press 3×10 · Incline dumbbell 3×10 · Triceps 3×12")},
       {t:tx("Pull"),b:tx("Barfiks 4×8 · Barbell row 4×8 · Face pull 3×15 · Biceps 3×12")},
       {t:tx("Bacak"),b:tx("Squat 4×6-8 · Romen deadlift 3×10 · Leg press 3×12 · Calf raise 4×15")},
       {t:tx("Üst · hacim"),b:tx("Incline press 4×10 · Kürek 4×10 · Yan omuz 3×15 · Kol süperset 3×12")},
       {t:tx("Alt · hacim"),b:tx("Front squat 3×8 · Hip thrust 4×10 · Leg curl 3×12 · Karın 3×15")}]},

  home_bw3:{ venue:"home", label:tx("Vücut ağırlığı · temel"), freq:3,
    desc:tx("Hiç ekipman gerektirmez. Sandalye, havlu ve duvar yeterli."),
    note:tx("Zorluğu tempoyu yavaşlatarak artır: inişi üç saniyede yap."),
    s:[{t:tx("Tüm vücut A"),b:tx("Sandalye squat 3×15 · Şınav 3×10 · Havlu kürek 3×12 · Plank 3×40 sn")},
       {t:tx("Tüm vücut B"),b:tx("Bulgarian split squat 3×10 · Pike şınav 3×8 · Superman 3×12 · Glute bridge 3×15")},
       {t:tx("Tüm vücut C"),b:tx("Duvar oturuşu 3×45 sn · Elmas şınav 3×10 · Masa altı ters kürek 3×8 · Dead bug 3×12")}]},

  home_pack3:{ venue:"home", label:tx("Sırt çantalı kuvvet"), freq:3,
    desc:tx("Kitapla doldurulmuş bir sırt çantası tek ekipman. Vücut ağırlığı yetmemeye başlayınca sıradaki adım."),
    note:tx("Çantaya kademeli ağırlık ekle; sırta değil göğse alarak da çalışabilirsin."),
    s:[{t:tx("Yüklü tüm vücut A"),b:tx("Çantalı squat 4×12 · Şınav 4×10 · Çantalı kürek 4×12 · Plank 3×45 sn")},
       {t:tx("Yüklü tüm vücut B"),b:tx("Çantalı Romen deadlift 4×10 · Pike şınav 3×10 · Bulgarian split squat 3×10 · Hollow hold 3×30 sn")},
       {t:tx("Yüklü tüm vücut C"),b:tx("Çantalı lunge 4×12 · Elmas şınav 3×12 · Ters kürek 3×10 · Dead bug 3×15")}]},

  home_hiit4:{ venue:"home", label:tx("HIIT + kuvvet devresi"), freq:4,
    desc:tx("Kısa ve yoğun. Aralıklı devre günleriyle kuvvet günlerini dönüşümlü uygular, seans 25-30 dakika."),
    note:tx("Devre günlerinde nabız yüksek kalmalı; dinlenme sürelerini uzatma."),
    s:[{t:tx("HIIT devresi A"),b:"4 tur: 40 sn burpee · jump squat · mountain climber · plank jack (20 sn ara)"},
       {t:tx("Kuvvet · üst"),b:tx("Şınav 4×12 · Pike şınav 3×10 · Sandalye dips 3×12 · Havlu kürek 4×12")},
       {t:tx("HIIT devresi B"),b:tx("5 tur: 30 sn yüksek diz · 30 sn lunge sıçrama · 30 sn şınav (60 sn ara)")},
       {t:tx("Kuvvet · alt"),b:tx("Squat 4×20 · Bulgarian split squat 3×12 · Glute bridge 4×20 · Calf raise 4×25")}]},

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
       {t:tx("Üst vücut · bar"),b:tx("Barfiks 4×max · Ters kürek 4×12 · Bank şınav 4×15 · Karın 3×20")},
       {t:tx("Sprint + bacak"),b:tx("Tepe sprint 10×20 sn · Bank step-up 3×15 · Lunge 3×20 adım")},
       {t:tx("Uzun koşu"),b:tx("40-50 dk düşük tempo koşu · Esneme 10 dk")}]},

  out_end5:{ venue:"outdoor", label:tx("Dayanıklılık odaklı"), freq:5,
    desc:tx("Haftalık koşu hacmini artırmak isteyenler için; iki kuvvet günü sakatlık önleme amaçlı."),
    note:tx("Haftalık toplam mesafeyi %10'dan fazla artırma."),
    s:[{t:tx("Tempo koşusu"),b:tx("25 dk tempolu koşu · Plank 3×45 sn")},
       {t:tx("Üst vücut · itiş"),b:tx("Bank şınav 4×15 · Bank dips 4×12 · Pike şınav 3×10 · Karın 3×20")},
       {t:tx("Sprint + bacak"),b:tx("Merdiven sprint 10×20 sn · Bank step-up 4×12 · Bulgarian split squat 3×10")},
       {t:tx("Üst vücut · çekiş"),b:tx("Barfiks 5×max · Ters kürek 4×12 · Hollow hold 3×30 sn")},
       {t:tx("Uzun koşu"),b:tx("45-60 dk düşük tempo koşu")}]},

  cal_basic3:{ venue:"calisthenics", label:tx("Temel progresyon"), freq:3,
    desc:tx("İtiş, çekiş ve bacak günleri. İlerleme kilo değil hareket zorluğu üzerinden."),
    note:tx("Bir progresyonda 3×8 temiz tekrara ulaşınca üst varyasyona geç."),
    s:[{t:tx("Push"),b:tx("Şınav progresyonu 4×6-10 · Dips 3×6-10 · Pike şınav 3×8 · Plank 3×45 sn")},
       {t:tx("Pull"),b:tx("Barfiks 4×3-8 · Avustralya kürek 3×10 · Lastik face pull 3×15 · Hollow hold 3×30 sn")},
       {t:tx("Bacak + core"),b:tx("Pistol progresyonu 3×6 · Nordic curl progresyonu 3×5 · Jump squat 3×12 · L-sit 3×15 sn")}]},

  cal_ppl4:{ venue:"calisthenics", label:tx("Push / Pull / Bacak / Skill"), freq:4,
    desc:tx("Kuvvet günlerine ayrı bir beceri günü ekler: handstand, L-sit, dragon flag."),
    note:tx("Beceri çalışmasını yorgun değilken, seansın başında yap."),
    s:[{t:tx("Push"),b:tx("Dips 4×8 · Şınav varyasyonu 4×10 · Duvar handstand şınav 3×6 · Triceps ext. 3×12")},
       {t:tx("Pull"),b:tx("Barfiks 5×5 · Chin-up 3×8 · Avustralya kürek 3×12 · Lastik biceps 3×12")},
       {t:tx("Bacak"),b:tx("Pistol progresyonu 4×6 · Shrimp squat 3×8 · Nordic curl 3×5 · Calf raise 4×20")},
       {t:tx("Skill + core"),b:tx("Duvarda handstand 5×30 sn · L-sit 4×15 sn · Hollow rock 3×20 · Dragon flag progresyonu 3×6")}]},

  cal_skill5:{ venue:"calisthenics", label:tx("İleri seviye · beceri"), freq:5,
    desc:tx("Muscle-up, front lever ve handstand şınav gibi ileri hareketlere yönelen hacimli program."),
    note:tx("Eklem ve bağ dokusu kasla aynı hızda güçlenmez; ağrı hissedersen bir basamak geri in."),
    s:[{t:tx("Push"),b:tx("Dips 4×8 · Şınav varyasyonu 4×12 · Handstand şınav progresyonu 3×5 · Plank 3×60 sn")},
       {t:tx("Pull"),b:tx("Barfiks 5×5 · Ters kürek 4×12 · Muscle-up progresyonu 4×3 · Hollow hold 3×40 sn")},
       {t:tx("Bacak"),b:tx("Pistol progresyonu 4×6 · Shrimp squat 3×8 · Jump squat 3×15 · Nordic curl 3×5")},
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
    if (i >= 0) day = { wd:d, t:prog.s[i].t, b:applyAvoid(prog.s[i].b, profile.avoid) };
    else if (prog.freq < 5 && d === 6) day = { wd:d, t:tx("Aktif dinlenme"), b:applyAvoid(cat.active, profile.avoid) };
    else day = { wd:d, t:tx("Dinlenme"), b:"" };
    day.icon = sessionIcon(day.t, prog.venue);
    days.push(day);
  }

  return { id, title:`${cat.label} · ${prog.label}`, freq:prog.freq,
           desc:prog.desc, note:prog.note, cardio, days };
}

function suggestedTitles(program, key){
  const day = program.training.none ? null : program.training.days.find(d => d.wd === isoWeekday(key));
  const out = [];
  if (day) out.push(day.b ? tx("Antrenman: ") + day.t : tx("Dinlenme günü — 20 dk esneme"));
  out.push(program.kcal + " kcal hedefini tut");
  out.push(program.protein + " g protein al");
  out.push(program.water + tx(" ml su iç"));
  out.push(`${sleepBand()[0]}-${sleepBand()[1]} saat uyu`);
  out.push(tx("Sabah kilo ölçümü"));
  if (stepGoal()) out.push(stepGoal() + tx(" adım at"));
  return out;
}
