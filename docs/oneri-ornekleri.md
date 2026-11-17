# Öneri örnekleri ve alakasız kalem denetimi

## Yöntem

Örnekler Node.js `vm` bağlamında gerçek uygulama dosyaları (`program.js`, `nutrition.js`, `foods-intl.js`, `foods-usda.js`) yüklenerek üretildi. Her profilde dört öğün (`Kahvaltı`, `Öğle`, `Ara öğün`, `Akşam`) ve 2026-11-17 tarihine karşılık gelen deterministik gün sırası (`20669`) kullanıldı. Gramajlar üreticinin gerçek porsiyon çözümünden geldi.

Kapsanan altı profil:

1. Erkek, kilo ver, Türk mutfağı.
2. Erkek, koru, uluslararası mutfak.
3. Erkek, kilo al, Türk mutfağı, vejetaryen.
4. Kadın, kilo ver, uluslararası mutfak.
5. Kadın, koru, Türk mutfağı.
6. Kadın, kilo al, uluslararası mutfak.

## Bir günlük örnekler

### 1. Erkek · kilo ver · Türk mutfağı

Hedef: **2272 kcal**, 157 g protein, 269 g karbonhidrat, 63 g yağ.

- **Kahvaltı (596 kcal):** Granola 50 g, Süzme yoğurt 145 g, Armut 170 g, Yer fıstığı 20 g.
- **Öğle (665 kcal):** Karides 250 g, Pirinç 115 g, Zeytinyağı 5 g; yanına mevsim salata.
- **Ara öğün (298 kcal):** Yüksek proteinli yoğurt 145 g, Portakal 140 g, Ceviz 20 g.
- **Akşam (681 kcal):** Dana biftek 180 g, Kinoa 75 g, Zeytinyağı 5 g, Ayran 240 g; yanına turşu ve maydanoz.

### 2. Erkek · koru · uluslararası mutfak

Hedef: **2771 kcal**, 131 g protein, 389 g karbonhidrat, 77 g yağ.

- **Kahvaltı (724 kcal):** Granola 70 g, Süzme yoğurt 185 g, Armut 170 g, Yer fıstığı 20 g.
- **Öğle (838 kcal):** Yağsız dana kıyma 115 g, Bulgur 130 g, Zeytinyağı 5 g, Yoğurt 195 g; yanına buharda brokoli veya kabak.
- **Ara öğün (357 kcal):** Yüksek proteinli yoğurt 185 g, Portakal 210 g, Ceviz 20 g.
- **Akşam (797 kcal):** Çipura 250 g, Tatlı patates 400 g, Zeytinyağı 15 g; yanına fırında sebze.

### 3. Erkek · kilo al · Türk mutfağı · vejetaryen

Hedef: **3103 kcal**, 144 g protein, 438 g karbonhidrat, 86 g yağ.

- **Kahvaltı (783 kcal):** Granola 65 g, Süzme yoğurt 205 g, Armut 170 g, Yer fıstığı 30 g.
- **Öğle (933 kcal):** Siyah fasulye 90 g, Bulgur 105 g, Zeytinyağı 15 g, Ayran 300 g; yanına turşu ve maydanoz.
- **Ara öğün (392 kcal):** Yüksek proteinli yoğurt 185 g, Portakal 210 g, Ceviz 25 g.
- **Akşam (912 kcal):** Soya kıyması 75 g, Pirinç 120 g, Zeytinyağı 15 g, Cacık 250 g; yanına mevsim salata.

### 4. Kadın · kilo ver · uluslararası mutfak

Hedef: **1681 kcal**, 115 g protein, 200 g karbonhidrat, 47 g yağ.

- **Kahvaltı (445 kcal):** Granola 40 g, Süzme yoğurt 100 g, Armut 170 g, Yer fıstığı 10 g.
- **Öğle (499 kcal):** Karides 180 g, Pirinç 85 g, Zeytinyağı 5 g; yanına mevsim salata.
- **Ara öğün (236 kcal):** Yüksek proteinli yoğurt 100 g, Portakal 140 g, Ceviz 15 g.
- **Akşam (506 kcal):** Dana biftek 155 g, Kinoa 60 g, Zeytinyağı 5 g; yanına fırında sebze.

### 5. Kadın · koru · Türk mutfağı

Hedef: **2050 kcal**, 96 g protein, 288 g karbonhidrat, 57 g yağ.

- **Kahvaltı (530 kcal):** Granola 50 g, Süzme yoğurt 110 g, Armut 170 g, Yer fıstığı 15 g.
- **Öğle (628 kcal):** Yağsız dana kıyma 100 g, Bulgur 95 g, Zeytinyağı 5 g, Cacık 150 g; yanına domates, salatalık ve yeşillik.
- **Ara öğün (280 kcal):** Yüksek proteinli yoğurt 115 g, Portakal 140 g, Ceviz 20 g.
- **Akşam (585 kcal):** Çipura 205 g, Tatlı patates 325 g, Zeytinyağı 5 g; yanına turşu ve maydanoz.

### 6. Kadın · kilo al · uluslararası mutfak

Hedef: **2296 kcal**, 106 g protein, 324 g karbonhidrat, 64 g yağ.

- **Kahvaltı (594 kcal):** Granola 60 g, Süzme yoğurt 130 g, Armut 170 g, Yer fıstığı 15 g.
- **Öğle (701 kcal):** Yağsız dana kıyma 100 g, Bulgur 110 g, Zeytinyağı 10 g, Yoğurt 135 g; yanına buharda brokoli veya kabak.
- **Ara öğün (295 kcal):** Yüksek proteinli yoğurt 140 g, Portakal 140 g, Ceviz 20 g.
- **Akşam (692 kcal):** Çipura 220 g, Tatlı patates 375 g, Zeytinyağı 10 g; yanına fırında sebze.

## Alakasız görünen kalemler ve denetim sonucu

- Altı örnekte **alkollü içecek, sos, baharat veya tatlı çıkmadı**.
- `foods-usda.js` içindeki kaynaklı 1324 yeni kaydın **hiçbiri** örnek çıktıda yer almadı; statik tabak adayı taramasında da `src` taşıyan kayıt bulunmadı.
- Denetimde tabak adayları arasında **“Pirinç patlağı / galeta”** paketlenmiş ara besin olarak göründü. Altı örnekte seçilmese de otomatik öneri havuzundan çıkarıldı.
- “Tatlı patates” adı tatlı bir ürün değildir; sebze olarak öneride kaldı. Granola ve müsli de kahvaltılık tahıl ürünü olarak kaldı.
- Düzeltmeden sonra onaylı otomatik öneri havuzu **105 temel besin** ile sınırlandırıldı. Bu havuzdaki kayıtların hiçbirinde kaynak (`src`), alkol, sos, baharat veya tatlı bulunmuyor. Yeni veritabanı kayıtları varsayılan olarak bu havuza girmiyor.
