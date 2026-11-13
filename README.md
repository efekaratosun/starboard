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

## iOS

`ios/` Capacitor ile üretilen Xcode projesidir; eklentiler Swift Package Manager ile gelir (`ios/App/CapApp-SPM/Package.swift`, `npx cap sync ios` yazar, elle düzenlenmez). CocoaPods yoktur, bu yüzden yalnızca CocoaPods destekleyen eklentiler (örneğin ML Kit tabanlı barkod eklentisi) kullanılamaz. Mac olmadığı için proje `.github/workflows/ios.yml` ile bulutta derlenir; `project.pbxproj` elle düzenlenirse her yeni nesneye projede olmayan 24 haneli bir hex kimlik verilmelidir.

Yerel özellikler için ortak dosyalar (`ios/App/App/` altında):

- İzin metinleri (kamera, Apple Sağlık): İngilizcesi `Info.plist` ve `en.lproj/InfoPlist.strings`, Türkçesi `tr.lproj/InfoPlist.strings`. Yeni bir izin eklenince üçüne de yazılır; derleme hattı üçünde de olup olmadığını denetler.
- Yetkiler (`App.entitlements`): `com.apple.developer.healthkit` (ve boş `…healthkit.access`: klinik kayıt yok); proje dosyasında HealthKit yeteneği (`SystemCapabilities`). Derleme hattı imzasızdır, bu yüzden yetki simülatör derlemesine gömülmez; gerçek deneme imzalı derleme (TestFlight) ister.
- Gizlilik bildirimi (`PrivacyInfo.xcprivacy`): App Store'un istediği veri beyanı. Barkod okuma Open Food Facts'e giden barkod numarasını "Arama Geçmişi" (ilişkilendirilmez, izleme yok, uygulama işlevi) olarak beyan eder; derleme hattı bunu ve eklentiyi denetler (bkz. ROADMAP, 12 Kasım kararları). Apple Sağlık verisi cihazdan çıkmadığı için beyana girmez.
- Şifreleme beyanı (`Info.plist`, `ITSAppUsesNonExemptEncryption` = `false`): uygulama yalnızca iOS'un kendi HTTPS bağlantısını kullanır (Open Food Facts isteği), kendine ait bir şifreleme içermez. Bu, ABD ihracat kurallarında muaf sayılan kullanımdır; anahtar `false` olunca App Store Connect her TestFlight yüklemesinde "şifreleme kullanıyor musun" sorusunu sormaz ve sürüm onay beklemeden test edilebilir. Uygulamaya özel şifreleme (ör. yedeği parola ile şifreleme) eklenirse bu değer yeniden değerlendirilmelidir.

### TestFlight

`.github/workflows/testflight.yml` imzalı derleyip TestFlight'a yükler; yalnızca elle çalışır (Actions → TestFlight → Run workflow). İmza Xcode'un otomatik imzalamasıyla, App Store Connect API anahtarıyla yapılır (`-allowProvisioningUpdates`); sertifika ve profil elle yönetilmez, fastlane yoktur. Gizli anahtarlar: `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` (`.p8` dosyasının içeriği, düz metin ya da base64), `APPLE_TEAM_ID`. Biri eksikse iş başarısız sayılmadan atlanır. Sürüm `storage.js` içindeki `APP_VERSION`, derleme numarası çalışmanın sıra numarasıdır (`github.run_number`); bu yüzden başarısız bir çalışma "Re-run" ile değil, yeniden "Run workflow" ile denenir. Paket kimliği `capacitor.config.json` içindeki `appId`'dir; komut satırında değil, makinedeki proje kopyasında yalnızca uygulama hedefine yazılır (komut satırındaki ayar Swift paketlerinin kaynak paketlerine de geçer ve aynı kimlik iki kez görünür). Hesap açıldıktan sonra yapılacaklar: [docs/TESTFLIGHT.md](docs/TESTFLIGHT.md).

## Barkod okuma

Yalnızca iPhone uygulamasında (`barcodeAvailable()` web'de `false`; düğme ve `#bc-box` hiç çizilmez, böylece web'deki "hiçbir yere gönderilmez" sözü doğru kalır). Kod `starboard-site/js/barcode.js`, yerel sarmalayıcılar `native.js` içinde (`nativeScan`, `nativeGet`); form `meals.js` içindeki `customFoodForm()` / `wireCustomForm()` (elle "Kendim tanımlayayım" ile ortak).

