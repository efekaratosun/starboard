#!/usr/bin/env node
// Besin kayitlarinin 100 g degerlerini USDA verisinden hesaplar ve denetler.
// Yalnizca Node yerlesik modulleri kullanilir.
'use strict';

const fs = require('fs');
const path = require('path');

const VARSAYILAN = {
  kaynakDir: path.join(__dirname, 'kaynak'),
  ciktiDir: path.join(__dirname, 'cikti'),
  indexYolu: path.join(__dirname, '..', 'usda', 'cache', 'index.json'),
  fnddsIndexYolu: path.join(__dirname, '..', 'usda', 'cache', 'index-survey.json'),
};

const SR_ADI = 'SR Legacy';
const FNDDS_ADI = 'FNDDS 2021-2023';

class BesinHatasi extends Error {}
class UyariListesi {
  constructor() {
    this.kayitlar = [];
  }
  ekle(key, mesaj) {
    this.kayitlar.push({ key, mesaj });
  }
}

function sayi(x) {
  return typeof x === 'number' && isFinite(x);
}

function r1(x) {
  const v = Math.round((x + Number.EPSILON) * 10) / 10;
  return v === 0 ? 0 : v;
}

// Turkce harfleri ASCII karsiligina cevirip kucuk harfe indirir.
const TR_HARF = { ı: 'i', İ: 'i', ş: 's', Ş: 's', ğ: 'g', Ğ: 'g', ç: 'c', Ç: 'c', ö: 'o', Ö: 'o', ü: 'u', Ü: 'u' };
function norm(s) {
  return String(s).replace(/[ıİşŞğĞçÇöÖüÜ]/g, (ch) => TR_HARF[ch]).toLowerCase();
}

const PISMIS_SOZCUK = ['pismis', 'haslanmis', 'kizarmis', 'kavrulmus'];
const CIG_SOZCUK = ['cig'];
const RAW_DESEN = /\braw\b/;
const PISMIS_DESEN = /\b(cooked|boiled|roasted|fried|baked)\b/;

function indexOku(yol) {
  if (!fs.existsSync(yol)) {
    throw new BesinHatasi('USDA dizini yok: ' + yol + ' (once: node tools/usda/fetch.js)');
  }
  const liste = JSON.parse(fs.readFileSync(yol, 'utf8'));
  const harita = new Map();
  for (const r of liste) harita.set(r.fdcId, r);
  return harita;
}

// FNDDS dizini istege baglidir: yoksa yalniz SR Legacy ile calisilir.
function fnddsIndexOku(yol) {
  if (yol && fs.existsSync(yol)) return indexOku(yol);
  const bos = new Map();
  bos.dizinEksik = true;
  return bos;
}

