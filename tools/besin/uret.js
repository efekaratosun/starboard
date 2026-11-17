"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "../..");
const read = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const norm = s => String(s || "").toLocaleLowerCase("tr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/[^a-z0-9]+/g, "");
/* Web kaynaklarının kabul edilen 41 kaydı için açık Türkçe→İngilizce ad eşleşmesi.
   Bu eşleşme olmayan web kayıtları üretime girmez; yeni kaynak dosyaları eşleşmeyi genişletmeden
   besin sayısını veya çeviri sözlüğünü değiştiremez. */
const WEB_EN = {
  "Düğün çorbası": "Wedding soup",
  "Nohut çorbası": "Chickpea soup",
  "Şehriye çorbası": "Vermicelli soup",
  "Pirinç çorbası": "Rice soup",
  "Bulgur çorbası": "Bulgur soup",
  "Analı kızlı çorbası": "Maiden's delight soup",
  "Tutmaç çorbası": "Tutmaç soup",
  "Arabaşı çorbası": "Arabaşı soup",
  "Ayran aşı çorbası": "Ayran aşı soup",
  "Mantar çorbası": "Mushroom soup",
  "Sebze çorbası": "Vegetable soup",
  "Havuç çorbası": "Carrot soup",
  "Patates çorbası": "Potato soup",
  "Kereviz çorbası": "Celery soup",
  "Lebeniye çorbası": "Lean yogurt soup",
  "Kelle paça çorbası": "Trotters soup",
  "Bamya çorbası": "Okra soup",
  "Ekşili çorba": "Sour soup",
  "Tas kebabı": "Tas kebab",
  "Orman kebabı": "Forest kebab",
  "Testi kebabı": "Testi kebab",
  "Elbasan tava": "Elbasan casserole",
  "İslim kebabı": "İslim kebab",
  "Çoban kavurma": "Shepherd's casserole",
  "Saç kavurma": "Hairy kebab",
  "Soğan kebabı": "Onion kebab",
  "Etli bamya": "Okra with meat",
  "Etli bezelye": "Peas with meat",
  "Etli kabak": "Zucchini with meat",
  "Kuzu haşlama": "Roast lamb",
  "Etli taze fasulye": "Green beans with meat",
  "Urfa kebap": "Urfa kebab",
  "Şiş kebap": "Shish kebab",
  "Beyti kebap": "Beyti kebab",
  "Cağ kebabı": "Çağ kebab",
  "Manisa kebabı": "Manisa kebab",
  "Ali Nazik": "Ali Nazik",
  "Patlıcan kebabı": "Eggplant kebab",
  "Fıstıklı kebap": "Pistachio kebab",
  "Tokat kebabı": "Tokat kebab",
  "Ekşili köfte": "Sour meatballs"
};
function parseCsv(s) {
  const rows=[]; let row=[], value="", quoted=false;
  for(let i=0;i<s.length;i++) { const c=s[i];
    if(quoted && c==='"' && s[i+1]==='"') { value+='"'; i++; }
    else if(c==='"') quoted=!quoted;
    else if(c===',' && !quoted) { row.push(value); value=""; }
    else if((c==='\n'||c==='\r')&&!quoted) { if(c==='\r'&&s[i+1]==='\n')i++; row.push(value); if(row.some(Boolean))rows.push(row); row=[]; value=""; }
    else value+=c;
  }
  if(value||row.length){row.push(value);rows.push(row);}
  const headers=rows.shift()||[];
  return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||""])));
}
function loadFoods() {
  const ctx=vm.createContext({tx:s=>s,console,Set,Map});
  let src=read("starboard-site/js/nutrition.js").split("const DEFAULT_MEALS")[0]
    .replace(/\bconst (FOODS|NUTRIENTS|RECIPES|MEAL_SETS)\b/g,"var $1");
  vm.runInContext(src,ctx,{filename:"nutrition.js"});
  const intl=read("starboard-site/js/foods-intl.js").replace(/^"use strict";\s*/,"")
    .replace(/\bconst (HAS_MEAT|HAS_LACTOSE|MEAL_GRAINS|PORTION|NO_SUGGEST)\b/g,"var $1");
  for(const k of ["HAS_MEAT","HAS_LACTOSE","MEAL_GRAINS","PORTION","NO_SUGGEST","HAS_DAIRY_EGG","HAS_GLUTEN","BREAKFAST_GRAINS","MEAT_DAIRY"])ctx[k]=new Set();
  vm.runInContext(intl,ctx,{filename:"foods-intl.js"});
  return ctx.FOODS;
}
const foods=loadFoods(), existingKeys=new Set(Object.keys(foods).map(norm)), existingNames=new Set(Object.values(foods).map(f=>norm(f.n)));
const cache=[...JSON.parse(read("tools/usda/cache/index.json")),...JSON.parse(read("tools/usda/cache/index-survey.json"))];
const byFdc=new Map(cache.map(x=>[Number(x.fdcId),x]));
const rows=[];
const csvRows={};
for(const [file,kind] of [["basics","basic"],["world","intl"],["tr","tr"]]) {
  const csv=parseCsv(read(`docs/icerik/besin-degerleri-${file}.csv`));
  csvRows[file]=csv;
  const crossFile=file==="basics"?"temel-step5.json":file==="world"?"dunya-codex2.json":null;
  const cross=crossFile?JSON.parse(read(`tools/besin/eslesme/${crossFile}`)):[];
  const eligible=csv.filter(row=>["complete","verified_direct_record"].includes(row.status));
  const rowFor=name=>eligible.find(row=>norm(row.canonical_name_tr||row.source_name)===norm(name))||{};
  const seen=new Set();
  for(const c of cross.filter(x=>x.fdc)) {
    const name=c.ad; seen.add(norm(name));
    rows.push({name,row:rowFor(name),c,kind,file});
  }
  for(const row of eligible) {
    const name=row.canonical_name_tr||row.source_name;
    const anyId=(row.nutrient_data_source||row.notes||"").match(/(?:FDC ID|fdcId=?)\s*(\d+)/i);
    if(anyId&&!seen.has(norm(name))) {
      const fdc=Number(anyId[1]), c=cross.find(x=>Number(x.fdc)===fdc)||{ad:name,fdc,kaynak:/FNDDS/i.test(row.nutrient_data_source||"")?"FNDDS":"SR"};
      rows.push({name,row,c,kind,file}); seen.add(norm(name));
    }
  }
}
/* Yalnız son kaynak dosyaları okunur; ara/parça dosyaları (dunya_p4, batch* gibi)
   üretime girmez. Kaynak türü dosya adından gelir: temel→basic, dunya→intl, turk-*→tr.
   İngilizce adlar web/web-en.json sözlüğünden okunur; WEB_EN yalnızca yedek.
   Aynı Türkçe ad farklı dosyalarda ya da aynı dosyada birden çok geçerse tek kalem alınır. */
