"use strict";

/* ---------------- beslenme önerileri ---------------- */
/* 100 g ham/pişmemiş ürün başına yaklaşık makrolar. */
const FOODS = {
  /* p/c/f/lif: 100 g başına gram. v: o besinin kayda değer kaynağı olduğu mikro besinler. */
  yumurta:{n:tx("Yumurta"), p:12.6, c:0.8, f:10, lif:0, unit:50, unitName:tx("adet"), i:"egg", v:["A","D","B12"]},
  yumurtabeyaz:{n:tx("Yumurta beyazı"), a:tx("yumurta akı"), p:11, c:0.7, f:0.2, lif:0, unit:33, unitName:tx("adet"), i:"egg"},
  tavuk:{n:tx("Tavuk göğsü"), por:[{n:tx("porsiyon"),g:150},{n:tx("bütün göğüs"),g:220}], p:31, c:0, f:3.6, lif:0, i:"poultry", v:["B6","B12",tx("çinko")]},
  tavukbut:{n:tx("Tavuk but (derisiz)"), por:[{n:tx("adet"),g:110},{n:tx("porsiyon"),g:150}], p:24, c:0, f:8, lif:0, i:"poultry", v:["B12",tx("çinko")]},
  hindi:{n:tx("Hindi göğsü"), por:[{n:tx("porsiyon"),g:150}], p:29, c:0, f:2, lif:0, i:"poultry", v:["B6","B12"]},
  ton:{n:tx("Ton balığı (suda)"), a:"konserve ton", por:[{n:tx("kutu"),g:110},{n:tx("porsiyon"),g:100}], p:26, c:0, f:1, lif:0, i:"fish", v:["D","B12"]},
  somon:{n:tx("Somon"), por:[{n:tx("porsiyon"),g:150},{n:tx("fileto"),g:180}], p:20, c:0, f:13, lif:0, i:"fish", v:["D","B12","omega3"]},
  hamsi:{n:tx("Hamsi"), por:[{n:tx("porsiyon"),g:200},{n:tx("adet"),g:12,s:[5,10,15]}], p:20, c:0, f:8, lif:0, i:"fish", v:["D","B12","omega3","kalsiyum"]},
  uskumru:{n:tx("Uskumru"), por:[{n:tx("porsiyon"),g:180}], p:19, c:0, f:14, lif:0, i:"fish", v:["D","B12","omega3"]},
  alabalik:{n:tx("Alabalık"), por:[{n:tx("adet"),g:200}], p:20, c:0, f:6, lif:0, i:"fish", v:["D","B12","omega3"]},
  levrek:{n:tx("Levrek"), por:[{n:tx("adet"),g:200}], p:18, c:0, f:4, lif:0, i:"fish", v:["B12"]},
  cipura:{n:tx("Çipura"), por:[{n:tx("adet"),g:200}], p:20, c:0, f:5, lif:0, i:"fish", v:["B12"]},
  karides:{n:tx("Karides"), por:[{n:tx("porsiyon"),g:150},{n:tx("adet"),g:12,s:[5,10,15]}], p:20, c:0, f:1, lif:0, i:"fish", v:["B12",tx("çinko")]},
  kofte:{n:tx("Yağsız dana kıyma"), a:tx("kıyma"), por:[{n:tx("porsiyon"),g:125}], p:26, c:0, f:9, lif:0, i:"meat", v:["demir","B12",tx("çinko")]},
  biftek:{n:tx("Dana biftek"), por:[{n:tx("porsiyon"),g:180}], p:27, c:0, f:8, lif:0, i:"meat", v:["demir","B12",tx("çinko")]},
  kuzu:{n:tx("Kuzu eti"), por:[{n:tx("porsiyon"),g:150}], p:25, c:0, f:16, lif:0, i:"meat", v:["demir","B12",tx("çinko")]},
  karaciger:{n:tx("Dana karaciğer"), por:[{n:tx("porsiyon"),g:150}], p:20, c:4, f:5, lif:0, i:"meat", v:["A","demir","B12","folat"]},
  doner:{n:tx("Et döner"), a:tx("döner"), por:[{n:tx("porsiyon"),g:150}], p:20, c:2, f:18, lif:0.3, i:"meat", v:["demir","B12"]},
  sucuk:{n:tx("Sucuk"), por:[{n:tx("dilim"),g:8,s:[3,5,10]}], p:22, c:2, f:40, lif:0, i:"meat"},
  sosis:{n:tx("Sosis"), por:[{n:tx("adet"),g:50}], p:12, c:3, f:25, lif:0, i:"meat"},
  pastirma:{n:tx("Pastırma"), por:[{n:tx("dilim"),g:8,s:[3,5,10]}], p:33, c:1, f:12, lif:0, i:"meat", v:["demir","B12"]},
  kokorec:{n:tx("Kokoreç"), por:[{n:tx("porsiyon"),g:200}], p:18, c:5, f:20, lif:0.3, i:"meat"},

  suzme:{n:tx("Süzme yoğurt"), a:tx("yoğurt"), por:[{n:tx("kase"),g:150},{n:tx("yemek kaşığı"),g:20}], p:10, c:4, f:5, lif:0, i:"dairy", v:["kalsiyum","B12"]},
  yogurt:{n:tx("Yoğurt (tam yağlı)"), por:[{n:tx("kase"),g:150},{n:tx("yemek kaşığı"),g:20}], p:3.5, c:4.7, f:3.3, lif:0, i:"dairy", v:["kalsiyum","B12"]},
  lor:{n:tx("Lor peyniri"), por:[{n:tx("yemek kaşığı"),g:25},{n:tx("kase"),g:150}], p:18, c:3, f:5, lif:0, i:"dairy", v:["kalsiyum","B12"]},
  beyazpeynir:{n:tx("Beyaz peynir"), a:"peynir inek", por:[{n:tx("dilim"),g:30},{n:tx("kibrit kutusu"),g:30}], p:17, c:2, f:22, lif:0, i:"dairy", v:["kalsiyum","B12"]},
  kasar:{n:tx("Kaşar peyniri"), a:"peynir", por:[{n:tx("dilim"),g:20}], p:25, c:2, f:27, lif:0, i:"dairy", v:["kalsiyum","B12","A"]},
  ayran:{n:tx("Ayran"), por:{n:tx("bardak"),g:200}, p:2, c:3, f:1.5, lif:0, i:"dairy", v:["kalsiyum"]},
  sut:{n:tx("Süt (yarım yağlı)"), a:tx("inek sütü"), por:{n:tx("bardak"),g:200}, p:3.4, c:4.8, f:1.8, lif:0, i:"dairy", v:["kalsiyum","B12","D"]},
  kefir:{n:tx("Kefir"), por:{n:tx("bardak"),g:200}, p:3.3, c:4, f:1, lif:0, i:"dairy", v:["kalsiyum","B12"]},
  whey:{n:tx("Protein tozu (whey)"), cat:"spor", a:"protein tozu whey protein", p:80, c:8, f:6, lif:1, unit:30, unitName:tx("ölçek"), i:"dairy"},
  cacik:{n:tx("Cacık"), por:{n:tx("kase"),g:150}, p:2.5, c:4, f:2, lif:0.5, i:"dairy", v:["kalsiyum"]},
  haydari:{n:tx("Haydari"), por:[{n:tx("yemek kaşığı"),g:20},{n:tx("kase"),g:120}], p:6, c:4, f:12, lif:0.4, i:"dairy", v:["kalsiyum"]},

  mercimek:{n:tx("Kırmızı mercimek (kuru)"), por:[{n:tx("porsiyon"),g:60},{n:tx("su bardağı"),g:180}], p:24, c:60, f:1.5, lif:11, i:"legume", v:["folat","demir","magnezyum"]},
  yesilmercimek:{n:tx("Yeşil mercimek (kuru)"), por:[{n:tx("porsiyon"),g:60},{n:tx("su bardağı"),g:180}], p:25, c:60, f:1, lif:11, i:"legume", v:["folat","demir","magnezyum"]},
  nohut:{n:tx("Nohut (kuru)"), por:[{n:tx("porsiyon"),g:60},{n:tx("su bardağı"),g:180}], p:19, c:61, f:6, lif:12, i:"legume", v:["folat","demir","magnezyum"]},
  kurufasulye:{n:tx("Kuru fasulye (kuru)"), por:[{n:tx("porsiyon"),g:60},{n:tx("su bardağı"),g:180}], p:21, c:60, f:1.5, lif:15, i:"legume", v:["folat","demir","magnezyum"]},
  barbunya:{n:tx("Barbunya (kuru)"), por:[{n:tx("porsiyon"),g:60},{n:tx("su bardağı"),g:180}], p:22, c:57, f:1.5, lif:15, i:"legume", v:["folat","demir"]},
  bezelye:{n:tx("Bezelye"), por:[{n:tx("kase"),g:150},{n:tx("yemek kaşığı"),g:15}], p:5, c:14, f:0.4, lif:5, i:"legume", v:["C","folat","K"]},
  tofu:{n:tx("Tofu"), por:[{n:tx("porsiyon"),g:100},{n:tx("dilim"),g:40}], p:17, c:2, f:9, lif:1, i:"legume", v:["kalsiyum","demir"]},
  soya:{n:tx("Soya kıyması (kuru)"), por:[{n:tx("porsiyon"),g:40},{n:tx("su bardağı"),g:90}], p:52, c:30, f:1, lif:6, i:"legume", v:["demir","folat"]},
  humus:{n:tx("Humus"), por:[{n:tx("yemek kaşığı"),g:20},{n:tx("kase"),g:100}], p:8, c:14, f:10, lif:6, i:"legume", v:["folat","demir"]},
  seitan:{n:tx("Seitan"), por:[{n:tx("porsiyon"),g:100}], p:25, c:14, f:2, lif:1, i:"legume", v:["demir"]},
  tempeh:{n:tx("Tempeh"), por:[{n:tx("porsiyon"),g:100}], p:19, c:9, f:11, lif:6, i:"legume", v:["demir","magnezyum"]},
  vegankiyma:{n:tx("Bitkisel kıyma"), por:[{n:tx("porsiyon"),g:100}], p:20, c:6, f:10, lif:4, i:"legume", v:["demir","B12"]},
  soyafasulye:{n:tx("Soya fasulyesi (kuru)"), por:[{n:tx("porsiyon"),g:60},{n:tx("su bardağı"),g:180}], p:36, c:30, f:20, lif:9, i:"legume", v:["demir","folat","magnezyum"]},
  borulce:{n:tx("Börülce (kuru)"), por:[{n:tx("porsiyon"),g:60},{n:tx("su bardağı"),g:180}], p:24, c:60, f:2, lif:11, i:"legume", v:["folat","demir"]},
  masfasulye:{n:tx("Maş fasulyesi (kuru)"), por:[{n:tx("porsiyon"),g:60},{n:tx("su bardağı"),g:180}], p:24, c:63, f:1, lif:16, i:"legume", v:["folat","demir","magnezyum"]},
  bakla:{n:tx("Bakla (kuru)"), por:[{n:tx("porsiyon"),g:60},{n:tx("su bardağı"),g:180}], p:26, c:58, f:1.5, lif:25, i:"legume", v:["folat","demir","magnezyum"]},
  siyahfasulye:{n:tx("Siyah fasulye (kuru)"), por:[{n:tx("porsiyon"),g:60},{n:tx("su bardağı"),g:180}], p:22, c:62, f:1.4, lif:15, i:"legume", v:["folat","demir","magnezyum"]},
  nohutunu:{n:tx("Nohut unu"), por:[{n:tx("yemek kaşığı"),g:10},{n:tx("su bardağı"),g:110}], p:22, c:58, f:6, lif:11, i:"legume", v:["folat","demir"]},
  bezelyeproteini:{n:tx("Bezelye proteini tozu"), a:"protein tozu vegan", p:80, c:5, f:7, lif:3, unit:30, unitName:tx("ölçek"), i:"legume", cat:"spor", v:["demir"]},
  edamame:{n:tx("Edamame"), por:[{n:tx("kase"),g:100}], p:11, c:9, f:5, lif:5, i:"legume", v:["folat","demir","magnezyum"]},

  cottage:{n:tx("Süzme peynir (cottage)"), a:tx("süzme peynir"), por:[{n:tx("yemek kaşığı"),g:25},{n:tx("kase"),g:150}], p:11, c:3.4, f:4.3, lif:0, i:"dairy", v:["kalsiyum","B12"]},
  skyr:{n:tx("Yüksek proteinli yoğurt"), a:tx("proteinli yoğurt protein"), por:{n:tx("kase"),g:150}, p:10, c:4, f:0.2, lif:0, i:"dairy", v:["kalsiyum","B12"]},
  ricotta:{n:tx("Ricotta"), por:[{n:tx("yemek kaşığı"),g:25}], p:11, c:3, f:13, lif:0, i:"dairy", v:["kalsiyum","B12"]},

  susam:{n:tx("Susam"), por:[{n:tx("yemek kaşığı"),g:9}], p:17, c:23, f:50, lif:12, i:"nuts", v:["kalsiyum","demir","magnezyum"]},
  ketentohumu:{n:tx("Keten tohumu"), por:[{n:tx("yemek kaşığı"),g:10}], p:18, c:29, f:42, lif:27, i:"nuts", v:["omega3","magnezyum"]},
  pekan:{n:tx("Pekan cevizi"), por:[{n:tx("avuç"),g:25}], p:9, c:14, f:72, lif:10, i:"nuts", v:["E","magnezyum"]},
  hindistancevizi:{n:tx("Hindistan cevizi (kuru)"), por:[{n:tx("yemek kaşığı"),g:6}], p:7, c:24, f:65, lif:16, i:"nuts", v:["magnezyum","demir"]},
  hindistancevizyagi:{n:tx("Hindistan cevizi yağı"), por:[{n:tx("yemek kaşığı"),g:13},{n:tx("tatlı kaşığı"),g:5}], p:0, c:0, f:100, lif:0, i:"oil"},

  karabugday:{n:tx("Karabuğday (kuru)"), por:[{n:tx("porsiyon"),g:60}], p:13, c:72, f:3.4, lif:10, i:"grain", v:["magnezyum","demir"]},
  amarant:{n:tx("Amarant (kuru)"), por:[{n:tx("porsiyon"),g:60}], p:14, c:65, f:7, lif:7, i:"grain", v:["magnezyum","demir","kalsiyum"]},
  polenta:{n:tx("Mısır irmiği (polenta)"), por:[{n:tx("porsiyon"),g:50}], p:8, c:79, f:3.5, lif:7, i:"grain", v:["magnezyum"]},
  pirincunu:{n:tx("Pirinç unu"), por:[{n:tx("yemek kaşığı"),g:10}], p:6, c:80, f:1.4, lif:2.4, i:"grain"},
  glutensizmakarna:{n:tx("Glutensiz makarna (kuru)"), por:[{n:tx("porsiyon"),g:80}], p:7, c:78, f:1.5, lif:3, i:"grain"},
  kestane:{n:tx("Kestane"), por:[{n:tx("adet"),g:10,s:[3,5,10]}], p:2, c:45, f:2, lif:8, i:"grain", v:["C","potasyum"]},
  soyasutu:{n:tx("Soya sütü (zenginleştirilmiş)"), por:{n:tx("bardak"),g:200}, p:3.3, c:1.8, f:1.8, lif:0.5, i:"legume", cat:"kahvaltilik", v:["kalsiyum","B12"]},
  bitkiselyogurt:{n:tx("Bitkisel yoğurt (soya)"), por:[{n:tx("kase"),g:150}], p:4, c:5, f:3, lif:0.8, i:"legume", cat:"kahvaltilik", v:["kalsiyum"]},
  piyaz:{n:tx("Piyaz"), por:[{n:tx("porsiyon"),g:200}], p:6, c:16, f:7, lif:5, i:"legume", v:["folat","C"]},

  yulaf:{n:tx("Yulaf ezmesi"), por:[{n:tx("porsiyon"),g:40},{n:tx("yemek kaşığı"),g:10}], p:13, c:60, f:7, lif:10, i:"grain", v:["magnezyum","demir"]},
  pirinc:{n:tx("Pirinç (kuru)"), por:[{n:tx("porsiyon"),g:75},{n:tx("su bardağı"),g:180}], p:7, c:78, f:0.6, lif:1.3, i:"grain"},
  pilav:{n:tx("Pilav (pişmiş)"), a:tx("pirinç pilavı"), por:[{n:tx("porsiyon"),g:180},{n:tx("yemek kaşığı"),g:25}], p:2.7, c:28, f:1.5, lif:0.6, i:"grain"},
  bulgur:{n:tx("Bulgur (kuru)"), por:[{n:tx("porsiyon"),g:75},{n:tx("su bardağı"),g:170}], p:12, c:76, f:1.5, lif:12, i:"grain", v:["magnezyum"]},
  bulgurpilav:{n:tx("Bulgur pilavı (pişmiş)"), a:"bulgur", por:[{n:tx("porsiyon"),g:180},{n:tx("yemek kaşığı"),g:25}], p:3, c:19, f:2, lif:4, i:"grain"},
  makarna:{n:tx("Tam buğday makarna (kuru)"), por:[{n:tx("porsiyon"),g:80}], p:13, c:71, f:2.5, lif:8, i:"grain", v:["magnezyum"]},
  makarnapis:{n:tx("Makarna (pişmiş)"), a:"makarna", por:[{n:tx("porsiyon"),g:200}], p:5, c:25, f:1, lif:2.5, i:"grain"},
  kinoa:{n:tx("Kinoa (kuru)"), por:[{n:tx("porsiyon"),g:60},{n:tx("su bardağı"),g:170}], p:14, c:64, f:6, lif:7, i:"grain", v:["magnezyum","demir","folat"]},
  kuskus:{n:tx("Kuskus (kuru)"), por:[{n:tx("porsiyon"),g:60},{n:tx("su bardağı"),g:175}], p:13, c:72, f:1, lif:5, i:"grain"},
  misir:{n:tx("Mısır"), por:{n:tx("koçan"),g:90}, p:3.3, c:19, f:1.2, lif:2.7, i:"grain"},
  granola:{n:tx("Granola"), por:[{n:tx("kase"),g:50},{n:tx("yemek kaşığı"),g:10}], p:10, c:60, f:18, lif:7, i:"grain", v:["magnezyum"]},
  gevrek:{n:tx("Mısır gevreği"), por:[{n:tx("kase"),g:30}], p:7, c:84, f:1, lif:3, i:"grain"},
  ekmek:{n:tx("Tam buğday ekmeği"), por:[{n:tx("dilim"),g:30},{n:tx("çeyrek ekmek"),g:60}], p:9, c:43, f:3, lif:7, i:"bread", v:["magnezyum"]},
  beyazekmek:{n:tx("Beyaz ekmek"), por:[{n:tx("dilim"),g:25},{n:tx("çeyrek ekmek"),g:60}], p:8, c:49, f:1.5, lif:2.7, i:"bread"},
  simit:{n:tx("Simit"), p:9, c:55, f:4, lif:3, unit:100, unitName:tx("adet"), i:"bread"},
  yufka:{n:tx("Lavaş / yufka"), por:{n:tx("adet"),g:60}, p:8, c:53, f:2, lif:2, i:"bread"},
  tost:{n:tx("Kaşarlı tost"), a:"peynirli tost", por:{n:tx("adet"),g:150}, p:13, c:30, f:13, lif:2, i:"bread", v:["kalsiyum"]},
  pogaca:{n:tx("Poğaça"), por:{n:tx("adet"),g:70}, p:7, c:38, f:16, lif:1.8, i:"bread"},
  acma:{n:tx("Açma"), por:{n:tx("adet"),g:80}, p:8, c:45, f:10, lif:2, i:"bread"},

  patates:{n:tx("Patates"), por:[{n:tx("adet"),g:150},{n:tx("porsiyon"),g:200}], p:2, c:17, f:0.1, lif:2.2, i:"potato", v:["C","potasyum"]},
  haslanmispatates:{n:tx("Haşlanmış patates"), a:"patates", por:{n:tx("adet"),g:150}, p:2, c:20, f:0.1, lif:1.8, i:"potato", v:["C","potasyum"]},
  patateskizartma:{n:tx("Patates kızartması"), a:"patates", por:[{n:tx("porsiyon"),g:120}], p:3, c:36, f:15, lif:3.8, i:"potato", v:["potasyum"]},
  tatlipatates:{n:tx("Tatlı patates"), por:{n:tx("adet"),g:130}, p:1.6, c:20, f:0.1, lif:3, i:"potato", v:["A","C","potasyum"]},
  kumpir:{n:tx("Kumpir"), por:[{n:tx("adet"),g:450}], p:4, c:25, f:9, lif:2.5, i:"potato", v:["potasyum"]},

  domates:{n:tx("Domates"), por:[{n:tx("adet"),g:120},{n:tx("dilim"),g:20}], p:0.9, c:3.9, f:0.2, lif:1.2, i:"veg", v:["C","A","potasyum"]},
  salatalik:{n:tx("Salatalık"), por:{n:tx("adet"),g:150}, p:0.7, c:3.6, f:0.1, lif:0.5, i:"veg", v:["K"]},
  marul:{n:tx("Marul"), por:{n:tx("yaprak"),g:12}, p:1.4, c:2.9, f:0.2, lif:1.3, i:"veg", v:["A","K","folat"]},
  brokoli:{n:tx("Brokoli"), por:[{n:tx("porsiyon"),g:150},{n:tx("kase"),g:90}], p:2.8, c:7, f:0.4, lif:2.6, i:"veg", v:["C","K","folat"]},
  ispanak:{n:tx("Ispanak"), por:[{n:tx("kase"),g:30},{n:tx("demet"),g:250}], p:2.9, c:3.6, f:0.4, lif:2.2, i:"veg", v:["A","K","folat","demir","magnezyum"]},
  ispanakyemek:{n:tx("Ispanak yemeği"), por:[{n:tx("porsiyon"),g:200}], p:3, c:6, f:5, lif:3, i:"veg", v:["A","K","folat","demir"]},
  kirmizibiber:{n:tx("Kırmızı biber"), por:{n:tx("adet"),g:120}, p:1, c:6, f:0.3, lif:2.1, i:"veg", v:["C","A"]},
  kabak:{n:tx("Kabak"), por:{n:tx("adet"),g:200}, p:1.2, c:3.1, f:0.3, lif:1, i:"veg", v:["C"]},
  patlican:{n:tx("Patlıcan"), por:{n:tx("adet"),g:250}, p:1, c:6, f:0.2, lif:3, i:"veg", v:["potasyum"]},
  havuc:{n:tx("Havuç"), por:{n:tx("adet"),g:80}, p:0.9, c:10, f:0.2, lif:2.8, i:"veg", v:["A","K"]},
  sogan:{n:tx("Soğan"), por:{n:tx("adet"),g:110}, p:1.1, c:9, f:0.1, lif:1.7, i:"veg", v:["C"]},
  pirasa:{n:tx("Pırasa yemeği"), por:[{n:tx("porsiyon"),g:200}], p:1.5, c:8, f:5, lif:3, i:"veg", v:["A","K","C"]},
  turlu:{n:tx("Sebze türlü"), por:[{n:tx("porsiyon"),g:200}], p:2, c:8, f:5, lif:2.5, i:"veg", v:["A","C","potasyum"]},
  un:{n:tx("Buğday unu"), por:[{n:tx("yemek kaşığı"),g:10},{n:tx("su bardağı"),g:110}], p:10, c:76, f:1, lif:2.7, i:"grain"},
  sehriye:{n:tx("Şehriye"), por:[{n:tx("yemek kaşığı"),g:12}], p:11, c:73, f:1.5, lif:3, i:"grain"},
  seker:{n:tx("Toz şeker"), por:[{n:tx("küp"),g:3,s:[1,2,3]},{n:tx("tatlı kaşığı"),g:5}], p:0, c:100, f:0, lif:0, i:"fruit"},
  pirasacig:{n:tx("Pırasa (çiğ)"), por:[{n:tx("adet"),g:200}], p:1.5, c:14, f:0.3, lif:1.8, i:"veg", v:["A","K","C"]},
  tazefasulye:{n:tx("Taze fasulye (çiğ)"), por:[{n:tx("porsiyon"),g:150}], p:1.8, c:7, f:0.2, lif:3.4, i:"veg", v:["K","C","folat"]},
  zeytinyaglifasulye:{n:tx("Zeytinyağlı taze fasulye"), por:[{n:tx("porsiyon"),g:200}], p:2, c:7, f:6, lif:3, i:"veg", v:["K","C"]},
  cobansalata:{n:tx("Çoban salata"), por:[{n:tx("kase"),g:150}], p:1, c:4, f:3, lif:1.5, i:"veg", v:["C","A"]},
  ezme:{n:tx("Acılı ezme"), por:[{n:tx("yemek kaşığı"),g:20}], p:1.5, c:7, f:5, lif:2, i:"veg", v:["C","A"]},
  mucver:{n:tx("Mücver"), por:[{n:tx("adet"),g:60}], p:5, c:12, f:10, lif:2, i:"veg", v:["C","A"]},

  elma:{n:tx("Elma"), por:{n:tx("adet"),g:180}, p:0.3, c:14, f:0.2, lif:2.4, i:"fruit", v:["C"]},
  portakal:{n:tx("Portakal"), por:{n:tx("adet"),g:140}, p:0.9, c:12, f:0.1, lif:2.4, i:"fruit", v:["C","folat"]},
  cilek:{n:tx("Çilek"), por:[{n:tx("kase"),g:150},{n:tx("adet"),g:15}], p:0.7, c:8, f:0.3, lif:2, i:"fruit", v:["C","folat"]},
  uzum:{n:tx("Üzüm"), por:[{n:tx("kase"),g:150}], p:0.7, c:18, f:0.2, lif:0.9, i:"fruit", v:["K"]},
  karpuz:{n:tx("Karpuz"), por:[{n:tx("dilim"),g:300}], p:0.6, c:8, f:0.2, lif:0.4, i:"fruit", v:["A","C"]},
  muz:{n:tx("Muz"), por:[{n:tx("adet"),g:120},{n:tx("yarım"),g:60}], p:1.1, c:23, f:0.3, lif:2.6, i:"fruit", v:["B6","potasyum"]},
  kurukayisi:{n:tx("Kuru kayısı"), por:{n:tx("adet"),g:8}, p:3.4, c:63, f:0.5, lif:7, i:"fruit", v:["A","demir","potasyum"]},
  hurma:{n:tx("Hurma"), por:{n:tx("adet"),g:8}, p:2.5, c:75, f:0.4, lif:8, i:"fruit", v:["potasyum","magnezyum"]},
  incir:{n:tx("İncir"), por:{n:tx("adet"),g:50}, p:0.8, c:19, f:0.3, lif:2.9, i:"fruit", v:["potasyum"]},
  yabanmersini:{n:tx("Yaban mersini"), por:[{n:tx("avuç"),g:40},{n:tx("kase"),g:145}], p:0.7, c:14, f:0.3, lif:2.4, i:"fruit", v:["C","K"]},
  bal:{n:tx("Bal"), por:[{n:tx("yemek kaşığı"),g:21},{n:tx("tatlı kaşığı"),g:7}], p:0.3, c:82, f:0, lif:0.2, i:"fruit"},
  recel:{n:tx("Reçel"), por:{n:tx("yemek kaşığı"),g:20}, p:0.5, c:65, f:0, lif:1, i:"fruit"},
  meyvesuyu:{n:tx("Meyve suyu"), por:{n:tx("bardak"),g:200}, p:0.5, c:11, f:0.1, lif:0.2, i:"fruit", v:["C"]},
  kola:{n:tx("Kola"), por:{n:tx("bardak"),g:200}, p:0, c:10.6, f:0, lif:0, i:"fruit"},
  salgam:{n:tx("Şalgam suyu"), por:{n:tx("bardak"),g:200}, p:0.5, c:3, f:0, lif:0.5, i:"fruit", v:["C"]},
  boza:{n:tx("Boza"), por:{n:tx("bardak"),g:200}, p:1.5, c:18, f:0.1, lif:1, i:"fruit"},
  salep:{n:tx("Salep"), por:{n:tx("bardak"),g:200}, p:3, c:22, f:3, lif:0.3, i:"dairy", v:["kalsiyum"]},
  turkkahvesi:{n:tx("Türk kahvesi (sade)"), por:{n:tx("fincan"),g:60}, p:0.2, c:0.6, f:0, lif:0, i:"fruit"},
  cay:{n:tx("Çay (şekersiz)"), por:{n:tx("bardak"),g:200}, p:0, c:0.3, f:0, lif:0, i:"fruit"},

  zeytinyagi:{n:tx("Zeytinyağı"), por:[{n:tx("yemek kaşığı"),g:13},{n:tx("tatlı kaşığı"),g:5}], p:0, c:0, f:100, lif:0, i:"oil", v:["E","K"]},
  aycicekyagi:{n:tx("Ayçiçek yağı"), por:{n:tx("yemek kaşığı"),g:13}, p:0, c:0, f:100, lif:0, i:"oil", v:["E"]},
  tereyagi:{n:tx("Tereyağı"), por:[{n:tx("yemek kaşığı"),g:14},{n:tx("tatlı kaşığı"),g:5}], p:0.9, c:0.1, f:81, lif:0, i:"oil", v:["A"]},
  zeytin:{n:tx("Zeytin"), por:{n:tx("adet"),g:4}, p:1, c:6, f:15, lif:3.3, i:"oil", v:["E","demir"]},
  badem:{n:tx("Badem"), por:{n:tx("avuç"),g:25}, p:21, c:22, f:50, lif:12.5, i:"nuts", v:["E","magnezyum","kalsiyum"]},
  findik:{n:tx("Fındık"), por:{n:tx("avuç"),g:25}, p:15, c:17, f:61, lif:10, i:"nuts", v:["E","magnezyum"]},
  ceviz:{n:tx("Ceviz"), por:{n:tx("avuç"),g:25}, p:15, c:14, f:65, lif:6.7, i:"nuts", v:["omega3","magnezyum"]},
  antepfistigi:{n:tx("Antep fıstığı"), por:{n:tx("avuç"),g:25}, p:20, c:28, f:45, lif:10, i:"nuts", v:["B6","E","potasyum"]},
  kaju:{n:tx("Kaju"), por:{n:tx("avuç"),g:25}, p:18, c:30, f:44, lif:3.3, i:"nuts", v:["magnezyum","demir",tx("çinko")]},
  tahin:{n:tx("Tahin"), por:[{n:tx("yemek kaşığı"),g:15},{n:tx("tatlı kaşığı"),g:5}], p:17, c:21, f:54, lif:9, i:"nuts", v:["kalsiyum","demir","magnezyum"]},
  fistikezmesi:{n:tx("Yer fıstığı ezmesi"), por:[{n:tx("yemek kaşığı"),g:16},{n:tx("tatlı kaşığı"),g:6}], p:25, c:20, f:50, lif:6, i:"nuts", v:["E","magnezyum"]},
  avokado:{n:tx("Avokado"), por:{n:tx("adet"),g:150}, p:2, c:9, f:15, lif:6.7, i:"avocado", v:["E","K","folat","potasyum"]},

  /* --- Türk mutfağı --- */
  menemen:{n:tx("Menemen"), por:[{n:tx("porsiyon"),g:250}], p:6, c:5, f:9, lif:1.2, i:"egg", v:["A","C","B12"]},
  sucuklu:{n:tx("Sucuklu yumurta"), a:"yumurta", por:[{n:tx("porsiyon"),g:150}], p:13, c:2, f:25, lif:0, i:"egg", v:["B12","demir"]},
  karniyarik:{n:tx("Karnıyarık"), por:[{n:tx("adet"),g:250}], p:5, c:8, f:9, lif:3, i:"veg", v:["demir","potasyum"]},
  imambayildi:{n:tx("İmambayıldı"), por:[{n:tx("adet"),g:200}], p:1.5, c:9, f:8, lif:3.5, i:"veg", v:["E","potasyum"]},
  hunkarbegendi:{n:tx("Hünkarbeğendi"), por:[{n:tx("porsiyon"),g:300}], p:9, c:9, f:12, lif:2, i:"meat", v:["demir","kalsiyum","B12"]},
  kurufasulyeyemek:{n:tx("Etli kuru fasulye"), por:[{n:tx("porsiyon"),g:250}], p:7, c:14, f:5, lif:5, i:"legume", v:["demir","folat","B12"]},
  etlinohut:{n:tx("Etli nohut"), por:[{n:tx("porsiyon"),g:250}], p:7, c:15, f:5, lif:5, i:"legume", v:["demir","folat","B12"]},
  manti:{n:tx("Mantı"), por:[{n:tx("porsiyon"),g:250}], p:8, c:30, f:9, lif:2, i:"grain", v:["kalsiyum","B12"]},
  iclikofte:{n:tx("İçli köfte"), por:[{n:tx("adet"),g:60}], p:8, c:25, f:12, lif:3, i:"grain", v:["demir","B12"]},
  cigkofte:{n:tx("Çiğ köfte"), por:[{n:tx("adet"),g:20,s:[5,10,15]},{n:tx("dürüm"),g:200}], p:6, c:38, f:3, lif:6, i:"grain", v:["C","magnezyum"]},
  kisir:{n:tx("Kısır"), por:[{n:tx("porsiyon"),g:150}], p:4, c:32, f:6, lif:5, i:"grain", v:["C","magnezyum"]},
  yapraksarma:{n:tx("Yaprak sarma"), por:[{n:tx("adet"),g:25,s:[3,6,10]}], p:3, c:22, f:8, lif:3, i:"grain", v:["K","E"]},
  lahanasarma:{n:tx("Lahana sarma"), por:[{n:tx("adet"),g:40,s:[2,4,6]}], p:3, c:16, f:6, lif:3, i:"grain", v:["C","K"]},
  biberdolma:{n:tx("Biber dolma"), por:[{n:tx("adet"),g:150}], p:4, c:16, f:7, lif:3, i:"grain", v:["C","A"]},
  suborek:{n:tx("Su böreği"), por:{n:tx("dilim"),g:120}, p:9, c:25, f:12, lif:1.5, i:"bread", v:["kalsiyum"]},
  sigaraboregi:{n:tx("Sigara böreği"), por:{n:tx("adet"),g:35}, p:8, c:28, f:16, lif:1.5, i:"bread", v:["kalsiyum"]},
  kiymaliborek:{n:tx("Kıymalı börek"), por:{n:tx("dilim"),g:120}, p:9, c:26, f:14, lif:1.5, i:"bread", v:["demir","B12"]},
  gozleme:{n:tx("Gözleme"), por:{n:tx("adet"),g:180}, p:8, c:30, f:10, lif:2, i:"bread", v:["kalsiyum"]},
  kiymalipide:{n:tx("Kıymalı pide"), por:{n:tx("adet"),g:250}, p:12, c:30, f:9, lif:2, i:"grain", v:["demir","B12"]},
  kasarlipide:{n:tx("Kaşarlı pide"), por:{n:tx("adet"),g:250}, p:13, c:29, f:12, lif:2, i:"grain", v:["kalsiyum","B12"]},
  lahmacun:{n:tx("Lahmacun"), p:10, c:33, f:8, lif:3, unit:130, unitName:tx("adet"), i:"grain", v:["demir","C"]},
  pizza:{n:tx("Pizza"), por:{n:tx("dilim"),g:110}, p:11, c:28, f:10, lif:2, i:"grain", v:["kalsiyum"]},
  iskender:{n:tx("İskender"), por:[{n:tx("porsiyon"),g:350}], p:15, c:20, f:17, lif:1.5, i:"meat", v:["demir","B12","kalsiyum"]},
  adanakebap:{n:tx("Adana kebap"), por:[{n:tx("şiş"),g:100},{n:tx("porsiyon"),g:200}], p:18, c:2, f:22, lif:0.5, i:"meat", v:["demir","B12",tx("çinko")]},
  tavuksis:{n:tx("Tavuk şiş"), por:[{n:tx("şiş"),g:100},{n:tx("porsiyon"),g:200}], p:26, c:1, f:8, lif:0.3, i:"poultry", v:["B6","B12"]},
  izgarakofte:{n:tx("Izgara köfte"), por:[{n:tx("porsiyon"),g:150},{n:tx("adet"),g:30}], p:18, c:4, f:16, lif:0.6, i:"meat", v:["demir","B12",tx("çinko")]},
  tavuksote:{n:tx("Tavuk sote"), a:"tavuk", por:[{n:tx("porsiyon"),g:250}], p:20, c:5, f:7, lif:1, i:"poultry", v:["B6","C","B12"]},
  tavukdurum:{n:tx("Tavuk dürüm"), por:[{n:tx("adet"),g:300}], p:14, c:25, f:10, lif:2, i:"bread", v:["B6","C"]},
  balikekmek:{n:tx("Balık ekmek"), por:[{n:tx("adet"),g:300}], p:14, c:22, f:8, lif:1.5, i:"fish", v:["D","B12","omega3"]},
  midyedolma:{n:tx("Midye dolma"), por:[{n:tx("adet"),g:20,s:[5,10,15]}], p:5, c:25, f:5, lif:1, i:"fish", v:["demir","B12"]},
  mercimekcorba:{n:tx("Mercimek çorbası"), por:{n:tx("kase"),g:250}, p:4, c:12, f:2, lif:2, i:"legume", v:["folat","demir"]},
  ezogelin:{n:tx("Ezogelin çorbası"), por:{n:tx("kase"),g:250}, p:3, c:13, f:3, lif:2, i:"legume", v:["folat","demir"]},
  yaylacorba:{n:tx("Yayla çorbası"), por:{n:tx("kase"),g:250}, p:3, c:10, f:3, lif:0.6, i:"dairy", v:["kalsiyum"]},
  tarhana:{n:tx("Tarhana çorbası"), por:{n:tx("kase"),g:250}, p:4, c:14, f:3, lif:2, i:"grain", v:["kalsiyum","B12"]},

  sutlac:{n:tx("Sütlaç"), por:{n:tx("kase"),g:150}, p:4, c:20, f:3, lif:0.3, i:"dairy", v:["kalsiyum"]},
  kazandibi:{n:tx("Kazandibi"), por:{n:tx("porsiyon"),g:120}, p:4, c:25, f:4, lif:0.2, i:"dairy", v:["kalsiyum"]},
  dondurma:{n:tx("Dondurma"), por:{n:tx("top"),g:60}, p:3.5, c:24, f:11, lif:0.7, i:"dairy", v:["kalsiyum"]},
  baklava:{n:tx("Baklava"), por:{n:tx("dilim"),g:45}, p:6, c:40, f:20, lif:1.5, i:"grain", v:["E"]},
  kunefe:{n:tx("Künefe"), por:{n:tx("porsiyon"),g:150}, p:8, c:35, f:17, lif:1, i:"grain", v:["kalsiyum"]},
  kadayif:{n:tx("Tel kadayıf tatlısı"), por:{n:tx("porsiyon"),g:120}, p:5, c:40, f:15, lif:1.5, i:"grain"},
  revani:{n:tx("Revani"), por:{n:tx("dilim"),g:80}, p:4, c:45, f:10, lif:0.8, i:"grain"},
  asure:{n:tx("Aşure"), por:{n:tx("kase"),g:200}, p:3, c:30, f:3, lif:2, i:"grain", v:["demir"]},
  tahinhelva:{n:tx("Tahin helvası"), por:[{n:tx("dilim"),g:40}], p:12, c:45, f:30, lif:3, i:"nuts", v:["kalsiyum","demir","magnezyum"]},
  lokum:{n:tx("Lokum"), por:{n:tx("adet"),g:12}, p:0.3, c:80, f:0.2, lif:0.5, i:"fruit"},
  bitter:{n:tx("Bitter çikolata"), por:{n:tx("kare"),g:10}, p:7.8, c:46, f:43, lif:11, i:"nuts", v:["demir","magnezyum"]},
  sutlucikolata:{n:tx("Sütlü çikolata"), por:{n:tx("kare"),g:10}, p:7.6, c:59, f:30, lif:3.4, i:"nuts", v:["kalsiyum"]},
  /* --- şarküteri --- */
  salam:{n:tx("Dana salam"), por:[{n:tx("dilim"),g:10}], p:18, c:2, f:22, lif:0, i:"meat", cat:"sarkuteri", v:["B12","demir"]},
  hindisalam:{n:tx("Hindi salam"), a:"salam", por:[{n:tx("dilim"),g:10}], p:15, c:3, f:10, lif:0, i:"meat", cat:"sarkuteri", v:["B12"]},
  jambon:{n:tx("Hindi jambon"), a:"jambon hindi", por:[{n:tx("dilim"),g:12}], p:18, c:2, f:5, lif:0, i:"meat", cat:"sarkuteri", v:["B12"]},
  fumehindi:{n:tx("Füme hindi göğsü"), a:tx("hindi füme"), por:[{n:tx("dilim"),g:12}], p:22, c:1, f:3, lif:0, i:"poultry", cat:"sarkuteri", v:["B12","B6"]},
  kavurma:{n:tx("Kavurma"), por:[{n:tx("yemek kaşığı"),g:20},{n:tx("porsiyon"),g:100}], p:26, c:0, f:22, lif:0, i:"meat", cat:"sarkuteri", v:["demir","B12",tx("çinko")]},
  danarosto:{n:tx("Dana rosto (dilimli)"), por:[{n:tx("dilim"),g:15}], p:25, c:1, f:8, lif:0, i:"meat", cat:"sarkuteri", v:["demir","B12"]},
  sardalya:{n:tx("Sardalya konservesi"), por:[{n:tx("kutu"),g:90},{n:tx("adet"),g:20}], p:25, c:0, f:11, lif:0, i:"fish", cat:"sarkuteri", v:["D","B12","omega3","kalsiyum"]},
  fumesomon:{n:tx("Füme somon"), por:[{n:tx("dilim"),g:15}], p:18, c:0, f:4.3, lif:0, i:"fish", cat:"sarkuteri", v:["D","B12","omega3"]},
  tulum:{n:tx("Tulum peyniri"), por:[{n:tx("dilim"),g:30}], p:25, c:1, f:28, lif:0, i:"dairy", cat:"sarkuteri", v:["kalsiyum","B12"]},
  orgupeyniri:{n:tx("Örgü peyniri"), por:[{n:tx("parça"),g:25}], p:22, c:2, f:22, lif:0, i:"dairy", cat:"sarkuteri", v:["kalsiyum","B12"]},
  dilpeyniri:{n:tx("Dil peyniri"), por:[{n:tx("dilim"),g:25}], p:20, c:2, f:22, lif:0, i:"dairy", cat:"sarkuteri", v:["kalsiyum"]},
  mihalic:{n:tx("Mihaliç peyniri"), por:[{n:tx("dilim"),g:20}], p:26, c:1, f:26, lif:0, i:"dairy", cat:"sarkuteri", v:["kalsiyum","B12"]},
  hellim:{n:tx("Hellim"), por:[{n:tx("dilim"),g:30}], p:22, c:2, f:25, lif:0, i:"dairy", cat:"sarkuteri", v:["kalsiyum"]},
  labne:{n:tx("Labne"), por:[{n:tx("yemek kaşığı"),g:20}], p:6, c:4, f:24, lif:0, i:"dairy", cat:"sarkuteri", v:["kalsiyum","A"]},
  krempeynir:{n:tx("Krem peynir"), por:[{n:tx("yemek kaşığı"),g:15}], p:6, c:4, f:30, lif:0, i:"dairy", cat:"sarkuteri", v:["A"]},

  /* --- kahvaltılık --- */
  yesilzeytin:{n:tx("Yeşil zeytin"), por:{n:tx("adet"),g:4}, p:1.5, c:4, f:15, lif:3.3, i:"oil", cat:"kahvaltilik", v:["E"]},
  pekmez:{n:tx("Üzüm pekmezi"), por:{n:tx("yemek kaşığı"),g:21}, p:0.5, c:70, f:0, lif:0.5, i:"fruit", cat:"kahvaltilik", v:["demir","potasyum"]},
  kaymak:{n:tx("Kaymak"), por:[{n:tx("yemek kaşığı"),g:15}], p:3, c:2, f:60, lif:0, i:"dairy", cat:"kahvaltilik", v:["A"]},
  omlet:{n:tx("Omlet"), por:[{n:tx("porsiyon"),g:130}], p:11, c:1, f:12, lif:0, i:"egg", cat:"kahvaltilik", v:["A","D","B12"]},
  musli:{n:tx("Müsli"), por:[{n:tx("kase"),g:50}], p:11, c:60, f:10, lif:8, i:"grain", cat:"kahvaltilik", v:["magnezyum","demir"]},
  findikezmesi:{n:tx("Fındık ezmesi"), por:[{n:tx("yemek kaşığı"),g:16},{n:tx("tatlı kaşığı"),g:6}], p:13, c:17, f:62, lif:7, i:"nuts", cat:"kahvaltilik", v:["E","magnezyum"]},
  kakaolukrem:{n:tx("Kakaolu fındık kreması"), por:{n:tx("yemek kaşığı"),g:18}, p:6, c:57, f:31, lif:3, i:"nuts", cat:"kahvaltilik"},
  cavdarekmek:{n:tx("Çavdar ekmeği"), por:{n:tx("dilim"),g:30}, p:9, c:48, f:3, lif:8, i:"bread", cat:"kahvaltilik", v:["magnezyum"]},
  kepekliekmek:{n:tx("Kepekli ekmek"), por:{n:tx("dilim"),g:30}, p:10, c:41, f:3.5, lif:9, i:"bread", cat:"kahvaltilik", v:["magnezyum"]},

  /* --- ara öğün --- */
  proteinbar:{n:tx("Protein bar"), a:"bar", por:[{n:tx("adet"),g:60}], p:30, c:40, f:14, lif:5, i:"nuts", cat:"spor"},
  meyveliyogurt:{n:tx("Meyveli yoğurt"), por:{n:tx("kase"),g:150}, p:4, c:12, f:2, lif:0.3, i:"dairy", cat:"ara", v:["kalsiyum"]},
  kuruuzum:{n:tx("Kuru üzüm"), por:{n:tx("avuç"),g:25}, p:3, c:79, f:0.5, lif:3.7, i:"fruit", cat:"ara", v:["demir","potasyum"]},
  kuruincir:{n:tx("Kuru incir"), por:{n:tx("adet"),g:20}, p:3.3, c:64, f:0.9, lif:9.8, i:"fruit", cat:"ara", v:["kalsiyum","demir","magnezyum"]},
  leblebi:{n:tx("Leblebi"), por:[{n:tx("avuç"),g:30}], p:21, c:58, f:6, lif:11, i:"legume", cat:"ara", v:["demir","folat","magnezyum"]},
  aycekirdegi:{n:tx("Ay çekirdeği"), por:{n:tx("avuç"),g:25}, p:21, c:20, f:51, lif:8.6, i:"nuts", cat:"ara", v:["E","magnezyum"]},
  kabakcekirdegi:{n:tx("Kabak çekirdeği"), por:{n:tx("avuç"),g:25}, p:30, c:11, f:49, lif:6, i:"nuts", cat:"ara", v:["magnezyum","demir",tx("çinko")]},
  yerfistigi:{n:tx("Yer fıstığı"), por:{n:tx("avuç"),g:25}, p:26, c:16, f:49, lif:8.5, i:"nuts", cat:"ara", v:["E","magnezyum","folat"]},
  kraker:{n:tx("Tuzlu kraker"), por:{n:tx("adet"),g:6}, p:9, c:70, f:12, lif:3, i:"grain", cat:"ara"},
  biskuvi:{n:tx("Bisküvi"), por:{n:tx("adet"),g:12}, p:7, c:70, f:18, lif:2, i:"grain", cat:"ara"},
  yulafbar:{n:tx("Yulaf barı"), por:[{n:tx("adet"),g:40}], p:8, c:62, f:16, lif:6, i:"grain", cat:"spor", v:["magnezyum"]},
  galeta:{n:tx("Pirinç patlağı / galeta"), a:tx("pirinç patlağı rice cake"), por:[{n:tx("adet"),g:9,s:[1,2,3]}], p:8, c:80, f:3, lif:4, i:"grain", cat:"ara"},
  cips:{n:tx("Patates cipsi"), por:[{n:tx("küçük paket"),g:40},{n:tx("avuç"),g:20}], p:6, c:53, f:33, lif:4, i:"potato", cat:"ara", v:["potasyum"]},
  patlamismisir:{n:tx("Patlamış mısır"), por:[{n:tx("kase"),g:30},{n:tx("paket"),g:90}], p:11, c:57, f:12, lif:13, i:"grain", cat:"ara", v:["magnezyum"]},

  /* --- ana yemek --- */
  karnabaharyemek:{n:tx("Karnabahar yemeği"), por:[{n:tx("porsiyon"),g:200}], p:2, c:6, f:4, lif:2.5, i:"veg", cat:"yemek", v:["C","K"]},
  bamya:{n:tx("Bamya yemeği"), por:[{n:tx("porsiyon"),g:200}], p:2, c:7, f:5, lif:3, i:"veg", cat:"yemek", v:["C","K","folat"]},
  enginar:{n:tx("Zeytinyağlı enginar"), por:[{n:tx("porsiyon"),g:200}], p:3, c:11, f:5, lif:5, i:"veg", cat:"yemek", v:["folat","K","C"]},
  kabakdolma:{n:tx("Kabak dolma"), por:[{n:tx("adet"),g:150}], p:3, c:12, f:6, lif:2, i:"grain", cat:"yemek", v:["C"]},
  etlilahana:{n:tx("Etli lahana"), por:[{n:tx("porsiyon"),g:300}], p:4, c:9, f:6, lif:2.5, i:"veg", cat:"yemek", v:["C","demir"]},
  firintavuk:{n:tx("Fırın tavuk"), por:[{n:tx("porsiyon"),g:200}], p:25, c:2, f:12, lif:0.2, i:"poultry", cat:"yemek", v:["B6","B12"]},
  sinitzel:{n:tx("Tavuk şinitzel"), por:[{n:tx("adet"),g:150}], p:20, c:18, f:14, lif:1, i:"poultry", cat:"yemek", v:["B6"]},
  izgarabalik:{n:tx("Izgara balık"), por:[{n:tx("porsiyon"),g:200}], p:22, c:0, f:6, lif:0, i:"fish", cat:"yemek", v:["D","B12","omega3"]},
  soslumakarna:{n:tx("Soslu makarna"), por:[{n:tx("porsiyon"),g:250}], p:6, c:26, f:6, lif:2, i:"grain", cat:"yemek", v:["C"]},
  musakka:{n:tx("Musakka"), por:[{n:tx("porsiyon"),g:250}], p:6, c:8, f:9, lif:2.5, i:"veg", cat:"yemek", v:["demir","B12"]},
  guvec:{n:tx("Etli güveç"), por:[{n:tx("porsiyon"),g:300}], p:8, c:8, f:7, lif:2, i:"meat", cat:"yemek", v:["demir","B12"]},
  tantuni:{n:tx("Tantuni"), por:[{n:tx("dürüm"),g:250},{n:tx("porsiyon"),g:200}], p:15, c:22, f:12, lif:2, i:"bread", cat:"yemek", v:["demir","B12"]},
  cigborek:{n:tx("Çiğ börek"), por:[{n:tx("adet"),g:120}], p:10, c:28, f:16, lif:1.5, i:"bread", cat:"yemek"},
  domatescorba:{n:tx("Domates çorbası"), por:{n:tx("kase"),g:250}, p:2, c:8, f:3, lif:1, i:"veg", cat:"yemek", v:["C","A"]},
  tavukcorba:{n:tx("Tavuk suyu çorbası"), por:{n:tx("kase"),g:250}, p:3, c:6, f:2, lif:0.5, i:"poultry", cat:"yemek"},
  iskembe:{n:tx("İşkembe çorbası"), por:{n:tx("kase"),g:250}, p:6, c:4, f:6, lif:0.2, i:"meat", cat:"yemek", v:["B12"]},

  /* --- meyve --- */
  armut:{n:tx("Armut"), por:{n:tx("adet"),g:170}, p:0.4, c:15, f:0.1, lif:3.1, i:"fruit", v:["C","K"]},
  seftali:{n:tx("Şeftali"), por:{n:tx("adet"),g:150}, p:0.9, c:10, f:0.3, lif:1.5, i:"fruit", v:["C","A"]},
  kayisi:{n:tx("Kayısı"), por:{n:tx("adet"),g:35}, p:1.4, c:11, f:0.4, lif:2, i:"fruit", v:["A","C"]},
  erik:{n:tx("Erik"), por:{n:tx("adet"),g:65}, p:0.7, c:11, f:0.3, lif:1.4, i:"fruit", v:["C","K"]},
  kiraz:{n:tx("Kiraz"), por:[{n:tx("kase"),g:140},{n:tx("adet"),g:8,s:[5,10,15]}], p:1, c:16, f:0.3, lif:2.1, i:"fruit", v:["C","potasyum"]},
  visne:{n:tx("Vişne"), por:[{n:tx("kase"),g:150}], p:1, c:12, f:0.3, lif:1.6, i:"fruit", v:["C","A"]},
  kavun:{n:tx("Kavun"), por:[{n:tx("dilim"),g:200}], p:0.8, c:8, f:0.2, lif:0.9, i:"fruit", v:["A","C"]},
  ananas:{n:tx("Ananas"), por:[{n:tx("dilim"),g:80}], p:0.5, c:13, f:0.1, lif:1.4, i:"fruit", v:["C"]},
  kivi:{n:tx("Kivi"), por:{n:tx("adet"),g:75}, p:1.1, c:15, f:0.5, lif:3, i:"fruit", v:["C","K"]},
  mandalina:{n:tx("Mandalina"), por:{n:tx("adet"),g:90}, p:0.8, c:13, f:0.3, lif:1.8, i:"fruit", v:["C","A"]},
  greyfurt:{n:tx("Greyfurt"), por:{n:tx("adet"),g:250}, p:0.8, c:8, f:0.1, lif:1.1, i:"fruit", v:["C","A"]},
  nar:{n:tx("Nar"), por:{n:tx("adet"),g:280}, p:1.7, c:19, f:1.2, lif:4, i:"fruit", v:["C","K","folat"]},
  ahududu:{n:tx("Ahududu"), por:[{n:tx("avuç"),g:40}], p:1.2, c:12, f:0.7, lif:6.5, i:"fruit", v:["C","K"]},
  bogurtlen:{n:tx("Böğürtlen"), por:[{n:tx("avuç"),g:40}], p:1.4, c:10, f:0.5, lif:5.3, i:"fruit", v:["C","K"]},
  trabzonhurmasi:{n:tx("Trabzon hurması"), por:{n:tx("adet"),g:170}, p:0.6, c:18, f:0.2, lif:3.6, i:"fruit", v:["A","C"]},
  limon:{n:tx("Limon"), por:{n:tx("adet"),g:60}, p:1.1, c:9, f:0.3, lif:2.8, i:"fruit", v:["C"]},

  /* --- sebze --- */
  karnabahar:{n:tx("Karnabahar"), por:[{n:tx("porsiyon"),g:150}], p:1.9, c:5, f:0.3, lif:2, i:"veg", v:["C","K","folat"]},
  lahana:{n:tx("Beyaz lahana"), por:[{n:tx("kase"),g:90}], p:1.3, c:6, f:0.1, lif:2.5, i:"veg", v:["C","K"]},
  kirmizilahana:{n:tx("Kırmızı lahana"), por:[{n:tx("kase"),g:90}], p:1.4, c:7, f:0.2, lif:2.1, i:"veg", v:["C","K"]},
  brukselahanasi:{n:tx("Brüksel lahanası"), por:[{n:tx("porsiyon"),g:100},{n:tx("adet"),g:15}], p:3.4, c:9, f:0.3, lif:3.8, i:"veg", v:["C","K","folat"]},
  karalahana:{n:tx("Kara lahana"), por:[{n:tx("porsiyon"),g:150}], p:3.3, c:6, f:0.7, lif:2, i:"veg", v:["A","C","K"]},
  kereviz:{n:tx("Kereviz"), por:[{n:tx("porsiyon"),g:100}], p:0.7, c:3, f:0.2, lif:1.6, i:"veg", v:["K"]},
  turp:{n:tx("Turp"), por:{n:tx("adet"),g:15}, p:0.7, c:3.4, f:0.1, lif:1.6, i:"veg", v:["C"]},
  roka:{n:tx("Roka"), por:{n:tx("demet"),g:40}, p:2.6, c:3.7, f:0.7, lif:1.6, i:"veg", v:["A","K","folat"]},
  semizotu:{n:tx("Semizotu"), por:[{n:tx("demet"),g:100}], p:1.3, c:3.4, f:0.4, lif:0.9, i:"veg", v:["A","C","omega3"]},
  maydanoz:{n:tx("Maydanoz"), por:{n:tx("demet"),g:30}, p:3, c:6, f:0.8, lif:3.3, i:"veg", v:["A","C","K","demir"]},
  dereotu:{n:tx("Dereotu"), por:{n:tx("demet"),g:25}, p:3.5, c:7, f:1.1, lif:2.1, i:"veg", v:["A","C"]},
  mantar:{n:tx("Mantar"), por:{n:tx("adet"),g:18}, p:3.1, c:3.3, f:0.3, lif:1, i:"veg", v:["D","B6"]},
  sarimsak:{n:tx("Sarımsak"), por:{n:tx("diş"),g:4}, p:6, c:33, f:0.5, lif:2.1, i:"veg", v:["C","B6"]},
  yesilbiber:{n:tx("Yeşil biber"), por:{n:tx("adet"),g:30}, p:0.9, c:4.6, f:0.2, lif:1.7, i:"veg", v:["C"]},
  balkabagi:{n:tx("Bal kabağı"), por:[{n:tx("porsiyon"),g:200}], p:1, c:7, f:0.1, lif:0.5, i:"veg", v:["A","C"]},
  pancar:{n:tx("Pancar"), por:{n:tx("adet"),g:85}, p:1.6, c:10, f:0.2, lif:2.8, i:"veg", v:["folat","potasyum"]},
  kuskonmaz:{n:tx("Kuşkonmaz"), por:[{n:tx("porsiyon"),g:100},{n:tx("adet"),g:20}], p:2.2, c:3.9, f:0.1, lif:2.1, i:"veg", v:["K","folat","A"]},
  /* --- spor besinleri ve protein tozları --- */
  wheyizolat:{n:tx("Whey izolat"), a:"protein tozu izole", p:90, c:2, f:1, lif:0, unit:30, unitName:tx("ölçek"), i:"dairy", cat:"spor"},
  kazein:{n:tx("Kazein protein"), a:"protein tozu gece", p:78, c:8, f:2, lif:0, unit:33, unitName:tx("ölçek"), i:"dairy", cat:"spor"},
  gainer:{n:tx("Kilo aldırıcı (gainer)"), a:"mass gainer protein tozu", p:22, c:68, f:4, lif:1, unit:50, unitName:tx("ölçek"), i:"dairy", cat:"spor"},
  bitkiselprotein:{n:tx("Bitkisel protein tozu"), a:"vegan protein tozu", p:75, c:8, f:6, lif:4, unit:33, unitName:tx("ölçek"), i:"legume", cat:"spor"},
  kolajen:{n:tx("Kolajen tozu"), a:"collagen", p:90, c:0, f:0, lif:0, unit:10, unitName:tx("ölçek"), i:"dairy", cat:"spor"},
  kreatin:{n:tx("Kreatin"), a:"creatine monohidrat", p:0, c:0, f:0, lif:0, unit:5, unitName:tx("ölçek"), i:"dairy", cat:"spor"},
  maltodekstrin:{n:tx("Maltodekstrin"), a:"karbonhidrat tozu", p:0, c:95, f:0, lif:0, unit:30, unitName:tx("ölçek"), i:"grain", cat:"spor"},
  proteinpancake:{n:tx("Protein pancake karışımı"), a:"pankek", p:30, c:45, f:5, lif:4, unit:50, unitName:tx("ölçek"), i:"grain", cat:"spor"},
  proteinpuding:{n:tx("Protein puding"), p:10, c:6, f:1.5, lif:0, i:"dairy", cat:"spor", v:["kalsiyum"], por:[{n:tx("kase"),g:200}]},
  proteinsut:{n:tx("Proteinli süt"), a:tx("protein içecek"), p:6, c:4.5, f:1.5, lif:0, i:"dairy", cat:"spor", v:["kalsiyum","B12"], por:[{n:tx("şişe"),g:500},{n:tx("bardak"),g:200}]},
  proteinshake:{n:tx("Hazır protein içeceği"), a:"protein shake", p:7, c:3, f:1, lif:0, i:"dairy", cat:"spor", por:[{n:tx("şişe"),g:330}]},
  proteingofret:{n:tx("Proteinli gofret"), p:25, c:45, f:20, lif:3, i:"grain", cat:"spor", por:[{n:tx("adet"),g:40}]},
  proteinkurabiye:{n:tx("Protein kurabiyesi"), a:"cookie", p:20, c:45, f:18, lif:5, i:"grain", cat:"spor", por:[{n:tx("adet"),g:75}]},
  proteincips:{n:tx("Protein cipsi"), p:40, c:30, f:15, lif:3, i:"potato", cat:"spor", por:[{n:tx("paket"),g:30}]},
  enerjijeli:{n:tx("Enerji jeli"), a:"jel", p:0, c:62, f:0, lif:0, i:"fruit", cat:"spor", por:[{n:tx("adet"),g:40}]},
  izotonik:{n:tx("İzotonik içecek"), a:tx("sporcu içeceği"), p:0, c:6, f:0, lif:0, i:"fruit", cat:"spor", por:[{n:tx("şişe"),g:500}]},
  enerjibar:{n:tx("Enerji barı (hurmalı)"), p:6, c:62, f:16, lif:7, i:"fruit", cat:"spor", por:[{n:tx("adet"),g:45}]},

  /* --- şarküteri --- */
  tavukfume:{n:tx("Tavuk füme"), a:tx("füme tavuk göğsü"), p:20, c:2, f:4, lif:0, i:"poultry", cat:"sarkuteri", v:["B6","B12"], por:[{n:tx("dilim"),g:12}]},
  danafume:{n:tx("Dana füme"), a:tx("füme dana"), p:25, c:1, f:6, lif:0, i:"meat", cat:"sarkuteri", v:["demir","B12"], por:[{n:tx("dilim"),g:12}]},
  hindisucuk:{n:tx("Hindi sucuk"), p:18, c:3, f:20, lif:0, i:"poultry", cat:"sarkuteri", por:[{n:tx("dilim"),g:8}]},
  tavuksosis:{n:tx("Tavuk sosis"), p:13, c:4, f:14, lif:0, i:"poultry", cat:"sarkuteri", por:[{n:tx("adet"),g:45}]},
  hindisosis:{n:tx("Hindi sosis"), p:13, c:3, f:12, lif:0, i:"poultry", cat:"sarkuteri", por:[{n:tx("adet"),g:45}]},
  macarsalam:{n:tx("Macar salam"), p:20, c:1, f:35, lif:0, i:"meat", cat:"sarkuteri", por:[{n:tx("dilim"),g:8}]},
  tavuksalam:{n:tx("Tavuk salam"), p:14, c:3, f:12, lif:0, i:"poultry", cat:"sarkuteri", por:[{n:tx("dilim"),g:10}]},
  danajambon:{n:tx("Dana jambon"), p:19, c:1, f:4, lif:0, i:"meat", cat:"sarkuteri", v:["B12"], por:[{n:tx("dilim"),g:12}]},
  tonyagli:{n:tx("Ton balığı (yağlı)"), a:"konserve", p:25, c:0, f:8, lif:0, i:"fish", cat:"sarkuteri", v:["D","B12"], por:[{n:tx("kutu"),g:110}]},
  uskumrukonserve:{n:tx("Uskumru konservesi"), p:21, c:0, f:12, lif:0, i:"fish", cat:"sarkuteri", v:["D","B12","omega3"], por:[{n:tx("kutu"),g:110}]},
  ezine:{n:tx("Ezine peyniri"), a:"beyaz peynir", p:16, c:1.5, f:23, lif:0, i:"dairy", cat:"sarkuteri", v:["kalsiyum","B12"], por:[{n:tx("dilim"),g:30}]},
  lightbeyaz:{n:tx("Light beyaz peynir"), a:tx("yağsız az yağlı"), p:20, c:2, f:10, lif:0, i:"dairy", cat:"sarkuteri", v:["kalsiyum"], por:[{n:tx("dilim"),g:30}]},
  kecipeyniri:{n:tx("Keçi peyniri"), p:21, c:1, f:26, lif:0, i:"dairy", cat:"sarkuteri", v:["kalsiyum"], por:[{n:tx("dilim"),g:30}]},
  cokelek:{n:tx("Çökelek"), p:15, c:3, f:4, lif:0, i:"dairy", cat:"sarkuteri", v:["kalsiyum"], por:[{n:tx("yemek kaşığı"),g:20},{n:tx("kase"),g:120}]},
  gravyer:{n:tx("Gravyer"), p:29, c:0.4, f:32, lif:0, i:"dairy", cat:"sarkuteri", v:["kalsiyum","B12"], por:[{n:tx("dilim"),g:20}]},
  parmesan:{n:tx("Parmesan"), p:35, c:3, f:28, lif:0, i:"dairy", cat:"sarkuteri", v:["kalsiyum"], por:[{n:tx("yemek kaşığı"),g:5}]},
  cheddar:{n:tx("Cheddar"), p:25, c:1.3, f:33, lif:0, i:"dairy", cat:"sarkuteri", v:["kalsiyum"], por:[{n:tx("dilim"),g:20}]},
  mozzarella:{n:tx("Mozzarella"), p:22, c:2, f:17, lif:0, i:"dairy", cat:"sarkuteri", v:["kalsiyum"], por:[{n:tx("dilim"),g:25},{n:tx("top"),g:125}]},
  lightkasar:{n:tx("Light kaşar"), p:28, c:2, f:15, lif:0, i:"dairy", cat:"sarkuteri", v:["kalsiyum"], por:[{n:tx("dilim"),g:20}]},
  kuflupeynir:{n:tx("Küflü peynir (rokfor)"), p:21, c:2, f:30, lif:0, i:"dairy", cat:"sarkuteri", v:["kalsiyum"], por:[{n:tx("dilim"),g:20}]},
  kozbiber:{n:tx("Közlenmiş biber (kavanoz)"), p:1, c:5, f:3, lif:1.5, i:"veg", cat:"sarkuteri", v:["C","A"], por:[{n:tx("adet"),g:40}]},
  kurudomates:{n:tx("Kurutulmuş domates (yağda)"), p:5, c:20, f:14, lif:5, i:"veg", cat:"sarkuteri", v:["C"], por:[{n:tx("adet"),g:8,s:[2,5,10]}]},
  zeytinezmesi:{n:tx("Zeytin ezmesi"), p:1.5, c:4, f:25, lif:3, i:"oil", cat:"sarkuteri", v:["E"], por:[{n:tx("yemek kaşığı"),g:15}]}
};