// Bir USDA kaydinin 100 g degerleri. protein/yag/karbonhidrat/kcal null ise hata.
// fdc iki dizinde de aranir; ikisinde birden varsa belirsizlik oldugu icin hata verilir.
// porsiyonAdi yalniz FNDDS kayitlarinda gecerlidir ve o porsiyonun gramini dondurur.
function usdaDegerleri(veri, fdc, porsiyonAdi) {
  if (veri instanceof Map) veri = { sr: veri, fndds: new Map() };
  if (!sayi(fdc)) throw new BesinHatasi('fdc sayi olmali (gelen: ' + JSON.stringify(fdc) + ')');
  const srKayit = veri.sr.get(fdc);
  const fnddsKayit = veri.fndds.get(fdc);
  if (srKayit && fnddsKayit) {
    throw new BesinHatasi(
      'fdc ' + fdc + ' hem SR Legacy ("' + srKayit.description + '") hem FNDDS ("' +
        fnddsKayit.description + '") dizininde var, hangisi oldugu belirsiz'
    );
  }
  const r = srKayit || fnddsKayit;
  if (!r && veri.fndds.dizinEksik) {
    throw new BesinHatasi('FNDDS dizini yok: ' + VARSAYILAN.fnddsIndexYolu + ' (once node tools/usda/fetch.js)');
  }
  if (!r) throw new BesinHatasi('fdc ' + fdc + ' USDA dizininde yok');
  const fndds = !!fnddsKayit;
  for (const alan of ['protein', 'fat', 'carbs', 'kcal']) {
    if (!sayi(r[alan])) {
      throw new BesinHatasi('fdc ' + fdc + ' (' + r.description + ') alaninda ' + alan + ' null');
    }
  }

  let porsiyonG = null;
  if (porsiyonAdi !== undefined) {
    if (typeof porsiyonAdi !== 'string' || porsiyonAdi.trim() === '') {
      throw new BesinHatasi('fdc ' + fdc + ': porsiyon_adi bos olmayan bir metin olmali');
    }
    if (!fndds) {
      throw new BesinHatasi('fdc ' + fdc + ' (' + r.description + '): porsiyon_adi yalniz FNDDS kayitlarinda kullanilir');
    }
    const eslesen = (r.porsiyonlar || []).filter((p) => p.aciklama === porsiyonAdi);
    if (eslesen.length === 0) {
      const mevcut = (r.porsiyonlar || []).map((p) => '"' + p.aciklama + '"').join(', ');
      throw new BesinHatasi(
        'fdc ' + fdc + ' (' + r.description + '): porsiyon "' + porsiyonAdi + '" bulunamadi (mevcut: ' + mevcut + ')'
      );
    }
    if (eslesen.length > 1) {
      throw new BesinHatasi('fdc ' + fdc + ': porsiyon "' + porsiyonAdi + '" birden fazla kez var');
    }
    if (!sayi(eslesen[0].g) || eslesen[0].g <= 0) {
      throw new BesinHatasi('fdc ' + fdc + ': porsiyon "' + porsiyonAdi + '" icin gram agirligi yok ya da sifir');
    }
    porsiyonG = eslesen[0].g;
  }

  return {
    veriSeti: fndds ? FNDDS_ADI : SR_ADI,
    porsiyonG,
    p: r.protein,
    c: r.carbs,
    f: r.fat,
    lif: sayi(r.fiber) ? r.fiber : 0,
    lifEksik: !sayi(r.fiber),
    alk: sayi(r.alcohol) ? r.alcohol : 0,
    kcal: r.kcal,
    fdc: r.fdcId,
    aciklama: r.description,
    malzemeler: null,
  };
}

function malzDegerleri(m, key, zincir, index, coz, uyarilar) {
  if (!m || typeof m !== 'object') {
    throw new BesinHatasi(key + ': malz elemani bir nesne olmali');
  }
  if (typeof m.ad !== 'string' || m.ad.trim() === '') {
    throw new BesinHatasi(key + ': malz elemaninda ad yok');
  }

  const seciciler = [m.fdc !== undefined, m.key !== undefined, m.su !== undefined].filter(Boolean).length;
  if (seciciler > 1) {
    throw new BesinHatasi(key + ': malz "' + m.ad + '" icin fdc, key, su alanlarindan yalniz biri verilmeli');
  }
  if (seciciler === 0) {
    throw new BesinHatasi(key + ': malz "' + m.ad + '" icin fdc, key ya da su alanlarindan biri gerekli');
  }

  if (!sayi(m.g) || m.g <= 0) {
    throw new BesinHatasi(key + ': malz "' + m.ad + '" icin gecersiz g');
  }

  let d;
  if (m.su !== undefined) {
    if (m.su !== true) throw new BesinHatasi(key + ': malz "' + m.ad + '" icin su true olmali');
    d = { p: 0, c: 0, f: 0, lif: 0, lifEksik: false, alk: 0, kcal: 0, fdc: null, aciklama: null, malzemeler: null };
  } else if (m.fdc !== undefined) {
    if (!sayi(m.fdc)) throw new BesinHatasi(key + ': fdc sayi olmali');
    d = usdaDegerleri(index, m.fdc);
  } else {
    if (typeof m.key !== 'string' || !m.key) {
      throw new BesinHatasi(key + ': malz "' + m.ad + '" icin key gecersiz');
    }
    d = coz(m.key, zincir);
  }

  // Pismis/cig celiskisi: malz adi ile USDA kaydinin hazirlik bicimi uyusmuyor mu?
  if (d.aciklama) {
    const ad = norm(m.ad);
    const desc = norm(d.aciklama);
    const adPismis = PISMIS_SOZCUK.some((s) => ad.includes(s));
    const adCig = CIG_SOZCUK.some((s) => ad.includes(s));
    if (adPismis && RAW_DESEN.test(desc)) {
      uyarilar.ekle(key, 'malz "' + m.ad + '": ad pismis diyor, USDA kaydi "' + d.aciklama + '" raw');
    }
    if (adCig && PISMIS_DESEN.test(desc)) {
      uyarilar.ekle(key, 'malz "' + m.ad + '": ad cig diyor, USDA kaydi "' + d.aciklama + '" pismis');
    }
  }

  return d;
}

