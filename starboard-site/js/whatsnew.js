"use strict";

/* ---------------- yenilikler ----------------
   Uygulama güncellendikten sonraki ilk açılışta, kullanıcının henüz görmediği
   sürümlerin kısa maddeleri bir kez gösterilir. Görülen sürüm state.seenVersion'a
   yazılır. Yeni kullanıcıya gösterilmez (ilk girişte seenVersion güncel sürüm olur).
   Yeni bir sürümde kullanıcının fark edeceği bir şey varsa buraya en üste eklenir;
   ayrıntılı liste CHANGELOG.md'dedir. Maddeler kısa tutulur. */
const WHATS_NEW = [
  /* Aynı sürümün birden çok kaydı olabilir; gösterilirken tek başlık altında birleşir. */
  { v:"1.9.0", items:[
    tx("Kendi yiyeceklerini düzenle ya da sil: Beslenme › Günlüğüm › Besin ekle › Kendi yiyeceklerim.")] },
  /* native: yalnızca iPhone uygulamasında gösterilir (web'de bu özellik yok). */
  { v:"1.9.0", native:true, items:[
    tx("Paketli ürünlerin barkodunu okut, besin değerleri Open Food Facts'ten gelsin: Beslenme › Günlüğüm › Besin ekle › Barkod okut.")] },
  { v:"1.8.0", items:[
    tx("Alışveriş listesi: Beslenme › Liste. Öneri planından ve seçtiğin tariflerden oluşur."),
    tx("Antrenman modunda setler arası dinlenme sayacı."),
    tx("Ayarlar › Hakkında: sağlık uyarısı, hesapların kaynakları ve gizlilik.")] },
  { v:"1.7.0", items:[
    tx("Kayıtlı öğünler: sık yediğin öğünü kaydet, tek dokunuşla ekle."),
    tx("Grafiklerde haftalık beslenme özeti.")] },
  { v:"1.6.0", items:[
    tx("Mutfak seçimi: Türk ya da uluslararası; yeni besinler ve tarifler.")] },
  { v:"1.5.0", items:[
    tx("Birim seçimi: kg ya da lb, cm ya da ft·in, ml ya da fl oz.")] }
];

/* "1.10.0" > "1.9.2" gibi sürüm karşılaştırması */
const verCmp = (a, b) => {
  const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
  return 0;
};

/* Gösterilecek sürümler. Kayıtta seenVersion yoksa (bu özellikten önce başlamış
   kullanıcı) son üç sürüm gösterilir. */
function unseenNews(seen){
  const list = [];
  for (const n of WHATS_NEW){
    if (verCmp(n.v, APP_VERSION) > 0 || (n.native && !IS_NATIVE)) continue;
    const same = list.find(x => x.v === n.v);
    if (same) same.items = same.items.concat(n.items); else list.push({ v:n.v, items:n.items.slice() });
  }
  return (seen ? list.filter(n => verCmp(n.v, seen) > 0) : list.slice(0, 3));
}

function maybeShowWhatsNew(){
  if (!state || !state.profile || state.seenVersion === APP_VERSION) return;
  const news = unseenNews(state.seenVersion);
  const done = async () => { state.seenVersion = APP_VERSION; await saveState(state); };
  if (!news.length){ done(); return; }
  const el = document.createElement("div");
  el.className = "sheet-bg";
  el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="wn-t">
    <div class="sheet-h"><b id="wn-t">${tx("Neler yeni")}</b><button class="sheet-x" aria-label="${tx("Kapat")}">×</button></div>
    ${news.map(n => `<div class="wn-v">${tx("Sürüm {0}", [(n.v)])}</div>
      <ul class="wn-l">${n.items.map(i => `<li>${i}</li>`).join("")}</ul>`).join("")}
    <button id="wn-ok" style="margin-top:8px">${tx("Tamam")}</button>
  </div>`;
  document.body.appendChild(el);
  const close = () => { sheetOut(el); done(); };
  el.onclick = ev => { if (ev.target === el) close(); };
  el.querySelector(".sheet-x").onclick = close;
  el.querySelector("#wn-ok").onclick = close;
  el.querySelector("#wn-ok").focus();
}