/* Mikro besin adları ve nereden alınacağına dair kısa öneriler. */
const NUTRIENTS = {
  A:{n:tx("A vitamini"), src:tx("havuç, ıspanak, tatlı patates")},
  C:{n:tx("C vitamini"), src:tx("kırmızı biber, portakal, brokoli")},
  D:{n:tx("D vitamini"), src:tx("somon, uskumru, yumurta")},
  E:{n:tx("E vitamini"), src:tx("badem, zeytinyağı, avokado")},
  K:{n:tx("K vitamini"), src:tx("ıspanak, brokoli, marul")},
  B6:{n:"B6", src:tx("tavuk, muz, antep fıstığı")},
  B12:{n:"B12", src:tx("et, balık, süt ürünleri; bitkisel beslenmede zenginleştirilmiş ürün veya takviye")},
  folat:{n:tx("Folat"), src:tx("mercimek, ıspanak, nohut")},
  demir:{n:tx("Demir"), src:tx("kırmızı et, mercimek, ıspanak")},
  kalsiyum:{n:tx("Kalsiyum"), src:tx("yoğurt, peynir, tahin")},
  magnezyum:{n:tx("Magnezyum"), src:tx("yulaf, badem, bulgur")},
  potasyum:{n:tx("Potasyum"), src:tx("muz, patates, avokado")},
  çinko:{n:tx("Çinko"), src:tx("kırmızı et, kaju, karides")},
  omega3:{n:tx("Omega-3"), src:tx("somon, ceviz, uskumru")}
};