function tarifCoz(k, zincir, index, coz, uyarilar) {
  if (!Array.isArray(k.malz) || k.malz.length === 0) {
    throw new BesinHatasi(k.key + ': malz dizisi bos');
  }
  if (!sayi(k.pismis_g) || k.pismis_g <= 0) {
    throw new BesinHatasi(k.key + ': gecersiz pismis_g');
  }
  if (!Number.isInteger(k.porsiyon) || k.porsiyon < 1) {
    throw new BesinHatasi(k.key + ': porsiyon tam sayi olmali ve 1 den kucuk olamaz');
  }

  let P = 0;
  let C = 0;
  let F = 0;
  let L = 0;
  let A = 0;
  let K = 0;
  let toplamAgirlik = 0;
  let lifEksik = false;
  const malzemeler = [];

  for (const m of k.malz) {
    const d = malzDegerleri(m, k.key, zincir, index, coz, uyarilar);
    const oran = m.g / 100;
    const kcalKatki = d.kcal * oran;
    P += d.p * oran;
    C += d.c * oran;
    F += d.f * oran;
    L += d.lif * oran;
    A += d.alk * oran;
    K += kcalKatki;
    toplamAgirlik += m.g;
    lifEksik = lifEksik || d.lifEksik;
    malzemeler.push({ ad: m.ad, g: m.g, fdc: d.fdc, aciklama: d.aciklama, kcal: kcalKatki });
  }

  if (k.pismis_g > toplamAgirlik + 1e-9) {
    throw new BesinHatasi(
      k.key + ': pismis_g (' + k.pismis_g + ') toplam malzeme agirligindan (' +
        r1(toplamAgirlik) + ' g) buyuk'
    );
  }

  const porsiyonG = k.pismis_g / k.porsiyon;
  if (porsiyonG < 1) {
    throw new BesinHatasi(k.key + ': porsiyon_g 1 den kucuk (' + r1(porsiyonG) + ' g)');
  }

  const oran = 100 / k.pismis_g;
  const d = {
    p: P * oran,
    c: C * oran,
    f: F * oran,
    lif: L * oran,
    alk: A * oran,
    kcal: K * oran,
    lifEksik,
    fdc: null,
    aciklama: null,
    malzemeler,
    pismisG: k.pismis_g,
    porsiyon: k.porsiyon,
    toplamKcal: K,
  };

  if (d.p + d.c + d.f > 100 + 1e-9) {
    throw new BesinHatasi(
      k.key + ': p+c+f 100 g\'i asiyor (' + r1(d.p + d.c + d.f) + ' g)'
    );
  }

  if (k.pismis_g < 0.4 * toplamAgirlik) {
    uyarilar.ekle(
      k.key,
      'pismis_g toplam agirligin %40 indan kucuk (' + r1(k.pismis_g) + ' g / ' + r1(toplamAgirlik) + ' g)'
    );
  }

  return d;
}

