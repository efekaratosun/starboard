#!/usr/bin/env node
// USDA FoodData Central SR Legacy veri setini indirir, acar ve kucuk bir dizin uretir.
// Yalnizca Node yerlesik modulleri kullanilir.
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const CACHE_DIR = path.join(__dirname, 'cache');
const ZIP_PATH = path.join(CACHE_DIR, 'sr_legacy.zip');
const INDEX_PATH = path.join(CACHE_DIR, 'index.json');
const ZIP_URL = 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip';
const JSON_NAME = 'FoodData_Central_sr_legacy_food_json_2018-04.json';
const TIMEOUT_MS = 120000;

// Besin numaralari (nutrient.number) -> index alani
const FIELDS = [
  ['208', 'kcal'],
  ['203', 'protein'],
  ['204', 'fat'],
  ['205', 'carbs'],
  ['291', 'fiber'],
  ['269', 'sugar'],
  ['221', 'alcohol'],
  ['255', 'water'],
];

function download(url, dest, redirects) {
  redirects = redirects || 0;
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Cok fazla yonlendirme'));
    const req = https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        const next = new URL(res.headers.location, url).toString();
        return resolve(download(next, dest, redirects + 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('Indirme basarisiz, HTTP ' + res.statusCode));
      }
      const total = Number(res.headers['content-length'] || 0);
      let received = 0;
      let lastPct = -1;
      const out = fs.createWriteStream(dest);
      res.on('data', (chunk) => {
        received += chunk.length;
        if (total) {
          const pct = Math.floor((received / total) * 100);
          if (pct >= lastPct + 25) {
            lastPct = pct;
            process.stderr.write('Indiriliyor: %' + pct + '\n');
          }
        }
      });
      res.on('error', reject);
      out.on('error', reject);
      out.on('finish', () => resolve(received));
      res.pipe(out);
    });
    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy(new Error('Indirme zaman asimi (120 sn)'));
    });
    req.on('error', reject);
  });
}

function extract(zipPath) {
  execFileSync('tar.exe', ['-xf', zipPath, '-C', CACHE_DIR], {
    stdio: 'inherit',
    timeout: TIMEOUT_MS,
  });
}

function buildIndex() {
  const source = path.join(CACHE_DIR, JSON_NAME);
  if (!fs.existsSync(source)) throw new Error('Acilan JSON dosyasi bulunamadi: ' + source);
  const raw = JSON.parse(fs.readFileSync(source, 'utf8'));
  const foods = raw.SRLegacyFoods || [];
  const list = [];

  for (const food of foods) {
    const rec = { fdcId: food.fdcId, description: food.description };
    for (const [, key] of FIELDS) rec[key] = null;

    for (const fn of food.foodNutrients || []) {
      const number = fn.nutrient && fn.nutrient.number;
      if (number === undefined || number === null) continue;
      const target = FIELDS.find((f) => f[0] === String(number));
      if (!target) continue;
      const amount = typeof fn.amount === 'number' ? fn.amount : null;
      rec[target[1]] = amount;
    }
    list.push(rec);
  }

  fs.writeFileSync(INDEX_PATH, JSON.stringify(list));
  return list.length;
}

async function main() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  console.log('Indiriliyor: ' + ZIP_URL);
  const bytes = await download(ZIP_URL, ZIP_PATH);
  console.log('Indirildi: ' + (bytes / 1024 / 1024).toFixed(1) + ' MB -> ' + ZIP_PATH);

  console.log('Aciliyor...');
  extract(ZIP_PATH);
  console.log('Acildi.');

  const count = buildIndex();
  console.log('index.json yazildi: ' + count + ' kayit -> ' + INDEX_PATH);
}

main().catch((err) => {
  console.error('HATA: ' + err.message);
  process.exit(1);
});
