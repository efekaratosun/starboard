# Öğün önerileri denetimi (13 Kasım 2026, 1.9.1)

Kullanıcı şikâyeti: öneriler uyumsuz (kahvaltıda 3 muz gibi); her gün için daha gerçekçi öneri isteniyor.

## Yöntem

Geçici bir betikle (`tools/` altında, depoya girmedi) `buildMeals()` ile 7'şer günlük plan üretildi:

- 2 mutfak (Türk, uluslararası) × 8 beslenme türü (hepsi, vejetaryen, vegan, pesketaryen, glutensiz, laktozsuz, helal, koşer)
- 8 profil: erkek 82 kg koruma (2771 kcal), yağ kaybı (2272), kas (3103); kadın 60 kg koruma (2050), yağ kaybı (1681); kadın 45 kg yağ kaybı (1200, taban); çok aktif kas 95 kg (4080); hareketsiz 82 kg (2145)
- 2 öğün düzeni: varsayılan 3 öğün (kahvaltı %30, ara %20, akşam %50) ve 4 öğün (test kaydındaki)
- Toplam 1792 gün. Gün sırası "Başka kombinasyon" sayısıydı (eskiden ekran her gün aynı planı gösteriyordu).

Her gün şu kurallarla denetlendi:

| Kural | Ölçü |
|---|---|
| Gerçek dışı miktar | Bir öğünde: yumurta > 3 adet, peynir > 100 g, lor/cottage > 200 g, yoğurt/süt > 300 g, çiğ et/balık > 300 g, kuru tahıl > 180 g (yulaf, müsli > 100-120 g), ekmek > 150 g, kuru baklagil > 130 g, kuruyemiş > 40 g, ezme > 32 g, yağ > 25 g, zeytin > 40 g, patates > 450 g, meyve > 2 porsiyon |
| Meyve | Öğünde toplam 2 porsiyondan çok (1 porsiyon: orta boy meyve ya da küçük kase, en az 120 g; kuru meyvede 30 g) |
| Öğüne uymayan besin | Kahvaltı ve ara öğünde et/balık (şarküteri hariç), kuru baklagil, yemeklik tahıl (pirinç, bulgur, makarna…), patates; ana öğünde yulaf, müsli, granola, simit; ara öğünde tek başına yağ |
| Uyumsuz birliktelik | Ana öğünde meyve; tatlı tahılla tuzlu (yulaf + yumurta/peynir/zeytin); iki nişasta (ana öğünün yanında en çok 3 dilim ekmek kabul); balıkla yoğurt/süt; iki baklagil |
| Tekrar | Aynı besin gün içinde iki öğünde (yağ hariç); ana yemeğin asıl proteini ardışık günde aynı; aynı öğün ardışık günde birebir aynı |
| Diyet | `foodAllowed()`; koşerde aynı öğünde et ve süt |
| Hedef | Kalori ±%10 dışında; protein hedefin %85'inin altında ya da %130'unun üstünde |

## Bulgular (önce)

1792 günde:

| Sorun | Sayı |
|---|---|
| Gerçek dışı miktar | 2941 kalem |
| Öğünde 2 porsiyondan çok meyve | 749 öğün |
| Ana yemek ardışık günde aynı | 678 |
| Uyumsuz birliktelik | 608 öğün |
| Aynı besin gün içinde iki öğünde | 496 |
| Aynı öğün ardışık günde birebir aynı | 431 |
| Diyet ihlali | 0 |
| Protein hedefinden büyük sapma | 15 gün |
| Kalori hedefinden %10'dan çok sapma | 8 gün |

Kaynakları:

1. **Taşan karbonhidrat meyveye gidiyordu.** Ana karbonhidratın tavanı aşılınca kalan karbonhidrat sabit bir "yan karbonhidrat" listesine veriliyordu (`SIDE_CARBS`: kahvaltı ve ara öğünde önce muz, ana öğünde ekmek ve muz), tavanı 350 g'dı. Kahvaltıda 250 g, ara öğünde 295 g muz buradan çıkıyordu; aynı listeden akşama 225 g ekmek.
2. **Miktar tavanları bir tabağa göre değil makroya göreydi.** Protein kaynağında 400 g, karbonhidratta 350-500 g'a kadar izin vardı; 4 yumurta, 500 g patates, 210 g kuru pirinç, 35 g zeytinyağı görüldü.
3. **Hazır menüler her gün aynı iskeleti veriyordu.** "Başka kombinasyon" sıradaki hazır menüye geçiyordu; menülerin çoğunda ara öğün süzme yoğurt + muz, akşam tavuk/hindi idi. Ekranın kendisi her gün aynı planı gösteriyordu.
4. **Diyet seçilince üretici öğüne değil makroya bakıyordu.** Kahvaltıda tempeh ve kuru kayısı, akşamda 230 g kuru mercimek ya da pekan cevizi yağ kaynağı gibi seçimler çıkıyordu.
5. **Öğün türü ile şablon eşleşmesi:** "Mercimek çorbası, yeşil salata" gibi yan metinler besin listesine bakmadan ekleniyordu (akşamda hem çorba hem 3 porsiyon pirinç).