// Kayitlari cozer, cikti nesnesini ve uyarilari uretir. Hatalar BesinHatasi firlatir.
function hesapla(kayitlar, index) {
  const veri = index && index.sr instanceof Map ? index : { sr: index, fndds: new Map() };
  if (!Array.isArray(kayitlar)) throw new BesinHatasi('girdi bir dizi olmali');

  const harita = new Map();
  for (const k of kayitlar) {
    if (!k || typeof k.key !== 'string' || k.key.trim() === '') {
      throw new BesinHatasi('key alani olmayan kayit');
    }
    if (harita.has(k.key)) throw new BesinHatasi('tekrar eden key: ' + k.key);
    harita.set(k.key, k);
  }

  const onbellek = new Map();
  const uyarilar = new UyariListesi();

  function coz(key, zincir) {
    if (onbellek.has(key)) return onbellek.get(key);
    if (zincir.includes(key)) {
      throw new BesinHatasi('key dongusu: ' + zincir.concat(key).join(' -> '));
    }
    const k = harita.get(key);
    if (!k) throw new BesinHatasi('bulunamayan key: ' + key);

    let d;
    if (k.tip === 'usda') {
      d = usdaDegerleri(veri, k.fdc, k.porsiyon_adi);
    } else if (k.tip === 'tarif') {
      d = tarifCoz(k, zincir.concat(key), index, coz, uyarilar);
    } else {
      throw new BesinHatasi(key + ': bilinmeyen tip "' + k.tip + '"');
    }
    onbellek.set(key, d);
    return d;
  }

  const sonuc = {};
  const katkilar = {};
  for (const k of kayitlar) {
    const d = coz(k.key, []);
    const p = r1(d.p);
    const c = r1(d.c);
    const f = r1(d.f);
    const lif = r1(d.lif);
    const alk = r1(d.alk);
    const kcalUsda = Math.round(d.kcal);
    const kcal449 = Math.round(4 * p + 4 * c + 9 * f + 7 * alk);

    // Porsiyon degerleri HAM degerlerden, yalniz en sonda yuvarlanir.
    const porsiyonG = d.pismisG ? d.pismisG / d.porsiyon : null;
    const porsiyonKcal = d.pismisG ? d.toplamKcal / d.porsiyon : null;

    sonuc[k.key] = {
      p,
      c,
      f,
      lif,
      alk,
      kcal_usda: kcalUsda,
      kcal_449: kcal449,
      porsiyon_g: porsiyonG === null ? null : Math.round(porsiyonG),
      porsiyon_kcal: porsiyonKcal === null ? null : Math.round(porsiyonKcal),
      kaynak: d.malzemeler
        ? d.malzemeler.map((m) => ({ ad: m.ad, g: m.g, fdc: m.fdc, aciklama: m.aciklama }))
        : (k.tip === 'usda' ? d.veriSeti : d.aciklama),
      ...(k.tip === 'usda' ? { description: d.aciklama, porsiyon_adi: k.porsiyon_adi || null, porsiyon_g: d.porsiyonG } : {}),
    };
    katkilar[k.key] = d.malzemeler || null;

    // Lif 4 kcal/g degil 2 kcal/g sayilir; yuzde ve 15 kcal esikleri birlikte aranir.
    if (kcalUsda > 0) {
      const kontrol = 4 * d.p + 4 * (d.c - d.lif) + 2 * d.lif + 9 * d.f + 7 * d.alk;
      const fark = Math.abs(kontrol - d.kcal);
      if (fark > 0.12 * d.kcal && fark > 15) {
        uyarilar.ekle(
          k.key,
          'kcal_449 (' + kcal449 + ') ile kcal_usda (' + kcalUsda + ') farki %12 ve 15 kcal esigini asiyor'
        );
      }
    }
    if (d.lifEksik) uyarilar.ekle(k.key, 'lif null, 0 sayildi');
    if (lif > c) uyarilar.ekle(k.key, 'lif (' + lif + ') karbonhidrattan (' + c + ') buyuk');
  }

  return { sonuc, uyarilar: uyarilar.kayitlar, adlar: harita, katkilar };
}

