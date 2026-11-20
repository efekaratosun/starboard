"use strict";

/* ---------------- karşılama sahnesi ----------------
   İlk açılış ekranının arka planı: yıldızlar, ara sıra kayan yıldız ve halkalı gezegen.
   Hafif tutuldu: yüzey ve halka dokuları bir kez canvas'a çizilir, sonra yalnızca
   CSS dönüşümleriyle (transform / opacity) kayar; kare başına JavaScript çalışmaz.
   Renkler tokens.css'teki --planet-* ve --sky-* değişkenlerinden gelir.
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

/* ---- dokular için tekrarlayan (yatayda dikişsiz) değer gürültüsü ---- */
function sceneNoise(seed){
  const P = new Float32Array(1024), r = sceneRng(seed);
  for (let i = 0; i < 1024; i++) P[i] = r();
  const at = (x, y) => P[((x * 73 + y * 151) & 1023)];
  const sm = t => t * t * (3 - 2 * t);
  /* wrap: x ekseninde kaç hücrede tekrar eder */
  return (x, y, wrap) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = sm(x - xi), fy = sm(y - yi);
    const x0 = ((xi % wrap) + wrap) % wrap, x1 = (x0 + 1) % wrap;
    const a = at(x0, yi), b = at(x1, yi), c = at(x0, yi + 1), d = at(x1, yi + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}

const sceneHex = h => { const n = parseInt(h.replace("#", ""), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
function sceneTok(name, fallback){
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
function scenePal(){
  return ["--planet-1", "--planet-2", "--planet-3", "--planet-4", "--planet-5"]
    .map((k, i) => sceneHex(sceneTok(k, ["#F6E2BC", "#E3B573", "#C98A52", "#9C5B3A", "#6E3F36"][i])));
}

/* Yüzey: yatay bantlar, dalgalı kenarlar, ince akış çizgileri ve bir fırtına. 768×384, yatayda dikişsiz. */
function scenePaintBands(cv){
  const W = 768, H = 384;
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d"), img = ctx.createImageData(W, H), d = img.data;
  const n1 = sceneNoise(11), n2 = sceneNoise(23), n3 = sceneNoise(37);
  const pal = scenePal();
  const prof = v => 0.5 + 0.20 * Math.sin(v * 6.2832 * 3.1 + 0.7) + 0.14 * Math.sin(v * 6.2832 * 7.3 + 2.1)
    + 0.08 * Math.sin(v * 6.2832 * 13.7 + 4.0) + (n1(v * 22, 3.3, 1024) - 0.5) * 0.34;
  for (let y = 0; y < H; y++){
    const v0 = y / H;
    for (let x = 0; x < W; x++){
      const u = x / W;
      const warp = (n2(u * 3, v0 * 5, 3) - 0.5) * 0.07 + (n2(u * 9, v0 * 12 + 9, 9) - 0.5) * 0.022;
      let t = prof(v0 + warp);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      t = t * t * (3 - 2 * t) * 0.55 + t * 0.45;                /* bant kenarları biraz keskinleşir */
      const f = t * 4, i = Math.min(3, f | 0), k = f - i, A = pal[i], B = pal[i + 1];
      const fine = n3(u * 14, v0 * 70, 14) * 0.55 + n3(u * 36, v0 * 150, 36) * 0.45;
      const m = 0.86 + 0.28 * fine;
      const o = (y * W + x) * 4;
      d[o] = Math.min(255, (A[0] + (B[0] - A[0]) * k) * m);
      d[o + 1] = Math.min(255, (A[1] + (B[1] - A[1]) * k) * m);
      d[o + 2] = Math.min(255, (A[2] + (B[2] - A[2]) * k) * m);
      d[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  /* büyük fırtına (kenardan taşarsa öbür uçtan da çizilir) */
  const storm = sceneTok("--planet-storm", "#D96B5A");
  const oval = (cx, cy, rx, ry, a) => {
    for (const ox of [0, -W, W]){
      ctx.save(); ctx.translate(cx + ox, cy); ctx.scale(1, ry / rx);
      const g = ctx.createRadialGradient(0, 0, rx * 0.1, 0, 0, rx);
      g.addColorStop(0, storm); g.addColorStop(0.55, storm); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = a * 0.55; ctx.strokeStyle = "rgba(255,236,210,.9)"; ctx.lineWidth = rx * 0.07;
      ctx.beginPath(); ctx.arc(0, 0, rx * 0.5, 0.6, 4.4); ctx.stroke();
      ctx.restore();
    }
  };
  oval(W * 0.58, H * 0.64, 62, 26, 0.55);
  oval(W * 0.16, H * 0.37, 26, 9, 0.32);
  /* kutuplara doğru kararma */
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(20,14,34,.55)"); g.addColorStop(0.22, "rgba(20,14,34,0)");
  g.addColorStop(0.78, "rgba(20,14,34,0)"); g.addColorStop(1, "rgba(20,14,34,.6)");
  ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

/* Üst bulut katmanı: yarı saydam ince açık çizgiler; yüzeyden biraz hızlı kayar. */
function scenePaintClouds(cv){
  const W = 768, H = 384;
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d"), img = ctx.createImageData(W, H), d = img.data;
  const n1 = sceneNoise(71), n2 = sceneNoise(5);
  const c = sceneHex(sceneTok("--planet-1", "#F6E2BC"));
  for (let y = 0; y < H; y++){
    const v = y / H;
    for (let x = 0; x < W; x++){
      const u = x / W;
      const s = n1(u * 4, v * 60, 4) * 0.55 + n2(u * 12, v * 140, 12) * 0.45;
      const a = Math.max(0, s - 0.56) * 2.1;
      const o = (y * W + x) * 4;
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = Math.min(150, a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
}

/* Halka: yukarıdan görünüş, 1024×1024. Dış yarıçap 1,95 R, iç 1,30 R (R: gezegen yarıçapı).
   Cassini aralığı, Encke aralığı, ince bölünmeler ve gezegenin halkaya düşen gölgesi çizilir.
   Ekranda scaleY ile yassılaştırılır. */
const SCENE_RING = { out: 1.95, inn: 1.30 };
function scenePaintRing(cv){
  const S = 1024, C = S / 2;
  cv.width = S; cv.height = S;
  const ctx = cv.getContext("2d"), K = C / SCENE_RING.out;         /* K: 1 R kaç piksel */
  const c1 = sceneHex(sceneTok("--planet-ring-1", "#F4E6CB")), c2 = sceneHex(sceneTok("--planet-ring-2", "#C9A57A")), c3 = sceneHex(sceneTok("--planet-ring-3", "#8D6E52"));
  const mix = (a, b, t) => [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * t);
  const r = sceneRng(99), n = sceneNoise(3);
  ctx.lineWidth = 1.6;
  for (let px = SCENE_RING.inn * K; px < C; px += 1.2){
    const R = px / K;
    let a, tone;
    if (R < 1.50){ a = 0.20 + 0.10 * n(R * 40, 1, 1024); tone = mix(c3, c2, (R - 1.3) / 0.2); }          /* C halkası: soluk */
    else if (R < 1.75){ a = 0.82 + 0.16 * n(R * 70, 2, 1024) - 0.12 * ((R - 1.5) / 0.25); tone = mix(c2, c1, (R - 1.5) / 0.25); }  /* B: yoğun */
    else if (R < 1.80){ a = 0.05 + 0.05 * r(); tone = c3; }                                              /* Cassini aralığı */
    else { a = 0.62 + 0.14 * n(R * 55, 4, 1024); tone = mix(c1, c2, (R - 1.8) / 0.15); }                 /* A halkası */
    if (R > 1.925 && R < 1.94) a *= 0.12;                                                                 /* Encke aralığı */
    a *= 0.78 + 0.42 * n(R * 160, 7, 1024);                                                               /* ince bölünmeler */
    if (r() < 0.045) a *= 0.35;
    /* dış kenarda yumuşak sönme */
    if (R > 1.93) a *= Math.max(0, (SCENE_RING.out - R) / (SCENE_RING.out - 1.93));
    ctx.strokeStyle = `rgba(${tone[0] | 0},${tone[1] | 0},${tone[2] | 0},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(C, C, px, 0, 6.2832); ctx.stroke();
  }
  /* aydınlık sol taraftan gelir: halka sağa doğru hafif kararır */
  ctx.globalCompositeOperation = "source-atop";
  const lg = ctx.createLinearGradient(0, 0, S, 0);
  lg.addColorStop(0, "rgba(255,244,225,.10)"); lg.addColorStop(0.5, "rgba(0,0,0,0)"); lg.addColorStop(1, "rgba(8,6,22,.38)");
  ctx.fillStyle = lg; ctx.fillRect(0, 0, S, S);
  /* gezegenin halkaya düşen gölgesi: ışığın tersi yönde, gezegen genişliğinde bir şerit */
  const ang = 0.38, Rpx = K;
  ctx.save(); ctx.translate(C, C); ctx.rotate(ang);
  const sg = ctx.createLinearGradient(0, -Rpx - 18, 0, Rpx + 18);
  sg.addColorStop(0, "rgba(6,4,18,0)"); sg.addColorStop(0.06, "rgba(6,4,18,.78)");
  sg.addColorStop(0.94, "rgba(6,4,18,.78)"); sg.addColorStop(1, "rgba(6,4,18,0)");
  ctx.fillStyle = sg; ctx.fillRect(0, -Rpx - 18, S, 2 * Rpx + 36);
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

/* Halkanın gezegen yüzeyine düşen gölgesi ve gece yarısı: gezegen üstündeki sabit katman. */
function scenePaintBall(cv){
  const S = 512, C = S / 2, R = S / 2;
  cv.width = S; cv.height = S;
  const ctx = cv.getContext("2d");
  ctx.save(); ctx.beginPath(); ctx.arc(C, C, R, 0, 6.2832); ctx.clip();
  /* halka gölgesi: güney yarıkürede, halkanın hemen altında kıvrık koyu bant */
  const ey = 0.30, lat = 0.35;
  for (let i = 0; i < 9; i++){
    const w = (9 - i) * 5.0;
    ctx.save(); ctx.translate(C, C + R * (0.33 + 0.02 * i / 9)); ctx.scale(1, ey * 0.97);
    ctx.strokeStyle = `rgba(14,8,26,${(0.07 + i * 0.012).toFixed(3)})`; ctx.lineWidth = w;
    ctx.beginPath(); ctx.arc(0, 0, R * (1 - lat * lat * 0.5) * 0.99, 0.08, Math.PI - 0.08); ctx.stroke();
    ctx.restore();
  }
  /* gündüz-gece sınırı (terminatör): ışık sol üstten, sağ alt kenar karanlık */
  const lg = ctx.createRadialGradient(C * 0.62, C * 0.66, R * 0.30, C * 0.62, C * 0.66, R * 1.42);
  lg.addColorStop(0, "rgba(255,238,210,.20)"); lg.addColorStop(0.22, "rgba(255,238,210,0)");
  lg.addColorStop(0.55, "rgba(8,6,22,.38)"); lg.addColorStop(0.74, "rgba(6,5,20,.78)");
  lg.addColorStop(0.88, "rgba(4,4,16,.95)"); lg.addColorStop(1, "rgba(4,4,16,.98)");
  ctx.fillStyle = lg; ctx.fillRect(0, 0, S, S);
  /* kenarda hafif koyulaşma (limb darkening) */
  const lb = ctx.createRadialGradient(C, C, R * 0.72, C, C, R);
  lb.addColorStop(0, "rgba(0,0,0,0)"); lb.addColorStop(1, "rgba(10,6,18,.42)");
  ctx.fillStyle = lb; ctx.fillRect(0, 0, S, S);
  ctx.restore();
}

function sceneHTML(){
  return `<div class="sk-sky"></div>
  <div class="sk-par sk-par1">${sceneStarLayer("a", 110, 0.6, 7)}${sceneStarLayer("deep", 90, 0.6, 31)}</div>
  <div class="sk-par sk-par2">${sceneStarLayer("b", 46, 1.0, 13)}${sceneStarLayer("deep b", 36, 1.0, 41)}</div>
  <div class="sk-par sk-par3">${sceneStarLayer("c", 16, 1.5, 19)}<div class="sk-tws">${sceneTwinkles(30, 5)}</div></div>
  <i class="sk-shoot"></i>
  <div class="sk-planet"><div class="pl-par"><div class="pl-tilt">
    <div class="pl-rw pl-back"><div class="pl-ring"><canvas class="pl-rc"></canvas></div></div>
    <div class="pl-ball">
      <div class="pl-tex a"><canvas></canvas></div>
      <div class="pl-tex b"><canvas></canvas></div>
      <canvas class="pl-night"></canvas>
    </div>
    <div class="pl-rw pl-front"><div class="pl-ring"><canvas class="pl-rc"></canvas></div></div>
  </div></div></div>`;
}

let sceneState = null;

/* #on-bg içine sahneyi kurar; fare / eğim ile derinlik ve kayan yıldız burada bağlanır. */
function sceneMount(bg){
  if (sceneState){ sceneActive(false); sceneState = null; }      /* önceki sahne kaldıysa zamanlayıcı ve dinleyicileri bırak */
  bg.insertAdjacentHTML("afterbegin", sceneHTML());
  /* Yüzey dokusu iki kez yan yana: yarısı kadar kayınca başa döner (dikişsiz). */
  const tile = (paint, dst) => {
    const src = document.createElement("canvas");
    paint(src);
    dst.width = src.width * 2; dst.height = src.height;
    const c = dst.getContext("2d"); c.drawImage(src, 0, 0); c.drawImage(src, src.width, 0);
  };
  const cvs = bg.querySelectorAll(".pl-tex canvas");
  tile(scenePaintBands, cvs[0]); tile(scenePaintClouds, cvs[1]);
  scenePaintBall(bg.querySelector(".pl-night"));
  const rings = bg.querySelectorAll(".pl-rc");
  scenePaintRing(rings[0]);
  rings[1].width = rings[0].width; rings[1].height = rings[0].height;
  rings[1].getContext("2d").drawImage(rings[0], 0, 0);
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

/* ---- bayraklar (emoji bayraklar Windows'ta harf görünür; SVG çizilir, yuvarlak kırpmayı CSS yapar) ---- */
const sceneStar = (cx, cy, R, r, rot) => Array.from({ length:10 }, (_, i) => {
  const a = rot + i * Math.PI / 5, q = i % 2 ? r : R;
  return (cx + q * Math.cos(a)).toFixed(2) + "," + (cy + q * Math.sin(a)).toFixed(2);
}).join(" ");
const FLAG_SVG = {
  tr: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" fill="#E30A17"/><circle cx="20" cy="24" r="10.5" fill="#fff"/><circle cx="23.4" cy="24" r="8.4" fill="#E30A17"/><polygon fill="#fff" points="${sceneStar(31.5, 24, 4.9, 2.0, Math.PI)}"/></svg>`,
  en: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" fill="#012169"/><path d="M0 0L48 48M48 0L0 48" stroke="#fff" stroke-width="9"/><path d="M0 0L48 48M48 0L0 48" stroke="#C8102E" stroke-width="3.4"/><path d="M24 0V48M0 24H48" stroke="#fff" stroke-width="15"/><path d="M24 0V48M0 24H48" stroke="#C8102E" stroke-width="9"/></svg>`
};
