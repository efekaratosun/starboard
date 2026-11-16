#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function karsilastir(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) throw new Error('Eslesme dosyalari dizi olmali');
  const sag = new Map(b.map((x) => [x.ad, x]));
  const uyumlu = [];
  const celiski = [];
  for (const x of a) {
    const y = sag.get(x.ad);
    if (!y) throw new Error('Ikinci dosyada kalem yok: ' + x.ad);
    const sonuc = { ad: x.ad, birinci: x, ikinci: y };
    if (x.fdc !== null && y.fdc !== null && x.fdc === y.fdc) uyumlu.push(sonuc);
    else celiski.push(sonuc);
  }
  if (sag.size !== a.length) throw new Error('Dosyalardaki kalem sayisi veya adlari uyusmuyor');
  return { uyumlu, celiski };
}

if (require.main === module) {
  const [birinci, ikinci] = process.argv.slice(2);
  if (!birinci || !ikinci) {
    console.error('Kullanim: node tools/besin/karsilastir.js LISTE-birinci.json LISTE-ikinci.json');
    process.exit(1);
  }
  try {
    const sonuc = karsilastir(
      JSON.parse(fs.readFileSync(birinci, 'utf8')),
      JSON.parse(fs.readFileSync(ikinci, 'utf8'))
    );
    const kok = path.dirname(birinci);
    const liste = path.basename(birinci).replace(/-[^-]+\.json$/, '');
    fs.writeFileSync(path.join(kok, liste + '-uyumlu.json'), JSON.stringify(sonuc.uyumlu, null, 2) + '\n');
    fs.writeFileSync(path.join(kok, liste + '-celiski.json'), JSON.stringify(sonuc.celiski, null, 2) + '\n');
    console.log('Uyumlu: ' + sonuc.uyumlu.length + ', celiski: ' + sonuc.celiski.length);
  } catch (e) {
    console.error('HATA: ' + e.message);
    process.exit(1);
  }
}

module.exports = { karsilastir };
