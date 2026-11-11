"use strict";

/* ---- hareket: sayaçlar ve parıltı ----
   render() sayfayı baştan yazdığı için eski değer DOM'da kalmıyor; sayaçlar
   son gördükleri değeri burada tutuyor ve yeni değere doğru sayıyorlar. */
const reduceMotion = () =>
  !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

const _counted = new Map();
function animateCounts(){
  app.querySelectorAll("[data-count]").forEach(el => {
    const key = el.dataset.count;
    const to = parseFloat(el.dataset.v);
    if (!isFinite(to)) { _counted.delete(key); return; }
    const had = _counted.has(key);
    const from = had ? _counted.get(key) : to;
    _counted.set(key, to);
    if (!had || from === to || reduceMotion()) return;
    const dec = +(el.dataset.dec || 0), t0 = performance.now(), dur = 620;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmtN(+(from + (to - from) * e).toFixed(dec));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

/* Ödül anı: işaretlenen yıldızdan kısa bir parıltı dağılır. */
function sparkle(el){
  if (!el || reduceMotion()) return;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 8; i++){
    const a = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
    const d = 26 + Math.random() * 22;
    const s = document.createElement("i");
    s.className = "spark";
    s.style.cssText = `left:${cx - 3.5}px;top:${cy - 3.5}px;` +
      `--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d).toFixed(1)}px;` +
      `animation-delay:${(Math.random() * 90).toFixed(0)}ms`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}

/* ---- bento özeti ----
   Günün dört ölçüsü tek bakışta: kalori, su, uyku ve seri. Kalori kutusu
   dolu renk taşır — günün asıl sorusu o. Her kutu kendi girişine götürür,
   yani özet aynı zamanda kısayol. Altındaki uzun kartlar detayda kalır. */
function bentoRow(entry, program, key){
  const now = key === today();
  const tasks = entry.tasks || [];
  const done = tasks.filter(t => t.done).length, all = tasks.length;

  const left = (program && typeof entry.kcal === "number") ? program.kcal - entry.kcal : null;
  const kNum = left === null ? (program ? program.kcal : null) : Math.abs(left);
  const kLbl = left === null ? "günlük hedef" : left >= 0 ? "kcal kaldı" : "kcal aşıldı";
  const kFill = (program && typeof entry.kcal === "number") ? entry.kcal / program.kcal : 0;

  const wv = entry.water || 0, wg = program ? program.water : 0;
  const sv = typeof entry.sleep === "number" ? entry.sleep : null;
  const [slo, shi] = sleepBand();
  const streak = streakNow();

  const val = (id, v, dec) => `<span data-count="${id}" data-v="${v === null ? "" : v}" data-dec="${dec || 0}">${
    v === null ? "—" : fmtN(v)}</span>`;

  const tile = (go, c, ic, name, v, dec, unit, sub, fill) => `
    <button class="bt" data-btgo="${go}" style="--c:var(${c})">
      <span class="bt-h">${icon(ic, "bt-ic")}<span class="bt-nm">${name}</span></span>
      <span class="bt-v num">${val(go, v, dec)}<small>${unit}</small></span>
      <span class="bt-sub">${sub}</span>
      <span class="bt-bar"><s style="width:${clamp(fill * 100, 0, 100).toFixed(0)}%"></s></span>
    </button>`;

  return `<div class="bento">
    <button class="bt bt-kcal dust" data-btgo="kcal">
      <span class="bt-h">${icon("grain", "bt-ic")}<span class="bt-nm">Kalori</span></span>
      <span class="bt-v num">${val("kcal", kNum)}</span>
      <span class="bt-sub">${kLbl}</span>
      <span class="bt-bar"><s style="width:${clamp(kFill * 100, 0, 100).toFixed(0)}%"></s></span>
    </button>

    ${tile("water", "--water", "dairy", "Su", wv, 0, " ml", wg ? `hedef ${fmtN(wg)} ml` : "hedef yok", wg ? wv / wg : 0)}
    ${tile("sleep", "--sleep", "rest", "Uyku", sv === null ? null : +sv.toFixed(1), 1, " sa",
        `hedef ${slo}-${shi} sa`, sv === null ? 0 : sv / slo)}
    ${tile("streak", "--star-tile", "star4", "Seri", streak, 0, " gün",
        `${done}/${all} görev bitti`, streak / 7)}
  </div>`;
}

function wireBento(key){
  app.querySelectorAll("[data-btgo]").forEach(b => b.onclick = () => {
    const g = b.dataset.btgo;
    if (g === "streak"){ tab = "calendar"; calTab = "cal"; render(); window.scrollTo(0,0); return; }
    goToTask(g === "water" ? "water" : g === "sleep" ? "sleep" : "kcal", key);
  });
}

/* ---- açılır / kapanır bölümler ---- */
const FOLD_DEFAULT = { body:false, eval:false, review:false, sugg:false, micro:false, lifts:false };
function isOpen(key){
  const f = state.ui && state.ui.fold;
  return f && key in f ? f[key] : (FOLD_DEFAULT[key] ?? true);
}
function fold(key, title, count, body){
  const open = isOpen(key);
  return `<section class="fold${open ? "" : " shut"}">
    <button class="fold-h" data-fold="${key}" aria-expanded="${open}">
      <span class="fold-t">${title}</span>${count ? `<span class="count">${count}</span>` : `<span class="count"></span>`}
      <svg class="ico fold-c" aria-hidden="true"><use href="#i-next"/></svg>
    </button>
    <div class="fold-b"><div class="fold-i">${body}</div></div>
  </section>`;
}
function wireFolds(){
  app.querySelectorAll("[data-fold]").forEach(b => b.onclick = async () => {
    const key = b.dataset.fold, open = !isOpen(key);
    state.ui = state.ui || {};
    state.ui.fold = state.ui.fold || {};
    state.ui.fold[key] = open;
    b.closest(".fold").classList.toggle("shut", !open);
    b.setAttribute("aria-expanded", open);
    await saveState(state);
  });
}

/* ---- nasıl yapılır ---- */
/* r: hareket metninde aranan ifade (küçük harf). Sıra önemli: özel olan önce.
   s: adımlar, x: en sık yapılan hata. */
const GUIDE = [
  /* bacak */
  { id:"frontsquat", n:"Front squat", r:/front squat/, s:["Barı köprücük kemiklerinin üstüne, dirsekler öne ve yukarı bakacak şekilde yerleştir.","Gövdeyi dik tutarak kalçayı aşağı indir, uyluklar yere paralel olana kadar in.","Topuklardan iterek kalk."], x:"Dirsekler düşerse bar öne kayar; dirsekleri hep yukarıda tut." },
  { id:"goblet", n:"Goblet squat", r:/goblet/, s:["Kettlebell'i göğsünün önünde iki elinle boynuzlarından tut.","Ayaklar omuz genişliğinde, dirsekler dizlerin iç tarafına doğru inecek kadar çömel.","Göğsü dik tutarak topuklardan it ve kalk."], x:"Topukların yerden kalkması; ağırlık ayağın ortasında kalmalı." },
  { id:"jumpsquat", n:"Jump squat", r:/jump squat/, s:["Yarım squat pozisyonuna in.","Kalçadan patlayıcı şekilde sıçra, kolları yukarı savur.","Dizler hafif bükülü, yumuşak iniş yap ve hemen bir sonraki tekrara geç."], x:"Sert ve düz dizle inmek; iniş sessiz olmalı." },
  { id:"shrimp", n:"Shrimp squat", r:/shrimp/, s:["Tek ayak üstünde dur, diğer ayağını arkadan eline al.","Arka dizini yere doğru kontrollü indir.","Öndeki topuktan iterek kalk. Zorsa arka dizin altına yastık koy."], x:"Öndeki dizin içe çökmesi." },
  { id:"pistol", n:"Pistol squat", r:/pistol/, s:["Tek ayak üstünde dur, diğer bacağı öne uzat.","Kolları dengeye yardım için öne uzatarak yavaşça çömel.","Tabanın tamamıyla iterek kalk. Başta bir banka ya da sandalyeye oturup kalkarak çalış."], x:"Hızlı düşmek; iniş 2-3 saniye sürmeli." },
  { id:"bulgarian", n:"Bulgarian split squat", r:/bulgarian/, s:["Arka ayağının üstünü bir bank ya da sandalyeye koy.","Öndeki dizin ayak parmaklarıyla aynı yöne bakarak arka dizini yere doğru indir.","Öndeki topuktan iterek kalk; setin sonunda bacak değiştir."], x:"Öndeki ayağın banka çok yakın olması; bir adım öne çık." },
  { id:"sandalyesquat", n:"Sandalye squat", r:/sandalye squat/, s:["Sandalyenin önünde ayaklar omuz genişliğinde dur.","Kalçayı geriye iterek sandalyeye dokunana kadar in, oturma.","Topuklardan iterek kalk."], x:"Sandalyeye çöküp dinlenmek; sadece dokun." },
  { id:"squat", n:"Squat", r:/squat/, s:["Barı ense altındaki trapez kasına yerleştir, ayaklar omuz genişliğinde, uçlar hafif dışa.","Nefes al, karnını sık, kalçayı geriye ve aşağı indir; uyluk en az yere paralel olsun.","Dizler ayak uçlarıyla aynı yönde, topuklardan iterek kalk."], x:"Dizlerin içe kapanması ve belin yuvarlanması." },
  { id:"romen", n:"Romen deadlift", r:/romen deadlift/, s:["Ağırlığı uyluklarının önünde tut, dizler hafif bükülü.","Sırtı düz tutarak kalçayı geriye it, ağırlık bacaklarına yakın aşağı insin.","Arka bacakta gerilme hissedince kalçayı öne iterek doğrul."], x:"Beli yuvarlamak; hareket belden değil kalçadan gelir." },
  { id:"deadlift", n:"Deadlift", r:/deadlift/, s:["Ayaklar kalça genişliğinde, bar ayağın ortasının üstünde.","Eğil, barı tut, göğsü kaldır ve sırtı düzle; nefes alıp karnı sık.","Barı bacaklarına yakın tutarak yerden it, üstte kalçayı kilitle; aynı yoldan indir."], x:"Barın vücuttan uzaklaşması ve sırtın kamburlaşması." },
  { id:"legpress", n:"Leg press", r:/leg press/, s:["Sırtını ve kalçanı mindere tam yasla, ayaklar platformda omuz genişliğinde.","Dizleri yaklaşık 90 dereceye kadar kontrollü bük.","Topuklardan it; üstte dizleri tam kilitleme."], x:"Altta kalçanın minderden kalkması." },
  { id:"legcurl", n:"Leg curl", r:/leg curl/, s:["Makinede minderi ayak bileklerinin hemen üstüne ayarla.","Topukları kalçana doğru çek, üstte bir saniye sık.","Yavaşça başlangıca döndür."], x:"Kalçayı kaldırarak ağırlığı savurmak." },
  { id:"nordic", n:"Nordic curl", r:/nordic/, s:["Dizlerinin altına minder koy, ayak bileklerini birine ya da bir mobilyanın altına sabitlet.","Kalçadan dize düz bir çizgi halinde öne doğru olabildiğince yavaş in.","Dayanamadığında ellerle yakala, itip geri dön."], x:"Kalçayı kırmak; vücut tahta gibi düz kalmalı." },
  { id:"hipthrust", n:"Hip thrust", r:/hip thrust/, s:["Kürek kemiklerini banka yasla, bar kalça kemiğinin üstünde.","Ayaklar yerde, çeneni hafif göğse al.","Kalçayı üst tarafta vücut düz bir çizgi olana kadar kaldır, bir saniye sık, indir."], x:"Üstte beli fazla bükmek; hareket kalçada bitmeli." },
  { id:"glutebridge", n:"Glute bridge", r:/glute bridge|köprü/, s:["Sırtüstü yat, dizler bükülü, ayaklar yerde.","Topuklardan iterek kalçanı omuzdan dize düz bir çizgi olana kadar kaldır.","Üstte kalçanı sık, yavaşça indir."], x:"Kalçayla değil belle kaldırmak." },
  { id:"calf", n:"Calf raise", r:/calf raise/, s:["Ayak uçlarını bir basamağın kenarına koy, topuklar boşta.","Topukları olabildiğince yukarı kaldır, üstte bir saniye bekle.","Topukları basamağın altına kadar yavaşça indir."], x:"Yaylanarak hızlı tekrar yapmak." },
  { id:"stepup", n:"Step-up", r:/step-up/, s:["Bankın önünde dur, bir ayağını tamamen bankın üstüne koy.","Üstteki ayaktan iterek çık, arkadaki ayakla yardım etme.","Kontrollü in; setin sonunda bacak değiştir."], x:"Alttaki ayakla zıplayarak çıkmak." },
  { id:"lungesicrama", n:"Lunge sıçrama", r:/lunge sıçrama/, s:["Lunge pozisyonuna in.","Sıçra, havada bacakları değiştir.","Diğer bacak önde yumuşak iniş yap ve tekrar in."], x:"Öndeki dizin içe kapanması." },
  { id:"lunge", n:"Lunge", r:/lunge/, s:["Dik dur, bir adım öne at.","İki diz de yaklaşık 90 derece olana kadar in, arka diz yere yaklaşsın.","Öndeki topuktan iterek bir sonraki adıma geç."], x:"Gövdenin öne eğilmesi." },
  { id:"wallsit", n:"Duvar oturuşu", r:/duvar oturuşu/, s:["Sırtını duvara yasla, ayaklar duvardan yarım adım önde.","Uyluklar yere paralel olana kadar kay.","Süre boyunca sırt duvarda, nefes düzenli kalsın."], x:"Ellerle uyluklara dayanmak." },

  /* itiş */
  { id:"hspu", n:"Handstand şınav", r:/handstand şınav/, s:["Duvara karşı amuda kalk ya da ayakları yüksekte pike pozisyonuna geç.","Başı ellerin önüne, üçgen oluşturacak şekilde kontrollü indir.","Omuzlardan iterek kolları kilitle."], x:"Dirsekleri yanlara açmak; dirsekler hafif öne baksın." },
  { id:"pike", n:"Pike şınav", r:/pike şınav/, s:["Ters V pozisyonuna geç: kalça yukarıda, eller ve ayaklar yerde.","Başı ellerin önüne doğru indir.","Omuzlardan iterek geri çık."], x:"Kalçanın düşüp normal şınava dönmesi." },
  { id:"elmas", n:"Elmas şınav", r:/elmas şınav/, s:["Ellerini göğsünün altında baş parmak ve işaret parmakları elmas oluşturacak şekilde birleştir.","Vücut düz, göğsü ellerine indir; dirsekler geriye baksın.","İterek çık. Zorsa dizler yerde başla."], x:"Dirsekleri yanlara açmak." },
  { id:"sinav", n:"Şınav", r:/şınav/, s:["Eller omuzların biraz dışında, vücut başından topuğuna düz bir çizgi.","Karnı ve kalçayı sıkarak göğsü yere yaklaştır; dirsekler 45 derece dışarı.","Yeri iterek kolları uzat. Zorsa ellerini bir banka koy ya da dizlerden başla."], x:"Kalçanın düşmesi ya da havaya kalkması." },
  { id:"bankdips", n:"Bank dips", r:/bank dips|sandalye dips/, s:["Ellerini arkandaki bankın kenarına koy, bacaklar önde.","Dirsekleri geriye bükerek omuzlar dirsek seviyesine gelene kadar in.","Avuçlardan iterek kalk. Kolaylaştırmak için dizleri bük."], x:"Omuzların kulağa doğru kalkması; çok derine inme." },
  { id:"dips", n:"Dips", r:/dips/, s:["Paralel barlarda kollar düz, omuzlar aşağıda başla.","Gövde hafif öne eğik, dirsekleri bükerek omuzlar dirsek seviyesine kadar in.","İterek kolları kilitle. Yapamıyorsan lastik bantla destek al."], x:"Altta omuzları kulağa doğru çökertmek." },
  { id:"inclinedb", n:"Incline dumbbell press", r:/[iı]ncline dumbbell/, s:["Bankı 30-45 dereceye ayarla, dumbbell'ler göğsün üst yanında.","Dumbbell'leri yukarı ve hafif içe doğru it.","Yavaşça göğsün yanına indir."], x:"Bankı çok dik ayarlamak; hareket omuza kayar." },
  { id:"incline", n:"Incline press", r:/[iı]ncline press/, s:["Bankı 30-45 dereceye ayarla, barı omuz genişliğinden biraz geniş tut.","Barı göğsün üst kısmına kontrollü indir.","Yukarı ve hafif geriye doğru it."], x:"Kalçayı banktan kaldırmak." },
  { id:"dbpress", n:"Dumbbell press", r:/dumbbell press/, s:["Bankta sırtüstü yat, dumbbell'ler göğsün yanında.","Kürek kemikleri sıkışık, dumbbell'leri yukarı it.","Dirsekler gövdeyle 45 derece açı yaparak indir."], x:"Dumbbell'leri üstte birbirine çarptırmak." },
  { id:"bench", n:"Bench press", r:/bench press/, s:["Bankta yat, kürek kemiklerini birbirine sık, ayaklar yerde sağlam.","Barı omuz genişliğinden biraz geniş tut, göğsün alt kısmına kontrollü indir.","Göğüsten yukarı it; dirsekler gövdeye 45 derece açıda."], x:"Barı göğüste zıplatmak ve kalçayı kaldırmak." },
  { id:"tekkolpress", n:"Tek kol press", r:/tek kol press/, s:["Kettlebell'i raf pozisyonunda, omuz önünde tut.","Karnını ve kalçanı sık, ağırlığı başının üstüne it.","Kontrollü raf pozisyonuna indir."], x:"Gövdeyi yana eğerek itmek." },
  { id:"ohp", n:"Omuz press", r:/omuz press/, s:["Ayakta dur, bar ya da dumbbell'ler omuz hizasında.","Karnını ve kalçanı sık, ağırlığı başının üstüne dik it; bar geçerken başı hafif geri al.","Üstte kolları kilitle, kontrollü indir."], x:"Beli geriye büküp göğüsle itmek." },
  { id:"yanomuz", n:"Yan omuz", r:/yan omuz/, s:["Dumbbell'ler yanında, dirsekler hafif bükülü.","Kolları omuz hizasına kadar yana kaldır.","Yavaşça indir."], x:"Ağırlığı gövdeyle savurmak." },
  { id:"triceps", n:"Triceps", r:/triceps/, s:["Dirsekleri gövdene yakın ve sabit tut.","Sadece ön kolu hareket ettirerek kolu tam uzat.","Yavaşça geri bük. Kablo, lastik ya da dumbbell ile yapılabilir."], x:"Dirseklerin öne arkaya kayması." },

  /* çekiş */
  { id:"muscleup", n:"Muscle-up", r:/muscle-up/, s:["Önce 10 temiz barfiks ve 10 dips yapabiliyor olmalısın.","Barı sıkı tut, göğse doğru patlayıcı bir çekiş yap.","Bileklerini barın üstüne döndürüp dips gibi iterek çık. Başta lastik bantla çalış."], x:"Bacakları savurarak çıkmaya çalışmak." },
  { id:"frontlever", n:"Front lever", r:/front lever/, s:["Barda asıl, kollar düz.","Kürek kemiklerini aşağı çek, vücudu yere paralel olacak kadar kaldır.","Başta dizler karnında (tuck), güçlendikçe bacakları uzat."], x:"Kolları bükmek; kollar kilitli kalmalı." },
  { id:"chinup", n:"Chin-up", r:/chin-up/, s:["Barı avuçlar sana bakacak şekilde omuz genişliğinde tut.","Göğsü bara doğru çek, çene barın üstüne çıksın.","Kolları tam uzatana kadar yavaş in."], x:"Yarım tekrar; altta kollar tam açılmalı." },
  { id:"barfiks", n:"Barfiks", r:/barfiks/, s:["Barı avuçlar dışa bakacak şekilde omuzdan biraz geniş tut, kollar düz.","Kürek kemiklerini aşağı çekerek başla, göğsü bara doğru çek.","Çene barı geçince yavaşça tam aşağı in. Yapamıyorsan lastik bant ya da sadece iniş (negatif) çalış."], x:"Bacakları savurmak ve yarım tekrar." },
  { id:"invrow", n:"Ters kürek", r:/ters kürek|avustralya|masa altı/, s:["Alçak bir barın ya da sağlam bir masanın altına gir, barı tut.","Vücut düz, topuklar yerde; göğsü bara çek.","Yavaşça kolları uzat. Zorlaştırmak için ayakları yükselt."], x:"Kalçanın sarkması." },
  { id:"havlu", n:"Havlu kürek", r:/havlu kürek/, s:["Havluyu bir kapı koluna dolayıp iki ucunu tut (kapıyı kilitle).","Ayaklar kapıya yakın, geriye yaslan, kollar düz.","Göğsünü kapıya doğru çek, kürek kemiklerini sık."], x:"Kapının açılabilir olması; önce güvenliği kontrol et." },
  { id:"kbrow", n:"Kettlebell row", r:/kettlebell row/, s:["Bir elin ve dizin banka dayalı, sırt düz.","Kettlebell'i kalçana doğru çek, dirsek gövdeye yakın.","Yavaşça indir; setin sonunda taraf değiştir."], x:"Gövdeyi döndürerek çekmek." },
  { id:"row", n:"Kürek", r:/barbell row|kürek/, s:["Dizler hafif bükülü, kalçadan öne eğil, sırt düz.","Ağırlığı göbeğe doğru çek, kürek kemiklerini sık.","Kontrollü indir. Makinede aynı hareketi oturarak yap."], x:"Beli yuvarlamak ve ağırlığı gövdeyle savurmak." },
  { id:"facepull", n:"Face pull", r:/face pull/, s:["Kabloyu ya da lastiği göz hizasına bağla, ipi avuçlar aşağı bakacak şekilde tut.","İpi yüzüne doğru çek, elleri kulakların yanına aç.","Kürek kemiklerini sık, yavaşça bırak."], x:"Ağır yüklemek; bu bir duruş hareketi, hafif çalış." },
  { id:"biceps", n:"Biceps", r:/biceps|kol süperset/, s:["Dirsekler gövdenin yanında sabit.","Ağırlığı omuzlara doğru kaldır, üstte sık.","Kollar tam açılana kadar yavaş indir. Süpersette hemen ardından triceps yap."], x:"Gövdeyi geriye atarak kaldırmak." },

  /* gövde */
  { id:"lsit", n:"L-sit", r:/l-sit/, s:["Paralel barlarda ya da iki sandalyede kolları kilitle, omuzları aşağı bastır.","Bacakları düz şekilde öne kaldır, L harfi oluştur.","Zorsa dizler bükülü (tuck) başla. V-sit için bacakları daha da yukarı kaldır."], x:"Omuzların kulağa doğru çökmesi." },
  { id:"dragon", n:"Dragon flag", r:/dragon flag/, s:["Bankta sırtüstü yat, başının arkasındaki bankı tut.","Omuzlar üzerinde vücudu düz bir çizgi halinde kaldır.","Kalçayı kırmadan olabildiğince yavaş indir. Başta dizler bükülü çalış."], x:"Belin bankla temasını kaybedip kalçayı kırmak." },
  { id:"hollowrock", n:"Hollow rock", r:/hollow rock/, s:["Hollow hold pozisyonuna geç.","Vücut şeklini bozmadan öne arkaya salın.","Bel her an yere yakın kalmalı."], x:"Bacaklarla ivme almak." },
  { id:"hollow", n:"Hollow hold", r:/hollow/, s:["Sırtüstü yat, belini yere bastır.","Omuzları ve düz bacakları yerden birkaç santim kaldır, kollar başın üstünde.","Süre boyunca bel yerde kalsın. Zorsa dizleri bük."], x:"Belin yerden kalkması." },
  { id:"yanplank", n:"Yan plank", r:/yan plank/, s:["Yan yat, dirsek omzun altında.","Kalçayı kaldır, baştan ayağa düz bir çizgi.","Süre dolunca taraf değiştir."], x:"Kalçanın sarkması." },
  { id:"plankserisi", n:"Plank serisi", r:/plank serisi/, s:["Ön kol plank ile başla, 5 nefes.","Kollar düz plank, ardından yan plank; her birinde 5 nefes.","Aşağı bakan köpekle bitir."], x:"Kalçanın sarkması." },
  { id:"plankjack", n:"Plank jack", r:/plank jack/, s:["Kollar düz plank pozisyonuna geç.","Ayakları yanlara açıp kapat, zıplar gibi.","Kalça sabit kalsın."], x:"Kalçanın yukarı aşağı zıplaması." },
  { id:"plank", n:"Plank", r:/plank/, s:["Dirsekler omuzların altında, ön kollar yerde.","Karnı ve kalçayı sık, başından topuğuna düz bir çizgi.","Nefesini tutmadan süreyi tamamla."], x:"Kalçanın düşmesi ya da havaya kalkması." },
  { id:"deadbug", n:"Dead bug", r:/dead bug/, s:["Sırtüstü yat, kollar tavana, dizler 90 derece havada.","Belini yere bastırarak sağ kolu ve sol bacağı yavaşça uzat.","Geri getir, diğer tarafla tekrarla."], x:"Belin yerden kalkması." },
  { id:"superman", n:"Superman", r:/superman/, s:["Yüzüstü yat, kollar önde uzanmış.","Kolları, göğsü ve bacakları aynı anda yerden kaldır.","Üstte iki saniye bekle, yavaşça indir."], x:"Boynu geriye bükmek; bakış yere." },
  { id:"karin", n:"Karın (crunch)", r:/karın/, s:["Sırtüstü yat, dizler bükülü, eller şakakta.","Karnı sıkarak omuzları yerden kaldır.","Yavaşça indir; boynu ellerle çekme."], x:"Başı ellerle çekmek." },
  { id:"mountain", n:"Mountain climber", r:/mountain climber/, s:["Kollar düz plank pozisyonuna geç.","Dizleri sırayla hızlıca göğse çek.","Kalça omuz hizasında kalsın."], x:"Kalçayı havaya kaldırmak." },

  /* amut */
  { id:"handstand", n:"Handstand", r:/handstand/, s:["Ellerini duvardan bir karış uzağa koy, parmaklar açık.","Ayaklarla duvara yürü ya da tekmeyle çık, göğüs duvara bakabilir.","Kollar kilitli, omuzlar kulağa doğru itilmiş, vücut düz kalsın."], x:"Beli çukurlaştırmak; karnı ve kalçayı sık." },

  /* kettlebell */
  { id:"swing", n:"Kettlebell swing", r:/swing/, s:["Kettlebell önünde, kalçadan eğil ve iki elle tut.","Bacak arasına geri savur, ardından kalçayı patlayıcı şekilde öne iterek göğüs hizasına kaldır.","Kollar sadece tutar, güç kalçadan gelir. Tek kol swing'de aynı hareketi tek elle yap."], x:"Squat yapar gibi çömelmek ya da kollarla kaldırmak." },
  { id:"tgu", n:"Türk kalkışı", r:/türk kalkışı/, s:["Sırtüstü yat, kettlebell tek kolda tavana doğru kilitli.","Dirsek, sonra el üstüne kalk; kalçayı kaldır, arka bacağı altından geçirip dize gel.","Ayağa kalk; aynı adımları tersinden izleyerek yere dön. Gözler hep ağırlıkta."], x:"Acele etmek; her adımda dur ve dengeyi kontrol et." },
  { id:"farmer", n:"Farmer taşıma", r:/farmer/, s:["İki ağır dumbbell ya da kettlebell'i yanlarında tut.","Dik dur, omuzlar geride.","Kısa ve sağlam adımlarla belirlenen mesafeyi yürü."], x:"Omuzların öne düşmesi." },

  /* kondisyon */
  { id:"burpee", n:"Burpee", r:/burpee/, s:["Çömel, ellerini yere koy.","Ayakları geriye atıp plank pozisyonuna geç (istersen bir şınav).","Ayakları ellere çek ve zıplayarak kalk."], x:"Plankta kalçanın düşmesi." },
  { id:"yuksekdiz", n:"Yüksek diz", r:/yüksek diz/, s:["Yerinde koşar gibi dizleri kalça hizasına kaldır.","Kollar koşu gibi çalışsın.","Ayak uçlarında hafif ve hızlı kal."], x:"Geriye yaslanmak." },
  { id:"sprint", n:"Sprint (tepe / merdiven)", r:/tepe sprint|merdiven sprint/, s:["Önce 10 dakika ısın.","Belirtilen süre boyunca tam güçle yokuş ya da merdiven çık.","Yürüyerek aşağı in ve toparlan; her tekrar aynı kalitede olsun."], x:"Isınmadan başlamak; hamstring sakatlığının en sık nedeni." },
  { id:"kosuyuruyus", n:"Koşu-yürüyüş aralığı", r:/koşu \/|koşu-yürüyüş|× \d+ dk koşu|\d+ tur \(/, s:["5 dakika tempolu yürüyüşle ısın.","Koşu kısımlarını konuşabileceğin rahat bir tempoda koş.","Yürüyüş aralarında nefesini toparla; tur sayısını tamamla."], x:"Koşu aralarında fazla hızlanmak; amaç süre, hız değil." },
  { id:"kosu", n:"Koşu", r:/koşu/, s:["Isınma için ilk 5 dakikayı yavaş koş.","Tempolu koşuda cümle kurabilecek, şarkı söyleyemeyecek kadar zorlan; düşük tempoda rahatça konuşabilmelisin.","Adımlar kısa ve sık olsun, ayak gövdenin altına bassın."], x:"Uzun adımla topuğa sert basmak." },
  { id:"ipatlama", n:"İp atlama", r:/ip atlama/, s:["İpin sapları koltuk altına gelecek uzunlukta olsun.","Bileklerden çevir, ayak uçlarında alçak zıpla.","30-60 saniyelik bloklar halinde çalış."], x:"Kollarla büyük daireler çizmek." },
  { id:"yuruyus", n:"Yürüyüş / bisiklet", r:/yürüyüş|bisiklet/, s:["Hafif nefes nefese kalacak ama konuşabileceğin bir tempo seç.","Omuzlar rahat, kollar serbest salınsın.","Süreyi kesintisiz tamamla; bisiklette direnci orta tut."], x:"Aktif dinlenme gününde fazla zorlanmak." },

  /* yoga ve mobilite */
  { id:"gunes", n:"Güneş selamı", r:/güneş selamı/, s:["Ayakta kolları yukarı kaldır, nefes al.","Öne eğil, elleri yere koy; geri adımla plank, yere in, kobra.","Aşağı bakan köpek pozunda 5 nefes kal, öne adımla ve ayağa kalk. Bu bir tur."], x:"Nefesle hareketi eşleştirmemek." },
  { id:"savasci", n:"Savaşçı serisi", r:/savaşçı/, s:["Geniş bir adım aç, öndeki diz 90 derece bükülü.","Savaşçı 1'de kollar yukarı, savaşçı 2'de kollar yanlara açık.","Her pozda 5 nefes kal, taraf değiştir."], x:"Öndeki dizin ayak bileğini geçmesi." },
  { id:"guvercin", n:"Güvercin pozu", r:/güvercin/, s:["Dört ayak pozisyonundan sağ dizini sağ elinin arkasına getir.","Sol bacağı geriye uzat, kalçayı yere doğru bırak.","Gövdeyi öne eğ, 60-90 saniye nefes al; taraf değiştir."], x:"Dizde ağrı hissetmek; kalçanın altına yastık koy." },
  { id:"kelebek", n:"Kelebek", r:/kelebek/, s:["Otur, ayak tabanlarını birleştir.","Topukları kalçana doğru çek, dizleri yere doğru bırak.","Sırt düz, hafif öne eğil ve nefes al."], x:"Dizleri elle aşağı bastırmak." },
  { id:"kedi", n:"Kedi-inek", r:/kedi-inek/, s:["Dört ayak pozisyonuna geç.","Nefes alırken beli çukurlaştır, başı kaldır (inek).","Nefes verirken sırtı yuvarla, çeneyi göğse al (kedi)."], x:"Acele etmek; her hareket bir nefes sürer." },
  { id:"cocuk", n:"Çocuk pozu", r:/çocuk pozu/, s:["Diz çök, kalçanı topuklarına oturt.","Kolları öne uzatarak alnını yere bırak.","Sırtına doğru derin nefes al."], x:"Nefesi tutmak." },
  { id:"sandalyepoz", n:"Sandalye pozu", r:/sandalye pozu/, s:["Ayaklar bitişik, kolları yukarı kaldır.","Hayali bir sandalyeye oturur gibi kalçayı geri indir.","5-8 nefes kal."], x:"Dizlerin ayak uçlarını çok geçmesi." },
  { id:"agac", n:"Ağaç dengesi", r:/ağaç/, s:["Tek ayak üstünde dur.","Diğer ayak tabanını baldırına ya da iç uyluğuna yerleştir (dizine değil).","Elleri göğüste birleştir, sabit bir noktaya bak; taraf değiştir."], x:"Ayağı dizin iç yüzüne bastırmak." },
  { id:"onegilme", n:"Öne eğilme", r:/öne eğilme|hamstring/, s:["Ayaklar kalça genişliğinde, dizler hafif bükülü.","Kalçadan öne eğil, gövdeyi bacaklara bırak.","Her nefes verişte biraz daha gevşe; zorlama."], x:"Sırtı yuvarlayarak yere uzanmaya çalışmak." },
  { id:"omuzacici", n:"Omuz açıcılar", r:/omuz açıcı/, s:["Ellerini arkanda birleştir ya da bir havlu tut.","Göğsü açarak kolları yukarı kaldır.","Kapı çerçevesine dayanarak göğüs esnetmesiyle devam et; her biri 30 saniye."], x:"Omuzları kulağa doğru kaldırmak." },
  { id:"nefes", n:"Nefes çalışması", r:/nefes çalışması|gevşeme/, s:["Rahat bir pozisyonda otur ya da uzan.","4 saniye burundan nefes al, 6 saniye ağızdan ver.","Dikkatin dağılırsa nefesi saymaya dön."], x:"Nefesi zorlamak; rahat ve yavaş olmalı." },
  { id:"esneme", n:"Esneme", r:/esneme|mobilite/, s:["Isınmış kaslarla çalış.","Her esnemede 30 saniye kal, ağrıya değil gerginliğe kadar git.","Kalça, arka bacak, baldır, göğüs ve omuzları sırayla çalış."], x:"Yaylanarak esnemek." },
  { id:"isinma", n:"Isınma / soğuma", r:/ısınma|soğuma/, s:["Isınmada hafif tempoyla başla, nabzı yavaşça yükselt.","Eklemleri dairesel hareketlerle aç.","Soğumada tempoyu kademeli düşür, ardından kısa esneme yap."], x:"Isınmayı atlamak." },

  /* yüzme */
  { id:"yuzmeteknik", n:"Teknik yüzme", r:/teknik \(/, s:["Her 50 metrede tek bir detaya odaklan: nefes ya da ayak vuruşu.","Nefes için başı yana çevir, kaldırma; bir gözün suda kalsın.","Ayak vuruşu kalçadan gelsin, dizler fazla bükülmesin."], x:"Nefes alırken başı kaldırmak; kalça batar." },
  { id:"yuzmesprint", n:"Hızlı yüzme / sprint", r:/hızlı|sprint/, s:["Her tekrarda tam güçle yüz.","Aralarda belirtilen süre kadar kenarda dinlen.","Teknik bozulursa tempoyu biraz düşür."], x:"Dinlenmeyi kısaltıp tekniği kaybetmek." },
  { id:"serbest", n:"Serbest stil", r:/serbest/, s:["Vücut suyun yüzeyinde düz, bakış aşağı.","Kollar sırayla uzanıp suyu kalçana doğru it.","Her 2-3 kulaçta bir yana dönerek nefes al."], x:"Kalçanın batması; karnını sık, başı aşağıda tut." }
];

const GUIDE_BY_ID = Object.fromEntries(GUIDE.map(g => [g.id, g]));

/* Bir hareket metninin rehber kayıtları (devrelerde birden fazla). */
function guidesFor(str){
  const l = str.toLocaleLowerCase("tr");
  const one = t => { const g = GUIDE.find(x => x.r.test(t)); return g ? g.id : null; };
  const m = l.match(/^\d+ tur:\s*(.*)$/);
  if (m){
    const ids = m[1].split(/ · |\s\+\s|, /).map(one).filter(Boolean);
    return [...new Set(ids)];
  }
  const id = one(l);
  return id ? [id] : [];
}

let planTab = "log", howOpen = null, howQuery = "";
