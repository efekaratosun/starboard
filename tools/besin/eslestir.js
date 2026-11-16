#!/usr/bin/env node
'use strict';

// Inventory matcher: deliberately leaves ambiguous or weak matches null.
const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, '..', '..', 'docs', 'icerik');
const indexes = path.join(__dirname, '..', 'usda', 'cache');
const lists = [
  ['temel', 'eksik-icecekler-ve-temel-besinler.md'],
  ['dunya', 'eksik-dunya-yemekleri.md'],
  ['turk', 'eksik-turk-yemekleri.md'],
];
const stop = new Set('and with without style traditional cooked fresh dried raw the a an of in on food dish'.split(' '));
const alias = { mercimek: 'lentil', nohut: 'chickpea', pilav: 'rice', corba: 'soup', kebap: 'kebab', borek: 'pastry', dolma: 'stuffed', sarma: 'stuffed', manti: 'dumpling', kofte: 'meatball', tavuk: 'chicken', dana: 'beef', kuzu: 'lamb', balik: 'fish', patates: 'potato', fasulye: 'bean', yogurt: 'yogurt', ayran: 'buttermilk', peynir: 'cheese', yumurta: 'egg', ekmek: 'bread', eriste: 'noodle', makarna: 'pasta', sogan: 'onion', biber: 'pepper', domates: 'tomato', lahmacun: 'lahmacun', pide: 'pita', gozleme: 'flatbread', baklava: 'baklava', humus: 'hummus', zeytinyagi: 'olive oil', kabak: 'squash', patlican: 'eggplant', pirinc: 'rice', bulgur: 'bulgur', karides: 'shrimp', ton: 'tuna', elma: 'apple', armut: 'pear', muz: 'banana', cilek: 'strawberry', kahve: 'coffee', cay: 'tea', sut: 'milk', krema: 'cream', mercimekli: 'lentil', sebze: 'vegetable', meyve: 'fruit' };
function norm(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, ' ').trim(); }
function tokens(s) { return [...new Set(norm(s).split(/\s+/).filter((x) => x.length > 2 && !stop.has(x)))]; }

const records = [
  ...JSON.parse(fs.readFileSync(path.join(indexes, 'index.json'), 'utf8')).map((r) => ({ ...r, kaynak: 'SR' })),
  ...JSON.parse(fs.readFileSync(path.join(indexes, 'index-survey.json'), 'utf8')).map((r) => ({ ...r, kaynak: 'FNDDS' })),
].map((r) => ({ r, desc: norm(r.description), terms: new Set(tokens(r.description)) }));

function parse(line) {
  const raw = line.replace(/^[-*]\s+/, '').split('|')[0].trim();
  const m = raw.match(/\(([^()]*)\)\s*$/);
  return { raw, tr: raw.replace(/\s*\([^()]*\)\s*$/, '').trim(), english: m ? m[1] : '' };
}

function match(p) {
  const source = p.english || p.tr;
  const q = [...new Set(tokens(source).map((t) => alias[t] || t))];
  if (!q.length) return null;
  const phrase = norm(source);
  const ranked = [];
  for (const item of records) {
    let hit = 0;
    for (const t of q) if (item.terms.has(t)) hit++;
    const exact = item.desc === phrase;
    const coverage = exact ? 1 : hit / q.length;
    if (coverage >= 0.8 && hit >= 1) ranked.push({ ...item, hit, exact, coverage, extra: Math.max(0, item.terms.size - hit) });
  }
  ranked.sort((a, b) => Number(b.exact) - Number(a.exact) || b.coverage - a.coverage || a.extra - b.extra || a.r.description.length - b.r.description.length);
  const c = ranked[0], next = ranked[1];
  if (!c || (!c.exact && next && c.coverage === next.coverage && c.extra === next.extra)) return null;
  if (!c.exact && c.extra > 0) return null;
  if (!c.exact && q.length < 2) return null;
  if (source.split(/\s+/).length >= 2 && c.hit < q.length) return null;
  return c;
}

fs.mkdirSync(path.join(__dirname, 'eslesme'), { recursive: true });
for (const [list, file] of lists) {
  const lines = fs.readFileSync(path.join(base, file), 'utf8').split(/\r?\n/).filter((x) => /^[-*]\s+.+/.test(x));
  const out = lines.map((line) => {
    const p = parse(line), c = match(p);
    const portion = c && c.r.kaynak === 'FNDDS' ? (c.r.porsiyonlar || []).find((x) => x.aciklama && typeof x.g === 'number' && x.g > 0) : null;
    return { ad: p.raw, fdc: c ? c.r.fdcId : null, kaynak: c ? c.r.kaynak : null, description: c ? c.r.description : null,
      porsiyon_adi: portion ? portion.aciklama : null, porsiyon_g: portion ? portion.g : null,
      guven: c ? (c.exact ? 'yuksek' : 'orta') : 'dusuk' };
  });
  fs.writeFileSync(path.join(__dirname, 'eslesme', list + '-codex.json'), JSON.stringify(out, null, 2) + '\n');
  const count = { yuksek: 0, orta: 0, dusuk: 0, null: 0 };
  for (const x of out) count[x.guven || 'null']++;
  console.log(list + ': ' + JSON.stringify(count));
}
