"use strict";

/* ---- ayarlar ---- */
function settingsView(){
  const p = state.profile;
  const sel = (v, k) => v === k ? " selected" : "";
  const routines = state.routines || [];

  return `
  <section>
    <h2>${tx("Profil")}</h2>
    <div class="field"><label for="s-nm">${tx("Adın")}</label><input id="s-nm" type="text" value="${esc(p.name || "")}" placeholder="${tx("Seni nasıl selamlayalım?")}" autocomplete="given-name"></div>
    <div class="row">
      <div class="field"><label for="s-h">${tx("Boy (cm)")}</label><input id="s-h" type="number" inputmode="decimal" value="${p.height}"></div>
      <div class="field"><label for="s-age">${tx("Yaş")}</label><input id="s-age" type="number" inputmode="numeric" value="${p.age}"></div>
    </div>
    <div class="field"><label for="s-tw">${tx("Hedef kilo (kg)")}</label>
      <input id="s-tw" type="number" inputmode="decimal" value="${p.targetWeight ?? ""}" placeholder="${tx("isteğe bağlı")}"></div>
    <div class="field"><label for="s-bf">${tx("Yağ oranı (%)")}</label>
      <input id="s-bf" type="number" inputmode="decimal" value="${p.bodyFat ?? ""}" placeholder="${tx("bilmiyorsan boş")}"></div>
    <div class="field"><label for="s-sex">${tx("Cinsiyet")}</label>
      <select id="s-sex"><option value="male"${sel(p.sex,"male")}>${tx("Erkek")}</option><option value="female"${sel(p.sex,"female")}>${tx("Kadın")}</option><option value="none"${sel(p.sex,"none")}>${tx("Belirtmek istemiyorum")}</option></select></div>
    <div class="field" id="s-av-field" style="--av:${avColor(p)}"><label>${tx("Avatarın")}</label>${avatarPicker(avKey(p),"st")}
      <div style="margin-top:10px">${colorPicker(avColor(p),"st")}</div></div>
    <div class="field"><label for="s-act">${tx("Aktivite seviyesi")}</label>
      <select id="s-act">${Object.entries(ACTIVITY).map(([k,v])=>`<option value="${k}"${sel(p.activity,k)}>${v.label} (${v.d})</option>`).join("")}</select></div>
    <div class="field"><label for="s-goal">${tx("Hedef")}</label>
      <select id="s-goal">${Object.entries(GOAL).map(([k,v])=>`<option value="${k}"${sel(p.goal,k)}>${v.label}</option>`).join("")}</select></div>
    <button id="s-save">${tx("Kaydet")}</button>
  </section>

  <section>
    <h2>${tx("Kişiselleştirme")}</h2>
    <label>${tx("Dil")}</label>
    <div class="chips">${LANGS.map(([k,l]) =>
      `<button class="chip${LANG === k ? " sel" : ""}" data-slang="${k}">${l}</button>`).join("")}</div>
    <div style="height:16px"></div>
    <label>${tx("Tema")}</label>
    <div class="chips">${THEMES.map(([k,l]) =>
      `<button class="chip${(p.theme || "auto") === k ? " sel" : ""}" data-sth="${k}">${l}</button>`).join("")}</div>
    <div style="height:16px"></div>
    <label>${tx("Spor programı")}</label>
    <div class="chips">
      <button class="chip${p.noPlan ? "" : " sel"}" data-splan="on">${tx("Açık")}</button>
      <button class="chip${p.noPlan ? " sel" : ""}" data-splan="off">${tx("Kapalı")}</button>
    </div>
    <div style="height:16px"></div>
    ${p.noPlan ? "" : `
    <label>${tx("Antrenman günlerin")}</label>
    <div class="chips">${[1,2,3,4,5,6,7].map(n =>
      `<button class="chip${(p.days || []).includes(n) ? " sel" : ""}" data-sday="${n}">${WD_SHORT[n]}</button>`).join("")}</div>
    <div class="metric-note" style="margin:8px 0 16px">${(p.days || []).length >= 3 ? dayNote(p.venue || "gym", p.activity, p.days) : tx("Gün seçilmemiş.")}</div>`}
    <label>${tx("Kaçındığın yerler")}</label>
    <div class="chips">${AVOID_ZONES.map(([k,l]) =>
      `<button class="chip${(p.avoid || []).includes(k) ? " sel" : ""}" data-savoid="${k}">${l}</button>`).join("")}</div>
    <div style="height:16px"></div>
    <label>${tx("Uyku hedefin")}</label>
    <div class="chips">${[6,7,8,9].map(n =>
      `<button class="chip${sleepMin() === n ? " sel" : ""}" data-ssleep="${n}">${tx("{0}-{1} saat", [(n), (n+2)])}</button>`).join("")}</div>
  </section>

  <section>
    <h2>${tx("Tekrar eden görevler")} <span class="count">${routines.length}</span></h2>
    ${routines.length ? routines.map(r => `<div class="rt">${iconBox("repeat")}
      <div class="m"><h3>${esc(r.title)}</h3><p>${r.days.length === 7 ? tx("Her gün") : r.days.map(d => WD_SHORT[d]).join(", ")}</p></div>
      <button class="del" data-rt-del="${r.id}" aria-label="${tx("Sil")}">×</button></div>`).join("")
      : `<div class="empty">${tx("Her gün tekrarlanmasını istediğin görevleri buraya ekle: ilaç, vitamin, yürüyüş.")}</div>`}
    <div class="field" style="margin-top:14px"><label for="rt-title">${tx("Yeni tekrar eden görev")}</label>
      <input id="rt-title" type="text" placeholder="${tx("Örn. D vitamini al")}"></div>
    <div class="chips" style="margin-bottom:12px">
      ${[1,2,3,4,5,6,7].map(d => `<button class="chip sel" data-rt-day="${d}">${WD_SHORT[d]}</button>`).join("")}
    </div>
    <button class="ghost" id="rt-add">${tx("Ekle")}</button>
  </section>

  <section>
    <h2>${tx("Kalori düzeltmesi")}</h2>
    <div class="macro"><span class="lbl">${tx("Haftalık yenilemenin biriktirdiği fark")}</span>
      <span class="v num">${(state.adjustment||0) > 0 ? "+" : ""}${state.adjustment||0} kcal</span></div>
    <button class="ghost" id="s-reset-adj" style="margin-top:12px">${tx("Düzeltmeyi sıfırla")}</button>
  </section>

  <section>
    <h2>${tx("Yedekleme")}</h2>
    <button class="ghost" id="s-export">${tx("JSON olarak indir")}</button>
    <div class="field" style="margin-top:14px"><label for="s-import">${tx("Yedekten geri yükle")}</label>
      <input id="s-import" type="file" accept="application/json,.json"></div>
    <div class="metric-note" id="imp-status">${tx("Ayda bir yedek al.")}</div>
  </section>

  <div class="brand-foot">
    <span class="brand-i">${BRAND_SVG}</span>
    <div><b>${tx("Starboard")}</b><i>${tx("Sürüm {0} · veriler yalnızca bu cihazda saklanır, hiçbir yere gönderilmez.", [(APP_VERSION)])}</i></div>
  </div>
  <div class="foot"><button class="link" id="reset">${tx("Tüm verileri sil")}</button></div>`;
}

