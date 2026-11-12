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
  const kLbl = left === null ? tx("günlük hedef") : left >= 0 ? tx("kcal kaldı") : tx("kcal aşıldı");
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
      <span class="bt-h">${icon("grain", "bt-ic")}<span class="bt-nm">${tx("Kalori")}</span></span>
      <span class="bt-v num">${val("kcal", kNum)}</span>
      <span class="bt-sub">${kLbl}</span>
      <span class="bt-bar"><s style="width:${clamp(kFill * 100, 0, 100).toFixed(0)}%"></s></span>
    </button>

    ${tile("water", "--water", "dairy", tx("Su"), vOut(wv), 0, " " + vUnit(), wg ? tx("hedef {0}", [(fmtV(wg))]) : tx("hedef yok"), wg ? wv / wg : 0)}
    ${tile("sleep", "--sleep", "rest", tx("Uyku"), sv === null ? null : +sv.toFixed(1), 1, " " + tx("sa"),
        tx("hedef {0}", [(`${slo}-${shi} ${tx("sa")}`)]), sv === null ? 0 : sv / slo)}
    ${tile("streak", "--star-tile", "star4", tx("Seri"), streak, 0, tx(" gün"),
        tx("{0}/{1} görev bitti", [(done), (all)]), streak / 7)}
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
  { id:"frontsquat", n:tx("Front squat"), r:/front squat/, s:[tx("Barı köprücük kemiklerinin üstüne, dirsekler öne ve yukarı bakacak şekilde yerleştir."),tx("Gövdeyi dik tutarak kalçayı aşağı indir, uyluklar yere paralel olana kadar in."),tx("Topuklardan iterek kalk.")], x:tx("Dirsekler düşerse bar öne kayar; dirsekleri hep yukarıda tut.") },
  { id:"goblet", n:tx("Goblet squat"), r:/goblet/, s:[tx("Kettlebell'i göğsünün önünde iki elinle boynuzlarından tut."),tx("Ayaklar omuz genişliğinde, dirsekler dizlerin iç tarafına doğru inecek kadar çömel."),tx("Göğsü dik tutarak topuklardan it ve kalk.")], x:tx("Topukların yerden kalkması; ağırlık ayağın ortasında kalmalı.") },
  { id:"jumpsquat", n:tx("Jump squat"), r:/jump squat/, s:[tx("Yarım squat pozisyonuna in."),tx("Kalçadan patlayıcı şekilde sıçra, kolları yukarı savur."),tx("Dizler hafif bükülü, yumuşak iniş yap ve hemen bir sonraki tekrara geç.")], x:tx("Sert ve düz dizle inmek; iniş sessiz olmalı.") },
  { id:"shrimp", n:tx("Shrimp squat"), r:/shrimp/, s:[tx("Tek ayak üstünde dur, diğer ayağını arkadan eline al."),tx("Arka dizini yere doğru kontrollü indir."),tx("Öndeki topuktan iterek kalk. Zorsa arka dizin altına yastık koy.")], x:tx("Öndeki dizin içe çökmesi.") },
  { id:"pistol", n:tx("Pistol squat"), r:/pistol/, s:[tx("Tek ayak üstünde dur, diğer bacağı öne uzat."),tx("Kolları dengeye yardım için öne uzatarak yavaşça çömel."),tx("Tabanın tamamıyla iterek kalk. Başta bir banka ya da sandalyeye oturup kalkarak çalış.")], x:tx("Hızlı düşmek; iniş 2-3 saniye sürmeli.") },
  { id:"bulgarian", n:tx("Bulgarian split squat"), r:/bulgarian/, s:[tx("Arka ayağının üstünü bir bank ya da sandalyeye koy."),tx("Öndeki dizin ayak parmaklarıyla aynı yöne bakarak arka dizini yere doğru indir."),tx("Öndeki topuktan iterek kalk; setin sonunda bacak değiştir.")], x:tx("Öndeki ayağın banka çok yakın olması; bir adım öne çık.") },
  { id:"sandalyesquat", n:tx("Sandalye squat"), r:/sandalye squat/, s:[tx("Sandalyenin önünde ayaklar omuz genişliğinde dur."),tx("Kalçayı geriye iterek sandalyeye dokunana kadar in, oturma."),tx("Topuklardan iterek kalk.")], x:tx("Sandalyeye çöküp dinlenmek; sadece dokun.") },
  { id:"squat", n:tx("Squat"), r:/squat/, s:[tx("Barı ense altındaki trapez kasına yerleştir, ayaklar omuz genişliğinde, uçlar hafif dışa."),tx("Nefes al, karnını sık, kalçayı geriye ve aşağı indir; uyluk en az yere paralel olsun."),tx("Dizler ayak uçlarıyla aynı yönde, topuklardan iterek kalk.")], x:tx("Dizlerin içe kapanması ve belin yuvarlanması.") },
  { id:"romen", n:tx("Romen deadlift"), r:/romen deadlift/, s:[tx("Ağırlığı uyluklarının önünde tut, dizler hafif bükülü."),tx("Sırtı düz tutarak kalçayı geriye it, ağırlık bacaklarına yakın aşağı insin."),tx("Arka bacakta gerilme hissedince kalçayı öne iterek doğrul.")], x:tx("Beli yuvarlamak; hareket belden değil kalçadan gelir.") },
  { id:"deadlift", n:tx("Deadlift"), r:/deadlift/, s:[tx("Ayaklar kalça genişliğinde, bar ayağın ortasının üstünde."),tx("Eğil, barı tut, göğsü kaldır ve sırtı düzle; nefes alıp karnı sık."),tx("Barı bacaklarına yakın tutarak yerden it, üstte kalçayı kilitle; aynı yoldan indir.")], x:tx("Barın vücuttan uzaklaşması ve sırtın kamburlaşması.") },
  { id:"legpress", n:tx("Leg press"), r:/leg press/, s:[tx("Sırtını ve kalçanı mindere tam yasla, ayaklar platformda omuz genişliğinde."),tx("Dizleri yaklaşık 90 dereceye kadar kontrollü bük."),tx("Topuklardan it; üstte dizleri tam kilitleme.")], x:tx("Altta kalçanın minderden kalkması.") },
  { id:"legcurl", n:tx("Leg curl"), r:/leg curl/, s:[tx("Makinede minderi ayak bileklerinin hemen üstüne ayarla."),tx("Topukları kalçana doğru çek, üstte bir saniye sık."),tx("Yavaşça başlangıca döndür.")], x:tx("Kalçayı kaldırarak ağırlığı savurmak.") },
  { id:"nordic", n:tx("Nordic curl"), r:/nordic/, s:[tx("Dizlerinin altına minder koy, ayak bileklerini birine ya da bir mobilyanın altına sabitlet."),tx("Kalçadan dize düz bir çizgi halinde öne doğru olabildiğince yavaş in."),tx("Dayanamadığında ellerle yakala, itip geri dön.")], x:tx("Kalçayı kırmak; vücut tahta gibi düz kalmalı.") },
  { id:"hipthrust", n:tx("Hip thrust"), r:/hip thrust/, s:[tx("Kürek kemiklerini banka yasla, bar kalça kemiğinin üstünde."),tx("Ayaklar yerde, çeneni hafif göğse al."),tx("Kalçayı üst tarafta vücut düz bir çizgi olana kadar kaldır, bir saniye sık, indir.")], x:tx("Üstte beli fazla bükmek; hareket kalçada bitmeli.") },
  { id:"glutebridge", n:tx("Glute bridge"), r:/glute bridge|köprü/, s:[tx("Sırtüstü yat, dizler bükülü, ayaklar yerde."),tx("Topuklardan iterek kalçanı omuzdan dize düz bir çizgi olana kadar kaldır."),tx("Üstte kalçanı sık, yavaşça indir.")], x:tx("Kalçayla değil belle kaldırmak.") },
  { id:"calf", n:tx("Calf raise"), r:/calf raise/, s:[tx("Ayak uçlarını bir basamağın kenarına koy, topuklar boşta."),tx("Topukları olabildiğince yukarı kaldır, üstte bir saniye bekle."),tx("Topukları basamağın altına kadar yavaşça indir.")], x:tx("Yaylanarak hızlı tekrar yapmak.") },
  { id:"stepup", n:tx("Step-up"), r:/step-up/, s:[tx("Bankın önünde dur, bir ayağını tamamen bankın üstüne koy."),tx("Üstteki ayaktan iterek çık, arkadaki ayakla yardım etme."),tx("Kontrollü in; setin sonunda bacak değiştir.")], x:tx("Alttaki ayakla zıplayarak çıkmak.") },
  { id:"lungesicrama", n:tx("Lunge sıçrama"), r:/lunge sıçrama/, s:[tx("Lunge pozisyonuna in."),tx("Sıçra, havada bacakları değiştir."),tx("Diğer bacak önde yumuşak iniş yap ve tekrar in.")], x:tx("Öndeki dizin içe kapanması.") },
  { id:"lunge", n:tx("Lunge"), r:/lunge/, s:[tx("Dik dur, bir adım öne at."),tx("İki diz de yaklaşık 90 derece olana kadar in, arka diz yere yaklaşsın."),tx("Öndeki topuktan iterek bir sonraki adıma geç.")], x:tx("Gövdenin öne eğilmesi.") },
  { id:"wallsit", n:tx("Duvar oturuşu"), r:/duvar oturuşu/, s:[tx("Sırtını duvara yasla, ayaklar duvardan yarım adım önde."),tx("Uyluklar yere paralel olana kadar kay."),tx("Süre boyunca sırt duvarda, nefes düzenli kalsın.")], x:tx("Ellerle uyluklara dayanmak.") },

  /* itiş */
  { id:"hspu", n:tx("Handstand şınav"), r:/handstand şınav/, s:[tx("Duvara karşı amuda kalk ya da ayakları yüksekte pike pozisyonuna geç."),tx("Başı ellerin önüne, üçgen oluşturacak şekilde kontrollü indir."),tx("Omuzlardan iterek kolları kilitle.")], x:tx("Dirsekleri yanlara açmak; dirsekler hafif öne baksın.") },
  { id:"pike", n:tx("Pike şınav"), r:/pike şınav/, s:[tx("Ters V pozisyonuna geç: kalça yukarıda, eller ve ayaklar yerde."),tx("Başı ellerin önüne doğru indir."),tx("Omuzlardan iterek geri çık.")], x:tx("Kalçanın düşüp normal şınava dönmesi.") },
  { id:"elmas", n:tx("Elmas şınav"), r:/elmas şınav/, s:[tx("Ellerini göğsünün altında baş parmak ve işaret parmakları elmas oluşturacak şekilde birleştir."),tx("Vücut düz, göğsü ellerine indir; dirsekler geriye baksın."),tx("İterek çık. Zorsa dizler yerde başla.")], x:tx("Dirsekleri yanlara açmak.") },
  { id:"sinav", n:tx("Şınav"), r:/şınav/, s:[tx("Eller omuzların biraz dışında, vücut başından topuğuna düz bir çizgi."),tx("Karnı ve kalçayı sıkarak göğsü yere yaklaştır; dirsekler 45 derece dışarı."),tx("Yeri iterek kolları uzat. Zorsa ellerini bir banka koy ya da dizlerden başla.")], x:tx("Kalçanın düşmesi ya da havaya kalkması.") },
  { id:"bankdips", n:tx("Bank dips"), r:/bank dips|sandalye dips/, s:[tx("Ellerini arkandaki bankın kenarına koy, bacaklar önde."),tx("Dirsekleri geriye bükerek omuzlar dirsek seviyesine gelene kadar in."),tx("Avuçlardan iterek kalk. Kolaylaştırmak için dizleri bük.")], x:tx("Omuzların kulağa doğru kalkması; çok derine inme.") },
  { id:"dips", n:tx("Dips"), r:/dips/, s:[tx("Paralel barlarda kollar düz, omuzlar aşağıda başla."),tx("Gövde hafif öne eğik, dirsekleri bükerek omuzlar dirsek seviyesine kadar in."),tx("İterek kolları kilitle. Yapamıyorsan lastik bantla destek al.")], x:tx("Altta omuzları kulağa doğru çökertmek.") },
  { id:"inclinedb", n:tx("Incline dumbbell press"), r:/[iı]ncline dumbbell/, s:[tx("Bankı 30-45 dereceye ayarla, dumbbell'ler göğsün üst yanında."),tx("Dumbbell'leri yukarı ve hafif içe doğru it."),tx("Yavaşça göğsün yanına indir.")], x:tx("Bankı çok dik ayarlamak; hareket omuza kayar.") },
  { id:"incline", n:tx("Incline press"), r:/[iı]ncline press/, s:[tx("Bankı 30-45 dereceye ayarla, barı omuz genişliğinden biraz geniş tut."),tx("Barı göğsün üst kısmına kontrollü indir."),tx("Yukarı ve hafif geriye doğru it.")], x:tx("Kalçayı banktan kaldırmak.") },
  { id:"dbpress", n:tx("Dumbbell press"), r:/dumbbell press/, s:[tx("Bankta sırtüstü yat, dumbbell'ler göğsün yanında."),tx("Kürek kemikleri sıkışık, dumbbell'leri yukarı it."),tx("Dirsekler gövdeyle 45 derece açı yaparak indir.")], x:tx("Dumbbell'leri üstte birbirine çarptırmak.") },
  { id:"bench", n:tx("Bench press"), r:/bench press/, s:[tx("Bankta yat, kürek kemiklerini birbirine sık, ayaklar yerde sağlam."),tx("Barı omuz genişliğinden biraz geniş tut, göğsün alt kısmına kontrollü indir."),tx("Göğüsten yukarı it; dirsekler gövdeye 45 derece açıda.")], x:tx("Barı göğüste zıplatmak ve kalçayı kaldırmak.") },
  { id:"tekkolpress", n:tx("Tek kol press"), r:/tek kol press/, s:[tx("Kettlebell'i raf pozisyonunda, omuz önünde tut."),tx("Karnını ve kalçanı sık, ağırlığı başının üstüne it."),tx("Kontrollü raf pozisyonuna indir.")], x:tx("Gövdeyi yana eğerek itmek.") },
  { id:"ohp", n:tx("Omuz press"), r:/omuz press/, s:[tx("Ayakta dur, bar ya da dumbbell'ler omuz hizasında."),tx("Karnını ve kalçanı sık, ağırlığı başının üstüne dik it; bar geçerken başı hafif geri al."),tx("Üstte kolları kilitle, kontrollü indir.")], x:tx("Beli geriye büküp göğüsle itmek.") },
  { id:"yanomuz", n:tx("Yan omuz"), r:/yan omuz/, s:[tx("Dumbbell'ler yanında, dirsekler hafif bükülü."),tx("Kolları omuz hizasına kadar yana kaldır."),tx("Yavaşça indir.")], x:tx("Ağırlığı gövdeyle savurmak.") },
  { id:"triceps", n:tx("Triceps"), r:/triceps/, s:[tx("Dirsekleri gövdene yakın ve sabit tut."),tx("Sadece ön kolu hareket ettirerek kolu tam uzat."),tx("Yavaşça geri bük. Kablo, lastik ya da dumbbell ile yapılabilir.")], x:tx("Dirseklerin öne arkaya kayması.") },

  /* çekiş */
  { id:"muscleup", n:tx("Muscle-up"), r:/muscle-up/, s:[tx("Önce 10 temiz barfiks ve 10 dips yapabiliyor olmalısın."),tx("Barı sıkı tut, göğse doğru patlayıcı bir çekiş yap."),tx("Bileklerini barın üstüne döndürüp dips gibi iterek çık. Başta lastik bantla çalış.")], x:tx("Bacakları savurarak çıkmaya çalışmak.") },
  { id:"frontlever", n:tx("Front lever"), r:/front lever/, s:[tx("Barda asıl, kollar düz."),tx("Kürek kemiklerini aşağı çek, vücudu yere paralel olacak kadar kaldır."),tx("Başta dizler karnında (tuck), güçlendikçe bacakları uzat.")], x:tx("Kolları bükmek; kollar kilitli kalmalı.") },
  { id:"chinup", n:tx("Chin-up"), r:/chin-up/, s:[tx("Barı avuçlar sana bakacak şekilde omuz genişliğinde tut."),tx("Göğsü bara doğru çek, çene barın üstüne çıksın."),tx("Kolları tam uzatana kadar yavaş in.")], x:tx("Yarım tekrar; altta kollar tam açılmalı.") },
  { id:"barfiks", n:tx("Barfiks"), r:/barfiks/, s:[tx("Barı avuçlar dışa bakacak şekilde omuzdan biraz geniş tut, kollar düz."),tx("Kürek kemiklerini aşağı çekerek başla, göğsü bara doğru çek."),tx("Çene barı geçince yavaşça tam aşağı in. Yapamıyorsan lastik bant ya da sadece iniş (negatif) çalış.")], x:tx("Bacakları savurmak ve yarım tekrar.") },
  { id:"invrow", n:tx("Ters kürek"), r:/ters kürek|avustralya|masa altı/, s:[tx("Alçak bir barın ya da sağlam bir masanın altına gir, barı tut."),tx("Vücut düz, topuklar yerde; göğsü bara çek."),tx("Yavaşça kolları uzat. Zorlaştırmak için ayakları yükselt.")], x:tx("Kalçanın sarkması.") },
  { id:"havlu", n:tx("Havlu kürek"), r:/havlu kürek/, s:[tx("Havluyu bir kapı koluna dolayıp iki ucunu tut (kapıyı kilitle)."),tx("Ayaklar kapıya yakın, geriye yaslan, kollar düz."),tx("Göğsünü kapıya doğru çek, kürek kemiklerini sık.")], x:tx("Kapının açılabilir olması; önce güvenliği kontrol et.") },
  { id:"kbrow", n:tx("Kettlebell row"), r:/kettlebell row/, s:[tx("Bir elin ve dizin banka dayalı, sırt düz."),tx("Kettlebell'i kalçana doğru çek, dirsek gövdeye yakın."),tx("Yavaşça indir; setin sonunda taraf değiştir.")], x:tx("Gövdeyi döndürerek çekmek.") },
  { id:"row", n:tx("Kürek"), r:/barbell row|kürek/, s:[tx("Dizler hafif bükülü, kalçadan öne eğil, sırt düz."),tx("Ağırlığı göbeğe doğru çek, kürek kemiklerini sık."),tx("Kontrollü indir. Makinede aynı hareketi oturarak yap.")], x:tx("Beli yuvarlamak ve ağırlığı gövdeyle savurmak.") },
  { id:"facepull", n:tx("Face pull"), r:/face pull/, s:[tx("Kabloyu ya da lastiği göz hizasına bağla, ipi avuçlar aşağı bakacak şekilde tut."),tx("İpi yüzüne doğru çek, elleri kulakların yanına aç."),tx("Kürek kemiklerini sık, yavaşça bırak.")], x:tx("Ağır yüklemek; bu bir duruş hareketi, hafif çalış.") },
  { id:"biceps", n:tx("Biceps"), r:/biceps|kol süperset/, s:[tx("Dirsekler gövdenin yanında sabit."),tx("Ağırlığı omuzlara doğru kaldır, üstte sık."),tx("Kollar tam açılana kadar yavaş indir. Süpersette hemen ardından triceps yap.")], x:tx("Gövdeyi geriye atarak kaldırmak.") },

  /* gövde */
  { id:"lsit", n:tx("L-sit"), r:/l-sit/, s:[tx("Paralel barlarda ya da iki sandalyede kolları kilitle, omuzları aşağı bastır."),tx("Bacakları düz şekilde öne kaldır, L harfi oluştur."),tx("Zorsa dizler bükülü (tuck) başla. V-sit için bacakları daha da yukarı kaldır.")], x:tx("Omuzların kulağa doğru çökmesi.") },
  { id:"dragon", n:tx("Dragon flag"), r:/dragon flag/, s:[tx("Bankta sırtüstü yat, başının arkasındaki bankı tut."),tx("Omuzlar üzerinde vücudu düz bir çizgi halinde kaldır."),tx("Kalçayı kırmadan olabildiğince yavaş indir. Başta dizler bükülü çalış.")], x:tx("Belin bankla temasını kaybedip kalçayı kırmak.") },
  { id:"hollowrock", n:tx("Hollow rock"), r:/hollow rock/, s:[tx("Hollow hold pozisyonuna geç."),tx("Vücut şeklini bozmadan öne arkaya salın."),tx("Bel her an yere yakın kalmalı.")], x:tx("Bacaklarla ivme almak.") },
  { id:"hollow", n:tx("Hollow hold"), r:/hollow/, s:[tx("Sırtüstü yat, belini yere bastır."),tx("Omuzları ve düz bacakları yerden birkaç santim kaldır, kollar başın üstünde."),tx("Süre boyunca bel yerde kalsın. Zorsa dizleri bük.")], x:tx("Belin yerden kalkması.") },
  { id:"yanplank", n:tx("Yan plank"), r:/yan plank/, s:[tx("Yan yat, dirsek omzun altında."),tx("Kalçayı kaldır, baştan ayağa düz bir çizgi."),tx("Süre dolunca taraf değiştir.")], x:tx("Kalçanın sarkması.") },
  { id:"plankserisi", n:tx("Plank serisi"), r:/plank serisi/, s:[tx("Ön kol plank ile başla, 5 nefes."),tx("Kollar düz plank, ardından yan plank; her birinde 5 nefes."),tx("Aşağı bakan köpekle bitir.")], x:tx("Kalçanın sarkması.") },
  { id:"plankjack", n:tx("Plank jack"), r:/plank jack/, s:[tx("Kollar düz plank pozisyonuna geç."),tx("Ayakları yanlara açıp kapat, zıplar gibi."),tx("Kalça sabit kalsın.")], x:tx("Kalçanın yukarı aşağı zıplaması.") },
  { id:"plank", n:tx("Plank"), r:/plank/, s:[tx("Dirsekler omuzların altında, ön kollar yerde."),tx("Karnı ve kalçayı sık, başından topuğuna düz bir çizgi."),tx("Nefesini tutmadan süreyi tamamla.")], x:tx("Kalçanın düşmesi ya da havaya kalkması.") },
  { id:"deadbug", n:tx("Dead bug"), r:/dead bug/, s:[tx("Sırtüstü yat, kollar tavana, dizler 90 derece havada."),tx("Belini yere bastırarak sağ kolu ve sol bacağı yavaşça uzat."),tx("Geri getir, diğer tarafla tekrarla.")], x:tx("Belin yerden kalkması.") },
  { id:"superman", n:tx("Superman"), r:/superman/, s:[tx("Yüzüstü yat, kollar önde uzanmış."),tx("Kolları, göğsü ve bacakları aynı anda yerden kaldır."),tx("Üstte iki saniye bekle, yavaşça indir.")], x:tx("Boynu geriye bükmek; bakış yere.") },
  { id:"karin", n:tx("Karın (crunch)"), r:/karın/, s:[tx("Sırtüstü yat, dizler bükülü, eller şakakta."),tx("Karnı sıkarak omuzları yerden kaldır."),tx("Yavaşça indir; boynu ellerle çekme.")], x:tx("Başı ellerle çekmek.") },
  { id:"mountain", n:tx("Mountain climber"), r:/mountain climber/, s:[tx("Kollar düz plank pozisyonuna geç."),tx("Dizleri sırayla hızlıca göğse çek."),tx("Kalça omuz hizasında kalsın.")], x:tx("Kalçayı havaya kaldırmak.") },

  /* amut */
  { id:"handstand", n:tx("Handstand"), r:/handstand/, s:[tx("Ellerini duvardan bir karış uzağa koy, parmaklar açık."),tx("Ayaklarla duvara yürü ya da tekmeyle çık, göğüs duvara bakabilir."),tx("Kollar kilitli, omuzlar kulağa doğru itilmiş, vücut düz kalsın.")], x:tx("Beli çukurlaştırmak; karnı ve kalçayı sık.") },

  /* kettlebell */
  { id:"swing", n:tx("Kettlebell swing"), r:/swing/, s:[tx("Kettlebell önünde, kalçadan eğil ve iki elle tut."),tx("Bacak arasına geri savur, ardından kalçayı patlayıcı şekilde öne iterek göğüs hizasına kaldır."),tx("Kollar sadece tutar, güç kalçadan gelir. Tek kol swing'de aynı hareketi tek elle yap.")], x:tx("Squat yapar gibi çömelmek ya da kollarla kaldırmak.") },
  { id:"tgu", n:tx("Türk kalkışı"), r:/türk kalkışı/, s:[tx("Sırtüstü yat, kettlebell tek kolda tavana doğru kilitli."),tx("Dirsek, sonra el üstüne kalk; kalçayı kaldır, arka bacağı altından geçirip dize gel."),tx("Ayağa kalk; aynı adımları tersinden izleyerek yere dön. Gözler hep ağırlıkta.")], x:tx("Acele etmek; her adımda dur ve dengeyi kontrol et.") },
  { id:"farmer", n:tx("Farmer taşıma"), r:/farmer/, s:[tx("İki ağır dumbbell ya da kettlebell'i yanlarında tut."),tx("Dik dur, omuzlar geride."),tx("Kısa ve sağlam adımlarla belirlenen mesafeyi yürü.")], x:tx("Omuzların öne düşmesi.") },

  /* kondisyon */
  { id:"burpee", n:tx("Burpee"), r:/burpee/, s:[tx("Çömel, ellerini yere koy."),tx("Ayakları geriye atıp plank pozisyonuna geç (istersen bir şınav)."),tx("Ayakları ellere çek ve zıplayarak kalk.")], x:tx("Plankta kalçanın düşmesi.") },
  { id:"yuksekdiz", n:tx("Yüksek diz"), r:/yüksek diz/, s:[tx("Yerinde koşar gibi dizleri kalça hizasına kaldır."),tx("Kollar koşu gibi çalışsın."),tx("Ayak uçlarında hafif ve hızlı kal.")], x:tx("Geriye yaslanmak.") },
  { id:"sprint", n:tx("Sprint (tepe / merdiven)"), r:/tepe sprint|merdiven sprint/, s:[tx("Önce 10 dakika ısın."),tx("Belirtilen süre boyunca tam güçle yokuş ya da merdiven çık."),tx("Yürüyerek aşağı in ve toparlan; her tekrar aynı kalitede olsun.")], x:tx("Isınmadan başlamak; hamstring sakatlığının en sık nedeni.") },
  { id:"kosuyuruyus", n:tx("Koşu-yürüyüş aralığı"), r:/koşu \/|koşu-yürüyüş|× \d+ dk koşu|\d+ tur \(/, s:[tx("5 dakika tempolu yürüyüşle ısın."),tx("Koşu kısımlarını konuşabileceğin rahat bir tempoda koş."),tx("Yürüyüş aralarında nefesini toparla; tur sayısını tamamla.")], x:tx("Koşu aralarında fazla hızlanmak; amaç süre, hız değil.") },
  { id:"kosu", n:tx("Koşu"), r:/koşu/, s:[tx("Isınma için ilk 5 dakikayı yavaş koş."),tx("Tempolu koşuda cümle kurabilecek, şarkı söyleyemeyecek kadar zorlan; düşük tempoda rahatça konuşabilmelisin."),tx("Adımlar kısa ve sık olsun, ayak gövdenin altına bassın.")], x:tx("Uzun adımla topuğa sert basmak.") },
  { id:"ipatlama", n:tx("İp atlama"), r:/ip atlama/, s:[tx("İpin sapları koltuk altına gelecek uzunlukta olsun."),tx("Bileklerden çevir, ayak uçlarında alçak zıpla."),tx("30-60 saniyelik bloklar halinde çalış.")], x:tx("Kollarla büyük daireler çizmek.") },
  { id:"yuruyus", n:tx("Yürüyüş / bisiklet"), r:/yürüyüş|bisiklet/, s:[tx("Hafif nefes nefese kalacak ama konuşabileceğin bir tempo seç."),tx("Omuzlar rahat, kollar serbest salınsın."),tx("Süreyi kesintisiz tamamla; bisiklette direnci orta tut.")], x:tx("Aktif dinlenme gününde fazla zorlanmak.") },

  /* yoga ve mobilite */
  { id:"gunes", n:tx("Güneş selamı"), r:/güneş selamı/, s:[tx("Ayakta kolları yukarı kaldır, nefes al."),tx("Öne eğil, elleri yere koy; geri adımla plank, yere in, kobra."),tx("Aşağı bakan köpek pozunda 5 nefes kal, öne adımla ve ayağa kalk. Bu bir tur.")], x:tx("Nefesle hareketi eşleştirmemek.") },
  { id:"savasci", n:tx("Savaşçı serisi"), r:/savaşçı/, s:[tx("Geniş bir adım aç, öndeki diz 90 derece bükülü."),tx("Savaşçı 1'de kollar yukarı, savaşçı 2'de kollar yanlara açık."),tx("Her pozda 5 nefes kal, taraf değiştir.")], x:tx("Öndeki dizin ayak bileğini geçmesi.") },
  { id:"guvercin", n:tx("Güvercin pozu"), r:/güvercin/, s:[tx("Dört ayak pozisyonundan sağ dizini sağ elinin arkasına getir."),tx("Sol bacağı geriye uzat, kalçayı yere doğru bırak."),tx("Gövdeyi öne eğ, 60-90 saniye nefes al; taraf değiştir.")], x:tx("Dizde ağrı hissetmek; kalçanın altına yastık koy.") },
  { id:"kelebek", n:tx("Kelebek"), r:/kelebek/, s:[tx("Otur, ayak tabanlarını birleştir."),tx("Topukları kalçana doğru çek, dizleri yere doğru bırak."),tx("Sırt düz, hafif öne eğil ve nefes al.")], x:tx("Dizleri elle aşağı bastırmak.") },
  { id:"kedi", n:tx("Kedi-inek"), r:/kedi-inek/, s:[tx("Dört ayak pozisyonuna geç."),tx("Nefes alırken beli çukurlaştır, başı kaldır (inek)."),tx("Nefes verirken sırtı yuvarla, çeneyi göğse al (kedi).")], x:tx("Acele etmek; her hareket bir nefes sürer.") },
  { id:"cocuk", n:tx("Çocuk pozu"), r:/çocuk pozu/, s:[tx("Diz çök, kalçanı topuklarına oturt."),tx("Kolları öne uzatarak alnını yere bırak."),tx("Sırtına doğru derin nefes al.")], x:tx("Nefesi tutmak.") },
  { id:"sandalyepoz", n:tx("Sandalye pozu"), r:/sandalye pozu/, s:[tx("Ayaklar bitişik, kolları yukarı kaldır."),tx("Hayali bir sandalyeye oturur gibi kalçayı geri indir."),tx("5-8 nefes kal.")], x:tx("Dizlerin ayak uçlarını çok geçmesi.") },
  { id:"agac", n:tx("Ağaç dengesi"), r:/ağaç/, s:[tx("Tek ayak üstünde dur."),tx("Diğer ayak tabanını baldırına ya da iç uyluğuna yerleştir (dizine değil)."),tx("Elleri göğüste birleştir, sabit bir noktaya bak; taraf değiştir.")], x:tx("Ayağı dizin iç yüzüne bastırmak.") },
  { id:"onegilme", n:tx("Öne eğilme"), r:/öne eğilme|hamstring/, s:[tx("Ayaklar kalça genişliğinde, dizler hafif bükülü."),tx("Kalçadan öne eğil, gövdeyi bacaklara bırak."),tx("Her nefes verişte biraz daha gevşe; zorlama.")], x:tx("Sırtı yuvarlayarak yere uzanmaya çalışmak.") },
  { id:"omuzacici", n:tx("Omuz açıcılar"), r:/omuz açıcı/, s:[tx("Ellerini arkanda birleştir ya da bir havlu tut."),tx("Göğsü açarak kolları yukarı kaldır."),tx("Kapı çerçevesine dayanarak göğüs esnetmesiyle devam et; her biri 30 saniye.")], x:tx("Omuzları kulağa doğru kaldırmak.") },
  { id:"nefes", n:tx("Nefes çalışması"), r:/nefes çalışması|gevşeme/, s:[tx("Rahat bir pozisyonda otur ya da uzan."),tx("4 saniye burundan nefes al, 6 saniye ağızdan ver."),tx("Dikkatin dağılırsa nefesi saymaya dön.")], x:tx("Nefesi zorlamak; rahat ve yavaş olmalı.") },
  { id:"esneme", n:tx("Esneme"), r:/esneme|mobilite/, s:[tx("Isınmış kaslarla çalış."),tx("Her esnemede 30 saniye kal, ağrıya değil gerginliğe kadar git."),tx("Kalça, arka bacak, baldır, göğüs ve omuzları sırayla çalış.")], x:tx("Yaylanarak esnemek.") },
  { id:"isinma", n:tx("Isınma / soğuma"), r:/ısınma|soğuma/, s:[tx("Isınmada hafif tempoyla başla, nabzı yavaşça yükselt."),tx("Eklemleri dairesel hareketlerle aç."),tx("Soğumada tempoyu kademeli düşür, ardından kısa esneme yap.")], x:tx("Isınmayı atlamak.") },

  /* yüzme */
  { id:"yuzmeteknik", n:tx("Teknik yüzme"), r:/teknik \(/, s:[tx("Her 50 metrede tek bir detaya odaklan: nefes ya da ayak vuruşu."),tx("Nefes için başı yana çevir, kaldırma; bir gözün suda kalsın."),tx("Ayak vuruşu kalçadan gelsin, dizler fazla bükülmesin.")], x:tx("Nefes alırken başı kaldırmak; kalça batar.") },
  { id:"yuzmesprint", n:tx("Hızlı yüzme / sprint"), r:/hızlı|sprint/, s:[tx("Her tekrarda tam güçle yüz."),tx("Aralarda belirtilen süre kadar kenarda dinlen."),tx("Teknik bozulursa tempoyu biraz düşür.")], x:tx("Dinlenmeyi kısaltıp tekniği kaybetmek.") },
  { id:"serbest", n:tx("Serbest stil"), r:/serbest/, s:[tx("Vücut suyun yüzeyinde düz, bakış aşağı."),tx("Kollar sırayla uzanıp suyu kalçana doğru it."),tx("Her 2-3 kulaçta bir yana dönerek nefes al.")], x:tx("Kalçanın batması; karnını sık, başı aşağıda tut.") }
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
