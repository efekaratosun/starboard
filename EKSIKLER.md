# Eksikler

Starboard'ı kullanırken görülen hatalar, eksik özellikler ve görünüm sorunları. Yol haritası: [ROADMAP.md](ROADMAP.md)

Tür: **hata** (yanlış çalışıyor), **eksik** (olması gereken yok), **görünüm** (çalışıyor ama iyi durmuyor).

## Açık

### 2. Diyet seçiliyken öğün önerileri gerçekçi değil

- Tür: hata
- Ekran: Beslenme › Öneriler (beslenme türü "Hepsi" dışında bir şey seçiliyken)
- Eklendi: 11 Kasım 2026
- Durum: Vejetaryen seçiliyken (82 kg, erkek, kiloyu koru) kahvaltıya kuru kırmızı mercimek 80 g, kuru tam buğday makarna 60 g ve keten tohumu 40 g çıktı; ara öğüne kuru yeşil mercimek, pişmiş makarna ve tereyağı; akşama lor peyniri, kestane ve pirinç.
- Beklenen: Öğüne yakışan besinler (kahvaltıda kahvaltılık, ara öğünde atıştırmalık) ve yenebilir biçimde porsiyonlar.
- Not: Diyet seçiliyken öneriler hazır menülerden değil, makro hedefine en yakın üçlüyü arayan üreticiden (`pickTrio`) geliyor. Üretici yalnızca sayısal uyuma bakıyor; kuru baklagili kahvaltıya ya da ara öğüne koyabiliyor. 1 numaralı düzeltme bu yolu kapsamıyor.

## Tamamlanan

### 1. Öğün önerilerinde gerçekçi olmayan besin kombinasyonları

- Tür: hata
- Ekran: Beslenme › Öneriler
- Eklendi ve düzeltildi: 11 Kasım 2026
- Sorun: Tek öğünde birbirine uymayan çok sayıda besin çıkıyordu. Örnek (82 kg, erkek, kiloyu koru): öğlede tavuk, ton balığı, pirinç, patates, avokado ve zeytinyağı aynı tabakta; kahvaltıda 2 yumurtanın yanında 8 dilim ekmek.
- Neden: 750 kcal üstündeki öğünlerde ikinci bir tam tabak (protein, karbonhidrat, yağ) açılıyordu.
- Çözüm: Her öğünde tek protein ve tek yağ kaynağı. Ana karbonhidratın porsiyon tavanı var (kuru tahıl 120 g, ekmek 130 g, patates ve meyve 350 g); artan karbonhidrat tek bir yan kaynağa gider (kahvaltıda meyve, ana öğünde ekmek).
- Sınır: Çok yüksek kalorili hedeflerde (4.000 kcal ve üstü) porsiyonlar yine büyük çıkar; tavanlar öğünün büyüklüğüyle esniyor. Diyet seçiliyken (vejetaryen, vegan vb.) öneriler ayrı bir üreticiden geliyor ve bu düzeltmenin kapsamı dışında.

### Diğer

- 11 Kasım 2026: Arayüz metinleri sadeleştirildi (41 açıklama çıkarıldı, 23'ü kısaltıldı).
