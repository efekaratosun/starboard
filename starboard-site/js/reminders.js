"use strict";

/* ---------------- hatırlatmalar (iOS) ----------------
   Yalnızca iPhone uygulamasında: web sitesi arka planda bildirim gönderemez.
   Ayar: state.profile.reminders = { water, train, sleep, weigh, eve, trainAt:"18:00" }
   (her biri açık/kapalı; yoksa hepsi kapalı).

   Bildirimler cihazda zamanlanır, sunucu yoktur. Uygulama her açıldığında ve kayıt
   değiştiğinde önümüzdeki 7 günün bildirimleri baştan kurulur: o gün su hedefine
   ulaştıysan su, tartıldıysan tartı hatırlatması atlanır. iOS en fazla 64 bekleyen
   bildirim tutar; burada en fazla 7 × 8 = 56 olur.

   Hesap (reminderPlan) metin dışında kayıttan bağımsızdır ve web'de test edilir;
   zamanlama (scheduleReminders) yalnızca yerelde çalışır. */
const REMINDER_KINDS = ["water", "train", "sleep", "weigh", "eve"];
const WATER_HOURS = [10, 13, 16, 19];
const remindersOf = p => (p && p.reminders) || {};
const anyReminder = p => REMINDER_KINDS.some(k => remindersOf(p)[k]);

/* "18:00" -> 1080 dakika */
const hmToMin = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(s || ""); return m ? (+m[1] % 24) * 60 + (+m[2] % 60) : null; };

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
  const bed = typicalBedtime(st.days || {}, sleepMinOf(st.profile));
  const trainAt = hmToMin(R.trainAt) ?? 18 * 60;
  for (let d = 0; d < 7; d++){
    const k = shiftDays(t0, d), e = (st.days || {})[k] || {};
    const at = min => { const x = new Date(k + "T00:00:00"); x.setMinutes(min); return x; };
    const add = (slot, min, kind, title, body) => {
      const when = at(min);
      if (when > now) out.push({ id: (d + 1) * 10 + slot, at: when, kind, title, body });
    };
    if (R.weigh && typeof e.weight !== "number")
      add(0, 8 * 60, "weigh", tx("Sabah tartısı"), tx("Kahvaltıdan önce tartılıp kilonu gir."));
    if (R.water && program && !((e.water || 0) >= program.water * 0.9))
      WATER_HOURS.forEach((h, i) => add(1 + i, h * 60, "water", tx("Su içme vakti"),
        tx("Bugünkü hedefin {0}.", [(fmtV(program.water))])));
    if (R.train && program && !program.training.none){
      const ses = program.training.days.find(x => x.wd === isoWeekday(k));
      if (ses && ses.b) add(5, trainAt, "train", tx("Antrenman günü"), exText(ses.t));
    }
    if (R.eve) add(6, 21 * 60, "eve", tx("Günü kapat"), tx("Bugünün eksiklerine bir bak."));
    if (R.sleep) add(7, bed - 30 < 0 ? bed - 30 + 1440 : bed - 30, "sleep", tx("Yatma vakti yaklaşıyor"),
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
  water: tx("Su (10:00, 13:00, 16:00, 19:00)"),
  train: tx("Antrenman günleri"),
  sleep: tx("Yatma vaktinden 30 dk önce"),
  weigh: tx("Sabah tartısı (08:00)"),
  eve: tx("Günü kapat (21:00)")
});
function remindersSection(){
  if (!IS_NATIVE) return "";
  const R = remindersOf(state.profile), L = REMINDER_LABELS();
  return `<section>
    <h2>${tx("Hatırlatmalar")}</h2>
    <div class="chips">${REMINDER_KINDS.map(k =>
      `<button class="chip${R[k] ? " sel" : ""}" data-remind="${k}" aria-pressed="${!!R[k]}">${L[k]}</button>`).join("")}</div>
    ${R.train ? `<div class="field" style="margin-top:14px"><label for="rm-train">${tx("Antrenman hatırlatma saati")}</label>
      <input id="rm-train" type="time" value="${R.trainAt || "18:00"}"></div>` : ""}
  </section>`;
}
function wireReminders(){
  app.querySelectorAll("[data-remind]").forEach(b => b.onclick = async () => {
    const p = state.profile, k = b.dataset.remind;
    p.reminders = { ...remindersOf(p) };
    if (!p.reminders[k]){
      if (!(await askNotifyPermission())){ toast(tx("Bildirim izni verilmedi. iPhone Ayarlar › Starboard › Bildirimler'den açabilirsin.")); return; }
      p.reminders[k] = true;
    } else delete p.reminders[k];
    await saveState(state); render();
  });
  const t = document.getElementById("rm-train");
  if (t) t.onchange = async () => {
    if (hmToMin(t.value) === null) return;
    state.profile.reminders = { ...remindersOf(state.profile), trainAt: t.value };
    await saveState(state);
  };
}
