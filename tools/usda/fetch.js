#!/usr/bin/env node
// USDA FoodData Central veri setlerini indirir, acar ve kucuk dizinler uretir:
//   SR Legacy (temel besinler)           -> cache/index.json
//   FNDDS Survey Foods (hazir yemekler)  -> cache/index-survey.json
// Yalnizca Node yerlesik modulleri kullanilir.
// Kullanim: node tools/usda/fetch.js [--sr] [--fndds]   (bayraksiz: ikisi de)
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const CACHE_DIR = path.join(__dirname, 'cache');
const TIMEOUT_MS = 120000;

// Besin numaralari (nutrient.number) -> index alani. SR Legacy ve FNDDS ayni numaralari kullanir.
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

const SR = {
  ad: 'SR Legacy',
  zipYolu: path.join(CACHE_DIR, 'sr_legacy.zip'),
  indexYolu: path.join(CACHE_DIR, 'index.json'),
  url: 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip',
  jsonAdi: 'FoodData_Central_sr_legacy_food_json_2018-04.json',
  dizi: 'SRLegacyFoods',
};

const FNDDS = {
  ad: 'FNDDS',
  zipYolu: path.join(CACHE_DIR, 'survey.zip'),
  indexYolu: path.join(CACHE_DIR, 'index-survey.json'),
  url: 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_survey_food_json_2024-10-31.zip',
  jsonAdi: 'surveyDownload.json',
  dizi: 'SurveyFoods',
};

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

// foodNutrients dizisinden FIELDS alanlarini cikarir; eksik deger null kalir.
function besinAlanlari(food) {
  const rec = {};
  for (const [, key] of FIELDS) rec[key] = null;
  for (const fn of food.foodNutrients || []) {
    const number = fn.nutrient && fn.nutrient.number;
    if (number === undefined || number === null) continue;
    const target = FIELDS.find((f) => f[0] === String(number));
    if (!target) continue;
    rec[target[1]] = typeof fn.amount === 'number' ? fn.amount : null;
  }
  return rec;
}

function kaynakOku(set) {
  const source = path.join(CACHE_DIR, set.jsonAdi);
  if (!fs.existsSync(source)) throw new Error('Acilan JSON dosyasi bulunamadi: ' + source);
  const raw = JSON.parse(fs.readFileSync(source, 'utf8'));
  const foods = raw[set.dizi];
  if (!Array.isArray(foods)) throw new Error(set.jsonAdi + ' icinde ' + set.dizi + ' dizisi yok');
  return foods;
}

function buildSrIndex() {
  const list = kaynakOku(SR).map((food) =>
    Object.assign({ fdcId: food.fdcId, description: food.description }, besinAlanlari(food))
  );
  fs.writeFileSync(SR.indexYolu, JSON.stringify(list));
  return list.length;
}

function kategoriAdi(food) {
  const k = food.wweiaFoodCategory && food.wweiaFoodCategory.wweiaFoodCategoryDescription;
  if (k) return k;
  const a = (food.foodAttributes || []).find((x) => x.name === 'WWEIA Category description');
  return a ? a.value : null;
}

function buildSurveyIndex() {
  const list = kaynakOku(FNDDS).map((food) =>
    Object.assign(
      {
        fdcId: food.fdcId,
        description: food.description,
        foodCode: food.foodCode === undefined ? null : String(food.foodCode),
        kategori: kategoriAdi(food),
      },
      besinAlanlari(food),
      {
        porsiyonlar: (food.foodPortions || [])
          .slice()
          .sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0))
          .map((p) => ({ aciklama: p.portionDescription, g: p.gramWeight })),
      }
    )
  );
  fs.writeFileSync(FNDDS.indexYolu, JSON.stringify(list));
  return list.length;
}

async function indirVeAc(set) {
  console.log('Indiriliyor (' + set.ad + '): ' + set.url);
  const bytes = await download(set.url, set.zipYolu);
  console.log('Indirildi: ' + (bytes / 1024 / 1024).toFixed(1) + ' MB -> ' + set.zipYolu);
  console.log('Aciliyor...');
  extract(set.zipYolu);
  console.log('Acildi.');
}

async function main() {
  const args = process.argv.slice(2);
  const yalnizSr = args.includes('--sr');
  const yalnizFndds = args.includes('--fndds');
  const srYap = yalnizSr || !yalnizFndds;
  const fnddsYap = yalnizFndds || !yalnizSr;

  fs.mkdirSync(CACHE_DIR, { recursive: true });

  if (srYap) {
    await indirVeAc(SR);
    console.log('index.json yazildi: ' + buildSrIndex() + ' kayit -> ' + SR.indexYolu);
  }
  if (fnddsYap) {
    await indirVeAc(FNDDS);
    console.log('index-survey.json yazildi: ' + buildSurveyIndex() + ' kayit -> ' + FNDDS.indexYolu);
  }
}

main().catch((err) => {
  console.error('HATA: ' + err.message);
  process.exit(1);
});
