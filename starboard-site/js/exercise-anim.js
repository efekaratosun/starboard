"use strict";

/* ---------------- hareket animasyonları ----------------
   "Nasıl yapılır" kartlarında hareketi gösteren temsili çizgi figür.
   Video ya da görsel dosyası yoktur: figür, eklem açılarından çizilir ve
   Motion kütüphanesiyle (js/vendor/motion.js) kareler arasında canlandırılır.

   Figür yandan görünür ve sağa bakar. Bir poz şu açılardan oluşur (derece):
     t   gövde: kalçadan omuza; 0 = dik, artı = öne eğik
     th  uyluk, sn baldır, ua üst kol, fa ön kol: 0 = aşağı, 90 = öne yatay, 180 = yukarı
     th2, sn2, ua2, fa2: arkada kalan uzuvlar; yazılmazsa öndekiyle aynıdır
   on + at: hangi eklemin nereye sabitlendiği (ft ayak, ha el, hp kalça, kn diz, sh omuz).
   Bir animasyon iki ya da daha çok pozdan oluşur; figür pozlar arasında gidip gelir. */

const EXA = { W:200, TOP:-16, H:146, FLOOR:112, TORSO:30, NECK:4, HEAD:7, UARM:17, FARM:17, THIGH:24, SHIN:24 };
const exRad = d => d * Math.PI / 180;
const exLimb = a => [Math.sin(exRad(a)), Math.cos(exRad(a))];

/* Yazılmayan alanları doldurur: arkadaki uzuvlar öndekini izler. */
function exPose(p){
  const q = { on:"ft", at:[100, EXA.FLOOR], t:0, th:0, sn:0, ua:0, fa:0, ...p };
  for (const k of ["th", "sn", "ua", "fa"]) if (q[k + "2"] == null) q[k + "2"] = q[k];
  return q;
}

/* Eklem konumları: kalçadan başlayıp açılarla kurulur, sonra sabit ekleme göre kaydırılır. */
function exJoints(p){
  const add = (a, v, len) => [a[0] + v[0] * len, a[1] + v[1] * len];
  const tv = [Math.sin(exRad(p.t)), -Math.cos(exRad(p.t))];
  const hp = [0, 0], sh = add(hp, tv, EXA.TORSO), hd = add(sh, tv, EXA.NECK + EXA.HEAD);
  const el = add(sh, exLimb(p.ua), EXA.UARM), ha = add(el, exLimb(p.fa), EXA.FARM);
  const el2 = add(sh, exLimb(p.ua2), EXA.UARM), ha2 = add(el2, exLimb(p.fa2), EXA.FARM);
  const kn = add(hp, exLimb(p.th), EXA.THIGH), ft = add(kn, exLimb(p.sn), EXA.SHIN);
  const kn2 = add(hp, exLimb(p.th2), EXA.THIGH), ft2 = add(kn2, exLimb(p.sn2), EXA.SHIN);
  const j = { hp, sh, hd, el, ha, el2, ha2, kn, ft, kn2, ft2 };
  const a = j[p.on], dx = p.at[0] - a[0], dy = p.at[1] - a[1];
  for (const k in j) j[k] = [j[k][0] + dx, j[k][1] + dy];
  return j;
}

/* İki poz arası: açılar ve sabit nokta doğrusal karışır. */
function exMix(a, b, u){
  const m = (x, y) => x + (y - x) * u;
  const out = { on:a.on, at:[m(a.at[0], b.at[0]), m(a.at[1], b.at[1])] };
  for (const k of ["t", "th", "sn", "ua", "fa", "th2", "sn2", "ua2", "fa2"]) out[k] = m(a[k], b[k]);
  return out;
}

/* 0..1 ilerlemeyi kareler arasına dağıtır; her karede kısa bir duraklama için yumuşatılır. */
function exAt(frames, v){
  const n = frames.length - 1, s = Math.min(Math.max(v, 0), 1) * n;
  const i = Math.min(Math.floor(s), n - 1), u = s - i;
  return exMix(frames[i], frames[i + 1], u * u * (3 - 2 * u));
}

