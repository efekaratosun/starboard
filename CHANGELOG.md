# Değişiklik günlüğü

Sürüm numarası `starboard-site/js/storage.js` içindeki `APP_VERSION` değeridir ve Ayarlar'ın altında görünür.
Biçim: ANA.ÖZELLİK.DÜZELTME. Veri biçimi değişirse ayrıca `SCHEMA` artırılır ve bir göç adımı eklenir.

## 1.27.0 (yayınlanmadı)

### Eklendi
- Kaçamak öğünü ve kaçamak günü eklendi: Düzen puanı (Routine points) ve Esneme payı (Wiggle room) son 14 günün düzenine göre hesaplanır, hak kazanınca bir öğün ya da gün için ayrılan pay Beslenme ekranından kullanılır.
- Takvimde son 7 güne geç giriş yapılabilir; geç girilen günlerin Düzen puanı 0 sayılır, esneme payı %90 kredilenir. Gün sınırı 04:00'tür.
- 18 yaş altında ve kilo alma hedefinde özellik kapalıdır; Ayarlar'da sağlık notu işaretlenirse de kapanır. Veri biçimi 4'e yükseltildi (göç adımı eklendi).

## 1.26.8 (yayınlanmadı)

### Eklendi
- Besin listesine KFC (Zinger, Tender ve diğerleri), Usta Dönerci, McChicken, Starbucks, Dunkin' ve Simit Sarayı ürünleri eklendi (15 ürün). Değerler web kaynaklarından, bazı gramajlar tahmindir.

## 1.26.7 (yayınlanmadı)

### Eklendi
- Besin listesine Domino's, Papa John's, Pizza Hut, Little Caesars ve Sbarro pizza dilimleri ile Arby's (Beef 'n Cheddar, Classic Roast Beef) ürünleri eklendi (11 ürün). Değerler web kaynaklarından, bazı gramajlar tahmindir.

## 1.26.6 (yayınlanmadı)

### Eklendi
- Besin listesine Popeyes (Tenders, XL Sandviç, Patates, Biscuit) ve Subway (İtalyan B.M.T., Teriyaki Tavuk, Biftek & Peynir, Marinara Soslu Köfte, Hindi Jambon; 15 ve 30 cm) ürünleri eklendi. Gramajlar tahmindir.

## 1.26.5 (yayınlanmadı)

### Düzeltildi
- Site yayını bazen ilk denemede başarısız oluyordu (GitHub yayın paketini hemen bulamıyordu); yayın akışına paketin kaydını bekleyen kısa bir adım eklendi.

## 1.26.4 (yayınlanmadı)

### Eklendi
- Besin listesine McDonald's ürünleri eklendi: Big Mac, Cheeseburger, Hamburger, Quarter Pounder with Cheese, Quarter Pounder Deluxe, Patates Kızartması (4 boy), Chicken McNuggets (4'lü ve 6'lı). Değerler ve gramajlar McDonald's Türkiye sitesindeki 100 g ve porsiyon değerlerinden hesaplandı.

## 1.26.3 (yayınlanmadı)

### Eklendi
- Besin listesine Burger King burgerleri eklendi: Whopper, Chicken Royale, Big King, Cheeseburger, Hamburger (kalori ve makrolar Burger King sitesinden; gramajlar tahmin edildi).

## 1.26.2 (yayınlanmadı)

### Eklendi
- Besin listesine Burger King Big King® Menü eklendi (kalori ve makrolar Burger King sitesinden; menü gramajı 730 g olarak tahmin edildi).

## 1.26.1 (yayınlanmadı)

### Düzeltildi
- Sesli yemek eklemede kategori sözcükleri (meyve, tatlı, börek, pide, kahve, çorba, salata) ve yalın yağ aranınca seçenekler sorulur; çoban salata gibi tam adlar kendi adına gider.
- Beslenme alt sayfalarındaki kapatma (×) düğmesi iPhone'da çalışıyor.

## 1.26.0 (yayınlanmadı)

### Eklendi
- Yemek ekle: + düğmesi artık yemek ekler. iPhone'da tek dokunuşla doğrudan dinler ("iki yumurta, beş zeytin, bir dilim beyaz peynir"); ses cihazda yazıya çevrilir (yeni StarboardSpeech eklentisi, tr-TR, cihaz içi), sunucuya gitmez. Dinleme yoksa (web, Türkçeyi cihazda çevirmeyen iPhone, izin yok) aynı ekran yazı kutusuyla açılır.
- Onay listesi: cümle kendi besin listenle eşleşir; belirsiz sözcükte "Hangisi?" sorar (örn. peynir, ekmek, et, ciğer, balık), gramı düzeltebilir, kalemi silebilir, sofrada eklenen yağı (salata, ekmek) onaylayabilirsin. "Bol yağlı" yalnız eklenebilir. Su cümlede geçerse su takibine yazılır. Eklemeden sonra Geri al var.
- Yeni besinler: Dana biftek (ızgara), Levrek (ızgara), Hamsi tava (kaynaklı kaloriler); "hamsi" tek başına Hamsi tava, "köfte" Izgara köfte, "ekmek" Beyaz ekmek, "süt" tam yağlı süt, "tavuk" Tavuk göğsü.
- Mikrofon ve konuşma tanıma izin metinleri (Türkçe ve İngilizce). Ses kaydedilmez, saklanmaz, gönderilmez.

### Değişti
- Hızlı giriş sayfası kalktı. Su, kilo, uyku, adım ve görev girişleri Bugün ekranındaki satırlarındadır; program yokken "Kilonu gir" küçük bir kilo penceresi açar.

## 1.25.0 (yayınlanmadı)

### Eklendi
- Programın > Bugün ekranına hafta şeridi: haftanın yedi günü, tamamlanan gün yıldız, antrenman günü halter, dinlenme günü kesikli daire.
- Her hareketin altında "Geçen sefer" kaydı; set × tekrar sağda çip; "Antrenmanı başlat" düğmesi sekme çubuğunun üstünde sabit.

## 1.24.1 (yayınlanmadı)

### Değişti
- Beslenme sayfası sadeleşti: başlık altındaki kalori yazısı ve üstteki "Sık yediklerin" kartı kalktı (Sık yediklerin öğün sayfasında duruyor).
- Lif ve mikro besinler (Ayrıntılar) özet kartının alt satırı oldu; "Dünün tamamını kopyala" küçük bağlantıya döndü.

## 1.24.0 (yayınlanmadı)

### Değişti
- Beslenme: dört öğün de aynı mantıkta. Öğün satırı sade (düğüm, ad, yenenler/"boş", kcal, +); öğüne dokununca öğünün alt sayfası ekranın altından açılır (açık öğün CSS ile sabit alt sayfa olur; karartılmış alana dokunmak ya da × kapatır; açılışta hiçbir öğün açık gelmez). Boş öğünün önerisi sayfanın en üstünde tek satır: Ekle · N kcal (tek dokunuş), Başka öneri, İçindekiler (eski ayrıntılı liste). Önceki sürümdeki sıradaki öğün kartı kalktı; sıradaki öğün yalnızca düğümle ve "Sıradaki öğün" yazısıyla ayrılır. Alt sayfa açıkken alt gezinme gizlenir.