const WEB_FILES=["temel.json","dunya.json","turk-1.json","turk-2.json"];
const rejected=[]; let web=[];
const webDir=path.join(ROOT,"tools/besin/web");
const WEB_EN_FILE=JSON.parse(read("tools/besin/web/web-en.json"));
const webSeen=new Set();
for(const file of WEB_FILES) {
  let arr; try{arr=JSON.parse(fs.readFileSync(path.join(webDir,file),"utf8"));}catch(e){continue;}
  if(!Array.isArray(arr)){continue;}
  for(const x of arr){const k=norm(x.ad); if(webSeen.has(k))continue; webSeen.add(k); web.push({...x,_file:file});}
}
const candidates=[], usdaNames=new Set();
for(const x of rows){const d=byFdc.get(Number(x.c.fdc)); if(!d){rejected.push(`${x.name}: USDA FDC ${x.c.fdc} cache kaydı yok`);continue;}
 const nk=norm(x.name);if(usdaNames.has(nk))continue;usdaNames.add(nk);
 candidates.push({name:x.name, kind:x.kind, row:x.row, c:x.c, d, fdc:Number(x.c.fdc), origin:x.c.kaynak||"SR"});}
for(const x of web){
  if(!(WEB_EN_FILE[x.ad]||WEB_EN[x.ad]))continue;
  if(usdaNames.has(norm(x.ad)))continue;
  candidates.push({name:x.ad,row:x,kind:/turk/i.test(x._file)?"tr":/dunya/i.test(x._file)?"intl":"basic",web:true,file:x._file});
}
const out={}, english={};
function round1(v){return Math.round((Number(v)+Number.EPSILON)*10)/10;}
function searchEnglish(search,name){
 const parts=String(search||"").split(",").map(x=>x.trim()).filter(Boolean), key=norm(name);
 return parts.find(x=>norm(x)!==key)||parts[0]||"";
}
function keyFor(name){return norm(name)||"besin";}
/* İçecekler uygulamada "meyve" simgesiyle gösterilir (base kayıtlardaki günümüz:
   kola, meyve suyu, şalgam, boza, kahve → i:"fruit"). Bu kural ad eşleşmelerinden
   (papatya→"ham" ile et, ton balığı→"ton" ile balık, hindistan cevizi→"ceviz"
   ile kuruyemiş gibi) ÖNCE çalışır. Anahtarlar norm() çıktısına (Türkçe harf
   sadeleştirilmiş küçük harf) göre yazılır. */