function wireSettings(){
  let stAvatar = state.profile.avatar, stColor = state.profile.avColor;
  wireAvatar("st", k => { stAvatar = k; });
  document.getElementById("s-sex").onchange = ev => {
    /* avatar seçilmemişse cinsiyete göre varsayılan renge geç */
    if (!state.profile.avColor && !stColor) document.getElementById("s-av-field").style.setProperty("--av", avColor({ sex: ev.target.value }));
  };
  wireColor("st", c => { stColor = c; document.getElementById("s-av-field").style.setProperty("--av", c); });
  document.getElementById("s-save").onclick = async () => {
    const p = state.profile;
    const h = num(document.getElementById("s-h").value);
    const a = num(document.getElementById("s-age").value);
    if (h && h > 100 && h < 250) p.height = h;
    if (a && a > 10 && a < 100) p.age = a;
    p.bodyFat = num(document.getElementById("s-bf").value);
    p.name = document.getElementById("s-nm").value.trim().slice(0, 30) || undefined;
    const tw = num(document.getElementById("s-tw").value);
    if (tw && tw >= 30 && tw <= 300) p.targetWeight = Math.round(tw * 10) / 10; else delete p.targetWeight;
    p.sex = document.getElementById("s-sex").value;
    if (stAvatar) p.avatar = stAvatar;
    if (stColor) p.avColor = stColor;
    p.activity = document.getElementById("s-act").value;
    p.goal = document.getElementById("s-goal").value;
    await saveState(state);
    tab = "today"; render(); window.scrollTo(0,0);
  };

  const save = async () => { await saveState(state); render(); };
  app.querySelectorAll("[data-slang]").forEach(b => b.onclick = () => setLang(b.dataset.slang));
  app.querySelectorAll("[data-sth]").forEach(b => b.onclick = () => {
    openThemeSheet(b.dataset.sth, async t => {
      state.profile.theme = t; applyTheme(t); await save();
    });
  });
  app.querySelectorAll("[data-ssleep]").forEach(b => b.onclick = async () => {
    state.profile.sleepMin = Number(b.dataset.ssleep); await save();
  });
  app.querySelectorAll("[data-splan]").forEach(b => b.onclick = async () => {
    const off = b.dataset.splan === "off";
    if (off) state.profile.noPlan = true;
    else {
      delete state.profile.noPlan;
      if (!state.profile.days || !state.profile.days.length)
        state.profile.days = OB_DEFAULT_DAYS(state.profile.activity);
      state.profile.programId = defaultProgramId(state.profile.venue || "gym",
        state.profile.activity, state.profile.days);
    }
    await saveState(state); render();
  });
  app.querySelectorAll("[data-savoid]").forEach(b => b.onclick = async () => {
    const p2 = state.profile, z = b.dataset.savoid;
    p2.avoid = p2.avoid || [];
    const i = p2.avoid.indexOf(z);
    if (i >= 0) p2.avoid.splice(i, 1); else p2.avoid.push(z);
    await save();
  });
  app.querySelectorAll("[data-sday]").forEach(b => b.onclick = async () => {
    const p2 = state.profile, n = Number(b.dataset.sday);
    p2.days = (p2.days || []).slice();
    const i = p2.days.indexOf(n);
    if (i >= 0){
      if (p2.days.length <= 3){ toast(tx("En az 3 antrenman günü gerekli.")); return; }
      p2.days.splice(i, 1);
    } else {
      if (p2.days.length >= 5){ toast(tx("En fazla 5 gün seçebilirsin.")); return; }
      p2.days.push(n);
    }
    p2.days.sort((a, b2) => a - b2);
    /* Gün sayısı değiştiyse aynı ortamda uygun frekanslı programa geç. */
    const cur = PROGRAMS[p2.programId];
    if (p2.programId !== "custom" && (!cur || cur.freq !== p2.days.length)) p2.programId = defaultProgramId(p2.venue, p2.activity, p2.days);
    await save();
  });

  const days = new Set([1,2,3,4,5,6,7]);
  app.querySelectorAll("[data-rt-day]").forEach(b => b.onclick = () => {
    const d = Number(b.dataset.rtDay);
    if (days.has(d)) { days.delete(d); b.classList.remove("sel"); }
    else { days.add(d); b.classList.add("sel"); }
  });

  document.getElementById("rt-add").onclick = async () => {
    const el = document.getElementById("rt-title");
    const title = el.value.trim();
    if (!title || !days.size) return;
    state.routines = state.routines || [];
    state.routines.push({ id: Date.now()+Math.random(), title, days:[...days].sort() });
    /* Bugün de geçerliyse hemen listeye düşsün. */
    const entry = state.days[today()];
    if (entry && [...days].includes(isoWeekday(today())))
      entry.tasks.push({ id: Date.now()+Math.random(), title, done:false, suggested:false, rt:true });
    el.value = "";
    await saveState(state); render();
  };

  app.querySelectorAll("[data-rt-del]").forEach(b => b.onclick = async () => {
    state.routines = (state.routines || []).filter(r => String(r.id) !== b.dataset.rtDel);
    await saveState(state); render();
  });

  document.getElementById("s-reset-adj").onclick = async () => {
    state.adjustment = 0; state.lastRefreshAt = null;
    await saveState(state); render();
  };

  document.getElementById("s-export").onclick = () => exportData(document.getElementById("imp-status"));
  document.getElementById("s-import").onchange = (ev) => {
    const f = ev.target.files && ev.target.files[0];
    if (f) importData(f, document.getElementById("imp-status"));
  };

  document.getElementById("reset").onclick = async () => {
    if (!confirm(tx("Tüm veriler silinecek. Emin misin?"))) return;
    state = null; notice = null; tab = "today";
    await clearState();      /* eski adla duran kayıt da silinir, yoksa bir sonraki açılışta geri gelirdi */
    render();
  };
}
