# Starboard logo alternatifleri

Mevcut logo (`starboard-site/icon.svg`): turuncu-pembe zemin, yükselen dört çubuk ve en yüksek çubuğun üstünde bir yıldız.
İstek: sürekli gelişim ve yıldız temasına bağlı kalan, daha vurucu ve harekete geçirici bir işaret.

Hepsi 180×180 viewBox'lı tek SVG dosyası, yazısız ve App Store ikonu olarak kullanılabilir. Önizleme için köşeler `rx=40`; iOS köşeyi kendisi yuvarladığı için gerçek ikonda düz kare zemin kullanılabilir.
01–06 mevcut turuncu-pembe ailesini (#FF7A2F → #FF3D6E, beyaz #FFFCFA) korur; 07 ve 08 daha cesur paletlerdir. Gradyan kimlikleri her dosyada farklıdır (`sbA1bg`, `sbA2bg` …).
Yıldızlar mevcut logodaki dört köşeli parıltının daha dolgun bir hâlidir, böylece küçük boyutta da kaybolmaz.

Karşılaştırma için `index.html` dosyasını tarayıcıda açın: mevcut logo ve tüm alternatifler 180, 60 ve 29 px'te, açık ve koyu zemin üzerinde gösterilir.
Küçük boyut testi Chrome headless ile yapıldı (`--screenshot`): her ikon 29×29 piksele çizilip büyütülerek piksel piksel incelendi.

## Alternatifler

### 01 · Yıldız İzi (`01-yildiz-izi.svg`)
- **Fikir:** Soldan sağa yükselen ve giderek büyüyen üç yıldız; her tamamlanan gün bir öncekinden daha parlak yanar.
- **Neden vurucu:** Çubukları atıp doğrudan yıldızı kahraman yapıyor; büyüme hissi boyut farkıyla, yön hissi çapraz yükselişle veriliyor.
- **29 px:** Büyük yıldız net okunur, orta yıldız seçilir, en küçüğü sadece bir parıltı olarak kalır (kasıtlı).

### 02 · Takımyıldız Grafiği (`02-takimyildiz-grafigi.svg`)
- **Fikir:** Haftanın beş yıldızı bir çizgiyle birleşip yükselen bir grafiğe dönüşüyor; son nokta büyük yıldız. Uygulamadaki "haftada beş yıldız = takımyıldız" kurgusunun birebir karşılığı.
- **Neden vurucu:** Hem ilerleme grafiği hem takımyıldız; aradaki küçük düşüş gerçekçi bir ilerlemeyi anlatıyor ama sonuç yine yukarı.
- **29 px:** Zikzak çizgi ve sağ üstteki yıldız okunur; ara noktalar çizgiyle birleşir ama şekil bozulmaz.

### 03 · Seviye Atla (`03-seviye-atla.svg`)
- **Fikir:** Üst üste iki yukarı ok (rütbe işareti gibi) ve tepede yıldız: her gün bir seviye yukarı.
- **Neden vurucu:** Oyunlardaki "seviye atladın" diline yakın, simetrik ve sakin değil yönlü; bakınca yukarı itiyor.
- **29 px:** İki ok ve yıldız ayrı ayrı seçilir. İlk denemedeki üç ok küçük boyutta tek bir şerit hâline geldiği için ikiye indirildi.

### 04 · Yıldız Merdiveni (`04-yildiz-merdiveni.svg`)
- **Fikir:** Dolu, tek parça bir merdiven ve en üst basamağın üstünde yıldız; mevcut çubuk fikrinin daha somut ve ağır hâli.
- **Neden vurucu:** Ayrık çubuklar yerine tek parça kütle daha güçlü görünüyor; "adım adım zirveye" mesajı herkes için anında anlaşılır.
- **29 px:** En dayanıklı alternatiflerden biri; büyük beyaz kütle her zeminde net.

### 05 · Monogram S (`05-monogram-s.svg`)
- **Fikir:** Kalın bir S harfi; üst ucu yukarı kıvrılıyor ve yanında yıldız yanıyor. Harf yazı değil, şekil olarak kullanıldı.
- **Neden vurucu:** Marka adıyla doğrudan bağ kuran, akılda kalan ve bir uygulama ızgarasında hemen bulunan bir işaret.
- **29 px:** Çok iyi; S ve yıldız rahatça okunur. "Yükselme" fikri diğerlerine göre daha dolaylı.

### 06 · Yıldız Nabzı (`06-yildiz-nabzi.svg`)
- **Fikir:** Düz giden kalp ritmi çizgisi son atışta yukarı fırlayıp yıldıza dönüşüyor: sağlık takibi + zirve anı.
- **Neden vurucu:** Uygulamanın sağlık (antrenman, uyku, beslenme) tarafını tek çizgide anlatıyor; son atışın sert yükselişi enerji veriyor.
- **29 px:** Çizgi ve yıldız iyi okunur; zikzak kalın olduğu için kaybolmuyor.

### 07 · Gece Zirvesi (`07-gece-zirvesi.svg`) · cesur palet
- **Fikir:** Gece mavisi gökyüzü, turuncu-pembe dağ silüeti ve zirvenin üstünde parlayan yıldız. Marka renkleri dağda yaşamaya devam ediyor.
- **Neden vurucu:** Koyu zemin üzerindeki sıcak renkli zirve ve parlak yıldız çok güçlü bir kontrast yaratıyor; "zirveye tırman" mesajı duygusal.
- **29 px:** Dağ ve yıldız okunur; sol üstteki küçük yıldız noktası sadece süs. Koyu ana ekranda ikonun kenarı zeminle birleşebilir (bkz. `index.html` koyu zemin).

### 08 · İvme Yıldızı (`08-ivme-yildizi.svg`) · cesur palet
- **Fikir:** Pembe-mor zemin üzerinde hız çizgileriyle sağ üste fırlayan büyük sarı yıldız: ivme, harekete geçmek.
- **Neden vurucu:** Paletin en yüksek kontrastlısı (sarı/mor); ana ekranda en çok dikkat çeken ve en "hareketli" görünen alternatif.
- **29 px:** Yıldız çok net; hız çizgileri incelir ama yön hissi korunur. Turuncu-pembe kimlikten en uzak olan seçenek.

## Sıralamam

1. **02 · Takımyıldız Grafiği:** Uygulamanın kendine özgü kurgusunu (her gün bir yıldız, haftada beş yıldız takımyıldız olur) hem ilerleme grafiği hem takımyıldız olarak tek işarette topluyor. Marka renkleri korunuyor, yukarı yön çok net, 29 px'te de okunuyor.
2. **06 · Yıldız Nabzı:** Bir sağlık uygulaması olduğunu ilk bakışta söyleyen tek alternatif; son atıştaki fırlayış en "harekete geçirici" an. Küçük boyutta güçlü.
3. **04 · Yıldız Merdiveni:** Mevcut logonun ruhunu koruyan en güvenli geçiş; daha ağır ve vurucu. Mevcut kullanıcılar için tanıdık kalır ve her boyutta en net okunanlardan.

Yakından takip edenler: **05 · Monogram S** marka bilinirliği için çok güçlü ama yükselme fikri dolaylı; **08 · İvme Yıldızı** en dikkat çekici olan, ancak renk kimliğini değiştirmeyi gerektirir.
