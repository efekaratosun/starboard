# Değişiklik günlüğü

Sürüm numarası `starboard-site/js/storage.js` içindeki `APP_VERSION` değeridir ve Ayarlar'ın altında görünür.
Biçim: ANA.ÖZELLİK.DÜZELTME. Veri biçimi değişirse ayrıca `SCHEMA` artırılır ve bir göç adımı eklenir.

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
