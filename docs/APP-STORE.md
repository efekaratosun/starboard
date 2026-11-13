# App Store sayfa metinleri

Starboard 1.9.0 için App Store Connect'e girilecek son metinler ve form cevapları. Türkçe ve İngilizce.

Hazırlandığı tarih: 13 Kasım 2026. Dayanaklar: `ROADMAP.md` (11 ve 12 Kasım kararları, Faz 3 ve Faz 4), `README.md`, `CHANGELOG.md`, `starboard-site/privacy.html`, `starboard-site/js/barcode.js`, `ios/App/App/` altındaki izin ve gizlilik dosyaları, Apple Sağlık uygulama planı.

**Karakter sayıları:** her metnin yanındaki sayı kodla sayıldı (Unicode karakter, boşluk ve satır sonu dahil, satır sonu 1). Sayılar `(N karakter / SINIR)` biçimindedir. Metin değişirse sayı yeniden hesaplanmalıdır.

**Durum notu:** Apple Sağlık bağlantısı bu dalda henüz yok (`health.js` ve Ayarlar bölümü gelmedi); izin metinleri (`Info.plist`, `InfoPlist.strings`) ve `App.entitlements` dosyası hazır. Metinler ve inceleme notu, Apple Sağlık'ın aynı 1.9.0 sürümüne yalnızca okuma (adım, uyku, kilo) olarak girmiş hâline göre yazıldı. Ayarlar'daki düğme adları birleşme sonrası doğrulanmalı (bkz. 12. bölüm).

## 1. Uygulama kayıt bilgileri

| Alan | Değer |
|---|---|
| Bundle kimliği | `app.starboard.health` |
| Sürüm | 1.9.0 (`APP_VERSION`); Xcode'da `MARKETING_VERSION` şimdilik 1.0 |
| En düşük iOS | 15.0 |
| Cihazlar | Yalnızca iPhone (`TARGETED_DEVICE_FAMILY = 1`, 13 Kasım 2026 kararı) |
| Ana dil | İngilizce (ABD); Türkçe ikinci yerelleştirme |
| Gizlilik politikası adresi | `https://efekaratosun.github.io/starboard/privacy.html` |
| Pazarlama adresi | `https://efekaratosun.github.io/starboard/` |
| Destek adresi | Şimdilik `https://github.com/efekaratosun/starboard/issues`; ayrı e-posta ya da sayfa gerekebilir (ROADMAP Faz 4, açık) |
| Fiyat | Bu belgede yok. Gelir modeli Faz 4'te kesinleşecek; metinlerde fiyat ya da abonelik ifadesi bulunmaz. Uygulama içi satın alma eklenirse açıklamaya zorunlu ifadeler ve App Privacy "Satın Alımlar" kararı yeniden gözden geçirilir |

## 2. Ad ve alt başlık (her biri en fazla 30 karakter)

Ad (TR ve EN aynı):

`Starboard` (9 karakter / 30)

Alt başlık:

| | Metin |
|---|---|
| TR | `Beslenme, antrenman, uyku, su` (29 karakter / 30) |
| EN | `Food, workouts, sleep & water` (29 karakter / 30) |

- "Starboard" adının App Store'da boş olup olmadığı henüz kontrol edilmedi (ROADMAP Faz 4, açık). Ad doluysa yedekler: `Starboard: Fitness Tracker` (26 karakter / 30) ya da `Starboard: Beslenme & Spor` (26 karakter / 30).
- Daha kısa İngilizce alt başlık seçeneği: `Nutrition, workouts & sleep` (27 karakter / 30).

## 3. Tanıtım metni (en fazla 170 karakter)

Tanıtım metni incelemeye girmeden istenildiği zaman değiştirilebilir.

**TR**

(142 karakter / 170)

```text
Öğünlerini ve antrenmanını planla, barkod okut, adım, uyku ve kilonu Apple Sağlık'tan al. Hesap ve reklam yok; sağlık verilerini toplamıyoruz.
```

**EN**

(146 karakter / 170)

```text
Plan meals and workouts, scan food barcodes, and bring in steps, sleep and weight from Apple Health. No account, no ads, no health data collected.
```

## 4. Açıklama (en fazla 4000 karakter)

