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
const SAHTE_FNDDS = path.join(TMP, 'index-survey.json');

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
    { fdcId: 9, description: 'Kcal null', kcal: null, protein: 5, fat: 4, carbs: 10, fiber: 2, alcohol: 0 },
    { fdcId: 10, description: 'Lentils, raw', kcal: 352, protein: 24.6, fat: 1.06, carbs: 63.4, fiber: 10.7, alcohol: 0 },
    { fdcId: 11, description: 'Onions, boiled', kcal: 40, protein: 1.1, fat: 0.1, carbs: 9.34, fiber: 1.7, alcohol: 0 },
    { fdcId: 12, description: 'Porsiyon testi', kcal: 56.662, protein: 5, fat: 4, carbs: 10, fiber: 2, alcohol: 0 },
  ])
);
fs.writeFileSync(SAHTE_FNDDS, JSON.stringify([
  { fdcId: 20, description: 'Chicken curry', kcal: 150, protein: 10, fat: 5, carbs: 15, fiber: 2, alcohol: 0, porsiyonlar: [{ aciklama: '1 cup', g: 240 }] },
]));

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
    ayar: { kaynakDir, ciktiDir, indexYolu: SAHTE_INDEX, fnddsIndexYolu: SAHTE_FNDDS },
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
  const f = fixture([tarif('corba', [{ ad: 'Test gida', fdc: 1, g: 300 }], 150, 3)]);
  const r = calistir(f.ad, f.ayar);
  // 300 g x (5p/10c/4f/2lif/96kcal) = 15p/30c/12f/6lif/288kcal; / 150 g x 100 = 10/20/8/4/192
  const { kaynak, ...s } = r.sonuc.corba;
  assert.deepStrictEqual(s, {
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
  assert.deepStrictEqual(kaynak, [{ ad: 'Test gida', g: 300, fdc: 1, aciklama: 'Test gida' }]);
  assert.strictEqual(fs.existsSync(f.ciktiYolu), true, 'cikti yazilmali');
});

