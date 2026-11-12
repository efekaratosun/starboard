# Starboard

Beslenme, antrenman, uyku ve su takibi. Veriler yalnızca kullanıcının cihazında saklanır.

Canlı site: https://efekaratosun.github.io/starboard/

Yol haritası: [ROADMAP.md](ROADMAP.md)

## Klasörler

- `starboard-site/`: yayınlanan site. `index.html`, `css/` (stiller), `js/` (kod), `sw.js` (çevrimdışı önbellek).
- `tests/`: otomatik testler. Tarayıcıda çalışır.
- `tools/serve.ps1`: yerel geliştirme sunucusu.
- `.github/workflows/deploy.yml`: her gönderimde testleri çalıştırır; `main` dalında testler geçerse siteyi yayınlar.

## Kod dosyaları

`js/` altındaki dosyalar `index.html` içindeki sırayla yüklenir ve aynı genel kapsamı paylaşır; sıra önemlidir.
Yeni bir dosya eklenince hem `index.html` hem `sw.js` içindeki listeye yazılmalıdır.

## Yazı tipi

Nunito `starboard-site/fonts/` altındaki `woff2` dosyalarından yüklenir (`css/tokens.css` içindeki `@font-face`; Türkçe için `latin-ext` gerekli). Dışarıdan yazı tipi ya da stil yüklenmez. Yeni bir yazı tipi dosyası eklenince `sw.js` içindeki `SHELL` listesine de yazılmalıdır; test bunu denetler.

## Çeviri

Kaynak dil Türkçedir. Ekranda görünen her metin `tx("...")` içine yazılır; değişken içeren metinlerde yer tutucu kullanılır: `tx("{0} tarif bulundu", [n])`.
İngilizce karşılıklar `starboard-site/js/lang/en.js` dosyasındadır; anahtar koddaki Türkçe metnin aynısıdır. Sözlükte olmayan metin İngilizce modda Türkçe görünür.
Beslenme içeriğinin (besinler, tarifler) karşılıkları `starboard-site/js/lang/en-food.js` dosyasındadır.
Antrenman içeriği `starboard-site/js/lang/en-workout.js` dosyasındadır. Antrenman satırları ("Omuz press 3×10 · 20 dk koşu") bir istisnadır: ayrıştırma, rehber eşleşmesi ve kişisel rekorlar bu metinlere bağlı olduğu için kodda Türkçe kalır ve sözlüğe yazılmaz; ekrana basılırken `exText()` ile, dosyanın sonundaki kelime sözlüğü (`STARBOARD_EN_EX`) kullanılarak çevrilir. Yeni bir hareket eklenince adı o sözlüğe yazılmalıdır.
Yeni metin eklerken `tx()` içine almak ve sözlüğe karşılığını yazmak gerekir.

Toplu dönüştürme için `tools/i18n-codemod.js` kullanılır; açıklaması dosyanın başındadır. Dosyaları yerinde yazabilmesi için site `tools/devserve.ps1` ile açılmalıdır (yalnızca yerelde, `starboard-site/js` altına yazar).

## Mutfak ve beslenme içeriği

Besinler, tarifler ve hazır menüler `nutrition.js` (temel ve Türk mutfağı) ile `foods-intl.js` (uluslararası) dosyalarındadır. `cu:"tr"` Türk mutfağına, `cu:"intl"` uluslararası mutfağa özgü demektir; etiketsizler iki mutfakta da önerilir. Öneriler, hazır menüler ve tarif listesi kullanıcının mutfağına göre süzülür (`currentCuisine()`), arama her zaman hepsini kapsar. `pork:true` domuz eti içerenleri işaretler (helal ve koşerde önerilmez). Yeni besin eklerken: 100 g başına değerler, İngilizce adı `lang/en-food.js`'e, gerekiyorsa içerik kümelerine (`HAS_MEAT`, `HAS_GLUTEN`, `NO_SUGGEST`…) yazılır; testler her tarif malzemesinin ve menü besininin veritabanında olduğunu ve her mutfağın menüsünde başka mutfağa ait besin bulunmadığını denetler.

## Sürüm çıkarırken

