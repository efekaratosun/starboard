"use strict";

/* ---------------- hatırlatmalar (iOS) ----------------
   Yalnızca iPhone uygulamasında: web sitesi arka planda bildirim gönderemez.
   Ayar: state.profile.reminders = { water, train, sleep, weigh, eve, waterAt, trainAt, weighAt, eveAt, sleepAt }
   İlk beşi açık/kapalı (yoksa hepsi kapalı). Saatler "HH:MM"; yazılmamışsa REMIND_DEFAULTS
   geçerlidir. waterAt dört saatlik bir dizidir, boş bırakılan saat kullanılmaz. sleepAt yoksa
   uyku hatırlatması tipik yatma saatinden 30 dakika önceye otomatik kurulur.

   Bildirimler cihazda zamanlanır, sunucu yoktur. Uygulama her açıldığında ve kayıt
   değiştiğinde önümüzdeki 7 günün bildirimleri baştan kurulur: o gün su hedefine
   ulaştıysan su, tartıldıysan tartı hatırlatması atlanır. iOS en fazla 64 bekleyen
   bildirim tutar; burada en fazla 7 × 8 = 56 olur.

   Hesap (reminderPlan) metin dışında kayıttan bağımsızdır ve web'de test edilir;
   zamanlama (scheduleReminders) yalnızca yerelde çalışır. */
const REMINDER_KINDS = ["water", "train", "sleep", "weigh", "eve"];
const REMIND_DEFAULTS = { waterAt:["10:00", "13:00", "16:00", "19:00"], trainAt:"18:00", weighAt:"08:00", eveAt:"21:00" };
const remindersOf = p => (p && p.reminders) || {};
const anyReminder = p => REMINDER_KINDS.some(k => remindersOf(p)[k]);

/* "18:00" -> 1080 dakika */
const hmToMin = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(s || ""); return m ? (+m[1] % 24) * 60 + (+m[2] % 60) : null; };

/* 1080 -> "18:00" */
const minToHm = m => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/* Ayardaki saatler dakika olarak; sleep null ise otomatik. */
function remindTimes(R){
  const water = (Array.isArray(R.waterAt) ? R.waterAt : REMIND_DEFAULTS.waterAt).slice(0, 4);
  return {
    water: water.map(hmToMin).filter(x => x !== null),
    train: hmToMin(R.trainAt) ?? hmToMin(REMIND_DEFAULTS.trainAt),
    weigh: hmToMin(R.weighAt) ?? hmToMin(REMIND_DEFAULTS.weighAt),
    eve:   hmToMin(R.eveAt)   ?? hmToMin(REMIND_DEFAULTS.eveAt),
    sleep: hmToMin(R.sleepAt)
  };
}
/* Otomatik uyku hatırlatması: tipik yatma saatinden 30 dakika önce. */
const autoSleepAt = st => (typicalBedtime(st.days || {}, sleepMinOf(st.profile)) - 30 + 1440) % 1440;

/* Tipik yatma saati (dakika): son 14 kaydın ortancası; kayıt yoksa uyku hedefinden. */
function typicalBedtime(days, sleepMinH){
  const beds = Object.keys(days).sort().slice(-14).map(k => days[k]).filter(d => typeof d.bed === "number")
    .map(d => { const b = ((d.bed % 1440) + 1440) % 1440; return b < 720 ? b + 1440 : b; }).sort((a, b) => a - b);
  if (beds.length) return beds[Math.floor(beds.length / 2)] % 1440;
  return ((420 - Math.round((sleepMinH + 0.5) * 60)) % 1440 + 1440) % 1440;   /* 07:00'de kalkış */
}

/* Önümüzdeki 7 günün bildirimleri: [{ id, at: Date, kind, title, body }], saate göre sıralı.
   now: Date (testler sabit bir an verir). */
function reminderPlan(st, program, now){
  const R = remindersOf(st.profile);
  if (!anyReminder(st.profile)) return [];
  const out = [];
  const t0 = dayKey(now);
  const T = remindTimes(R);
  const sleepAt = T.sleep ?? autoSleepAt(st);
  for (let d = 0; d < 7; d++){
    const k = shiftDays(t0, d), e = (st.days || {})[k] || {};
    const at = min => { const x = new Date(k + "T00:00:00"); x.setMinutes(min); return x; };
    const add = (slot, min, kind, title, body) => {
      const when = at(min);
      if (when > now) out.push({ id: (d + 1) * 10 + slot, at: when, kind, title, body });
    };
    if (R.weigh && typeof e.weight !== "number")
      add(0, T.weigh, "weigh", tx("Sabah tartısı"), tx("Kahvaltıdan önce tartılıp kilonu gir."));
    if (R.water && program && !((e.water || 0) >= program.water * 0.9))
      T.water.forEach((m, i) => add(1 + i, m, "water", tx("Su içme vakti"),
        tx("Bugünkü hedefin {0}.", [(fmtV(program.water))])));
    if (R.train && program && !program.training.none){
      const ses = program.training.days.find(x => x.wd === isoWeekday(k));
      if (ses && ses.b) add(5, T.train, "train", tx("Antrenman günü"), exText(ses.t));
    }
    if (R.eve) add(6, T.eve, "eve", tx("Günü kapat"), tx("Bugünün eksiklerine bir bak."));
    if (R.sleep) add(7, sleepAt, "sleep", tx("Yatma vakti yaklaşıyor"),
      tx("Hedefin {0}-{1} saat uyku.", [(sleepMinOf(st.profile)), (sleepMinOf(st.profile) + 2)]));
  }
  return out.sort((a, b) => a.at - b.at);
}
const sleepMinOf = p => (p && p.sleepMin) || 7;