const DRINK_WORD=/cay|kahve|meyve suyu|meyveli su|suyu|nektar|limonata|gazoz|kola|soda|tonik|icecek|smoothie|milkshake|ayran|boza|salgam|serbet|raki|bira|sarap|viski|votka|tekila|likor|kokteyl|espresso|amerikano|cappuccino|latte|mocha|frappe|coldbrew|ipa|stout|cidre|gluhwein|yerba mate|enerji|maden suyu|sut/i;
const NOT_DRINK=/corba|corbasi|sulu|et suyu|ekmek|bread|borek|pide|simit|lavas|kurabiye|kek|pasta|helva|dondurma|cikolata|recel|marmelat|sucuk|incir|sutlac/i;
const WINE_WORD=/sarap|wine|sake/;
const BEER_WORD=/bira|beer|ipa/;
const COCKTAIL_WORD=/kokteyl|cocktail|cosmopolitan|martini|daiquiri|gintonik|longisland|mojito|margarita|negroni|spritz|bloody|tekilasunrise|irlandakahvesi|aperol|piscosour/;
const isDrinkText=s=>!NOT_DRINK.test(s)&&DRINK_WORD.test(s);
function icon(name,desc,category){const s=norm([name,desc,category].join(" "));
 /* Sıvı içecekler: FNDDS kayıtları "Beverages, ..." açıklamasıyla gelir; web
    kayıtlarda Türkçe ad aranır. "Rom" ve "Mate" kendi başına durduğunda içecektir
    ("Saltimbocca alla romana" ya da "domates" gibi adlar bu kurala takılmaz). */
 if(/^beverages/i.test(String(desc||""))||isDrinkText(s)||/^\s*(rom|mate)\s*$/i.test(name))return "fruit";
 if(/domuz|pork|ham|bacon|meat|beef|lamb|kuzu|dana|et|sucuk|salam/.test(s))return "meat";
 if(/chicken|turkey|poultry|tavuk|hindi/.test(s))return "poultry";
 if(/fish|salmon|tuna|cod|balik|somon|ton|levrek|karides|squid|kalamar/.test(s))return "fish";
 if(/egg|yumurta/.test(s))return "egg";
 if(/milk|cheese|yogurt|dairy|sut|peynir|yogurt/.test(s))return "dairy";
 if(/nut|almond|peanut|walnut|fistik|findik|badem|ceviz/.test(s))return "nuts";
 if(/oil|olive|zeytin|yag/.test(s))return "oil";
 if(/bread|ekmek/.test(s))return "bread";
 if(/potato|patates/.test(s))return "potato";
 if(/bean|lentil|pea|chickpea|tofu|fasulye|mercimek|nohut|baklagil/.test(s))return "legume";
 /* "Meyveli kek" ya da "Kuru üzümlü pilav" meyve değil tahıl ürünüdür. */
 if(/fruit|apple|berry|banana|meyve|elma|armut|uzum/.test(s)&&!/kek|pilav|pide|borek|corbasi|corba|dondurma|recel|marmelat|helva|sutlac/i.test(s))return "fruit";
 if(/vegetable|broccoli|spinach|veget|sebze|domates|biber|kabak|havuc/.test(s))return "veg";
 if(/rice|oat|grain|cereal|wheat|pirinc|yulaf|tah|makarna/.test(s))return "grain";
 return "grain";
}
function portion(x){
 let list;
 if(x.web){ list=Number(x.row.porsiyon_g)>0?[{n:"porsiyon",g:Number(x.row.porsiyon_g)}]:undefined; }
 else if(x.origin==="FNDDS"||x.origin==="Survey (FNDDS)"){
  if(Number(x.c.porsiyon_g)>0) list=[{n:x.c.porsiyon_adi||"porsiyon",g:round1(x.c.porsiyon_g)}];
  else { const p=(x.d.porsiyonlar||[]).find(p=>Number(p.g)>0&&p.aciklama!=="Quantity not specified"); if(p)list=[{n:p.aciklama,g:round1(p.g)}]; }
 }
 else { const g=Number(x.row.serving_g||x.c.porsiyon_g); list=g>0?[{n:"porsiyon",g:round1(g)}]:undefined; }
 /* İçecek kalemleri (çay, kahve, meyve suyu vb.) sıvı ölçüsüyle (1 fl oz) ve
    çok küçük bir ilk porsiyonla gelir; varsayılan porsiyon içecek türüne göre
    belirlenir: sert içkiler ve likörler 1 kadeh (50 g), şarap 1 kadeh (150 g),
    bira 1 şişe (330 g), kokteyller 1 bardak (150 g), alkolsüzler 1 bardak (200 g). */
 const d=x.web?x.row:x.d, alk=round1(d.alcohol??d.alk??0), nm=norm(x.name);
 const description=x.web?"":(x.c.description||d.description||"");
 const category=x.web?(x.row.category||""):(x.row.category||x.c.category||d.kategori||"");
 const sourceText=norm(`${x.name} ${description} ${x.web?(x.row.kaynak_url||""):""}`);
 const wine=WINE_WORD.test(sourceText), beer=BEER_WORD.test(sourceText), cocktail=COCKTAIL_WORD.test(sourceText);
 const drink=isDrinkText(nm)||/^beverages/i.test(description)||/beverages|alkollu|icecek|liquorandcocktails/.test(norm(category))
  ||wine||beer||cocktail;
 if(drink){
  if(alk>20||(/likor/.test(nm)&&alk>0)) list=[{n:"kadeh",g:50}];
  else if(wine) list=[{n:"kadeh",g:150}];
  else if(beer) list=[{n:"şişe",g:330}];
  else if(cocktail) list=[{n:"bardak",g:150}];
  else if(alk>0&&list&&list.length) list=list.map(p=>({n:"porsiyon",g:p.g}));
  else if(alk===0) list=[{n:"bardak",g:200}];
 }
 return list;
}
for(const x of candidates){const d=x.web?x.row:x.d;
 if([x.web?d.kcal:d.kcal,x.web?d.p:d.protein,x.web?d.c:d.carbs,x.web?d.f:d.fat].some(v=>v===null||v===""||v===undefined)){
  rejected.push(`${x.name}: kcal/protein/karbonhidrat/yağ kaynağında eksik`);continue;
 }
 const enRow=x.web?{}:(csvRows[x.file]||[]).find(row=>norm(row.canonical_name_tr||row.source_name)===norm(x.name))||{};
 const en=x.web?(WEB_EN_FILE[x.name]||WEB_EN[x.name]):String(enRow.name_en||x.row.name_en||searchEnglish(x.c.arama,x.name)||x.c.description||d.description||"").trim();
 if(!en){rejected.push(`${x.name}: İngilizce ad eksik`);continue;}
 const p=round1(d.protein??d.p), c=round1(d.carbs??d.c), f=round1(d.fat??d.f), lif=round1(d.fiber??d.lif??0), alk=round1(d.alcohol??d.alk??0), kcal=Number(d.kcal);
 const key=keyFor(x.name), nameNorm=norm(x.name);
 if(!Number.isFinite(p+c+f+lif+alk+kcal)){rejected.push(`${x.name}: eksik/sayısal olmayan besin değeri`);continue;}
 const total=p+c+f, calc=4*p+4*c+9*f+7*alk, diff=Math.abs(kcal-calc);
 if(x.web&&total>100){rejected.push(`${x.name}: p+c+f > 100 (${round1(total)})`);continue;}
 if(x.web&&alk<=20&&(kcal<20?diff>5:diff/Math.max(kcal,calc,1)>0.20)){rejected.push(`${x.name}: kcal ve ortak 4-4-9-7 farkı sınırı aşıyor (${round1(diff)} kcal)`);continue;}
 if(existingKeys.has(norm(key))||existingNames.has(nameNorm)){rejected.push(`${x.name}: mevcut FOODS anahtar/ad çakışması`);continue;}
 if(out[key]){rejected.push(`${x.name}: üretilen anahtar çakışması (${key})`);continue;}
 const desc=x.web?"":x.c.description||d.description||"";
 const e={n:txText(x.name)}; const por=portion(x);if(por&&Array.isArray(por))e.por=por.map(p=>({n:txText(p.n),g:p.g}));
 e.p=p;e.c=c;e.f=f;e.lif=lif;if(alk>0)e.alk=alk;e.i=icon(x.name,desc,x.row.category);
 const catMap={"Etler":"sarkuteri","Şarküteri":"sarkuteri","Kahvaltılıklar":"kahvaltilik","Çorbalar":"corba","İçecekler":"icecek","Tatlılar":"tatli","Atıştırmalıklar":"ara","Tahıllar":"tahillar"};if(catMap[x.row.category])e.cat=catMap[x.row.category];
 if(x.kind==="intl"||x.kind==="tr")e.cu=x.kind;
 const pork=/pork|pig|bacon|ham,|ham\b|domuz/i.test(`${x.name} ${desc} ${x.row.notes||""}`);if(pork)e.pork=true;
 e.src=x.web?`web ${x.row.kaynak_url}`:`USDA ${x.origin==="FNDDS"?"FNDDS":"SR"} ${x.fdc}`;
 out[key]=e;
 english[x.name]=en;
}
function txText(s){return {__tx:String(s)};}
function jsVal(v){
 if(v&&typeof v==="object"&&!Array.isArray(v)&&Object.prototype.hasOwnProperty.call(v,"__tx")) return `tx(${JSON.stringify(v.__tx)})`;
 if(Array.isArray(v))return `[${v.map(jsVal).join(", ")}]`;
 if(v&&typeof v==="object")return `{${Object.entries(v).map(([a,b])=>`${a}:${jsVal(b)}`).join(", ")}}`;
 return JSON.stringify(v);
}
function jsObj(obj){return Object.entries(obj).map(([k,v])=>`  ${k}:${jsVal(v)}`).join(",\n");}
const generated=`"use strict";\n\n/* USDA ve doğrulanmış web kaynaklarından tools/besin/uret.js ile üretilir. */\nObject.assign(FOODS, {\n${jsObj(out)}\n});\n`;
if(Object.keys(out).length!==Object.keys(english).length)
 throw new Error(`Üretim sayısı tutarsız: ${Object.keys(out).length} besin, ${Object.keys(english).length} İngilizce ad`);
