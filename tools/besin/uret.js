"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "../..");
const read = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const norm = s => String(s || "").toLocaleLowerCase("tr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/[^a-z0-9]+/g, "");
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
const rejected=[]; let web=[];
const webDir=path.join(ROOT,"tools/besin/web");
if(fs.existsSync(webDir))for(const file of fs.readdirSync(webDir).filter(f=>f.endsWith(".json")).sort()) {
  let arr; try{arr=JSON.parse(fs.readFileSync(path.join(webDir,file),"utf8"));}catch(e){rejected.push(`${file}: geçersiz JSON (${e.message})`);continue;}
  if(!Array.isArray(arr)){rejected.push(`${file}: kök dizi değil`);continue;}
  for(const x of arr) web.push({...x,_file:file});
}
const candidates=[], usdaNames=new Set();
for(const x of rows){const d=byFdc.get(Number(x.c.fdc)); if(!d){rejected.push(`${x.name}: USDA FDC ${x.c.fdc} cache kaydı yok`);continue;}
 const nk=norm(x.name);if(usdaNames.has(nk))continue;usdaNames.add(nk);
 candidates.push({name:x.name, kind:x.kind, row:x.row, c:x.c, d, fdc:Number(x.c.fdc), origin:x.c.kaynak||"SR"});}
for(const x of web){if(usdaNames.has(norm(x.ad)))continue;candidates.push({name:x.ad,row:x,kind:/turk/i.test(x._file)?"tr":/dunya/i.test(x._file)?"intl":"basic",web:true,file:x._file});}
const out={}, english={};
function round1(v){return Math.round((Number(v)+Number.EPSILON)*10)/10;}
function keyFor(name){return norm(name)||"besin";}
function icon(name,desc,category){const s=norm([name,desc,category].join(" "));
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
 if(/fruit|apple|berry|banana|meyve|elma|armut|uzum/.test(s))return "fruit";
 if(/vegetable|broccoli|spinach|veget|sebze|domates|biber|kabak|havuc/.test(s))return "veg";
 if(/rice|oat|grain|cereal|wheat|pirinc|yulaf|tah|makarna/.test(s))return "grain";
 return "grain";
}
function portion(x){if(x.web){return Number(x.row.porsiyon_g)>0?[{n:"porsiyon",g:Number(x.row.porsiyon_g)}]:undefined;}
 if(x.origin==="FNDDS"||x.origin==="Survey (FNDDS)"){
  if(Number(x.c.porsiyon_g)>0)return [{n:x.c.porsiyon_adi||"porsiyon",g:round1(x.c.porsiyon_g)}];
  const p=(x.d.porsiyonlar||[]).find(p=>Number(p.g)>0&&p.aciklama!=="Quantity not specified");
  if(p)return [{n:p.aciklama,g:round1(p.g)}];
 }
 const g=Number(x.row.serving_g||x.c.porsiyon_g); return g>0?[{n:"porsiyon",g:round1(g)}]:undefined;
}
for(const x of candidates){const d=x.web?x.row:x.d;
 if([x.web?d.kcal:d.kcal,x.web?d.p:d.protein,x.web?d.c:d.carbs,x.web?d.f:d.fat].some(v=>v===null||v===""||v===undefined)){
  rejected.push(`${x.name}: kcal/protein/karbonhidrat/yağ kaynağında eksik`);continue;
 }
 const p=round1(d.protein??d.p), c=round1(d.carbs??d.c), f=round1(d.fat??d.f), lif=round1(d.fiber??d.lif??0), alk=round1(d.alcohol??d.alk??0), kcal=Number(d.kcal);
 const key=keyFor(x.name), nameNorm=norm(x.name);
 if(!Number.isFinite(p+c+f+lif+alk+kcal)){rejected.push(`${x.name}: eksik/sayısal olmayan besin değeri`);continue;}
 const total=p+c+f, calc=4*p+4*(c-lif)+2*lif+9*f+7*alk, diff=Math.abs(kcal-calc);
 if(x.web&&total>100){rejected.push(`${x.name}: p+c+f > 100 (${round1(total)})`);continue;}
 if(x.web&&(kcal<20?diff>5:diff/Math.max(kcal,calc,1)>0.20)){rejected.push(`${x.name}: kcal ve lif düzeltilmiş 4-4-9-7 farkı sınırı aşıyor (${round1(diff)} kcal)`);continue;}
 if(existingKeys.has(norm(key))||existingNames.has(nameNorm)){rejected.push(`${x.name}: mevcut FOODS anahtar/ad çakışması`);continue;}
 if(out[key]){rejected.push(`${x.name}: üretilen anahtar çakışması (${key})`);continue;}
 const desc=x.web?"":x.c.description||d.description||"";
 const e={n:`tx(${JSON.stringify(x.name)})`}; const por=portion(x);if(por)e.por=por;
 e.p=p;e.c=c;e.f=f;e.lif=lif;if(alk>0)e.alk=alk;e.i=icon(x.name,desc,x.row.category);
 const catMap={"Etler":"sarkuteri","Şarküteri":"sarkuteri","Kahvaltılıklar":"kahvaltilik","Çorbalar":"corba","İçecekler":"icecek","Tatlılar":"tatli","Atıştırmalıklar":"ara","Tahıllar":"tahillar"};if(catMap[x.row.category])e.cat=catMap[x.row.category];
 if(x.kind==="intl"||x.kind==="tr")e.cu=x.kind;
 const pork=/pork|pig|bacon|ham,|ham\b|domuz/i.test(`${x.name} ${desc} ${x.row.notes||""}`);if(pork)e.pork=true;
 e.src=x.web?`web ${x.row.kaynak_url}`:`USDA ${x.origin==="FNDDS"?"FNDDS":"SR"} ${x.fdc}`;
 out[key]=e;
 const en=x.web?x.row.name_en:x.row.name_en; if(en)english[x.name]=en;
}
function jsObj(obj){return Object.entries(obj).map(([k,v])=>`  ${k}:{${Object.entries(v).map(([a,b])=>`${a}:${a==="n"?b:JSON.stringify(b)}`).join(", ")}}`).join(",\n");}
const generated=`"use strict";\n\n/* USDA ve doğrulanmış web kaynaklarından tools/besin/uret.js ile üretilir. */\nObject.assign(FOODS, {\n${jsObj(out)}\n});\n`;
fs.writeFileSync(path.join(ROOT,"starboard-site/js/foods-usda.js"),generated);
const counts={basic:0,intl:0,tr:0,web:0};
for(const food of Object.values(out)){if(food.cu==="intl")counts.intl++;else if(food.cu==="tr")counts.tr++;else counts.basic++;if(String(food.src).startsWith("web "))counts.web++;}
const reasons={duplicate:0,missing:0,noCache:0,macro:0,kcal:0,invalid:0,other:0};
for(const reason of rejected){if(reason.includes("mevcut FOODS")||reason.includes("anahtar çakışması"))reasons.duplicate++;else if(reason.includes("kaynağında eksik"))reasons.missing++;else if(reason.includes("cache kaydı yok"))reasons.noCache++;else if(reason.includes("p+c+f > 100"))reasons.macro++;else if(reason.includes("kcal ve lif"))reasons.kcal++;else if(reason.includes("geçersiz JSON")||reason.includes("kök dizi değil"))reasons.invalid++;else reasons.other++;}
const report=[`Üretilen toplam: ${Object.keys(out).length}`,`Temel: ${counts.basic}`,`Dünya: ${counts.intl}`,`Türkçe: ${counts.tr}`,`Web kaynağından: ${counts.web}`,`Alınmayan toplam: ${rejected.length}`,`Çakışma: ${reasons.duplicate}; eksik değer: ${reasons.missing}; cache yok: ${reasons.noCache}; makro sınırı: ${reasons.macro}`,`Kalori kontrolü: ${reasons.kcal}; geçersiz web JSON: ${reasons.invalid}; diğer: ${reasons.other}`];fs.writeFileSync(path.join(ROOT,"tools/besin/uret-rapor.md"),report.join("\n")+"\n");
console.log(JSON.stringify({count:Object.keys(out).length,rejected:rejected.length,webFiles:fs.existsSync(webDir)?fs.readdirSync(webDir).filter(f=>f.endsWith('.json')).length:0}));






