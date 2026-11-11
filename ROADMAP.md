# Starboard Roadmap

Hedef: Starboard'ı sürekli güncellenen bir ürüne dönüştürmek ve App Store'da yayınlamak.

Başlangıç durumu (11 Kasım 2026): tek dosyalık (yaklaşık 9.000 satır) bir web uygulaması, veriler tarayıcıda `localStorage` içinde, site klasörü `starboard-site/` hazır ama yayında değil.

## Verilen kararlar (11 Kasım 2026)

- **Sıra:** önce web. Uygulama web'de denenip eksikleri giderilir, App Store en son gelir.
- **Pazar ve dil:** uluslararası. Çok dilli altyapı Faz 1'de kurulur, ilk ek dil İngilizce.
- **Gelir modeli:** eğilim tek seferlik ücretli; kesin karar en sona (Faz 4) bırakıldı.

## Faz 0: Temel (şimdi)

Amaç: projenin kalıcı bir evi ve canlı bir adresi olsun.

- [x] Projeyi kalıcı bir klasöre taşı
- [x] Git kur, yerel depoyu başlat
- [x] GitHub'da depo aç (sürüm geçmişi ve ileride iOS derlemesi için şart): github.com/efekaratosun/starboard
- [x] Siteyi yayınla; her değişiklik depodan otomatik yayına çıksın: efekaratosun.github.io/starboard
- [ ] Artifact'teki verileri dışa aktarıp yeni sitede içe aktar

Bitti sayılır: Starboard herkese açık bir adreste çalışıyor ve bir değişiklik tek adımda yayına çıkıyor.

## Faz 1: Güncellenebilir kod tabanı

Amaç: yeni özellik eklemek mevcut olanı bozmasın.

- [x] Tek dosyayı ayrı dosyalara böl: 3 stil, 19 kod dosyası (`starboard-site/css`, `starboard-site/js`); ekran çıktısı eskisiyle birebir aynı
- [x] Otomatik testler (`tests/`): her gönderimde çalışır, testler kalırsa site yayınlanmaz
- [ ] Hesaplamaları ekran kodundan ayır (şu an bazı hesaplar HTML üretimiyle iç içe); derleme adımı Faz 3'te Node ile birlikte gelir
- [x] Çok dilli altyapı: `tx()` çeviri işlevi, dil seçimi (Ayarlar), dile göre tarih ve gün adları
- [x] Arayüz metinlerinin İngilizcesi: yaklaşık 1.100 metin çeviriye bağlandı, sözlükte 730 karşılık (`starboard-site/js/lang/en.js`)
- [x] Beslenme içeriğinin İngilizcesi: 320 besin adı, porsiyon ölçüleri, mikro besinler, hazır menüler ve tarifler (`starboard-site/js/lang/en-food.js`, 630 karşılık)
- [ ] Antrenman içeriğinin İngilizcesi: program adları, gün başlıkları, hareketler ve hareket anlatımları (yaklaşık 600 metin). Hareket adları kayıtlarda ve anlatım eşleşmesinde anahtar olarak kullanıldığı için önce adın gösterimden ayrılması gerekiyor
- [ ] İçeriğin uluslararası uyarlaması (Faz 2): çeviri tamam, ama besin ve tarif seçkisi hâlâ Türk mutfağı ağırlıklı
- [ ] Kalan arayüz parçaları: küçük harfle başlayan kısa metinler ve kayıtlı görev başlıkları
- [ ] Birimler dile göre (kg/lb, ml/oz)
- [ ] İngilizce "beta" etiketini kaldır ve tarayıcı diline göre otomatik seçim aç (içerik çevirisi bitince)
- [ ] Sürüm numarası ve değişiklik günlüğü
- [ ] Veri şeması sürümleme: eski kayıtlar her güncellemede güvenle yeni biçime taşınsın
- [ ] Test kapsamını genişlet: gün puanı, yıldızlar, haftalık yenileme
- [ ] Depolama anahtarını (`saglik-takip-v1`) göçle birlikte yeniden adlandır

Bitti sayılır: testler geçiyor, eski bir yedek dosyası yeni sürümde sorunsuz açılıyor.

## Faz 2: Ürün geliştirme (sürekli)

Amaç: App Store'a çıkmaya değer bir ürün.

- [ ] Kullanırken görülen eksikleri `EKSIKLER.md` listesine yaz, önceliklendir (her düzeltme küçük sürümler halinde web'de yayınlanır)
- [ ] Birkaç gerçek kullanıcıyla web sürümünü dene, geri bildirim topla
- [ ] İçeriğin uluslararası uyarlaması: yemek ve tarif veritabanı Türkiye dışı kullanıcılar için de anlamlı olmalı
- [ ] Erişilebilirlik ve küçük ekran denetimi

Bu faz diğerleriyle paralel yürür ve yayından sonra da sürer.

## Faz 3: iOS uygulaması

Amaç: web sitesini saran bir kabuk değil, gerçek bir iPhone uygulaması. Apple, yalnızca bir web sitesini gösteren uygulamaları reddediyor (kural 4.2), bu yüzden bu fazdaki yerel özellikler isteğe bağlı değil.

- [ ] Capacitor ile iOS projesi (mevcut web kodu yeniden kullanılır)
- [ ] Kalıcı yerel depolama (iOS, web görünümündeki `localStorage` verisini silebilir)
- [ ] Bildirimler: su, uyku ve antrenman hatırlatmaları
- [ ] Apple Sağlık (HealthKit) bağlantısı: adım, uyku, kilo
- [ ] Dokunsal geri bildirim, güvenli alan ve karanlık mod ayarları
- [ ] Mac olmadan derleme: bulutta macOS derleme hattı (GitHub Actions veya Codemagic)

Gerekenler: Apple Developer hesabı (yıllık 99 USD) ve test için bir iPhone.

Bitti sayılır: uygulama TestFlight üzerinden kendi telefonunda çalışıyor.

## Faz 4: App Store hazırlığı

- [ ] "Starboard" adının App Store'da uygunluğunu kontrol et
- [ ] Gizlilik politikası ve destek sayfası (web sitesinde yayınlanır)
- [ ] Sağlık içeriği: hesaplamaların kaynakları ve "tıbbi tavsiye değildir" uyarısı (kural 1.4.1)
- [ ] App Store gizlilik beyanı ve HealthKit kullanım açıklamaları
- [ ] Simge, ekran görüntüleri, açıklama metni, anahtar kelimeler
- [ ] TestFlight ile dış test

## Faz 5: Yayın ve sonrası

- [ ] İncelemeye gönder, ret gelirse gerekçeyi gider ve yeniden gönder
- [ ] Yayın sonrası güncelleme düzeni: web'de dene, sonra App Store sürümü
- [ ] İsteğe bağlı: Google Play (aynı Capacitor projesinden, tek seferlik 25 USD)

## Açık kararlar

- Apple Developer hesabı ne zaman açılacak (Faz 3 başlamadan gerekli)
- Gelir modelinin kesinleşmesi (Faz 4'te; eğilim tek seferlik ücretli)
