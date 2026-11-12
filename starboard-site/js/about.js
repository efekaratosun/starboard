"use strict";

/* ---------------- hakkında: sağlık uyarısı, kaynaklar, gizlilik ----------------
   App Store kural 1.4.1 (sağlık hesapları kaynak göstermeli, tıbbi tavsiye olmadığı
   açık olmalı) ve 5.1 (gizlilik) için. Ayarlar'ın altında açılır kapanır bölümler.
   Gizlilik politikasının tamamı sitede ayrı sayfadadır: privacy.html. */
const DISCLAIMER = tx("Starboard genel sağlık ve fitness takibi içindir; tıbbi tavsiye, tanı ya da tedavi yerine geçmez. Hesaplar ortalama formüllerden gelir ve kişiden kişiye değişir. Hamileysen, emziriyorsan, kronik bir hastalığın ya da yeme bozukluğu geçmişin varsa veya düzenli ilaç kullanıyorsan beslenme ve egzersiz planını değiştirmeden önce hekimine ya da diyetisyene danış.");

/* Kodda kullanılan yöntemler ve dayandıkları kaynaklar. Hesap değişirse burası da güncellenir. */
const SOURCES = [
  [tx("Bazal metabolizma"), tx("Mifflin-St Jeor denklemi (Mifflin ve ark., 1990); yağ oranı girildiyse Katch-McArdle denklemi.")],
  [tx("Günlük enerji ihtiyacı"), tx("Bazal metabolizma × aktivite katsayısı (1,2–1,9), yaygın kullanılan fiziksel aktivite katsayıları.")],
  [tx("Kalori hedefi"), tx("Yağ kaybında bakımın yaklaşık %18 altı, kas kazanımında %12 üstü. Alt sınır erkekte 1500, kadında 1200 kcal. Kas kazanımında bakımın %5–20 üstü (Iraki ve ark., 2019). Kilo yönetimi: NICE CG189.")],
  [tx("Protein"), tx("Yağsız kütle başına 2,0–2,4 g/kg, en fazla vücut ağırlığı başına 2,5 g (ISSN pozisyon bildirisi, Jäger ve ark., 2017; Helms ve ark., 2014).")],
  [tx("Yağ ve karbonhidrat"), tx("Yağ kalorinin %25'i (kabul edilebilir aralık %20–35, ABD Ulusal Tıp Akademisi); kalan kalori karbonhidrattan.")],
  [tx("Lif"), tx("1000 kcal başına 14 g (ABD Beslenme Rehberi).")],
  [tx("Su"), tx("Vücut ağırlığı başına 35 ml; EFSA'nın günlük yeterli alım değerleriyle (kadında 2,0, erkekte 2,5 litre) uyumlu.")],
  [tx("Uyku"), tx("Yetişkinlerde gecede 7–9 saat (Amerikan Uyku Tıbbı Akademisi; Ulusal Uyku Vakfı).")],
  [tx("Kilo aralığı"), tx("Beden kitle indeksi 18,5–24,9 (Dünya Sağlık Örgütü).")],
  [tx("Yağ oranı"), tx("Amerikan Egzersiz Konseyi (ACE) yağ oranı kategorileri.")],
  [tx("Haftalık kilo değişimi"), tx("Kilo verirken hedef hız haftada vücut ağırlığının %0,35–1'i; Helms ve ark. (2014) %0,5–1 önerir.")],
  [tx("Kişisel rekorlar"), tx("Tahmini tek tekrar maksimumu: Epley formülü.")],
  [tx("Besin değerleri"), tx("USDA FoodData Central ve yaygın besin tablolarından alınmış ortalama değerler; markaya ve tarife göre değişir.")]
];

function aboutSection(){
  const block = (title, body) => `<details class="about"><summary>${title}</summary><div class="about-b">${body}</div></details>`;
  return `<section>
    <h2>${tx("Hakkında")}</h2>
    ${block(tx("Sağlık uyarısı"), `<p>${DISCLAIMER}</p>`)}
    ${block(tx("Hesapların kaynakları"), SOURCES.map(([t, s]) => `<p><b>${t}</b><br>${s}</p>`).join(""))}
    ${block(tx("Gizlilik"), `<p>${tx("Starboard hesap istemez. Girdiğin bütün veriler yalnızca bu cihazda tutulur; sunucuya gönderilmez, kimseyle paylaşılmaz. Reklam, analiz ya da izleme aracı yoktur.")}</p>
      <p>${tx("Site GitHub Pages'te barındırılır; GitHub sayfayı açtığında IP adresini görebilir. Yazı tipi uygulamanın içinden yüklenir, başka bir yere istek gitmez. Verilerini Ayarlar'daki \"Tüm verileri sil\" ile tamamen silebilirsin.")}</p>
      <p><a href="privacy.html" target="_blank" rel="noopener">${tx("Gizlilik politikasının tamamı")}</a></p>`)}
  </section>`;
}
