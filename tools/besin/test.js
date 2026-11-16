#!/usr/bin/env node
// tools/besin/hesapla.js icin testler. Yalnizca Node yerlesik assert kullanilir.
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { calistir } = require('./hesapla');

const KOK = __dirname;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'besin-test-'));
const SAHTE_INDEX = path.join(TMP, 'index.json');

// Testler gercek USDA verisine bagimli olmasin diye kucuk bir dizin.
fs.writeFileSync(
  SAHTE_INDEX,
  JSON.stringify([
    { fdcId: 1, description: 'Test gida', kcal: 96, protein: 5, fat: 4, carbs: 10, fiber: 2, sugar: 1, alcohol: 0, water: 75 },
    { fdcId: 2, description: 'Protein null', kcal: 96, protein: null, fat: 4, carbs: 10, fiber: 2, alcohol: 0 },
    { fdcId: 3, description: 'Lif null', kcal: 96, protein: 5, fat: 4, carbs: 10, fiber: null, alcohol: 0 },
    { fdcId: 4, description: 'Lif fazla', kcal: 20, protein: 1, fat: 0.5, carbs: 2, fiber: 5, alcohol: 0 },
    { fdcId: 5, description: 'Makro asiri', kcal: 400, protein: 60, fat: 60, carbs: 60, fiber: 0, alcohol: 0 },
    { fdcId: 6, description: 'Alkol yuksek', kcal: 100, protein: 0, fat: 0, carbs: 5, fiber: 0, alcohol: 20 },
    { fdcId: 7, description: 'Yag null', kcal: 96, protein: 5, fat: null, carbs: 10, fiber: 2, alcohol: 0 },
    { fdcId: 8, description: 'Karbonhidrat null', kcal: 96, protein: 5, fat: 4, carbs: null, fiber: 2, alcohol: 0 },
  ])
);

let sayac = 0;
let gecen = 0;
let kalan = 0;

function test(baslik, fn) {
  try {
    fn();
    gecen += 1;
    console.log('GECTI  ' + baslik);
  } catch (e) {
    kalan += 1;
    console.log('KALDI  ' + baslik + '\n       ' + e.message);
  }
}

function fixture(kayitlar) {
  sayac += 1;
  const ad = 'parti' + sayac;
  const kaynakDir = path.join(TMP, ad, 'kaynak');
  const ciktiDir = path.join(TMP, ad, 'cikti');
  fs.mkdirSync(kaynakDir, { recursive: true });
  fs.writeFileSync(path.join(kaynakDir, ad + '.json'), JSON.stringify(kayitlar));
  return {
    ad,
    ayar: { kaynakDir, ciktiDir, indexYolu: SAHTE_INDEX },
    ciktiYolu: path.join(ciktiDir, ad + '.json'),
  };
}

function hataBekle(baslik, kayitlar, parca) {
  test(baslik, () => {
    const f = fixture(kayitlar);
    let hata = null;
    try {
      calistir(f.ad, f.ayar);
    } catch (e) {
      hata = e;
    }
    assert.ok(hata, 'hata bekleniyordu, ancak kayit islendi');
    assert.ok(
      hata.message.includes(parca),
      'beklenen mesaj "' + parca + '", gelen: ' + hata.message
    );
    assert.strictEqual(fs.existsSync(f.ciktiYolu), false, 'hata durumunda cikti yazilmamali');
  });
}

function tarif(key, malz, pismisG, porsiyon) {
  return { key, ad: key, tip: 'tarif', malz, pismis_g: pismisG, porsiyon };
}

// ---------------------------------------------------------------- dogru hesap

test('dogru hesap (elle: 300 g -> 150 g pismis, porsiyon 3)', () => {
  const f = fixture([
    tarif('corba', [{ ad: 'Test gida', fdc: 1, g: 300 }], 150, 3),
  ]);
  const r = calistir(f.ad, f.ayar);
  // 300 g x (5p/10c/4f/2lif/96kcal) = 15p/30c/12f/6lif/288kcal; / 150 g x 100 = 10/20/8/4/192
  assert.deepStrictEqual(r.sonuc.corba, {
    p: 10,
    c: 20,
    f: 8,
    lif: 4,
    alk: 0,
    kcal_usda: 192,
    kcal_449: 192,
    porsiyon_g: 50,
    porsiyon_kcal: 96,
  });
  assert.deepStrictEqual(fs.existsSync(f.ciktiYolu), true, 'cikti yazilmali');
});

test('key ile baska kayda atif (usda kaydinin 100 g degeri)', () => {
  const f = fixture([
    { key: 'temel', ad: 'Temel', tip: 'usda', fdc: 1 },
    tarif('kopya', [{ ad: 'Temel', key: 'temel', g: 100 }], 100, 1),
  ]);
  const r = calistir(f.ad, f.ayar);
  assert.deepStrictEqual(r.sonuc.kopya, {
    p: 5,
    c: 10,
    f: 4,
    lif: 2,
    alk: 0,
    kcal_usda: 96,
    kcal_449: 96,
    porsiyon_g: 100,
    porsiyon_kcal: 96,
  });
});

test('su malzemesi sifir besin ekler, agirligi toplama girer', () => {
  const f = fixture([
    tarif('sulu', [{ ad: 'Test gida', fdc: 1, g: 100 }, { ad: 'Su', su: true, g: 100 }], 200, 2),
  ]);
  const r = calistir(f.ad, f.ayar);
  assert.strictEqual(r.sonuc.sulu.p, 2.5);
  assert.strictEqual(r.sonuc.sulu.kcal_usda, 48);
  assert.strictEqual(r.sonuc.sulu.porsiyon_g, 100);
});

