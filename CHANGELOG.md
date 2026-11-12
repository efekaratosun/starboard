# Değişiklik günlüğü

Sürüm numarası `starboard-site/js/storage.js` içindeki `APP_VERSION` değeridir ve Ayarlar'ın altında görünür.
Biçim: ANA.ÖZELLİK.DÜZELTME. Veri biçimi değişirse ayrıca `SCHEMA` artırılır ve bir göç adımı eklenir.

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

### Düzeltildi
- Bugün ekranında antrenman hedefinde tekrar eden "Antrenman" öneki.
- "Tüm verileri sil" artık eski adla duran kaydı da siliyor.

## 1.1

claude.ai üzerinde yayınlanan tek dosyalık sürüm.