### Besin verisi

- **Çiğ et değerleri pişmiş ete göreydi.** Veritabanı ve plan çiğ ağırlık kullanıyor ("Miktarlar çiğ ağırlıktır"), ama tavuk göğsü 31 g, hindi 29 g, yağsız dana kıyma 26 g, biftek 27 g, kuzu 25 g protein yazıyordu (bunlar pişmiş değerler). Plan proteini olduğundan yaklaşık %30 fazla gösteriyordu. USDA çiğ değerleriyle düzeltildi: tavuk göğsü 22,5 g protein / 2,6 g yağ, hindi göğsü 24 / 1,5, tavuk but 20 / 4, yağsız dana kıyma (%10 yağ) 20 / 10, dana biftek 21 / 8, kuzu 18 / 14. Geçmiş günlük kalemleri değerlerini kendi taşıdığı için değişmedi; yalnızca bundan sonra eklenenler ve öneriler yeni değeri kullanır.
- **Düzeltilmedi, not:** şeker, çay, Türk kahvesi, kola, şalgam ve boza simge olarak `fruit` taşıyor, bu yüzden besin ekleme ekranında "Meyve" kategorisinde görünüyorlar. Kategori besin ekleme arayüzüne bağlı olduğu ve o ekran başka bir işte değiştiği için dokunulmadı; önerilere zaten girmiyorlar (`NO_SUGGEST`). Öneri kurallarındaki "meyve" sayımı bunları dışarıda bırakır.
- Porsiyon ölçülerinde öneriyi bozan hata bulunmadı. Böğürtlen, ahududu ve yaban mersininin ilk ölçüsü "avuç" (40 g) olduğu için 150 g "≈ 4 avuç" yazıyordu; önerideki üst sınır 80 g'a indi.

## Yapılan değişiklikler