Yapı: önce günün özeti, sonra beslenme, antrenman, uyku-su-kilo, barkod, Apple Sağlık, hatırlatmalar, gizlilik, herkes için, en sonda sağlık uyarısı. Fiyat, "hızlı sonuç", "kesin", "kanıtlanmış" gibi vaatler yok; hedefler "tahmin" olarak sunuluyor. Apple Sağlık'ın açıklamada anılması kural 2.5.1 için gerekli. Open Food Facts atfı ODbL için gerekli; uygulamada da Ayarlar › Hakkında › kaynaklarda duruyor.

### Türkçe

(3619 karakter / 4000)

```text
Starboard, beslenme, antrenman, uyku ve su takibi için sade bir günlük yardımcı. Kendinle ilgili birkaç bilgi girersin; Starboard bunları işaretleyebileceğin küçük günlük hedeflere çevirir. Tamamlanan her gün bir yıldız yakar.

GÜNÜN TEK BAKIŞTA
• Kalori, protein, su, uyku, tartı, adım ve antrenman hedeflerin tek listede; halka kaç hedefin tamamlandığını gösterir
• Bir hedefe dokun, olduğun yerde kaydet
• Tamamlanan her gün bir yıldız yakar; bir haftada beş yıldız bir takımyıldız açar
• Su, kilo, adım, uyku, kalori ve görevler için hızlı giriş düğmesi; bugün ya da geçmiş herhangi bir gün için

PLANLI BESLEN
• Profilinden ve hedefinden (yağ kaybı, koruma ya da kas kazanımı) tahmin edilen kalori, protein ve lif hedefleri
• 360'tan fazla besin, porsiyon ölçüleri ve haftalık beslenme özetiyle yemek günlüğü
• Tarifler ve hazır günlük menüler; Türk ya da uluslararası mutfak
• Vejetaryen, vegan ve pesketaryen beslenme tercihleri; sevmediğin besinleri listeden çıkarma
• Sık yediğin öğünleri kaydet, tek dokunuşla ekle
• Beslenme planından ya da seçtiğin tariflerden alışveriş listesi

SENİN YOLUNDA ANTRENMAN
• Spor salonu, ev, dışarısı, calisthenics, kettlebell, yoga ve mobilite ya da yüzme için 16 program
• Antrenman günlerini seç, kaçınmak istediğin bölgeleri (diz, bel, omuz, bilek) işaretle ya da kendi programını yaz
• Set set kayıt ve dinlenme sayacıyla antrenman modu
• 83 hareketlik rehber; her hareket için çizgi figürlü kısa bir animasyon
• Kişisel rekorlarının takibi

UYKU, SU VE KİLO
• Yattığın ve kalktığın saati sade bir uyku kadranında kaydet
• Bardaklara dokunarak suyunu takip et
• Kilo ve vücut ölçülerini gir, değişimi referans aralığının yanında gör
• Grafikler ve haftalık özet haftanın nasıl geçtiğini gösterir

BARKOD OKUMA
Paketli bir ürünün barkodunu kamerayla okut; besin değerleri ücretsiz ve açık bir besin veritabanı olan Open Food Facts'ten gelsin, önizlemede düzenle ve kendi besinlerine kaydet. Arama için dışarıya yalnızca barkod numarası gider; kamera görüntüsü kaydedilmez ve gönderilmez. Bulunamayan ürünün değerlerini elle girebilirsin. Open Food Facts verileri Açık Veritabanı Lisansı (ODbL) ile paylaşılır. Değerleri katkıda bulunanlar girer ve hatalı olabilir; kaydetmeden önce ambalajdakiyle karşılaştır.

APPLE SAĞLIK
İstersen adım, uyku ve kilonu Apple Sağlık'tan okuyarak aynı veriyi iki kez girmekten kurtul. Starboard Apple Sağlık'tan yalnızca okur, ona veri yazmaz. İzni sen verirsin ve Sağlık uygulamasından istediğin zaman geri alabilirsin. Bu veriler cihazında kalır; Starboard onları hiçbir yere göndermez, reklam, pazarlama ya da veri madenciliği için kullanmaz. Bağlantıyı Ayarlar'dan kurarsın; kurmazsan Apple Sağlık'tan hiçbir şey okunmaz.

HATIRLATMALAR
Su, antrenman günleri, yatma vakti, sabah tartısı ve günü kapatma için isteğe bağlı bildirimler. Bildirimler cihazında zamanlanır.

GİZLİLİK ÖNCELİKLİ
• Hesap, reklam, analiz ya da izleme yok
• Kayıtların cihazında saklanır, sunucuya gönderilmez
• Verilerini dosya olarak yedekle ya da geri yükle; istediğin zaman hepsini sil

HERKES İÇİN
Türkçe ve İngilizce, metrik ya da imperial birimler, açık ve koyu tema. Barkod araması dışında internet gerekmez.

ÖNEMLİ
Starboard genel sağlık ve fitness takibi içindir; tıbbi tavsiye, tanı ya da tedavi yerine geçmez. Hedefler yaygın formüllere dayanan tahminlerdir ve kişiden kişiye değişir; kaynaklarını uygulamada Ayarlar › Hakkında bölümünde bulabilirsin. Hamileysen, emziriyorsan, kronik bir hastalığın ya da yeme bozukluğu geçmişin varsa veya düzenli ilaç kullanıyorsan beslenme ve egzersiz planını değiştirmeden önce hekimine ya da diyetisyene danış.
```