## 1.23.0 (yayınlanmadı)

### Değişti
- Beslenme: öğün listesi "gün akışı" oldu. Üstte kalan kalori kartı (kcal kaldı + çubuk); öğünler dikey bir yıldız yolunda (dolu öğün yıldız, sıradaki öğün kesikli halka, boş öğün halka), başlığın altında yenen besinlerin adları. Sıradaki öğün = son dolu öğünden sonraki ilk boş öğün (bugünde); önerisi açılır bölümün dışında görünür: Öneriyi ekle (tek dokunuş) / Kendim seç. Her öğünde + düğmesi besin ekleme panelini açar. Açılır bölüm, Öneriler, Bu öğünü kaydet davranışları aynı. Geçmiş günde sıradaki öğün ve öneri kartı yok.
- Bugün: "protein al" günlük hedefi kalktı (suggestedTitles ve skipTask); kayıtlı eski protein görevleri gizlenir ve puana girmez. Protein Beslenme ekranında izlenir.

## 1.22.0 (yayınlanmadı)

### Değişti
- Bugün: hedef paneli yenilendi. Başlıkta "N hedef kaldı", "biten/toplam" ve biten hedef kadar yanan yıldız dizisi (halka kalktı; seri düğmesi başlıkta kaldı). Bugünün en öncelikli açık hedefi (antrenman, sonra veriyle işaretlenenler) "Sıradaki" kartında; tek düğme: Antrenmana başla, + Bardak, Öğün ekle ya da olduğu yerde Gir. Kalan açık hedefler SONRA altında, biten hedefler tek satırlık Tamamlanan özetinde (açılınca satırlar). Geçmiş günde Sıradaki kartı yok. Sıradaki kartı antrenmansa üstteki kısa yol düğmesi tekrarlanmaz.

## 1.21.0 (yayınlanmadı)

### Değişti
- Yeni hedef "Kilo alma" (GOAL.mass): bakımın üstünde kalori, protein 2,0 g/kg, güç programları öne alınır (haftada en az 3 gün), kilo alma ve kas kazanımı aynı yönde çalışır (isGainGoal). Hedef kilo önerisi BMI 22 (en çok +%10). Süre seçilince açık/fazla = haftalık hız × 1100 kcal (PACE: yağ kaybı 0,25-0,5, kas kazanımı 0,15-0,35, kilo alma 0,25-0,5 kg/hafta).
- Hedefin ekranı: dört hedef 2×2; hedef kilo ve "Kaç haftada?" kaydırıcısı tek Yolculuk kartında; sağlık tiki kalktı, yerine tek uyarı satırı. Panel hep açık (18+); BMI ve büyük kayıp uyarıları panelde yazılır, engellemez; kalori alt sınırı her durumda geçerli.
- Ben: hedefe yolculuk notu planlanan hıza göre önde/geride/planda diyor.

## 1.20.0 (yayınlanmadı)

### Değişti
- Hedefin ekranında "Kaç haftada?" paneli: hedef kilo yazılınca kaydırıcıyla süre seçilir; haftalık hız, günlük kalori ve bitiş tarihi canlı değişir. Seçilen süre günlük kalori hedefini belirler (açık = haftalık hız × 7700 kcal / 7 gün; güvenli alt sınırın altına inmez, profilde paceWeeks). Eski ayrı "Hedef kilo planın" adımı kalktı, örnek öğünler özet ekranına taşındı; panel yalnızca yetişkin, yağ kaybı, makul hedef ve sağlık kutusu işaretliyken açılır.
- Hedefin ekranındaki seçenek çizgileri gerçek 2 px kenarlık oldu (inset gölge yarım piksele denk gelince alt kenar inceliyordu).

## 1.19.0 (yayınlanmadı)

### Değişti
- Ana sayfalar (Bugün, Program, Beslenme, Takvim, Ben) onboarding ile aynı Mercan paletine ve Takımyıldız diline geçti, açık ve koyu temada. Renkler tokens.css'te: zemin, kart, yazı, tek vurgu (açık: mor, koyu: mercan), dolgu rengi ve dokunulan kutuların kenarı.
- Dört ay göstergesi (kalori, protein, karbonhidrat, yağ) Beslenme'den Bugün ekranının en üstüne taşındı; ay mekaniği aynı (kraterler, aşım ünlemi), yalnızca renkler yeni palete geçti ve dolu kısım biraz parlıyor. Beslenme'nin başlığı günün kalorisini tek satırda söylüyor.
- Takımyıldız şeridi: şekil solda, adı yanında, gün düğmeleri 44 pt.
- Takvim: işaretler 12 pt, hücrede en çok iki işaret, renk basamağı tek tonlu, veri olmayan gün kesik çizgili, açıklamalar tek satır ve "Simgeler" düğmesinin altında.
- Ben: yağ oranı ve BMI etiketi sayının altında; su göstergesinde emoji yerine çizgi damla.
- Bütün yazılar en az 13 px.

## 1.18.0 (yayınlanmadı)

1.17.0'dan bu yana biriken tüm değişiklikler (PR #2 - #30) bu sürümde toplandı; 1.17.0 etiketi bu birikimden önceki durumu korur.

### Değişti
- İlk giriş (onboarding) baştan yenilendi: karşılama sahnesi (halkalı gezegen, yıldızlar, nebula, ışık hızı geçişi), "Seni tanıyalım" ve "Ölçülerin" ekranları, takımyıldız ilerleme, Mercan paleti (açık ve koyu), 44 pt dokunma alanları, cetvelde − / +, doğum tarihi girişi (Ay etiketi, otomatik geçiş, yalnız gerçek tarihler).
- Bildirim izni artık "Hatırlatmaları aç"a dokunulunca soruluyor; reddedilirse nedeni aynı ekranda yazıyor.
- Hedefin ekranı: görünür onay kutuları, hedefe göre güncellenen hedef kilo önerisi, dar ekranda alt alta hedefler.
- Avatarlar kasklı astronot hayvanlar; seçimde hayvana özel tepki ve süzülme.
- Beslenme ekranı sadeleşti, öğünler açılır-kapanır (kapalı başlar); Bugün ekranındaki "aldığın" bölümü yenilendi (kalori üstte, makro sütunları, sakin aşım göstergesi).
- Dağınık renkler `tokens.css` değişkenlerine bağlandı; marka kimliği dosyası eklendi (`docs/MARKA_KIMLIGI.md`).

### Düzeltildi
- Giriş doğrulaması ve içe aktarma güvenliği (Paket 1a).
- Çiğ yenmeyen besinler öneri ve aramalardan gizlendi; yaklaşık 70 besinin kategorisi düzeltildi.

Veri şeması aynı kalır (`SCHEMA` 3). Doğum tarihi eklendi; yaş alanı geri dönüş için güncel tutulur, bu yüzden 1.17.0'a dönmek veriyi bozmaz.

