"use strict";

/* ---------------- yenilikler ----------------
   Uygulama güncellendikten sonraki ilk açılışta, kullanıcının henüz görmediği
   sürümlerin kısa maddeleri bir kez gösterilir. Görülen sürüm state.seenVersion'a
   yazılır. Yeni kullanıcıya gösterilmez (ilk girişte seenVersion güncel sürüm olur).
   Yeni bir sürümde kullanıcının fark edeceği bir şey varsa buraya en üste eklenir;
   ayrıntılı liste CHANGELOG.md'dedir. Maddeler kısa tutulur. */
const WHATS_NEW = [
  /* Aynı sürümün birden çok kaydı olabilir; gösterilirken tek başlık altında birleşir. */
  { v:"1.25.0", items:[
    tx("Programın > Bugün ekranının en üstünde haftanın yedi günü var: tamamlanan gün yıldız olur, dinlenme günleri ayrı görünür."),
    tx("Her hareketin altında geçen seferki kaydın yazar; antrenmanı başlat düğmesi altta sabit kalır.")] },
  { v:"1.24.1", items:[
    tx("Beslenme ekranı sadeleşti: kalan kalori ve lif-mikro besinler tek kartta, Sık yediklerin öğün sayfasında.")] },
  { v:"1.24.0", items:[
    tx("Beslenme ekranında dört öğün de aynı çalışıyor: öğüne dokununca ekranın altından kendi sayfası açılıyor."),
    tx("Boş öğünün önerisi sayfanın en üstünde: tek dokunuşla ekle, beğenmezsen başka öneri iste ya da kendin seç.")] },
  { v:"1.23.0", items:[
    tx("Beslenme ekranı yenilendi: öğünler yukarıdan aşağı bir yıldız yolunda; biten öğün yıldız olur, üstte kalan kalorin görünür."),
    tx("Sıradaki öğünün önerisi hemen görünür: tek dokunuşla ekle ya da kendin seç. Her öğünün yanındaki + ile besin ekleyebilirsin."),
    tx("Protein artık Bugün listesinde günlük hedef olarak çıkmıyor; proteinini Beslenme ekranından izlemeye devam edersin.")] },
  { v:"1.22.0", items:[
    tx("Bugün ekranının hedef paneli yenilendi: şimdi yapacağın iş \"Sıradaki\" kartında büyük görünüyor ve tek dokunuşla yapılıyor."),
    tx("Üstte kaç hedefin kaldığı ve biten hedef kadar yanan yıldızlar var; kalan hedefler \"Sonra\" altında, bitenler tek satırda.")] },
  { v:"1.21.0", items:[
    tx("Yeni hedef: Kilo alma. Hedef kilonu ve kaç haftada varacağını seçiyorsun; kalorin, proteinin ve antrenman önerin buna göre ayarlanıyor."),
    tx("Hedefin ekranında hedef kilo ve süre tek kartta; süre kaydırıcısı artık yağ kaybı, kas kazanımı ve kilo almada çalışıyor. Sağlık tiki kalktı."),
    tx("Ben ekranındaki hedefe yolculuk, planladığın hıza göre önde mi geride mi olduğunu söylüyor.")] },
  { v:"1.20.0", items:[
    tx("Hedefin ekranında artık kaç haftada hedef kiloya ineceğini kaydırıcıyla seçiyorsun; günlük kalorin seçtiğin süreye göre ayarlanıyor."),
    tx("Hedefin ekranındaki seçeneklerin çizgileri daha belirgin.")] },
  { v:"1.19.0", items:[
    tx("Ana sayfalar yeni tasarıma geçti: sıcak Mercan renkleri, açık ve koyu temada."),
    tx("Bugün ekranının üstünde dört ay göstergesi ve altında takımyıldız şeridi var; Beslenme ekranı sadeleşti."),
    tx("Takvimde işaretler büyüdü ve tek bir Simgeler düğmesinde açıklanıyor; dokunma alanları ve yazılar büyüdü.")] },
  { v:"1.18.0", items:[
    tx("Avatarlar artık kasklı astronot hayvanlar; seçince hayvana özel tepki veriyorlar."),
    tx("Beslenme ekranı sadeleşti; öğünler açılır-kapanır."),
    tx("Çiğ yenmeyen besinler öneri ve aramalarda gizlendi.")] },
  { v:"1.17.0", items:[
    tx("Takımyıldızlar artık gerçek: Büyük Ayı, Orion, Kuğu ve daha fazlası; mevsimine göre seçiliyor."),
    tx("Takımyıldız haftalara bölünmüyor; ana ekranda son 7 gün görünüyor, şekle dokununca tam şema açılıyor."),
    tx("Gün düğmelerine dokununca oluşan kayma hatası düzeltildi."),
    tx("Kilo ölçümü haftalık: son tartıdan 7 gün dolmadan hedef ve hatırlatma çıkmıyor."),
    tx("Uyku girişi kolaylaştı: yatış ve kalkış saati tek ekranda, son girilen tek dokunuşla."),
    tx("Antrenman adları sadeleşti: İtiş, Çekiş, Bacak günü.")] },
  { v:"1.16.0", items:[
    tx("Bugün ekranındaki Ayarla düğmesi kalktı; beslenme tercihleri artık Ayarlar'da."),
    tx("Mutfak seçimi artık telefonun diline göre yapılıyor."),
    tx("Alışveriş listem sadeleşti: yalnızca Listem ve Öneriler."),
    tx("Öğün önerileri daha isabetli; yeni ve alakasız besinler otomatik önerilmiyor."),
    tx("Besin eklemede yalnızca arama alanı var; sık yedikler, barkod ve kendi yiyeceklerin korundu."),
    tx("Program'da nasıl yapılır rehberi ayrı sekmede; antrenman modunda da açılıyor."),
    tx("Kendi besinlerin aramada daha önce çıkıyor."),
    tx("İçecek porsiyonları düzeltildi: kadeh, şişe ve bardak gramajları artık doğru.")] },
  { v:"1.15.0", items:[
    tx("Besin listesi 1324 kayıtla büyüdü: Türk ve dünya mutfağından yemekler, çorbalar ve tatlılar; alkollü içeceklerin kalorisi de eklendi."),
    tx("Neler yeni penceresi uygulama güncellendikten sonra artık bir kez gösteriliyor."),
    tx("Sürüm numarası her ekranın sağ alt köşesinde küçük yazıyor; açılan pencereler Escape ile de kapanıyor.")] },
  { v:"1.14.0", items:[
    tx("Yazı tipi Saira oldu. Beslenme özeti artık dört ay evresi: yedikçe ay hilalden dolunaya aydınlanır, hedef aşılınca kırmızı dolunay olur.")] },
  { v:"1.13.0", items:[
    tx("Beslenme özeti dört halka oldu: kalan miktar önde, hedef aşılınca fazlalık kırmızıyla yazar. Sık yediklerin artık açılıp kapanıyor.")] },
  { v:"1.13.0", items:[
    tx("Bugün'ün en üstündeki hafta şeridi artık haftanın takımyıldızı: dokununca büyük hali ve gökyüzü atlası açılır. Gün tamamlanınca yıldız parlar.")] },
  { v:"1.12.0", items:[
    tx("Yeni görünüm: koyu temada derin lacivert zemin, canlı renkler ve büyük, okunaklı rakamlar.")] },
  { v:"1.11.0", items:[
    tx("Her haftanın takımyıldızı baştan belli ve gerçek bir şekli var; yıldıza dokununca o günün hedefleri açılır. Kazandıkların Ben › Grafikler › Gökyüzü atlası'nda.")] },
  { v:"1.10.0", items:[
    tx("Beslenme sadeleşti: öneriler boş öğünün içinde, tek dokunuşla Ekle. Bugün · Tarifler · Liste.")] },
  { v:"1.10.0", items:[
    tx("Antrenman ekranı sadeleşti: Program › Bugün ve Program. Hareket rehberi Program'da, rekorlar Ben › Grafikler'de."),
    tx("Bugün ekranında saate göre tek kısa yol: öğün ekle ya da antrenmanı başlat.")] },
  { v:"1.9.1", items:[
    tx("Besin ekleme kolaylaştı: sık yediklerin panelin başında, aramadaki + ile tek dokunuşla ekle, yanlışsa Geri al.")] },
  { v:"1.9.1", items:[
    tx("Öğün önerileri daha gerçekçi: her öğün anlamlı bir tabak, makul porsiyonlar ve her gün farklı bir menü.")] },
  { v:"1.9.0", items:[
    tx("Kendi yiyeceklerini düzenle ya da sil: Beslenme › Bugün › Besin ekle › Kendi yiyeceklerim.")] },
  /* native: yalnızca iPhone uygulamasında gösterilir (web'de bu özellik yok). */
  { v:"1.9.0", native:true, items:[
    tx("Paketli ürünlerin barkodunu okut, besin değerleri Open Food Facts'ten gelsin: Beslenme › Bugün › Besin ekle › Barkod okut."),
    tx("Apple Sağlık bağlantısı: adımın, uykun ve kilon Sağlık'tan gelsin, hedeflerin kendiliğinden işaretlensin: Ben › Ayarlar › Apple Sağlık.")] },
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

/* then: pencere kapanınca (ya da gösterilecek bir şey yoksa hemen) çalışır; ikinci bir
   pencere bununla aynı anda açılmaz. */
function maybeShowWhatsNew(then){
  then = then || (() => {});
  if (!state || !state.profile || state.seenVersion === APP_VERSION){ then(); return; }
  const news = unseenNews(state.seenVersion);
  const done = async () => { state.seenVersion = APP_VERSION; await saveState(state); };
  if (!news.length){ done(); then(); return; }
  const el = document.createElement("div");
  el.className = "sheet-bg";
  el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="wn-t">
    <div class="sheet-h"><b id="wn-t">${tx("Neler yeni")}</b><button class="sheet-x" aria-label="${tx("Kapat")}">×</button></div>
    ${news.map(n => `<div class="wn-v">${tx("Sürüm {0}", [(n.v)])}</div>
      <ul class="wn-l">${n.items.map(i => `<li>${i}</li>`).join("")}</ul>`).join("")}
    <button id="wn-ok" style="margin-top:8px">${tx("Tamam")}</button>
  </div>`;
  document.body.appendChild(el);
  const close = () => { sheetOut(el); done(); then(); };
  el.onclick = ev => { if (ev.target === el) close(); };
  el.querySelector(".sheet-x").onclick = close;
  el.querySelector("#wn-ok").onclick = close;
  el.querySelector("#wn-ok").focus();
}

/* Açılıştaki sıra: önce yenilikler, kapanınca hafta kapanışı. Başlangıçtaki
   uyarı (notice) bu sırayı bozmaz: yükseltme bildirimi görünür durumdayken de
   yenilik penceresi sırasını alır. İlk kurulumda seenVersion zaten güncel
   olduğu için hiç açılmaz. */
function openWelcomeChain(){
  maybeShowWhatsNew(maybeShowSkyClose);
}