/* Tarifler malzemelerini besin veritabanından alıyor; makrolar oradan hesaplanıyor. */
const RECIPES = [
  { n:tx("Mercimek çorbası"), cu:"tr", srv:4, t:"35 dk", i:"legume",
    ing:[["mercimek",200],["sogan",80],["havuc",80],["patates",100],["zeytinyagi",20]],
    steps:[tx("Soğanı zeytinyağında pembeleşene kadar kavur."),tx("Doğranmış havuç ve patatesi ekle, 3-4 dakika çevir."),tx("Yıkanmış mercimeği ve 1.5 litre suyu ilave et."),tx("Mercimekler dağılana kadar 25 dakika kaynat."),tx("Blenderdan geçir, tuz ve kimyonla tatlandır.")] },

  { n:tx("Fırında somon"), srv:2, t:"25 dk", i:"fish",
    ing:[["somon",300],["zeytinyagi",15],["patates",300],["kirmizibiber",100]],
    steps:[tx("Fırını 200°C'ye ısıt."),tx("Patates ve biberi dilimleyip zeytinyağıyla harmanla, tepsiye yay."),tx("15 dakika pişir, sonra somonu üzerine yerleştir."),tx("10-12 dakika daha pişir; somon çatalla ayrıldığında hazır."),tx("Limon ve karabiberle servis et.")] },

  { n:tx("Tavuk sote"), cu:"tr", srv:3, t:"25 dk", i:"poultry",
    ing:[["tavuk",450],["kirmizibiber",150],["sogan",100],["domates",150],["zeytinyagi",20]],
    steps:[tx("Tavuğu kuşbaşı doğra, yüksek ateşte mühürle."),tx("Soğan ve biberi ekleyip 5 dakika kavur."),tx("Rendelenmiş domatesi ilave et."),tx("Suyunu çekene kadar 10 dakika pişir."),tx("Bulgur pilavıyla servis et.")] },

  { n:tx("Etli kuru fasulye"), cu:"tr", srv:4, t:"1 sa 15 dk", i:"legume",
    ing:[["kurufasulye",300],["kofte",200],["sogan",100],["zeytinyagi",25],["domates",100]],
    steps:[tx("Fasulyeyi bir gece önceden ıslat."),tx("Eti soğanla birlikte kavur."),tx("Domates salçası ve fasulyeyi ekle, üzerini geçecek kadar su koy."),tx("Kısık ateşte 1 saat pişir."),tx("Pilav ve turşuyla servis et.")] },

  { n:tx("Karnıyarık"), cu:"tr", srv:4, t:"50 dk", i:"veg",
    ing:[["patlican",600],["kofte",250],["sogan",120],["domates",150],["kirmizibiber",80],["zeytinyagi",30]],
    steps:[tx("Patlıcanları alacalı soyup tuzlu suda beklet."),tx("Zeytinyağında kızart veya fırında 180°C'de 20 dakika pişir."),tx("Kıymayı soğan ve biberle kavur, domatesi ekle."),tx("Patlıcanları yarıp içlerini harçla doldur."),tx("Üzerine biber ve domates koyup 25 dakika fırınla.")] },

  { n:tx("Mücver"), cu:"tr", srv:3, t:"30 dk", i:"veg",
    ing:[["kabak",500],["yumurta",100],["ekmek",40],["beyazpeynir",60],["zeytinyagi",30]],
    steps:[tx("Kabakları rendeleyip suyunu iyice sık."),tx("Yumurta, ufalanmış peynir ve galeta ununu ekle."),tx("Dereotu ve karabiberle karıştır."),tx("Tavada zeytinyağıyla iki tarafını pişir."),tx("Cacıkla servis et.")] },

  { n:tx("Yulaflı protein kasesi"), srv:1, t:"10 dk", i:"grain",
    ing:[["yulaf",60],["suzme",150],["muz",100],["ceviz",15],["bal",10]],
    steps:[tx("Yulafı sıcak sütle veya suyla ıslatıp 5 dakika beklet."),tx("Süzme yoğurdu üzerine ekle."),tx("Muzu dilimle, cevizi kır."),tx("Bal gezdirip tarçın serp.")] },

  { n:tx("Kısır"), cu:"tr", srv:4, t:"30 dk", i:"grain",
    ing:[["bulgur",250],["domates",150],["sogan",80],["zeytinyagi",40],["marul",100]],
    steps:[tx("İnce bulguru sıcak suyla ıslatıp 15 dakika demlendir."),tx("Salça, zeytinyağı ve nar ekşisini ekleyip yoğur."),tx("Doğranmış soğan, domates ve maydanozu karıştır."),tx("Marul yaprağıyla servis et.")] },

  { n:tx("Izgara köfte"), cu:"tr", srv:4, t:"30 dk", i:"meat",
    ing:[["kofte",500],["sogan",80],["ekmek",50],["yumurta",50]],
    steps:[tx("Kıymayı rendelenmiş soğan, galeta unu ve yumurtayla yoğur."),tx("Kimyon, karabiber ve tuz ekle, 30 dakika buzdolabında dinlendir."),tx("Köfte şekli ver."),tx("Izgarada her yüzü 4-5 dakika pişir."),tx("Közlenmiş biber ve ezmeyle servis et.")] },

  { n:tx("Menemen"), cu:"tr", srv:2, t:"15 dk", i:"egg",
    ing:[["yumurta",150],["domates",200],["kirmizibiber",120],["zeytinyagi",20]],
    steps:[tx("Biberleri zeytinyağında yumuşayana kadar kavur."),tx("Kabuğu soyulmuş domatesi ekle, suyunu çekene kadar pişir."),tx("Yumurtaları kırıp hafifçe karıştır."),tx("Kıvamı alınca ocaktan al, taze ekmekle servis et.")] },

  { n:tx("Zeytinyağlı taze fasulye"), cu:"tr", srv:4, t:"45 dk", i:"veg",
    ing:[["tazefasulye",600],["sogan",100],["domates",120],["zeytinyagi",50]],
    steps:[tx("Fasulyelerin kılçığını al, ikiye böl."),tx("Soğanı zeytinyağında kavur, domatesi ekle."),tx("Fasulyeleri ve az miktarda suyu ilave et."),tx("Kısık ateşte 35 dakika pişir, soğuk servis et.")] },

  { n:tx("Tavuklu bulgur pilavı"), cu:"tr", srv:4, t:"35 dk", i:"grain",
    ing:[["bulgur",300],["tavuk",400],["sogan",100],["domates",100],["zeytinyagi",25]],
    steps:[tx("Tavuğu kuşbaşı doğrayıp kavur, kenara al."),tx("Soğanı zeytinyağında kavur, salça ve domatesi ekle."),tx("Bulguru ilave edip 2 dakika çevir."),tx("1.5 ölçü sıcak su ekle, tavuğu geri koy."),tx("Suyunu çekene kadar 15 dakika kısık ateşte pişir, 10 dakika demlendir.")] },

  { n:tx("İmambayıldı"), cu:"tr", srv:4, t:"55 dk", i:"veg",
    ing:[["patlican",700],["sogan",150],["domates",150],["kirmizibiber",60],["zeytinyagi",60]],
    steps:[tx("Patlıcanları alacalı soy, tuzlu suda 15 dakika beklet."),tx("Zeytinyağında her tarafını hafifçe kızart, tepsiye al."),tx("Soğanı ince doğrayıp bol zeytinyağında pembeleştir, sarımsak ekle."),tx("Domates ve biberi ilave edip 10 dakika pişir."),tx("Patlıcanları yarıp içlerini doldur, üzerine sıcak su gezdir."),tx("180°C fırında 25 dakika pişir, ılıyınca servis et.")] },

  { n:tx("Etli nohut"), cu:"tr", srv:4, t:"1 sa 10 dk", i:"legume",
    ing:[["nohut",250],["kofte",200],["sogan",100],["domates",120],["zeytinyagi",25]],
    steps:[tx("Nohutu bir gece önceden ıslat."),tx("Kuşbaşı eti kavur, soğanı ekleyip pembeleştir."),tx("Salça ve domatesi ilave et, 2 dakika çevir."),tx("Nohut ve sıcak suyu ekle, kısık ateşte 50 dakika pişir."),tx("Pilavla servis et.")] },

  { n:tx("Ezogelin çorbası"), cu:"tr", srv:4, t:"35 dk", i:"legume",
    ing:[["mercimek",150],["pirinc",50],["bulgur",50],["sogan",80],["tereyagi",25]],
    steps:[tx("Soğanı tereyağında kavur, salçayı ekle."),tx("Mercimek, pirinç ve bulguru ilave et."),"1.5 litre su ekleyip 25 dakika kaynat.",tx("Nane, pul biber ve tuzla tatlandır."),tx("İstersen blenderdan kısa geçir.")] },

  { n:tx("Yayla çorbası"), cu:"tr", srv:4, t:"30 dk", i:"dairy",
    ing:[["yogurt",400],["pirinc",80],["yumurta",50],["tereyagi",25]],
    steps:[tx("Pirinci 1 litre suda yumuşayana kadar haşla."),tx("Yoğurt, yumurta ve bir kaşık unu çırp."),tx("Terbiyeyi sıcak sudan azar azar ekleyerek ılıştır."),tx("Çorbaya yavaşça karıştırarak ekle, kaynamaya bırakma."),tx("Tereyağında naneyi yakıp üzerine gezdir.")] },

  { n:tx("Tavuk şiş"), cu:"tr", srv:4, t:"30 dk + marine", i:"poultry",
    ing:[["tavuk",600],["yogurt",100],["kirmizibiber",150],["zeytinyagi",25]],
    steps:[tx("Tavuğu kuşbaşı doğra."),tx("Yoğurt, zeytinyağı, salça ve baharatlarla harmanla."),tx("En az 2 saat, tercihen bir gece buzdolabında beklet."),tx("Şişlere biberle dönüşümlü diz."),tx("Izgarada her yüzü 4-5 dakika pişir.")] },

  { n:tx("Zeytinyağlı yaprak sarma"), cu:"tr", srv:6, t:"1 sa 15 dk", i:"grain",
    ing:[["pirinc",250],["sogan",150],["domates",80],["zeytinyagi",70]],
    steps:[tx("Soğanı zeytinyağında kavur, pirinci ekleyip çevir."),tx("Domates, kuş üzümü, dolmalık fıstık ve baharatları karıştır."),tx("İç harcı ılıt."),tx("Salamura asma yapraklarını tek tek sar."),tx("Tencereye diz, üzerini geçecek kadar su ve limon ekle."),tx("Kısık ateşte 45 dakika pişir, soğuk servis et.")] },

  { n:tx("Etli biber dolma"), cu:"tr", srv:4, t:"1 sa", i:"grain",
    ing:[["kirmizibiber",600],["pirinc",150],["kofte",150],["sogan",80],["zeytinyagi",30]],
    steps:[tx("Biberlerin çekirdeğini temizle."),tx("Kıyma, pirinç, soğan, salça ve baharatları yoğur."),tx("Harcı biberlere üçte iki oranında doldur."),tx("Tencereye diz, yarısına kadar su ekle."),tx("Kısık ateşte 45 dakika pişir.")] },

  { n:tx("Mercimek köftesi"), cu:"tr", srv:6, t:"40 dk", i:"legume",
    ing:[["mercimek",200],["bulgur",150],["sogan",100],["zeytinyagi",40]],
    steps:[tx("Mercimeği iki katı suda yumuşayana kadar haşla."),tx("Sıcakken ince bulguru ekle, kapağı kapatıp 15 dakika demlendir."),tx("Soğanı zeytinyağında kavur, salçayla birlikte harca ekle."),tx("Maydanoz, yeşil soğan ve baharatları karıştır."),tx("Avuçta şekillendirip marul yaprağıyla servis et.")] },

  { n:tx("Fırında tavuk but ve sebze"), srv:4, t:"1 sa", i:"poultry",
    ing:[["tavukbut",700],["patates",400],["havuc",200],["zeytinyagi",30]],
    steps:[tx("Butları zeytinyağı, salça, sarımsak ve baharatla ovala."),tx("Patates ve havucu iri doğra, tepsiye yay."),tx("Butları üzerine yerleştir, yarım bardak su ekle."),tx("Folyoyla kapatıp 190°C'de 40 dakika pişir."),tx("Folyoyu açıp 15 dakika daha kızart.")] },

  { n:tx("Sebze türlüsü"), cu:"tr", srv:4, t:"50 dk", i:"veg",
    ing:[["patlican",250],["kabak",250],["kirmizibiber",150],["patates",200],["domates",150],["zeytinyagi",40]],
    steps:[tx("Bütün sebzeleri iri kuşbaşı doğra."),tx("Soğanı zeytinyağında kavur, salçayı ekle."),tx("Sert sebzelerden başlayarak sırayla ilave et."),tx("Domatesi ve bir bardak sıcak suyu ekle."),tx("Kapağı kapalı, kısık ateşte 35 dakika pişir.")] },

  { n:tx("Zeytinyağlı pırasa"), cu:"tr", srv:4, t:"40 dk", i:"veg",
    ing:[["pirasacig",700],["havuc",150],["pirinc",50],["zeytinyagi",50]],
    steps:[tx("Pırasaları halka, havucu yarım ay doğra."),tx("Zeytinyağında 5 dakika soteleyip pirinci ekle."),tx("Bir çay bardağı su, tuz ve şeker ilave et."),tx("Kısık ateşte 25 dakika pişir."),tx("Limon sıkarak ılık veya soğuk servis et.")] },

  { n:tx("Yumurtalı ıspanak"), srv:3, t:"25 dk", i:"veg",
    ing:[["ispanak",500],["yumurta",150],["sogan",80],["zeytinyagi",25]],
    steps:[tx("Ispanağı yıka, iri doğra."),tx("Soğanı zeytinyağında kavur."),tx("Ispanağı ekleyip suyunu salıp çekene kadar pişir."),tx("Ortalarını açıp yumurtaları kır."),tx("Kapağı kapatıp yumurtalar tutana kadar pişir, süzme yoğurtla servis et.")] },

  { n:tx("Barbunya pilaki"), cu:"tr", srv:4, t:"1 sa 20 dk", i:"legume",
    ing:[["barbunya",250],["sogan",100],["havuc",150],["patates",150],["zeytinyagi",50]],
    steps:[tx("Barbunyayı bir gece ıslatıp haşla."),tx("Soğan, havuç ve patatesi zeytinyağında kavur."),tx("Domates salçası ve şeker ekle."),tx("Barbunyayı ve haşlama suyunu ilave et."),tx("Kısık ateşte 40 dakika pişir, soğuk servis et.")] },

  { n:tx("Hamsi tava"), cu:"tr", srv:4, t:"25 dk", i:"fish",
    ing:[["hamsi",700],["un",80],["zeytinyagi",40]],
    steps:[tx("Hamsileri temizle, tuzlu suda 10 dakika beklet."),tx("Süzüp mısır unu veya buğday ununa bula."),tx("Kızgın yağda her yüzü 2-3 dakika kızart."),tx("Kağıt havluda fazla yağını al."),tx("Roka, limon ve soğan salatasıyla servis et.")] },

  { n:tx("Balık buğulama"), cu:"tr", srv:4, t:"40 dk", i:"fish",
    ing:[["levrek",700],["domates",200],["kirmizibiber",100],["sogan",100],["zeytinyagi",30]],
    steps:[tx("Balıkları temizleyip tuz ve limonla ovala."),tx("Sebzeleri halka doğra, tepsiye yay."),tx("Balıkları üzerine yerleştir."),tx("Zeytinyağı, defne yaprağı ve yarım bardak su ekle."),tx("190°C fırında 25-30 dakika pişir.")] },

  { n:tx("Etli patates yemeği"), cu:"tr", srv:4, t:"50 dk", i:"meat",
    ing:[["patates",600],["kofte",250],["sogan",100],["domates",100],["zeytinyagi",25]],
    steps:[tx("Kuşbaşı eti mühürle, soğanı ekleyip kavur."),tx("Salça ve domatesi ilave et."),tx("İri doğranmış patatesleri ekle, üzerini geçecek kadar sıcak su koy."),tx("Kısık ateşte 35 dakika pişir.")] },

  { n:tx("Nohut salatası"), cu:"tr", srv:4, t:"15 dk", i:"legume",
    ing:[["nohut",200],["domates",150],["sogan",80],["marul",100],["zeytinyagi",40]],
    steps:[tx("Haşlanmış nohutu süz."),tx("Domates, soğan ve maydanozu ince doğra."),tx("Zeytinyağı, limon ve nar ekşisiyle sos hazırla."),tx("Karıştırıp 15 dakika buzdolabında beklet.")] },

  { n:tx("Piyaz"), cu:"tr", srv:4, t:"20 dk", i:"legume",
    ing:[["kurufasulye",250],["yumurta",100],["domates",120],["sogan",100],["zeytinyagi",40]],
    steps:[tx("Fasulyeyi haşlayıp süz, ılıt."),tx("Yumurtaları haşlayıp dilimle."),tx("Soğanı ince doğrayıp sumakla ovala."),tx("Tahin, limon ve zeytinyağını çırparak sos yap."),tx("Hepsini tabakta birleştir.")] },

  { n:tx("Cacık"), cu:"tr", srv:4, t:"10 dk", i:"dairy",
    ing:[["yogurt",500],["salatalik",300],["zeytinyagi",15]],
    steps:[tx("Salatalığı rendele veya küp doğra."),tx("Yoğurdu bir miktar soğuk suyla açarak çırp."),tx("Sarımsak, tuz ve kuru nane ekle."),tx("Üzerine zeytinyağı gezdirip soğuk servis et.")] },

  { n:tx("Sütlaç"), cu:"tr", srv:6, t:"45 dk", i:"dairy",
    ing:[["sut",1000],["pirinc",100],["seker",150]],
    steps:[tx("Pirinci az suda yumuşayana kadar haşla."),tx("Sütü ekleyip karıştırarak kaynat."),tx("Şekeri ilave et, kıvam alana kadar 15 dakika pişir."),tx("Kaselere paylaştır, fırında üstünü kızartabilirsin."),tx("Soğuduktan sonra tarçınla servis et.")] }
];