// ------------------------------------------------------------ HATA kosullari

hataBekle('HATA: fdc dizinde yok', [{ key: 'a', ad: 'A', tip: 'usda', fdc: 999 }], 'dizininde yok');

hataBekle('HATA: protein null', [{ key: 'a', ad: 'A', tip: 'usda', fdc: 2 }], 'protein null');

hataBekle('HATA: yag null', [{ key: 'a', ad: 'A', tip: 'usda', fdc: 7 }], 'fat null');

hataBekle('HATA: karbonhidrat null', [{ key: 'a', ad: 'A', tip: 'usda', fdc: 8 }], 'carbs null');

hataBekle(
  'HATA: tekrar eden key',
  [
    { key: 'a', ad: 'A', tip: 'usda', fdc: 1 },
    { key: 'a', ad: 'A2', tip: 'usda', fdc: 1 },
  ],
  'tekrar eden key'
);

hataBekle(
  'HATA: key dongusu',
  [
    tarif('a', [{ ad: 'B', key: 'b', g: 100 }], 100, 1),
    tarif('b', [{ ad: 'A', key: 'a', g: 100 }], 100, 1),
  ],
  'dongusu'
);

hataBekle(
  'HATA: bulunamayan key',
  [tarif('a', [{ ad: 'Yok', key: 'yok', g: 100 }], 100, 1)],
  'bulunamayan key'
);

hataBekle('HATA: malz elemaninda ad yok', [tarif('a', [{ fdc: 1, g: 100 }], 100, 1)], 'ad yok');

hataBekle(
  'HATA: pismis_g toplam agirliktan buyuk',
  [tarif('a', [{ ad: 'Test gida', fdc: 1, g: 100 }], 120, 1)],
  'buyuk'
);

hataBekle(
  'HATA: p+c+f 100 den buyuk',
  [tarif('a', [{ ad: 'Makro asiri', fdc: 5, g: 100 }], 100, 1)],
  '100'
);

// ------------------------------------------------------------------ uyarilar

test('UYARI: dort kosul da raporlanir, cikti yine yazilir', () => {
  const f = fixture([
    tarif('cok_buhar', [{ ad: 'Test gida', fdc: 1, g: 100 }], 30, 1),
    { key: 'alkollu', ad: 'Alkollu', tip: 'usda', fdc: 6 },
    { key: 'lifsiz', ad: 'Lifsiz', tip: 'usda', fdc: 3 },
    { key: 'lif_fazla', ad: 'Lif fazla', tip: 'usda', fdc: 4 },
  ]);
  const r = calistir(f.ad, f.ayar);
  assert.strictEqual(fs.existsSync(f.ciktiYolu), true, 'uyarida cikti yazilmali');

  const metin = r.uyarilar.map((u) => u.key + ': ' + u.mesaj).join('\n');
  assert.ok(/cok_buhar: pismis_g toplam agirligin %40 indan kucuk/.test(metin), metin);
  assert.ok(/alkollu: kcal_449 .* farki %12 den fazla/.test(metin), metin);
  assert.ok(/lifsiz: lif null, 0 sayildi/.test(metin), metin);
  assert.ok(/lif_fazla: lif \(5\) karbonhidrattan \(2\) buyuk/.test(metin), metin);

  assert.strictEqual(r.sonuc.lifsiz.lif, 0, 'lif null 0 sayilmali');
  assert.strictEqual(r.sonuc.alkollu.alk, 20);
});

// ------------------------------------------------------------ CLI davranisi

test('CLI: olmayan parti icin cikis kodu 1', () => {
  const r = spawnSync(
    process.execPath,
    [path.join(KOK, 'hesapla.js'), 'olmayan_parti_xyz'],
    { cwd: KOK, encoding: 'utf8', timeout: 60000 }
  );
  assert.strictEqual(r.status, 1, 'stderr: ' + r.stderr);
  assert.ok(/girdi bulunamadi/.test(r.stderr), r.stderr);
});

// --------------------------------------------------- gercek veri (varsa)

const GERCEK_INDEX = path.join(KOK, '..', 'usda', 'cache', 'index.json');
if (fs.existsSync(GERCEK_INDEX)) {
  test('ornek.json gercek USDA verisiyle (elle hesaplanan degerler)', () => {
    const kayitlar = JSON.parse(fs.readFileSync(path.join(KOK, 'kaynak', 'ornek.json'), 'utf8'));
    const ciktiDir = path.join(TMP, 'ornek-cikti');
    const r = calistir('ornek', { kaynakDir: path.join(KOK, 'kaynak'), ciktiDir, indexYolu: GERCEK_INDEX });
    assert.deepStrictEqual(r.sonuc.mercimek_corbasi, {
      p: 2.9,
      c: 8.9,
      f: 1.2,
      lif: 1.5,
      alk: 0,
      kcal_usda: 57,
      kcal_449: 58,
      porsiyon_g: 450,
      porsiyon_kcal: 257,
    });
    assert.deepStrictEqual(r.sonuc.pismis_mercimek, {
      p: 9,
      c: 20.1,
      f: 0.4,
      lif: 7.9,
      alk: 0,
      kcal_usda: 116,
      kcal_449: 120,
      porsiyon_g: null,
      porsiyon_kcal: null,
    });
    assert.strictEqual(r.uyarilar.length, 0, 'ornek icin uyari beklenmiyor');
    assert.ok(kayitlar.length === 2);
  });
} else {
  console.log('ATLANDI  ornek.json gercek USDA testi (cache/index.json yok)');
}

fs.rmSync(TMP, { recursive: true, force: true });

console.log('\nGecen: ' + gecen + ', Kalan: ' + kalan);
process.exit(kalan === 0 ? 0 : 1);
