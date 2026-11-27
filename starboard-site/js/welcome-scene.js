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
  for (let i = 0; i < n; i++) s.push(`${(r() * 108 - 4).toFixed(1)}vw ${(r() * 108 - 4).toFixed(1)}lvh 0 ${size}px`);
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

/* Alt nebula (uzay tozu): kenarı kaybolan yumuşak renk bulutları, içlerinden geçen koyu toz
   şeritleri, şeritler boyunca yoğunlaşan toz parçacıkları ve birkaç hafif parlayan yıldız.
   Sert kenar yok: bulutlar ve şeritler radyal gradyan elipsler (filtre/blur yok, pil dostu).
   Renkler tema değişkenlerinden: açık temada pembe / turuncu / kırmızı, koyu temada mor / mavi.
   Bulutlar, şeritler ve toz farklı hızlarda çok yavaş süzülür; hareket azaltmada durur. */
const SK_NEB_H = 340;
function sceneNebula(){
  const f = n => n.toFixed(1);
  /* [cx, cy, rx, ry, renk değişkeni, merkez opaklığı, açı] */
  const clouds = [[120, 270, 230, 90, "--neb-3", .5, -12], [300, 240, 200, 80, "--neb-2", .45, -18], [220, 310, 260, 70, "--neb-1", .4, -8]];
  /* koyu toz şeritleri: gökyüzü renginde, uzun ve ince yumuşak elipsler bulutu yer yer siler */
  const lanes = [[110, 280, 150, 13, -16], [280, 238, 120, 10, -14], [170, 318, 120, 8, -9]];
  const grad = (id, color, a) => `<radialGradient id="${id}"><stop offset="0" style="stop-color:var(${color});stop-opacity:${a}"/>`
    + `<stop offset=".55" style="stop-color:var(${color});stop-opacity:${(a * .45).toFixed(3)}"/><stop offset="1" style="stop-color:var(${color});stop-opacity:0"/></radialGradient>`;
  const ell = ([cx, cy, rx, ry], rot, fill) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${fill})" transform="rotate(${rot} ${cx} ${cy})"/>`;
  /* toz: hafif eğik bir kuşak boyunca yoğun, yukarı çıktıkça seyrek (sabit tohum → her açılışta aynı) */
  const r = sceneRng(21);
  let dust = "";
  for (let k = 0, guard = 0; k < 300 && guard < 12000; guard++){
    const x = r() * 400, y = r() * SK_NEB_H, d = y - (300 - .3 * x);
    const p = .05 + .95 * Math.exp(-(d * d) / 2312) * Math.min(1, Math.max(0, (y - 60) / 200));
    if (r() > p) continue;
    const big = r() < .08;
    dust += `<circle cx="${f(x)}" cy="${f(y)}" r="${(big ? 1.1 + r() * 1.1 : .35 + r() * .6).toFixed(2)}" opacity="${(big ? .7 + r() * .3 : .25 + r() * .5).toFixed(2)}"/>`;
    k++;
  }
  const glints = [[150, 262, 6], [300, 222, 5], [64, 300, 5]];
  return `<svg class="sk-neb" viewBox="0 0 400 ${SK_NEB_H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>${clouds.map(([, , , , c, a], i) => grad("sk-nc" + i, c, a)).join("")}${grad("sk-nl", "--sky-bot", .9)}
      <radialGradient id="sk-ng"><stop offset="0" style="stop-color:var(--neb-dust);stop-opacity:.9"/><stop offset=".25" style="stop-color:var(--neb-dust);stop-opacity:.35"/><stop offset="1" style="stop-color:var(--neb-dust);stop-opacity:0"/></radialGradient></defs>
    <g class="sk-neb-clouds">${clouds.map((c, i) => ell(c, c[6], "sk-nc" + i)).join("")}</g>
    <g class="sk-neb-lanes">${lanes.map(l => ell(l, l[4], "sk-nl")).join("")}</g>
    <g class="sk-neb-dust">${dust}</g>
    ${glints.map(([x, y, rad], i) => `<circle class="sk-neb-sp" style="animation-delay:${-i * 1.4}s" cx="${x}" cy="${y}" r="${rad}"/>`).join("")}
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

/* ---- ışık hızı geçişi ----
   Başlayalım'a basınca: logonun merkezinden dışarı doğru uzayan yıldız çizgileri hızlanarak ekrandan çıkar,
   yıldız katmanları odaktan büyüyerek söner, gezegen yanımızdan geçer gibi büyüyüp kaybolur, nebula aşağı
   kayar, yazı ve düğme öne doğru açılarak söner; sonunda merkezde kısa bir ışık parlar ve sonraki ekran gelir.
   Yalnızca transform / opacity (Web Animations); hareket azaltmada atlanır. */
const SK_WARP_MS = 760;
function sceneWarp(done){
  const s = sceneState, bg = s && s.bg;
  if (!bg || !bg.animate || sceneReduced() || !document.body.contains(bg)){ done(); return; }
  if (s.warping) return;
  s.warping = true;
  if (s.timer){ clearTimeout(s.timer); s.timer = 0; }
  const D = SK_WARP_MS, rnd = Math.random, accel = "cubic-bezier(.4,0,.75,.55)";
  const logo = document.querySelector(".on-w .on-logo"), lr = logo && logo.getBoundingClientRect();
  const cx = lr ? lr.left + lr.width / 2 : innerWidth / 2, cy = lr ? lr.top + lr.height / 2 : innerHeight * .4;
  const far = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 60;
  const box = document.createElement("div");
  box.className = "sk-warp";
  box.style.left = cx + "px"; box.style.top = cy + "px";
  for (let i = 0; i < 110; i++){
    const el = document.createElement("i"), a = rnd() * 360, r0 = 20 + rnd() * far * .35, len = 60 + rnd() * 200, delay = rnd() * D * .6;
    el.className = i % 5 === 0 ? "w" : i % 3 === 0 ? "c" : "";
    el.style.width = len.toFixed(0) + "px";
    box.appendChild(el);
    el.animate([
      { transform:`rotate(${a.toFixed(1)}deg) translateX(${r0.toFixed(0)}px) scaleX(.05)`, opacity:0 },
      { opacity:1, offset:.15 },
      { transform:`rotate(${a.toFixed(1)}deg) translateX(${(far + len).toFixed(0)}px) scaleX(1)`, opacity:.9 }
    ], { duration:D - delay, delay, easing:accel, fill:"forwards" });
  }
  const flash = document.createElement("i");
  flash.className = "sk-flash";
  box.appendChild(flash);
  flash.animate([{ opacity:0, transform:"scale(.3)" }, { opacity:0, offset:.5 }, { opacity:.85, transform:"scale(1.4)", offset:.8 }, { opacity:0, transform:"scale(2.6)" }],
    { duration:D + 120, easing:"ease-out", fill:"forwards" });
  bg.appendChild(box);

  const anims = [];
  const run = (el, frames, opt) => { if (el) anims.push([el, el.animate(frames, { duration:D, easing:accel, fill:"forwards", ...opt })]); };
  const origin = `${cx}px ${cy}px`;
  bg.querySelectorAll(".sk-par").forEach((p, i) => {
    p.style.transformOrigin = origin;
    run(p, [{ transform:"scale(1)", opacity:1 }, { transform:`scale(${(1.5 + i * .35).toFixed(2)})`, opacity:0 }]);
  });
  run(bg.querySelector(".sk-neb"), [{ transform:"none", opacity:1 }, { transform:"translateY(22%)", opacity:0 }], { duration:D * .8, easing:"ease-in" });
  const w = document.querySelector(".on-w"), planet = w && w.querySelector(".sk-planet");
  /* gezegen kendi soluk opaklığından başlar (filigran parlamasın) */
  const pOp = planet ? getComputedStyle(planet).opacity : 1;
  run(planet, [{ transform:"scale(1)", opacity:pOp }, { transform:"scale(2.8) rotate(-6deg)", opacity:0 }]);
  run(logo, [{ transform:"scale(1)", opacity:1 }, { transform:"scale(1.16)", opacity:1, offset:.35 }, { transform:"scale(.55)", opacity:0 }]);
  run(w && w.querySelector(".on-slogan"), [{ transform:"none", opacity:1 }, { transform:"translateY(14px) scale(1.06)", opacity:0 }], { duration:D * .55, easing:"ease-in" });
  run(w && w.querySelector(".on-w-foot"), [{ transform:"none", opacity:1 }, { transform:"translateY(26px)", opacity:0 }], { duration:D * .5, easing:"ease-in" });
  const nav = document.getElementById("on-nav");
  run(nav, [{ transform:"none", opacity:1 }, { transform:"translateY(18px) scale(.96)", opacity:0 }], { duration:D * .5, easing:"ease-in" });

  setTimeout(() => {
    s.warping = false;
    done();
    /* sonraki ekran gelirken: yıldızlar yeniden belirir, kalıcı öğeler normale döner, çizgiler kalkar */
    for (const [el, a] of anims){
      if (!el.isConnected) continue;
      if (el === nav || el.classList.contains("sk-par")){
        a.cancel();
        el.animate([{ opacity:0 }, { opacity:1 }], { duration:600, easing:"ease-out" });
      } else if (el.classList.contains("sk-neb")) setTimeout(() => a.cancel(), 1300);   /* soluk geçiş bitince bırak */
    }
    setTimeout(() => box.remove(), 260);
  }, D - 60);
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
