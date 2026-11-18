"use strict";

/* ---- başlat ---- */
/* Sürüm etiketi: her ekranın sağ üst köşesinde küçük ve soluk yazar. Gövdeye
   bir kez eklenir; sekme değişiminde #app yeniden çizilse de etiket durur,
   dokunmaları engellemez (pointer-events none), ekran okuyucu onu atlar
   (aria-hidden). Görünümü CSS'teki .ver-badge kuralındadır. */
function mountVersionBadge(){
  if (document.getElementById("ver-badge")) return;
  const el = document.createElement("div");
  el.id = "ver-badge";
  el.className = "ver-badge";
  el.style.top = "calc(env(safe-area-inset-top, 0px) + 2px)";
  el.style.right = "calc(env(safe-area-inset-right, 0px) + 16px)";
  el.style.bottom = "auto";
  el.setAttribute("aria-hidden", "true");
  el.textContent = tx("Sürüm {0}", [APP_VERSION]);
  document.body.appendChild(el);
}

(async () => {
  state = await loadState();
  if (state && state.profile) {
    applyTheme(state.profile.theme);
    const m = migrateState(state);
    if (m.newer) {
      /* Kayıt daha yeni bir sürümle yazılmış (eski sayfa önbellekten açılmış olabilir).
         Biçimine dokunmadan göster; güncel sürüm açılınca sorun kalmaz. */
      notice = tx("Bu kayıt uygulamanın daha yeni bir sürümüyle yazılmış. Sayfayı yenileyip güncel sürümü aç.");
    } else {
      let dirty = m.changed || loadedFromOldKey;
      /* Onarım: kayıtlarda geçen ama listede olmayan öğünleri geri kazandırır. */
      if (migrateMeals()) dirty = true;
      const r = weeklyRefresh(state);
      if (r) { notice = r.msg; if (r.save) dirty = true; }
      if (dirty) await saveState(state);
    }
  }
  render();
  mountVersionBadge();
  /* Güncellemeden sonra bir kez: neler yeni. Uyarı (notice) olsun da olmasun da
     sırasını alır; hafta kapanışı ondan sonra gelir, ikisi aynı anda açılmaz. */
  openWelcomeChain();
  rescheduleSoon();
  healthSoon();
})();
