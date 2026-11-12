"use strict";

/* ---------------- uluslararası içerik ----------------
   Türkiye dışındaki kullanıcılar için besinler, tarifler ve hazır menüler.
   nutrition.js'ten sonra yüklenir ve oradaki FOODS, RECIPES ve MEAL_SETS'e ekler.

   Etiketler:
     cu:"intl"  yalnızca uluslararası mutfak seçiliyken önerilir (aramada her zaman bulunur).
                Etiketsiz besinler iki mutfakta da önerilir; Türk mutfağına özgü olanlar
                nutrition.js'te cu:"tr" alır.
     pork:true  domuz eti içerir: helal ve koşer beslenmede önerilmez.
   Değerler 100 g başınadır, USDA FoodData Central'daki karşılıklarından yuvarlanmıştır.
   Adlar kaynak dil kuralı gereği Türkçe yazılır; İngilizceleri lang/en-food.js'te. */
Object.assign(FOODS, {
  /* ---- et, tavuk, balık ---- */
  bacon:{n:tx("Bacon (domuz)"), a:tx("domuz pastırması"), por:[{n:tx("dilim"),g:8,s:[2,3,4]}], p:37, c:1.4, f:42, lif:0, i:"meat", cat:"sarkuteri", cu:"intl", pork:true, v:["B12"]},
  domuzjambon:{n:tx("Domuz jambonu"), por:[{n:tx("dilim"),g:28}], p:17, c:2.5, f:5, lif:0, i:"meat", cat:"sarkuteri", cu:"intl", pork:true, v:["B12"]},
  domuzpirzola:{n:tx("Domuz pirzola (pişmiş)"), por:[{n:tx("adet"),g:150}], p:27, c:0, f:9, lif:0, i:"meat", cu:"intl", pork:true, v:["B6","B12","çinko"]},
  domuzbonfile:{n:tx("Domuz bonfile (pişmiş)"), por:[{n:tx("porsiyon"),g:150}], p:26, c:0, f:3.5, lif:0, i:"meat", cu:"intl", pork:true, v:["B6","B12"]},
  hindikiyma:{n:tx("Hindi kıyma (pişmiş)"), a:tx("hindi kıyması"), por:[{n:tx("porsiyon"),g:125}], p:27, c:0, f:10, lif:0, i:"poultry", v:["B6","B12","çinko"]},
  danakiyma15:{n:tx("Dana kıyma %15 yağlı (pişmiş)"), por:[{n:tx("porsiyon"),g:125}], p:26, c:0, f:15, lif:0, i:"meat", v:["demir","B12","çinko"]},
  sosisdana:{n:tx("Sosis (dana, hot dog)"), por:[{n:tx("adet"),g:45}], p:11.7, c:2.5, f:27, lif:0, i:"meat", cat:"sarkuteri", cu:"intl"},
  jerky:{n:tx("Kurutulmuş et (jerky)"), por:[{n:tx("paket"),g:28}], p:33, c:11, f:26, lif:1.8, i:"meat", cat:"ara", cu:"intl", v:["demir","çinko"]},
  morina:{n:tx("Morina (pişmiş)"), a:tx("cod"), por:[{n:tx("fileto"),g:150}], p:23, c:0, f:0.9, lif:0, i:"fish", v:["B12"]},
  tilapia:{n:tx("Tilapia (pişmiş)"), por:[{n:tx("fileto"),g:120}], p:26, c:0, f:2.7, lif:0, i:"fish", v:["B12"]},

  /* ---- süt ürünleri ve içecekler ---- */
  yunanyogurt:{n:tx("Yunan yoğurdu (yağsız)"), a:tx("greek yogurt"), por:[{n:tx("kase"),g:170}], p:10.3, c:3.6, f:0.4, lif:0, i:"dairy", cu:"intl", v:["kalsiyum","B12"]},
  tamsut:{n:tx("Süt (tam yağlı)"), por:[{n:tx("bardak"),g:240}], p:3.2, c:4.8, f:3.3, lif:0, i:"dairy", v:["kalsiyum","B12","D"]},
  yagsizsut:{n:tx("Süt (yağsız)"), por:[{n:tx("bardak"),g:240}], p:3.4, c:5, f:0.1, lif:0, i:"dairy", v:["kalsiyum","B12","D"]},
  bademsutu:{n:tx("Badem sütü (şekersiz)"), por:[{n:tx("bardak"),g:240}], p:0.4, c:0.3, f:1.1, lif:0.3, i:"nuts", cat:"kahvaltilik", v:["kalsiyum","E"]},
  yulafsutu:{n:tx("Yulaf sütü"), por:[{n:tx("bardak"),g:240}], p:1, c:6.6, f:1.5, lif:0.8, i:"grain", cat:"kahvaltilik", v:["kalsiyum"]},
  portakalsuyu:{n:tx("Portakal suyu"), por:[{n:tx("bardak"),g:240}], p:0.7, c:10.4, f:0.2, lif:0.2, i:"fruit", v:["C","potasyum"]},

  /* ---- tahıl ve ekmek ---- */
  bagel:{n:tx("Bagel"), por:[{n:tx("adet"),g:105}], p:10, c:53, f:1.6, lif:2.3, i:"bread", cu:"intl"},
  ingmuffin:{n:tx("İngiliz muffin (tam buğday)"), por:[{n:tx("adet"),g:66}], p:8.8, c:40, f:2, lif:6.7, i:"bread", cu:"intl", v:["magnezyum"]},
  eksimaya:{n:tx("Ekşi mayalı ekmek"), por:[{n:tx("dilim"),g:50}], p:10.8, c:52, f:2.4, lif:2.2, i:"bread"},
  tortilla:{n:tx("Buğday tortilla"), por:[{n:tx("adet"),g:45}], p:8.4, c:50, f:7.6, lif:3.5, i:"bread", cu:"intl"},
  misirtortilla:{n:tx("Mısır tortilla"), por:[{n:tx("adet"),g:26}], p:5.7, c:45, f:2.9, lif:6.3, i:"grain", cu:"intl", v:["magnezyum"]},
  esmerpirinc:{n:tx("Esmer pirinç (kuru)"), por:[{n:tx("porsiyon"),g:75}], p:7.5, c:76, f:2.7, lif:3.4, i:"grain", v:["magnezyum"]},
  esmerpirincpis:{n:tx("Esmer pirinç (pişmiş)"), por:[{n:tx("kase"),g:195}], p:2.6, c:23, f:0.9, lif:1.8, i:"grain", v:["magnezyum"]},
  makarnabeyaz:{n:tx("Makarna (kuru)"), a:tx("spagetti"), por:[{n:tx("porsiyon"),g:85}], p:13, c:75, f:1.5, lif:3.2, i:"grain"},
  yulafpis:{n:tx("Yulaf lapası (suyla)"), a:tx("oatmeal"), por:[{n:tx("kase"),g:234}], p:2.5, c:12, f:1.5, lif:1.7, i:"grain", cat:"kahvaltilik", v:["magnezyum"]},
  tahilhalka:{n:tx("Tam tahıllı yulaf halkası"), a:tx("kahvaltılık gevrek"), por:[{n:tx("kase"),g:30}], p:12, c:73, f:6.7, lif:10, i:"grain", cat:"kahvaltilik", v:["demir"]},
  pankek:{n:tx("Pankek (sade)"), por:[{n:tx("adet"),g:38,s:[2,3,4]}], p:6.4, c:28, f:9.7, lif:1, i:"grain", cat:"kahvaltilik"},
  akcaagac:{n:tx("Akçaağaç şurubu"), por:[{n:tx("yemek kaşığı"),g:20}], p:0, c:67, f:0.1, lif:0, i:"fruit", cat:"kahvaltilik", cu:"intl"},
  pretzel:{n:tx("Pretzel"), por:[{n:tx("avuç"),g:30}], p:10, c:80, f:3, lif:3, i:"grain", cat:"ara", cu:"intl"},
  muffin:{n:tx("Yaban mersinli muffin"), por:[{n:tx("adet"),g:110}], p:4.5, c:54, f:16, lif:1.5, i:"grain", cat:"ara", cu:"intl"},

  /* ---- yağ ve tohum ---- */
  bademezmesi:{n:tx("Badem ezmesi"), por:[{n:tx("yemek kaşığı"),g:16}], p:21, c:19, f:56, lif:10, i:"nuts", v:["E","magnezyum"]},
  chia:{n:tx("Chia tohumu"), por:[{n:tx("yemek kaşığı"),g:12}], p:17, c:42, f:31, lif:34, i:"nuts", v:["omega3","kalsiyum","magnezyum"]},
  mayonez:{n:tx("Mayonez"), por:[{n:tx("yemek kaşığı"),g:14}], p:1, c:0.6, f:75, lif:0, i:"oil"},

  /* ---- hazır yemekler ---- */
  cheeseburger:{n:tx("Çizburger"), a:tx("cheeseburger hamburger"), por:[{n:tx("adet"),g:115}], p:14, c:26, f:12, lif:1.2, i:"meat", cat:"yemek", cu:"intl", v:["demir","B12"]},
  bolonez:{n:tx("Spagetti bolonez"), por:[{n:tx("porsiyon"),g:350}], p:7, c:15, f:4, lif:1.5, i:"grain", cat:"yemek", cu:"intl", v:["demir"]},
  makpeynir:{n:tx("Peynirli makarna (mac and cheese)"), por:[{n:tx("porsiyon"),g:200}], p:6.4, c:20, f:6.6, lif:1, i:"dairy", cat:"yemek", cu:"intl", v:["kalsiyum"]},
  sezarsalata:{n:tx("Tavuklu sezar salata"), por:[{n:tx("porsiyon"),g:300}], p:11, c:4, f:8, lif:1.5, i:"poultry", cat:"yemek", cu:"intl", v:["A","K"]},
  burrito:{n:tx("Tavuklu burrito"), por:[{n:tx("adet"),g:300}], p:10, c:22, f:7, lif:2.5, i:"grain", cat:"yemek", cu:"intl"},
  kaliforniyaroll:{n:tx("Kaliforniya roll (suşi)"), a:tx("sushi"), por:[{n:tx("parça"),g:30,s:[6,8,12]}], p:3.5, c:19, f:3.5, lif:1.5, i:"fish", cat:"yemek", cu:"intl"},
  chili:{n:tx("Chili con carne"), por:[{n:tx("kase"),g:250}], p:9, c:10, f:5, lif:4, i:"legume", cat:"yemek", cu:"intl", v:["demir","folat"]},
  nugget:{n:tx("Tavuk nugget"), por:[{n:tx("adet"),g:16,s:[4,6,10]}], p:15, c:16, f:19, lif:1, i:"poultry", cat:"yemek", cu:"intl"},
  hindisandvic:{n:tx("Hindi sandviç"), por:[{n:tx("adet"),g:220}], p:12, c:24, f:5, lif:2.5, i:"bread", cat:"yemek", cu:"intl"}
});

