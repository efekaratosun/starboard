"use strict";

/* ---------------- karşılama sahnesi ----------------
   İlk açılış ekranının arka planı: yıldız katmanları, yanıp sönen yıldızlar ve ara sıra
   kayan yıldız. Yalnızca CSS animasyonları (transform / opacity) kullanılır; kare başına
   JavaScript çalışmaz. Renkler tokens.css'teki --sky-* değişkenlerinden gelir.
   Hareket azaltma açıkken (prefers-reduced-motion) hiçbir şey hareket etmez. */

function sceneRng(seed){
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---- yıldızlar ---- */
function sceneStarLayer(cls, n, size, seed){
  const r = sceneRng(seed);
  const s = [];
  for (let i = 0; i < n; i++) s.push(`${(r() * 108 - 4).toFixed(1)}vw ${(r() * 108 - 4).toFixed(1)}vh 0 ${size}px`);
  return `<i class="sk-l ${cls}" style="box-shadow:${s.join(",")}"></i>`;
}
function sceneTwinkles(n, seed){
  const r = sceneRng(seed);
  let h = "";
  for (let i = 0; i < n; i++){
    const sz = (1.6 + r() * 2.2).toFixed(1);
    h += `<i class="sk-t ${i % 5 === 0 ? "warm" : i % 3 === 0 ? "cool" : ""}" style="left:${(r() * 100).toFixed(1)}%;top:${(r() * 100).toFixed(1)}%;`
      + `width:${sz}px;height:${sz}px;animation-duration:${(3 + r() * 5).toFixed(1)}s;animation-delay:${(-r() * 8).toFixed(1)}s"></i>`;
  }
  return h;
}

/* Halkalı gezegen. Dönüş düz ikon diliyle anlatılır:
   - Gezegen: kraterler disk içinde soldan sağa kayar (iki kopya, diske kırpılı); sağdaki gölge
     (gece tarafı) sabit kalır, böylece küre kendi ekseninde dönüyormuş gibi görünür.
   - Halkalar: her bandın ortasında küçük toz noktaları elips boyunca akar (önde soldan sağa,
     arkada sağdan sola); iç bantlar biraz daha hızlı, halkalar gezegenden yaklaşık iki kat hızlı döner. */
const SK_SPIN_SHIFT = 80;                       /* krater kopyaları arası (diskin çapı 68 + boşluk) */
function scenePlanet(){
  const edge = 48 - MOON_R;
  const bands = [[54, 61], [64, 71], [74, 81], [84, 91]];
  const flatten = radius => (radius * .29).toFixed(2);
  const dust = front => `<g class="sk-planet-dust">${bands.map(([inner, outer], i) => {
    const mid = (inner + outer) / 2, from = front ? -mid : mid;
    return `<path pathLength="100" style="--d:${8 + i}s;--gap:${[5, 6, 7.5, 10][i]}"
      d="M${from} 0 A${mid} ${flatten(mid)} 0 0 0 ${-from} 0"/>`;
  }).join("")}</g>`;
  const ring = front => `<g class="sk-planet-ring">
    ${bands.map(([inner, outer]) => {
      const side = front ? 1 : -1;
      return `<path d="M${side * outer} 0 A${outer} ${flatten(outer)} 0 0 1 ${-side * outer} 0
        H${-side * inner} A${inner} ${flatten(inner)} 0 0 0 ${side * inner} 0 Z"/>`;
    }).join("")}
    ${dust(front)}
  </g>`;
  const craters = moonCraters("carb", 3);
  return `<svg class="sk-planet" viewBox="-96 -48 192 96" aria-hidden="true">
    <defs><clipPath id="sk-planet-clip"><circle cx="48" cy="48" r="${MOON_R}"/></clipPath></defs>
    <g class="sk-planet-system" transform="rotate(-15)">
      ${ring(false)}
      <g class="sk-planet-disc" transform="scale(1.3) translate(-48 -48)">
        <circle cx="48" cy="48" r="${MOON_R}"/>
        <g clip-path="url(#sk-planet-clip)"><g class="sk-planet-surf">
          ${craters}<g transform="translate(${-SK_SPIN_SHIFT} 0)">${craters}</g>
        </g></g>
        <path class="sk-planet-shade" d="M48 ${edge}a${MOON_R} ${MOON_R} 0 0 1 0 ${2 * MOON_R}A44 44 0 0 0 48 ${edge}Z"/>
      </g>
      ${ring(true)}
    </g>
  </svg>`;
}

/* Alt nebula: uygulamanın düz diliyle üst üste binen yumuşak bulut katmanları (her katman
   aynı renkte dairelerin birleşimi; opaklık grupta, böylece iç içe daireler tek düz renk görünür).
   Renkler tema değişkenlerinden: açık temada pembe / turuncu / kırmızı, koyu temada mor / mavi.
   Üst kenar maske ile yumuşar; katmanlar farklı hızlarda çok yavaş yana kayar. */
const SK_NEB_H = 340;
/* Noktalardan geçen yumuşak eğri (Catmull-Rom → kübik Bézier). */
function sceneCurve(p){
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++){
    const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
    const f = n => n.toFixed(1);
    d += `C${f(b[0] + (c[0] - a[0]) / 6)} ${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)} ${f(c[1] - (e[1] - b[1]) / 6)} ${c[0]} ${c[1]}`;
  }
  return d;
}
function sceneNebula(){
  /* Düz illüstrasyon nebulası: soldan sağa yükselen dalgalı akış bantları. Dıştan içe 4 ton basamağı
     (dış kenar koyu ve geniş, çekirdek açık ve dar); üstünde ucu kıvrılan duman kıvrımları. */
  const bands = [
    [[-30, 176], [40, 146], [104, 156], [168, 116], [236, 128], [298, 88], [356, 100], [430, 62]],
    [[-30, 220], [50, 194], [122, 204], [192, 168], [262, 180], [330, 144], [430, 130]],
    [[-30, 262], [70, 238], [150, 248], [222, 216], [300, 228], [372, 198], [430, 202]],
    [[-30, 302], [80, 284], [170, 292], [252, 264], [332, 274], [430, 252]]
  ];
  const band = pts => sceneCurve(pts) + `L430 ${SK_NEB_H + 10}L-30 ${SK_NEB_H + 10}Z`;
  /* duman kıvrımları: bant boyunca akıp ucunda helezon gibi kıvrılan kalın yuvarlak çizgiler */
  const wisps = [
    "M28 214C78 186 128 200 168 170C188 155 186 136 170 136C158 136 156 150 166 154",
    "M196 250C240 226 280 236 320 204C338 190 334 172 318 174C306 176 308 190 318 190",
    "M90 290C130 272 170 280 214 258"
  ];
  const sparks = [[70, 168, 4.2], [300, 150, 3.4], [352, 236, 2.8], [150, 252, 2.4], [250, 112, 3]];
  const spark = ([x, y, r], i) => {
    const q = r * .32;
    return `<path class="sk-neb-sp" style="animation-delay:${-i * 1.3}s" d="M${x} ${y - r}Q${x + q} ${y - q} ${x + r} ${y}Q${x + q} ${y + q} ${x} ${y + r}Q${x - q} ${y + q} ${x - r} ${y}Q${x - q} ${y - q} ${x} ${y - r}Z"/>`;
  };
  return `<svg class="sk-neb" viewBox="0 0 400 ${SK_NEB_H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    ${bands.map((b, i) => `<path class="sk-neb-l sk-neb-l${i + 1}" d="${band(b)}"/>`).join("")}
    <g class="sk-neb-w">${wisps.map(d => `<path d="${d}"/>`).join("")}</g>
    ${sparks.map(spark).join("")}
  </svg>`;
}

function sceneHTML(){
  return `<div class="sk-sky"></div>
  ${sceneNebula()}
  <div class="sk-par sk-par1">${sceneStarLayer("a", 110, 0.6, 7)}${sceneStarLayer("deep", 90, 0.6, 31)}</div>
  <div class="sk-par sk-par2">${sceneStarLayer("b", 46, 1.0, 13)}${sceneStarLayer("deep b", 36, 1.0, 41)}</div>
  <div class="sk-par sk-par3">${sceneStarLayer("c", 16, 1.5, 19)}<div class="sk-tws">${sceneTwinkles(30, 5)}</div></div>
  <i class="sk-shoot"></i>`;
}

let sceneState = null;

/* #on-bg içine sahneyi kurar; fare / eğim ile derinlik ve kayan yıldız burada bağlanır. */
function sceneMount(bg){
  if (sceneState){ sceneActive(false); sceneState = null; }      /* önceki sahne kaldıysa zamanlayıcı ve dinleyicileri bırak */
  bg.insertAdjacentHTML("afterbegin", sceneHTML());
  sceneState = { bg, on:false, timer:0, raf:0, px:0, py:0, stop:null };
}

function sceneReduced(){
  return typeof reduceMotion === "function" ? reduceMotion() : !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function sceneShoot(){
  const s = sceneState;
  if (!s || !s.on) return;
  if (!document.body.contains(s.bg)){ sceneActive(false); sceneState = null; return; }   /* giriş bitti, sahne kalktı */
  const el = s.bg.querySelector(".sk-shoot");
  if (el && !sceneReduced() && !document.hidden){
    const w = innerWidth, h = innerHeight;
    const x = w * (0.1 + Math.random() * 0.8), y = h * (0.04 + Math.random() * 0.32), dx = 160 + Math.random() * 120, dy = dx * (0.38 + Math.random() * 0.25);
    el.style.left = x + "px"; el.style.top = y + "px";
    const a = Math.atan2(dy, dx);
    if (el.animate) el.animate([
      { opacity:0, transform:`translate(0,0) rotate(${a}rad) scaleX(.2)` },
      { opacity:1, offset:0.15 },
      { opacity:0, transform:`translate(${dx}px,${dy}px) rotate(${a}rad) scaleX(1)` }
    ], { duration:900 + Math.random() * 500, easing:"cubic-bezier(.3,.1,.5,1)" });
  }
  s.timer = setTimeout(sceneShoot, 6000 + Math.random() * 9000);
}

/* Karşılama görünürken: kayan yıldız zamanlayıcısı ve fare / eğim dinleyicisi açık. */
function sceneActive(on){
  const s = sceneState;
  if (!s || s.on === on) return;
  s.on = on;
  const bg = s.bg;
  if (!on){
    clearTimeout(s.timer);
    if (s.stop) s.stop();
    s.stop = null;
    return;
  }
  if (sceneReduced()) return;
  s.timer = setTimeout(sceneShoot, 2500 + Math.random() * 2500);
  const set = (x, y) => {
    s.px = Math.max(-1, Math.min(1, x)); s.py = Math.max(-1, Math.min(1, y));
    if (s.raf) return;
    s.raf = requestAnimationFrame(() => {
      s.raf = 0;
      if (!document.body.contains(bg)){ if (s.stop) s.stop(); return; }
      bg.style.setProperty("--px", s.px.toFixed(3)); bg.style.setProperty("--py", s.py.toFixed(3));
    });
  };
  const onMove = e => set((e.clientX / innerWidth - 0.5) * 2, (e.clientY / innerHeight - 0.5) * 2);
  const onTilt = e => { if (e.gamma != null && e.beta != null) set(e.gamma / 28, (e.beta - 50) / 28); };
  addEventListener("pointermove", onMove, { passive:true });
  addEventListener("deviceorientation", onTilt, { passive:true });
  s.stop = () => {
    removeEventListener("pointermove", onMove);
    removeEventListener("deviceorientation", onTilt);
    cancelAnimationFrame(s.raf); s.raf = 0;
  };
}

/* ---- bayraklar (emoji bayraklar Windows'ta harf görünür) ---- */
const sceneStar = (cx, cy, R, r, rot) => Array.from({ length:10 }, (_, i) => {
  const a = rot + i * Math.PI / 5, q = i % 2 ? r : R;
  return (cx + q * Math.cos(a)).toFixed(2) + "," + (cy + q * Math.sin(a)).toFixed(2);
}).join(" ");
const FLAG_SVG = {
  tr: `<svg viewBox="0 0 66 45" aria-hidden="true"><rect width="66" height="45" fill="#E30A17"/><circle cx="27" cy="22.5" r="11" fill="#fff"/><circle cx="30.6" cy="22.5" r="8.8" fill="#E30A17"/><polygon fill="#fff" points="${sceneStar(39, 22.5, 5, 2, Math.PI)}"/></svg>`,
  en: `<svg viewBox="0 0 66 45" aria-hidden="true"><rect width="66" height="45" fill="#012169"/><path d="M0 0L66 45M66 0L0 45" stroke="#fff" stroke-width="9"/><path d="M0 0L66 45M66 0L0 45" stroke="#C8102E" stroke-width="3.4"/><path d="M33 0V45M0 22.5H66" stroke="#fff" stroke-width="15"/><path d="M33 0V45M0 22.5H66" stroke="#C8102E" stroke-width="9"/></svg>`
};