const MEAL_SETS = [
  { name:tx("Klasik"), meals:[
    { name:tx("Kahvaltı"), share:.25, p:"yumurta", c:"ekmek", f:"zeytinyagi", extra:tx("Domates, salatalık, yeşillik") },
    { name:tx("Öğle"),     share:.30, p:"tavuk",   c:"pirinc", f:"zeytinyagi", extra:tx("Mevsim salata") },
    { name:tx("Ara öğün"), share:.15, p:"suzme",   c:"muz",    f:"badem" },
    { name:tx("Akşam"),    share:.30, p:"ton",     c:"patates", f:"avokado", extra:tx("Buharda brokoli") }
  ]},
  { name:tx("Ev yemeği"), cu:"tr", meals:[
    { name:tx("Kahvaltı"), share:.25, p:"lor",    c:"yulaf",   f:"findik", extra:tx("Tarçın, bir avuç yaban mersini") },
    { name:tx("Öğle"),     share:.30, p:"kofte",  c:"bulgur",  f:"zeytinyagi", extra:tx("Cacık") },
    { name:tx("Ara öğün"), share:.15, p:"suzme",  c:"ekmek",   f:"tahin" },
    { name:tx("Akşam"),    share:.30, p:"hindi",  c:"pirinc",  f:"zeytinyagi", extra:tx("Mercimek çorbası, yeşil salata") }
  ]},
  { name:tx("Balık ağırlıklı"), meals:[
    { name:tx("Kahvaltı"), share:.25, p:"yumurta", c:"yulaf",   f:"badem", extra:tx("Yeşillik") },
    { name:tx("Öğle"),     share:.30, p:"somon",   c:"patates", f:"zeytinyagi", extra:tx("Kuşkonmaz veya brokoli") },
    { name:tx("Ara öğün"), share:.15, p:"suzme",   c:"muz",     f:"tahin" },
    { name:tx("Akşam"),    share:.30, p:"hindi",   c:"makarna", f:"zeytinyagi", extra:tx("Közlenmiş sebze") }
  ]},
  { name:tx("Bitkisel ağırlıklı"), cu:"tr", meals:[
    { name:tx("Kahvaltı"), share:.25, p:"suzme", c:"yulaf",   f:"findik", extra:tx("Tarçın, elma") },
    { name:tx("Öğle"),     share:.30, p:"tofu",  c:"bulgur",  f:"zeytinyagi", extra:tx("Roka, limon") },
    { name:tx("Ara öğün"), share:.15, p:"lor",   c:"ekmek",   f:"badem" },
    { name:tx("Akşam"),    share:.30, p:"soya",  c:"patates", f:"tahin", extra:tx("Haşlanmış sebze, mercimek çorbası") }
  ]},
  { name:tx("Yüksek proteinli"), cu:"tr", meals:[
    { name:tx("Kahvaltı"), share:.25, p:"yumurta", c:"yulaf",   f:"badem", extra:tx("Ispanak, domates") },
    { name:tx("Öğle"),     share:.30, p:"tavuk",   c:"bulgur",  f:"zeytinyagi", extra:tx("Çoban salata") },
    { name:tx("Ara öğün"), share:.15, p:"whey",    c:"muz",     f:"fistikezmesi" },
    { name:tx("Akşam"),    share:.30, p:"kofte",   c:"patates", f:"avokado", extra:tx("Izgara sebze") }
  ]},
  { name:tx("Türk kahvaltısı ağırlıklı"), cu:"tr", meals:[
    { name:tx("Kahvaltı"), share:.25, p:"beyazpeynir", c:"ekmek",   f:"zeytin", extra:tx("Domates, salatalık, yeşil biber") },
    { name:tx("Öğle"),     share:.30, p:"hindi",       c:"bulgur",  f:"zeytinyagi", extra:tx("Cacık") },
    { name:tx("Ara öğün"), share:.15, p:"suzme",       c:"incir",   f:"ceviz" },
    { name:tx("Akşam"),    share:.30, p:"tavukbut",    c:"pirinc",  f:"zeytinyagi", extra:tx("Mevsim salata") }
  ]},
  { name:tx("Bütçe dostu"), cu:"tr", meals:[
    { name:tx("Kahvaltı"), share:.25, p:"yumurta",  c:"ekmek",   f:"zeytin", extra:tx("Domates, çay") },
    { name:tx("Öğle"),     share:.30, p:"mercimek", c:"patates", f:"zeytinyagi", extra:tx("Turşu, yeşillik") },
    { name:tx("Ara öğün"), share:.15, p:"yogurt",   c:"muz",     f:"tahin" },
    { name:tx("Akşam"),    share:.30, p:"tavukbut", c:"bulgur",  f:"zeytinyagi", extra:tx("Soğan salatası") }
  ]},
  { name:tx("Deniz ürünleri"), cu:"tr", meals:[
    { name:tx("Kahvaltı"), share:.25, p:"yumurta", c:"yulaf",   f:"ceviz", extra:tx("Yeşillik") },
    { name:tx("Öğle"),     share:.30, p:"hamsi",   c:"patates", f:"zeytinyagi", extra:tx("Roka, limon, soğan") },
    { name:tx("Ara öğün"), share:.15, p:"suzme",   c:"elma",    f:"badem" },
    { name:tx("Akşam"),    share:.30, p:"karides", c:"pirinc",  f:"zeytinyagi", extra:tx("Buharda brokoli") }
  ]},
  { name:tx("Vejetaryen"), cu:"tr", meals:[
    { name:tx("Kahvaltı"), share:.25, p:"lor",   c:"yulaf",   f:"badem", extra:tx("Yaban mersini") },
    { name:tx("Öğle"),     share:.30, p:"soya",  c:"kinoa",   f:"zeytinyagi", extra:tx("Ispanak salatası") },
    { name:tx("Ara öğün"), share:.15, p:"suzme", c:"elma",    f:"ceviz" },
    { name:tx("Akşam"),    share:.30, p:"tofu",  c:"patates", f:"tahin", extra:tx("Fırında sebze") }
  ]},
  { name:tx("Hazırlığı kolay"), meals:[
    { name:tx("Kahvaltı"), share:.25, p:"suzme", c:"granola", f:"badem", extra:tx("Muz dilimleri") },
    { name:tx("Öğle"),     share:.30, p:"ton",   c:"makarna", f:"zeytinyagi", extra:tx("Konserve mısır, marul") },
    { name:tx("Ara öğün"), share:.15, p:"whey",  c:"muz",     f:"fistikezmesi" },
    { name:tx("Akşam"),    share:.30, p:"tavuk", c:"haslanmispatates", f:"avokado", extra:tx("Hazır salata") }
  ]},
  { name:tx("Şarküteri kahvaltısı"), cu:"tr", meals:[
    { name:tx("Kahvaltı"), share:.25, p:"beyazpeynir", c:"ekmek",  f:"yesilzeytin", extra:tx("Domates, salatalık, yeşil biber") },
    { name:tx("Öğle"),     share:.30, p:"fumehindi",   c:"bulgur", f:"zeytinyagi", extra:tx("Roka salatası") },
    { name:tx("Ara öğün"), share:.15, p:"suzme",       c:"kuruincir", f:"badem" },
    { name:tx("Akşam"),    share:.30, p:"tavuk",       c:"pirinc", f:"zeytinyagi", extra:tx("Közlenmiş sebze") }
  ]},
  { name:tx("Hafif ve sebzeli"), meals:[
    { name:tx("Kahvaltı"), share:.25, p:"omlet", c:"cavdarekmek", f:"avokado", extra:tx("Ispanak, domates") },
    { name:tx("Öğle"),     share:.30, p:"tavuk", c:"tatlipatates", f:"zeytinyagi", extra:tx("Brokoli, kuşkonmaz") },
    { name:tx("Ara öğün"), share:.15, p:"suzme", c:"elma",  f:"ceviz" },
    { name:tx("Akşam"),    share:.30, p:"ton",   c:"haslanmispatates", f:"zeytinyagi", extra:tx("Karnabahar, roka") }
  ]},
  { name:tx("Yüksek lifli"), cu:"tr", meals:[
    { name:tx("Kahvaltı"), share:.25, p:"lor",   c:"yulaf",       f:"badem", extra:tx("Ahududu, tarçın") },
    { name:tx("Öğle"),     share:.30, p:"mercimek", c:"bulgur",   f:"zeytinyagi", extra:tx("Yeşil salata") },
    { name:tx("Ara öğün"), share:.15, p:"suzme", c:"armut",       f:"fistikezmesi" },
    { name:tx("Akşam"),    share:.30, p:"tavuk", c:"kurufasulye", f:"zeytinyagi", extra:tx("Turşu, maydanoz") }
  ]},
  { name:tx("Ofiste kolay"), cu:"tr", meals:[
    { name:tx("Kahvaltı"), share:.25, p:"suzme",      c:"musli",   f:"findik", extra:tx("Kuru üzüm") },
    { name:tx("Öğle"),     share:.30, p:"ton",        c:"makarna", f:"zeytinyagi", extra:tx("Marul, mısır") },
    { name:tx("Ara öğün"), share:.15, p:"proteinbar", c:"muz",     f:"badem" },
    { name:tx("Akşam"),    share:.30, p:"firintavuk", c:"haslanmispatates", f:"avokado", extra:tx("Çoban salata") }
  ]},
  { name:tx("Kırmızı et ağırlıklı"), cu:"tr", meals:[
    { name:tx("Kahvaltı"), share:.25, p:"yumurta", c:"ekmek",   f:"tereyagi", extra:tx("Domates, zeytin") },
    { name:tx("Öğle"),     share:.30, p:"biftek",  c:"pirinc",  f:"zeytinyagi", extra:tx("Közlenmiş biber") },
    { name:tx("Ara öğün"), share:.15, p:"suzme",   c:"hurma",   f:"ceviz" },
    { name:tx("Akşam"),    share:.30, p:"kofte",   c:"patates", f:"zeytinyagi", extra:tx("Ezme, yeşillik") }
  ]},
  { name:tx("Akdeniz"), cu:"tr", meals:[
    { name:tx("Kahvaltı"), share:.25, p:"beyazpeynir", c:"cavdarekmek", f:"zeytin", extra:tx("Domates, maydanoz") },
    { name:tx("Öğle"),     share:.30, p:"somon",       c:"kinoa",  f:"zeytinyagi", extra:tx("Kuşkonmaz, limon") },
    { name:tx("Ara öğün"), share:.15, p:"yogurt",      c:"nar",    f:"badem" },
    { name:tx("Akşam"),    share:.30, p:"karides",     c:"bulgur", f:"zeytinyagi", extra:tx("Roka, kiraz domates") }
  ]},
  { name:tx("Vegan ağırlıklı"), cu:"tr", meals:[
    { name:tx("Kahvaltı"), share:.25, p:"tofu",     c:"yulaf",   f:"findik", extra:tx("Muz, tarçın") },
    { name:tx("Öğle"),     share:.30, p:"soya",     c:"kinoa",   f:"tahin", extra:tx("Roka, limon") },
    { name:tx("Ara öğün"), share:.15, p:"leblebi",  c:"muz",     f:"yerfistigi" },
    { name:tx("Akşam"),    share:.30, p:"mercimek", c:"patates", f:"zeytinyagi", extra:tx("Haşlanmış sebze") }
  ]},
  { name:tx("Hacim dönemi"), cu:"tr", meals:[
    { name:tx("Kahvaltı"), share:.25, p:"yumurta", c:"musli",   f:"fistikezmesi", extra:tx("Süt, muz") },
    { name:tx("Öğle"),     share:.30, p:"kofte",   c:"makarna", f:"zeytinyagi", extra:tx("Ayran") },
    { name:tx("Ara öğün"), share:.15, p:"whey",    c:"hurma",   f:"findik" },
    { name:tx("Akşam"),    share:.30, p:"somon",   c:"pirinc",  f:"avokado", extra:tx("Fırında sebze") }
  ]}
];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function portion(food, grams){
  const g = Math.round(grams / 5) * 5;
  if (food.unit) {
    const units = Math.max(1, Math.round(g / food.unit));
    return { text:`${food.n} — ${units} ${food.unitName}`, g: units * food.unit };
  }
  /* Gramaj değişmez (hedef tutturma bozulmasın); yakın bir porsiyon katı
     varsa yanına "≈ 2 dilim" diye yaklaşık karşılığı yazılır. */
  /* Birincil ölçüde yarımlar da olur ("≈ 0,5 kase"); ikincil ölçüde yalnız
     tam katlar ("≈ 2 tatlı kaşığı"), "≈ 0,5 bütün göğüs" gibi tuhaflıklar olmasın. */
  const P = porsOf(food);
  for (let i = 0; i < P.length; i++){
    const x = P[i], u = g / x.g;
    const r = i === 0 ? Math.round(u * 2) / 2 : Math.round(u);
    if (r >= (i === 0 ? 0.5 : 1) && r <= 12 && Math.abs(u - r) / r < 0.15)
      return { text:`${food.n} — ${g} g (≈ ${nfmt(r)} ${x.n})`, g };
  }
  return { text:`${food.n} — ${g} g`, g };
}