test('key ile baska kayda atif (usda kaydinin 100 g degeri)', () => {
  const f = fixture([
    { key: 'temel', ad: 'Temel', tip: 'usda', fdc: 1 },
    tarif('kopya', [{ ad: 'Temel', key: 'temel', g: 100 }], 100, 1),
  ]);
  const r = calistir(f.ad, f.ayar);
  const { kaynak, ...s } = r.sonuc.kopya;
  assert.deepStrictEqual(s, {
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
  assert.deepStrictEqual(kaynak, [{ ad: 'Temel', g: 100, fdc: 1, aciklama: 'Test gida' }]);
});

test('ic ice tarif: tarif icinde tarife key atfi', () => {
  const f = fixture([
    { key: 'temel', ad: 'Temel', tip: 'usda', fdc: 1 },
    tarif('ara', [{ ad: 'Temel', key: 'temel', g: 200 }], 200, 2),
    tarif('son', [{ ad: 'Ara', key: 'ara', g: 150 }], 150, 3),
  ]);
  const r = calistir(f.ad, f.ayar);
  assert.deepStrictEqual(r.sonuc.ara.porsiyon_kcal, 96); // 192 kcal toplam / 2 porsiyon
  assert.deepStrictEqual(r.sonuc.ara.porsiyon_g, 100);
  const { kaynak, ...s } = r.sonuc.son;
  assert.deepStrictEqual(s, {
    p: 5,
    c: 10,
    f: 4,
    lif: 2,
    alk: 0,
    kcal_usda: 96,
    kcal_449: 96,
    porsiyon_g: 50,
    porsiyon_kcal: 48, // (96 x 1,5) / 3
  });
  assert.deepStrictEqual(kaynak, [{ ad: 'Ara', g: 150, fdc: null, aciklama: null }]);
});

test('porsiyon_kcal ham degerden hesaplanir (yuvarlanmis kcal_usda degil)', () => {
  const f = fixture([tarif('p', [{ ad: 'Test', fdc: 12, g: 450 }], 450, 2)]);
  const r = calistir(f.ad, f.ayar);
  // ham toplam 56,662 x 4,5 = 254,979 kcal; / 2 = 127,4895 -> 127
  // yuvarlanmis kalori ile 57 x 225 / 100 = 128,25 -> 128 olurdu
  assert.strictEqual(r.sonuc.p.kcal_usda, 57);
  assert.strictEqual(r.sonuc.p.porsiyon_g, 225);
  assert.strictEqual(r.sonuc.p.porsiyon_kcal, 127);
});

test('su malzemesi sifir besin ekler, agirligi toplama girer', () => {
  const f = fixture([
    tarif('sulu', [{ ad: 'Test gida', fdc: 1, g: 100 }, { ad: 'Su', su: true, g: 100 }], 200, 2),
  ]);
  const r = calistir(f.ad, f.ayar);
  assert.strictEqual(r.sonuc.sulu.p, 2.5);
  assert.strictEqual(r.sonuc.sulu.kcal_usda, 48);
  assert.strictEqual(r.sonuc.sulu.porsiyon_g, 100);
  assert.deepStrictEqual(r.sonuc.sulu.kaynak, [
    { ad: 'Test gida', g: 100, fdc: 1, aciklama: 'Test gida' },
    { ad: 'Su', g: 100, fdc: null, aciklama: null },
  ]);
});

// ------------------------------------------------------------ HATA kosullari

hataBekle('HATA: fdc dizinde yok', [{ key: 'a', ad: 'A', tip: 'usda', fdc: 999 }], 'dizininde yok');

hataBekle('HATA: fdc sayi degil', [{ key: 'a', ad: 'A', tip: 'usda', fdc: '172420' }], 'fdc sayi olmali');

hataBekle('HATA: protein null', [{ key: 'a', ad: 'A', tip: 'usda', fdc: 2 }], 'protein null');

hataBekle('HATA: yag null', [{ key: 'a', ad: 'A', tip: 'usda', fdc: 7 }], 'fat null');

hataBekle('HATA: karbonhidrat null', [{ key: 'a', ad: 'A', tip: 'usda', fdc: 8 }], 'carbs null');

hataBekle('HATA: kcal null', [{ key: 'a', ad: 'A', tip: 'usda', fdc: 9 }], 'kcal null');

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
  'HATA: malz elemaninda birden fazla secici',
  [tarif('a', [{ ad: 'X', fdc: 1, key: 'b', g: 100 }], 100, 1)],
  'yalniz biri verilmeli'
);

hataBekle(
  'HATA: malz elemaninda hic secici yok',
  [tarif('a', [{ ad: 'X', g: 100 }], 100, 1)],
  'biri gerekli'
);

hataBekle(
  'HATA: porsiyon tam sayi degil',
  [tarif('a', [{ ad: 'X', fdc: 1, g: 100 }], 100, 2.5)],
  'porsiyon tam sayi'
);

hataBekle(
  'HATA: porsiyon 1 den kucuk',
  [tarif('a', [{ ad: 'X', fdc: 1, g: 100 }], 100, 0)],
  'porsiyon tam sayi'
);

hataBekle(
  'HATA: porsiyon_g 1 den kucuk',
  [tarif('a', [{ ad: 'X', fdc: 1, g: 100 }], 10, 20)],
  'porsiyon_g 1 den kucuk'
);

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
  assert.ok(/alkollu: kcal_449 .* esigini asiyor/.test(metin), metin);
  assert.ok(/lifsiz: lif null, 0 sayildi/.test(metin), metin);
  assert.ok(/lif_fazla: lif \(5\) karbonhidrattan \(2\) buyuk/.test(metin), metin);

  assert.strictEqual(r.sonuc.lifsiz.lif, 0, 'lif null 0 sayilmali');
  assert.strictEqual(r.sonuc.alkollu.alk, 20);
});

test('UYARI: kcal farki yuzde 12 yi gecse de 15 kcal altinda uyari yok', () => {
  const f = fixture([{ key: 'kucuk', ad: 'Kucuk', tip: 'usda', fdc: 4 }]);
  const r = calistir(f.ad, f.ayar);
  // fdc4: kontrol 6,5 kcal, kcal_usda 20 -> fark 13,5 kcal (yuzde 67,5 ama 15 kcal altinda)
  assert.ok(
    !r.uyarilar.some((u) => u.mesaj.includes('esigini asiyor')),
    'gurultulu kcal uyarisi cikmamali: ' + JSON.stringify(r.uyarilar)
  );
});

test('UYARI: pismis ad + raw USDA kaydi', () => {
  const f = fixture([tarif('k', [{ ad: 'Pişmiş mercimek', fdc: 10, g: 100 }], 100, 1)]);
  const r = calistir(f.ad, f.ayar);
  assert.ok(
    r.uyarilar.some((u) => /ad pismis diyor, USDA kaydi "Lentils, raw" raw/.test(u.mesaj)),
    JSON.stringify(r.uyarilar)
  );
});

