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

## Çeviri

Kaynak dil Türkçedir. Ekranda görünen her metin `tx("...")` içine yazılır; değişken içeren metinlerde yer tutucu kullanılır: `tx("{0} tarif bulundu", [n])`.
İngilizce karşılıklar `starboard-site/js/lang/en.js` dosyasındadır; anahtar koddaki Türkçe metnin aynısıdır. Sözlükte olmayan metin İngilizce modda Türkçe görünür.
Beslenme içeriğinin (besinler, tarifler) karşılıkları `starboard-site/js/lang/en-food.js` dosyasındadır.
Antrenman içeriği `starboard-site/js/lang/en-workout.js` dosyasındadır. Antrenman satırları ("Omuz press 3×10 · 20 dk koşu") bir istisnadır: ayrıştırma, rehber eşleşmesi ve kişisel rekorlar bu metinlere bağlı olduğu için kodda Türkçe kalır ve sözlüğe yazılmaz; ekrana basılırken `exText()` ile, dosyanın sonundaki kelime sözlüğü (`STARBOARD_EN_EX`) kullanılarak çevrilir. Yeni bir hareket eklenince adı o sözlüğe yazılmalıdır.
Yeni metin eklerken `tx()` içine almak ve sözlüğe karşılığını yazmak gerekir.

Toplu dönüştürme için `tools/i18n-codemod.js` kullanılır; açıklaması dosyanın başındadır. Dosyaları yerinde yazabilmesi için site `tools/devserve.ps1` ile açılmalıdır (yalnızca yerelde, `starboard-site/js` altına yazar).

## Birimler

Kayıtta her değer metriktir: kilo ve kaldırılan ağırlık kg, boy ve vücut ölçüleri cm, su ml. Kullanıcı imperial seçtiyse değerler yalnızca ekrana yazılırken ve giriş alanından okunurken çevrilir. Yardımcılar `starboard-site/js/units.js` içindedir: ekrana yazarken `fmtW`, `fmtV`, `fmtLift`, `fmtHeight`, girilen değeri kaydederken `wSave`, `vIn`, `liftIn`, `lIn`. Yeni bir kilo, su ya da ölçü alanı eklerken bunlar kullanılmalı; ekrana doğrudan "kg" ya da "ml" yazılmamalı. Sayılar `fmtN` ile yazılır (Türkçede virgül, İngilizcede nokta).

## Hareket animasyonları

"Nasıl yapılır" kartlarındaki çizgi figür `starboard-site/js/exercise-anim.js` içinde tanımlıdır. Görsel ya da video dosyası yoktur: her animasyon, eklem açılarıyla yazılmış iki ya da daha çok pozdan oluşur ve Motion kütüphanesiyle (`js/vendor/motion.js`, MIT lisansı yanında) pozlar arasında oynatılır. Poz biçimi dosyanın başında anlatılır.

Yeni bir hareket eklerken: `EX_ANIMS` içine pozlarını yaz (ya da var olan bir animasyonu kullan) ve `EX_ANIM_OF` içinde rehber kaydına bağla. Testler her rehber kaydının bir animasyonu olduğunu ve hiçbir eklemin çizim alanı dışına ya da yerin altına taşmadığını denetler.

Bütün animasyonları yan yana görmek için site `tools/devserve.ps1` ile açıkken `http://localhost:8766/tools/anim-gallery.html` adresine git. `?v=both` eklenirse her hareketin ilk ve son pozu üst üste görünür.

## Yerelde çalıştırma

Site (http://localhost:8765):

```
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

Testler (http://localhost:8766/tests/):

```
powershell -ExecutionPolicy Bypass -File tools/serve.ps1 -Root . -Port 8766
```
