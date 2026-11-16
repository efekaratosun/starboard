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
};

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

function indexOku(yol) {
  if (!fs.existsSync(yol)) {
    throw new BesinHatasi('USDA dizini yok: ' + yol + ' (once: node tools/usda/fetch.js)');
  }
  const liste = JSON.parse(fs.readFileSync(yol, 'utf8'));
  const harita = new Map();
  for (const r of liste) harita.set(r.fdcId, r);
  return harita;
}

// Bir USDA kaydinin 100 g degerleri. protein/yag/karbonhidrat null ise hata.
function usdaDegerleri(index, fdc) {
  const r = typeof fdc === 'number' ? index.get(fdc) : undefined;
  if (!r) throw new BesinHatasi('fdc ' + fdc + ' USDA dizininde yok');
  for (const alan of ['protein', 'fat', 'carbs']) {
    if (!sayi(r[alan])) {
      throw new BesinHatasi('fdc ' + fdc + ' (' + r.description + ') alaninda ' + alan + ' null');
    }
  }
  return {
    p: r.protein,
    c: r.carbs,
    f: r.fat,
    lif: sayi(r.fiber) ? r.fiber : 0,
    lifEksik: !sayi(r.fiber),
    alk: sayi(r.alcohol) ? r.alcohol : 0,
    kcal: sayi(r.kcal) ? r.kcal : 0,
  };
}

function malzDegerleri(m, key, zincir, index, coz) {
  if (!m || typeof m !== 'object') {
    throw new BesinHatasi(key + ': malz elemani bir nesne olmali');
  }
  if (typeof m.ad !== 'string' || m.ad.trim() === '') {
    throw new BesinHatasi(key + ': malz elemaninda ad yok');
  }
  if (!sayi(m.g) || m.g <= 0) {
    throw new BesinHatasi(key + ': malz "' + m.ad + '" icin gecersiz g');
  }
  if (m.su === true) {
    return { p: 0, c: 0, f: 0, lif: 0, lifEksik: false, alk: 0, kcal: 0 };
  }
  if (m.fdc !== undefined) return usdaDegerleri(index, m.fdc);
  if (typeof m.key === 'string' && m.key) return coz(m.key, zincir);
  throw new BesinHatasi(key + ': malz "' + m.ad + '" bicimi gecersiz (fdc, key ya da su bekleniyor)');
}

function tarifCoz(k, zincir, index, coz, uyarilar) {
  if (!Array.isArray(k.malz) || k.malz.length === 0) {
    throw new BesinHatasi(k.key + ': malz dizisi bos');
  }
  if (!sayi(k.pismis_g) || k.pismis_g <= 0) {
    throw new BesinHatasi(k.key + ': gecersiz pismis_g');
  }
  if (!sayi(k.porsiyon) || k.porsiyon <= 0) {
    throw new BesinHatasi(k.key + ': gecersiz porsiyon');
  }

  let P = 0;
  let C = 0;
  let F = 0;
  let L = 0;
  let A = 0;
  let K = 0;
  let toplamAgirlik = 0;
  let lifEksik = false;

  for (const m of k.malz) {
    const d = malzDegerleri(m, k.key, zincir, index, coz);
    const oran = m.g / 100;
    P += d.p * oran;
    C += d.c * oran;
    F += d.f * oran;
    L += d.lif * oran;
    A += d.alk * oran;
    K += d.kcal * oran;
    toplamAgirlik += m.g;
    lifEksik = lifEksik || d.lifEksik;
  }

  if (k.pismis_g > toplamAgirlik + 1e-9) {
    throw new BesinHatasi(
      k.key + ': pismis_g (' + k.pismis_g + ') toplam malzeme agirligindan (' +
        r1(toplamAgirlik) + ' g) buyuk'
    );
  }

  const oran = 100 / k.pismis_g;
  const d = { p: P * oran, c: C * oran, f: F * oran, lif: L * oran, alk: A * oran, kcal: K * oran, lifEksik };

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

  d.pismisG = k.pismis_g;
  d.porsiyon = k.porsiyon;
  return d;
}

