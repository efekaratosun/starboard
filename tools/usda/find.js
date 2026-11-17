#!/usr/bin/env node
// USDA yerel dizinlerinde arama yapar: SR Legacy (cache/index.json) ve FNDDS (cache/index-survey.json).
'use strict';

const fs = require('fs');
const path = require('path');

const KAYNAKLAR = [
  { etiket: 'SR', bayrak: '--sr', yol: path.join(__dirname, 'cache', 'index.json') },
  { etiket: 'FNDDS', bayrak: '--fndds', yol: path.join(__dirname, 'cache', 'index-survey.json') },
];

function fmt(v) {
  return v === null || v === undefined ? '-' : v;
}

function line(r) {
  return [
    r.kaynak,
    r.fdcId,
    r.description,
    fmt(r.kcal),
    fmt(r.protein),
    fmt(r.carbs),
    fmt(r.fat),
    fmt(r.fiber),
    fmt(r.alcohol),
  ].join(' | ');
}

function yukle(args) {
  const sr = args.includes('--sr');
  const fndds = args.includes('--fndds');
  // Bayrak yoksa ikisi de aranir; bayrak varsa yalniz istenen dizin(ler).
  const istenen = KAYNAKLAR.filter((k) => (!sr && !fndds) || args.includes(k.bayrak));
  const acik = sr || fndds;
  const sonuc = [];

  for (const k of istenen) {
    if (!fs.existsSync(k.yol)) {
      if (acik) {
        console.error(path.basename(k.yol) + ' bulunamadi. Once su komutu calistir: node tools/usda/fetch.js');
        process.exit(1);
      }
      console.error('UYARI: ' + path.basename(k.yol) + ' yok, ' + k.etiket + ' atlandi (node tools/usda/fetch.js)');
      continue;
    }
    const kayitlar = JSON.parse(fs.readFileSync(k.yol, 'utf8'));
    for (const r of kayitlar) r.kaynak = k.etiket;
    sonuc.push({ etiket: k.etiket, kayitlar });
  }

  if (sonuc.length === 0) {
    console.error('USDA dizini bulunamadi. Once su komutu calistir: node tools/usda/fetch.js');
    process.exit(1);
  }
  return sonuc;
}

function idGoster(rec) {
  console.log('kaynak      : ' + (rec.kaynak === 'FNDDS' ? 'FNDDS' : 'SR Legacy'));
  console.log('fdcId       : ' + rec.fdcId);
  console.log('description : ' + rec.description);
  if (rec.kaynak === 'FNDDS') {
    console.log('foodCode    : ' + fmt(rec.foodCode));
    console.log('kategori    : ' + fmt(rec.kategori));
  }
  console.log('kcal        : ' + fmt(rec.kcal));
  console.log('protein (g) : ' + fmt(rec.protein));
  console.log('fat (g)     : ' + fmt(rec.fat));
  console.log('carbs (g)   : ' + fmt(rec.carbs));
  console.log('fiber (g)   : ' + fmt(rec.fiber));
  console.log('sugar (g)   : ' + fmt(rec.sugar));
  console.log('alcohol (g) : ' + fmt(rec.alcohol));
  console.log('water (g)   : ' + fmt(rec.water));
  if (rec.kaynak === 'FNDDS') {
    console.log('porsiyonlar :');
    for (const p of rec.porsiyonlar || []) console.log('  ' + p.aciklama + ' = ' + fmt(p.g) + ' g');
  }
}

function main() {
  const args = process.argv.slice(2);
  const dizinler = yukle(args);
  const idPos = args.indexOf('--id');

  if (idPos !== -1) {
    const id = Number(args[idPos + 1]);
    const bulunan = [];
    for (const d of dizinler) {
      for (const r of d.kayitlar) if (r.fdcId === id) bulunan.push(r);
    }
    if (bulunan.length === 0) {
      console.error('Kayit bulunamadi: ' + args[idPos + 1]);
      process.exit(1);
    }
    bulunan.forEach((r, i) => {
      if (i > 0) console.log('');
      idGoster(r);
    });
    return;
  }

  const words = args.filter((a) => !a.startsWith('--')).map((w) => w.toLowerCase());
  if (words.length === 0) {
    console.error('Kullanim: node tools/usda/find.js [--sr | --fndds] <kelimeler...> | --id <fdcId>');
    process.exit(1);
  }

  // Her sozcuk TAM SOZCUK olarak aranir: "raw" -> "Lentils, raw" evet, "Strawberries" hayir.
  // Unicode sozcuk sinirlari: JavaScript \\b Turkce harfleri sozcuk saymaz.
  const desenler = words.map((w) => new RegExp('(?<![\\p{L}\\p{N}_])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\p{L}\\p{N}_])', 'u'));

  const hits = [];
  for (const d of dizinler) {
    for (const r of d.kayitlar) {
      const desc = String(r.description || '').toLowerCase();
      if (desenler.every((p) => p.test(desc))) hits.push(r);
    }
  }
  // Kisa aciklama once; esitlikte dizin sirasi (SR, sonra FNDDS) korunur (stabil siralama).
  hits.sort((a, b) => a.description.length - b.description.length);

  console.log('Eslesen: ' + hits.length + ' (ilk 20 gosteriliyor)');
  for (const r of hits.slice(0, 20)) console.log(line(r));
}

main();