/* ---- pozlar ---- */
const F = EXA.FLOOR;
const STAND = { t:0, th:0, sn:0, ua:0, fa:0 };
const SQ_TOP = { at:[100, F], t:4 }, SQ_BOT = { at:[100, F], t:38, th:82, sn:-22 };
const PLANK_TOP = { at:[52, F], t:64, th:-64, sn:-64, ua:0, fa:0 };
const PLANK_LOW = { at:[52, F], t:81, th:-80, sn:-80, ua:-110, fa:15 };
const PIKE_TOP = { at:[62, F], t:125, th:-30, sn:-30, ua:44, fa:44 };
const LYING = { on:"hp", at:[100, 106], t:-90 };
const RUN_A = { on:"hp", t:10, th:48, sn:-25, th2:-30, sn2:-85, ua:-40, fa:40, ua2:45, fa2:120 };
const RUN_B = { on:"hp", t:10, th:-30, sn:-85, th2:48, sn2:-25, ua:45, fa:120, ua2:-40, fa2:40 };

const BENCH = { k:"bench", x:46, y:86, w:60 };
const BARBELL = { k:"plate", on:"ha" };
const DB = [{ k:"db", on:"ha" }, { k:"db", on:"ha2" }];

/* d: bir gidişin süresi (saniye). f: pozlar. props: sabit ya da ele bağlı nesneler. */
const EX_ANIMS = {
  /* --- bacak --- */
  squat:      { d:1.5, f:[{ ...SQ_TOP, ua:25, fa:165 }, { ...SQ_BOT, ua:25, fa:165 }], props:[BARBELL] },
  frontsquat: { d:1.5, f:[{ ...SQ_TOP, ua:80, fa:172 }, { ...SQ_BOT, t:22, ua:80, fa:172 }], props:[BARBELL] },
  goblet:     { d:1.5, f:[{ ...SQ_TOP, ua:30, fa:150 }, { ...SQ_BOT, t:26, ua:30, fa:150 }], props:[{ k:"kb", on:"ha" }] },
  chairsquat: { d:1.5, f:[{ ...SQ_TOP, ua:80, fa:85 }, { ...SQ_BOT, t:34, ua:80, fa:85 }], props:[{ k:"box", x:58, y:92, w:30, h:20 }] },
  jumpsquat:  { d:.7, f:[{ ...SQ_BOT, t:32, th:68, ua:-25, fa:-10 }, { at:[100, F - 13], t:0, ua:172, fa:176 }] },
  pistol:     { d:1.8, f:[{ ...SQ_TOP, ua:80, fa:85, th2:35, sn2:35 }, { ...SQ_BOT, t:42, th:98, sn:-26, ua:85, fa:88, th2:92, sn2:92 }] },
  shrimp:     { d:1.8, f:[{ ...SQ_TOP, ua:60, fa:80, th2:-10, sn2:-120 }, { ...SQ_BOT, t:44, th:78, sn:-26, ua:70, fa:85, th2:-45, sn2:-115 }] },
  bulgarian:  { d:1.6, f:[{ at:[110, F], t:6, th:20, sn:-5, th2:-45, sn2:-75, ua:0, fa:10 }, { at:[110, F], t:14, th:75, sn:-5, th2:-20, sn2:-125, ua:0, fa:10 }],
                props:[{ k:"box", x:38, y:92, w:28, h:20 }] },
  lunge:      { d:1.5, f:[{ at:[118, F], t:2, th:25, sn:-10, th2:-25, sn2:-30, ua:0, fa:8 }, { at:[118, F], t:4, th:80, sn:0, th2:-10, sn2:-90, ua:0, fa:8 }] },
  jumplunge:  { d:.6, f:[{ on:"hp", at:[100, 84], t:4, th:80, sn:-80, th2:-10, sn2:-90, ua:-30, fa:30, ua2:35, fa2:110 },
                         { on:"hp", at:[100, 50], t:0, th:12, sn:-6, th2:-12, sn2:-12, ua:5, fa:40, ua2:5, fa2:40 },
                         { on:"hp", at:[100, 84], t:4, th:-10, sn:-90, th2:80, sn2:-80, ua:35, fa:110, ua2:-30, fa2:30 }] },
  stepup:     { d:1.4, f:[{ at:[118, 94], t:15, th:75, sn:-5, th2:-5, sn2:0, ua:10, fa:60, ua2:-10, fa2:20 }, { at:[118, 94], t:0, th:0, sn:0, th2:15, sn2:-30, ua:-10, fa:20, ua2:10, fa2:60 }],
                props:[{ k:"box", x:104, y:94, w:38, h:18 }] },
  calf:       { d:.9, f:[{ at:[98, 106], ua:0, fa:5 }, { at:[98, 99], ua:0, fa:5 }], props:[{ k:"box", x:82, y:106, w:28, h:6 }] },
  wallsit:    { d:2.2, f:[{ at:[110, F], t:0, th:88, sn:0, ua:60, fa:60 }, { at:[110, F], t:0, th:88, sn:0, ua:66, fa:56 }], props:[{ k:"wall", x:80 }] },
  legpress:   { d:1.5, f:[{ on:"hp", at:[64, 98], t:-35, th:150, sn:60, ua:20, fa:60 }, { on:"hp", at:[64, 98], t:-35, th:115, sn:115, ua:20, fa:60 }],
                props:[{ k:"line", a:[72, 106], b:[42, 66] }, { k:"pad", on:"ft" }] },
  legcurl:    { d:1.4, f:[{ on:"hp", at:[100, 96], t:90, th:-90, sn:-90, ua:60, fa:100 }, { on:"hp", at:[100, 96], t:90, th:-90, sn:-170, ua:60, fa:100 }],
                props:[{ k:"box", x:72, y:100, w:70, h:12 }] },
  nordic:     { d:2.2, f:[{ on:"kn", at:[70, 110], t:0, th:0, sn:-90, ua:40, fa:110 }, { on:"kn", at:[70, 110], t:55, th:-55, sn:-90, ua:70, fa:110 }] },
  hipthrust:  { d:1.4, f:[{ on:"sh", at:[60, 84], t:-50, th:125, sn:20, ua:-150, fa:-150 }, { on:"sh", at:[60, 84], t:-90, th:80, sn:0, ua:-150, fa:-150 }],
                props:[{ k:"box", x:28, y:86, w:36, h:26 }] },
  glutebridge:{ d:1.4, f:[{ on:"sh", at:[52, 106], t:-90, th:130, sn:25, ua:80, fa:88 }, { on:"sh", at:[52, 106], t:-115, th:97, sn:22, ua:80, fa:88 }] },

  /* --- kalçadan eğilme --- */
  deadlift:   { d:1.6, f:[{ at:[100, F], t:2 }, { at:[100, F], t:70, th:50, sn:-18 }], props:[BARBELL] },
  rdl:        { d:1.6, f:[{ at:[100, F], t:2 }, { at:[100, F], t:66, th:24, sn:-8 }], props:[BARBELL] },
  swing:      { d:.9, f:[{ at:[100, F], t:56, th:36, sn:-12, ua:-28, fa:-28 }, { at:[100, F], t:-3, ua:86, fa:86 }], props:[{ k:"kb", on:"ha" }] },
  fold:       { d:2.4, f:[{ at:[100, F], t:0, ua:0, fa:0 }, { at:[100, F], t:150, th:6, sn:-4, ua:50, fa:50 }] },

  /* --- itiş --- */
  pushup:     { d:1.3, f:[PLANK_TOP, PLANK_LOW] },
  pike:       { d:1.4, f:[PIKE_TOP, { ...PIKE_TOP, t:135, ua:85, fa:-5 }] },
  hspu:       { d:1.6, f:[{ on:"ha", at:[96, F], t:180, th:180, sn:180, ua:0, fa:0 }, { on:"ha", at:[96, F], t:180, th:180, sn:180, ua:-55, fa:55 }], props:[{ k:"wall", x:108 }] },
  handstand:  { d:2.2, f:[{ on:"ha", at:[96, F], t:178, th:180, sn:180, ua:0, fa:0 }, { on:"ha", at:[96, F], t:183, th:180, sn:178, ua:0, fa:0 }], props:[{ k:"wall", x:108 }] },
  dips:       { d:1.5, f:[{ on:"ha", at:[100, 72], t:5, th:-10, sn:-70, ua:0, fa:0 }, { on:"ha", at:[100, 72], t:20, th:-10, sn:-100, ua:-65, fa:65 }], props:[{ k:"post", x:100, y:72 }] },
  benchdips:  { d:1.4, f:[{ on:"ha", at:[70, 86], t:0, th:75, sn:25, ua:0, fa:0 }, { on:"ha", at:[70, 86], t:0, th:88, sn:45, ua:-50, fa:50 }], props:[{ k:"box", x:42, y:86, w:34, h:26 }] },
  bench:      { d:1.5, f:[{ on:"hp", at:[96, 82], t:-90, th:75, sn:0, ua:180, fa:180 }, { on:"hp", at:[96, 82], t:-90, th:75, sn:0, ua:110, fa:180 }], props:[BENCH, BARBELL] },
  dbbench:    { d:1.5, f:[{ on:"hp", at:[96, 82], t:-90, th:75, sn:0, ua:180, fa:180 }, { on:"hp", at:[96, 82], t:-90, th:75, sn:0, ua:110, fa:180 }], props:[BENCH, ...DB] },
  incline:    { d:1.5, f:[{ on:"hp", at:[100, 84], t:-55, th:78, sn:4, ua:180, fa:180 }, { on:"hp", at:[100, 84], t:-55, th:78, sn:4, ua:122, fa:180 }],
                props:[{ k:"line", a:[106, 90], b:[60, 58] }, BARBELL] },
  inclinedb:  { d:1.5, f:[{ on:"hp", at:[100, 84], t:-55, th:78, sn:4, ua:180, fa:180 }, { on:"hp", at:[100, 84], t:-55, th:78, sn:4, ua:122, fa:180 }],
                props:[{ k:"line", a:[106, 90], b:[60, 58] }, ...DB] },
  ohp:        { d:1.4, f:[{ at:[100, F], ua:35, fa:170 }, { at:[100, F], ua:176, fa:178 }], props:[BARBELL] },
  kbpress:    { d:1.4, f:[{ at:[100, F], ua:35, fa:170, ua2:0, fa2:5 }, { at:[100, F], ua:176, fa:178, ua2:0, fa2:5 }], props:[{ k:"kb", on:"ha" }] },
  lateral:    { d:1.3, f:[{ at:[100, F], ua:4, fa:8 }, { at:[100, F], ua:84, fa:88 }], props:DB },
  triceps:    { d:1.1, f:[{ at:[100, F], t:6, ua:8, fa:112 }, { at:[100, F], t:6, ua:8, fa:12 }] },

  /* --- çekiş --- */
  pullup:     { d:1.5, f:[{ on:"ha", at:[100, 14], th:15, sn:-70, ua:180, fa:180 }, { on:"ha", at:[100, 14], th:15, sn:-70, ua:100, fa:260 }], props:[{ k:"bar", at:[100, 14] }] },
  muscleup:   { d:1.3, f:[{ on:"ha", at:[100, 42], th:95, sn:-75, ua:180, fa:180 }, { on:"ha", at:[100, 42], t:10, th:60, sn:-60, ua:100, fa:260 },
                         { on:"ha", at:[100, 42], t:8, th:10, sn:0, ua:0, fa:360 }], props:[{ k:"bar", at:[100, 42] }] },
  frontlever: { d:2.2, f:[{ on:"ha", at:[70, 14], t:-90, th:90, sn:90, ua:180, fa:180 }, { on:"ha", at:[70, 14], t:-76, th:76, sn:76, ua:180, fa:180 }], props:[{ k:"bar", at:[70, 14] }] },
  invrow:     { d:.7, f:[{ on:"ha", at:[86, 58], t:-75, th:75, sn:75, ua:180, fa:180 }, { on:"ha", at:[86, 58], t:-69, th:69, sn:69, ua:140, fa:220 },
                         { on:"ha", at:[86, 58], t:-52, th:52, sn:52, ua:100, fa:260 }], props:[{ k:"post", x:86, y:58 }] },
  towelrow:   { d:1.4, f:[{ at:[120, F], t:-25, th:25, sn:25, ua:95, fa:95 }, { at:[120, F], t:-8, th:8, sn:8, ua:40, fa:177 }], props:[{ k:"wall", x:124 }] },
  row:        { d:1.3, f:[{ at:[100, F], t:62, th:30, sn:-12, ua:0, fa:0 }, { at:[100, F], t:62, th:30, sn:-12, ua:-55, fa:30 }], props:[BARBELL] },
  kbrow:      { d:1.3, f:[{ at:[100, F], t:66, th:30, sn:-12, ua:0, fa:0, ua2:20, fa2:20 }, { at:[100, F], t:66, th:30, sn:-12, ua:-55, fa:30, ua2:20, fa2:20 }], props:[{ k:"kb", on:"ha" }] },
  facepull:   { d:1.2, f:[{ at:[100, F], ua:84, fa:88 }, { at:[100, F], ua:112, fa:214 }] },
  curl:       { d:1.2, f:[{ at:[100, F], ua:2, fa:6 }, { at:[100, F], ua:6, fa:152 }], props:DB },

  /* --- gövde --- */
  plank:      { d:2.4, f:[{ at:[52, F], t:77, th:-77, sn:-77, ua:0, fa:90 }, { at:[52, F], t:78, th:-78, sn:-76, ua:0, fa:90 }] },
  sideplank:  { d:2.4, f:[{ at:[52, F], t:64, th:-64, sn:-64, ua:0, fa:0, ua2:150, fa2:150 }, { at:[52, F], t:64, th:-64, sn:-64, ua:0, fa:0, ua2:178, fa2:178 }] },
  plankjack:  { d:.5, f:[{ ...PLANK_TOP, th2:-64, sn2:-64 }, { ...PLANK_TOP, th:-52, sn:-70, th2:-76, sn2:-58 }] },
  /* Ara kare: bacaklar yer değiştirirken diz bükülü geçer, ayak yere gömülmez. */
  mountain:   { d:.28, f:[{ on:"ha", at:[122, F], t:64, th:72, sn:-70, th2:-64, sn2:-64, ua:0, fa:0 },
                          { on:"ha", at:[122, F], t:64, th:5, sn:-88, th2:5, sn2:-88, ua:0, fa:0 },
                          { on:"ha", at:[122, F], t:64, th:-64, sn:-64, th2:72, sn2:-70, ua:0, fa:0 }] },
  lsit:       { d:2.2, f:[{ on:"ha", at:[86, 106], th:88, sn:90, ua:0, fa:0 }, { on:"ha", at:[86, 106], th:96, sn:94, ua:0, fa:0 }] },
  dragon:     { d:2, f:[{ on:"sh", at:[60, 84], t:180, th:180, sn:180, ua:-100, fa:-100 }, { on:"sh", at:[60, 84], t:260, th:100, sn:100, ua:-100, fa:-100 }], props:[{ k:"bench", x:26, y:88, w:84 }] },
  hollow:     { d:2.2, f:[{ ...LYING, at:[100, 104], t:-78, th:100, sn:100, ua:-100, fa:-100 }, { ...LYING, at:[100, 104], t:-76, th:102, sn:102, ua:-102, fa:-102 }] },
  hollowrock: { d:.9, f:[{ ...LYING, at:[96, 104], t:-86, th:92, sn:92, ua:-94, fa:-94 }, { ...LYING, at:[104, 102], t:-68, th:110, sn:110, ua:-112, fa:-112 }] },
  /* Baş üstüne uzanan kol 265 derece yazılır (-95 ile aynı yön): kol yerin içinden değil yukarıdan dolanır. */
  deadbug:    { d:1.3, f:[{ ...LYING, th:95, sn:95, th2:180, sn2:90, ua:180, fa:180, ua2:265, fa2:265 }, { ...LYING, th:180, sn:90, th2:95, sn2:95, ua:265, fa:265, ua2:180, fa2:180 }] },
  superman:   { d:1.4, f:[{ on:"hp", at:[92, 106], t:90, th:-90, sn:-90, ua:90, fa:90 }, { on:"hp", at:[92, 106], t:75, th:-102, sn:-102, ua:106, fa:106 }] },
  crunch:     { d:1.2, f:[{ ...LYING, th:130, sn:25, ua:-140, fa:-40 }, { ...LYING, t:-62, th:130, sn:25, ua:-112, fa:-12 }] },

  /* --- kettlebell ve kondisyon --- */
  /* Sadeleştirilmiş kalkış: yatış, oturuş, çömelme, ayakta; ağırlık hep yukarıda. */
  getup:      { d:1.2, f:[{ on:"hp", at:[92, 106], t:-86, th:118, sn:32, ua:180, fa:180, ua2:95, fa2:95 },
                         { on:"hp", at:[92, 104], t:-20, th:118, sn:32, ua:180, fa:180, ua2:-10, fa2:10 },
                         { on:"hp", at:[111, 86], t:30, th:82, sn:-22, ua:180, fa:180, ua2:20, fa2:40 },
                         { on:"hp", at:[126, 64], t:0, th:0, sn:0, ua:178, fa:180, ua2:0, fa2:5 }], props:[{ k:"kb", on:"ha" }] },
  farmer:     { d:.7, f:[{ on:"hp", at:[100, 64], t:2, th:24, sn:4, th2:-20, sn2:-24, ua:0, fa:2 }, { on:"hp", at:[100, 64], t:2, th:-20, sn:-24, th2:24, sn2:4, ua:0, fa:2 }], props:DB },
  burpee:     { d:.8, f:[{ at:[70, F], t:0, ua:172, fa:176 }, { at:[70, F], t:78, th:104, sn:-32, ua:30, fa:70 }, { ...PLANK_TOP, at:[40, F] }] },
  highknees:  { d:.4, f:[{ on:"hp", at:[100, 62], t:2, th:86, sn:0, th2:0, sn2:0, ua:-30, fa:40, ua2:40, fa2:120 }, { on:"hp", at:[100, 62], t:2, th:0, sn:0, th2:86, sn2:0, ua:40, fa:120, ua2:-30, fa2:40 }] },
  run:        { d:.45, f:[{ ...RUN_A, at:[100, 62] }, { ...RUN_B, at:[100, 62] }] },
  sprint:     { d:.3, f:[{ ...RUN_A, at:[100, 62], t:22, th:62 }, { ...RUN_B, at:[100, 62], t:22, th2:62 }] },
  walk:       { d:.7, f:[{ on:"hp", at:[100, 64], t:2, th:24, sn:4, th2:-20, sn2:-24, ua:-18, fa:6, ua2:20, fa2:40 }, { on:"hp", at:[100, 64], t:2, th:-20, sn:-24, th2:24, sn2:4, ua:20, fa:40, ua2:-18, fa2:6 }] },
  jumprope:   { d:.35, f:[{ at:[100, F], th:4, sn:-4, ua:12, fa:58 }, { at:[100, F - 9], th:2, sn:-2, ua:12, fa:66 }] },

  /* --- yoga ve esneme --- */
  sunsalute:  { d:1.5, f:[{ at:[62, F], t:-4, ua:176, fa:178 }, { at:[62, F], t:150, th:6, sn:-4, ua:50, fa:50 }, { ...PLANK_TOP, at:[62, F] }, { ...PIKE_TOP, at:[62, F] }] },
  warrior:    { d:2.2, f:[{ at:[124, F], t:0, th:68, sn:0, th2:-42, sn2:-42, ua:176, fa:178 }, { at:[124, F], t:0, th:68, sn:0, th2:-42, sn2:-42, ua:90, fa:90, ua2:-90, fa2:-90 }] },
  pigeon:     { d:2.6, f:[{ on:"hp", at:[96, 104], t:12, th:86, sn:-94, th2:-88, sn2:-90, ua:20, fa:60 }, { on:"hp", at:[96, 104], t:62, th:86, sn:-94, th2:-88, sn2:-90, ua:60, fa:92 }] },
  butterfly:  { d:2.6, f:[{ on:"hp", at:[90, 104], t:2, th:84, sn:-82, ua:20, fa:70 }, { on:"hp", at:[90, 104], t:30, th:88, sn:-86, ua:32, fa:80 }] },
  catcow:     { d:1.8, f:[{ on:"kn", at:[80, 110], t:80, th:6, sn:-90, ua:-4, fa:-2 }, { on:"kn", at:[80, 110], t:70, th:-6, sn:-90, ua:4, fa:2 }] },
  child:      { d:2.6, f:[{ on:"kn", at:[96, 110], t:96, th:50, sn:-90, ua:92, fa:94 }, { on:"kn", at:[96, 110], t:102, th:54, sn:-90, ua:96, fa:98 }] },
  chairpose:  { d:2.2, f:[{ at:[100, F], t:22, th:58, sn:-16, ua:158, fa:160 }, { at:[100, F], t:26, th:66, sn:-18, ua:160, fa:162 }] },
  tree:       { d:2.4, f:[{ at:[100, F], t:0, th2:62, sn2:-110, ua:40, fa:150 }, { at:[100, F], t:0, th2:62, sn2:-110, ua:168, fa:192 }] },
  shoulders:  { d:2, f:[{ at:[100, F], t:0, ua:-18, fa:-22 }, { at:[100, F], t:12, ua:-72, fa:-76 }] },
  breathe:    { d:2.8, f:[{ on:"hp", at:[92, 104], t:0, th:84, sn:-82, ua:18, fa:76 }, { on:"hp", at:[92, 103], t:-3, th:84, sn:-82, ua:22, fa:74 }] },
  armcircle:  { d:1.2, f:[{ at:[100, F], ua:-40, fa:-36 }, { at:[100, F], ua:172, fa:176 }] },

  /* --- yüzme --- */
  swim:       { d:.8, f:[{ on:"hp", at:[104, 66], t:88, th:-84, sn:-88, th2:-96, sn2:-92, ua:92, fa:92, ua2:-70, fa2:-80 }, { on:"hp", at:[104, 66], t:88, th:-96, sn:-92, th2:-84, sn2:-88, ua:-70, fa:-80, ua2:92, fa2:92 }],
                props:[{ k:"water", y:60 }] }
};
EX_ANIMS.swimfast = { ...EX_ANIMS.swim, d:.45 };
EX_ANIMS.swimdrill = { ...EX_ANIMS.swim, d:1.3 };