// Kayitlari cozer, cikti nesnesini ve uyarilari uretir. Hatalar BesinHatasi firlatir.
function hesapla(kayitlar, index) {
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
      d = usdaDegerleri(index, k.fdc);
    } else if (k.tip === 'tarif') {
      d = tarifCoz(k, zincir.concat(key), index, coz, uyarilar);
    } else {
      throw new BesinHatasi(key + ': bilinmeyen tip "' + k.tip + '"');
    }
    onbellek.set(key, d);
    return d;
  }

  const sonuc = {};
  for (const k of kayitlar) {
    const d = coz(k.key, []);
    const p = r1(d.p);
    const c = r1(d.c);
    const f = r1(d.f);
    const lif = r1(d.lif);
    const alk = r1(d.alk);
    const kcalUsda = Math.round(d.kcal);
    const kcal449 = Math.round(4 * p + 4 * c + 9 * f + 7 * alk);
    const porsiyonG = d.pismisG ? Math.round(d.pismisG / d.porsiyon) : null;

    sonuc[k.key] = {
      p,
      c,
      f,
      lif,
      alk,
      kcal_usda: kcalUsda,
      kcal_449: kcal449,
      porsiyon_g: porsiyonG,
      porsiyon_kcal: porsiyonG === null ? null : Math.round((kcalUsda * porsiyonG) / 100),
    };

    if (kcalUsda > 0 && Math.abs(kcal449 - kcalUsda) / kcalUsda > 0.12) {
      uyarilar.ekle(
        k.key,
        'kcal_449 (' + kcal449 + ') ile kcal_usda (' + kcalUsda + ') farki %12 den fazla'
      );
    }
    if (d.lifEksik) uyarilar.ekle(k.key, 'lif null, 0 sayildi');
    if (lif > c) uyarilar.ekle(k.key, 'lif (' + lif + ') karbonhidrattan (' + c + ') buyuk');
  }

  return { sonuc, uyarilar: uyarilar.kayitlar, adlar: harita };
}

function tabloYaz(kayitlar, sonuc, uyarilar) {
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

  const genislik = basliklar.map((b, i) =>
    Math.max(b.length, ...satirlar.map((s) => s[i].length))
  );
  const yaz = (s) => s.map((h, i) => h.padEnd(genislik[i])).join('  ').trimEnd();

  console.log(yaz(basliklar));
  console.log(genislik.map((g) => '-'.repeat(g)).join('  '));
  for (const s of satirlar) console.log(yaz(s));
  for (const u of uyarilar) console.error('UYARI [' + u.key + ']: ' + u.mesaj);
}

function calistir(parti, ayarlar) {
  const ayar = Object.assign({}, VARSAYILAN, ayarlar || {});
  if (!parti) throw new BesinHatasi('parti adi gerekli (ornek: ornek)');

  const kaynakYolu = path.join(ayar.kaynakDir, parti + '.json');
  if (!fs.existsSync(kaynakYolu)) throw new BesinHatasi('girdi bulunamadi: ' + kaynakYolu);

  const kayitlar = JSON.parse(fs.readFileSync(kaynakYolu, 'utf8'));
  const index = indexOku(ayar.indexYolu);
  const { sonuc, uyarilar } = hesapla(kayitlar, index);

  fs.mkdirSync(ayar.ciktiDir, { recursive: true });
  const ciktiYolu = path.join(ayar.ciktiDir, parti + '.json');
  fs.writeFileSync(ciktiYolu, JSON.stringify(sonuc, null, 2) + '\n');

  return { sonuc, uyarilar, ciktiYolu, kayitlar };
}

if (require.main === module) {
  const parti = process.argv[2];
  if (!parti) {
    console.error('Kullanim: node tools/besin/hesapla.js PARTI');
    process.exit(1);
  }
  try {
    const r = calistir(parti);
    tabloYaz(r.kayitlar, r.sonuc, r.uyarilar);
    console.log('\nYazildi: ' + r.ciktiYolu);
  } catch (e) {
    console.error('HATA: ' + e.message);
    process.exit(1);
  }
}

module.exports = { calistir, hesapla, indexOku, tabloYaz, BesinHatasi, VARSAYILAN };