fs.writeFileSync(path.join(ROOT,"starboard-site/js/foods-usda.js"),generated);
/* İngilizce besin adları için idempotent, üretilmiş sözlük bloğu. */
const EN_START="  /* ---- üretilen yeni besin adları (tools/besin/uret.js) ---- */";
const EN_END="  /* ---- üretilen yeni besin adları sonu ---- */";
function updateEnglishFoods(dict){
 const file="starboard-site/js/lang/en-food.js";
 let src=read(file);
 const lines=Object.keys(dict).sort().map(k=>`  ${JSON.stringify(k)}: ${JSON.stringify(dict[k])},`).join("\n");
 const block=`${EN_START}\n${lines}\n${EN_END}`;
 const start=src.indexOf(EN_START), end=src.indexOf(EN_END,start);
 if(start>=0&&end>=0) src=src.slice(0,start)+block+src.slice(end+EN_END.length);
 else {
  const close=src.lastIndexOf("});");
  if(close<0)throw new Error("en-food.js sözlük sonu bulunamadı");
  const before=src.slice(0,close).trimEnd();
  src=`${before}${before.endsWith(",")?"":","}\n${block}\n${src.slice(close)}`;
 }
 fs.writeFileSync(path.join(ROOT,file),src);
}
updateEnglishFoods(english);
const counts={basic:0,intl:0,tr:0,web:0,usda:0,alk:0};
for(const food of Object.values(out)){
 if(food.cu==="intl")counts.intl++;else if(food.cu==="tr")counts.tr++;else counts.basic++;
 if(String(food.src).startsWith("web "))counts.web++;else counts.usda++;
 if(food.alk>0)counts.alk++;
}
const reasons={duplicate:0,missing:0,noCache:0,macro:0,kcal:0,invalid:0,translation:0,other:0};
for(const reason of rejected){if(reason.includes("mevcut FOODS")||reason.includes("anahtar çakışması"))reasons.duplicate++;else if(reason.includes("kaynağında eksik"))reasons.missing++;else if(reason.includes("cache kaydı yok"))reasons.noCache++;else if(reason.includes("p+c+f > 100"))reasons.macro++;else if(reason.includes("kcal ve ortak"))reasons.kcal++;else if(reason.includes("İngilizce ad eksik"))reasons.translation++;else if(reason.includes("geçersiz JSON")||reason.includes("kök dizi değil"))reasons.invalid++;else reasons.other++;}
const report=[`Üretilen toplam: ${Object.keys(out).length}`,`Temel: ${counts.basic}`,`Dünya: ${counts.intl}`,`Türkçe: ${counts.tr}`,`USDA kaynağından: ${counts.usda}`,`Web kaynağından: ${counts.web}`,`Alkol içeren: ${counts.alk}`,`İngilizce ad: ${Object.keys(english).length}`,`Alınmayan toplam: ${rejected.length}`,`Çakışma: ${reasons.duplicate}; eksik değer: ${reasons.missing}; cache yok: ${reasons.noCache}; makro sınırı: ${reasons.macro}`,`Kalori kontrolü: ${reasons.kcal}; İngilizce ad eksik: ${reasons.translation}; geçersiz web JSON: ${reasons.invalid}; diğer: ${reasons.other}`];fs.writeFileSync(path.join(ROOT,"tools/besin/uret-rapor.md"),report.join("\n")+"\n");
console.log(JSON.stringify({count:Object.keys(out).length,rejected:rejected.length,webFiles:WEB_FILES.length}));