/* Kullanıcının günlüğüne girdiği besinlerin kaç kez geçtiği. */
function foodUsage(){
  const u = {};
  for (const k of Object.keys(state.days))
    for (const it of (state.days[k].log || [])) if (it.k) u[it.k] = (u[it.k] || 0) + 1;
  return u;
}

/* Bir besinin hangi rolü üstlenebileceği: kalorisinin çoğu hangi makrodan geliyor? */
let ROLE_CACHE = null;
function roleCandidates(role){
  if (!ROLE_CACHE){
    ROLE_CACHE = { p:[], c:[], f:[] };
    for (const [k,f] of Object.entries(FOODS)){
      const kcal = f.p*4 + f.c*4 + f.f*9;
      if (kcal < 40) continue;
      /* Eşik 0.25: baklagiller kendi karbonhidratını taşısa da protein kaynağıdır. */
      if (f.p >= 15 && f.p*4/kcal >= 0.25) ROLE_CACHE.p.push(k);
      if (f.c >= 15 && f.c*4/kcal >= 0.55) ROLE_CACHE.c.push(k);
      if (f.f >= 35 && f.f*9/kcal >= 0.60) ROLE_CACHE.f.push(k);
    }
  }
  return ROLE_CACHE[role];
}

/* Bir öğün gözü için besin seç: dışlanmışsa değiştir, "benim besinlerim" açıksa
   aynı rolü oynayan ve en çok yediğin besinle değiştir. */
