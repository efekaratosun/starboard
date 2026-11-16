# Besin degerleri hesaplama ve denetim
```
node tools/besin/hesapla.js PARTI   # kaynak/PARTI.json -> cikti/PARTI.json + ozet tablo
node tools/besin/test.js            # testler (Node assert)
```

## Girdi (`tools/besin/kaynak/PARTI.json`, bir dizi)
- `usda`: `{ "key", "ad", "tip": "usda", "fdc": 172421 }`; degerler `tools/usda/cache/index.json` kaydindan aynen alinir.
- `tarif`: `{ "key", "ad", "tip": "tarif", "malz": [...], "pismis_g": 1800, "porsiyon": 4 }`
- `malz` elemani uc bicimden biri; `ad` her eleman icin zorunlu:
  - `{ "ad": "Kuru mercimek", "fdc": 172420, "g": 200 }` USDA kaydi + gram
  - `{ "ad": "Pismis mercimek", "key": "pismis_mercimek", "g": 100 }` ayni dosyadaki kaydin 100 g degerleri
  - `{ "ad": "Su", "su": true, "g": 1500 }` su (besin degeri sifir)

## Hesap
Malzeme toplamlari (p, c, f, lif, alk, USDA kcal) / `pismis_g` x 100 = 100 g degeri.
`porsiyon_g = pismis_g / porsiyon`; `kcal_449 = 4p+4c+9f+7alk` (yuvarlanmis degerlerle);
`porsiyon_kcal = kcal_usda x porsiyon_g / 100`. `usda` kayitlarinda porsiyon alanlari `null`.

## Kurallar
HATA, cikis kodu 1, cikti yazilmaz: fdc dizinde yok; protein, yag ya da karbonhidrat null; tekrar eden key;
key dongusu ya da bulunamayan key; malz elemanda ad yok; `pismis_g` > toplam agirlik; p+c+f > 100.
UYARI, devam eder: `pismis_g` toplam agirligin %40'indan kucuk; kcal_449 ile kcal_usda farki %12'den fazla;
lif null (0 sayilir); lif > c. Uyarilar `UYARI [key]: ...` olarak stderr'e yazilir.