### İngilizce

(3686 karakter / 4000)

```text
Starboard is a simple daily companion for food, training, sleep and water. Tell it a little about yourself, and it turns your habits into small daily goals you can check off, one star at a time.

YOUR DAY AT A GLANCE
• Your goals for calories, protein, water, sleep, weigh-in, steps and workout in one list; a ring shows how many are done
• Tap a goal to log it right where you are
• Every completed day lights a star; five stars in a week reveal a constellation
• A quick-entry button for water, weight, steps, sleep, calories and tasks, for today or any past day

EAT WITH A PLAN
• Calorie, protein and fiber targets estimated from your profile and goal: lose fat, maintain or build muscle
• A food diary with 360+ foods, portion sizes and a weekly nutrition summary
• Recipes and ready-made day menus, with Turkish or global cuisine
• Diet preferences including vegetarian, vegan, pescatarian, halal and kosher, plus a list of foods you'd rather not see
• Save the meals you eat often and add them with one tap
• A shopping list built from your meal plan or the recipes you pick

TRAIN YOUR WAY
• 16 programs for the gym, home, outdoors, calisthenics, kettlebell, yoga and mobility, or swimming
• Choose your training days, pick areas you'd rather avoid (knee, lower back, shoulder, wrist) or write your own program
• Workout mode with set-by-set logging and a rest timer
• A guide to 83 exercises, each with a short stick-figure animation
• Personal records tracked for you

SLEEP, WATER AND WEIGHT
• Log bedtime and wake time on a simple sleep dial
• Tap cups to track water
• Add weight and body measurements and see the trend next to a reference range
• Charts and a weekly summary show how your week went

BARCODE SCANNING
Scan the barcode of a packaged product with the camera and have its nutrition values come from Open Food Facts, a free, open food database; check them in a preview and save the product to your own foods. Only the barcode number is sent with the lookup; the camera image is never saved or sent. If a product isn't found, you can enter the values yourself. Open Food Facts data is shared under the Open Database License (ODbL). Values come from contributors and can be wrong, so compare them with the package before saving.

APPLE HEALTH
Optionally read your steps, sleep and weight from Apple Health so you don't have to enter the same data twice. Starboard only reads from Apple Health and never writes to it. You grant access and can take it back at any time in the Health app. This data stays on your device: Starboard doesn't send it anywhere and never uses it for advertising, marketing or data mining. You set up the connection in Settings; if you don't, nothing is read from Apple Health.

REMINDERS
Optional notifications for water, workout days, bedtime, a morning weigh-in and closing out your day. They are scheduled on your device.

PRIVATE BY DESIGN
• No account, no ads, no analytics, no tracking
• Your records are stored on your device and are not sent to a server
• Back up or restore your data as a file, or delete everything whenever you like

MADE FOR EVERYONE
English and Turkish, metric or imperial units, light or dark theme. Apart from barcode lookups, no internet connection is needed.

IMPORTANT
Starboard is for general health and fitness tracking. It is not medical advice, diagnosis or treatment. Targets are estimates based on common formulas and vary from person to person; the sources are listed in the app under Settings › About. If you are pregnant or nursing, have a medical condition or a history of disordered eating, or take regular medication, talk to your doctor or a dietitian before changing your diet or exercise.
```

