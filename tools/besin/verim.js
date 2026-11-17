#!/usr/bin/env node
'use strict';

// USDA SR Legacy kayit ciftlerinden kuru madde verimi ve yag degisimini turetir.
// Eslesmeler yalniz acikca secilmis fdcId'lerdir; belirsizlikte oran hesaplanmaz.
const fs = require('fs');
const path = require('path');

const kok = path.join(__dirname, '..', 'usda', 'cache');
const cikti = path.join(__dirname, 'verim.json');
const belge = path.join(__dirname, '..', '..', 'docs', 'icerik', 'tarif-hesap-kurallari.md');
const sr = JSON.parse(fs.readFileSync(path.join(kok, 'index.json'), 'utf8'));
const fnddsPath = path.join(kok, 'index-survey.json');
const surveyPath = path.join(kok, 'surveyDownload.json');
const byId = new Map(sr.map((r) => [r.fdcId, r]));

const cookingPairs = [
  ['Bulgur, kuru', 170688, 170287],
  ['Pirinç, uzun taneli beyaz', 169756, 169757],
  ['Makarna, zenginleştirilmiş kuru/pişmiş', 169736, 169737],
  ['Kuru fasulye, navy tipi olgun tohum', 173745, 173746],
  ['Nohut, olgun tohum', 173756, 173757],
  ['Mercimek, olgun tohum (renk belirtilmemiş)', 172420, 172421],
  ['Barbunya / cranberry bean', null, null],
  ['Börülce, olgun tohum (common blackeye)', 173758, 173759],
  ['Yeşil mercimek, renge özel kayıt', null, null],
  ['Kırmızı mercimek', 174284, null],
  ['Bakla, olgun tohum', 175205, 173753],
  ['Ispanak', 168462, 168463],
  ['Patates, kabuklu, haşlanmış', 170026, 170438],
  ['Havuç', 170393, 170394],
  ['Kabak (zucchini)', 169291, 169292],
  ['Patlıcan', 169228, 169229],
  ['Tatlı yeşil biber', 170427, 170428],
  ['Beyaz lahana', 169975, 169976],
  ['Pırasa', 169246, 168426],
  ['Enginar', 169205, 168386],
  ['Bamya', 169260, 169261],
  ['Taze fasulye (snap bean)', 169961, 169141],
  ['Soğan', 170000, 170001],
  ['Kuzu, perakende kesim bileşik, 1/4 inç yağlı', 172479, 172480],
  ['Dana, omuz üst/orta biftek, bütün kalite, 0 inç yağ, ızgara', 172132, 172133],
  ['Dana kıyma, %70 yağsız, çiğ / tavada pişmiş köfte', 168652, 168650],
  ['Tavuk göğsü, et ve deri / fırında pişmiş', 171474, 171075],
  ['Tavuk but, et ve deri / fırında pişmiş', 172385, 173625],
  ['Balık, Atlantik morina / kuru ısıda pişmiş', 171955, 171956],
];

const fryingPairs = [
  ['Patates, çiğ / kızarmış patates', 170026, null],
  ['Patlıcan, çiğ / kızarmış', 169228, null],
  ['Kabak, çiğ / kızarmış', 169291, null],
  ['Biber, çiğ / kızarmış', 170427, null],
  ['Karnabahar, çiğ / kızarmış', 169986, null],
  ['Balık, çiğ / kızarmış (aynı tür)', 171955, null],
  ['Küçük balık (hamsi) / kızarmış benzer tür', 174182, null],
  ['Kalamar, karışık tür, çiğ / kızarmış', 174223, 171982],
  ['Tavuk göğsü et ve deri, çiğ / kaplamalı kızarmış', 171474, 171475],
  ['Mayalı hamur / doughnut veya kızarmış hamur', null, null],
];

function ref(id) {
  if (id == null) return null;
  const r = byId.get(id);
  if (!r) throw new Error('SR Legacy fdcId indeks içinde yok: ' + id);
  return { fdcId: r.fdcId, description: r.description, water_g_100g: r.water, fat_g_100g: r.fat };
}