/* Simgesinden anlaşılmayan içerikler: diyet süzgeçleri bunlara bakar. */
["bolonez","burrito","chili","hindisandvic"].forEach(k => HAS_MEAT.add(k));
["pankek","muffin","mayonez","makpeynir","cheeseburger","sezarsalata","burrito"].forEach(k => HAS_DAIRY_EGG.add(k));
["pankek","muffin","makpeynir","cheeseburger","sezarsalata","burrito"].forEach(k => HAS_LACTOSE.add(k));
["bagel","ingmuffin","eksimaya","tortilla","makarnabeyaz","pankek","pretzel","muffin","cheeseburger",
 "bolonez","makpeynir","sezarsalata","burrito","nugget","hindisandvic"].forEach(k => HAS_GLUTEN.add(k));
/* Tek başına öneriye girmeyenler: işlenmiş, tatlı ya da tek başına öğün olmayan. */
["bacon","sosisdana","jerky","pankek","akcaagac","pretzel","muffin","chia","mayonez","portakalsuyu",
 "cheeseburger","makpeynir","nugget","bademsutu","yulafsutu"].forEach(k => NO_SUGGEST.add(k));
["esmerpirinc","esmerpirincpis","makarnabeyaz"].forEach(k => MEAL_GRAINS.add(k));
["bagel","ingmuffin","tahilhalka","yulafpis","pankek"].forEach(k => BREAKFAST_GRAINS.add(k));
/* Koşer: aynı tabakta et ve süt ürünü. */
["cheeseburger","sezarsalata","burrito"].forEach(k => MEAT_DAIRY.add(k));

