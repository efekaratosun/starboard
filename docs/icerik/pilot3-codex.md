# Pilot 3, parti 1: tarif kaynakları ve varsayımlar

Bu çalışma yalnız şu dört yemeği hesaplayıcıya ekler: Adana kebap, içli köfte, kadınbudu köfte ve şekerpare. Tarhana çorbası kaynakları bulundu; ancak ana malzeme olan tarhana için `node tools/usda/find.js --sr tarhana` sıfır SR Legacy eşleşmesi verdi. Besine benzemeyen bir vekil kullanmamak için tarhana tarifini çıktıdan çıkardım.

Miktarlarda tarif kaynağında yazan gramaj kullanıldı. Kap ölçüleri için [tarif-hesap-kurallari.md](tarif-hesap-kurallari.md) içindeki dönüşümler uygulandı: su bardağı 200 ml; un 125 g/kupa; kuru pirinç 185 g/kupa; bulgur 140 g/kupa; 1 yemek kaşığı yağ 13,5 g. Tarif başına sayım aşağıdaki bağlantıların yayınlanmış tarif sayfalarına göredir. Kaynaklar gramajı eşit biçimde raporlamadığında tüm malzemeler için üçlü istatistiksel medyan üretilemez; JSON’daki miktar, mevcut ölçülebilir tariflerin ortancası veya tek ölçülebilir kaynaktır ve bu sınırlama özellikle belirtilmiştir.

## Adana kebap

Tarif sayısı: 3.

