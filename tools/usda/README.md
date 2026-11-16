# USDA SR Legacy yerel arama
```
node tools/usda/fetch.js                 # veri setini indirir, acar, cache/index.json uretir (~13 MB)
node tools/usda/find.js chicken breast   # tum kelimeleri description icinde arar, ilk 20 sonuc
node tools/usda/find.js --id 167512      # tek kaydi tum alanlariyla gosterir
```

Cikti sutunlari: `fdcId | description | kcal | protein | carbs | fat | fiber | alcohol` (100 g basina).
Degerler USDA besin numaralarindan gelir (208, 203, 205, 204, 291, 221); eksik deger `-`.
`cache/` git'e eklenmez; dizin yoksa `find.js` once `fetch.js` calistirilmasini soyler.
