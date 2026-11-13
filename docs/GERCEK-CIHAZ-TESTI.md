# Gerçek iPhone'da deneme listesi

Bu liste, Starboard'ı TestFlight'tan kendi iPhone'una kurup elle denemen içindir. Teknik bilgi gerekmez.

- Her kutuyu (`- [ ]`) denedikçe işaretle (`- [x]`).
- Her maddede önce **ne yapacağın**, sonra **Görmelisin:** ile beklenen sonuç yazılı.
- Gördüğün şey farklıysa kutuyu boş bırak, ekran görüntüsünü al ve [10. bölüme](#10-hata-bulunca-ne-yapılacak) bak.
- **(doğrula)** işareti: bu maddeyi kodu okuyarak yazdım ama emin değilim. Gördüğün sonuç yazandan farklıysa bu hata olmayabilir; ne gördüğünü not et.
- Listede yalnızca uygulamada gerçekten olan davranışlar var. Bir özellik göremezsen "yok" diye not et.
- iOS'un kendi pencerelerindeki düğme adları (örn. "İzin Ver", "Tümünü Aç") iOS sürümüne göre biraz farklı yazılabilir; anlamı aynıysa sorun değil.

Bağlam: bu liste 1.9.0 sürümü içindir (barkod okuma ve Apple Sağlık ilk kez gerçek cihazda denenecek). Gerçek cihaz maddeleri [ROADMAP.md](../ROADMAP.md) içinde Faz 2 ve Faz 3 altında geçer; kapsam için oraya bak.

## 0. Hazırlık

Test notların (en üste yaz, hata bildirirken lazım olur):

- iPhone modeli: ………… iOS sürümü: …………
- Uygulama sürümü (Ben › Ayarlar › en alt): …………
- iPhone dili ve bölgesi: ………… Apple Watch var mı: evet / hayır

- [ ] TestFlight uygulamasını aç, Starboard'ı bul, **Yükle** (ya da **Güncelle**) de, sonra **Aç**'a dokun. **Görmelisin:** uygulama açılır, karşılama ekranı gelir (turuncu logo, "Starboard").
- [ ] iPhone'un dilini not et: Ayarlar › Genel › Dil ve Bölge. **Görmelisin:** "iPhone Dili" ve "Bölge" yazar. Bölge ABD ise ölçüler lb (libre) gelebilir; bu beklenen davranış.
- [ ] Bu listeyi iki kez geçeceksin: bir kez **Türkçe** iPhone'da (ana deneme), bir kez **İngilizce** iPhone'da (yalnızca 1, 3.2, 4.2 ve 9. bölümlerdeki metinlere bak). Hangisinden başladığını not et.
- [ ] Apple Sağlık'ta örnek veri var mı bak: Sağlık uygulaması › Göz at. **Görmelisin:** "Adımlar", "Uyku", "Vücut Ağırlığı" (Vücut Ölçüleri altında) için son günlerde en az birer kayıt. Hangileri var, not et: adım ☐ uyku ☐ kilo ☐
- [ ] Hiç kilo ya da uyku kaydı yoksa Sağlık'ta elle ekle: Göz at › (ilgili kategori) › sağ üstte **Veri Ekle**. **Görmelisin:** kayıt grafikte görünür. (Bölüm 4'te "veri yok" durumunu da deneyeceksin; bu yüzden bir kez boş hâli de not etmek işe yarar.)
- [ ] Not: Uygulamayı silersen içindeki bütün veriler de silinir (veriler yalnızca telefondadır). Silmeden önce işine yarayacak bir şey varsa Ayarlar › Yedekleme › JSON olarak indir'i dene **(doğrula: iPhone'da dosya indirme çalışmayabilir; çalışmazsa bunu bulgu olarak yaz)**.

## 1. İlk açılış

Dil ve birim, uygulama ilk açıldığında iPhone'un dil ve bölge ayarından alınır (kodda `navigator.language` kullanılır). Bu sayede Türkçe telefonda Türkçe ve metrik, bölgesi ABD olan telefonda imperial gelmesi beklenir. Bunun iPhone uygulamasında gerçekten böyle çalıştığı henüz görülmedi. **ROADMAP'te bu iOS riski ayrıca yazılı değil**; yalnız Faz 1'de dil ve birimin "tarayıcıdan geldiği" yazıyor. Bu bölüm tam olarak bunu sınar.