/* Rehber kaydı (GUIDE id) -> animasyon. Aynı hareket ailesi aynı animasyonu paylaşır. */
const EX_ANIM_OF = {
  frontsquat:"frontsquat", goblet:"goblet", jumpsquat:"jumpsquat", shrimp:"shrimp", pistol:"pistol", bulgarian:"bulgarian",
  sandalyesquat:"chairsquat", squat:"squat", romen:"rdl", deadlift:"deadlift", legpress:"legpress", legcurl:"legcurl",
  nordic:"nordic", hipthrust:"hipthrust", glutebridge:"glutebridge", calf:"calf", stepup:"stepup", lungesicrama:"jumplunge",
  lunge:"lunge", wallsit:"wallsit",
  hspu:"hspu", pike:"pike", elmas:"pushup", sinav:"pushup", bankdips:"benchdips", dips:"dips", inclinedb:"inclinedb",
  incline:"incline", dbpress:"dbbench", bench:"bench", tekkolpress:"kbpress", ohp:"ohp", yanomuz:"lateral", triceps:"triceps",
  muscleup:"muscleup", frontlever:"frontlever", chinup:"pullup", barfiks:"pullup", invrow:"invrow", havlu:"towelrow",
  kbrow:"kbrow", row:"row", facepull:"facepull", biceps:"curl",
  lsit:"lsit", dragon:"dragon", hollowrock:"hollowrock", hollow:"hollow", yanplank:"sideplank", plankserisi:"plank",
  plankjack:"plankjack", plank:"plank", deadbug:"deadbug", superman:"superman", karin:"crunch", mountain:"mountain",
  handstand:"handstand", swing:"swing", tgu:"getup", farmer:"farmer",
  burpee:"burpee", yuksekdiz:"highknees", sprint:"sprint", kosuyuruyus:"run", kosu:"run", ipatlama:"jumprope", yuruyus:"walk",
  gunes:"sunsalute", savasci:"warrior", guvercin:"pigeon", kelebek:"butterfly", kedi:"catcow", cocuk:"child",
  sandalyepoz:"chairpose", agac:"tree", onegilme:"fold", omuzacici:"shoulders", nefes:"breathe", esneme:"fold", isinma:"armcircle",
  yuzmeteknik:"swimdrill", yuzmesprint:"swimfast", serbest:"swim"
};

