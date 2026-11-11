"use strict";

/* ---- başlat ---- */
(async () => {
  state = await loadState();
  if (state && state.profile) {
    applyTheme(state.profile.theme);
    if (!state.profile.venue) { state.profile.venue = "gym"; await saveState(state); }
    if (migrateMeals()) await saveState(state);
    if (!state.starred){ state.starred = 1; stampAllStars(); await saveState(state); }
    const r = weeklyRefresh(state);
    if (r) { notice = r.msg; if (r.save) await saveState(state); }
  }
  render();
})();