## 5. Anahtar kelimeler (en fazla 100 karakter)

Apple ad ve alt başlıktaki kelimeleri ve kategori adlarını zaten indeksler; bu yüzden "beslenme, antrenman, uyku, su, food, workouts, sleep, water" tekrar edilmedi. Virgülden sonra boşluk yok. "Apple" ve "HealthKit" gibi marka adları anahtar kelimeye konmadı (ret riski).

| | Metin |
|---|---|
| TR | `kalori,makro,protein,diyet,öğün,tarif,spor,egzersiz,adım,kilo,alışveriş,barkod,tarayıcı,takip,hedef` (99 karakter / 100) |
| EN | `calorie,macros,protein,nutrition,meal plan,diet,weight,steps,recipes,barcode,scanner,halal,kosher` (97 karakter / 100) |

"halal" ve "kosher" yalnızca İngilizce listede: uygulamada bu seçenekler İngilizce kullanıcıya gösteriliyor (CHANGELOG 1.6.0).

## 6. App Privacy formu

Kaynak: ROADMAP, "Verilen kararlar (12 Kasım 2026)" ve Faz 4 maddesi. Bu bölüm onlara birebir uyar ve `ios/App/App/PrivacyInfo.xcprivacy` ile aynıdır (dosya kontrol edildi: `SearchHistory`, ilişkilendirilmez, izleme yok, `AppFunctionality`).

Bugünkü hâliyle yalnızca yazı tipi gömülü olduğu için "Veri Toplanmıyor" olabilirdi; barkod okuma 1.9.0'da olduğu için ilk soru "Evet" olur.

| Form sorusu | İşaretlenecek |
|---|---|
| Bu uygulamadan veri topluyor musunuz? | **Evet** |
| Hangi veri türleri? | **Yalnızca Arama Geçmişi (Search History)**: Open Food Facts'e giden barkod numarası |
| Arama Geçmişi kullanıcıyla ilişkilendiriliyor mu? | **Hayır** (hesap, kimlik, cihaz kimliği yok) |
| Arama Geçmişi izleme için mi kullanılıyor? | **Hayır** |
| Arama Geçmişi amaçları | **Yalnızca Uygulama İşlevselliği (App Functionality)**. Analiz, ürün kişiselleştirme, reklam, geliştirici reklamları, diğer amaçlar işaretlenmez |
| Gizlilik politikası adresi | `https://efekaratosun.github.io/starboard/privacy.html` |

İşaretlenmeyecek kutular ve nedenleri:

| Kutu | Neden işaretlenmez |
|---|---|
| Sağlık ve Fitness (Sağlık, Fitness) | Elle girilen kilo, uyku, adım, ölçüler ve Apple Sağlık'tan okunan adım, uyku, kilo cihazdan çıkmaz. HealthKit verisi etikete girmez (ROADMAP) |
| Kamera | Ayrı bir kutu yok; görüntü cihazda çözülür, kaydedilmez, gönderilmez |
| Bildirimler | Yerel bildirimlerdir, sunucu yoktur |
| Kullanıcı İçeriği | Kendi besinlerin, görevlerin, yedek dosyan cihazda kalır |
| İletişim Bilgileri, Konum, Hassas Bilgiler, Kişiler, Tarama Geçmişi, Kimlikler, Kullanım Verileri, Tanılama, Satın Alımlar, Finansal Bilgiler, Diğer Veriler | Hesap, analiz, çökme raporu, reklam ve satın alma yok |
| İzleme (tracking) | Yok. İzleme izni penceresi (ATT) gerekmez |

Notlar:

