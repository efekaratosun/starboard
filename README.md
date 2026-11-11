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

## Yerelde çalıştırma

Site (http://localhost:8765):

```
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

Testler (http://localhost:8766/tests/):

```
powershell -ExecutionPolicy Bypass -File tools/serve.ps1 -Root . -Port 8766
```