const exAnimFor = id => EX_ANIMS[EX_ANIM_OF[id]] || null;

/* ---- çizim ---- */
let exAnimCtl = null, exAnimSeq = 0;
function exAnimStop(){
  if (exAnimCtl){ try { exAnimCtl.stop(); } catch(e){} exAnimCtl = null; }
}

const exPt = p => p[0].toFixed(1) + "," + p[1].toFixed(1);

function exPropMarkup(pr, i){
  switch (pr.k){
    case "box":   return `<rect class="exa-prop" x="${pr.x}" y="${pr.y}" width="${pr.w}" height="${pr.h}" rx="5"/>`;
    case "bench": return `<rect class="exa-prop" x="${pr.x}" y="${pr.y}" width="${pr.w}" height="6" rx="3"/>`
      + `<path class="exa-line" d="M${pr.x + 8} ${pr.y + 6}V${F}M${pr.x + pr.w - 8} ${pr.y + 6}V${F}"/>`;
    case "wall":  return `<path class="exa-line thick" d="M${pr.x} ${EXA.TOP + 8}V${F}"/>`;
    case "line":  return `<path class="exa-line thick" d="M${pr.a[0]} ${pr.a[1]}L${pr.b[0]} ${pr.b[1]}"/>`;
    case "bar":   return `<path class="exa-line" d="M${pr.at[0]} ${EXA.TOP + 4}V${pr.at[1] - 4}"/><circle class="exa-dot" cx="${pr.at[0]}" cy="${pr.at[1]}" r="3.4"/>`;
    case "post":  return `<path class="exa-line thick" d="M${pr.x} ${pr.y + 4}V${F}"/><circle class="exa-dot" cx="${pr.x}" cy="${pr.y}" r="3.4"/>`;
    case "water": return `<path class="exa-water" d="M4 ${pr.y}q12 -6 24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0"/>`;
    default:      return `<g data-p="${i}"></g>`;      /* ele ya da ayağa bağlı: her karede çizilir */
  }
}