- **Open Food Facts ve IP adresi.** Open Food Facts'in gizlilik politikası ziyaret kayıtlarını (IP dahil) tuttuklarını yazıyor (ROADMAP Faz 4 notu). Apple'ın listesinde IP adresi için ayrı bir kutu olmadığından beyan "Arama Geçmişi" olarak temkinli kalır; karar ROADMAP'tekiyle aynıdır, değişmedi.
- **İstek içeriği kuralı.** Beyan, isteğe barkoddan başka hiçbir verinin eklenmemesine bağlı (`barcode.js`, testler adres biçimini ve başlıkları sabitler). Bu kural değişirse beyan, `privacy.html`, `about.js`, `settings.js` ve `PrivacyInfo.xcprivacy` birlikte güncellenir.
- **Yeni eklenirse yeniden bak:** çökme raporu aracı ("Tanılama"), analiz, uygulama içi satın alma ("Satın Alımlar"), hesap ya da eşitleme.
- **iCloud cihaz yedeği.** Kayıt dosyası cihaz yedeğinde kalır; telefon değişiminde verinin taşınmasının ana yolu bu (ROADMAP, 12 Kasım). Kural 5.1.3(ii) iCloud'da sağlık verisi saklamayı yasaklıyor; inceleme itiraz ederse dosya yedek dışına alınır. Starboard'da iCloud eşitlemesi yoktur.

## 7. İnceleme notu (App Review Notes)

App Store Connect'te "App Review Information › Notes" alanına yapıştırılır (en fazla 4000 karakter). Aşağıdaki İngilizce metin inceleme ekibi içindir; Türkçesi kendi bilgin içindir. "Oturum bilgisi gerekli" kutusu işaretlenmez, test hesabı yok.

### İngilizce (yapıştırılacak)

(2206 karakter / 4000)

```text
Starboard needs no account, login or demo credentials. All app content is bundled in the app and works offline; the only network request is the optional barcode lookup. There are no ads, no analytics and no in-app purchases.

First launch: a few profile questions (age, height, weight, goal) are used to calculate the daily targets. Everything stays on the device.

BARCODE SCANNING (Open Food Facts)
1. Open the Nutrition tab > My diary > Add food > Scan barcode.
2. Tap Continue on the information sheet, then allow camera access.
3. Scan any packaged food. Test barcode: 3017620422003
4. The nutrition values from Open Food Facts appear in a preview. Tap Save and add.
If you have no product at hand, deny the camera permission when asked: the app then shows a field where you can type the number 3017620422003 instead.
Only the barcode number is sent (HTTPS GET to world.openfoodfacts.org, no body, no cookies, no identifiers). The camera image is processed on the device and is never saved or sent. In App Privacy this is declared as Search History: not linked to the user, not used for tracking, purpose App Functionality.

APPLE HEALTH (read only)
1. Tap the profile button at the top right > Settings > Apple Health > Connect to Health.
2. In the Health permission sheet, allow reading Steps, Sleep and Weight.
3. The imported values appear in the daily goals on the Today screen.
Starboard only reads these three types. It does not request write access and writes nothing to Apple Health. The data stays on the device: it is never sent to any server, never used for advertising, marketing or data mining, and never shared with third parties. The Health connection is optional and the whole app works without it. If the review device has no Health data, add a sample in the Health app (Browse > Activity > Steps > Add Data); without data the app simply shows no imported values.

REMINDERS (optional)
Settings > Reminders: local notifications for water, workout days, bedtime, a morning weigh-in and closing out the day. The notification permission is requested when you turn reminders on.

The app gives general health and fitness information only and is not medical advice (see Settings > About).
```

### Türkçe (bilgi için)

(2079 karakter / 4000)