/* ---- tarifler ---- */
RECIPES.push(
  { n:tx("Gece yulafı (overnight oats)"), cu:"intl", srv:1, t:"5 dk + 1 gece", i:"grain",
    ing:[["yulaf",50],["yunanyogurt",100],["sut",120],["chia",10],["yabanmersini",70],["bal",10]],
    steps:[tx("Yulafı, yoğurdu, sütü ve chia tohumunu bir kavanozda karıştır."),tx("Kapağını kapatıp bir gece buzdolabında beklet."),tx("Sabah üstüne yaban mersini ve bal ekle.")] },

  { n:tx("Pirinçli tavuk stir-fry"), cu:"intl", srv:2, t:"25 dk", i:"poultry",
    ing:[["tavuk",300],["brokoli",200],["kirmizibiber",150],["havuc",100],["sarimsak",10],["zeytinyagi",15],["pirinc",150]],
    steps:[tx("Pirinci haşla."),tx("Tavuğu ince şeritler halinde doğra ve yüksek ateşte yağda mühürle."),tx("Sebzeleri ve sarımsağı ekleyip 5-6 dakika diri kalacak şekilde çevir."),tx("Soya sosu ya da limonla tatlandır, pirinçle servis et.")] },

  { n:tx("Spagetti bolonez"), cu:"intl", srv:4, t:"40 dk", i:"meat",
    ing:[["makarnabeyaz",320],["kofte",400],["sogan",100],["havuc",80],["sarimsak",10],["domates",400],["zeytinyagi",15],["parmesan",20]],
    steps:[tx("Soğanı, havucu ve sarımsağı yağda yumuşat."),tx("Kıymayı ekleyip suyunu çekene kadar kavur."),tx("Rendelenmiş domatesi ekle, kısık ateşte 20 dakika pişir."),tx("Makarnayı haşla, sosla karıştır ve parmesanla servis et.")] },

  { n:tx("Tavuklu burrito kasesi"), cu:"intl", srv:2, t:"30 dk", i:"poultry",
    ing:[["tavuk",300],["pirinc",120],["siyahfasulye",80],["misir",100],["domates",150],["avokado",100],["marul",60]],
    steps:[tx("Siyah fasulyeyi bir gece ıslatıp haşla (ya da konserve kullan)."),tx("Pirinci haşla."),tx("Tavuğu kimyon ve pul biberle tatlandırıp ızgarada pişir, dilimle."),tx("Kaselere pirinç, fasulye, mısır, domates, marul, tavuk ve avokado diz.")] },

  { n:tx("Avokadolu yumurtalı tost"), cu:"intl", srv:1, t:"10 dk", i:"egg",
    ing:[["eksimaya",100],["avokado",80],["yumurta",100],["domates",50]],
    steps:[tx("Ekmeği kızart."),tx("Avokadoyu limon ve tuzla ez, ekmeğe sür."),tx("Yumurtaları haşla ya da poşe yap, dilimleyip üstüne koy."),tx("Domates dilimleri ve karabiberle bitir.")] },

  { n:tx("Ton balıklı sandviç"), cu:"intl", srv:2, t:"10 dk", i:"fish",
    ing:[["ton",160],["yunanyogurt",60],["mayonez",15],["ekmek",120],["marul",30],["salatalik",60]],
    steps:[tx("Ton balığının suyunu süz."),tx("Yoğurt, mayonez ve karabiberle karıştır."),tx("Ekmeklere marul, salatalık ve ton karışımını koy.")] },

  { n:tx("Kinoalı fırın somon"), cu:"intl", srv:2, t:"30 dk", i:"fish",
    ing:[["somon",300],["kinoa",120],["ispanak",100],["limon",30],["zeytinyagi",15]],
    steps:[tx("Kinoayı iki katı suda 15 dakika pişir."),tx("Somonu limon, zeytinyağı ve tuzla 200°C fırında 12-15 dakika pişir."),tx("Sıcak kinoaya ıspanağı karıştırıp somonla servis et.")] },

  { n:tx("Hindi chili"), cu:"intl", srv:4, t:"45 dk", i:"poultry",
    ing:[["hindikiyma",450],["kurufasulye",200],["domates",400],["sogan",120],["kirmizibiber",150],["zeytinyagi",15]],
    steps:[tx("Fasulyeyi bir gece ıslatıp haşla (ya da konserve kullan)."),tx("Soğanı ve biberi yağda yumuşat, kıymayı ekleyip kavur."),tx("Domates, fasulye, kimyon ve pul biberi ekle."),tx("Kısık ateşte 25 dakika pişir.")] },

  { n:tx("Ispanaklı nohut körisi"), cu:"intl", srv:4, t:"35 dk", i:"legume",
    ing:[["nohut",250],["domates",400],["sogan",120],["ispanak",150],["sarimsak",10],["zeytinyagi",20],["pirinc",200]],
    steps:[tx("Nohudu bir gece ıslatıp haşla (ya da konserve kullan)."),tx("Soğanı ve sarımsağı yağda kavur, köri baharatını ekle."),tx("Domates ve nohudu ekleyip 15 dakika pişir, en son ıspanağı karıştır."),tx("Pirinçle servis et.")] },

  { n:tx("Kırmızı mercimek dal"), cu:"intl", srv:4, t:"30 dk", i:"legume",
    ing:[["mercimek",250],["sogan",100],["domates",200],["sarimsak",10],["zeytinyagi",20],["pirinc",200]],
    steps:[tx("Mercimeği yıka, üç katı suyla 15 dakika haşla."),tx("Soğan, sarımsak, zerdeçal ve kimyonu yağda kavur."),tx("Domatesi ekleyip mercimeğe kat, 5 dakika daha pişir."),tx("Pirinçle servis et.")] },

  { n:tx("Esmer pirinçli tofu stir-fry"), cu:"intl", srv:2, t:"25 dk", i:"legume",
    ing:[["tofu",300],["brokoli",200],["kirmizibiber",100],["mantar",100],["esmerpirinc",120],["zeytinyagi",15],["sarimsak",10]],
    steps:[tx("Esmer pirinci haşla."),tx("Tofuyu küp doğra, kurulayıp yağda kızarana kadar çevir."),tx("Sebzeleri ve sarımsağı ekleyip 5 dakika sotele."),tx("Soya sosuyla tatlandır, pirinçle servis et.")] },

  { n:tx("Muzlu protein pankek"), cu:"intl", srv:1, t:"15 dk", i:"egg",
    ing:[["yulaf",40],["yumurta",100],["muz",100],["yunanyogurt",100]],
    steps:[tx("Yulafı, yumurtaları ve muzu blenderdan geçir."),tx("Yapışmaz tavada küçük pankekler halinde iki yüzünü pişir."),tx("Yoğurtla servis et.")] },

  { n:tx("Hafif tavuklu sezar salata"), cu:"intl", srv:2, t:"20 dk", i:"poultry",
    ing:[["tavuk",250],["marul",200],["parmesan",20],["ekmek",50],["yunanyogurt",60],["limon",20],["zeytinyagi",15]],
    steps:[tx("Tavuğu ızgarada pişirip dilimle."),tx("Ekmeği küp doğrayıp fırında kıtır kıtır yap."),tx("Yoğurt, limon, zeytinyağı, sarımsak ve parmesanla sos hazırla."),tx("Marulu sosla karıştır, tavuk ve ekmekle servis et.")] },

  { n:tx("Hindi kıymalı taco"), cu:"intl", srv:4, t:"25 dk", i:"poultry",
    ing:[["hindikiyma",450],["misirtortilla",208],["domates",150],["marul",80],["avokado",120],["sogan",60]],
    steps:[tx("Soğanı yağsız tavada yumuşat, kıymayı ekleyip kimyon ve pul biberle kavur."),tx("Tortillaları kuru tavada ısıt."),tx("Kıymayı, domatesi, marulu ve avokadoyu tortillalara paylaştır.")] },

  { n:tx("Tek tepside tavuk ve tatlı patates"), cu:"intl", srv:2, t:"40 dk", i:"poultry",
    ing:[["tavukbut",300],["tatlipatates",400],["brokoli",200],["zeytinyagi",20]],
    steps:[tx("Tatlı patatesi küp doğra, tavuk butlarını ve brokoliyi ekle."),tx("Zeytinyağı, tuz, kırmızı toz biber ve sarımsak tozuyla harmanla."),tx("200°C fırında 30-35 dakika pişir.")] },

  { n:tx("Fıstık ezmeli muz smoothie"), cu:"intl", srv:1, t:"5 dk", i:"fruit",
    ing:[["muz",120],["fistikezmesi",16],["sut",250],["yulaf",30]],
    steps:[tx("Bütün malzemeleri blenderdan pürüzsüz olana kadar geçir."),tx("İstersen bir avuç buzla soğuk servis et.")] },

  { n:tx("Yoğurtlu meyve kasesi (parfe)"), cu:"intl", srv:1, t:"5 dk", i:"dairy",
    ing:[["yunanyogurt",200],["cilek",100],["granola",30],["bal",10]],
    steps:[tx("Bir bardağa sırayla yoğurt, çilek ve granola koy."),tx("Üstüne bal gezdir.")] }
);