- **Tabak kalıpları (`PLATES`).** Kahvaltı: peynir + (yumurta) + ekmek + (zeytin); yumurta/menemen/omlet + (peynir) + ekmek + (avokado); yulaf/granola + yoğurt/süt + meyve + (kuruyemiş); vegan için tofu ya da humus + ekmek. Ara öğün: yoğurt + meyve + (kuruyemiş); peynir + ekmek; meyve + kuruyemiş; humus + ekmek; ayran + simit; leblebi + kuru meyve. Ana öğün: et + pilav/makarna/patates + zeytinyağı + (yoğurt/cacık/ayran); balık + nişasta + zeytinyağı; baklagil + pilav/bulgur + zeytinyağı + (yoğurt); vejetaryen/vegan/pesketaryen için tofu/seitan/soya kıyması + nişasta. Parantezdekiler gerekmezse düşer. Yan sebze metni yalnızca mevcut çevrili metinlerden gelir; ekrana yeni metin eklenmedi.
- **Porsiyon kuralları (`PORTION`).** Yalnızca tabloda en az ve en çok miktarı olan besinler önerilir. Büyük öğünde (tür başına başvuru kalorisinin üstünde) et, balık, tahıl, ekmek, peynir, kuruyemiş ve zeytinyağı sınırı en çok %20 esner; 1000 kcal'yi aşan ana öğüne yanında ekmek (en çok 2 dilim, 1300 kcal'den büyükse 3 dilim) gelir ve patates yerine yoğun tahıl seçilir.
- **Gün boyu çözüm (`solvePortions`).** Bütün öğünlerin gramajları birlikte seçilir: günün kalorisi, protein (hedefin %100-120'si cezasız), yağ (%75-115 cezasız) ve karbonhidrat hedefi, her öğünün payı ve her besinin olağan porsiyonu. Adetle sayılanlar (yumurta, ekmek dilimi, meyve, zeytin) yuvarlanıp sabitlenir, kalanlar yeniden çözülür.
- **Çeşitlilik.** Gün sırası artık takvimden gelir (`planDay()`); öneri her gün kendiliğinden değişir, "Başka kombinasyon" bir sonraki güne geçer. Kalıplar ağırlıklı sırayla döner (ana öğünde et 3, balık 2, baklagil 2); her kalıp her gelişinde besinlerini bir sonrakine kaydırır. Aynı gün kullanılan besin ikinci kez seçilmez.
- **Protein.** Protein kalorinin %18'ini geçiyorsa proteini az ara öğünler çıkar ve yağsız peynir/süzme yoğurt öne geçer; %22'yi geçiyorsa (yağ kaybı) baklagil yemeği de çıkar (vejetaryen ve vegan hariç).
- **Diyet ve mutfak ayrıntıları.** Bitkisel süt ve yoğurt yalnızca vegan ve laktozsuzda, pirinç patlağı yalnızca glutensizde önerilir. Koşerde et ile süt ürünü aynı tabağa girmez; balık tabağında yoğurt yoktur.
- Kayıt biçimi değişmedi (`SCHEMA` aynı): sabitlenen yiyecekler, dışlamalar, kayıtlı öğünler ve geçmiş günler olduğu gibi kalır. Sabitlenen bir yiyecek varsa onu içeren kalıp öne geçer.

## Sonuç (sonra)

Aynı 1792 gün, aynı denetim:

| Sorun | Önce | Sonra |
|---|---|---|
| Gerçek dışı miktar | 2941 | 0 |
| Öğünde 2 porsiyondan çok meyve | 749 | 0 |
| Ana yemek ardışık günde aynı | 678 | 0 |
| Uyumsuz birliktelik | 608 | 0 |
| Aynı besin gün içinde iki öğünde | 496 | 0 |
| Aynı öğün ardışık günde birebir aynı | 431 | 0 |
| Diyet ihlali | 0 | 0 |
| Kalori hedefinden %10'dan çok sapma | 8 | 197 |
| Protein %85 altı ya da %130 üstü | 15 | 244 |

Hedef sapmalarındaki artışın nedeni ve dağılımı:

- Eski planlar hedefi gerçek dışı miktarlarla (7,5 dilim ekmek, 500 g patates, 2,5 muz) ve pişmiş değerli etle tutturuyordu; "önce" protein sayıları bu yüzden olduğundan yüksek.
- Kalori sapmalarının neredeyse tamamı tek öğünün 1400 kcal'yi aştığı düzenlerde: çok aktif kas 4080 kcal / 3 öğün (akşam 2040 kcal, 112 günün hepsi), erkek kas 3103 kcal / 3 öğün (akşam 1550 kcal, 112 günün 70'i). Makul porsiyonlarla bu öğünler dolmuyor; ekrandaki mevcut "hedeften düşük" uyarısı çıkıyor. 4 öğünde aynı profiller %7-14 içinde.
- Bu düzenler dışında kalori en kötü gün %12-14 sapıyor; yedi günlük ortalama %12 içinde (glutensiz 4080 kcal'de büyük öğünün yanına ekmek gelemediği için %10'u az aşıyor, diğerlerinde %10 içinde).
- Protein: hayvansal ürün yiyen profillerde en kötü gün hedefin %62-75'i (baklagil yemekli günler, 3 öğün; 1400 kcal'yi aşan öğünlü düzenlerde %50'ye iniyor), çoğu gün %90-130. Vegan ve vejetaryen yağ kaybında (protein hedefi kalorinin %27'si) en kötü gün %50-60; protein tozları önerilere girmediği için bitkisel kaynaklarla makul porsiyonda bu hedefe yaklaşılamıyor. Hedefin %140'ını geçen gün yok.

## Örnek günler

Erkek, 82 kg, koruma (2771 kcal, 131 g protein), Türk mutfağı, 3 öğün.

**Önce, 1. gün** (2586 kcal, 140 g protein):
- Kahvaltı: Yumurta 2 adet · Tam buğday ekmeği 135 g (≈ 4,5 dilim) · **Muz 250 g (≈ 2 adet)** · Domates, salatalık, yeşillik
- Ara öğün: Süzme yoğurt 215 g · **Muz 295 g (≈ 2,5 adet)** · Badem 10 g
- Akşam: Ton balığı 205 g · **Patates 500 g (≈ 3,5 adet)** · **Tam buğday ekmeği 225 g (≈ 7,5 dilim)** · Avokado 90 g · Buharda brokoli

**Sonra, 1. gün** (2539 kcal, 178 g protein):
- Kahvaltı: Lor peyniri 175 g · Yumurta 3 adet · Beyaz ekmek 100 g (≈ 4 dilim) · Zeytin 40 g (≈ 10 adet) · Domates, salatalık, yeşillik
- Ara öğün: Yüksek proteinli yoğurt 300 g · Mandalina 180 g (≈ 2 adet) · Antep fıstığı 35 g
- Akşam: Tavuk göğsü 220 g · Tam buğday makarna (kuru) 180 g · Zeytinyağı 20 g · Çavdar ekmeği 90 g (≈ 3 dilim) · Yanına turşu ve maydanoz