function tabloYaz(kayitlar, sonuc, uyarilar, katkilar) {
  const basliklar = ['key', 'ad', 'p', 'c', 'f', 'lif', 'alk', 'kcal_usda', 'kcal_449', 'por_g', 'por_kcal'];
  const satirlar = kayitlar.map((k) => {
    const r = sonuc[k.key];
    return [
      k.key,
      String(k.ad || k.key).slice(0, 34),
      r.p.toFixed(1),
      r.c.toFixed(1),
      r.f.toFixed(1),
      r.lif.toFixed(1),
      r.alk.toFixed(1),
      String(r.kcal_usda),
      String(r.kcal_449),
      r.porsiyon_g === null ? '-' : String(r.porsiyon_g),
      r.porsiyon_kcal === null ? '-' : String(r.porsiyon_kcal),
    ];
  });

  const genislik = basliklar.map((b, i) => Math.max(b.length, ...satirlar.map((s) => s[i].length)));
  const yaz = (s) => s.map((h, i) => h.padEnd(genislik[i])).join('  ').trimEnd();

  console.log(yaz(basliklar));
  console.log(genislik.map((g) => '-'.repeat(g)).join('  '));
  for (const s of satirlar) console.log(yaz(s));

  // Her tarif icin malzeme dokumu: yanlis secilmis USDA kaydi gorulebilsin.
  for (const k of kayitlar) {
    const malz = (katkilar || {})[k.key];
    if (!Array.isArray(malz)) continue;
    console.log('\n' + k.key + ' malzemeleri:');
    const mSatir = malz.map((m) => [
      String(m.ad).slice(0, 30),
      String(m.g),
      m.fdc === null ? '-' : String(m.fdc),
      m.aciklama === null ? '-' : String(m.aciklama).slice(0, 44),
      (m.kcal || 0).toFixed(1),
    ]);
    const mBaslik = ['ad', 'g', 'fdc', 'description', 'kcal'];
    const mGenislik = mBaslik.map((b, i) => Math.max(b.length, ...mSatir.map((s) => s[i].length)));
    const mYaz = (s) => s.map((h, i) => h.padEnd(mGenislik[i])).join('  ').trimEnd();
    console.log('  ' + mYaz(mBaslik));
    for (const s of mSatir) console.log('  ' + mYaz(s));
  }

  for (const u of uyarilar) console.error('UYARI [' + u.key + ']: ' + u.mesaj);
}

function calistir(parti, ayarlar) {
  const ayar = Object.assign({}, VARSAYILAN, ayarlar || {});
  if (!parti) throw new BesinHatasi('parti adi gerekli (ornek: ornek)');

  const kaynakYolu = path.join(ayar.kaynakDir, parti + '.json');
  if (!fs.existsSync(kaynakYolu)) throw new BesinHatasi('girdi bulunamadi: ' + kaynakYolu);

  const kayitlar = JSON.parse(fs.readFileSync(kaynakYolu, 'utf8'));
  const index = { sr: indexOku(ayar.indexYolu), fndds: fnddsIndexOku(ayar.fnddsIndexYolu) };
  const { sonuc, uyarilar, katkilar } = hesapla(kayitlar, index);

  fs.mkdirSync(ayar.ciktiDir, { recursive: true });
  const ciktiYolu = path.join(ayar.ciktiDir, parti + '.json');
  fs.writeFileSync(ciktiYolu, JSON.stringify(sonuc, null, 2) + '\n');

  return { sonuc, uyarilar, ciktiYolu, kayitlar, katkilar };
}

if (require.main === module) {
  const parti = process.argv[2];
  if (!parti) {
    console.error('Kullanim: node tools/besin/hesapla.js PARTI');
    process.exit(1);
  }
  try {
    const r = calistir(parti);
    tabloYaz(r.kayitlar, r.sonuc, r.uyarilar, r.katkilar);
    console.log('\nYazildi: ' + r.ciktiYolu);
  } catch (e) {
    console.error('HATA: ' + e.message);
    process.exit(1);
  }
}

module.exports = { calistir, hesapla, indexOku, tabloYaz, BesinHatasi, VARSAYILAN };