1. `starboard-site/js/storage.js` içindeki `APP_VERSION`'ı artır, `CHANGELOG.md`'ye yaz.
2. Kullanıcının fark edeceği bir değişiklik varsa `starboard-site/js/whatsnew.js` içindeki `WHATS_NEW` listesinin en üstüne kısa maddelerle ekle; uygulama güncellemeden sonraki ilk açılışta bunu bir kez gösterir.
3. Hesap yöntemi değiştiyse `starboard-site/js/about.js` içindeki kaynak listesini (`SOURCES`) güncelle.

## Hesap ve ekran

Hesaplar metin üretmez: yalnızca sayı ve durum döndürür, ekran kodu bunları `tx()` ve birim yardımcılarıyla metne çevirir. Böylece dil ya da birim değişince hesap değişmez ve testler metne bağlı kalmaz.

- `evaluate.js`: `assess()` günün ölçümlerini aralıklarla karşılaştırır; `evaluate()` ekrana çevirir.
- `goals.js`: `taskStatus()` bir hedefin o günkü durumu (kalori, protein, su, uyku, tartı, adım, antrenman); `kcalRange()` kalori bandı; `taskTitle()` kayda yazılan, dilden bağımsız görev başlığı. Ekrandaki karşılığı `autoInfo()` (`today.js`). Gün puanı ve yıldızlar doğrudan `taskStatus()` kullanır.
- `charts.js`: `chartData()` grafik serileri, sağlıklı aralıklar ve farklar; `chartsView()` çizer.
- `widgets.js`: `weekStats()` son 7 günün sayıları; `weeklySummary()` gösterir.

Yeni bir hesap eklerken aynı ayrımı koru: hesap işlevine metin, HTML ya da birim koyma.

## Birimler

Kayıtta her değer metriktir: kilo ve kaldırılan ağırlık kg, boy ve vücut ölçüleri cm, su ml. Kullanıcı imperial seçtiyse değerler yalnızca ekrana yazılırken ve giriş alanından okunurken çevrilir. Yardımcılar `starboard-site/js/units.js` içindedir: ekrana yazarken `fmtW`, `fmtV`, `fmtLift`, `fmtHeight`, girilen değeri kaydederken `wSave`, `vIn`, `liftIn`, `lIn`. Yeni bir kilo, su ya da ölçü alanı eklerken bunlar kullanılmalı; ekrana doğrudan "kg" ya da "ml" yazılmamalı. Sayılar `fmtN` ile yazılır (Türkçede virgül, İngilizcede nokta).

## Hareket animasyonları

"Nasıl yapılır" kartlarındaki çizgi figür `starboard-site/js/exercise-anim.js` içinde tanımlıdır. Görsel ya da video dosyası yoktur: her animasyon, eklem açılarıyla yazılmış iki ya da daha çok pozdan oluşur ve Motion kütüphanesiyle (`js/vendor/motion.js`, MIT lisansı yanında) pozlar arasında oynatılır. Poz biçimi dosyanın başında anlatılır.

Yeni bir hareket eklerken: `EX_ANIMS` içine pozlarını yaz (ya da var olan bir animasyonu kullan) ve `EX_ANIM_OF` içinde rehber kaydına bağla. Testler her rehber kaydının bir animasyonu olduğunu ve hiçbir eklemin çizim alanı dışına ya da yerin altına taşmadığını denetler.

Bütün animasyonları yan yana görmek için site `tools/devserve.ps1` ile açıkken `http://localhost:8766/tools/anim-gallery.html` adresine git. `?v=both` eklenirse her hareketin ilk ve son pozu üst üste görünür.

## Erişilebilirlik denetimi

Site yerelde açıkken (aşağıdaki test sunucusu) `http://localhost:8766/tools/a11y-audit.html` adresi uygulamayı 320, 375 ve 414 px genişliğinde açar ve her ekran için yatay taşmayı, etiketsiz alanları, adsız düğmeleri, 44 px altındaki dokunma alanlarını, 11 px altındaki yazıları ve 4,5:1 altındaki kontrastı listeler. `?t=dark` koyu tema, `?l=en` İngilizce, `?w=320` tek genişlik. Takvim günleri, renk seçici ve su bardakları gibi satıra sığmak zorunda olan öğeler genişlikte 44 px'in altında kalır; bu bilinen ve kabul edilen bir durumdur.

## Yerelde çalıştırma

Site (http://localhost:8765):

```
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

Testler (http://localhost:8766/tests/):

```
powershell -ExecutionPolicy Bypass -File tools/serve.ps1 -Root . -Port 8766
```
