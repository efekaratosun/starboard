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

function sceneMoon(id){
  const edge = 48 - MOON_R;
  return `<svg class="sk-moon sk-moon-${id}" viewBox="0 0 96 96" aria-hidden="true" style="--c:var(--moon-${id})">
    <circle class="mn-lit" cx="48" cy="48" r="${MOON_R}"/>
    ${moonCraters(id)}
    <path class="sk-moon-shade" d="M48 ${edge}a${MOON_R} ${MOON_R} 0 0 1 0 ${2 * MOON_R}A44 44 0 0 0 48 ${edge}Z"/>
    <path class="mn-spark" d="M84 10Q85 16 91 17Q85 18 84 24Q83 18 77 17Q83 16 84 10Z"/>
  </svg>`;
}

function sceneHTML(){
  return `<div class="sk-sky"></div>
  <div class="sk-par sk-par1">${sceneStarLayer("a", 110, 0.6, 7)}${sceneStarLayer("deep", 90, 0.6, 31)}</div>
  <div class="sk-par sk-par2">${sceneStarLayer("b", 46, 1.0, 13)}${sceneStarLayer("deep b", 36, 1.0, 41)}</div>
  <div class="sk-par sk-par3">${sceneStarLayer("c", 16, 1.5, 19)}<div class="sk-tws">${sceneTwinkles(30, 5)}</div></div>
  ${["kcal", "carb", "protein"].map(sceneMoon).join("")}
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
