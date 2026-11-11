"use strict";

/* ---- ortak bölümler ---- */
function trainingSection(p, picker){
  if (p.training.none) return `<section>
    <h2>${tx("Spor programın kapalı")}</h2>
    <div class="metric-note">${tx("Program kurulu değil.")}</div>
    <button class="ghost" id="plan-on" style="margin-top:12px">${tx("Spor programı kur")}</button>
    <button class="ghost" id="own-edit" style="margin-top:8px">${tx("Kendi programını yaz")}</button>
  </section>`;
  const wd = isoWeekday(today());
  const cur = p.training.id;
  const custom = !!p.training.custom;
  const ownN = customCount(state.profile);
  const venue = custom ? (VENUE[state.profile.venue] ? state.profile.venue : "gym") : PROGRAMS[cur].venue;
  const list = Object.entries(PROGRAMS).filter(([,x]) => x.venue === venue);

  return `<section>
    <h2>${p.training.title} <span class="count">${tx("{0} gün", [(p.training.freq)])}</span></h2>
    ${picker ? `<div class="field"><label for="venue-pick">${tx("Antrenman türü")}</label>
      <select id="venue-pick">${Object.entries(VENUE).map(([k,v])=>
        `<option value="${k}"${venue===k?" selected":""}>${v.label}</option>`).join("")}</select></div>
      <div class="pills" style="margin-bottom:14px">${list.map(([k,x]) =>
        `<button class="pill${k===cur?" on":""}" data-prog="${k}" style="cursor:pointer">${tx("{0} · {1} gün", [(x.label), (x.freq)])}</button>`).join("")}</div>
      <div class="own${custom ? " on" : ""}">
        <div><b>${tx("Kendi programın")}</b><i>${ownN ? tx("{0} gün yazıldı{1}", [(ownN), (custom ? tx(" · kullanılıyor") : "")]) : tx("Gün gün hareket, set ve tekrarı sen yaz.")}</i></div>
        ${ownN && !custom ? `<button class="ghost" id="own-use">${tx("Kullan")}</button>` : ""}
        <button class="ghost" id="own-edit">${ownN ? tx("Düzenle") : tx("Yaz")}</button>
      </div>
` : ""}
    ${p.training.days.map(d => `<div class="item${picker && d.wd===wd?" today":""}">
      ${iconBox(d.icon, !d.b)}
      <div class="item-main"><h3>${WD_NAMES[d.wd]} · ${d.t}${picker && d.wd===wd?`<span class="badge">${tx("bugün")}</span>`:""}</h3>${d.b?`<p>${d.b}</p>`:""}</div>
    </div>`).join("")}
    <div class="metric-note" style="margin-top:12px">${p.training.note}<br>${p.training.cardio}</div>
    ${(state.profile.avoid || []).length ? `<div class="metric-note" style="margin-top:10px">
      ${state.profile.avoid.map(z => (AVOID_ZONES.find(x => x[0] === z) || [,z])[1]).join(" ve ")} için uyarlandı:
      o bölgeyi zorlayan hareketler daha güvenli karşılıklarıyla değişti ya da çıkarıldı. Ayarlar'dan değiştirebilirsin.</div>` : ""}
  </section>`;
}


/* ---- ana yönlendirme ---- */
function render(){
  if (!state || !state.profile) { renderOnboarding(); return; }
  ensureToday();

  const t = vKey();
  const entry = onToday() ? state.days[t] : ensureDay(t);
  const program = currentProgram();
  const allDoneNow = () => entry.tasks.length > 0 && entry.tasks.every(x => x.done);
  const wasAll = allDoneNow();
  if (syncSuggested(entry, program, t)) saveState(state);
  calcReset();   /* gün puanları bu çizim boyunca sabit kalsın */
  /* Tamamlanan gün damgalanır; sonradan hedef değişse de yıldızı durur. */
  const _s1 = stampStar(t);
  const _s2 = t !== today() ? stampStar(today()) : false;   /* kısa devre olmasın: ikisi de denensin */
  if (_s1 || _s2) { calcReset(); saveState(state); }
  const party = onToday() && !wasAll && allDoneNow() && render.ready;
  const noProgram = `<section class="welcome">
    <span class="brand-i">${BRAND_SVG}</span>
    <b>${tx("Starboard hazır")}</b>
    <i>${tx("Kilonu girdiğinde kalori hedefin ve antrenman programın burada belirir.")}</i>
    <button id="np-go">${tx("Kilonu gir")}</button>
  </section>`;
  const titles = { today: onToday() ? greetTitle() : prettyDate(t), plan:tx("Programın"), meals:tx("Beslenme"), calendar:tx("Takvim") };
  const subs = { today: onToday() ? `${prettyDate(t)} · ${weekdayName(t)}` : tx("{0} · geçmiş gün", [(weekdayName(t))]),
                 plan: planTab === "log" && !onToday() && !(program && program.training.none) ? tx("{0} antrenmanı", [(prettyDate(t))]) : "" };

  titles.settings = tx("Ben");

  /* Geçmiş gün şeridi: hangi sekmede olursan ol hangi güne yazdığın görünsün. */
  const pastBar = (!onToday() && tab !== "settings" && tab !== "calendar" && tab !== "today") ? `<div class="notice past">
    <div class="pd-t">${tx("{0} · {1} gününe yazıyorsun.", [(prettyDate(t)), (weekdayName(t))])}</div>
    <div class="pd-row">
      <button class="ghost" id="pd-prev">${tx("‹ Önceki gün")}</button>
      <button class="ghost" id="pd-next">${tx("Sonraki gün ›")}</button>
      <button class="ghost" id="back-today">${tx("Bugüne dön")}</button>
    </div></div>` : "";

  let body = "";
  if (tab === "settings"){
    const te = state.days[today()];
    body = `<div class="seg">${[["body",tx("Vücudum")],["chart",tx("Grafikler")],["set",tx("Ayarlar")]].map(([k,l]) =>
      `<button data-me-tab="${k}" aria-current="${meTab===k}">${l}</button>`).join("")}</div>`
      + (meTab === "set" ? settingsView()
       : meTab === "chart" ? chartsView()
       : bodyCard() + bodySection(te)
         + `<section><h2>${tx("Değerlendirme")}</h2>${program ? evaluate(te, state.profile, program, lastWeight()).join("")
              : `<div class="empty">${tx("Kilonu gir, hedefler hesaplansın.")}</div>`}</section>`);
  }
  else if (tab === "today") body = todayView(entry, program, t);
  else if (tab === "plan") body = program ? `<div class="seg">${[["log",tx("Kaydım")],["program",tx("Program")],["howto",tx("Nasıl yapılır")]].map(([k,l]) =>
      `<button data-plan-tab="${k}" aria-current="${planTab===k}">${l}</button>`).join("")}</div>`
      + (planTab === "howto" ? howtoView(program)
       : planTab === "log" ? trainLogView(entry, program, t)
       : trainingSection(program, true)) : noProgram;
  else if (tab === "meals") body = program ? mealsView(program) : noProgram;
  else { calTab = "cal"; body = calendarView(); }

  document.body.dataset.tab = tab;
  app.innerHTML = `
    <header>
      <div class="htext"><h1>${titles[tab]}</h1>${subs[tab]?`<div class="sub">${subs[tab]}</div>`:""}</div>
      <button class="gear${tab==="settings"?"":" me"}" id="gear" aria-label="${tab==="settings"?tx("Kapat"):tx("Ben: vücudun, grafikler ve ayarlar")}"
        ${tab==="settings"?"":`style="--av:${avColor(state.profile)}"`}>
        <svg class="ico" aria-hidden="true"><use href="#${tab==="settings"?"i-close":bodyIcon(state.profile)}"/></svg></button>
    </header>
    <main>${pastBar}${body}</main>
    <nav class="tabbar" aria-label="${tx("Sayfalar")}"><i class="tab-ind" aria-hidden="true"></i>
      ${(() => { const tb = ([k,ic,l]) => `<button data-tab="${k}" aria-current="${tab===k}">
          <svg class="ico" aria-hidden="true"><use href="#${ic}"/></svg>${l}</button>`;
        return tb(["today","i-day",tx("Bugün")]) + tb(["plan","i-plan",tx("Program")])
          + `<button class="fab" id="fab" aria-label="${tx("Hızlı giriş")}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>`
          + tb(["meals","i-grain",tx("Beslenme")]) + tb(["calendar","i-today",tx("Takvim")]); })()}
    </nav>`;

  document.getElementById("fab").onclick = openQuickSheet;
  wirePastBar(t);
  const np = document.getElementById("np-go");
  if (np) np.onclick = openQuickSheet;

  app.querySelectorAll(".tabbar button[data-tab]").forEach(b =>
    b.onclick = () => {
      const to = b.dataset.tab;
      if (to === tab){ window.scrollTo({ top:0, behavior: reduceMotion() ? "auto" : "smooth" }); return; }
      navTo(() => { tab = to; render(); window.scrollTo(0,0); }, TAB_ORDER.indexOf(to) > TAB_ORDER.indexOf(tab) ? 1 : -1);
    });

  document.getElementById("gear").onclick = () => {
    const to = tab === "settings" ? "today" : "settings";
    navTo(() => { tab = to; render(); window.scrollTo(0,0); }, to === "settings" ? 1 : -1);
  };

  if (tab === "settings"){
    app.querySelectorAll("[data-me-tab]").forEach(b => b.onclick = () => {
      if (b.dataset.meTab === meTab) return;
      navTo(() => { meTab = b.dataset.meTab; render(); window.scrollTo(0,0); }, segDir(b), "k-seg");
    });
    if (meTab === "set") wireSettings();
    if (meTab === "body"){ wireHome(); wireBody(state.days[today()]); }
  }
  if (tab === "today") wireToday(entry, program, t);
  wireCharts();
  /* Sekme değişince içerik kayarak gelsin; aynı sekmede veri girişi
     sayfayı yeniden çizdiğinde animasyon tekrarlanmasın. */
  const mainEl = app.querySelector("main");
  const prevTab = render.lastTab;
  if (mainEl && (prevTab !== tab || navDir)){
    mainEl.classList.add("page-in");
    if (navDir < 0) mainEl.classList.add("rev");
    if (navKeep) mainEl.classList.add(navKeep);
    if (prevTab !== tab) app.querySelector("header")?.classList.add("page-in");
    render.lastTab = tab;
  }
  const entered = !!(mainEl && mainEl.classList.contains("page-in"));
  navDir = 0; navKeep = "";
  tabIndicator(prevTab);
  motionAfter(mainEl, entered);
  animateCounts();

  render.ready = true;
  if (party) celebrate();
  if (tab === "calendar") {
    app.querySelectorAll("[data-cal-tab]").forEach(b => b.onclick = () => {
      calTab = b.dataset.calTab; render(); window.scrollTo(0,0);
    });
    if (calTab === "cal") wireCalendar();
  }
  if (tab === "meals" && program) wireMeals(entry);
  if (tab === "plan") {
    app.querySelectorAll("[data-plan-tab]").forEach(b => b.onclick = () => {
      if (b.dataset.planTab === planTab) return;
      navTo(() => { planTab = b.dataset.planTab; render(); window.scrollTo(0,0); }, segDir(b), "k-seg");
    });
    if (planTab === "howto") wireHowto();
    if (planTab === "log"){ wireLifts(entry, t); wireFree(t); wireFolds(); }
    const po = document.getElementById("plan-on");
    if (po) po.onclick = async () => {
      delete state.profile.noPlan;
      if (!state.profile.days || !state.profile.days.length)
        state.profile.days = OB_DEFAULT_DAYS(state.profile.activity);
      state.profile.programId = defaultProgramId(state.profile.venue || "gym",
        state.profile.activity, state.profile.days);
      await saveState(state); render(); window.scrollTo(0,0);
      toast(tx("Program kuruldu. Günleri Ayarlar'dan değiştirebilirsin."));
    };
    const oe = document.getElementById("own-edit");
    if (oe) oe.onclick = openProgramEditor;
    const ou = document.getElementById("own-use");
    if (ou) ou.onclick = async () => {
      state.profile.programId = "custom"; delete state.profile.noPlan;
      await saveState(state); render();
      toast(tx("Kendi programın kullanılıyor."));
    };
    const pick = document.getElementById("venue-pick");
    if (pick) pick.onchange = async () => {
      state.profile.venue = pick.value;
      state.profile.programId = defaultProgramId(pick.value, state.profile.activity, state.profile.days);
      await saveState(state); render();
    };
    app.querySelectorAll("[data-prog]").forEach(b => b.onclick = async () => {
      state.profile.programId = b.dataset.prog;
      state.profile.venue = PROGRAMS[b.dataset.prog].venue;
      await saveState(state); render();
    });
  }
}