- **Eklenti:** `@capacitor/barcode-scanner` (tam sürüm sabit; Apple Vision, SPM). Projede paketleyici olmadığı için `nativePlugin("CapacitorBarcodeScanner")` ile doğrudan çağrılır; eklentinin yerel tarafı `scanInstructions`, `scanButton`, `cameraDirection`, `scanOrientation` ve `hint` alanlarını zorunlu sayar, hepsi `nativeScan` içinde verilir (`hint: 17` bütün biçimler). Hata kodları eklentinin iOS kaynağından: `OS-PLUG-BARC-0006` vazgeçildi, `-0007` kamera izni yok, gerisi genel hata. Eklenti yükseltilince `npx cap sync ios` çalıştırılıp `ios/App/CapApp-SPM/Package.swift` depoya gönderilmelidir.
- **Veri akışı:** okunan kod `validGtin` (rakam, uzunluk 8/12/13/14, sağlama basamağı) ve `normGtin` (UPC-A 13 haneye tamamlanır; Open Food Facts da böyle tutar) ile denetlenir. Önce `foodByBarcode()` ile cihaza bakılır, bulunursa ağa çıkılmaz. Yoksa `lookupBarcode()` `GET https://world.openfoodfacts.org/api/v2/product/<kod>.json?fields=…` ister: gövde, çerez, profil ya da günlük verisi yoktur; `CapacitorHttp` ile `User-Agent: Starboard/<sürüm> (…)` gönderilir (yoksa `fetch`, yalnızca `Accept`); süre 8 sn. Ürün görselleri indirilmez.
- **"Yalnızca barkod çıkar" kuralı:** isteğe barkoddan başka veri eklenmemeli; test adres biçimini ve başlıkları sabitler. Gizlilik metinleri (`privacy.html`, `about.js`, `settings.js`), `PrivacyInfo.xcprivacy` ve ROADMAP'teki App Store beyanı buna bağlıdır; bu kural değişirse hepsi güncellenir.
- **Hesap ve ekran ayrımı:** `offToFood()` yalnızca sayı, durum (`ok`, `partial`, `notfound`) ve temizlenmiş ad döndürür; metne çevirme `barcode.js` arayüz kısmındadır. Kurallar: değerler sayı ve 0–100, p+c+f ≤ 105; yalnızca porsiyon başına verilmişse `serving_quantity` ile 100 g'a çevrilir; yalnızca kJ ise 4,184'e bölünür; ml başınaysa 1 ml ≈ 1 g; etiket kalorisi makrolardan hesaplanandan %20'den fazla (ve en az 10 kcal) ayrışırsa uyarı. Uygulama kaloriyi her yerde makrolardan hesaplar, etiket kalorisi saklanmaz.
- **Kayıt:** `state.customFoods["bc_" + barkod] = { n, p, c, f, lif, i, bc, a, br?, src?, por? }`. `a` barkod ve marka (numarayla arama çalışsın), `src:"off"` verinin Open Food Facts'ten geldiği, `por` tek bir "porsiyon" ölçüsü. Open Food Facts'ten gelen hiçbir metin `unit`/`unitName` alanına yazılmaz (bazı ekranlar `unitName`'i kaçışsız basar); ad ve marka `< >` ve denetim karakterlerinden arındırılır, ekran yine `esc()` ile basar. `state.bcOk` ilk kullanımdaki bilgi penceresinin onayıdır. Şema sürümü artmadı (alanlar isteğe bağlı).
- **Testler:** `tests/fixtures/off-*.json` örnek yanıtlar (Nutella gerçek yanıttan kırpıldı); `tests.js` içindeki "barkod" testleri saf işlevleri, istek biçimini, kaydı, kaçışı, akışın bütün durumlarını (iki dilde) ve iOS beyanlarını denetler. Kamera ve ağ `nativeScan` / `nativeGet` sahte işlevleriyle değiştirilir. Gerçek tarama yalnızca gerçek iPhone'da (TestFlight) denenebilir. Erişilebilirlik aracında (`tools/a11y-audit.html`) iki barkod ekranı ve iki "Kendi yiyeceklerim" ekranı vardır.
- **Lisans:** Open Food Facts verisi ODbL; kaynak Hakkında › kaynaklarda ve önizlemede gösterilir.

## Apple Sağlık

Yalnızca iPhone uygulamasında (`healthAvailable()` web'de ve Sağlık'ı olmayan cihazda `false`, Ayarlar bölümü çizilmez). Kod `starboard-site/js/health.js`; eklenti `@capgo/capacitor-health` (tam sürüm sabit, SPM), `nativePlugin("Health")` ile doğrudan çağrılır. Yalnızca okuma: adım, uyku, kilo; Sağlık'a yazılmaz.

- **Hesap ve ekran ayrımı:** `hkStepsByDay`, `hkSleepByDay`, `hkWeightByDay` eklentinin örneklerini güne göre sayıya çevirir; `applyHealth` bunları kayda yazar. Hepsi saf ve web'de test edilir. Okuma (`hkRead`), eşitleme (`syncHealth`, `healthSoon`) ve Ayarlar bölümü (`healthSection` / `wireHealth`) yereldir.
- **Kayıt:** veriler mevcut alanlara yazılır (`steps`, `sleep`/`bed`/`wake`, `weight`); `days[k].hk` Sağlık'tan o alana yazılan son değeri tutar. Elle girilen değer kazanır: alan `hk`'den farklıysa ya da `hk` varken boşsa dokunulmaz. Ayar `profile.health = { on, steps, sleep, weight, lastSync }`. Şema sürümü artmadı.
- **Kurallar:** adım günlük toplam (`queryAggregated`, iPhone ile Watch çift sayılmaz); uyku toplam uyku süresi, kalkılan güne yazılır, 3 saatten kısa oturum atılır, birden çok kaynakta Watch önce; kilo günün ilk ölçümü, 25–400 kg. İlk bağlantıda 14 gün geriye. Okuma reddi iOS'ta bildirilmez; veri gelmezse yardım metni gösterilir.
- **Testler:** `tests.js` içindeki "sağlık" testleri; eklenti `hkRead`'e sahte nesneyle verilir. Erişilebilirlik aracında iki Sağlık ekranı vardır. Gerçek izin ve veri yalnızca gerçek iPhone'da (TestFlight) denenebilir.

## Kendi yiyeceklerim

`state.customFoods` (elle tanımlanan `cf_<zaman>` ve barkodla gelen `bc_<barkod>` kayıtları) Beslenme › Günlüğüm › Besin ekle › "Kendi yiyeceklerim" ile düzenlenir ve silinir (`meals.js`: `myFoodsBlock()`, `deleteCustomFood()`; web ve iPhone'da aynı). Düzenleme `customFoodForm()` / `wireCustomForm()` yeniden kullanır (`pre.edit`): yalnızca ad, protein, karbonhidrat, yağ ve lif değişir; anahtar, barkod, marka, porsiyon ve kaynak olduğu gibi kalır.

Silme ve düzenleme geçmişi bozmaz, çünkü günlük kalemi (`state.days[g].log[]`) eklendiği anda ad, makrolar, lif, mikro besinler ve simgeyi kendi içine kopyalar; `k` yalnızca "sık yediklerin", `foodUsage()` ve porsiyon ölçüsü (`unit`, `por`) için kullanılır. Silinmiş bir `k` için `foodOf()` boş döner ve bütün okuyanlar bunu karşılar: günlük toplamları ve satırlar aynı kalır, yalnızca "2 dilim" yerine gram yazılır. Bu yüzden "gizle" ya da şema artırma gerekmedi (`SCHEMA` 2). Kural: günlük kalemlerinin değerlerini `foodOf(it.k)` üzerinden okuma; kalemin kendi alanlarını kullan. `deleteCustomFood()` ayrıca yiyeceği sabit öğünlerden, öneri dışlamalarından ve alışveriş işaretlerinden temizler; kayıtlı öğünler zaten değerlerini taşır.

## Yerelde çalıştırma

Site (http://localhost:8765):

```
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

Testler (http://localhost:8766/tests/):

```
powershell -ExecutionPolicy Bypass -File tools/serve.ps1 -Root . -Port 8766
```