/* ---- hazır menüler ---- */
MEAL_SETS.push(
  { name:tx("Hafta içi pratik"), cu:"intl", meals:[
    { name:tx("Kahvaltı"), share:.25, p:"yunanyogurt", c:"tahilhalka", f:"bademezmesi", extra:tx("Bir avuç orman meyvesi") },
    { name:tx("Öğle"),     share:.30, p:"tavuk",       c:"tortilla",   f:"avokado", extra:tx("Salsa, marul") },
    { name:tx("Ara öğün"), share:.15, p:"cottage",     c:"elma",       f:"fistikezmesi" },
    { name:tx("Akşam"),    share:.30, p:"somon",       c:"esmerpirinc", f:"zeytinyagi", extra:tx("Fırında sebze") }
  ]},
  { name:tx("Akdeniz usulü"), cu:"intl", meals:[
    { name:tx("Kahvaltı"), share:.25, p:"yumurta",     c:"eksimaya",   f:"zeytinyagi", extra:tx("Domates, ıspanak") },
    { name:tx("Öğle"),     share:.30, p:"ton",         c:"kinoa",      f:"zeytinyagi", extra:tx("Yunan salatası") },
    { name:tx("Ara öğün"), share:.15, p:"yunanyogurt", c:"cilek",      f:"ceviz" },
    { name:tx("Akşam"),    share:.30, p:"morina",      c:"patates",    f:"zeytinyagi", extra:tx("Taze fasulye") }
  ]},
  { name:tx("Yağsız ve proteinli"), cu:"intl", meals:[
    { name:tx("Kahvaltı"), share:.25, p:"yumurta",     c:"ingmuffin",  f:"avokado", extra:tx("Domates") },
    { name:tx("Öğle"),     share:.30, p:"hindikiyma",  c:"esmerpirinc", f:"avokado", extra:tx("Siyah fasulye, salsa") },
    { name:tx("Ara öğün"), share:.15, p:"cottage",     c:"muz",        f:"badem" },
    { name:tx("Akşam"),    share:.30, p:"domuzbonfile", c:"tatlipatates", f:"zeytinyagi", extra:tx("Buharda brokoli") }
  ]}
);
