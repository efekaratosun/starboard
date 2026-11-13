# Besin ekleme akışı

Kapsam: Beslenme › Günlüğüm içindeki besin ekleme (arama, sonuç listesi, miktar seçimi, sık yedikler, hızlı ekleme, kopyalama). Öğün önerisi/plan üretimi ve besin veritabanı bu işin dışındadır. Kod: `starboard-site/js/meals.js` (`addPanel`, `quickChips`, `foodRow`, `pickCard`, `quickAdd`, `searchFoods`), `widgets.js` (`toast`), `nutrition.js` (`foodOf`, `foodUsage`; değişmedi).

## Ölçüt

"Dokunuş" bir düğmeye, satıra ya da alana yapılan her dokunuştur; arama alanına odaklanmak da bir dokunuştur. Yazılan harfler ayrıca belirtilir. Başlangıç: Beslenme › Günlüğüm açık, ilgili öğün kartı ekranda.

## Önceki akış (1.9.0), adım adım

**Besin bilinmiyor, arama ile (örn. yoğurt, 1 kase):**

1. Öğün kartında **Besin ekle** (panel açılır, panel öğünün kartının içindedir) — 1
2. **Arama alanına** dokun (panel arama alanına odaklanmaz) — 1, sonra 2+ harf yaz
3. Sonuç satırına dokun (satırdaki `+` yalnızca süstü, düğme değildi; satır `div`'di, klavye ve ekran okuyucu ulaşamıyordu) — 1
4. Miktar kartı **100 g** ile açılır (porsiyonla değil). Tek porsiyon istenirse hazır düğmeye dokun — 1
5. **Ekle** — 1
6. Geri bildirim yoktu (yalnızca günlükte yeni satır belirir, çoğu zaman ekranın dışında); yanlış eklenen kalem için günlük satırını bulup `×`.

Toplam: **5 dokunuş** (+ yazma). Miktar 100 g kalabilecekse 4. İkinci besin için panel açık kaldığından 4 (arama, sonuç, miktar, Ekle).

**Sık yedikleri eklemek:** sayfanın en başındaki "Sık yediklerin" düğmesi **1 dokunuş** (son miktar, son öğün). Panel açıkken bu liste ekranda yukarıda kaldığı için panelden uzaktı; panel açılınca yoktu. Geri alma ve bildirim yoktu.

**Dünkü öğünü kopyalamak:** boş öğün kartındaki "↺ Dünküyle aynı" **1 dokunuş**; bildirim vardı, geri alma yoktu (N kalemi tek tek `×`: N dokunuş).

**Kayıtlı öğünü eklemek:** panelde chip, 1 dokunuş; ama panel kapanıyordu.

## Yapılan değişiklikler ve gerekçe

| Değişiklik | Neden |
| --- | --- |
| Panel açılınca en üstte **sık yediklerin** (en çok 5): önce o öğünde en çok yenenler, sonra genel; her düğmede ad ve **son yenen miktar**. Dokunuşta o öğüne eklenir. Panel açıkken sayfa başındaki aynı liste çizilmez (yinelenmesin); dünü kopyala düğmesi kalır. Yeni açıklama metni yok, mevcut "Sık yediklerin" başlığı. | En çok dokunuş kazandıran: arama yazmadan 1 dokunuşla ekleme. Öğün bilgisi de doğru olur (açık panelin öğünü). |
| Arama sonucundaki **`+` gerçek düğme**: aramanın göstereceği miktarla (daha önce yediysen son miktar, yoksa 1 porsiyon / 1 adet) tek dokunuşla ekler. Satırın kendisi hâlâ miktar kartını açar. | `+` zaten ekleme gibi görünüyordu. Satır artık **neyin ekleneceğini** yazar: "1 kase (150 g) · 94 kcal". Satırlar gerçek düğme (etiketli, klavyeyle ulaşılır). |
| **Geri al** bildirimi: sık yediklerin, `+`, Ekle, sayfa başındaki sık yedikler, kayıtlı öğün ve dünkü öğün/gün kopyası toast'ta "Geri al" taşır (7 sn). Geri alma günün kalori durumunu (elle yazılı kalori dahil) ve diğer kalemleri korur. | Yanlış dokunuş ucuz olsun; tek dokunuşla ekleme ancak geri alınabiliyorsa güvenli. |
| **Panel açık kalır**: kayıtlı öğün eklemek de paneli kapatmaz. Arama temizlenir, kategori listesi açık kalır. Geçmiş yoksa panel açılınca arama alanı odaklanır; varsa odaklanmaz (klavye sık yedikleri örtmesin). | Peş peşe ekleme. |
| **Miktar kartı** porsiyonla açılır (100 g değil), kalori canlı yazılır, **− / +** düğmeleri ve seçili hazır düğme (1 porsiyon, 1 adet, 100 g…). | "Kaç g?" sorusuna gerek kalmadan doğru başlangıç; ince ayar tek dokunuşla. |
| Arama **küçük yazım hatalarına toleranslı**: hiçbir şey bulunamazsa, 4+ harfli sözcüklerde 1 (8+ harfte 2) harflik hata (eksik, fazla, yanlış, yer değişmiş) kabul edilir: "peynr", "yogrt", "elam". Ad ve takma ad, Türkçe karakter ve büyük/küçük harf duyarsızlığı zaten vardı; testle sabitlendi. | Doğru yazılan aramanın sırası bozulmasın diye yalnızca sonuç yoksa devreye girer. |

Yapılmayan ya da zaten var olan: *dünkü kahvaltıyı tekrarla* (öğün başına "↺ Dünküyle aynı" ve "Dünün tamamını kopyala" zaten vardı; yalnızca geri alma eklendi). Miktar seçimindeki hazır porsiyon düğmeleri vardı; `+`/`−` ve seçili durum eklendi. Barkod düğmesi ve "Kendi yiyeceklerim" aynen çalışır (barkod akışı miktar kartına ulaşır).

## Önce / sonra (dokunuş)

| Senaryo | Önce | Sonra |
| --- | --- | --- |
| Daha önce yenen besin, belirli öğüne (panelden) | 5 (Besin ekle, arama, sonuç, porsiyon, Ekle) | **2** (Besin ekle, sık yediklerin düğmesi) |
| Sayfa başındaki sık yedikler düğmesi | 1, geri alma yok | 1 + **Geri al** |
| Aramayla bulunan besin, varsayılan porsiyon | 5 | **2–3** (Besin ekle, `+`; arama alanı geçmiş yokken kendiliğinden odakta, geçmiş varsa +1) |
| Aramayla bulunan besin, başka miktar | 5 | 5 (satır, hazır düğme ya da ±, Ekle; kalori canlı) |
| Panel açıkken 3 besin peş peşe (arama ile) | 1 + 3×4 = 13 | 1 + 3×2 = **7** (arama alanı, `+`; iPhone'da klavye her eklemeden sonra kapanır) |
| Panel açıkken 3 sık yedik | 13 | **4** (Besin ekle + 3 düğme) |
| Yanlış eklemeyi geri alma | günlükte satırı bul, `×` (1, bulmak gerekir) | **1** (toast) |
| Dünkü öğünü kopyalayıp geri alma | 1 + N satırı `×` | 1 + **1** |

Yazım hatası: "yogrt" yazan kullanıcı eskiden sonuç alamıyor, yeniden yazıyordu; şimdi sonuç listesi geliyor.

## Erişilebilirlik

- Sonuç satırı ve `+` gerçek düğmedir; `+`'nın etiketi "Yoğurt (tam yağlı), 1 kase, Ekle". Sık yedikler düğmelerinde ad ve miktar metindedir.
- Dokunma alanları en az 44 px: `+` 44×44, sık yedikler düğmeleri ve toast'taki Geri al min. 44 px yüksek, miktar kartındaki −/+ 44×44.
- Ekleme bildirimi ekran okuyucuya `#sr-live` ile "…eklendi · N kcal. Geri al" diye okunur; düğmeli toast `aria-hidden` olmaz, böylece Geri al'a ulaşılır (7 sn).
- `tools/a11y-audit.html` 320/375/414 px'te (açık tema Türkçe, koyu tema İngilizce) yeni ekranlarla (sık yedikler, arama sonucu, kategori, miktar kartı, Geri al bildirimi) çalıştırıldı: taşma, etiketsiz alan, adsız düğme, 44 px altı alan ve kontrast bulgusu yok (ayarlardaki bağlantı ve takvim gibi önceden bilinen kalemler dışında).

## Testler

`tests/tests.js`, "arama:" ve "kolay ekleme:" testleri: Türkçe karakter, büyük/küçük harf, takma ad, yazım hatası toleransı (ve yanlış eşleşmemesi), sık yedikler sırası ve miktarı, tek dokunuşla ekleme, panelin açık kalması, geri alma (kalori dahil), çift dokunuş, `+` ile varsayılan porsiyon, miktar kartı (±, hazır düğmeler, birimli besin), dünkü öğün ve gün kopyası, kayıtlı öğün, odak, erişilebilirlik ve İngilizce.

## Gerçek cihazda denenecek

- iPhone'da panel açılınca klavyenin sık yedikleri örtmemesi ve geçmiş yokken arama alanının odaklanması (WKWebView `focus()` kullanıcı hareketi içinde çağrılıyor; sonuç `+` ile eklendikten sonra odağın geri verilmesi iOS'ta çalışmayabilir, klavye kapanır).
- Toast'taki Geri al ile VoiceOver.