/* Hareketli nesneler: bağlı olduğu eklemin konumuna göre. */
function exPropMove(pr, j){
  const p = j[pr.on];
  switch (pr.k){
    case "plate": return `<circle class="exa-plate" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="9.5"/><circle class="exa-dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.6"/>`;
    case "db":    return `<circle class="exa-dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5"/>`;
    case "kb":    return `<circle class="exa-plate" cx="${p[0].toFixed(1)}" cy="${(p[1] + 7).toFixed(1)}" r="6.5"/><circle class="exa-dot" cx="${p[0].toFixed(1)}" cy="${(p[1] + 7).toFixed(1)}" r="2.4"/>`;
    case "pad":   return `<path class="exa-line thick" d="M${(p[0] + 4).toFixed(1)} ${(p[1] - 12).toFixed(1)}L${(p[0] + 4).toFixed(1)} ${(p[1] + 12).toFixed(1)}"/>`;
    default:      return "";
  }
}

function exAnimSvg(uid, a){
  return `<svg viewBox="0 ${EXA.TOP} ${EXA.W} ${EXA.H}" aria-hidden="true">
    <defs><linearGradient id="exg${uid}" gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="160" y2="${F}">
      <stop offset="0" stop-color="var(--g1)"/><stop offset="1" stop-color="var(--g2)"/></linearGradient></defs>
    <path class="exa-floor" d="M14 ${F + 4}H186"/>
    ${(a.props || []).map(exPropMarkup).join("")}
    <polyline class="exa-far" data-j="leg2"/><polyline class="exa-far" data-j="arm2"/>
    <g stroke="url(#exg${uid})" fill="url(#exg${uid})">
      <polyline class="exa-limb" data-j="leg"/><polyline class="exa-body" data-j="torso"/>
      <polyline class="exa-limb" data-j="arm"/><circle class="exa-head" data-j="head" r="${EXA.HEAD}"/>
    </g>
  </svg>`;
}