## 1.17.0 (yayınlanmadı)

### Değişti
- Takımyıldız haftalara bölünmüyor: ana ekranda devam eden takımyıldız ve son 7 gün görünüyor, şekle dokununca tam şema açılıyor. Bugün başlığındaki haftalık sayaç takımyıldız ilerlemesi oldu.
- Kilo ölçümü haftalık oldu: son tartıdan 7 gün dolmadan tartı hedefi ve hatırlatması yok; eski günlük kayıtlar korunuyor, eski başlıklar tanınıyor.
- Uyku girişi kolaylaştırıldı: yatış ve kalkış saati tek ekranda, süre otomatik, son girilen değer tek dokunuşla. Kayıt biçimi (`sleep`, `bed`, `wake`) aynı.
- Program: antrenman adları sadeleşti (İtiş, Çekiş, Bacak günü; Üst, Alt, Tüm vücut).

### Eklendi
- Dokuz gerçek takımyıldız (Büyük Ayı, Kassiopeia, Kuğu, Kartal, Orion, İkizler, Aslan, Akrep, Kanatlı At); yeni seri başlangıç ayının akşam gökyüzündekilerinden seçiliyor. TR ve EN adlar.

### Düzeltildi
- Gün düğmelerine dokunma hatası: basılı düğme kayıyor ve dokunma düğmenin dışında bitiyordu.

Veri şeması aynı kalır (`SCHEMA` 3).
## 1.16.0 (yayınlanmadı)

### Değişti
- Bugün ekranındaki Ayarla düğmesi kaldırıldı; beslenme tercihleri Ayarlar bölümüne taşındı.
- Mutfak seçimi kayıtlı tercih yoksa telefonun diline göre belirleniyor; Ayarlar'dan elle de değiştirilebiliyor.
- Alışveriş listem sadeleşti: yalnızca Listem ve Öneriler bölümleri, geçmiş kullanımdaki sık besinler ve elle eklenen ürünler korunuyor.
- Öğün önerileri gözden geçirilmiş 105 besinlik havuzla sınırlandırıldı; yeni veritabanı kayıtları ile alkol, sos, baharat ve tatlılar otomatik önerilmiyor.
- Besin ekleme panelindeki kategori rozetleri ve kategori sonuçları kaldırıldı; yalnızca arama alanı, sık yedikler, kayıtlı öğün, barkod ve kendi yiyecekleri kaldı. Kullanıcı verisi silinmedi.
- Program ekranında "Nasıl yapılır" rehberi ayrı sekmeye taşındı; antrenman modunda açılır rehber olarak sunuluyor.

### Eklendi
- Besin veritabanına Rakı eklendi; toplam 1325 kayıt, 35 alkol içeren kayıt.
- Kendi besinlerin besin aramasında kullanım sıklığına göre daha önce çıkıyor.

### Düzeltildi
- İçecek porsiyonları içecek türüne göre düzeltildi: sert içki ve likör 1 kadeh 50 g, şarap 1 kadeh 150 g, bira 1 şişe 330 g, kokteyl 1 bardak 150 g, alkolsüz içecek 1 bardak 200 g. Türkçe ve İngilizce porsiyon adları doğru kullanılıyor.
- Web kaynaklı dokuz çorbanın makro, porsiyon ve kaynak değerleri çapraz kaynaklarla doğrulandı; kereviz kaydındaki yanlış alkol değeri kaldırıldı.
- İçeceklerin listede görünen simgeleri düzeltildi; bitki çayları, rom, konyak ve meyveli turvalar yanlış besin simgeleriyle görünmüyor.

Veri şeması aynı kalır (`SCHEMA` 3).

## 1.15.0 (yayınlanmadı)