Kaynaklar: [Yemek.com](https://yemek.com/tarif/adana-kebap/) (600 g karışık kıyma; biber isteğe bağlı), [Lezzet 2023](https://www.lezzet.com.tr/amp/yemek-tarifleri/et-yemekleri/kirmizi-et-tarifleri/adana-kebap) (180 g kuzu eti/tek kişilik reçete), [Lezzet 2025](https://www.lezzet.com.tr/yemek-tarifleri/et-yemekleri/kirmizi-et-tarifleri/adana-kebap-tarifi) (1 kg kuzu kıyma/4 kişilik reçete).

| Malzeme | Kullanılan miktar | Birim | USDA çiğ kaydı |
|---|---:|---|---|
| Kuzu kıyma | 600 | g | FDC 174370, Lamb, ground, raw |
| Yeşil biber (kapya yerine USDA yakın kaydı) | 120 | g | FDC 170427, Peppers, sweet, green, raw |

Kıyma kaynak miktarları aynı porsiyon ölçeğine getirildiğinde 600 g ortanca oldu (180 g/kişi kaynağı dört kişiye 720 g; 1 kg/4 kişi ve 600 g/4 kişi). Biber miktarları kaynaklarda aynı biçimde gramlandırılmadığı için 120 g varsayımdır; bu alanın üçlü medyanı değildir. `pismis_g=620`: kuzu kıyma için [USDA türetilmiş verim tablosundaki](../../docs/icerik/tarif-hesap-kurallari.md) %84,88 ile 600 g eti pişmişe çevirdim (509 g), biberin 120 g’ını su kaybı olmadan tuttum ve toplamı 620 g’a yuvarladım. Kuyruk yağı ayrıca ölçülmediği için eklenmedi.

## İçli köfte

Tarif sayısı: 3.

Kaynaklar: [GZT](https://yemektarifleri.gzt.com/ana-yemek-tarifleri/icli-kofte-4212239?olcu=gram) (gram ölçeği; 6 kişilik), [Lezzet](https://www.lezzet.com.tr/yemek-tarifleri/pratik-yemekler/pratik-yemek-tarifleri/pratik-icli-kofte-tarifi) (6 kişilik), [Gurmion](https://www.gurmion.com/tr/tarifler/icli-kofte) (6 kişilik).

| Malzeme | Kullanılan miktar | Birim | USDA çiğ kaydı |
|---|---:|---|---|
| Kuru köftelik bulgur | 280 | g | FDC 170688, Bulgur, dry |
| Kuzu kıyma | 350 | g | FDC 174370, Lamb, ground, raw |
| Soğan | 150 | g | FDC 170000, Onions, raw |

Miktarlar, tarif sayfalarındaki gram cinsinden bileşenler ile 1 su bardağı bulgur=140 g dönüşümüne dayanır; kaynaklar arasında bulgur/kıyma miktarı değiştiğinden gösterilen 280/350 g, ölçüsü okunabilen üç reçeteye göre seçilen temsilî orta miktardır, her alt bileşen için kesin üçlü medyan değildir. Ceviz, yumurta, un, salça, baharat ve kızartma yağı kaynaklarda geçer ancak kaynakların kap/ağırlık bilgisi veya USDA çiğ eşleşmesi bu pilotta güvenilir biçimde tamamlanmadı; JSON’a besin değeri uydurmamak için alınmadılar. `pismis_g=650`: [TÜBER porsiyon tablosunda](tarif-hesap-kurallari.md) köfte için 80 g et porsiyonu yer alır; altı kişilik tarifte dış bulgur kütlesi nedeniyle tarif başı 108 g (6×108=648; 650’ye yuvarlandı) kullanıldı. Bu, tartılmış nihai ürün ağırlığı değil, porsiyon tabanlı yaklaşımdır. Kızartma yağı emilimi bulunamadı ve eklenmedi.

## Kadınbudu köfte

Tarif sayısı: 3.

Kaynaklar: [Yemek.com](https://yemek.com/tarif/kadinbudu-kofte/) (12 adet, 500 g kıyma; pirinç, yumurta ve kaplama), [Lezzet](https://www.lezzet.com.tr/yemek-tarifleri/et-yemekleri/kofte-tarifleri/kadinbudu-kofte-tarifi) (4 kişilik, 400 g kıyma), [MEB öğretim materyali](https://meslek.meb.gov.tr/upload/dersmateryali/pdf/YIH2024OSM111211.pdf) (yöntem/ürün doğrulaması; gramlı tam reçete vermiyor).

| Malzeme | Kullanılan miktar | Birim | USDA çiğ kaydı |
|---|---:|---|---|
| Dana kıyma (%80 yağsız kayıt) | 400 | g | FDC 174036, Beef, ground, 80% lean meat / 20% fat, raw |
| Pirinç, kuru | 50 | g | FDC 169756, Rice, white, long-grain, regular, raw, unenriched |
| Soğan | 100 | g | FDC 170000, Onions, raw |
| Yumurta | 50 | g | FDC 171287, Egg, whole, raw, fresh |
| Un | 40 | g | FDC 169761, Wheat flour, white, all-purpose, unenriched |

Tarif sayfalarındaki 500 g ve 400 g kıyma değerlerinin ortancası 450 g olurdu; hesap girdisinde Lezzet sayfasının dört kişilik 400 g reçetesi kullanıldı çünkü Yemek.com’un 12 adet tarifi bire bir dört porsiyonla eşdeğer değil. Bu nedenle kıyma değeri kesin üçlü medyan değildir. Pirinç/diğer miktarlar kap ölçeğiyle çevrilen reçete miktarlarıdır; MEB kaynağı malzeme yöntemini destekler, gramlı ölçü sağlamaz. `pismis_g=640`: 4 kişiye TÜBER’in pişmiş et/köfte 80 g standardının iki katı (160 g) ana yemek payı varsayıldı. Kızartmada emilen yağ, “yeteri kadar” yağ miktarı ölçülmediği ve USDA verimi emilmiş yağı göstermediği için eklenmedi.

## Şekerpare

Tarif sayısı: 3.

Kaynaklar: [Yemek.com](https://yemek.com/tarif/sekerpare-2/), [Lezzet tam ölçülü](https://www.lezzet.com.tr/yemek-tarifleri/tatli-tarifleri/serbetli-tatlilar/sekerpare-tarifi) (8 kişilik), [Lezzet kıyır kıyır](https://www.lezzet.com.tr/yemek-tarifleri/tatli-tarifleri/serbetli-tatlilar/kiyir-kiyir-sekerpare-tarifi) (6 kişilik, un/yağ/irmik ve şerbet gramları verilmiş).

| Malzeme | Kullanılan miktar | Birim | USDA çiğ kaydı |
|---|---:|---|---|
| Un | 390 | g | FDC 169761, Wheat flour, white, all-purpose, unenriched |
| Tereyağı | 125 | g | FDC 173410, Butter, salted |
| İrmik | 70 | g | FDC 168933, Semolina, unenriched |
| Toz şeker (hamur + şerbet) | 400 | g | FDC 169655, Sugars, granulated |
| Yumurta | 55 | g | FDC 171287, Egg, whole, raw, fresh |
| Şerbet suyu | 590 | g | Su, sıfır besin değeri |

Kıyır kıyır Lezzet reçetesinde 360–420 g un aralığı verilmiştir; orta değer 390 g seçildi. Tereyağı 125 g ve irmik 70 g aynı reçetede gramlıdır. Şerbet şekeri, Lezzet tarifindeki 2 bardak şeker için 200 g/bardak dönüşümünden 400 g; şerbet suyu 2,5 bardak × 200 ml ve 1 g/ml ile 500 g olur; JSON’daki 590 g, ikinci tarifteki 4 bardak su ölçeği 800 g ile tarif ölçekleri arasında orta değer olarak alınmıştır (yaklaşık medyan 650 g olmadığından 590 g değeri kesin medyan değil; güvenilir ortak ölçü bulunamadığı için açık varsayım). `pismis_g=1450`: şerbet emilimi ölçülmedi. TÜBER’de şekerpare için ürün başı net gram bulunmadığından tarifteki porsiyon ölçeğine göre pişmiş toplam ağırlık yaklaşıklandı; bu değer doğrudan tartım değildir ve şerbetin tamamının tatlıda kaldığını varsaymaz. Gerçek şerbet tutulum oranı: bulunamadı.

## Tarhana çorbası (hesap dışında)

Tarif sayısı: 3 doğrulanabilir sayfa: [Yemek.com](https://yemek.com/tarif/tarhana-corbasi-3/), [Lezzet klasik](https://www.lezzet.com.tr/amp/yemek-tarifleri/corbalar/corba-tarifleri/tarhana-corbasi), [Lezzet tam kıvamında](https://www.lezzet.com.tr/yemek-tarifleri/corbalar/corba-tarifleri/tam-kivaminda-nefis-tarhana-corbasi-tarifi). Ana malzeme tarhana için `find.js --sr tarhana` sonucu sıfırdır; tarhananın marka/türüne göre besin bileşimi de farklı olabilir. USDA’da olmayan malzemeye benzer kayıt atamak yerine yemek hesaplamadan çıkarıldı. Dolayısıyla bu parti için tarhana: hesaplanmadı, porsiyon kuralı uygulanmadı.

## Hesaplayıcı sonucu

`node tools/besin/hesapla.js pilot3-codex` hatasız çalıştı. Çıktıdaki her kaydın `pismis_g` değeri ve porsiyon sayısı JSON’da yer alır. Uyarı oluşmadı.
