# Starboard Roadmap

Hedef: Starboard'ı sürekli güncellenen bir ürüne dönüştürmek ve App Store'da yayınlamak.

Başlangıç durumu (11 Kasım 2026): tek dosyalık (yaklaşık 9.000 satır) bir web uygulaması, veriler tarayıcıda `localStorage` içinde, site klasörü `starboard-site/` hazır ama yayında değil.

## Verilen kararlar (11 Kasım 2026)

- **Sıra:** önce web. Uygulama web'de denenip eksikleri giderilir, App Store en son gelir.
- **Pazar ve dil:** uluslararası. Çok dilli altyapı Faz 1'de kurulur, ilk ek dil İngilizce.
- **Gelir modeli:** eğilim tek seferlik ücretli; kesin karar en sona (Faz 4) bırakıldı.

## Verilen kararlar (12 Kasım 2026)

- **Hesap yok (ilk sürüm):** Starboard hesapsız çıkar, veriler cihazda kalır. Gerekçe: "veriler cihazında kalır" vaadi ve App Store'daki temiz gizlilik etiketi korunur; sunucu, maliyet ve bakım yükü olmaz; sağlık verisi özel nitelikli veri sayıldığı için KVKK/GDPR yükü doğmaz; Apple'ın hesap silme ve Apple ile Giriş kuralları gerekmez; kayıt ekranı kullanıcı kaybettirmez. Gelir modeli için hesap gerekmez (Apple'ın ödeme sistemi hesapsız çalışır). Telefon değişimi iCloud cihaz yedeği ve Ayarlar'daki dosyaya yedekle/geri yükle ile karşılanır. iCloud ile eşitleme seçenek değil: kural 5.1.3(ii) sağlık verisinin iCloud'da saklanmasını yasaklıyor. Yayından sonra kullanıcılar eşitleme isterse (şifreli eşitleme ya da isteğe bağlı hesap) yeniden değerlendirilir.
- **Yazı tipi uygulamaya gömülür:** Nunito Google Fonts'tan değil uygulamanın içinden yüklenir; dışarıya istek gitmez, internetsiz de aynı görünür.
- **App Store gizlilik etiketi:** bugünkü haliyle "Veri Toplanmıyor". Barkod gelince Open Food Facts'e giden barkod numarası temkinli olarak "Arama Geçmişi – sizinle ilişkilendirilmez – izleme yok – amaç: uygulama işlevi" diye beyan edilir (Open Food Facts kayıtları ne kadar sakladığını belirtmiyor). HealthKit verisi cihazdan çıkmadığı için etikete girmez.
- **iCloud cihaz yedeği:** kayıt dosyası yedekte kalır; hesap olmadığı için telefon değişiminde verinin taşınmasının ana yolu bu. Kural 5.1.3(ii) uygulamanın kendisinin iCloud'a yazmasını hedefliyor gibi görünüyor ama metin ayrım yapmıyor; inceleme itiraz ederse dosya yedek dışına alınır.

## Faz 0: Temel (şimdi)

Amaç: projenin kalıcı bir evi ve canlı bir adresi olsun.

- [x] Projeyi kalıcı bir klasöre taşı
- [x] Git kur, yerel depoyu başlat
- [x] GitHub'da depo aç (sürüm geçmişi ve ileride iOS derlemesi için şart): github.com/efekaratosun/starboard
- [x] Siteyi yayınla; her değişiklik depodan otomatik yayına çıksın: efekaratosun.github.io/starboard
- [x] Artifact'teki verileri taşıma: gerek kalmadı, eski kayıtlar deneme amaçlıydı (12 Kasım 2026)

Bitti sayılır: Starboard herkese açık bir adreste çalışıyor ve bir değişiklik tek adımda yayına çıkıyor.

## Faz 1: Güncellenebilir kod tabanı ✓

Amaç: yeni özellik eklemek mevcut olanı bozmasın.

- [x] Tek dosyayı ayrı dosyalara böl: 3 stil, 19 kod dosyası (`starboard-site/css`, `starboard-site/js`); ekran çıktısı eskisiyle birebir aynı
- [x] Otomatik testler (`tests/`): her gönderimde çalışır, testler kalırsa site yayınlanmaz
- [x] Hesaplamaları ekran kodundan ayır: ölçüm değerlendirmesi (`assess()`), görev durumu (`taskStatus()`, `goals.js`), grafik verisi (`chartData()`) ve haftalık özet (`weekStats()`) yalnızca sayı ve durum döndürür; ekran kodu bunları metne çevirir. Gün puanı, yıldızlar ve avatar doğrudan hesabı kullanır. Ekran çıktısı Türkçede eskisiyle birebir aynı
- [x] Çok dilli altyapı: `tx()` çeviri işlevi, dil seçimi (Ayarlar), dile göre tarih ve gün adları
- [x] Arayüz metinlerinin İngilizcesi: yaklaşık 1.100 metin çeviriye bağlandı, sözlükte 730 karşılık (`starboard-site/js/lang/en.js`)
- [x] Beslenme içeriğinin İngilizcesi: 320 besin adı, porsiyon ölçüleri, mikro besinler, hazır menüler ve tarifler (`starboard-site/js/lang/en-food.js`, 630 karşılık)
- [x] Antrenman içeriğinin İngilizcesi: 16 program, gün başlıkları, 90 hareketin rehberi (`starboard-site/js/lang/en-workout.js`). Antrenman satırları kodda ve kayıtlarda Türkçe kalır, yalnızca ekranda `exText()` ile çevrilir; böylece dil değişince kayıtlar ve rekorlar kopmaz
- [x] Kullanıcının kendi yazdığı görevler, tekrar eden görevler, öğün ve program adları yazıldığı dilde kalır; hazır öneriler kayıtta Türkçe durur ve ekranda çevrilir
- [x] Kalan arayüz parçaları: Bugün sayfası açıklamaları, grafik notları, rekor ve süre birimleri, ekran okuyucu etiketleri (47 yeni karşılık). Kayıtlı görev başlıkları kayıtta Türkçe kalır, ekranda çevrilir
- [x] Birimler: metrik (kg, cm, ml) ya da imperial (lb, ft·in, fl oz). Ayarlar'da ve ilk girişte seçilir; varsayılan tarayıcının bölgesinden (ABD imperial). Kayıt hep metrik kalır, çeviri yalnızca ekranda (`starboard-site/js/units.js`). İngilizcede ondalık ayırıcı nokta
- [x] İngilizcenin "beta" etiketi kalktı. Yeni kullanıcıda dil tarayıcıdan gelir (Türkçe değilse İngilizce); kaydı olan eski kullanıcı Türkçe kalır; karşılama ekranında dil bağlantısı var
- [x] Sürüm numarası (`APP_VERSION`, şu an 1.8.0) ve değişiklik günlüğü (`CHANGELOG.md`)
- [x] Veri şeması sürümleme: `SCHEMA` ve `MIGRATIONS` (`storage.js`); açılışta ve yedek yüklerken kayıt güncel biçime taşınır
- [x] Test kapsamı genişledi: gün puanı, yıldızlar, haftalık yenileme, veri göçü, dil seçimi (toplam 76 test)
- [x] Depolama anahtarı `starboard-state` oldu; eski adla duran kayıt ilk açılışta taşınır ve yedek olarak yerinde kalır

Bitti sayılır: testler geçiyor, eski bir yedek dosyası yeni sürümde sorunsuz açılıyor.

**Faz 1 tamamlandı (12 Kasım 2026).**

## Faz 2: Ürün geliştirme (sürekli)

Amaç: App Store'a çıkmaya değer bir ürün.

- [ ] Kullanırken görülen eksikleri `EKSIKLER.md` listesine yaz, önceliklendir (her düzeltme küçük sürümler halinde web'de yayınlanır)
- [x] Hareket animasyonları: "Nasıl yapılır" kartlarında Motion ile oynayan temsili çizgi figür (83 hareket, 78 animasyon)
- [ ] Birkaç gerçek kullanıcıyla web sürümünü dene, geri bildirim topla
- [x] İçeriğin uluslararası uyarlaması (1.6.0): mutfak seçimi (Türk / uluslararası), 42 besin, 17 tarif, 3 hazır menü (`foods-intl.js`); domuz eti yalnızca uluslararası mutfakta; helal ve koşer beslenme
- [x] Kayıtlı öğünler ve haftalık beslenme özeti (1.7.0)
- [x] Alışveriş listesi, dinlenme sayacı, "Neler yeni" penceresi (1.8.0)
- [ ] İçerik genişletme (isteğe bağlı): ülkeye özgü ürünler, daha çok uluslararası tarif, alkollü içecekler (alkolün kalorisi ayrı hesap gerektirir)
- [x] Erişilebilirlik ve küçük ekran denetimi (1.5.2): 320–414 px'de taşma yok; kontrast AA; dokunma alanları en az 44 px yükseklik; etiketler ve ekran okuyucu bildirimleri. Denetim aracı `tools/a11y-audit.html`. Gerçek iPhone'da VoiceOver ve büyük yazı denemesi Faz 3'te
- [ ] Faz 3'te gerçek cihazda: VoiceOver ile bütün akış, iOS büyük yazı boyutu (Dynamic Type), çentik ve ana ekran çubuğu çevresi

Bu faz diğerleriyle paralel yürür ve yayından sonra da sürer.

## Faz 3: iOS uygulaması

Amaç: web sitesini saran bir kabuk değil, gerçek bir iPhone uygulaması. Apple, yalnızca bir web sitesini gösteren uygulamaları reddediyor (kural 4.2), bu yüzden bu fazdaki yerel özellikler isteğe bağlı değil.

- [x] Capacitor ile iOS projesi (mevcut web kodu yeniden kullanılır): Faz 3 başlangıcında kuruldu
- [x] Kalıcı yerel depolama (iOS, web görünümündeki `localStorage` verisini silebilir): iOS'ta kalıcı depo eklendi
- [x] Bildirimler: su, uyku ve antrenman hatırlatmaları: saatleri ayarlanabilir (sabah tartısı ve günü kapat dahil)
- [ ] Apple Sağlık (HealthKit) bağlantısı: adım, uyku, kilo
- [ ] Barkod okuma: paketli ürünün barkodu kamerayla okunur, besin değerleri Open Food Facts'ten (ücretsiz, açık veri) gelir ve kendi yiyeceklerine kaydedilir. Dışarıya yalnızca barkod numarası gider; "veriler hiçbir yere gönderilmez" metni ve App Store gizlilik beyanı buna göre güncellenir. Uygulamayı web sitesinden ayıran yerel özelliklerden biri olur (kural 4.2)
- [x] Dokunsal geri bildirim, güvenli alan ve karanlık mod ayarları: dokunsal geri bildirim, çentik payı, durum çubuğu temaya göre
- [x] Mac olmadan derleme: bulutta macOS derleme hattı (GitHub Actions veya Codemagic): simülatör derlemesi Intel macOS makinesine taşındı

Gerekenler: Apple Developer hesabı (yıllık 99 USD) ve test için bir iPhone.

Bitti sayılır: uygulama TestFlight üzerinden kendi telefonunda çalışıyor.

## Faz 4: App Store hazırlığı

- [ ] "Starboard" adının App Store'da uygunluğunu kontrol et
- [x] Gizlilik politikası (1.8.0): `starboard-site/privacy.html`, Türkçe ve İngilizce; uygulamada Ayarlar › Hakkında › Gizlilik
- [ ] Destek sayfası: şimdilik iletişim GitHub Issues üzerinden; App Store için ayrı bir destek adresi (e-posta ya da sayfa) gerekebilir
- [x] Sağlık içeriği (1.8.0): hesaplamaların kaynakları ve "tıbbi tavsiye değildir" uyarısı (kural 1.4.1); Ayarlar › Hakkında ve ilk girişin özeti
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