function pairRow([hedef, rawId, cookedId], mode) {
  const raw = ref(rawId);
  const cooked = ref(cookedId);
  const row = { hedef, cig: raw, pismis: cooked, durum: 'bulunamadi' };
  if (!raw || !cooked) {
    row.not = 'İstenen formda eşleşmiş iki USDA SR Legacy kaydı bulunamadı; hesap yapılmadı.';
    return row;
  }
  if (![raw.water_g_100g, cooked.water_g_100g, raw.fat_g_100g, cooked.fat_g_100g].every(Number.isFinite)) {
    row.not = 'Eşleşen kayıtlarda su veya yağ alanı eksik; hesap yapılmadı.';
    return row;
  }
  const dryRaw = 100 - raw.water_g_100g;
  const dryCooked = 100 - cooked.water_g_100g;
  if (dryRaw <= 0 || dryCooked <= 0) {
    row.not = 'Kuru madde hesabı için su verisi uygun değil; hesap yapılmadı.';
    return row;
  }
  const yieldRatio = dryRaw / dryCooked;
  row.dry_matter_g_100g_raw = Number(dryRaw.toFixed(3));
  row.dry_matter_g_100g_cooked = Number(dryCooked.toFixed(3));
  row.verim_katsayisi_cooked_g_per_raw_g = Number(yieldRatio.toFixed(5));
  row.verim_yuzde = Number((yieldRatio * 100).toFixed(2));
  row.net_yag_degisim_g_per_100g_raw = Number((cooked.fat_g_100g * yieldRatio - raw.fat_g_100g).toFixed(3));
  row.durum = 'turetilmis';
  if (mode === 'frying') {
    row.not = 'Formülün verdiği net yağ farkı; kaplama/hamur ve diğer bileşen etkileri ayrıştırılmaz, saf emilmiş yağ ölçümü değildir.';
  } else {
    row.not = 'Kuru madde korunumu varsayımı; kayıtlı pişirme yöntemi/veri tanımı yukarıdaki açıklamalardadır.';
  }
  return row;
}

function dessertInputs() {
  if (!fs.existsSync(fnddsPath) || !fs.existsSync(surveyPath)) {
    return { durum: 'bulunamadi', not: 'FNDDS indeks veya SurveyFoods inputFoods kaynağı bulunamadı.' };
  }
  const fndds = JSON.parse(fs.readFileSync(fnddsPath, 'utf8'));
  const survey = JSON.parse(fs.readFileSync(surveyPath, 'utf8')).SurveyFoods;
  const surveyById = new Map(survey.map((r) => [r.fdcId, r]));
  const ids = new Map(fndds.map((r) => [r.fdcId, r]));
  return [
    ['Baklava / şerbet', 2708044, 'Şeker ve su inputFoods içinde mevcut; şerbet olarak ayrılmış bileşen veya bitmiş tarif ağırlığı/yield alanı yok. Emilim çıkarılamaz.'],
    ['Sütlaç / rice pudding', 2705685, 'FNDDS inputFoods yalnızca 100 g hazır rice pudding girdisi; çiğ süt/pirinç tarifi ve pişmiş yield yok. Pişme kaybı çıkarılamaz.'],
    ['Kadayıf', null, 'İstenen adla FNDDS SurveyFoods kaydı bulunamadı.'],
  ].map(([hedef, id, not]) => {
    if (id == null || !ids.has(id) || !surveyById.has(id)) return { hedef, durum: 'bulunamadi', not, fdcId: id };
    const base = ids.get(id);
    const detail = surveyById.get(id);
    return {
      hedef, durum: 'bulunamadi', fdcId: id, description: base.description,
      inputFoods: (detail.inputFoods || []).map((f) => ({ ingredientCode: f.ingredientCode, ingredientDescription: f.ingredientDescription, ingredientWeight_g: f.ingredientWeight })),
      not,
    };
  });
}