function resolveSlot(orig, role, opts, used){
  const free = k => !opts.exclude.has(k) && !used.has(k) && FOODS[k];
  const byUse = list => list.slice().sort((a,b) => (opts.usage[b]||0) - (opts.usage[a]||0));

  if (opts.useMine){
    const mine = byUse(roleCandidates(role).filter(k => free(k) && (opts.usage[k]||0) >= 2));
    if (mine.length) return mine[0];
  }
  if (free(orig)) return orig;
  let alt = byUse(roleCandidates(role).filter(k => free(k) && !NO_SUGGEST.has(k)));
  if (!alt.length) alt = byUse(roleCandidates(role).filter(k => !opts.exclude.has(k) && FOODS[k]));
  /* Uygun hiçbir şey yoksa yasak besini geçirmektense boş dön. */
  return alt.length ? alt[0] : null;
}

/* Kullanıcının yediklerine en yakın kombinasyonlar başa gelsin. */
/* Hazır menüler: yalnızca seçili mutfağınkiler, en çok yenen besinleri içeren önce. */
function setOrder(usage, cuisine){
  return MEAL_SETS.map((s,i) => [i, s.meals.reduce((a,m) =>
      a + (usage[m.p]||0) + (usage[m.c]||0) + (usage[m.f]||0), 0)])
    .filter(([i]) => cuisineOk(MEAL_SETS[i], cuisine))
    .sort((a,b) => b[1] - a[1])
    .map(x => x[0]);
}

/* Öğünler tek kaynaktan gelir: kullanıcı ekleyip silebilir, hem günlük
   hem öneri motoru aynı listeyi kullanır. h = tipik saat (sıralama ve
   "hangi öğün" varsayılanı için), cat = öneri motorunun besin kategorileri. */