/* ---- zamanlama (yalnızca iPhone) ---- */
let remindTimer = null;
async function scheduleReminders(){
  const LN = nativePlugin("LocalNotifications");
  if (!LN || !state || !state.profile) return;
  try {
    const pending = await LN.getPending();
    if (pending && pending.notifications && pending.notifications.length)
      await LN.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
    const plan = reminderPlan(state, currentProgram(), new Date());
    if (plan.length)
      await LN.schedule({ notifications: plan.map(n => ({ id: n.id, title: n.title, body: n.body, schedule: { at: n.at } })) });
  } catch(e){ /* izin yoksa ya da eklenti hata verirse sessizce geç */ }
}
/* Kayıt değişince ve uygulama öne gelince yeniden kur; art arda değişikliklerde bir kez. */
function rescheduleSoon(){
  if (!IS_NATIVE) return;
  clearTimeout(remindTimer);
  remindTimer = setTimeout(scheduleReminders, 1500);
}
if (IS_NATIVE) document.addEventListener("visibilitychange", () => { if (!document.hidden) rescheduleSoon(); });

/* Bildirim izni: bir hatırlatma açılınca istenir. Verilmezse false döner. */
async function askNotifyPermission(){
  const LN = nativePlugin("LocalNotifications");
  if (!LN) return false;
  try {
    const r = await LN.requestPermissions();
    return r && r.display === "granted";
  } catch(e){ return false; }
}

/* ---- ayarlar bölümü ---- */
const REMINDER_LABELS = () => ({
  water: tx("Su"), train: tx("Antrenman günleri"), sleep: tx("Yatma vakti"),
  weigh: tx("Sabah tartısı"), eve: tx("Günü kapat")
});
/* Açık olan her hatırlatmanın altında saati: su için dört kutu (boş bırakılan kullanılmaz),
   uyku için otomatik ya da elle seçilen saat. */
function remindersSection(){
  if (!IS_NATIVE) return "";
  const R = remindersOf(state.profile), L = REMINDER_LABELS(), T = remindTimes(R);
  const time = (id, label, val) => `<div class="field rm-f"><label for="${id}">${label}</label>
    <input id="${id}" type="time" value="${val}"></div>`;
  const water = Array.isArray(R.waterAt) ? R.waterAt : REMIND_DEFAULTS.waterAt;
  const rows = [];
  if (R.water) rows.push(`<label>${tx("Su hatırlatma saatleri")}</label>
    <div class="rm-water">${[0, 1, 2, 3].map(i => `<input type="time" data-rm-water="${i}" value="${water[i] || ""}" aria-label="${tx("Su hatırlatması {0}", [(i + 1)])}">`).join("")}</div>
    <div class="metric-note" style="margin:6px 0 12px">${tx("İstemediğin saati sil; o gün su hedefine ulaşınca susar.")}</div>`);
  if (R.train) rows.push(time("rm-train", tx("Antrenman hatırlatma saati"), minToHm(T.train)));
  if (R.sleep) rows.push(time("rm-sleep", tx("Yatma vakti hatırlatma saati"), minToHm(T.sleep ?? autoSleepAt(state)))
    + `<div class="metric-note" style="margin:-6px 0 12px">${T.sleep === null ? tx("Otomatik: yatma saatinden 30 dk önce.")
      : `<button class="link" id="rm-sleep-auto">${tx("Otomatiğe dön")}</button>`}</div>`);
  if (R.weigh) rows.push(time("rm-weigh", tx("Tartı hatırlatma saati"), minToHm(T.weigh)));
  if (R.eve) rows.push(time("rm-eve", tx("Günü kapatma saati"), minToHm(T.eve)));
  return `<section>
    <h2>${tx("Hatırlatmalar")}</h2>
    <div class="chips">${REMINDER_KINDS.map(k =>
      `<button class="chip${R[k] ? " sel" : ""}" data-remind="${k}" aria-pressed="${!!R[k]}">${L[k]}</button>`).join("")}</div>
    ${rows.length ? `<div style="margin-top:16px">${rows.join("")}</div>` : ""}
  </section>`;
}
function wireReminders(){
  const setR = async (patch, redraw) => {
    const R = { ...remindersOf(state.profile), ...patch };
    for (const k of Object.keys(R)) if (R[k] === undefined) delete R[k];
    state.profile.reminders = R;
    await saveState(state);
    if (redraw) render();
  };
  app.querySelectorAll("[data-remind]").forEach(b => b.onclick = async () => {
    const k = b.dataset.remind, on = !!remindersOf(state.profile)[k];
    if (!on && !(await askNotifyPermission())){
      toast(tx("Bildirim izni verilmedi. iPhone Ayarlar › Starboard › Bildirimler'den açabilirsin.")); return;
    }
    await setR({ [k]: on ? undefined : true }, true);
  });
  const bind = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.onchange = () => { if (hmToMin(el.value) !== null) setR({ [key]: el.value }); };
  };
  bind("rm-train", "trainAt"); bind("rm-sleep", "sleepAt"); bind("rm-weigh", "weighAt"); bind("rm-eve", "eveAt");
  const auto = document.getElementById("rm-sleep-auto");
  if (auto) auto.onclick = () => setR({ sleepAt: undefined }, true);
  app.querySelectorAll("[data-rm-water]").forEach(el => el.onchange = () => {
    const w = (Array.isArray(remindersOf(state.profile).waterAt) ? remindersOf(state.profile).waterAt : REMIND_DEFAULTS.waterAt).slice();
    w[+el.dataset.rmWater] = hmToMin(el.value) === null ? "" : el.value;
    setR({ waterAt: w });
  });
}
