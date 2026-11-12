"use strict";

/* ---- başlat ---- */
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
  /* Güncellemeden sonra bir kez: neler yeni. Uyarı (notice) varsa önce o okunsun. */
  if (!notice) maybeShowWhatsNew();
  rescheduleSoon();
})();
