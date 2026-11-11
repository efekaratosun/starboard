# Eksikler

Starboard'ı kullanırken görülen hatalar, eksik özellikler ve görünüm sorunları. Yol haritası: [ROADMAP.md](ROADMAP.md)

Tür: **hata** (yanlış çalışıyor), **eksik** (olması gereken yok), **görünüm** (çalışıyor ama iyi durmuyor).

## Açık

Şu an açık madde yok. Bu liste yalnızca hemen yapılamayan ya da sonraya bırakılan işler içindir; bulunan sorunlar onay alınınca doğrudan düzeltilir.

## Tamamlanan

### 2. Diyet seçiliyken öğün önerileri gerçekçi değildi

- Tür: hata
- Ekran: Beslenme › Öneriler (beslenme türü "Hepsi" dışında bir şey seçiliyken)
- Eklendi ve düzeltildi: 11 Kasım 2026
- Sorun: Vejetaryen seçiliyken kahvaltıya kuru mercimek, makarna ve keten tohumu; ara öğüne kuru mercimek ve tereyağı çıkıyordu.
- Neden: Üretici (`pickTrio`) yalnızca makro uyumuna bakıyordu; yumurta ve süzme yoğurdu protein kaynağı saymıyordu.
- Çözüm: Kahvaltı ve ara öğüne kuru baklagil ve yemeklik tahıl konmuyor; ana öğüne kahvaltılık tahıl konmuyor. Yumurta ve süzme yoğurt protein kaynağı sayılıyor. Aynı öğünde iki baklagil olmuyor. Makro uyumu yakınsa alışıldık besinler (ekmek, yulaf, pirinç, bulgur, zeytinyağı) öne geçiyor. Susam, keten tohumu, kestane gibi kalemler öneriden çıkarıldı.
- Sınır: Pirinç ya da bulgur aynı gün başka öğünde kullanıldıysa karabuğday, amarant gibi az bilinen tahıllar çıkabiliyor.

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