```text
Starboard hesap, oturum açma ya da deneme hesabı gerektirmez. Uygulamanın bütün içeriği uygulamanın içindedir ve internetsiz çalışır; tek ağ isteği isteğe bağlı barkod aramasıdır. Reklam, analiz ve uygulama içi satın alma yok.

İlk açılış: birkaç profil sorusu (yaş, boy, kilo, hedef) günlük hedefleri hesaplamak için kullanılır. Her şey cihazda kalır.

BARKOD OKUMA (Open Food Facts)
1. Beslenme sekmesi > Günlüğüm > Besin ekle > Barkod okut.
2. Bilgi penceresinde Devam'a dokun, sonra kamera iznini ver.
3. Paketli herhangi bir ürünü okut. Deneme barkodu: 3017620422003
4. Open Food Facts'ten gelen besin değerleri önizlemede görünür. Kaydet ve ekle'ye dokun.
Elinde ürün yoksa kamera izni sorulduğunda reddet: uygulama o zaman barkod numarasını (3017620422003) yazabileceğin bir alan gösterir.
Dışarıya yalnızca barkod numarası gider (world.openfoodfacts.org'a HTTPS GET; gövde, çerez ya da kimlik yok). Kamera görüntüsü cihazda işlenir, kaydedilmez ve gönderilmez. App Privacy'de Arama Geçmişi olarak beyan edildi: kullanıcıyla ilişkilendirilmez, izleme yok, amaç Uygulama İşlevselliği.

APPLE SAĞLIK (yalnızca okuma)
1. Sağ üstteki profil düğmesi > Ayarlar > Apple Sağlık > Sağlık'a bağlan.
2. Sağlık izin penceresinde Adım, Uyku ve Kilo okumasına izin ver.
3. Alınan değerler Bugün ekranındaki günlük hedeflerde görünür.
Starboard yalnızca bu üç türü okur. Yazma izni istemez, Apple Sağlık'a hiçbir şey yazmaz. Veriler cihazda kalır: hiçbir sunucuya gönderilmez, reklam, pazarlama ya da veri madenciliği için kullanılmaz, üçüncü taraflarla paylaşılmaz. Sağlık bağlantısı isteğe bağlıdır; uygulama onsuz da tam çalışır. İnceleme cihazında Sağlık verisi yoksa Sağlık uygulamasından örnek ekle (Göz at > Aktivite > Adımlar > Veri Ekle); veri yoksa uygulama alınan değer göstermez.

HATIRLATMALAR (isteğe bağlı)
Ayarlar > Hatırlatmalar: su, antrenman günleri, yatma vakti, sabah tartısı ve günü kapatma için yerel bildirimler. Bildirim izni hatırlatmaları açtığında istenir.

Uygulama yalnızca genel sağlık ve fitness bilgisi verir, tıbbi tavsiye değildir (Ayarlar > Hakkında).
```

## 8. Yaş sınırı anketi için öneriler

Apple'ın güncel yaş derecelendirme sayfasındaki (App Store Connect Help, "Age ratings values and definitions") kategorilere göre. Anket sık değişir; canlı formda soru adlarını karşılaştır.