- [ ] Türkçe iPhone'da, uygulamayı ilk kez (yeni kurulumda) aç. **Görmelisin:** karşılama ekranı **Türkçe**: "Sağlığın için tek bir pano.", düğme "Başlayalım". Altta "English" bağlantısı.
- [ ] Başlayalım'a dokun, "Ölçülerin" adımına kadar ilerle. **Görmelisin:** "Birimler" altında **kg · cm · ml** seçili (lb değil). Boy cetveli "cm", kilo cetveli "kg". Kilo ondalığı **virgülle** yazılır (örn. 78,0).
- [ ] Aynı adımda "lb · ft · fl oz"a dokun, sonra yine "kg · cm · ml"e dön. **Görmelisin:** cetveller seçilen birimle yeniden çizilir; boy `5′10″` biçimine, sonra tekrar cm'ye geçer.
- [ ] Bölgesi **Türkiye** değilse (örn. ABD) bunu da dene: Türkçe dil + bölge ABD. **Görmelisin:** Türkçe metinler, ama birim lb · ft · fl oz (imperial) seçili gelir. **(doğrula)**
- [ ] Karşılama ekranında "English" bağlantısına dokun. **Görmelisin:** uygulama yeniden yüklenir ve İngilizce olur; Ayarlar › Kişiselleştirme › Dil'den geri Türkçe'ye dönülebilir.
- [ ] Ön bilgi: Dil bir kez seçilince ya da kayıt oluşunca kayıtlı dil kalır; telefon dili sonradan değişse de uygulama dili kendiliğinden değişmez. İngilizce denemesi için uygulamayı **sil**, iPhone dilini İngilizce yap, yeniden kur. **Görmelisin:** karşılama İngilizce ("One board for your health."), birimler bölgeye göre (ABD'de lb).
- [ ] Hatırlatmalar adımı (yalnızca iPhone'da gelir): onboarding sonlarında "Hatırlatmalar" sayfası. **Görmelisin:** "Hatırlatmaları aç" ve "Şimdilik istemiyorum" seçenekleri. "Hatırlatmaları aç" seçersen bildirim izni **uygulamayı başlatırken** sorulur (Bölüm 6).
- [ ] Onboarding'i bitir ("Başla"). **Görmelisin:** Bugün ekranı açılır; ilk gün için kilo girilmiş olur.

## 2. Kalıcı veri

iOS bazen web içeriğinin verisini siler. Starboard bunu önlemek için veriyi dosyaya yazar; burada bunun gerçekten tuttuğunu sınıyoruz.

- [ ] Bugün ekranında birkaç değişiklik yap: bir su bardağı doldur, kilo gir, Beslenme'de bir yiyecek ekle, Ayarlar'da temayı değiştir. Bunları not et.
- [ ] Uygulamayı kapat: ekranın altından yukarı kaydırıp uygulama listesinde Starboard'ı yukarı fırlat. Sonra ana ekrandan yeniden aç. **Görmelisin:** karşılama/onboarding **gelmez**; yaptığın bütün değişiklikler yerinde.
- [ ] Uygulamayı ana ekrana gönderip (alttan kısa kaydır) birkaç dakika sonra geri dön. **Görmelisin:** aynı ekran, veri aynı.
- [ ] iPhone'u yeniden başlat (Ayarlar › Genel › Kapat, ardından aç). Uygulamayı yeniden aç. **Görmelisin:** veriler aynen duruyor, onboarding gelmez.
- [ ] Dil seçimini (Ayarlar › Kişiselleştirme › Dil) değiştirip uygulamayı kapat-aç. **Görmelisin:** seçtiğin dil kalır.
- [ ] TestFlight'ta yeni bir sürüm çıktıysa uygulamayı **silmeden güncelle**. **Görmelisin:** veriler korunur; ilk açılışta "Neler yeni" penceresi bir kez çıkabilir (yalnızca yeni özellik varsa).

## 3. Barkod

Yol: **Beslenme › Bugün › Besin ekle › Barkod okut.** (Düğme yalnızca iPhone uygulamasında vardır.) İzin penceresi iOS'ta **yalnızca bir kez** çıkar; bu yüzden aşağıdaki sıra önemli: önce reddet, sonra Ayarlar'dan aç.

- [ ] Besin ekle'yi aç. **Görmelisin:** "Barkod okut" ve "Kendim tanımlayayım" düğmeleri.
- [ ] **İlk kullanım bilgi penceresi.** "Barkod okut"a dokun. **Görmelisin:** "Barkod okut" başlıklı pencere: "Yalnızca barkod numarası Open Food Facts'e gönderilir; başka hiçbir verin cihazdan çıkmaz." Düğmeler: **Devam**, **Vazgeç**, sağ üstte ×.
- [ ] **Vazgeç**'e (ya da ×'e) dokun. **Görmelisin:** pencere kapanır, kamera **açılmaz**, izin sorulmaz. Barkod okut'a tekrar dokunursan bilgi penceresi yine çıkar.
- [ ] Yine Barkod okut › **Devam**. **Görmelisin:** iOS kamera izin penceresi açılır.
- [ ] **İzin penceresi metni (Türkçe iPhone):** "Starboard, paketli ürünlerin barkodunu okumak için kamerayı kullanır. Besin değerlerini bulmak için Open Food Facts'e yalnızca barkod numarası gönderilir; görüntü kaydedilmez ve gönderilmez." Metin Türkçe değilse (İngilizce çıkıyorsa) işaretleme, bulgu olarak yaz. **(doğrula: iOS, uygulama dilini Info.plist/lproj dosyalarından seçer)**
- [ ] İngilizce iPhone'da aynı pencere: "Starboard uses the camera to scan the barcodes of packaged foods. Only the barcode number is sent to Open Food Facts to find the nutrition facts; no image is saved or sent." **Görmelisin:** İngilizce metin.
- [ ] **İzni reddet.** İzin penceresinde **İzin Verme**'ye dokun. **Görmelisin:** Barkod bölümünde uyarı: "Kamera izni kapalı: Ayarlar › Starboard › Kamera" ve altında **Barkod numarası** alanı ile **Bul** düğmesi (elle giriş). Uygulama kapanmaz. **(doğrula: bazı iOS sürümlerinde mesaj yerine "Tarayıcı açılamadı." + Tekrar dene / Elle gir çıkabilir; bu da kabul edilebilir, ama not et.)**
- [ ] **Elle barkod girişi.** Alana `1234567890123` yaz, **Bul**'a dokun. **Görmelisin:** kırmızı uyarı "Geçersiz barkod".
- [ ] Alana `3017620422003` yaz (Nutella), **Bul**. **Görmelisin:** "Ürün aranıyor…", sonra "Barkod 3017620422003" başlıklı form: ad, protein / karbonhidrat / yağ / lif dolu, altında "Kaynak: Open Food Facts" ve marka notu. Kalori satırı "≈ … kcal / 100 g" yazar. (İnternet gerekir.)
- [ ] Formu değiştirmeden **Kaydet ve ekle**'ye dokun. **Görmelisin:** ürün seçili olarak miktar kartı açılır; miktarı girip günlüğe ekleyebilirsin. Ürün Bugün ekranında görünür.
- [ ] **İzni Ayarlar'dan aç.** iPhone'da Ayarlar › Starboard › **Kamera**'yı aç, uygulamaya dön. **Görmelisin:** Barkod okut'a basınca artık kamera açılır (bilgi penceresi bu kez çıkmaz, çünkü Devam'ı zaten seçtin). **(doğrula: iOS, izin değişince uygulamayı kapatıp yeniden açabilir; veriler yerinde kalmalı.)**
- [ ] **Tarama.** Barkod okut'a dokun. **Görmelisin:** tam ekran kamera görüntüsü, üstte "Barkodu çerçevenin içine getir" yazısı; kapatma ve fener düğmeleri. **(doğrula: görünen düğme adları eklentiye ait; yalnızca ekran okuyucu adları Starboard'dan gelir.)**
- [ ] Örnek barkodu okut: **3017620422003** (Nutella kavanozu; elinde yoksa bilgisayar ekranında barkod resmini göster). **Görmelisin:** barkod birkaç saniyede okunur, "Ürün aranıyor…" ve ürün formu çıkar. Ürün daha önce kaydedildiyse doğrudan miktar kartı gelir (aşağıdaki "ikinci kez" maddesi).
- [ ] Kapat düğmesi ile **vazgeç**. Kamera ekranını kapat. **Görmelisin:** Besin ekle ekranına dönersin; hata mesajı çıkmaz.
- [ ] **Bulunamayan ürün.** Veritabanında olmayacak bir ürünü okut (örn. yerel bir ürün, kitap ya da market içi paketli ürün); ya da elle girişte geçerli ama bilinmeyen bir numara dene. **Görmelisin:** "Bu ürün Open Food Facts'te yok. Değerleri ambalajdan girebilirsin." ve **boş** form; elle doldurup **Kaydet ve ekle** ile kaydedebilirsin. **(doğrula: ürün veritabanında olabilir; bulunursa başka bir ürün dene.)**
- [ ] **Eksik değerli ürün** (rastlarsan): "Değerler eksik; tamamlayıp kaydet." uyarısı ve boş kalan alanlar. Tamamlayıp kaydet. **Görmelisin:** üç değer de dolu olmadan Kaydet çalışmaz ("Değerler eksik; tamamlayıp kaydet.").
- [ ] **Uçak modu.** Kontrol Merkezi'nden uçak modunu aç. Daha önce **okutmadığın** bir ürünü tara. **Görmelisin:** "Bağlantı kurulamadı." ve **Tekrar dene** / **Elle gir** düğmeleri. **Elle gir** boş form açar.
- [ ] Uçak modunu kapat, **Tekrar dene**'ye dokun. **Görmelisin:** ürün bulunur, form dolu gelir. (Sunucu yavaşsa 8 saniye sonra "Bağlantı kurulamadı." çıkabilir; yeniden dene.)
- [ ] **Aynı barkodu ikinci kez okutma.** Daha önce kaydettiğin 3017620422003'ü tekrar okut (uçak modu açıkken de dene). **Görmelisin:** "Ürün aranıyor…" **beklemeden** ve internet olmadan ürün doğrudan seçili miktar kartıyla gelir; ikinci bir kopya oluşmaz.
- [ ] Besin ekle'nin arama kutusuna `3017620422003` ya da `Nutella` yaz. **Görmelisin:** kaydettiğin ürün sonuçlarda çıkar.
- [ ] **Kalori uyarı notu.** Rastladığın ürünlerde formun üstünde "Etiket … kcal diyor, değerleri kontrol et." sarı notu çıkarsa not et: yazdığı kalori ile gerçekten ambalajdaki kalori uyuşmuyor mu? **Görmelisin:** not yalnızca etiket ile makro hesabı %20'den fazla ayrışınca çıkar; her üründe çıkması beklenmez. Uygulama kaloriyi her zaman protein/karb/yağdan hesaplar, bu yüzden etiketle küçük farklar normaldir.
- [ ] İçecek tarayınca (örn. ayran, meyve suyu) bu not çıkabilir: "Değerler 100 ml başına; 1 ml ≈ 1 g sayıldı." **Görmelisin:** değerler makul görünür.

## 4. Apple Sağlık

Yol: **Ben › Ayarlar › Apple Sağlık.** Yalnızca okuma yapar: adım, uyku, kilo. Sağlık'a **hiçbir şey yazmaz**. Bölüm yalnızca iPhone'da görünür.

- [ ] Ayarlar'da aşağı kaydır. **Görmelisin:** "Apple Sağlık" başlığı, "Adımını, uykunu ve kilonu Apple Sağlık'tan al; hedeflerin kendiliğinden işaretlensin. Veriler bu iPhone'dan çıkmaz." metni, üç seçili rozet (**Adım**, **Uyku**, **Kilo**) ve **Sağlık'a bağlan** düğmesi. **(doğrula: bölüm hiç görünmüyorsa Sağlık yeteneği imzalı sürümde eksik olabilir; bunu bulgu yaz.)**
- [ ] **Bağlan (hepsine izin).** **Sağlık'a bağlan**'a dokun. **Görmelisin:** iOS'un Sağlık erişimi penceresi: adım, uyku ve kilo (vücut ağırlığı) için okuma izni. **Yazma** izni istenmez (kod yalnızca okuma ister; **doğrula**: pencerede "Yazma" bölümü görünüyorsa not et). Metin Türkçe: "Starboard, günlük hedeflerinin yanında göstermek için Apple Sağlık'tan adım, uyku ve kilo verilerini okur. Starboard bu verileri hiçbir yere göndermez." İngilizce iPhone'da İngilizce.
- [ ] Tüm türleri aç (pencerede "Tümünü Aç" benzeri bir seçenek olur) ve onayla (**İzin Ver**). **Görmelisin:** kısa bildirim "Sağlık'tan … günlük veri alındı." ve altında "Son eşitleme: …" saati. Adım, uyku, kilo rozetleri yerinde.
- [ ] Bugün ekranına git. **Görmelisin:** adım, uyku ve kilo satırlarının yanında **"· Sağlık'tan"** etiketi (veri o güne düşmüşse). Uyku kadranının ortasında toplam uyku süresi.
- [ ] **Doğru güne düşüyor mu?** Sağlık uygulamasındaki değerlerle karşılaştır:
  - [ ] **Adım:** bugünkü adım toplamı Sağlık'taki "Adımlar" ile aynı (ya da çok yakın; gün içinde artar). Geçmiş günlerde de aynı: Bugün ekranındaki takvimden dünkü ve evvelki günü aç. **Görmelisin:** adım toplamı her gün için Sağlık'takiyle uyuşur, iPhone ve Watch çift sayılmaz.
  - [ ] **Uyku:** gece uykusu **uyanılan güne** yazılır (dün gece 23:30–07:00 uyku, bugünün satırında görünür). Süre, yatakta geçen değil **uyuyarak geçen** süredir (Sağlık'taki "Uyku" toplamıyla uyuşmalı); bu yüzden yatış-kalkış aralığından kısa olabilir. 3 saatten kısa şekerlemeler sayılmaz.
  - [ ] **Kilo:** Sağlık'ta bir günde birden çok ölçüm varsa Starboard o günün **ilk** ölçümünü gösterir. Değer kg (ya da lb) olarak doğru görünür. 25–400 kg dışı değerler alınmaz.
- [ ] **Elle girilen değer ezilmez.** Bugün ekranında Sağlık'tan gelen kilo (ya da adım) satırını elle başka bir değerle değiştir. Sonra Ayarlar'da **Şimdi eşitle**'ye bas ve uygulamayı kapat-aç. **Görmelisin:** senin yazdığın değer kalır, "· Sağlık'tan" etiketi **kalkar**. **(doğrula: elle girişin tam yeri; Bugün satırlarından ya da hızlı giriş penceresinden yapılabilir.)**
- [ ] Sağlık'tan gelen bir değeri **sil** (alanı boşalt) ve yine **Şimdi eşitle**. **Görmelisin:** silinen değer geri gelmez.
- [ ] **Yeni veri.** Sağlık'a yeni bir kilo ya da uyku kaydı ekle, Starboard'a dön (en fazla bir dakika bekle) ya da **Şimdi eşitle**. **Görmelisin:** yeni değer Starboard'da görünür. Elle değiştirmediğin bir günse eski Sağlık değeri güncellenir.
- [ ] **Kısmi izin.** iPhone Sağlık uygulaması › sağ üstte profil › Gizlilik › Uygulamalar › Starboard: yalnızca **adım** iznini açık bırak, uyku ve kilo izinlerini kapat. Starboard'a dön, **Şimdi eşitle**. **Görmelisin:** adım gelir; uyku ve kilo yeni veri almaz; çökme olmaz. (Kapatılan türler veri gelmediği için boş görünür; iOS okuma reddini uygulamaya bildirmez.)
- [ ] Rozetlerden birini kapat (örn. Uyku). **Görmelisin:** rozet seçili durumdan çıkar; bir daha uyku okunmaz. Üçünü de kapatmaya çalışırsan son rozette "En az bir veri türü seç." uyarısı çıkar.
- [ ] Kapattığın bir rozeti yeniden aç. **Görmelisin:** gerekirse iOS izin penceresi bir kez daha çıkar ve 14 gün geriye veri okunur.
- [ ] **Hepsini reddet.** Sağlık › profil › Gizlilik › Uygulamalar › Starboard › tüm türleri kapat ("Tümünü Kapat" benzeri seçenek). Starboard'da **Şimdi eşitle**. **Görmelisin:** "Sağlık'tan veri gelmedi. İzin vermediysen: Sağlık uygulaması › profil › Gizlilik › Uygulamalar › Starboard." notu; bir hata ya da çökme yok. (Gerçekten hiç veri olmayan bir telefonda da aynı not çıkar; iOS ikisini ayırt ettirmez.)
- [ ] İzinleri geri aç, **Şimdi eşitle**. **Görmelisin:** veri yeniden gelir ve not kaybolur.
- [ ] **İlk bağlanışta hepsini reddet.** Starboard'ı silip yeniden kurduysan, ilk bağlanışta izin penceresinde hiçbir türe izin verme (hepsi kapalı bırak). **Görmelisin:** yukarıdaki "veri gelmedi" notu.
- [ ] **Apple Watch'lı iPhone:** adım ve uyku Watch'tan da gelir. **Görmelisin:** adım toplamı Sağlık'taki toplamla aynı (çift sayılmaz). Uyku birden çok kaynaktan geliyorsa Watch verisi öncelikli.
- [ ] **Watch'sız iPhone:** adım iPhone'dan gelir. Uyku verisi yoksa uyku satırı "Uyku girilmedi" der. Bu hata değildir.
- [ ] **Şimdi eşitle** düğmesi. **Görmelisin:** "Son eşitleme" saati güncellenir.
- [ ] **Uçak modu.** Uçak modunu aç, **Şimdi eşitle**'ye bas. **Görmelisin:** eşitleme yine çalışır (Sağlık verisi cihazdadır, ağ gerekmez).
- [ ] **Saat dilimi (isteğe bağlı).** Ayarlar › Genel › Tarih ve Saat'ten saat dilimini elle değiştir, Starboard'ı aç. **Görmelisin:** adım, uyku, kilo yine doğru günlere düşer. **(doğrula)**
- [ ] **Bağlantıyı kes.** Ayarlar'da **Bağlantıyı kes**'e dokun. **Görmelisin:** bölüm yeniden "Sağlık'a bağlan" düğmesine döner; yeni Sağlık verisi artık gelmez; daha önce alınan değerler kayıtta **kalır**. (Bağlıyken görünen "İzni yalnızca Sağlık uygulamasından geri alabilirsin." notu da kaybolur.)
- [ ] Tekrar **Sağlık'a bağlan**. **Görmelisin:** izin penceresi tekrar çıkmaz (iOS bir kez sorar), veri 14 gün geriye yeniden okunur.
- [ ] **İzni Sağlık uygulamasından geri alma.** Sağlık › profil › Gizlilik › Uygulamalar › Starboard › hepsini kapat (Starboard hâlâ bağlıyken). Starboard'a dön. **Görmelisin:** uygulama çalışır; **Şimdi eşitle** "veri gelmedi" notunu gösterir, eski veriler silinmez.

## 5. Kendi yiyeceklerim

Not: Kendi yiyecekleri **düzenleme ve silme ekranı henüz yok** (bkz. [ROADMAP](../ROADMAP.md) Faz 4: "Kendi yiyeceklerini düzenleme ve silme ekranı"). Barkodla kaydedilen ürünler birikir; şimdilik tek silme yolu "Tüm verileri sil". Aşağıdaki iki maddede yok sayılırsa hata değil, "henüz yok" diye işaretle.

- [ ] Besin ekle › **Kendim tanımlayayım**. Ad, protein, karbonhidrat, yağ (isteğe bağlı lif) gir. **Görmelisin:** yazarken "≈ … kcal / 100 g" canlı değişir. **Kaydet** sonrası yiyecek seçili olarak miktar kartı açılır.
- [ ] Besin ekle arama kutusuna kaydettiğin yiyeceğin adını yaz. **Görmelisin:** yiyecek sonuçlarda çıkar; günlüğe eklenebilir.
- [ ] **Düzenle:** kaydettiğin yiyeceği düzenlemeyi dene (yiyeceğe uzun bas, dokun, Ayarlar'da ara). **Görmelisin:** bir düzenleme yolu **yoktur** (kodda göremedim; **doğrula**). Bulursan nerede olduğunu yaz.
- [ ] **Sil:** kaydettiğin yiyeceği silmeyi dene. **Görmelisin:** bir silme yolu **yoktur** (**doğrula**). Günlüğe eklediğin bir öğünü günlükten silmek ayrıdır ve çalışmalı **(doğrula)**.
- [ ] **En son yap:** Ayarlar › en alta kaydır › **Tüm verileri sil**'e dokun. **Görmelisin:** "Tüm veriler silinecek. Emin misin?" onayı; onaylarsan karşılama/onboarding yeniden başlar ve kendi yiyeceklerin dahil her şey gider.

## 6. Hatırlatmalar

Yol: **Ben › Ayarlar › Hatırlatmalar.** Bildirimler cihazda kurulur, sunucu yoktur. Uygulama açılınca ve kayıt değişince önümüzdeki 7 günün bildirimleri yeniden kurulur.

- [ ] Hatırlatmalar bölümünü aç. **Görmelisin:** beş rozet: **Su**, **Antrenman günleri**, **Yatma vakti**, **Sabah tartısı**, **Günü kapat**; hiçbiri seçili değil (onboarding'de açmadıysan).
- [ ] **İzin penceresi.** Bir rozete (örn. **Günü kapat**) ilk kez dokun. **Görmelisin:** iOS'un bildirim izin penceresi ("Bildirim Göndermek İstiyor"). Bu pencerenin metni iOS'un kendi metnidir; Starboard'a özgü bir açıklama yoktur.
- [ ] **İzin Ver**'e dokun. **Görmelisin:** rozet seçili olur ve altında saat alanı çıkar. Varsayılan saatler: Su 10:00 · 13:00 · 16:00 · 19:00, Antrenman 18:00, Sabah tartısı 08:00, Günü kapat 21:00. Yatma vakti rozeti açılırsa altında "Otomatik: yatma saatinden 30 dk önce."
- [ ] **İzni reddetme.** (Ayarlar › Starboard › Bildirimler'i kapat ya da ilk istenişte **İzin Verme** de.) Bir rozete dokun. **Görmelisin:** kısa bildirim "Bildirim izni verilmedi. iPhone Ayarlar › Starboard › Bildirimler'den açabilirsin." Rozet **seçilmez**.
- [ ] Bildirimleri iPhone Ayarlar'dan geri aç, rozeti dene. **Görmelisin:** artık seçilir.
- [ ] **Saat değişikliği.** "Günü kapat" açıkken saatini **şimdiki saatten 2–3 dakika sonrasına** ayarla (bildirim saati geçmişse o gün atlanır). Sonra uygulamayı ana ekrana gönder / ekranı kilitle. **Görmelisin:** ayarladığın dakikada bildirim: **"Günü kapat — Bugünün eksiklerine bir bak."** **(doğrula: uygulama açıkken bildirim banner'ı çıkmayabilir; uygulamayı arka plana al.)**
- [ ] Saat alanını bir kez daha değiştir ve uygulamayı kapat-aç. **Görmelisin:** yeni saat kalır, bildirim yeni saatte gelir; eski saatte gelmez.
- [ ] **Su:** Su rozetini aç. **Görmelisin:** dört saat kutusu ve "İstemediğin saati sil; o gün su hedefine ulaşınca susar." notu. Bir kutuyu temizle ve kalan saatlerden birini 2 dakika sonraya al. Bildirim: **"Su içme vakti — Bugünkü hedefin …"**. O gün su hedefine ulaşırsan su bildirimi gelmemeli.
- [ ] **Sabah tartısı:** o gün kilo girdiysen bildirim gelmemeli; girmediysen gelir: **"Sabah tartısı — Kahvaltıdan önce tartılıp kilonu gir."**
- [ ] **Yatma vakti:** saati 2 dakika sonraya al. Bildirim: **"Yatma vakti yaklaşıyor — Hedefin 7-9 saat uyku."** "Otomatiğe dön" bağlantısı saati yeniden otomatik yapar.
- [ ] **Antrenman günleri:** yalnızca o gün programında antrenman varsa gelir: **"Antrenman günü — …"** (başlıkta o günün antrenman adı). Dinlenme günündeyse gelmemesi doğru.
- [ ] **Bildirime dokunma.** Bildirim geldiğinde dokun. **Görmelisin:** Starboard açılır. Bildirimin belirli bir ekrana götürmesi **beklenmiyor** (kodda bu yönlendirme yok; **doğrula**): Bugün ekranının açılması yeterli.
- [ ] Rozeti kapat. **Görmelisin:** rozet seçimi kalkar; saat alanı kaybolur; o hatırlatma bir daha gelmez (kısa bir saatle dene).
- [ ] Onboarding'de "Hatırlatmaları aç" dediysen: Ayarlar'da Su, Antrenman günleri ve Yatma vakti açık gelmeli. **Görmelisin:** üçü seçili.

## 7. Görünüm

- [ ] **Çentik / Dynamic Island:** uygulamayı dikey aç. **Görmelisin:** üstteki başlık (selamlama) ve ilk satır çentiğin/Dynamic Island'ın **altında** kalır; hiçbir yazı arkasında kalmaz. Saat ve pil okunur.
- [ ] **Ana ekran çubuğu (alttaki çizgi):** alt menü (Bugün, Beslenme, Program …) çizginin **üstündedir**, dokunması kolay; çizgi menüyü kapatmaz. Uzun bir sayfayı (Beslenme, Ayarlar) en alta kadar kaydır. **Görmelisin:** son satır alt menünün arkasında **kalmaz**.
- [ ] Alttan açılan pencereleri dene (Hızlı giriş, bilgi pencereleri, Barkod okut bilgisi). **Görmelisin:** düğmeler alt çizginin üzerinde, tamamen dokunulabilir. Kısa bildirimler (toast) alt menünün üstünde görünür.
- [ ] Antrenman modunu aç (varsa). **Görmelisin:** ekranın altındaki düğmeler alt çizginin altında kalmaz, dokunulabilir.
- [ ] **Koyu tema:** Ayarlar › Kişiselleştirme › Tema › **Koyu**. **Görmelisin:** uygulama koyu olur; üstteki **saat ve pil beyaz** (okunur). **Açık** seçince koyu yazı. İkisinde de durum çubuğu zeminle karışmaz.
- [ ] Tema **Otomatik**'ken iPhone'u koyu/açık moda al (Kontrol Merkezi › parlaklık › görünüm). **Görmelisin:** uygulama yeniden açmadan temaya uyar; durum çubuğu yazısı da değişir.
- [ ] Koyu temada uygulamayı kapatıp aç. **Görmelisin:** açılış anında beyaz/açık bir ekran **çakması** olmamalı; çok kısa bir açık renk görürsen not et **(doğrula: açılış rengi açık temaya göre ayarlı, `#FFF6F2`)**.
- [ ] **Dokunsal geri bildirim:** iPhone'da Ayarlar › Ses ve Dokunuş › Sistem Dokunuşları açık olsun. Dene: bir **su bardağına dokun** (hafif titreşim); kutlama animasyonu çıktığında ya da yeni rekor kırdığında (başarı titreşimi); antrenman modunda dinlenme sayacının bitişi (uyarı titreşimi). **Görmelisin:** her birinde kısa titreşim. Titreşim hiç yoksa not et.
- [ ] **Yatay ekran:** Dönme Kilidi'ni kapat, iPhone'u yan çevir. **Görmelisin:** uygulama yatay döner; içerik okunur, alt menü ve düğmeler erişilebilir, yazılar yan kenarlarda çentik/yuvarlak köşeler arkasında **kalmaz**. **(doğrula: kodda yalnızca üst ve alt güvenli alan payı var, yan kenarlar yok; yatayda yazılar çentiğin altına girebilir. Girerse bulgu olarak yaz.)**
- [ ] Dikey konuma dön. **Görmelisin:** düzen toparlanır, kaydırma konumu bozulmaz.

## 8. Erişilebilirlik

VoiceOver açma: Ayarlar › Erişilebilirlik › VoiceOver. Kolay açıp kapatmak için Ayarlar › Erişilebilirlik › Erişilebilirlik Kısayolu › VoiceOver, sonra yan tuşa üç kez bas. Gezinmek için: sağa/sola kaydır = sonraki/önceki öğe, çift dokun = seç.

- [ ] VoiceOver'ı aç ve Starboard'ı başlat. Karşılama ekranında sağa kaydırarak gez. **Görmelisin:** her öğe anlamlı okunur (başlık, "Başlayalım" düğmesi, dil bağlantısı). "Düğme" diye tek başına, adı olmayan öğe **olmamalı**.
- [ ] **Onboarding'i VoiceOver'la bitir.** Her soruda seçim kartlarına çift dokun. **Görmelisin:** seçili olan "seçili" diye okunur. Boy/kilo cetveli bir **kaydırıcı** olarak okunur; yukarı/aşağı kaydırarak değer artar/azalır ve değer sesli okunur. Rakama çift dokununca elle yazılabilir. Hata uyarıları sesli okunur ("Cinsiyet seç…").
- [ ] **Bugün ekranı:** görevleri tek tek gez, bir görevi işaretle. **Görmelisin:** durum ("tamamlandı" ya da benzeri) okunur. Su bardağı düğmeleri anlaşılır. Kısa bildirimler (örn. "Yeni rekor") otomatik **okunur** (canlı bölge).
- [ ] **Alt menü:** sekmeleri dolaş. **Görmelisin:** her sekme adıyla okunur, seçili sekme belli.
- [ ] **Besin ekle:** arama kutusu "Ara: karnıyarık, hellim, kivi…" etiketiyle okunur; sonuçlara gidip bir yiyecek seç, miktar gir, ekle.
- [ ] **Barkod akışı:** "Barkod okut" bilgi penceresinde Devam / Vazgeç / Kapat okunur ve pencerenin arkasına odak kaçmaz. Kamera ekranında VoiceOver "Kapat", "Feneri aç" gibi düğme adlarını okur. Tarama sırasında barkod otomatik okunur; VoiceOver kullanıcısı için işe yarar mı not et. **(doğrula)**
- [ ] **Barkod formu:** Ad, Protein, Karb., Yağ, Lif alanlarının her biri **etiketiyle** okunur. Hata mesajı ("Geçersiz barkod", "Değerler eksik…") çıkınca duyulur.
- [ ] **Ayarlar:** Hatırlatma ve Apple Sağlık rozetlerine dokununca "seçili / seçili değil" okunur. **Apple Sağlık** bölümünde grup adı "Sağlık'tan alınacaklar" olarak okunur. Saat alanları ve su hatırlatmaları ("Su hatırlatması 1…4") etiketli.
- [ ] **Antrenman modu** (varsa): dinlenme sayacı (±15 sn ve Atla düğmeleri) okunur; sayaç bir **zamanlayıcı** olarak duyulur.
- [ ] VoiceOver'la **Ayarlar › Hakkında** bölümlerini aç/kapat. **Görmelisin:** açık/kapalı durumu okunur.
- [ ] VoiceOver'ı kapat.
- [ ] **Dynamic Type (en büyük yazı boyutu):** Ayarlar › Erişilebilirlik › Ekran ve Yazı Boyutu › Daha Büyük Metin › **Daha Büyük Erişilebilirlik Boyutları**'nı aç, kaydırıcıyı en sağa çek. Starboard'a dön. **Görmelisin (ideal):** yazılar büyür; hiçbir yazı kesilmez, hiçbir düğme ekran dışına taşmaz; yatay kaydırma gerekmez. **(doğrula: kodda yazı boyutları sabit pikseldir ve sistem yazı boyutuna bağlı görünmüyor; yazı hiç büyümüyorsa bu bir bulgudur, çökme değil. Ne olduğunu not et.)**
- [ ] En küçük yazı boyutuyla da bak. **Görmelisin:** düzen bozulmaz.
- [ ] **Hareketi Azalt** (Ayarlar › Erişilebilirlik › Hareket) açıkken Antrenman › "Nasıl yapılır" animasyonuna bak. **Görmelisin:** figür oynamaz, hareketin son hâli durağan gösterilir.
- [ ] Ayarlar'ı eski hâline getir (yazı boyutu, hareket, VoiceOver).

## 9. Gizlilik

- [ ] Ayarlar sayfasının en altına in. **Görmelisin (iPhone'da):** "Starboard — Sürüm 1.9.0 · veriler yalnızca bu cihazda saklanır; barkod okuttuğunda yalnızca barkod numarası gönderilir." (Sürüm numarası farklı olabilir.)
- [ ] **Hakkında** bölümünü aç. **Görmelisin:** üç başlık: **Sağlık uyarısı**, **Hesapların kaynakları**, **Gizlilik**.
- [ ] **Sağlık uyarısı:** "Starboard genel sağlık ve fitness takibi içindir; tıbbi tavsiye, tanı ya da tedavi yerine geçmez…" yazar.
- [ ] **Hesapların kaynakları:** listede "Paketli ürünler: Open Food Facts (açık veri, ODbL lisansı)…" satırı var.
- [ ] **Gizlilik**'i aç. **Görmelisin:** iPhone'da şu üç şey: (1) hesap istemediği ve verinin yalnızca cihazda kaldığı, (2) "Tek istisna: barkod okuttuğunda yalnızca barkod numarası Open Food Facts'e gönderilir (teknik olarak IP adresin de görünür)…", (3) "Apple Sağlık'a bağlanırsan adım, uyku ve kilo yalnızca okunur ve bu cihazda kalır…".
- [ ] **Gizlilik politikasının tamamı** bağlantısına dokun. **Görmelisin:** gizlilik sayfası açılır (Türkçe/İngilizce). **Önemli (doğrula):** bağlantı yeni sekmeyle (`target="_blank"`) açılıyor; iPhone uygulamasında hiçbir şey olmayabilir, ya da sayfa uygulamanın içinde açılıp **geri dönüş yolu bulunmayabilir**. Ne olduğunu yaz: hiçbir şey olmadı / sayfa açıldı ama geri dönemedim / Safari açıldı / sorunsuz.
- [ ] iPhone Ayarlar › Gizlilik ve Güvenlik › **Kamera** listesinde Starboard var (barkod denedikten sonra). **Görmelisin:** anahtar yaptığın seçime göre.
- [ ] iPhone Ayarlar › Gizlilik ve Güvenlik › **Sağlık** (ya da Sağlık uygulaması › Gizlilik › Uygulamalar) listesinde Starboard var. **Görmelisin:** yalnızca **okuma** izinleri; hiçbir tür için yazma izni yok.
- [ ] Uçak modundayken (barkod hariç) uygulamanın bütün ekranları çalışır. **Görmelisin:** internet olmadan da her şey açılır; yalnızca yeni barkod araması çalışmaz. **(doğrula)**

## 10. Hata bulunca ne yapılacak

1. **Ekran görüntüsü al:** yan tuş + ses açma tuşuna aynı anda kısa bas. Hata anında olduğundan emin ol; mümkünse hata mesajını da kapsasın. Ekran kaydı da işe yarar (Kontrol Merkezi › kayıt).
2. **Hangi adımda olduğunu yaz:** bu belgedeki madde numarası ya da bölümü (örn. "3. Barkod › İzni reddet") ve kendi cümlenle yaptığın adımlar.
3. **Ne bekliyordun, ne gördün:** ikisini ayrı yaz. "Beklenen: Kamera izni kapalı yazısı. Gördüğüm: boş ekran."
4. **Telefon bilgisi:**
   - iPhone modeli: Ayarlar › Genel › Hakkında › Model Adı
   - iOS sürümü: aynı sayfada "iOS Sürümü"
   - Starboard sürümü: Starboard › Ayarlar › en alt ("Sürüm …")
   - iPhone dili ve bölgesi; Apple Watch var mı; Sağlık'ta veri var mı
5. **Tekrar olur mu:** aynı adımları ikinci kez dene; her seferinde mi oluyor, bir kerelik mi, yaz.
6. **Nereye yazılır:** küçük eksikler [EKSIKLER.md](../EKSIKLER.md) listesine; hata ya da çökme için depoda GitHub Issues (ROADMAP Faz 4'te iletişimin şimdilik oradan olduğu yazıyor). TestFlight içinde de ekran görüntüsü alıp **Geri Bildirim Paylaş** diyebilirsin; iPhone modeli ve iOS sürümü genelde kendiliğinden eklenir; yine de yukarıdaki bilgileri yaz.
7. Çökme olursa: uygulamayı yeniden aç, verilerinin yerinde olup olmadığına bak ve bunu da yaz.