const DEFAULT_MEALS = [
  { id:"kahvalti", name:tx("Kahvaltı"),     w:30, h:8,  cat:"kahvalti" },
  { id:"ara",      name:tx("Ara öğün"),     w:20, h:15, cat:"ara" },
  { id:"aksam",    name:tx("Akşam öğünü"),  w:50, h:20, cat:"aksam" }
];
/* Yeni öğün eklerken sunulan zaman dilimleri */
const MEAL_TIMES = [
  { key:"sabah",  label:tx("Sabah"),  h:8,  cat:"kahvalti", w:30 },
  { key:"oglen",  label:tx("Öğlen"),  h:13, cat:"ogle",     w:40 },
  { key:"ikindi", label:tx("İkindi"), h:16, cat:"ara",      w:15 },
  { key:"aksam",  label:tx("Akşam"),  h:20, cat:"aksam",    w:40 },
  { key:"gece",   label:tx("Gece"),   h:23, cat:"ara",      w:15 }
];
const LEGACY_MEALS = { ogle:{name:tx("Öğle"), w:40, h:13, cat:"ogle"} };

function userMeals(){
  const p = mealPrefs();
  if (!Array.isArray(p.meals) || !p.meals.length) p.meals = DEFAULT_MEALS.map(m => ({...m}));
  return p.meals.slice().sort((a,b) => (a.h ?? 12) - (b.h ?? 12));
}
/* Öğün adı kayıtta oluşturulduğu dilde durur. Hazır adlar (Kahvaltı, Öğle...) ekranda
   çevrilir; kullanıcının kendi yazdığı ad olduğu gibi kalır. */
const mealName = m => tx(m.name);
function slotList(){ return userMeals().map(m => [m.id, mealName(m)]); }
function slotLabel(id){
  const m = userMeals().find(x => x.id === id);
  return m ? mealName(m) : (LEGACY_MEALS[id] ? LEGACY_MEALS[id].name : tx("Diğer"));
}
function mealShares(list){
  const t = list.reduce((a,m) => a + (m.w || 1), 0) || 1;
  return list.map(m => (m.w || 1) / t);
}

/* Eski kayıtlarda geçen ama listede olmayan öğünleri geri kazandırır,
   böylece "Öğle" gibi kalemler ve onlara bağlı girişler kaybolmaz. */
function migrateMeals(){
  const p = mealPrefs();
  if (!Array.isArray(p.meals) || !p.meals.length) p.meals = DEFAULT_MEALS.map(m => ({...m}));
  const have = new Set(p.meals.map(m => m.id));
  const seen = new Set();
  for (const k of Object.keys(state.days || {}))
    for (const it of (state.days[k].log || [])) if (it.slot) seen.add(it.slot);
  for (const sId of Object.keys(p.fixed || {})) if ((p.fixed[sId] || []).length) seen.add(sId);
  let added = false;
  for (const sId of seen) if (!have.has(sId)){
    const L = LEGACY_MEALS[sId];
    p.meals.push(L ? { id:sId, ...L } : { id:sId, name:tx("Diğer öğün"), w:20, h:12, cat:"ogle" });
    have.add(sId); added = true;
  }
  return added;
}

function mealPrefs(){
  const p = state.mealPrefs || (state.mealPrefs = { exclude:[], useMine:false, fixed:{} });
  if (!Array.isArray(p.exclude)) p.exclude = [];
  if (!p.fixed || typeof p.fixed !== "object") p.fixed = {};
  if (!p.diet) p.diet = "hepsi";
  if (!Array.isArray(p.meals) || !p.meals.length) p.meals = DEFAULT_MEALS.map(m => ({...m}));
  return p;
}

function fixedOf(slot){
  return (mealPrefs().fixed[slot] || []).filter(x => FOODS[x.k] || (state.customFoods||{})[x.k]);
}

function foodOf(k){ return FOODS[k] || (state.customFoods||{})[k]; }

/* Beslenme türleri. Bir besinin uygunluğu çoğunlukla simgesinden çıkar;
   simgesi ele vermeyen yemekler (içinde kıyma olan karnıyarık gibi) elle listelenir. */
const DIETS = { hepsi:tx("Hepsi"), vejetaryen:tx("Vejetaryen"), vegan:tx("Vegan"),
  pesketaryen:tx("Pesketaryen"), glutensiz:tx("Glutensiz"), laktozsuz:tx("Laktozsuz"),
  helal:tx("Helal"), koser:tx("Koşer") };
/* Helal ve koşer seçenekleri İngilizce kullananlara gösterilir; seçilmişse her dilde görünür. */
const INTL_DIETS = ["helal", "koser"];
const dietOptions = cur => Object.entries(DIETS).filter(([k]) =>
  !INTL_DIETS.includes(k) || LANG !== "tr" || cur === k);

/* ---- mutfak ----
   Öneriler, hazır menüler ve tarif listesi seçilen mutfaktan gelir; arama her zaman
   bütün besin ve tarifleri kapsar. Seçim yoksa dilden: Türkçe → Türk, diğerleri → uluslararası.
   Besin ve tariflerde cu:"tr" Türk mutfağına, cu:"intl" uluslararası mutfağa özgü demektir;
   etiketsizler iki mutfakta da önerilir. */
const CUISINES = { tr:tx("Türk mutfağı"), intl:tx("Uluslararası") };
const currentCuisine = () => {
  const c = state && state.mealPrefs && state.mealPrefs.cuisine;
  return CUISINES[c] ? c : (LANG === "tr" ? "tr" : "intl");
};
const cuisineOk = (item, cu) => !item.cu || item.cu === (cu || currentCuisine());

/* Türk mutfağına özgü besinler: uluslararası mutfakta önerilmez, aramada bulunur. */
const TR_FOODS = ["doner","sucuk","pastirma","kokorec","ayran","beyazpeynir","kasar","lor","cacik","haydari",
  "piyaz","bulgurpilav","simit","tost","pogaca","acma","kumpir","ispanakyemek","pirasa","turlu",
  "zeytinyaglifasulye","cobansalata","ezme","mucver","salgam","boza","salep","turkkahvesi","menemen","sucuklu",
  "karniyarik","imambayildi","hunkarbegendi","kurufasulyeyemek","etlinohut","manti","iclikofte","cigkofte","kisir",
  "yapraksarma","lahanasarma","biberdolma","suborek","sigaraboregi","kiymaliborek","gozleme","kiymalipide",
  "kasarlipide","lahmacun","iskender","adanakebap","tavuksis","izgarakofte","tavuksote","tavukdurum","balikekmek",
  "midyedolma","mercimekcorba","ezogelin","yaylacorba","tarhana","sutlac","kazandibi","baklava","kunefe","kadayif",
  "revani","asure","tahinhelva","lokum","kavurma","tulum","orgupeyniri","dilpeyniri","mihalic","ezine","cokelek",
  "lightbeyaz","lightkasar","pekmez","kaymak","karnabaharyemek","bamya","enginar","kabakdolma","etlilahana","guvec",
  "tantuni","cigborek","iskembe","leblebi","hindisucuk","musakka","yufka","sehriye"];
for (const k of TR_FOODS) if (FOODS[k]) FOODS[k].cu = "tr";

/* Koşer: kabuklu deniz ürünleri ve aynı tabakta et ile süt ürünü olan yemekler. */
const SHELLFISH = new Set(["karides","midyedolma"]);
const MEAT_DAIRY = new Set(["iskender","hunkarbegendi","manti","kumpir"]);

/* Simgesi et değil ama içinde et var. */
const HAS_MEAT = new Set(["karniyarik","kurufasulyeyemek","etlinohut","etlilahana","manti",
  "iclikofte","kiymalipide","kiymaliborek","tantuni","lahmacun","musakka","cigborek",
  "kumpir","sucuklu","tavukdurum","hunkarbegendi"]);

/* Simgesi süt/yumurta değil ama içinde var. */
const HAS_DAIRY_EGG = new Set(["tereyagi","tost","kasarlipide","suborek","sigaraboregi",
  "gozleme","kunefe","mucver","tarhana","kakaolukrem","sutlucikolata","proteinbar",
  "pogaca","acma","baklava","kadayif","revani","bal","yulafbar","pizza","manti",
  "iskender","sinitzel","hunkarbegendi"]);

/* Laktoz içeren, süt simgesi taşımayanlar. */
const HAS_LACTOSE = new Set(["tereyagi","tost","kasarlipide","suborek","sigaraboregi",
  "gozleme","kunefe","mucver","tarhana","kakaolukrem","sutlucikolata","proteinbar",
  "manti","iskender","hunkarbegendi"]);

const HAS_GLUTEN = new Set(["ekmek","beyazekmek","cavdarekmek","kepekliekmek","simit","yufka",
  "tost","pogaca","acma","makarna","makarnapis","kuskus","bulgur","bulgurpilav","un","sehriye",
  "kisir","manti","iclikofte","cigkofte","lahmacun","kiymalipide","kasarlipide","pizza",
  "suborek","sigaraboregi","kiymaliborek","gozleme","cigborek","tantuni","tavukdurum",
  "baklava","kunefe","kadayif","revani","biskuvi","kraker","gevrek","granola","musli",
  "yulafbar","sinitzel","soslumakarna","seitan","tarhana","galeta","boza","asure","iskender"]);

function foodAllowed(k, diet){
  const f = FOODS[k];
  if (!f || !diet || diet === "hepsi") return true;
  const meat = f.i === "meat" || f.i === "poultry" || HAS_MEAT.has(k);
  const fish = f.i === "fish";
  const dairyEgg = f.i === "dairy" || f.i === "egg" || HAS_DAIRY_EGG.has(k);
  switch (diet){
    case "vegan":       return !meat && !fish && !dairyEgg;
    case "vejetaryen":  return !meat && !fish;
    case "pesketaryen": return !meat;
    case "glutensiz":   return !HAS_GLUTEN.has(k);
    case "laktozsuz":   return !(f.i === "dairy" || HAS_LACTOSE.has(k));
    /* Etin kesim şekli bilinemez; helal ve koşerde süzülen yalnızca içeriktir. */
    case "helal":       return !f.pork;
    case "koser":       return !f.pork && !SHELLFISH.has(k) && !MEAT_DAIRY.has(k);
    default: return true;
  }
}

function currentDiet(){ return mealPrefs().diet || "hepsi"; }

/* Koşer kuralı için: et içeren ve süt ürünü içeren besinler (yumurta ve balık nötrdür). */
const hasMeatK = k => { const f = FOODS[k]; return !!f && (f.i === "meat" || f.i === "poultry" || HAS_MEAT.has(k)); };
const hasDairyK = k => { const f = FOODS[k]; return !!f && (f.i === "dairy" || HAS_LACTOSE.has(k)); };
/* Bir tarif diyete uyuyor mu: her malzeme uygun olmalı; koşerde et ve süt bir arada olmaz. */
function recipeAllowed(r, diet){
  if (!r.ing.every(([k]) => foodAllowed(k, diet))) return false;
  if (diet === "koser" && r.ing.some(([k]) => hasMeatK(k)) && r.ing.some(([k]) => hasDairyK(k))) return false;
  return true;
}


function solveTrio(P, C, F, tp, tc, tf, tk){
  let gp = 0, gc = 0, gf = 0;
  const capP = P.unit ? 250 : 400;
  const capC = C.c < 25 ? 500 : 350;
  /* Üç kaynak da üç makroya birden katkı verdiği için tek geçişte çözülmüyor. */
  for (let i = 0; i < 8; i++){
    gp = clamp((tp - gc*C.p/100 - gf*F.p/100) / (P.p/100), 0, capP);
    gc = clamp((tc - gp*P.c/100 - gf*F.c/100) / (C.c/100), 0, capC);
    gf = clamp((tf - gp*P.f/100 - gc*C.f/100) / (F.f/100), 0, 90);
  }
  const kcalOf = (fo,g) => (fo.p*4 + fo.c*4 + fo.f*9) * g/100;
  let excess = kcalOf(P,gp) + kcalOf(C,gc) + kcalOf(F,gf) - tk;
  /* Fazlayı önce karbonhidrattan, sonra yağdan, en son proteinden (en fazla %20) kıs. */
  if (excess > 0 && gc > 0){ const per=(C.p*4+C.c*4+C.f*9)/100; const cut=Math.min(gc, excess/per); gc-=cut; excess-=cut*per; }
  if (excess > 0 && gf > 0){ const per=(F.p*4+F.c*4+F.f*9)/100; const cut=Math.min(gf, excess/per); gf-=cut; excess-=cut*per; }
  if (excess > 0 && gp > 0){ const per=(P.p*4+P.c*4+P.f*9)/100; gp-=Math.min(gp*0.2, excess/per); }

  const sum = { p:0, c:0, f:0, lif:0 };
  for (const [fo,g] of [[P,gp],[C,gc],[F,gf]]){
    sum.p += fo.p*g/100; sum.c += fo.c*g/100; sum.f += fo.f*g/100; sum.lif += (fo.lif||0)*g/100;
  }
  sum.kcal = sum.p*4 + sum.c*4 + sum.f*9;
  return { gp, gc, gf, sum };
}

/* Bir öğünde tek karbonhidrat kaynağından en fazla kaç gram önerilir.
   Kuru tahıl ve makarna 120 g, ekmek türleri 130 g (yaklaşık 4 dilim),
   patates ve meyve gibi sulu kaynaklar 350 g. Çok yüksek kalorili öğünlerde
   tavan öğünün büyüklüğüyle orantılı esner. */
function carbCap(food, scale){
  const base = food.c >= 60 ? 120 : food.c >= 35 ? 130 : 350;
  return base * (scale || 1);
}
/* Ana karbonhidrat tavanı aşınca öğüne eklenen yan karbonhidrat, sırayla denenir:
   kahvaltı ve ara öğünde meyve, ana öğünlerde ekmek. */
const SIDE_CARBS = {
  kahvalti:["muz","elma","ekmek"], ara:["muz","elma","ekmek"],
  ogle:["ekmek","patates","muz"], aksam:["ekmek","patates","muz"]
};

/* Öğüne yakışmayan eşleşmeler çıkmasın diye her öğünün kabul ettiği kategoriler. */
const SIDES = [tx("Yanına mevsim salata"), tx("Yanına domates, salatalık, yeşillik"),
  tx("Yanına turşu ve maydanoz"), tx("Yanına buharda brokoli veya kabak")];
const SIDES_INTL = [tx("Yanına mevsim salata"), tx("Yanına buharda brokoli veya kabak"),
  tx("Yanına fırında sebze"), tx("Yanına karışık yeşillik ve limon")];

const SLOT_CATS = {
  kahvalti:{ p:["kahvaltilik","sut","sarkuteri","baklagil"], c:["tahil","meyve","kahvaltilik"], f:["kuruyemis","yag","meyve"] },
  ogle:    { p:["et","balik","baklagil","sut","yemek"], c:["tahil","sebze","baklagil"], f:["yag","kuruyemis","meyve"] },
  ara:     { p:["sut","ara","kuruyemis","kahvaltilik","baklagil"], c:["meyve","tahil","ara"], f:["kuruyemis","meyve"] },
  aksam:   { p:["et","balik","baklagil","yemek","sut"], c:["tahil","sebze","baklagil"], f:["yag","kuruyemis","meyve"] }
};

/* Tatlı, cips, gazlı içecek gibi kalemler otomatik öneriye girmez. */
const NO_SUGGEST = new Set(["baklava","kunefe","kadayif","revani","lokum","tahinhelva","asure",
  "sutlucikolata","bitter","dondurma","kazandibi","sutlac","cips","kola","meyvesuyu","kraker",
  "biskuvi","seker","un","kakaolukrem","recel","bal","pekmez","salep","boza","salgam","cay",
  "turkkahvesi","sosis","sucuk","patateskizartma","aycicekyagi","kaymak","krempeynir","gevrek",
  "galeta","proteinbar","yulafbar","whey",
  "wheyizolat","kazein","gainer","bitkiselprotein","kolajen","kreatin","maltodekstrin",
  "proteinpancake","proteinpuding","proteinsut","proteinshake","proteingofret","proteinkurabiye",
  "proteincips","enerjijeli","izotonik","enerjibar","macarsalam","kuflupeynir","zeytinezmesi","kurudomates",
  /* tek başına yenmeyen malzemeler */
  "pirincunu","nohutunu","sehriye","polenta","yufka","sarimsak","kestane",
  /* öğünün yağını tek başına taşıyamayacak tohumlar ve yağlar */
  "susam","ketentohumu","hindistancevizi","hindistancevizyagi"]);

/* Kahvaltı ve ara öğün hafif öğünlerdir: pişirilip yemek olarak yenen tahıllar
   ve kuru baklagiller bu öğünlere önerilmez. */
const LIGHT_SLOTS = new Set(["kahvalti","ara"]);
const MEAL_GRAINS = new Set(["pirinc","pilav","bulgur","bulgurpilav","makarna","makarnapis",
  "glutensizmakarna","kinoa","kuskus","karabugday","amarant","misir","cigkofte","kisir"]);