| Kategori | Soru | Öneri | Gerekçe |
|---|---|---|---|
| Uygulama içi denetimler | Ebeveyn denetimleri, yaş doğrulama | Hayır | Yok |
| Yetenekler | Sınırsız web erişimi | Hayır | Uygulama yalnızca kendi içeriğini gösterir; adres çubuğu ya da tarayıcı yok. Open Food Facts yalnızca veri servisi olarak çağrılır |
| Yetenekler | Kullanıcı tarafından üretilen içerik, sosyal medya, mesajlaşma ve sohbet | Hayır | Kullanıcının yazdıkları yalnızca kendi cihazında kalır, kimseye dağıtılmaz |
| Yetenekler | Reklam | Hayır | Reklam yok |
| Olgun temalar | Küfür, korku, alkol/tütün/uyuşturucu | Hiçbiri | İçerikte yok (alkollü içecek besinleri ROADMAP'te yalnızca isteğe bağlı gelecek madde) |
| Tıbbi veya sağlık | Tıbbi ya da tedavi bilgisi | **Hiçbiri** | Tanı, ilaç ya da tedavi yönlendirmesi yok; uygulama "tıbbi tavsiye değildir" diyor |
| Tıbbi veya sağlık | Sağlık ve zindelik konuları | **Evet** | Apple tanımı "kalori takibi, diyet tavsiyesi, egzersiz önerileri" örneklerini sayıyor; Starboard tam olarak bunları yapıyor |
| Cinsellik ve çıplaklık | Hepsi | Hayır | Hareket animasyonları çizgi figürdür |
| Şiddet | Hepsi | Hayır | Silah ya da şiddet yok |
| Şansa dayalı etkinlikler | Kumar, simüle kumar, yarışmalar, ödül kutuları | Hayır | Yıldızlar ve seri yalnızca kişisel ilerlemedir; kullanıcılar birbiriyle yarışmaz |

Beklenen sonuç: Apple'ın tablosuna göre "Sağlık ve zindelik konuları" yaş sınırını **9+** yapar. Bu soruya "Hayır" demek 4+ verirdi ama tanım kalori takibi ve diyet önerisini açıkça kapsadığı için doğru cevap olmaz. "Tıbbi ya da tedavi bilgisi" için "Seyrek" seçmek derecelendirmeyi 13+'ya çıkarır; uygulama bu içeriği sunmadığı için gerekmez. "Çocuklar için hazırlanmış" kategorisi seçilmez.

Not: App Store Connect'te "Düzenlenen tıbbi cihaz durumu" beyanı varsa cevap "hayır": Starboard tanı koymaz, tedavi önermez, tıbbi cihaz değildir.

## 9. Kategori önerisi

| | Öneri | Gerekçe |
|---|---|---|
| Birincil | **Sağlık ve Fitness (Health & Fitness)** | Antrenman, uyku, su, kilo ve Apple Sağlık bağlantısı; beklenen kategori |
| İkincil | **Yemek ve İçecek (Food & Drink)** | Beslenme günlüğü, tarifler, alışveriş listesi ve barkod okuma |

Yedek ikincil kategori: Yaşam Tarzı (Lifestyle). Kategori sonradan her sürümde değiştirilebilir.

## 10. Ekran görüntüleri

Boyut: 6,9 inç iPhone, **1320 × 2868** piksel, dikey. İlk üç görüntü arama sonuçlarında göründüğü için sıra şöyle: özet, beslenme, barkod.

| # | Ekran | Neden bu sırada | Başlık TR | Başlık EN |
|---|---|---|---|---|
| 1 | **Bugün**: hedef halkası, hafta şeridi, hedef listesi (7 hedefin 4-5'i tamam) | Uygulamanın özü | `Günün hedefleri tek ekranda` (27 karakter) | `Your day's goals at a glance` (28 karakter) |
| 2 | **Beslenme › Günlüğüm**: öğünler, kalori ve makro çubukları | En sık kullanılan özellik | `Yediklerini kolayca kaydet` (26 karakter) | `Log what you eat, easily` (24 karakter) |
| 3 | **Besin ekle › Barkod okut**: Open Food Facts değerlerinin dolu olduğu önizleme formu (örnek barkod 3017620422003) | Web sitesinden ayıran yerel özellik | `Barkodu okut, değerler gelsin` (29 karakter) | `Scan a barcode, skip the typing` (31 karakter) |
| 4 | **Program › Kaydım**: antrenman modu, set onayı, dinlenme sayacı | Antrenman tarafı | `Set set kaydet, dinlen, devam et` (32 karakter) | `Log every set, rest, repeat` (27 karakter) |
| 5 | **Program › Nasıl yapılır**: çizgi figür animasyonlu hareket kartı | Görsel olarak güçlü, 83 hareketin hepsinde var | `Her hareket için animasyonlu rehber` (35 karakter) | `An animated guide for every move` (32 karakter) |
| 6 | **Bugün'ün altındaki Gökyüzün kartı** (ya da Takvim): haftanın takımyıldızı ve seri | Starboard'a özgü marka kimliği | `Her tamamlanan gün bir yıldız` (29 karakter) | `Every finished day lights a star` (32 karakter) |

Yedekler: **Ben › Grafikler** (kilo trendi, haftalık özet). Apple Sağlık bağlantı ekranı (Ayarlar › Apple Sağlık) 7. görüntü olarak eklenebilir; istenen altı ekranın içinde yer almadığı için başlığı yazılmadı.

Çekim notları:

- Barkod görüntüsü gerçek iPhone'da (TestFlight) çekilmeli: simülatörde kamera yok. Önizleme formu kamera olmadan, elle girilen barkodla da açılabilir.
- TR ve EN için ayrı çekim, uygulama dili değiştirilerek. Tümü açık temada.
- Gerçekçi ama uydurma veri; gerçek kişi adı ya da gerçek ölçü yok.
- Değerlendirme/BMI/yağ oranı sınıflandırması görünen ekranlardan ve "önce/sonra" tarzı kilo rakamlarından kaçın; sağlık iddiası gibi okunabilir.
- Başlık metinleri görüntünün üstüne yerleştirilir; uzun başlık iki satıra bölünebilir. Başlıklar kısa tutuldu, en uzunu 35 karakter.

## 11. Taslakta düzeltilenler

Önceki taslak (`appstore-taslak.md`) şu noktalarda eskimişti ya da yanlıştı:

| Taslakta | Şimdi |
|---|---|
| Yazı tipi Google'dan geliyor, "Veri Toplanmıyor" için gömülmeli | Gömüldü (1.8.1); dışarıya yazı tipi isteği gitmiyor |
| Bildirimler Faz 3'te işaretsiz, ilk sürümde yoksa HATIRLATMALAR çıkarılsın | Bildirimler var (ROADMAP Faz 3, tamam); bölüm kaldı |
| "iOS projesi kurulunca karar ver" | Capacitor iOS projesi kurulu (`app.starboard.health`, yalnızca iPhone) |
| Barkod ve Apple Sağlık "Faz 3 sonrası" ek paragraflardı | Barkod bu dalda; Apple Sağlık aynı 1.9.0'a giriyor. İkisi ana metne alındı, "şimdi / sonra" ayrımı kalktı |
| Rehber "90 hareket, çoğunda animasyon" | **83 hareket, hepsinde animasyon** (kod: `GUIDE` 83 kayıt, `EX_ANIM_OF` 83, 78 farklı animasyon). ROADMAP Faz 1'deki "90 hareketin rehberi" ifadesi eski |
| "300'den fazla besin" | **360'tan fazla** (`FOODS`: 362 kayıt) |
| "Girdiğin her şey cihazında saklanır" | "Kayıtların cihazında saklanır, sunucuya gönderilmez": barkodla birlikte tam doğru olan söz bu |
| Tanıtım metninde "Verilerin yalnızca cihazında kalır" | Barkod ve Apple Sağlık için doğru ifade: "Hesap ve reklam yok; sağlık verilerini toplamıyoruz" |
| App Privacy tablosu üç sütunlu (mevcut / barkod / HealthKit) | Tek karar: Evet, yalnızca Arama Geçmişi (ROADMAP 12 Kasım ve Faz 4); sağlık verisi işaretlenmez |
| Barkod beyanı "benim yorumum", doğrulanmamış | Karar ROADMAP'te kayıtlı ve `PrivacyInfo.xcprivacy` ile aynı |
| iCloud riski "Kural 5.1.3'e bak" | ROADMAP kararı: yedek kalır, inceleme itiraz ederse dosya yedek dışına alınır |
| İnceleme notu ve yaş anketi yoktu | 7. ve 8. bölümler |
| Anahtar kelimeler "şimdi" ve "barkod sonrası" iki ayrı küme | Tek küme (5. bölüm); "yağ" çıktı, "barkod,tarayıcı" girdi |

## 12. Gönderimden önce açık işler

Bu belge uygulama koduna dokunmaz; aşağıdakiler ilgili dallarda yapılmalı.

1. **`privacy.html` eksik.** Hâlâ "tarayıcı deposu" diyor, Apple Sağlık paragrafı yok, tarihi 12 Kasım. Kural 5.1.1 gizlilik politikasının Sağlık verisini anlatmasını ister; Apple Sağlık paragrafı (hangi türler, yalnızca okuma, cihazdan çıkmaz, reklam ve üçüncü taraf yok, izin Sağlık uygulamasından geri alınır) eklenmeden ve App Store Connect'e adres girilmeden gönderilmemeli. `about.js` ve `settings.js` metinleri de aynı dilde olmalı.
3. **Düğme adları.** İnceleme notundaki "Ayarlar › Apple Sağlık › Sağlık'a bağlan" yolu plandan alındı. Sağlık arayüzü birleşince gerçek başlıkları (TR ve EN) doğrula; İngilizce notu ona göre düzelt.
4. **Ad kontrolü.** "Starboard" App Store'da boş mu? (ROADMAP Faz 4.)
5. **Destek adresi.** GitHub Issues App Store için yeterli mi, ayrı sayfa ya da e-posta gerekir mi?
7. **Apple Developer hesabı.** Henüz açık karar. İmzalı derleme, App ID'de HealthKit yetkisi ve TestFlight hattı ona bağlı.
8. **Gerçek cihaz denemeleri.** Barkod (kamera izni, izin reddi, uçak modu, bulunamayan ürün, VoiceOver) ve Apple Sağlık (izin, ret, veri yok, saat dilimi) TestFlight'ta denenmeli; ROADMAP Faz 3'te işaretsiz.
9. **Kendi yiyeceklerini düzenleme ve silme ekranı.** Barkodla kaydedilen ürünler birikiyor ve şimdilik silinemiyor (ROADMAP Faz 4, açık); incelemede soru çıkarsa not düşülebilir.
10. **Simge.** Henüz hazır değil (ROADMAP Faz 4).