**Önce, 2. gün** (2709 kcal): Kahvaltı: Lor 75 g · **Yulaf 125 g (≈ 3 porsiyon)** · Muz 165 g · Fındık 10 g — Ara: Süzme yoğurt 95 g · **Ekmek 130 g** · **Muz 70 g** · Tahin 10 g — Akşam: Hindi 165 g · **Pirinç (kuru) 210 g** · **Ekmek 60 g** · **Zeytinyağı 35 g** · Mercimek çorbası, yeşil salata. (Muz ve ekmek gün içinde iki kez; hindi 3. gün yine akşamda.)

**Sonra, 2. gün** (2670 kcal, 153 g protein): Kahvaltı: Yumurta 2 adet · Ezine peyniri 50 g · Beyaz ekmek 100 g · Avokado 150 g · Ispanak, domates — Ara: Lor peyniri 180 g · Kepekli ekmek 120 g · Domates, salatalık, yeşillik — Akşam: Somon 225 g · Tam buğday makarna (kuru) 180 g · Zeytinyağı 5 g · Çavdar ekmeği 90 g · Yanına turşu ve maydanoz.

Kadın, 60 kg, yağ kaybı (1681 kcal, 115 g protein), 3 öğün:

- **Önce:** Kahvaltı: **Yumurta 4 adet** · Ekmek 105 g — Ara: Süzme yoğurt 215 g · Muz 120 g — Akşam: Ton 175 g · Patates 370 g · Ekmek 70 g · Avokado 90 g (ekmek iki öğünde).
- **Sonra** (1703 kcal, 121 g protein): Kahvaltı: Lor peyniri 80 g · Yumurta 2 adet · Beyaz ekmek 75 g (≈ 3 dilim) · Zeytin 40 g — Ara: Yüksek proteinli yoğurt 160 g · Mandalina 180 g · Antep fıstığı 25 g — Akşam: Tavuk göğsü 185 g · Tam buğday makarna (kuru) 120 g · Zeytinyağı 10 g · Yoğurt 215 g · Yanına turşu ve maydanoz.

Vegan, erkek koruma, uluslararası mutfak, 3 öğün:

- **Önce:** Kahvaltı: **Tofu 80 g · Yulaf 125 g** · Muz 170 g · Antep fıstığı 5 g · Yanına mevsim salata — Ara: **Tempeh 115 g · Kuru kayısı 105 g** · Kaju 5 g · Yanına buharda brokoli — Akşam: **Kırmızı mercimek (kuru) 230 g** · Karabuğday 75 g · Zeytinyağı 30 g.
- **Sonra** (2512 kcal, 84 g protein): Kahvaltı: Yulaf 80 g · Bitkisel yoğurt 300 g · Ahududu 80 g · Fındık ezmesi 30 g — Ara: Elma 180 g · Yer fıstığı ezmesi 30 g — Akşam: Kuru fasulye (kuru) 130 g · Esmer pirinç (kuru) 180 g · Zeytinyağı 20 g · Çavdar ekmeği 90 g · Yanına fırında sebze. Tabaklar gerçekçi, protein ise hedefin altında (bkz. sınırlar).

## Kalıcı testler

`tests/tests.js`, "öğün kuralları" testleri: 2 mutfak × 8 beslenme türü × 6 profil × 2 öğün düzeni × 7 gün (1344 plan). Her planda yukarıdaki porsiyon sınırları, meyve, öğüne uygunluk, diyet, koşer, iki baklagil, gün içi tekrar, ardışık gün ana yemek ve öğün tekrarı, protein %140 üstü denetlenir. Tek öğünü 1400 kcal'yi aşmayan düzenlerde ayrıca: gün kalorisi ±%20, yedi gün ortalaması ±%12, protein en az %70 (vejetaryen %55, vegan %45). Ayrıca: öneri ertesi gün değişir; her kalıp besininin porsiyon kuralı vardır; çiğ et değerleri pişmiş değer değildir.

## Açık konular

- Tek öğün 1400 kcal'yi aşan düzenler için (örneğin 3 öğün ve 3000 kcal üstü) kullanıcıya bir öğün eklemesini önermek düşünülebilir; ekrana yeni metin istenmediği için yapılmadı.
- Bitkisel beslenmede yüksek protein hedefi için protein tozu önerilere alınabilir (bugün `NO_SUGGEST`).
- İçecek ve şekerin "Meyve" kategorisinde görünmesi (yukarıda).