const result = {
  title: 'USDA SR Legacy kayıtlarından kuru madde verimi ve net yağ farkı',
  source_files: ['tools/usda/cache/index.json (SR Legacy)', 'tools/usda/cache/index-survey.json (FNDDS index)', 'tools/usda/cache/surveyDownload.json (SurveyFoods inputFoods)'],
  methods: {
    yield: 'verim_katsayisi = (100 - cig.su_g_100g) / (100 - pismis.su_g_100g); katsayi g pişmiş/g çiğ, yüzde için ×100. Kuru madde korunumu varsayılır.',
    fat: 'net_yag_degisim_g_per_100g_raw = (pismis.yag_g_100g × verim_katsayisi) - cig.yag_g_100g. Bu makro farkıdır; yağın kaynağını/gerçek emilimini tek başına kanıtlamaz.',
  },
  pisme_verimi: cookingPairs.map((p) => pairRow(p, 'cooking')),
  kizartma_yag_farki: fryingPairs.map((p) => pairRow(p, 'frying')),
  tatli_inputfoods: dessertInputs(),
};
fs.writeFileSync(cikti, JSON.stringify(result, null, 2) + '\n', 'utf8');
const cell = (s) => String(s == null ? 'bulunamadı' : s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const fdcCell = (r) => r ? `${r.fdcId} — ${r.description} (su ${r.water_g_100g} g, yağ ${r.fat_g_100g} g/100 g)` : 'bulunamadı (eşleşen FDC ID/açıklama yok)';
const yieldTable = result.pisme_verimi.map((r) => `| ${cell(r.hedef)} | ${cell(r.durum === 'turetilmis' ? r.verim_yuzde : 'bulunamadı')} | ${fdcCell(r.cig)} | ${fdcCell(r.pismis)} | ${cell(r.net_yag_degisim_g_per_100g_raw)} |`).join('\n');
const fryTable = result.kizartma_yag_farki.map((r) => `| ${cell(r.hedef)} | ${cell(r.durum === 'turetilmis' ? r.net_yag_degisim_g_per_100g_raw : 'bulunamadı')} | ${fdcCell(r.cig)} | ${fdcCell(r.pismis)} |`).join('\n');
const dessertTable = result.tatli_inputfoods.map((r) => {
  const inputs = r.inputFoods ? r.inputFoods.map((f) => `${f.ingredientCode}: ${f.ingredientDescription} (${f.ingredientWeight_g} g)`).join('; ') : 'inputFoods bulunamadı';
  return `| ${cell(r.hedef)} | ${cell(r.fdcId || 'bulunamadı')} — ${cell(r.description || 'eşleşen kayıt yok')} | ${cell(inputs)} | Bulunamadı: ${cell(r.not)} |`;
}).join('\n');
const section = `\n\n## USDA kayıtlarından türetilen verim ve yağ emilimi\n\nHesaplar yalnız yerel USDA kayıtlarındaki su ve yağ alanlarından türetilmiştir. Kuru madde korunumu varsayımıyla **verim katsayısı (g pişmiş/g çiğ) = (100 − su_çiğ) / (100 − su_pişmiş)**; verim yüzdesi = katsayı × 100. **Net yağ farkı (g/100 g çiğ) = yağ_pişmiş × verim katsayısı − yağ_çiğ.** Yağ farkı gerçek emilen yağın ölçümü değildir: yağın kaynağını ayırmaz; kaplama, tarif bileşenleri, süzülen yağ ve besin kaybı sonucu etkileyebilir. Eşleşen kayıt bulunmayan satırlara oran tahmini yapılmadı.\n\nKaynak kayıtları: USDA FoodData Central SR Legacy, Nisan 2018 yerel indeks tools/usda/cache/index.json (FDC açıklamaları ve su/yağ alanları; [dataset](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip)). FNDDS bileşenleri: tools/usda/cache/surveyDownload.json / SurveyFoods inputFoods ([dataset](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_survey_food_json_2024-10-31.zip)). Hesaplar tekrar üretilebilir: node tools/besin/verim.js. Tam kayıt ve kullanılan FDC numaraları tools/besin/verim.json içindedir.\n\n### Pişirme verimi\n\n| Hedef | Verim (%) | Çiğ kayıt (FDC, açıklama; su ve yağ /100 g) | Pişmiş kayıt (FDC, açıklama; su ve yağ /100 g) | Net yağ farkı (g/100 g çiğ) |\n|---|---:|---|---|---:|\n${yieldTable}\n\n### Kızartmada net yağ farkı\n\n| Hedef | Net yağ farkı (g/100 g çiğ) | Çiğ kayıt (FDC, açıklama; su ve yağ /100 g) | Kızarmış kayıt (FDC, açıklama; su ve yağ /100 g) |\n|---|---:|---|---|\n${fryTable}\n\n### Şerbet ve sütlü tatlı bileşen kayıtları\n\nFNDDS inputFoods, içerik bileşenlerini listeler; toplam tarifin pişme öncesi/sonrası ağırlığını ve şerbetin son üründe kalan miktarını vermediği için şerbet emilimi veya pişme kaybı hesabı kurulamadı.\n\n| Hedef | FNDDS kayıt | inputFoods bileşenleri (ingredientCode, açıklama, ağırlık) | Sonuç |\n|---|---|---|---|\n${dessertTable}\n`;
let existing = fs.readFileSync(belge, 'utf8');
const marker = '\n\n## USDA kayıtlarından türetilen verim ve yağ emilimi';
const offset = existing.indexOf(marker);
if (offset >= 0) existing = existing.slice(0, offset);
fs.writeFileSync(belge, existing.trimEnd() + section, 'utf8');
console.log('Yazildi: ' + cikti);
console.log('Guncellendi: ' + belge);
console.log('Pisme: ' + result.pisme_verimi.filter((r) => r.durum === 'turetilmis').length + '/' + result.pisme_verimi.length + ' turetilmis');
console.log('Kizartma: ' + result.kizartma_yag_farki.filter((r) => r.durum === 'turetilmis').length + '/' + result.kizartma_yag_farki.length + ' turetilmis');
console.log('Tatli inputFoods: ' + result.tatli_inputfoods.length + ' kayit incelendi; katsayi cikarmaya yeterli tarif/yield yok.');

