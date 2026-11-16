# Besin degerleri hesaplama ve denetim
```
node tools/besin/hesapla.js PARTI   # kaynak/PARTI.json -> cikti/PARTI.json + tablolar
node tools/besin/test.js            # testler (Node assert)
```

## Girdi (`tools/besin/kaynak/PARTI.json`, bir dizi)
- `usda`: `{ "key", "ad", "tip": "usda", "fdc": 172421 }`; degerler `tools/usda/cache/index.json` kaydindan aynen alinir.
- `tarif`: `{ "key", "ad", "tip": "tarif", "malz": [...], "pismis_g": 1800, "porsiyon": 4 }`
- `malz` icin `ad` zorunlu; `fdc`, `key`, `su` alanlarindan TAM OLARAK biri verilir:
  - `{ "ad": "Kuru mercimek", "fdc": 172420, "g": 200 }` USDA kaydi + gram
  - `{ "ad": "Pismis mercimek", "key": "pismis_mercimek", "g": 100 }` ayni dosyadaki kaydin 100 g degerleri
  - `{ "ad": "Su", "su": true, "g": 1500 }` su (besin degeri sifir)

## Hesap
Malzeme toplamlari (p, c, f, lif, alk, USDA kcal) / `pismis_g` x 100 = 100 g degeri.
`porsiyon_g = pismis_g / porsiyon` ve `porsiyon_kcal = toplam kcal / porsiyon` HAM degerlerden hesaplanir,
yalniz en sonda tam sayiya yuvarlanir. `kcal_449 = 4p + 4c + 9f + 7alk` (yuvarlanmis p/c/f/alk ile).

## Cikti
`cikti/PARTI.json`: her kayit icin `p, c, f, lif, alk, kcal_usda, kcal_449, porsiyon_g, porsiyon_kcal, kaynak`.
`kaynak` usda tipinde USDA description; tarif tipinde `{ ad, g, fdc, aciklama }` listesi. Ekranda her tarif icin
malzeme dokumu (ad, g, fdc, description, o malzemenin kcal katkisi) basilir.

## Kurallar
HATA, cikis kodu 1, cikti yazilmaz: fdc dizinde yok ya da sayi degil; protein, yag, karbonhidrat veya kcal null;
tekrar eden key; key dongusu ya da bulunamayan key; malz elemanda ad yok; fdc/key/su birlikte ya da hicbiri;
porsiyon tam sayi degil ya da 1 den kucuk; porsiyon_g 1 den kucuk; pismis_g > toplam agirlik; p+c+f > 100.
UYARI, devam eder: pismis_g toplam agirligin %40 indan kucuk; kcal_449 ile kcal_usda farki hem %12 hem de
100 g basina 15 kcal den buyuk (karsilastirmada 4p + 4(c-lif) + 2lif + 9f + 7alk kullanilir); lif null (0 sayilir);
lif > c; malz adi pismis/haslanmis/kizarmis/kavrulmus iken USDA kaydi raw, ya da adi cig iken kayit
cooked/boiled/roasted/fried/baked. Uyarilar `UYARI [key]: ...` olarak stderr'e yazilir.