/* Bir kareyi çizer. */
function exAnimDraw(svg, a, frames, v){
  const j = exJoints(exAt(frames, v));
  const set = (name, pts) => svg.querySelector(`[data-j="${name}"]`).setAttribute("points", pts.map(exPt).join(" "));
  set("leg2", [j.hp, j.kn2, j.ft2]); set("arm2", [j.sh, j.el2, j.ha2]);
  set("leg", [j.hp, j.kn, j.ft]); set("torso", [j.hp, j.sh]); set("arm", [j.sh, j.el, j.ha]);
  const h = svg.querySelector('[data-j="head"]');
  h.setAttribute("cx", j.hd[0].toFixed(1)); h.setAttribute("cy", j.hd[1].toFixed(1));
  (a.props || []).forEach((pr, i) => { if (pr.on){ const g = svg.querySelector(`[data-p="${i}"]`); if (g) g.innerHTML = exPropMove(pr, j); } });
}

/* Açık rehber kartındaki sahneyi kurar ve oynatır. Kart kapanınca ya da ekran yeniden
   çizilince önceki animasyon durdurulur. */
function mountExAnim(root){
  exAnimStop();
  const box = (root || document).querySelector(".how-anim[data-anim]");
  if (!box) return;
  const a = exAnimFor(box.dataset.anim);
  if (!a) return;
  const frames = a.f.map(exPose);
  box.innerHTML = exAnimSvg(++exAnimSeq, a);
  const svg = box.firstElementChild;
  exAnimDraw(svg, a, frames, 0);
  const motion = window.Motion;
  if (!motion || typeof motion.animate !== "function" || reduceMotion()) {
    exAnimDraw(svg, a, frames, 1);       /* hareket azaltılmışsa hareketin son hali durağan gösterilir */
    return;
  }
  exAnimCtl = motion.animate(0, 1, {
    duration: a.d * (frames.length - 1), ease: "linear", repeat: Infinity, repeatType: "reverse",
    onUpdate: v => { if (svg.isConnected) exAnimDraw(svg, a, frames, v); else exAnimStop(); }
  });
}
