#!/usr/bin/env node
// USDA SR Legacy yerel dizininde arama yapar.
'use strict';

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, 'cache', 'index.json');

function fmt(v) {
  return v === null || v === undefined ? '-' : v;
}

function line(r) {
  return [
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

function main() {
  const args = process.argv.slice(2);

  if (!fs.existsSync(INDEX_PATH)) {
    console.error('index.json bulunamadi. Once su komutu calistir: node tools/usda/fetch.js');
    process.exit(1);
  }

  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  const idPos = args.indexOf('--id');

  if (idPos !== -1) {
    const id = Number(args[idPos + 1]);
    const rec = index.find((r) => r.fdcId === id);
    if (!rec) {
      console.error('Kayit bulunamadi: ' + args[idPos + 1]);
      process.exit(1);
    }
    console.log('fdcId       : ' + rec.fdcId);
    console.log('description : ' + rec.description);
    console.log('kcal        : ' + fmt(rec.kcal));
    console.log('protein (g) : ' + fmt(rec.protein));
    console.log('fat (g)     : ' + fmt(rec.fat));
    console.log('carbs (g)   : ' + fmt(rec.carbs));
    console.log('fiber (g)   : ' + fmt(rec.fiber));
    console.log('sugar (g)   : ' + fmt(rec.sugar));
    console.log('alcohol (g) : ' + fmt(rec.alcohol));
    console.log('water (g)   : ' + fmt(rec.water));
    return;
  }

  const words = args.filter((a) => !a.startsWith('--')).map((w) => w.toLowerCase());
  if (words.length === 0) {
    console.error('Kullanim: node tools/usda/find.js <kelimeler...> | --id <fdcId>');
    process.exit(1);
  }

  const hits = index.filter((r) => {
    const desc = String(r.description || '').toLowerCase();
    return words.every((w) => desc.includes(w));
  });

  console.log('Eslesen: ' + hits.length + ' (ilk 20 gosteriliyor)');
  for (const r of hits.slice(0, 20)) console.log(line(r));
}

main();