test('UYARI: cig ad + pismis USDA kaydi', () => {
  const f = fixture([tarif('k', [{ ad: 'Çiğ soğan', fdc: 11, g: 100 }], 100, 1)]);
  const r = calistir(f.ad, f.ayar);
  assert.ok(
    r.uyarilar.some((u) => /ad cig diyor, USDA kaydi "Onions, boiled" pismis/.test(u.mesaj)),
    JSON.stringify(r.uyarilar)
  );
});

// ------------------------------------------------------------ CLI davranisi

test('CLI: olmayan parti icin cikis kodu 1', () => {
  const r = spawnSync(process.execPath, [path.join(KOK, 'hesapla.js'), 'olmayan_parti_xyz'], {
    cwd: KOK,
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.strictEqual(r.status, 1, 'stderr: ' + r.stderr);
  assert.ok(/girdi bulunamadi/.test(r.stderr), r.stderr);
});

// --------------------------------------------------- gercek veri (varsa)

const GERCEK_INDEX = path.join(KOK, '..', 'usda', 'cache', 'index.json');
if (fs.existsSync(GERCEK_INDEX)) {
  test('ornek.json gercek USDA verisiyle (elle hesaplanan degerler)', () => {
    const ciktiDir = path.join(TMP, 'ornek-cikti');
    const r = calistir('ornek', {
      kaynakDir: path.join(KOK, 'kaynak'),
      ciktiDir,
      indexYolu: GERCEK_INDEX,
    });

    const { kaynak, ...corba } = r.sonuc.mercimek_corbasi;
    assert.deepStrictEqual(corba, {
      p: 2.9,
      c: 8.9,
      f: 1.2,
      lif: 1.5,
      alk: 0,
      kcal_usda: 57,
      kcal_449: 58,
      porsiyon_g: 450,
      porsiyon_kcal: 256,
    });
    assert.deepStrictEqual(
      kaynak.map((m) => [m.ad, m.g, m.fdc]),
      [
        ['Kuru mercimek', 200, 172420],
        ['Sogan', 80, 170000],
        ['Havuc', 80, 170393],
        ['Patates', 100, 170026],
        ['Zeytinyagi', 20, 171413],
        ['Su', 1500, null],
      ]
    );
    assert.strictEqual(kaynak[0].aciklama, 'Lentils, raw');
    assert.strictEqual(kaynak[5].aciklama, null);

    const { kaynak: k2, description: d2, porsiyon_adi: pa2, ...mercimek } = r.sonuc.pismis_mercimek;
    assert.deepStrictEqual(mercimek, {
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
    assert.strictEqual(k2, 'SR Legacy');
    assert.strictEqual(d2, 'Lentils, mature seeds, cooked, boiled, without salt');
    assert.strictEqual(pa2, null);
  });
} else {
  console.log('ATLANDI  ornek.json gercek USDA testi (cache/index.json yok)');
}

test('FNDDS usda kaydi porsiyon adindan gram ve veri seti alir', () => {
  const f = fixture([{ key: 'curry', ad: 'Curry', tip: 'usda', fdc: 20, porsiyon_adi: '1 cup' }]);
  const r = calistir(f.ad, f.ayar);
  assert.strictEqual(r.sonuc.curry.kaynak, 'FNDDS 2021-2023');
  assert.strictEqual(r.sonuc.curry.description, 'Chicken curry');
  assert.strictEqual(r.sonuc.curry.porsiyon_g, 240);
});

hataBekle('HATA: FNDDS porsiyonu bulunamadi', [{ key: 'a', ad: 'A', tip: 'usda', fdc: 20, porsiyon_adi: 'big bowl' }], 'bulunamadi');

test('HATA: fdc iki dizinde varsa', () => {
  const onceki = fs.readFileSync(SAHTE_FNDDS, 'utf8');
  fs.writeFileSync(SAHTE_FNDDS, JSON.stringify([{ fdcId: 1, description: 'Duplicate test ID', kcal: 150, protein: 10, fat: 5, carbs: 15, fiber: 2, alcohol: 0 }]));
  const f = fixture([{ key: 'a', ad: 'A', tip: 'usda', fdc: 1 }]);
  let hata;
  try { calistir(f.ad, f.ayar); } catch (e) { hata = e; }
  fs.writeFileSync(SAHTE_FNDDS, onceki);
  assert.ok(hata && hata.message.includes('hem SR Legacy'), hata && hata.message);
  assert.strictEqual(fs.existsSync(f.ciktiYolu), false);
});

fs.rmSync(TMP, { recursive: true, force: true });

console.log('\nGecen: ' + gecen + ', Kalan: ' + kalan);
process.exit(kalan === 0 ? 0 : 1);