### Eklendi
- Besin veritabanı 1324 yeni kayıtla genişletildi: 382 USDA, 942 web kaynağı; alkol içeren besinlerde 7 kcal/g ortak formülle hesaplanır.
- "Neler yeni" penceresi uygulama güncellendikten sonra bir kez gösteriliyor; başlangıçtaki uyarı (haftalık yenileme mesajı gibi) artık sırayı engellemiyor.
- Sürüm numarası her ekranın sağ alt köşesinde küçük ve soluk yazıyor (Ayarlar'ın altındaki yazının aynı değeri); alt menü ve düğmelerle çakışmıyor, dokunmaları engellemiyor, ekran okuyucu okumuyor.

### Düzeltildi
- Onboarding'de cetvel animasyonu sürerken pencere kapanırsa oluşan `TypeError` giderildi; animasyonun bitişi artık değeri yalnızca kurulum verisi varken yazıyor.
- Açılır pencereler (sheet ve dialog) Escape tuşuyla da kapanıyor; kapanma animasyonu ve odak davranışı Kapat düğmesiyle aynı, üst üste pencerelerde yalnızca en üstteki kapanıyor.

Veri şeması aynı kalır (`SCHEMA` 3).

## 1.14.0 (yayınlanmadı)

### Değişti
- Uygulamanın bütün yazı tipi Saira oldu (başlık, rakam ve gövde aynı aile): Barlow Condensed ve Nunito kaldırıldı. Saira değişken yazı tipidir (400–800, SIL OFL), `fonts/saira-latin.woff2` ve `fonts/saira-latin-ext.woff2` olarak gömülür (`css/tokens.css` `@font-face`, `--font`, `--font-d` = `--font`; `index.html` preload; `sw.js` `SHELL`). Saira daha geniş olduğundan büyük başlık ve rakam boyutları küçüldü (h1 36→30, h2 21→18, Bugün ve onboarding rakamları, düğmeler, segment düğmeleri), alt menü etiketleri büyük harften normal yazıya geçti (320 px'te "Nutrition" ile "Calendar" çakışıyordu); sınıfsız düğmelere en az 44 px yükseklik verildi. Rakamlar `tabular-nums` ile eşit genişlikte kalır; ğ, ş, ı, İ doğru çıkar.
- Beslenme özeti dört halka yerine dört ay evresi oldu (kalori, protein, karbonhidrat, yağ). Ay, makro renginde dolu bir daire; üstünde aynı yarıçapta, zemin renginde (`-soft` jeton) bir gölge dairesi ayın içine kırpılır ve oran × çap kadar sola kayar: oran 0'da ay karanlık, 1'de dolunay; arkada oranla koyulaşan hafif bir ışık halesi. Altında ad, büyük rakamla kalan miktar ("kcal kaldı" / "g kaldı") ve küçük yazıyla tüketilen / hedef ("86 / 131 g"). Hedef aşılınca ay `--over` renginde dolunay olur ve "+fazlalık" yazar. Ekrana girişte gölge kayarak açılır (`.fx-moon`, `countUp` ile); sayfa içinde eski yerinden yenisine geçer; hareket azaltmada anında son halinde durur. Ekran okuyucu etiketleri aynı kaldı.

### Eklendi
- `--over-soft` renk jetonu (aşan ayın gölgesi; üç tema bloğunda).

### Kaldırıldı
- Nunito ve Barlow Condensed yazı tipi dosyaları ile lisansları. Eski halka kodu (`macroRing`, `ringInfo`) ve stilleri (`.mring`, `.mr-*`); yerlerine `macroMoon`, `moonInfo`, `moonShift` ve `.moon`, `.mn-*` geldi. Bugün halkasının `.fx-ring` altyapısı yerinde.

Veri şeması aynı kalır (`SCHEMA` 3).

## 1.13.0 (yayınlanmadı)

### Değişti
- Beslenme özeti dört halka oldu (kalori, protein, karbonhidrat, yağ; renkleri `--kcal`, `--protein`, `--carb`, `--fat`). Ortada kalan miktar büyük yazılır, altında "kcal kaldı" / "g kaldı", ad ve küçük yazıyla tüketilen / hedef ("1340 / 2200 kcal"). Hedef aşılınca (hedefin bir üstünden başlar; eşitlikte "0 kaldı") halka dolu ve `--over` renginde olur, ortada "+120" gibi fazlalık yazar. Eski çubuklar ve "Hedefi X kcal aştın" satırı kalktı; lif çubuğu "Ayrıntılar" içinde kaldı. Halkalar 1.12.0 hareket altyapısını kullanır (`.fx-ring`, `countUp`); hareket azaltma ayarında anında son değerde durur.
- "Sık yediklerin" açılır kapanır (`fold("favs")`), varsayılan kapalı, dokununca açılır; "dünü kopyala" düğmesi dışarıda kalır.
- Bugün ekranının en üstündeki hafta şeridi artık bu haftanın (Pzt-Paz) takımyıldızı: ~64 px yüksekliğinde küçültülmüş gerçek şekil, altında gün harfleri, bugün belirgin. Şeridin her yerine dokunmak hafta penceresini açar: büyük şekil (yıldıza dokununca günün hedefleri ve "O güne git"), günlük seri, "N yıldız daha, … belirecek" satırı ve Gökyüzü atlası. Eski günlere takvimden ya da penceredeki yıldızlardan gidilir; şeritte gün seçilmez.

### Eklendi
- Gün tamamlanınca şeritteki bugünün yıldızı kısa bir an yansır ve tek `haptic("success")` olur (hedefin ya da kutlamanın titreşimi aynı anda ikinci kez eklenmez); oturumun ilk çiziminde ve yeniden çizimde olmaz; hareket azaltmada yansıma görünmez.
- Erişilebilirlik aracına yeni ekranlar: sık yedikler kapalı/açık, hedef aşıldı (halkalar), hafta penceresi.

### Kaldırıldı
- Bugün ekranındaki büyük takımyıldız kartı ve Ben › Grafikler'deki Gökyüzü atlası (ikisi de hafta penceresinde). Kullanılmayan çeviri anahtarları ve hafta şeridinin eski gün düğmeleri/stilleri temizlendi.

Veri şeması aynı kalır (`SCHEMA` 3).

## 1.12.0 (yayınlanmadı)

### Değişti
- Yeni tasarım dili, "performans paneli": koyu tema ana tasarım (derin lacivert zemin `#060A19`, kartlar `#0E1430`, neon vurgu `#FF4D94`); açık tema aynı dilde (`#F3F4F9` zemin, lacivert yazı `#0D1230`). Turuncu-pembe kimlik daha doygun (`--grad` `#FF6A13` → `#FF2D72`). Tema seçimi ve varsayılanı değişmedi.
- Başlıklar ve büyük rakamlar Barlow Condensed (600–800, SIL OFL), uygulamaya gömülü (`fonts/barlow-condensed-*.woff2`, latin + latin-ext, `sw.js` önbelleğinde); gövde Nunito. Rakamlar eşit genişlikte (tabular-nums).
- Bugün halkası, sekme çubuğu, segment düğmeleri, kartlar ve düğmeler yeni dile uyarlandı. Beslenme çubukları yeni makro renklerini aldı (biçim aynı); hedefin %10'undan fazla aşılan çubuk `--over` renginde.
- Sekmeler arası geçiş daha belirgin bir yatay kayma (yalnızca transform ve opacity, bulanıklık yok).

### Eklendi
- Makro renk jetonları: `--kcal`, `--protein`, `--fat`, `--carb` (her birinin `-soft` zemini) ve aşım rengi `--over`.
- Hareket altyapısı: `countAt()` (saf) ve `countUp(el, from, to)`; `data-count` taşıyan rakamlar sayfaya girilirken sıfırdan sayılır. Çubuklar (`.mbar`, `.task-bar`, `.bt-bar`) açılışta sıfırdan dolar (yalnızca transform); halka dolumu için `.fx-ring` (`--fx-len` çevre), gecikme `--fx-delay`; Bugün halkası sayfaya girerken bununla dolar. Hedef tamamlanınca halkada kısa parlama ve `haptic("success")`. Hepsi `prefers-reduced-motion`'da kapalı.

### Düzeltildi
- Öneri tabağı eklenince toast'taki kalori, günün toplamıyla aynı yuvarlamayla hesaplanır (bazı günlerde 1 kcal farklı yazıyordu).

## 1.11.0 (yayınlanmadı)

### Eklendi
- Haftanın takımyıldızının gerçek şekli var: 14 takımyıldızın her biri adına benzeyen elle çizilmiş 7 yıldızlık bir şekil (`CONSTELLATIONS`, yeni dosya `js/sky.js`). Pazartesi ilk, pazar son yıldız. Çizgi yalnızca iki ucu da yanınca parlar; şekil baştan soluk görünür.
- Hedef baştan belli: haftanın takımyıldızı haftanın ilk açılışında seçilir ve kayda yazılır (`state.sky`). Önce hiç kazanılmamışlar, hepsi kazanıldıysa en az kazanılanlar; mümkünse geçen haftanınki tekrar etmez. Kart başlığı "Bu hafta: Lale".
- Yıldız günün puanına göre parlar: boş gün sönük nokta, yarım gün orantılı soluk, tam (ya da damgalı) gün tam parlak. Takımyıldız yine 5 tam günle belirir.
- Yıldıza dokununca o günün hedefleri tamam/eksik listelenir; "O güne git" günü Bugün ekranında açar. Her yıldız ekran okuyucuya "Çarşamba: yüzde 60" diye okunur.
- Gökyüzü atlası (Ben › Grafikler): 14 takımyıldız, kazanılanlar parlak ve kaç kez kazanıldığıyla, kazanılmayanlar soluk siluet; başlıkta "N / 14". Dokununca büyük hali ve kazanıldığı haftalar.
- Hafta kapanışı: hafta bittikten sonraki ilk açılışta bir kez geçen haftanın takımyıldızı kendini çizer; altında yıldız sayısı, en iyi gün ve antrenman sayısı. Neler yeni penceresinden sonra gelir; azaltılmış harekette animasyonsuz.
- Bugün kartında tek satır: "2 yıldız daha, Lale belirecek" ya da "Lale belirdi"; kalan günler yetmiyorsa satır yok.

### Değişti
- Takvimdeki "Gökyüzün · son 6 hafta" kalktı, yerini Grafikler'deki atlas aldı. Karttaki "Haftada beş yıldız…" notu kalktı.
- Veri sürümü 3: göç geçmiş haftaları eski formülün adıyla kayda yazar (adları değişmez); bu hafta beşi tamamlamışsa onun adı da korunur. Hafta kapanışı göçten sonraki haftadan başlar. Günlük seri değişmedi.
- İngilizcede "Kayık" Boat, "Fener" Lighthouse oldu (şekillerle uyumlu).

## 1.10.0 (yayınlanmadı)

### Değişti
- Beslenme ekranı sadeleşti (web ve iPhone). Sekmeler **Bugün · Tarifler · Liste**: "Günlüğüm" ve "Öneriler" tek ekran oldu (dört sekme üç oldu; iç ad `mealTab = "log"` aynı kaldı, Bugün ekranındaki kısa yol bozulmaz). Yeni ekran açık bölüm sayısı 14'ten 6'ya indi (eski iki sekmede toplam 14 açık bölüm, şimdi dolu bir günde 6 açık bölüm ve 3 katlı başlık).
- Her öğün kartında, öğün boşken o günün önerisi soluk, kesik çerçeveli bir tabak olarak durur: besin adları ve miktarlar, toplam kcal, **Ekle** (bütün tabağı tek dokunuşla günlüğe yazar; toast'ta Geri al) ve **Başka** (günün planını bir sonrakine geçirir). Kaydı olan öğünde, besin ekle paneli açıkken ve geçmiş günde öneri çıkmaz. Plan kullanıcının sabit öğünlerini de içerir; satırdaki tarif bağlantısı Tarifler'e götürür, `×` besini önerilerden çıkarır. Öneri üretimi (`PLATES`, `PORTION`, `buildMeals`) değişmedi; alışveriş listesi aynı gün sırasını (`planDay() + mealVariant`) kullanmaya devam eder.
- Özet dört çubukla başlar (kalori, protein, karbonhidrat, yağ). Lif ve mikro besinler tek katlanır "Ayrıntılar" bölümünde. Eski "Hedefe X kcal kaldı" satırı kalktı (başlıkta zaten "X / Y kcal" yazıyor); hedeften sapan öneri varsa tek satırlık uyarı çıkar.
- "Öğünlerim" ve "Kayıtlı öğünler" günlüğün altında katlanır, varsayılan kapalı.
- "Önerileri kendine göre ayarla" sayfada durmaz: tek bir **Ayarla** düğmesi mutfak, beslenme türü, "sık yediğim besinlerle kur" ve çıkarılanlar listesini bir pencerede açar; değişiklikler hemen kaydedilir ve arkadaki öneriler yenilenir.
- Azaltılan metinler: seçili beslenme türü açıklaması, "yağlı besinler kendi yağını getirdiği için…" ve "Miktarlar çiğ ağırlıktır." gibi uzun açıklamalar, "tarifi gör" ve "senin girdiğin" alt yazıları kalktı; kullanılmayan sözlük anahtarları temizlendi.

### Kaldırıldı
- Öneriler sekmesindeki "Kendi yiyeceğini ekle" (öğüne sabit besin yazma) arayüzü kalktı; daha önce sabitlenmiş besinler öneriye girmeye ve tabaktaki `×` ile kaldırılmaya devam eder. Gerekirse yeniden eklenebilir.

### Düzeltildi
- Beslenme'deki "Mikro besinler" başlığı açılıp kapanmıyordu (katlanır bölümler bu ekranda bağlanmamıştı); artık bağlanıyor.
- Geçmiş gün şeridindeki düğmeler (önceki gün, sonraki gün, bugüne dön) en az 44 px yüksekliğinde.

- Program sekmesinin alt sekmeleri "Bugün · Program" oldu ("Kaydım · Program · Nasıl yapılır" yerine). Hareket rehberi (`howtoView`) Program sekmesinin altında açılır bir bölümdür ("Nasıl yapılır": arama ve liste); hareketin yanındaki "nasıl" bağlantısı ve antrenman modundaki bağlantı oraya yönlenir (`goHow()`, eski `planTab = "howto"` kalktı).
- Program › Bugün (eski Kaydım) tek bölüme indi: antrenman adı, ilerleme sayısı, salt okunur hareket listesi (set × tekrar, "nasıl" bağlantısı) ve büyük "Antrenmanı başlat" / "Antrenman moduna dön" düğmesi. "Hareketleri tek tek gir" bölümü kalktı; set girişi yalnızca antrenman modunda.
- Dinlenme günü tek kart: "Bugün dinlenme · Sıradaki: <gün>, <antrenman>" ve küçük "Serbest antrenman ekle" bağlantısı; serbest antrenman kartı bu bağlantıyla açılır (kayıtlı serbest antrenman kendiliğinden görünür). Program kapalıyken de tek kart.
- Kişisel rekor panosu Ben › Grafikler'e taşındı; yeni rekor kutlaması aynı kaldı.

### Eklendi
- Bugün ekranında saate ve güne göre tek kısa yol düğmesi (`shortcutPick()`, saf ve testli): öğün ekle (Beslenme › Günlüğüm'de o öğünün besin panelini açar; öğün adları ve sırası kullanıcının öğün listesinden gelir, 05:00-22:00 öğün sayısına göre eşit dilimlenir) ya da antrenmanı başlat (antrenman modunu açar). Yapılan iş atlanır, iş kalmadıysa düğme çıkmaz; geçmiş günde çıkmaz.
- Antrenman modunda ek ağırlıklı tekrar hareketleri (barfiks, dips) için "Ek ağırlık" alanı; ek ağırlık setlerden önce de saklanır.
- Antrenman modunda onaylanmış bir setin kilosu, tekrarı ya da süresi değişince hemen kaydedilir (✓'e iki kez basmak gerekmez).
- "Neler yeni" maddesi (web).

### Düzeltildi
- Antrenman modundaki sayı kutuları ve geçmiş gün şeridindeki düğmeler 44 px dokunma alanına ulaştı; erişilebilirlik aracı (`tools/a11y-audit.html`) yeni ekranlara göre güncellendi (Bugün/Program/dinlenme/program kapalı/geçmiş gün, kısa yol, antrenman modu hareket türleri).
- İngilizcede "Ek {0}" metni "Extra {0}" oldu.

### Temizlendi
- Kullanılmayan çeviri anahtarları (Kaydım, Hareketleri tek tek gir, Sıradaki antrenman vb.) ve eski giriş bölümünün kodu (`liftsSection`, `liftBody`, `wireLifts`, `nextSessionCard`) kaldırıldı.

Veri şeması aynı kalır (`SCHEMA` 2).

## 1.9.1 (13 Kasım 2026)

### Değişti
- Besin ekleme kolaylaştı (web ve iPhone; ayrıntı ve dokunuş sayıları: [docs/BESIN-EKLEME.md](docs/BESIN-EKLEME.md)). Besin ekle paneli açılınca en üstte "Sık yediklerin" (o öğünde en çok yenenler, son yenen miktarla) durur; dokunuşla o öğüne eklenir: daha önce yenen bir besin 5 yerine 2 dokunuş.
- Arama sonuçlarındaki `+` gerçek bir düğme oldu: satırda yazan miktar ve kaloriyle (son yenen miktar, yoksa 1 porsiyon / 1 adet) tek dokunuşla ekler. Satıra dokunmak miktar kartını açar; satırlar klavye ve ekran okuyucuyla kullanılabilir.
- Eklemeler (sık yedikler, `+`, Ekle, kayıtlı öğün, dünkü öğün ve dünün tamamını kopyalama) toast'ta **Geri al** taşır; geri alma günün kalorisini ve diğer kalemleri korur. Ekleme bildirimi ekran okuyucuya okunur.
- Miktar kartı 100 g yerine 1 porsiyonla (ya da son yenen miktarla) açılır; kalori canlı yazılır, − / + düğmeleri ve seçili hazır düğme vardır.
- Kayıtlı öğün eklenince panel kapanmaz; arama temizlenir, kategori listesi açık kalır. Geçmiş yoksa panel açılınca arama alanı odaklanır.
- Arama küçük yazım hatalarına toleranslı: sonuç bulunamazsa eksik, fazla, yanlış ya da yer değişmiş bir harf kabul edilir ("peynr", "yogrt", "elam"). Doğru yazılan aramanın sırası değişmez.
- Sık yedikler düğmeleri en az 44 px yüksekliğinde; miktar kartındaki −/+ 44×44 px.
- Besin veritabanına ve öneri/plan mantığına dokunulmadı; veri şeması aynı (`SCHEMA` 2).
- Öğün önerileri yeniden yazıldı (`nutrition.js`): her öğün bir tabak kalıbından kurulur (`PLATES`; kahvaltı: peynir/yumurta + ekmek + zeytin ya da yulaf + yoğurt + meyve + kuruyemiş; ara öğün: yoğurt + meyve, peynir + ekmek…; ana öğün: et/balık/baklagil + pilav/patates + zeytinyağı + yoğurt). Besin yığını, kahvaltıda 3 muz, öğünde 500 g patates ya da 7 dilim ekmek gibi miktarlar kalktı.
- Her önerilebilir besinin bir öğündeki en az ve en çok miktarı var (`PORTION`): yumurta en çok 3 adet, peynir 80 g, meyve en çok bir buçuk porsiyon (öğünde en çok iki porsiyon), kuruyemiş 30 g, zeytinyağı 20 g. Büyük öğünde ana besinlerin sınırı en çok %20 esner, ana öğünün yanına en çok iki-üç dilim ekmek gelir.
- Miktarlar bütün gün için birlikte çözülür: kalori ve protein hedefine, öğün paylarına ve her besinin olağan porsiyonuna en yakın gramajlar; adetle sayılanlar (yumurta, ekmek dilimi, meyve) tam ya da yarım adete yuvarlanır.
- Öneri her gün kendiliğinden değişir (takvim günü + "Başka kombinasyon"); ardışık günlerde ana yemek ve aynı öğün tekrar etmez, aynı besin gün içinde iki öğünde çıkmaz. Alışveriş listesi aynı gün sırasını kullanır.
- Protein hedefi yüksekken (yağ kaybı) yağsız peynir ve süzme yoğurt öne geçer, proteini az ara öğünler ve baklagil yemeği çıkar (bitkisel beslenmede baklagil kalır). Bitkisel süt ve yoğurt yalnızca vegan ve laktozsuz beslenmede, pirinç patlağı yalnızca glutensizde önerilir.

### Düzeltildi
- Çiğ et değerleri pişmiş ete göre yazılmıştı (veritabanı ve plan çiğ ağırlık kullanıyor): tavuk göğsü 31 → 22,5 g protein, hindi göğsü 29 → 24, tavuk but 24 → 20, yağsız dana kıyma 26 → 20, dana biftek 27 → 21, kuzu 25 → 18 (100 g çiğde). Geçmiş günlük kalemleri kendi değerlerini taşıdığı için değişmez.

### Bilinen
- Tek öğün 1400 kcal'yi aşınca (örneğin 3100 kcal ve 3 öğün) makul porsiyonlarla hedefe ulaşılamıyor, plan %15-25 düşük kalabiliyor; ekrandaki mevcut uyarı çıkar. Vegan ve vejetaryen yağ kaybı hedeflerinde protein %50-75'te kalabiliyor. Ayrıntı: `docs/OGUN-DENETIMI.md`.

## 1.9.0 (13 Kasım 2026)

### Eklendi
- Barkod okuma (yalnızca iPhone uygulaması): Beslenme › Günlüğüm › Besin ekle › Barkod okut. Kamera paketli ürünün barkodunu okur, besin değerleri Open Food Facts'ten gelir (ODbL), önizlemede düzenlenir ve "kendi besinlerin" arasına `bc_<barkod>` anahtarıyla kaydedilir; ardından miktar kartı açılır. Aynı barkod bir daha okutulunca ürün cihazdan bulunur. Barkod numarasıyla ve marka adıyla arama da çalışır.
- Dışarıya yalnızca barkod numarası gider; ilk kullanımda bir kez bilgi penceresi çıkar. Bulunamayan, değerleri eksik ya da bağlantısı olmayan ürünlerde elle giriş, kamera izni yoksa elle barkod numarası girişi vardır.
- Değer denetimi: kJ → kcal, porsiyon başına → 100 g, 100 ml ≈ 100 g, saçma değerler (negatif, 100 g'dan büyük, toplam 105'i aşan) reddedilir, etiket kalorisiyle hesap %20'den fazla ayrışırsa uyarı.
- "Kendi besinin" formuna lif alanı ve canlı kalori gösterimi.
- Ayarlar › Hakkında: kaynaklara Open Food Facts; iPhone'da gizlilik metinlerine barkod istisnası. `privacy.html` (Türkçe ve İngilizce): "Barkod okuma" bölümü ve üçüncü taraf listesi.
- iOS: `@capacitor/barcode-scanner` 3.1.3 (Swift Package Manager; Apple Vision), gizlilik bildirimine "Arama Geçmişi" (kimlikle ilişkilendirilmez, izleme yok, uygulama işlevi). Derleme hattı eklentiyi ve beyanları denetler.
- "Neler yeni" maddesi yalnızca iPhone uygulamasında gösterilir (`native: true`).
- Apple Sağlık bağlantısı (yalnızca iPhone uygulaması): Ben › Ayarlar › Apple Sağlık. Adım (günlük toplam), uyku (toplam uyku süresi, yatış ve kalkış; kalkılan güne yazılır, 3 saatten kısa oturumlar sayılmaz, birden çok kaynakta Apple Watch önce) ve kilo (günün ilk ölçümü) yalnızca okunur; Sağlık'a hiçbir şey yazılmaz. Türler tek tek seçilir.
- Eşitleme açılışta, uygulama öne gelince (en fazla dakikada bir) ve "Şimdi eşitle" ile; ilk bağlantıda 14 gün geriye, sonra son eşitlemeden bu yana. Elle girilen ya da silinen değer her zaman korunur (`state.days[k].hk` Sağlık'tan yazılan son değeri tutar). Veri gelmezse izin için yol gösteren yardım metni.
- Bugün satırlarında Sağlık'tan gelen değerin yanında "· Sağlık'tan"; uyku kadranının ortası kayıttaki toplam uyku süresini gösterir (Sağlık'tan gelen süre yatış-kalkış aralığından kısa olabilir).
- Gizlilik: `privacy.html` (Türkçe ve İngilizce) "Apple Sağlık" bölümü; iPhone'da Hakkında › Gizlilik'e bir cümle. Sağlık verisi cihazdan çıkmadığı için `PrivacyInfo.xcprivacy` değişmedi.
- iOS: `@capgo/capacitor-health` 8.12.3 (tam sürüm, Swift Package Manager), `App.entitlements`'a HealthKit (klinik kayıt yok), projede HealthKit yeteneği. Derleme hattı yetkiyi, yeteneği ve eklentiyi denetler.
- Kendi yiyeceklerini düzenleme ve silme (web ve iPhone): Beslenme › Günlüğüm › Besin ekle › Kendi yiyeceklerim. Liste ad, varsa marka ve 100 g'daki kaloriyi gösterir; barkodlu ürünlerde küçük bir barkod işareti vardır. Düzenleme mevcut "Kendi besinin" formunu alanlar dolu açar (barkod, marka, porsiyon ve kaynak değişmez); silme onay ister. Düzenleme ve silme geçmiş günleri değiştirmez: günlük kalemleri eklendikleri andaki değerleri kendi içinde taşır. Silinen yiyecek sık yediklerden, sabit öğünlerden, öneri dışlamalarından ve alışveriş işaretlerinden de kalkar.
- "Neler yeni" penceresinde aynı sürümün web ve iPhone maddeleri tek başlık altında birleşir.

- iOS: yalnızca iPhone (iPad hedefi kaldırıldı). Apple Sağlık'a yazma izin metni "Starboard Apple Sağlık'a veri yazmaz" oldu.

### Düzeltildi
- Besin ekleme panelindeki arama kutusunun ekran okuyucu etiketi yoktu.
- İngilizcede üç kardiyo önerisi Türkçe görünüyordu (sözlük yanlış bloktaydı).

Veri şeması aynı kalır (`SCHEMA` 2): yeni alanlar (`bc`, `br`, `src`, `por`, `state.bcOk`, `profile.health`, `days[k].hk`) isteğe bağlıdır.

## 1.8.1 (12 Kasım 2026)

### Değişti
- Nunito yazı tipi Google Fonts'tan değil uygulamanın içinden yüklenir (`fonts/`, SIL OFL): dışarıya istek gitmez, internetsiz de aynı görünür. Gizlilik metinleri (Hakkında ve `privacy.html`) buna göre güncellendi.
- Çevrimdışı önbellek yazı tipi dosyalarını da içerir; Google Fonts'a özel önbellek kuralı kaldırıldı.

## 1.8.0 (12 Kasım 2026)

### Eklendi
- Alışveriş listesi (Beslenme › Liste): öneri planından 1, 3 ya da 7 günlük (her gün farklı bir plan) ve tarif kartlarında "Alışveriş listesine ekle" dediğin tariflerden. Aynı besin tek satırda toplanır, reyonlara göre gruplanır, işaretlenir, paylaşılır.
- Dinlenme sayacı: antrenman modunda set onaylanınca geri sayım (varsayılan 90 sn); ± 15 sn ile ayarlanır ve hatırlanır, bitince ses ve titreşim.
- Ayarlar › Hakkında: sağlık uyarısı, hesapların kaynakları ve gizlilik. Tam gizlilik politikası: `privacy.html` (Türkçe ve İngilizce). İlk girişin özetinde kısa sağlık uyarısı.
- "Neler yeni" penceresi: güncellemeden sonraki ilk açılışta, görülmemiş sürümlerin kısa maddeleri bir kez.

- iOS: yalnızca iPhone (iPad hedefi kaldırıldı). Apple Sağlık'a yazma izin metni "Starboard Apple Sağlık'a veri yazmaz" oldu.

### Düzeltildi
- Antrenman özetindeki "… hareket kaydettin" cümlesi İngilizcede Türkçe kalıyordu.

## 1.7.0 (12 Kasım 2026)

### Eklendi
- Kayıtlı öğünler: en az iki kalemli bir öğünün altındaki "Bu öğünü kaydet" ile adıyla saklanır; "Besin ekle" açılınca en üstte çıkar ve tek dokunuşla bütün kalemleriyle eklenir. Beslenme › Günlüğüm'ün altında listelenir ve silinir.
- Haftalık beslenme özeti (Ben › Grafikler): son 7 günde günlük girilen günlerin ortalama kalori, protein, karbonhidrat, yağ ve lifi; protein ve lif hedefinin tuttuğu gün sayısı; en sık eklenen 5 besin.

## 1.6.0 (12 Kasım 2026)

### Eklendi
- Mutfak seçimi: Türk ya da uluslararası (İngilizcede "Global"). Beslenme › Öneriler'de ve ilk girişte seçilir; varsayılanı dilden gelir. Öneriler, hazır menüler ve tarif listesi seçilen mutfaktan gelir; aramada her şey bulunur.
- 42 uluslararası besin (bagel, tortilla, esmer pirinç, Yunan yoğurdu, hindi kıyma, morina, tilapia, çizburger, burrito, suşi, chili…), 17 tarif (gece yulafı, stir-fry, bolonez, burrito kasesi, taco, nohut körisi, dal…) ve 3 hazır menü. Değerler USDA FoodData Central'dan.
- Domuz eti ürünleri (bacon, jambon, pirzola, bonfile): yalnızca uluslararası mutfakta önerilir; "Yemediklerin" listesinde "Domuz eti" seçeneği.
- Helal ve koşer beslenme (İngilizce kullananlara gösterilir). Helal: domuz eti yok. Koşer: domuz eti ve kabuklu deniz ürünü yok, aynı öğünde et ile süt ürünü önerilmez.

### Değişti
- Türk mutfağına özgü 95 besin, 28 tarif ve 14 hazır menü etiketlendi; uluslararası mutfakta önerilmezler.
- Uluslararası mutfakta az bilinen besinler (barbunya, amarant, börülce…) öneride geri planda.
- Tarif aramasında kategori kelimeleri İngilizcede de çalışıyor ("fish", "chicken"…).

## 1.5.2 (12 Kasım 2026)

Erişilebilirlik ve küçük ekran denetimi. 320, 375 ve 414 px genişlikte hiçbir ekranda yatay taşma yok.

### Değişti
- Kontrast: açık temada marka yazı rengi ve iyi / uyarı / kötü renkleri biraz koyulaştı; koyu temada takvimin sarısı koyulaştı. Hepsi en az 4,5:1 (WCAG AA).
- Küçük düğmelerin (sil, kapat, takvim okları, rozetler, su bardakları, renk seçici, bağlantılar) dokunma alanı en az 44 px yüksekliğe çıktı; görünüm aynı.
- 10–10,5 px yazılar 11 px oldu: alt menü, takvim gün başlıkları, etiketler, antrenman ekranı.
- Etiketsiz 7 giriş alanına ekran okuyucu etiketi eklendi.
- Kısa bildirimler sabit bir canlı bölgeden okunuyor; VoiceOver hepsini duyurur.
- Klavyeyle gezinirken her öğede aynı belirgin odak çerçevesi.

### Eklendi
- `tools/a11y-audit.html`: ekranları dar çerçevelerde açıp taşma, etiket, dokunma alanı, yazı boyu ve kontrast sorunlarını listeleyen denetim aracı.

## 1.5.1 (12 Kasım 2026)

Kullanıcının göreceği bir değişiklik yok; Faz 1 tamamlandı.

### Değişti
- Görev durumu, grafik verisi ve haftalık özetin hesabı ekran kodundan ayrıldı (`goals.js`: `taskStatus()`; `chartData()`, `weekStats()`). Hesap yalnızca sayı ve durum döndürür, metne ekran kodu çevirir.
- Öneri görevlerinin kayıttaki başlığı dilden ve birimden bağımsız yazılıyor.

- iOS: yalnızca iPhone (iPad hedefi kaldırıldı). Apple Sağlık'a yazma izin metni "Starboard Apple Sağlık'a veri yazmaz" oldu.

### Düzeltildi
- Bel çevresi değişimi inç gösteriminde 0,1 sapabiliyordu; fark artık yuvarlamadan önce hesaplanıyor.

## 1.5.0 (12 Kasım 2026)

### Eklendi
- Birim seçimi: metrik (kg, cm, ml) ya da imperial (lb, ft·in, fl oz). Ayarlar › Kişiselleştirme'de ve ilk girişte ölçüler adımında seçilir.
- Yeni kullanıcıda varsayılan birim tarayıcının bölgesinden gelir: ABD'de imperial, diğer yerlerde metrik.
- İmperialde kilo, hedef kilo, boy, vücut ölçüleri, su, bardaklar, grafikler ve antrenman ağırlıkları seçilen birimle gösterilir ve girilir. Antrenman ekranında ± adımı 5 lb.

### Değişti
- Kayıtlar her zaman metrik tutulur; birim değiştirmek eski kayıtlara, yedeklere, kalori hesabına ve rekorlara dokunmaz.
- İngilizcede ondalık ayırıcı nokta oldu (75,3 yerine 75.3).
- Öneri görevleri her dilde Türkçe başlık ve türüyle kaydediliyor, ekranda çevriliyor.

- iOS: yalnızca iPhone (iPad hedefi kaldırıldı). Apple Sağlık'a yazma izin metni "Starboard Apple Sağlık'a veri yazmaz" oldu.

### Düzeltildi
- İngilizcede antrenman görevi her açılışta listeye bir kez daha ekleniyordu; birikmiş kopyalar da temizleniyor.
- İngilizcede su ve tartı görevleri kendiliğinden işaretlenmiyor ve gün puanına girmiyordu.
- Hızlı giriş penceresinde antrenman adı yerine "undefined" yazıyordu (her iki dilde).
- İngilizcede "Bel" ölçüsü "Lower back" diye çevrilmişti; "Waist" oldu.
- İngilizcede Türkçe kalan metinler çevrildi: uyku süresi (sa, dk), akşam özeti, hedef satırları, ilk girişin özeti, antrenman ekranındaki etiketler, hazır öğün adları.

## 1.4.0 (12 Kasım 2026)

### Eklendi
- Hareket animasyonları: "Nasıl yapılır" bölümünde bir harekete dokununca anlatımın üstünde hareketi gösteren temsili çizgi figür oynar. Rehberdeki 83 hareketin hepsinin animasyonu var (78 farklı animasyon; benzer hareketler aynısını paylaşır).
- Animasyonlar Motion kütüphanesiyle (motion.dev, MIT lisanslı) oynatılır. Kütüphane siteyle birlikte gelir, çevrimdışı da çalışır.
- Telefonda "hareketi azalt" ayarı açıksa figür hareket etmez, hareketin son hali durağan gösterilir.

## 1.3.0 (12 Kasım 2026)

### Eklendi
- Yeni kullanıcıda dil tarayıcıdan gelir: Türkçe tarayıcıda Türkçe, diğerlerinde İngilizce. Daha önce başlamış kullanıcılar Türkçe kalır.
- Karşılama ekranında dil değiştirme bağlantısı.

### Değişti
- İngilizceden "beta" etiketi kaldırıldı.
- Ölçüm değerlendirmesinin hesabı ekran kodundan ayrıldı; görünüm aynı.

## 1.2.0 (12 Kasım 2026)

Web sitesi olarak ilk sürüm.

### Eklendi
- Starboard artık bağımsız bir web sitesi: ana ekrana eklenebiliyor ve çevrimdışı çalışıyor.
- Dil seçimi: Türkçe ve İngilizce (beta). Arayüz, besinler, tarifler, antrenman programları ve hareket rehberi çevrildi.
- Veri sürümü: kayıtlar ve yedekler güncel biçime kendiliğinden taşınıyor (şema 2).
- Otomatik testler: her gönderimde çalışıyor, testler geçmezse site yayınlanmıyor.

### Değişti
- Arayüz metinleri sadeleştirildi: 41 açıklama çıkarıldı, 31'i kısaltıldı.
- Öğün önerileri: her öğünde tek protein ve tek yağ kaynağı; karbonhidrat porsiyonlarına tavan.
- Diyet seçiliyken öneriler: kahvaltı ve ara öğüne kuru baklagil ve yemeklik tahıl konmuyor.
- Kayıt tarayıcıda `starboard-state` adıyla tutuluyor. Eski adla (`saglik-takip-v1`) duran kayıt ilk açılışta okunup yeni ada yazılıyor; eski kayıt yedek olarak yerinde kalıyor.
- Kod tek dosyadan 3 stil ve 20'den fazla kod dosyasına bölündü.

- iOS: yalnızca iPhone (iPad hedefi kaldırıldı). Apple Sağlık'a yazma izin metni "Starboard Apple Sağlık'a veri yazmaz" oldu.

### Düzeltildi
- Bugün ekranında antrenman hedefinde tekrar eden "Antrenman" öneki.
- "Tüm verileri sil" artık eski adla duran kaydı da siliyor.

## 1.1

claude.ai üzerinde yayınlanan tek dosyalık sürüm.