const READY_LEGUMES = new Set(["tofu","tempeh"]);
/* Protein yoğunluğu eşiğin altında kalsa da bir öğünün proteinini taşıyabilen besinler. */
const PROTEIN_EXTRA = ["yumurta","suzme"];
/* Kahvaltıya yakışan tahıllar ana öğüne önerilmez. */
const BREAKFAST_GRAINS = new Set(["yulaf","musli","simit","acma"]);
/* Makro uyumu yakınsa o öğünün alışıldık besinleri öne geçer. */
const MAIN_STAPLES = { p:[], c:["pirinc","bulgur","makarna","patates","kinoa"], f:["zeytinyagi","avokado"] };
const STAPLES = {
  kahvalti:{ p:["yumurta","suzme"], c:["ekmek","cavdarekmek","kepekliekmek","beyazekmek","yulaf","musli","simit"], f:[] },
  ara:{ p:["suzme"], c:[], f:[] },
  ogle:MAIN_STAPLES, aksam:MAIN_STAPLES
};
/* Uluslararası mutfakta az bilinen besinler: makro uyumu çok daha iyi değilse seçilmez. */
const INTL_RARE = new Set(["barbunya","borulce","bakla","masfasulye","soyafasulye","soya","amarant","karabugday","kestane","bulgur","yesilmercimek"]);
/* Uluslararası mutfakta alışıldık besinler. */
const MAIN_STAPLES_INTL = { p:[], c:["pirinc","esmerpirinc","makarnabeyaz","patates","tatlipatates","kinoa"], f:["zeytinyagi","avokado"] };
const STAPLES_INTL = {
  kahvalti:{ p:["yumurta","yunanyogurt"], c:["ekmek","eksimaya","ingmuffin","bagel","yulaf","tahilhalka"], f:[] },
  ara:{ p:["yunanyogurt","cottage"], c:[], f:[] },
  ogle:MAIN_STAPLES_INTL, aksam:MAIN_STAPLES_INTL
};

/* Kalan makro hedefine en iyi oturan üçlüyü arar. */
function pickTrio(slot, t, opts, used, variant){
  const cats = SLOT_CATS[slot] || SLOT_CATS.ogle;
  const light = LIGHT_SLOTS.has(slot);
  const staples = (opts.cuisine === "intl" ? STAPLES_INTL[slot] || MAIN_STAPLES_INTL : STAPLES[slot] || MAIN_STAPLES);
  const pool = role => {
    const ok = new Set(cats[role]);
    /* Yumurta ve yoğurt gibi besinler başa gelir: hafif öğünlerin doğal protein kaynakları. */
    const all = role === "p"
      ? PROTEIN_EXTRA.filter(k => FOODS[k]).concat(roleCandidates("p").filter(k => !PROTEIN_EXTRA.includes(k)))
      : roleCandidates(role);
    const fits = k => FOODS[k] && !opts.exclude.has(k) && !NO_SUGGEST.has(k) && ok.has(foodCat(FOODS[k]))
      /* kahvaltıya balık konservesi yakışmıyor */
      && !(slot === "kahvalti" && FOODS[k].i === "fish")
      && !(light && role === "p" && foodCat(FOODS[k]) === "baklagil" && !READY_LEGUMES.has(k))
      && !(light && role === "c" && MEAL_GRAINS.has(k))
      && !(!light && role === "c" && BREAKFAST_GRAINS.has(k))
      && !(k === "glutensizmakarna" && opts.diet !== "glutensiz");
    const list = all.filter(k => fits(k) && !used.has(k));
    list.sort((a,b) => (opts.usage[b]||0) - (opts.usage[a]||0));
    if (!list.length){
      /* Diyet havuzu daraldıysa aynı besinin gün içinde tekrarına izin ver. */
      const relaxed = all.filter(fits);
      if (!relaxed.length) return [];
      relaxed.sort((a,b) => (opts.usage[b]||0) - (opts.usage[a]||0));
      return relaxed.slice(0, 6);
    }
    /* Varyanta göre listeyi kaydır: "başka kombinasyon" gerçekten başkasını versin. */
    const step = role === "p" ? 3 : role === "c" ? 5 : 2;
    const off = (variant * step) % list.length;
    const rot = list.slice(off).concat(list.slice(0, off));
    return rot.slice(0, role === "c" ? 10 : role === "p" ? 8 : 6);
  };

  const ps = pool("p"), cs = pool("c"), fs = pool("f");
  if (!ps.length || !cs.length || !fs.length) return null;

  let best = null;
  for (const pk of ps) for (const ck of cs) for (const fk of fs){
    if (pk === ck || ck === fk || pk === fk) continue;
    /* Protein de karbonhidrat da baklagil olmasın (mercimeğin yanına nohut gibi). */
    if (foodCat(FOODS[pk]) === "baklagil" && foodCat(FOODS[ck]) === "baklagil") continue;
    /* Koşer: aynı öğünde et ve süt ürünü bir arada olmaz. */
    if (opts.diet === "koser" && [pk, ck, fk].some(hasMeatK) && [pk, ck, fk].some(hasDairyK)) continue;
    const r = solveTrio(FOODS[pk], FOODS[ck], FOODS[fk], t.p, t.c, t.f, t.kcal);
    let err = Math.abs(r.sum.kcal - t.kcal)
            + 4 * Math.abs(r.sum.p - t.p)
            + Math.abs(r.sum.c - t.c)
            + 2 * Math.abs(r.sum.f - t.f);
    /* Bileşeni düşen ya da tabağa sığmayacak kadar büyük porsiyonlar tercih edilmesin. */
    if (r.gc < 20) err += 80;
    if (r.gf < 5) err += 50;
    if (r.gp > 280) err += (r.gp - 280) * 0.8;
    if (r.gc > 300) err += (r.gc - 300) * 0.4;
    if (staples.p.includes(pk)) err -= 40;
    if (staples.c.includes(ck)) err -= 40;
    if (staples.f.includes(fk)) err -= 40;
    if (opts.cuisine === "intl") err += [pk, ck, fk].filter(k => INTL_RARE.has(k)).length * 60;
    /* Tofu ve tempeh hafif öğünde ancak başka protein kalmadıysa (vegan) seçilsin. */
    if (light && READY_LEGUMES.has(pk)) err += 60;
    if (!best || err < best.err) best = { err, pk, ck, fk, r };
  }
  return best;
}

function buildMeals(program, variantIndex){
  const prefs = mealPrefs();
  const usage = foodUsage();
  const diet = currentDiet();
  const exclude = new Set(prefs.exclude);
  const cuisine = currentCuisine();
  for (const k of Object.keys(FOODS))
    if ((diet !== "hepsi" && !foodAllowed(k, diet)) || !cuisineOk(FOODS[k], cuisine)) exclude.add(k);
  const opts = { exclude, useMine:!!prefs.useMine, usage, diet, cuisine };
  const order = setOrder(usage, cuisine);
  const set = MEAL_SETS[order[((variantIndex % order.length) + order.length) % order.length]];

  /* Öğün listesi kullanıcıdan gelir; hazır kombinasyonun besin üçlüleri
     bu listeye sırayla dağıtılır (öğün sayısı şablondan fazlaysa başa döner). */
  const mealList = userMeals();
  const shares = mealShares(mealList);
  /* Şablonlar her zaman [Kahvaltı, Öğle, Ara öğün, Akşam] sırasında.
     Öğüne sırasıyla değil türüyle eşlenir: üç öğünlü düzende "Ara öğün"
     öğle şablonunu, "Akşam" ara öğün şablonunu almasın. Büyük öğünün
     ikinci tabağı farklı bir ana öğün şablonundan gelir. */
  const TPL_OF   = { kahvalti:0, ogle:1, ara:2, aksam:3 };
  const TPL_ALT  = { kahvalti:2, ogle:3, ara:0, aksam:1 };
  const tplFor = (mm, plate) => set.meals[
    (plate ? TPL_ALT : TPL_OF)[mm.cat] ?? (plate ? 3 : 1)];

  /* 1) Kullanıcının sabitlediği yiyecekler öğün öğün toplanır. */
  const fixed = mealList.map((mm, idx) => {
    const slot = mm.id;
    const acc = { slot, items:[], p:0, c:0, f:0, lif:0, kcal:0, micros:new Set() };
    for (const x of fixedOf(slot)){
      const fo = foodOf(x.k);
      acc.items.push({ text: portion(fo, x.g).text, icon: fo.i, key:x.k, fixed:true, g:x.g });
      acc.p += fo.p*x.g/100; acc.c += fo.c*x.g/100; acc.f += fo.f*x.g/100; acc.lif += (fo.lif||0)*x.g/100;
      (fo.v || []).forEach(v => acc.micros.add(v));
    }
    acc.kcal = acc.p*4 + acc.c*4 + acc.f*9;
    return acc;
  });

  const anyFixed = fixed.some(f => f.items.length);
  /* Diyet seçiliyse hazır setleri zorlamak yerine üreticiyi kullan:
     kategori farkındalığı olduğu için daha tutarlı öğün çıkarıyor. */
  const generate = anyFixed || diet !== "hepsi";
  const dayFix = fixed.reduce((a,x) => ({ p:a.p+x.p, c:a.c+x.c, f:a.f+x.f, lif:a.lif+x.lif, kcal:a.kcal+x.kcal }),
                              { p:0, c:0, f:0, lif:0, kcal:0 });

  /* 2) Günün kalan hedefi, hâlâ yeri olan öğünlere payları oranında bölünür. */
  const rem = { p: Math.max(0, program.protein - dayFix.p),
                c: Math.max(0, program.carb - dayFix.c),
                f: Math.max(0, program.fat - dayFix.f),
                kcal: Math.max(0, program.kcal - dayFix.kcal) };
  const raw = mealList.map((mm,i) => Math.max(0, shares[i] - fixed[i].kcal / program.kcal));
  const sumW = raw.reduce((a,b) => a+b, 0);
  const w = raw.map(x => sumW > 0 ? x / sumW : 0);

  const total = { p:0, c:0, f:0, lif:0, kcal:0 };
  const micros = new Set();
  const dayUsed = new Set();

  const meals = mealList.map((mm, idx) => {
    const m = tplFor(mm, 0);
    const fx = fixed[idx];
    fx.micros.forEach(v => micros.add(v));
    total.p += fx.p; total.c += fx.c; total.f += fx.f; total.lif += fx.lif; total.kcal += fx.kcal;

    const items = fx.items.slice();
    const share = w[idx];
    fx.items.forEach(it => dayUsed.add(it.key));

    if (share <= 0.0001)
      return { name:mealName(mm), slot:fx.slot, items, kcal:Math.round(fx.kcal), full: fx.items.length > 0 };

    const t0 = { p: rem.p*share, c: rem.c*share, f: rem.f*share, kcal: rem.kcal*share };

    /* Her öğünde tek protein ve tek yağ kaynağı olur. Ana karbonhidrat makul
       bir porsiyonda tutulur; artan karbonhidrat ikinci bir kaynağa (ekmek,
       meyve, patates gibi) verilir. Eskiden büyük öğünde ikinci bir tam tabak
       açılıyordu ve aynı öğünde tavukla ton balığı gibi iki ana yemek çıkıyordu. */
    const t = t0;
    const capScale = clamp(t0.kcal / 800, 1, 1.75);

    const used = [];
    /* Anlamsız kalan miktarlar listeye girmesin. */
    const keep = (raw2, food) => food.unit ? raw2 >= food.unit*0.5 : (food.f >= 35 ? raw2 >= 5 : raw2 >= 20);
    const put = (food, g, key) => {
      if (!keep(g, food)) return;
      const part = portion(food, g);
      items.push({ text:part.text, icon:food.i, key, g:part.g });
      used.push([food, part.g]);
    };

    let placed = 0;
    {
      /* 3) Sabitleme veya diyet varsa kalan hedefe göre yeni üçlü üretilir;
            yoksa hazır kombinasyonun besinleri kullanılır. */
      let pk, ck, fk, solved;
      if (generate){
        const best = pickTrio(mm.cat || "ogle", t, opts, dayUsed, variantIndex);
        if (best){ pk = best.pk; ck = best.ck; fk = best.fk; solved = best.r; }
      }
      if (!solved){
        const src = tplFor(mm, 0);
        pk = resolveSlot(src.p, "p", opts, dayUsed);
        ck = resolveSlot(src.c, "c", opts, dayUsed);
        fk = resolveSlot(src.f, "f", opts, dayUsed);
        if (pk && ck && fk)
          solved = solveTrio(FOODS[pk], FOODS[ck], FOODS[fk], t.p, t.c, t.f, t.kcal);
      }
      if (solved){
        dayUsed.add(pk); dayUsed.add(ck);
        /* Zeytinyağı gibi sade yağlar her öğünde olabilir; tekrar yasağı
           yedek seçimi sucuk gibi anlamsız yağ kaynaklarına itiyordu. */
        if (FOODS[fk].i !== "oil") dayUsed.add(fk);

        const P = FOODS[pk], C = FOODS[ck], F = FOODS[fk];
        const gc = Math.min(solved.gc, carbCap(C, capScale));
        /* Tavan yüzünden eksik kalan karbonhidrat ve kalori yan kaynağa gider. */
        const kcalOf = (fo, g) => (fo.p*4 + fo.c*4 + fo.f*9) * g / 100;
        const spill = t.c - (P.c*solved.gp + C.c*gc + F.c*solved.gf) / 100;
        const room = t.kcal - kcalOf(P, solved.gp) - kcalOf(C, gc) - kcalOf(F, solved.gf);
        put(P, solved.gp, pk);
        put(C, gc, ck);
        if (spill >= 15 && room > 0){
          /* Yan karbonhidrat başka bir öğünün ana besinini elinden almasın diye
             günlük tekrar listesine girmez; gün içinde tekrarlanabilir. */
          const ck2 = (SIDE_CARBS[mm.cat] || SIDE_CARBS.ogle)
            .find(k => FOODS[k] && k !== ck && k !== pk && !opts.exclude.has(k));
          if (ck2){
            const C2 = FOODS[ck2];
            put(C2, Math.min(spill / (C2.c / 100), room / kcalOf(C2, 1), carbCap(C2, capScale)), ck2);
          }
        }
        put(F, solved.gf, fk);
        placed++;
      }
    }

    if (!placed)
      return { name:mealName(mm), slot:fx.slot, items, kcal:Math.round(fx.kcal), full: items.length > 0 };

    if (m.extra && !generate) items.push({ text:m.extra, icon:"veg" });
    else if (generate){
      const sides = cuisine === "intl" ? SIDES_INTL : SIDES;
      items.push({ text: sides[(idx + variantIndex) % sides.length], icon:"veg" });
    }

    const sum = { p:0, c:0, f:0, lif:0 };
    for (const [food, g] of used){
      sum.p += food.p*g/100; sum.c += food.c*g/100; sum.f += food.f*g/100; sum.lif += (food.lif||0)*g/100;
      (food.v || []).forEach(v => micros.add(v));
    }
    const kcal = sum.p*4 + sum.c*4 + sum.f*9;
    total.p += sum.p; total.c += sum.c; total.f += sum.f; total.lif += sum.lif; total.kcal += kcal;

    return { name:mealName(mm), slot:fx.slot, items, kcal:Math.round(fx.kcal + kcal) };
  });

  const label = diet === "hepsi" ? tx("Sana özel kombinasyon") : DIETS[diet] + tx(" · sana özel");
  return { setName: generate ? label : set.name, meals, micros, generated:generate,
    total:{ p:Math.round(total.p), c:Math.round(total.c), f:Math.round(total.f),
            lif:Math.round(total.lif), kcal:Math.round(total.kcal) } };
}

const STEP = 100, MAX_ADJ = 400, MIN_SAMPLES = 3;

function avgWeights(state, fromKey, toKey){
  const out = [];
  for (const [k, d] of Object.entries(state.days))
    if (k > fromKey && k <= toKey && typeof d.weight === "number") out.push(d.weight);
  return out;
}

function weeklyRefresh(state){
  const t = today();
  if (state.lastRefreshAt && (new Date(t) - new Date(state.lastRefreshAt)) / 864e5 < 7) return null;

  const cur = avgWeights(state, shiftDays(t,-7), t);
  const prev = avgWeights(state, shiftDays(t,-14), shiftDays(t,-7));
  if (cur.length < MIN_SAMPLES || prev.length < MIN_SAMPLES)
    return { msg:tx("Trend için yeterli veri yok (bu hafta {0}, geçen hafta {1} ölçüm). Haftada en az {2} gün tartıl.", [(cur.length), (prev.length), (MIN_SAMPLES)]), save:false };

  const a = cur.reduce((x,y)=>x+y,0)/cur.length;
  const b = prev.reduce((x,y)=>x+y,0)/prev.length;
  const pct = (a - b) / b * 100;
  const [lo, hi] = GOAL[state.profile.goal].range;

  state.lastRefreshAt = t;
  if (pct >= lo && pct <= hi)
    return { msg:tx("Hedeflenen hızda ilerliyorsun (%{0}/hafta). Kalori hedefi değişmiyor.", [(fmtFix(pct, 2))]), save:true };

  const tooSlow = state.profile.goal === "gain" ? pct < lo : pct > hi;
  const delta = state.profile.goal === "gain" ? (tooSlow ? STEP : -STEP) : (tooSlow ? -STEP : STEP);
  const next = clamp((state.adjustment||0) + delta, -MAX_ADJ, MAX_ADJ);
  if (next === (state.adjustment||0))
    return { msg:tx("Düzeltme sınırına ({0} kcal) ulaşıldı. Hedefi daha fazla kaydırmak yerine aktivite seviyeni gözden geçir.", [(MAX_ADJ)]), save:true };

  const applied = next - (state.adjustment||0);
  state.adjustment = next;
  return { msg:tx("Son hafta ortalaman {0} (önceki hafta {1}, %{2}). Günlük hedef {3} kcal {4}.", [(fmtW(a)), (fmtW(b)), (fmtFix(pct, 2)), (Math.abs(applied)), (applied<0?tx("düşürüldü"):tx("artırıldı"))]), save:true };
}
