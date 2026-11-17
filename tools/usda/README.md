# USDA SR Legacy ve FNDDS yerel arama
```
node tools/usda/fetch.js                 # SR Legacy ve FNDDS indirir, acar ve iki index uretir
node tools/usda/fetch.js --fndds         # yalniz FNDDS (FoodData_Central_survey_food_json_2024-10-31.zip)
node tools/usda/find.js chicken breast   # iki dizinde arar; her satir SR veya FNDDS etiketi tasir
node tools/usda/find.js --sr lentils     # yalniz SR Legacy
node tools/usda/find.js --fndds chicken  # yalniz FNDDS
node tools/usda/find.js --id 167512      # iki dizinde ID arar; FNDDS porsiyonlarini da gosterir
```

Cikti sutunlari: `fdcId | description | kcal | protein | carbs | fat | fiber | alcohol` (100 g basina).
Degerler nutrient.number ile USDA besin numaralarindan gelir: kcal 208, protein 203, yag 204,
karbonhidrat 205, lif 291, seker 269, alkol 221, su 255. Eksik deger `-`.
FNDDS kaydinda foodCode, WWEIA kategori adi ve aciklama/gram ciftlerinden olusan porsiyonlar bulunur.
`cache/` git'e eklenmez; dizin yoksa `find.js` once `fetch.js` calistirilmasini soyler.
