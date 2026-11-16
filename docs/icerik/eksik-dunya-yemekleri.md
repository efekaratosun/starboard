# Eksik dünya yemekleri (içerik envanteri)

Bu dosya, uygulamada **henüz bulunmayan** dünya mutfağı hazır yemeklerinin listesidir.
Amaç: `starboard-site/js/nutrition.js` (`FOODS`) ve `starboard-site/js/foods-intl.js`
içindeki besinlere ileride eklenebilecek yeni kalemleri belirlemek.

## Kurallar

Satır biçimi: `- Türkçe ad (English name) | tipik porsiyon | kısa not`

**Kalori, protein, karbonhidrat, yağ ve lif değerleri bilerek yazılmadı.**
Bu değerler sonraki adımda kaynaktan (USDA FoodData Central vb.) ayrıca girilecek.

"Domuz eti içerir" ibaresi, helal ve koşer diyetinde elenecek kalemleri işaretler.
Bazı kalemlerde "içerebilir" denmiştir; tarifte domuz eti değişken olduğu anlamına gelir.

Aynı kalem iki başlıkta tekrarlanmaz; uygulamada zaten var olan kalemler
(Türk mutfağı, temel malzemeler, mevcut intl besinler) listelenmez.

Kalemler başlıklara mutfak göre ayrılmıştır; hazır yemek sınıfları
(fast food, kahvaltı, sandviç, salata, çorba, tatlı) son bölümlerdedir.

Mevcut durum: `nutrition.js` içinde 333, `foods-intl.js` içinde 42 besin tanımlı.

---

## İtalyan

- Makarna al pomodoro (Pasta al pomodoro) | 1 porsiyon 280 g | Domates, sarımsak ve zeytinyağı; bitkisel
- Fettuccine Alfredo (Fettuccine Alfredo) | 1 porsiyon 320 g | Kremalı, tereyağı ve parmesan ağırlıklı
- Spaghetti carbonara (Spaghetti carbonara) | 1 porsiyon 300 g | Yumurta sarısı ve pancetta; domuz eti içerir
- Cacio e pepe (Cacio e pepe) | 1 porsiyon 250 g | Tatlı peynir ve kara biber; et içermez
- Lasagna al forno (Lasagna al forno) | 1 porsiyon 350 g | Katmanlı; kıyma, beşamel ve parmesan
- Risotto alla milanese (Milanese risotto) | 1 porsiyon 300 g | Sarımsaklı, parmesanlı kremalı pilav
- Risotto ai funghi (Mushroom risotto) | 1 porsiyon 280 g | Mantar ve parmesan; et içermez
- Osso buco (Osso buco) | 1 porsiyon 250 g | Dana incik, şaraplı sos; domuz eti içerir
- Saltimbocca alla romana (Saltimbocca) | 1 porsiyon 220 g | Sığır eti, salata ve şarap
- Melanzane parmigiana (Melanzane parmigiana) | 1 porsiyon 300 g | Patlıcan, domates ve mozzarella
- Pesce spada (Italian fish fry) | 1 porsiyon 250 g | Unda kızartılmış levrek dilimleri
- Fritto misto (Mixed seafood fry) | 1 porsiyon 300 g | Karides, kalamari ve midye kızartma
- Kalamari (Fried calamari) | 1 porsiyon 200 g | Limon ve mayonez ile
- Gnocchi di patate (Potato gnocchi) | 1 porsiyon 250 g | Patates köftesi, soslu
- Ravioli di spinaci (Spinach ravioli) | 1 porsiyon 250 g | Ispanak ve ricotta dolgulu
- Canelloni (Canelloni) | 1 porsiyon 300 g | Boru makarna, beşamel ve kıyma
- Polenta al forno (Baked polenta) | 1 porsiyon 250 g | Peynirli, fırında kızartma
- Bruschetta al pomodoro (Tomato bruschetta) | 1 porsiyon 180 g | Ekşi mayalı ekmek, domates, sarımsak
- Pizza margherita (Pizza margherita) | 1 porsiyon 250 g | Domates, mozzarella ve taze fesleğen
- Prosciutto e funghi pizza (Prosciutto and mushroom pizza) | 1 porsiyon 280 g | Domuz eti içerir; prosciutto ve mantar
- Focaccia (Focaccia) | 1 porsiyon 150 g | Zeytinyağlı, rosemaryli düz ekmek
- Pesto genovese (Pesto Genovese) | 1 yemek kaşığı 15 g | Fesleğen, kaju ve parmesan
- Antipasto (Antipasto) | 1 tabak 220 g | Salam, mortadella ve zeytin; domuz eti içerir

## Fransız

- Croissant (Croissant) | 1 adet 60 g | Tereyağlı, katmerli hamur
- Pain au chocolat (Chocolate croissant) | 1 adet 80 g | Bitter çikolata dolgulu
- Brioche (Brioche) | 1 adet 90 g | Tereyağlı, yumurtalı yumuşak hamur
- Quiche Lorraine (Quiche Lorraine) | 1 porsiyon 150 g | Bacon, yumurta ve krem; domuz eti içerir
- Croque monsieur (Croque monsieur) | 1 adet 180 g | Ekmek, peynir ve beşamel; domuz eti içerir
- Bouillabaisse (Bouillabaisse) | 1 porsiyon 350 g | Balık ve deniz ürünleri çorbası
- Ratatouille (Ratatouille) | 1 porsiyon 300 g | Kabak, patlıcan ve biberden; et içermez
- Coq au vin (Coq au vin) | 1 porsiyon 300 g | Tavuk, şarap ve mantar
- Confit de canard (Duck confit) | 1 porsiyon 180 g | Ördek budu, yavaş kızartılmış
- Crêpe (Savory crêpe) | 1 adet 150 g | Hamur işkence; hamur, peynir ve yumurta
- Crêpe Suzette (Crêpe Suzette) | 1 porsiyon 180 g | Tatlı; portakal likörü ve tereyağı
- Soupe à l'oignon (French onion soup) | 1 kase 300 g | Soğan çorbası, gruyère peyniri ile
- Cassoulet (Cassoulet) | 1 porsiyon 350 g | Beyaz fasulye ve kuz eti; domuz eti içerir
- Blanquette de veau (Veal blanquette) | 1 porsiyon 300 g | Yumuşak et ve kremalı sos
- Steak frites (Steak frites) | 1 porsiyon 300 g | Biftek ve kızartılmış patates
- Tarte Tatin (Apple tarte Tatin) | 1 porsiyon 130 g | Karamelize elma; gelenekselde domuz yağı kullanılır
- Crème brûlée (Creme brulee) | 1 porsiyon 120 g | Vanilyalı krema, karamelize taban
- Profiteroles (Profiteroles) | 1 porsiyon 120 g | Hamur topları, vanilyalı krema ile
- Madeleines (Madeleines) | 1 adet 30 g | Kabartma tatlı kek

## İspanyol

- Paella valenciana (Valencian paella) | 1 porsiyon 350 g | Tavuk ve kırmızı biber; bazı tariflerinde domuz eti içerir
- Paella de mariscos (Seafood paella) | 1 porsiyon 400 g | Karides, kalamari, midye ve balık
- Tortilla española (Spanish omelet) | 1 porsiyon 180 g | Patates, yumurta ve soğan
- Gazpacho (Gazpacho) | 1 kase 300 g | Soğuk domates ve biber çorbası
- Salmorejo (Salmorejo) | 1 kase 250 g | Soğuk domates çorbası, ekmek kırıklarıyla
- Churros con chocolate (Churros) | 1 porsiyon 120 g | Kızartılmış hamur çubukları
- Flan (Custard flan) | 1 porsiyon 130 g | Karamelize vanilyalı krema
- Tarta de Santiago (Almond cake) | 1 dilim 90 g | Bademli İspanyol keki
- Pulpo a la gallega (Galician octopus) | 1 porsiyon 200 g | Pulpo, biber ve turuncu yağı
- Bacalao al pil-pil (Salt cod) | 1 porsiyon 250 g | Tuzlanmış morina, yumurta ile
- Patatas bravas (Patatas bravas) | 1 porsiyon 200 g | Kızartılmış patates ve domates sosu
- Jamón serrano (Serrano ham) | 1 porsiyon 50 g | İnce kesilmiş kuru et; domuz eti içerir
- Chorizo (Spanish chorizo) | 1 porsiyon 60 g | Kırmızı biberli kuru sosis; domuz eti içerir
- Croquetas de jamón (Ham croquettes) | 1 porsiyon 150 g | Beşamel kaplı; domuz eti içerir
- Arroz con leche (Rice pudding) | 1 kase 250 g | Süt, pirinç ve şeker
- Empanada gallega (Galician empanada) | 1 adet 150 g | Hamur işkence; et veya ton dolgulu
- Escalivada (Catalan escalivada) | 1 porsiyon 250 g | Közlenmiş patlıcan, biber ve soğan
- Pimientos del piquillo (Piquillo peppers) | 1 porsiyon 120 g | Tatlı, kızartılmış İspanyol biberi
- Cachopo asturiano (Asturian cachopo) | 1 porsiyon 250 g | Dana eti, patates ve biber; domuz eti içerir
- Albóndigas (Meatballs in tomato sauce) | 1 porsiyon 250 g | Domates soslu köfteler; domuz eti içerir

## Yunan ve Akdeniz

- Souvlaki (Greek souvlaki) | 1 porsiyon 250 g | Izgara tavuk şiş, pilav ile
- Souvlaki pitis (Souvlaki pita) | 1 adet 250 g | Pita ekmeği ve yoğurtlu sos
- Horiatiki (Greek village salad) | 1 porsiyon 250 g | Domates, salatalık, kaşar ve zeytin
- Spanakopita (Spinach pie) | 1 porsiyon 200 g | Ispanak, feta ve filo
- Tiropita (Cheese pie) | 1 porsiyon 150 g | Feta ve filo
- Pastitsio (Greek lasagna) | 1 porsiyon 300 g | Beşamel soslu boru makarna
- Fasolada (Greek bean stew) | 1 porsiyon 300 g | Domates soslu beyaz fasulye
- Keftedes (Greek meatballs) | 1 porsiyon 200 g | Kıymalı ve sarımsaklı
- Kleftiko (Lamb kleftiko) | 1 porsiyon 250 g | Fırında kuzu, patates ile
- Gemista (Stuffed peppers and tomatoes) | 1 porsiyon 200 g | Biber ve domates dolma
- Saganaki (Fried feta) | 1 porsiyon 150 g | Kızartılmış feta
- Fava (Greek fava) | 1 porsiyon 200 g | Kuru beyaz bezelye ezmesi
- Galaktoboureko (Greek custard pastry) | 1 adet 90 g | Sütlü krema dolgulu hamur işkence
- Loukoumades (Greek doughnuts) | 1 porsiyon 130 g | Bal ve şekerli lokma tatlısı
- Taramasalata (Taramosalata) | 1 porsiyon 120 g | Balık yumurtası ve patates ezmesi
- Feta peyniri (Feta cheese) | 1 dilim 30 g | Yunan tuzlu beyaz peyniri
- Kalamata zeytini (Kalamata olives) | 1 porsiyon 40 g | Mor, iri zeytin
- Koulouri (Sesame bread ring) | 1 adet 100 g | Susamlı Yunan ekmeği halkası

## Alman ve Orta Avrupa

- Currywurst (Currywurst) | 1 porsiyon 200 g | Ketçap ve curry soslu; domuz eti içerir
- Bratwurst (Bratwurst) | 1 adet 150 g | Izgarada pişmiş sosis; domuz eti içerir
- Weißwurst (Weisswurst) | 1 adet 130 g | Hafif baharatlı beyaz sosis; domuz eti içerir
- Rouladen (Rouladen) | 1 porsiyon 250 g | Et dolgulu sarma; domuz eti içerir
- Wiener schnitzel (Wiener schnitzel) | 1 porsiyon 200 g | Kırmızı biberli kızartma; domuz eti içerir
- Spätzle (Spätzle) | 1 porsiyon 250 g | Yumurta hamurundan elde edilen noodle
- Käsespätzle (Kasespatzle) | 1 porsiyon 300 g | Spätzle, peynir ve kızarmış soğan
- Knödel (Knodel) | 1 porsiyon 200 g | Patates veya kıymalı köfte
- Kartoffelsalat (Potato salad) | 1 porsiyon 250 g | Patates, mayonez ve soğan
- Sauerkraut (Sauerkraut) | 1 porsiyon 150 g | Fermantasyonlu lahana
- Zwiebelkuchen (Onion cake) | 1 dilim 100 g | Soğan ve karabiberli ağır hamur
- Apfelstrudel (Apple strudel) | 1 porsiyon 120 g | Elmalı, tarçınlı hamur işkence
- Lebkuchen (Gingerbread) | 1 adet 60 g | Zencefil ve ballı kek
- Schwarzwälder Kirschtorte (Black Forest cake) | 1 porsiyon 130 g | Vişne, çikolata ve krema
- Kaiserschmarrn (Kaiserschmarrn) | 1 porsiyon 250 g | Parçalı hamur tatlısı, meyve ile
- Lángos (Lángos) | 1 adet 150 g | Patatesli, kızartılmış hamur işkence
- Kürtőskalács (Chimney cake) | 1 adet 120 g | Tatlı mayalı halka kek
- Goulash (Hungarian goulash) | 1 porsiyon 300 g | Paprika ve et; domuz eti içerebilir
- Paprikash (Chicken paprikash) | 1 porsiyon 300 g | Tavuk ve kırmızı paprika soslu

## İngiliz ve İrlanda

- Full English breakfast (Full English breakfast) | 1 porsiyon 350 g | Yumurta, bacon, sosis ve fasulye; domuz eti içerir
- Fish and chips (Fish and chips) | 1 porsiyon 300 g | Morina ve kızartılmış patates
- Bangers and mash (Bangers and mash) | 1 porsiyon 300 g | Sosis ve patates püresi; domuz eti içerir
- Sausage roll (Sausage roll) | 1 adet 150 g | Hamur işkence; domuz eti içerir
- Shepherd's pie (Shepherd's pie) | 1 porsiyon 300 g | Kıyma ve patates püresi
- Toad in the hole (Toad in the hole) | 1 porsiyon 250 g | Sosislu yumurta; domuz eti içerir
- Sunday roast (Sunday roast) | 1 porsiyon 350 g | Dana eti ve et suyu; domuz eti içerebilir
- Beans on toast (Beans on toast) | 1 porsiyon 250 g | Fasulye ve ekmek
- Scotch egg (Scotch egg) | 1 adet 90 g | Et kaplı haşlanmış yumurta; domuz eti içerir
- Cornish pasty (Cornish pasty) | 1 adet 150 g | Et ve patates dolgulu; domuz eti içerir
- Beef Wellington (Beef Wellington) | 1 porsiyon 180 g | Filo ile sarılmış biftek; domuz eti içerir
- Yorkshire pudding (Yorkshire pudding) | 1 adet 60 g | İngiliz hamur işkence
- Treacle tart (Treacle tart) | 1 dilim 100 g | Siyah pekmezli tarçınlı tart
- Sticky toffee pudding (Sticky toffee pudding) | 1 porsiyon 150 g | Karamel ve keş peyniri
- Eton mess (Eton mess) | 1 porsiyon 150 g | Krema, fıstık ve marshmallow
- Crumpet (Crumpet) | 1 adet 60 g | Delikli İngiliz ekmeği
- Bakewell tart (Bakewell tart) | 1 dilim 110 g | Badem ve kiraz dolgulu
- Irish stew (Irish stew) | 1 porsiyon 350 g | Patates, koyun veya dana eti
- Irish soda bread (Irish soda bread) | 1 dilim 90 g | Kabartmalı ekmek
- Colcannon (Colcannon) | 1 porsiyon 250 g | Patates püresi ve kale lahana

## İskandinav

- Smørrebrød (Open-faced sandwich) | 1 adet 120 g | Kara ekmek, ringa ve krempe turp
- Københavner (Danish hot dog) | 1 adet 130 g | Ekmek üstünde sosis; domuz eti içerir
- Kartoffelsuppe (Danish potato soup) | 1 kase 300 g | Soğanlı; kruva ve ekmek ile
- Swedish meatballs (Swedish meatballs) | 1 porsiyon 220 g | Gravy soslu; domuz eti içerebilir
- Pannbiff (Swedish beef patty) | 1 porsiyon 180 g | Patates ve yaban üzümü sosu ile
- Beef Rydberg (Beef Rydberg) | 1 porsiyon 250 g | Kremalı soslu dana eti
- Gravlax (Gravlax) | 1 porsiyon 80 g | Tuzlanmış ve tütsülenmiş somon
- Toast Skagen (Toast Skagen) | 1 porsiyon 180 g | Karides, krema ve limon
- Fiskbulle (Fish balls) | 1 porsiyon 200 g | Balık köftesi, patates püresi ile
- Janssons frestelse (Jansson's temptation) | 1 porsiyon 300 g | Patates, sosis ve krem; domuz eti içerir
- Kåldolmar (Cabbage rolls) | 1 porsiyon 200 g | Kıymalı lahana sarması; domuz eti içerir
- Semla (Semla) | 1 adet 90 g | Kremli İsveç kahvaltı sandviçi
- Rye bread (Rye bread) | 1 dilim 40 g | Koyu İskandinav ekmeği
- Crispbread (Crispbread) | 1 adet 12 g | İsveç ince ekmeği
- Aquavit (Aquavit) | 1 kadeh 40 g | İskandinav yağlı ruh şarap
- Gløgg (Mulled wine) | 1 kadeh 200 g | Tarçın ve kırmızı meyveli sıcak şarap

## Rus ve Doğu Avrupa

- Borscht (Borscht) | 1 kase 300 g | Pancar çorbası, kremli
- Shchi (Cabbage soup) | 1 kase 300 g | Rus lahana çorbası
- Okroshka (Okroshka) | 1 kase 250 g | Kefir ve sebzeli soğuk çorba
- Kholodnik (Cold beet soup) | 1 kase 250 g | Soğuk pancar ve kefir çorbası
- Rassolnik (Pickle soup) | 1 kase 300 g | Turşu ve et çorbası
- Blini (Blini) | 1 porsiyon 150 g | Krep görünümlü hamur işkence
- Pelmeni (Pelmeni) | 1 porsiyon 200 g | Et dolgulu mantı
- Pirozhki (Pirozhki) | 1 adet 90 g | Et veya lahana dolgulu; domuz eti içerir
- Kulebyaka (Kulebyaka) | 1 porsiyon 200 g | Rus turta; somonlu veya kıymalı
- Salat Olivier (Olivier salad) | 1 porsiyon 200 g | Patates, havuç ve kuru üzüm; domuz eti içerir
- Vinaigrette (Russian vinaigrette) | 1 porsiyon 150 g | Mayonezli, patates ve mor turp
- Solyanka (Solyanka) | 1 porsiyon 300 g | Et, balık ve mantar; domuz eti içerebilir
- Kotlety (Kotlety) | 1 porsiyon 180 g | Ekmek kırıntılı köfte
- Beef Stroganoff (Beef Stroganoff) | 1 porsiyon 250 g | Kaymaklı et yemeği
- Syrniki (Syrniki) | 1 porsiyon 150 g | Lor ve unla kızartılmış tatlı köfteler
- Kasha (Buckwheat porridge) | 1 kase 250 g | Tereyağlı karabuğday lapası
- Kvass (Kvass) | 1 bardak 200 g | Rus ekşi içeceği
- Mors (Mors) | 1 bardak 200 g | Turna yemişi meyveli içecek

## Amerikan

- Clam chowder (New England clam chowder) | 1 kase 300 g | Midye ve kremalı, Amerikan kuzeyi
- Buffalo chicken wings (Buffalo wings) | 1 porsiyon 200 g | Biberli sos, havuç ve kereviz sapı
- Meatloaf (Meatloaf) | 1 porsiyon 220 g | Ekmek kırıntılı, ketçaplı fırın yemeği
- Fried chicken (Fried chicken) | 1 porsiyon 200 g | Unda paneli, yanında ekmek
- BBQ pork ribs (BBQ ribs) | 1 porsiyon 300 g | Barbekü soslu; domuz eti içerir
- Pulled pork (Pulled pork) | 1 porsiyon 200 g | İnce kıyılmış et; domuz eti içerir
- Louisiana gumbo (Gumbo) | 1 kase 350 g | Kısık ateşte pişirilen çorba; domuz eti içerir
- Jambalaya (Jambalaya) | 1 porsiyon 300 g | Pirinç, tavuk ve kırmızı biber
- Hush puppies (Hush puppies) | 1 porsiyon 120 g | Mısır unlu kızartılmış köfteler
- Chicken pot pie (Chicken pot pie) | 1 porsiyon 250 g | Hamurlu, tavuklu
- Corned beef hash (Corned beef hash) | 1 porsiyon 220 g | Dana eti ve sürülmüş patates
- Philly cheesesteak (Cheesesteak) | 1 adet 250 g | Sığır şeritleri, ekmek ve peynir
- Reuben sandwich (Reuben sandwich) | 1 adet 220 g | Pastrami, kraut ve rus salatası; domuz eti içerir
- Lobster roll (Lobster roll) | 1 adet 220 g | Köstebek eti, sarımsaklı tereyağı ekmek
- Tuna melt (Tuna melt) | 1 porsiyon 180 g | Ton, cheddar ve ekmek
- Sloppy joe (Sloppy joe) | 1 adet 200 g | Et soslu hamburger ekmeği
- Fried catfish (Fried catfish) | 1 porsiyon 220 g | Mısır unuyla kızartılmış levrek
- Baked beans (New England baked beans) | 1 porsiyon 200 g | Şekerli, pişmiş fasulye; domuz eti içerir
- Chicken and waffles (Chicken and waffles) | 1 porsiyon 300 g | Küp tavuk, puf böreği ve akçaağaç şurubu
- Hot brown (Hot brown) | 1 porsiyon 250 g | Açık ekmek üstü hindi ve sos

## Meksika ve Tex-Mex

- Quesadilla (Quesadilla) | 1 adet 180 g | Nişastalı tortilla ve peynir
- Carne asada tacos (Carne asada tacos) | 1 adet 120 g | Izgara et, soğan ve maydanoz
- Enchiladas de pollo (Chicken enchiladas) | 1 porsiyon 250 g | Tortilla, tavuk ve biber sosu
- Fajitas de pollo (Chicken fajitas) | 1 porsiyon 300 g | Izgara tavuk, biber ve soğan
- Guacamole (Guacamole) | 1 porsiyon 120 g | Avokado, limon ve soğan
- Salsa roja (Red salsa) | 1 porsiyon 100 g | Domates ve biberli acı sos
- Salsa verde (Salsa verde) | 1 porsiyon 100 g | Tomatillo ve biberli sos
- Nachos (Nachos) | 1 porsiyon 250 g | Mısır tortilla cipsi, peynir ve jalapeño
- Chile relleno (Chile relleno) | 1 porsiyon 220 g | Poblano biber, peynir ve domates sosu
- Carnitas (Carnitas) | 1 porsiyon 200 g | Kavrulmuş domuz omuz; domuz eti içerir
- Tamales (Tamales) | 1 adet 130 g | Mısır hamurunda fasulye ve et
- Elote (Mexican street corn) | 1 adet 180 g | Izgara mısır, peynir ve limon
- Mexican rice (Mexican rice) | 1 porsiyon 200 g | Domates ve baharatlı pirinç
- Refried beans (Refried beans) | 1 porsiyon 150 g | Ezilmiş pişmiş fasulye
- Pozole (Pozole) | 1 kase 300 g | Mısır ve homin tane; domuz eti içerir
- Menudo (Menudo) | 1 kase 300 g | Kırmızı biberli et çorbası; domuz eti içerir
- Fish tacos (Fish tacos) | 1 adet 130 g | Izgara levrek, la lima ve salsa
- Chimichanga (Chimichanga) | 1 adet 180 g | Kızartılmış kıymalı tortilla
- Chilaquiles (Chilaquiles) | 1 porsiyon 250 g | Soslu tortilla cipsi, peynir ve yumurta
- Birria tacos (Birria tacos) | 1 porsiyon 250 g | Soya ile marine edilmiş, kızartılmış et

## Güney Amerika

- Feijoada (Brazilian feijoada) | 1 porsiyon 350 g | Siyah fasulye ve kısık ateşte et; domuz eti içerir
- Pão de queijo (Pao de queijo) | 1 adet 35 g | Brezilya peynirli küçük ekmek
- Brigadeiro (Brigadeiro) | 1 adet 25 g | Kakaolu, sütlü tatlı top
- Coxinha (Coxinha) | 1 adet 90 g | Tavuk kızartma; domuz eti içeren versiyonları da var
- Empanada (Argentine empanada) | 1 adet 120 g | Hamur işkence, kıymalı; domuz eti içerir
- Asado (Argentine asado) | 1 porsiyon 300 g | Izgara et ve chimichurri sos
- Provoleta (Provoleta) | 1 porsiyon 120 g | Izgara peynir
- Lomo saltado (Peruvian lomo saltado) | 1 porsiyon 300 g | Soya soslu biftek, pirinç ve patates
- Ceviche (Peruvian ceviche) | 1 porsiyon 200 g | Limonla marine edilmiş çiğ beyaz balık
- Anticuchos (Peruvian anticuchos) | 1 porsiyon 200 g | Izgara tavuk şiş
- Ají de gallina (Peruvian aji de gallina) | 1 porsiyon 280 g | Kırmızı biber soslu tavuk
- Pisco sour (Pisco sour) | 1 kadeh 180 g | Peru piskosu, limon ve yumurta beyazı
- Caipirinha (Caipirinha) | 1 kadeh 250 g | Brezilya kassası, limon ve şeker
- Chimichurri (Chimichurri) | 1 yemek kaşığı 15 g | Maydanoz ve sirkeli sos
- Farofa (Farofa) | 1 porsiyon 80 g | Brezilya kavrulmuş mısır unu
- Moqueca (Brazilian moqueca) | 1 porsiyon 320 g | Balık, palm yağı ve kokos sütü soslu
- Bandeja paisa (Colombian bandeja paisa) | 1 porsiyon 400 g | Et, fasulye, yumurta, pirinç ve chicharrón
- Arepas (Arepas) | 1 adet 90 g | Venezuela mısır ekmeği

## Çin

- Dim sum (Dim sum) | 1 tabak 200 g | Buharda pişmiş çeşitli hamur işkence
- Char siu bao (Barbecue pork buns) | 1 adet 80 g | Buharda pişmiş pirinç hamurlu; domuz eti içerir
- Xiaolongbao (Soup dumplings) | 1 adet 30 g | İçinde et ve çorba
- Peking duck (Peking duck) | 1 porsiyon 200 g | Kırmızı et ve hamur ekmek; domuz eti içerir
- Chow mein (Chicken chow mein) | 1 porsiyon 300 g | Tavuk, sebze ve noodle
- Kung pao chicken (Kung pao chicken) | 1 porsiyon 250 g | Fıstık ve kuru biberli tavuk
- Sweet and sour pork (Sweet and sour pork) | 1 porsiyon 250 g | Ekşi-tatlı soslu; domuz eti içerir
- Mapo tofu (Mapo tofu) | 1 porsiyon 250 g | Soya soslu, kırmızı biberli tofu
- Dan dan noodles (Dan dan noodles) | 1 porsiyon 280 g | Susamlı, keskin soslu; domuz eti içerir
- Hainan chicken rice (Hainan chicken rice) | 1 porsiyon 350 g | Tavuk, pilav ve fasulye sosu
- Congee (Rice porridge) | 1 kase 300 g | Sade pirinç çorbası
- Wonton soup (Wonton soup) | 1 kase 300 g | Wonton ve sebzeli
- Hot and sour soup (Hot and sour soup) | 1 kase 250 g | Keskin ve ekşi Çin çorbası
- Egg fried rice (Egg fried rice) | 1 porsiyon 250 g | Yumurta ve pirinç
- Yangzhou fried rice (Yangzhou fried rice) | 1 porsiyon 250 g | Karides, sosis ve sebzeli; domuz eti içerebilir
- Spring rolls (Vegetable spring rolls) | 1 adet 60 g | İnce hamur, sebzeli; domuz eti içeren versiyonları var
- Gai lan (Chinese broccoli) | 1 porsiyon 150 g | Yapraklı çin brokoli
- Beef chow fun (Beef chow fun) | 1 porsiyon 280 g | Geniş noodle, sığır ve sebze
- Kung pao shrimp (Kung pao shrimp) | 1 porsiyon 250 g | Karides, fıstık ve kuru biber
- Scallion pancake (Scallion pancake) | 1 adet 90 g | Kaşar soğanlı katmer
- Mantou (Steamed bun) | 1 adet 100 g | Buharda pişmiş yumuşak hamur
- Buddha's delight (Buddha's delight) | 1 porsiyon 250 g | Sebze, mantar ve tofu
- Century egg (Century egg) | 1 adet 60 g | Karartılmış, kurutulmuş yumurta
- Sesame balls (Sesame balls) | 1 adet 45 g | Susam kaplı kızartma; domuz eti içeren versiyonları var
- Sichuan boiled fish (Sichuan boiled fish) | 1 porsiyon 300 g | Kuru biberli, hardal öğütülmüş balık

## Japon

- Nigiri sushi (Nigiri sushi) | 1 porsiyon 100 g | 2 parça; pirinç ve balık
- Maki roll (Maki) | 1 porsiyon 100 g | Nori ve pirinç
- Sashimi (Sashimi) | 1 porsiyon 120 g | 8 dilim çiğ balık
- Chirashi sushi (Chirashi sushi) | 1 porsiyon 250 g | Karışık suşi, hamursuz
- Tonkotsu ramen (Tonkotsu ramen) | 1 kase 400 g | Domuz kemiği suyu ve chashu; domuz eti içerir
- Shoyu ramen (Shoyu ramen) | 1 kase 350 g | Tavuk, sebze ve soya soslu
- Udon (Udon) | 1 kase 350 g | Kalın buğday noodle
- Soba (Soba) | 1 kase 300 g | Karabuğday noodle
- Yakisoba (Yakisoba) | 1 porsiyon 280 g | Soslu noodle, sebze ve tavuk
- Chawanmushi (Steamed egg custard) | 1 porsiyon 120 g | Tarçınlı buharda yumurta
- Tempura (Tempura) | 1 porsiyon 200 g | Kabuklu, kıtır kızartma
- Katsu curry (Katsu curry) | 1 porsiyon 350 g | Ekmek kırıntılı kıyma, pirinç ve karri sosu
- Tonkatsu (Tonkatsu) | 1 porsiyon 220 g | Ekmek kırıntılı kotlet; domuz eti içerir
- Saba (Grilled mackerel) | 1 porsiyon 120 g | Izgara uskumru, Japon usulü
- Natto (Natto) | 1 porsiyon 100 g | Soya fasulyesinin fermantasyon ürünü
- Onigiri (Rice ball) | 1 adet 120 g | Deniz yosunu ve pirinç
- Tamagoyaki (Japanese omelet) | 1 porsiyon 120 g | Katlanmış, yumuşak yumurta
- Gyoza (Gyoza) | 1 porsiyon 150 g | Buharda pişmiş; domuz eti içeren versiyonları var
- Takoyaki (Takoyaki) | 1 porsiyon 150 g | Top hâlinde hamur işkence, taratoru ile
- Okonomiyaki (Okonomiyaki) | 1 porsiyon 250 g | Osaka usulü sebzeli hamur işkence
- Unagi (Grilled eel) | 1 porsiyon 180 g | Izgara yılan balığı, soslu
- Miso soup (Miso soup) | 1 kase 250 g | Soya ve yosun ile
- Mochi (Mochi rice cake) | 1 porsiyon 100 g | Tatlı pirinç hamur işkence
- Dango (Dango) | 1 porsiyon 90 g | Üç adet şişte pirinç köfte
- Dorayaki (Dorayaki) | 1 adet 80 g | Fasulye ezmesi dolgulu hamur işkence

## Kore

- Bulgogi (Beef bulgogi) | 1 porsiyon 200 g | Soslu, ızgarada pişmiş dana eti
- Kimchi jjigae (Kimchi stew) | 1 kase 300 g | Fermente lahana; domuz eti içerir
- Samgyetang (Ginseng chicken soup) | 1 kase 350 g | Tavuk, ginseng ve pirinç
- Doenjang jjigae (Soybean paste stew) | 1 kase 300 g | Fermente soya soslu sebze
- Tteokguk (Rice cake soup) | 1 kase 300 g | Yeni yıl çorbası, pirinç köfteli
- Tteokbokki (Tteokbokki) | 1 porsiyon 250 g | Acı soslu pirinç tatlısı; domuz eti içerebilir
- Japchae (Japchae) | 1 porsiyon 250 g | Tatlı soslu pirinç noodle, sebze
- Jajangmyeon (Black bean noodles) | 1 porsiyon 320 g | Koyu soslu noodle, sebze ve et
- Naengmyeon (Naengmyeon) | 1 porsiyon 350 g | Soğuk buğday noodle, elma sirkesi ile
- Bossam (Bossam) | 1 porsiyon 250 g | Kırmızı biberli buğday ekmek; domuz eti içerir
- Gimbap (Gimbap) | 1 porsiyon 200 g | Nori, pirinç ve sebze rulo
- Mandu (Mandu dumplings) | 1 porsiyon 150 g | Buharda pişmiş; kıymalı veya sebzeli
- Tteok (Rice cake) | 1 porsiyon 150 g | Sosislu veya hamur işkence
- Kimchi (Kimchi) | 1 porsiyon 100 g | Fermente lahana, biberli
- Gyeran-mari (Gyeran-mari) | 1 porsiyon 150 g | Sarımsaklı, kırmızı biberli yumurta
- Yukhoe (Yukhoe) | 1 porsiyon 150 g | Çiğ dana eti, susam ve sarımsak
- Korean corn dog (Korean corn dog) | 1 adet 130 g | Patates püresi ve peynir dolgulu

## Tayland ve Vietnam

- Pad thai (Pad thai) | 1 porsiyon 300 g | Noodle, tavuk, yumurta ve fıstık
- Tom yum goong (Tom yum soup) | 1 kase 300 g | Karidesli, limon ve galangal
- Green curry (Thai green curry) | 1 porsiyon 320 g | Kremli, tavuk ve Thai fesleğeni
- Red curry (Thai red curry) | 1 porsiyon 320 g | Kırmızı biberli, tavuk
- Massaman curry (Massaman curry) | 1 porsiyon 320 g | Fıstık, patates ve koyun
- Pad kra pao (Thai basil stir-fry) | 1 porsiyon 280 g | Tavuk, Thai fesleğeni ve pirinç
- Som tam (Green papaya salad) | 1 porsiyon 200 g | Somon kâğıdı, lime ve fıstık
- Phở bò (Pho bo) | 1 kase 400 g | Vietnam pirinç noodle, dana et suyu
- Bún bò Huế (Bun bo Hue) | 1 kase 350 g | Vietnam noodle, et ve kırmızı biber
- Gỏi cuốn (Vietnamese spring rolls) | 1 porsiyon 150 g | Sebzeli, pirinç kâğıdı rulo
- Bún chả (Bun cha) | 1 porsiyon 300 g | Izgara domuz ve noodle; domuz eti içerir
- Bún thịt nướng (Grilled pork vermicelli bowl) | 1 porsiyon 350 g | Izgara et ve noodle; domuz eti içerir
- Laksa (Laksa) | 1 kase 350 g | Havačka laksa; noodle ve kokos sütü
- Chicken satay (Chicken satay) | 1 porsiyon 200 g | Izgara tavuk şiş, fıstık sosu
- Larb (Laotian larb) | 1 porsiyon 200 g | Kıymalı, limonlu acı salata
- Pad see ew (Pad see ew) | 1 porsiyon 300 g | Çin usulü, kalın noodle ve koyu sos
- Cao lầu (Cao lau) | 1 kase 350 g | Noodle, et ve sebze
- Bánh xèo (Vietnamese crepe) | 1 adet 150 g | Sarımsaklı pirinç unu krepi

## Hint ve Pakistan

- Chicken tikka masala (Chicken tikka masala) | 1 porsiyon 300 g | Kremli kırmızı soslu tavuk
- Butter chicken (Butter chicken) | 1 porsiyon 300 g | Tereyağlı, kremalı tavuk
- Chicken curry (Indian chicken curry) | 1 porsiyon 300 g | Turunçlu koyu soslu tavuk
- Lamb rogan josh (Lamb rogan josh) | 1 porsiyon 300 g | Koyu baharatlı kuzu
- Chicken karahi (Chicken karahi) | 1 porsiyon 280 g | Pakistan usulü, biberli tavuk
- Palak paneer (Palak paneer) | 1 porsiyon 250 g | Ispanaklı peynir
- Chana masala (Chana masala) | 1 porsiyon 250 g | Nohutlu domates sosu
- Dal tadka (Dal tadka) | 1 porsiyon 250 g | Yağda kavrulmuş mercimek
- Saag aloo (Saag aloo) | 1 porsiyon 250 g | Ispanak ve patates
- Chicken biryani (Chicken biryani) | 1 porsiyon 350 g | Baharatlı pilaf, tavuk ve kaju
- Khichdi (Khichdi) | 1 porsiyon 250 g | Nohut ve pirinçten yumuşak yemek
- Paneer tikka (Paneer tikka) | 1 porsiyon 220 g | Izgara peynir
- Tandoori chicken (Tandoori chicken) | 1 porsiyon 250 g | Yoğurt marine, fırında pişmiş
- Seekh kebab (Seekh kebab) | 1 porsiyon 180 g | Soya veya etli şiş
- Garlic naan (Garlic naan) | 1 adet 90 g | Tava fırında, sarımsaklı ekmek
- Chapati (Chapati) | 1 adet 50 g | Yassı tam buğday ekmeği
- Masala dosa (Masala dosa) | 1 adet 180 g | Soya ve patates, sambar ile
- Idli (Steamed idli) | 1 porsiyon 150 g | Buğday unundan köpüklü hamur
- Vegetable samosa (Vegetable samosa) | 1 adet 90 g | Üçgen hamur işkence, sebzeli
- Vegetable pakora (Vegetable pakora) | 1 porsiyon 150 g | Una kaplanmış, kızartılmış sebze
- Chole bhature (Chole bhature) | 1 porsiyon 300 g | Nohutlu koyu sos ve şişkin ekmek
- Vada pav (Vada pav) | 1 adet 140 g | Patates köfteli ekmek

## Orta Doğu ve Levant

- Falafel (Falafel) | 1 porsiyon 150 g | Bakla köftesi, tahini sosla
- Tabbouleh (Tabbouleh) | 1 porsiyon 180 g | Maydanoz, bulgur ve limon
- Baba ghanoush (Baba ghanoush) | 1 porsiyon 150 g | Közlenmiş patlıcan ezmesi
- Fattoush (Fattoush) | 1 porsiyon 200 g | Kırık ekmekli Lübnan salatası
- Chicken shawarma (Chicken shawarma) | 1 porsiyon 200 g | Sarımsaklı, dönder diliminde tavuk
- Za'atar manakish (Zaatar manakish) | 1 adet 120 g | Kekik ve zeytinli hamur
- Fatayer (Fatayer) | 1 porsiyon 150 g | Haruleli hamur işkence
- Kibbeh (Kibbeh) | 1 porsiyon 180 g | Bulgurlu, içi kıymalı köfte
- Maqluba (Maqluba) | 1 porsiyon 350 g | Ters çevrilmiş sebze ve et pilavı
- Mansaf (Mansaf) | 1 porsiyon 350 g | Yoğurtlu et ve pilav
- Kebab koobideh (Koobideh kebab) | 1 porsiyon 200 g | İran usulü kıymalı şiş
- Kebab barg (Kebab barg) | 1 porsiyon 200 g | İran usulü uzun et şişi
- Shakshuka (Shakshuka) | 1 porsiyon 250 g | Biberli sosta poşe yumurta
- Foul medames (Foul medames) | 1 kase 250 g | Bakla, tahini ve limon
- Fatteh (Chicken fatteh) | 1 porsiyon 300 g | Ekmek, yoğurt ve kıymalı tavuk
- Saffron rice (Saffron rice) | 1 porsiyon 200 g | Safranlı, limonlu pilav
- Pita (Pita bread) | 1 adet 60 g | Orta doğu ekmeği

## Kuzey Afrika

- Tagine (Lamb tagine) | 1 porsiyon 350 g | Yavaş pişmiş et ve sebze, hurma ve badem
- Couscous (Couscous with lamb) | 1 porsiyon 320 g | Buharda pişmiş buğday ve et
- Harira (Harira soup) | 1 kase 300 g | Mercimek, nohut ve domates çorbası
- Brik (Brik a l'oeuf) | 1 adet 70 g | Yumurta dolgulu ince hamur işkence
- Merguez (Merguez sausage) | 1 porsiyon 150 g | Kırmızı biberli kuzu sosis
- Medfouna (Medfouna) | 1 porsiyon 200 g | Fasulye ve domates dolgulu biber
- Bastilla (Bastilla) | 1 porsiyon 180 g | Kımırlı hamur işkence; domuz eti içerir
- Bessara (Bessara) | 1 porsiyon 180 g | Bakla ezmesi, limon ve sarımsak
- Frik chorba (Moroccan chorba) | 1 kase 300 g | Nane ve etli sebze çorbası
- Zaalouk (Zaalouk) | 1 porsiyon 200 g | Domates ve biber salatası
- Taktouka (Taktouka) | 1 porsiyon 250 g | Yumurta, kırmızı biber ve patates
- Msemen (Moroccan msemen) | 1 adet 120 g | Yassı, kızartılmış hamur işkence
- Loubia (Loubia khadra) | 1 porsiyon 200 g | Fasulye ve domates yemeği
- Harissa (Harissa paste) | 1 yemek kaşığı 15 g | Acı biberli ezme
- Ojja merguez (Tunisian ojja) | 1 porsiyon 280 g | Domates, biber ve merguez

## Afrika

- Jollof rice (Jollof rice) | 1 porsiyon 300 g | Batı Afrika pilavı
- Suya (Suya) | 1 porsiyon 200 g | Kavrulmuş et ve sıcak biberli baharat; domuz eti içerir
- Egusi soup (Egusi soup) | 1 kase 300 g | Kabak tohumu ve et çorbası
- Nyama choma (Nyama choma) | 1 porsiyon 250 g | Kenyalı ızgara et
- Bunny chow (Durban bunny chow) | 1 porsiyon 350 g | Ekmek kuyusu ve et çorbası
- Boerewors (Boerewors) | 1 porsiyon 150 g | Afrika usulü kıymalı sosis; domuz eti içerir
- Waakye (Waakye) | 1 porsiyon 300 g | Fasulye ve pirinç
- Kelewele (Ghanaian fried plantain) | 1 porsiyon 150 g | Kızartılmış olgun muz
- Puff-puff (Puff-puff) | 1 adet 60 g | Nişastalı hamur kızartma
- Morogo (Morogo) | 1 kase 250 g | Mısır ve fasulyeli çorba
- Madumbo (Madumbo) | 1 porsiyon 280 g | Fasulye, mısır ve et yemeği
- Doro wat (Doro wat) | 1 porsiyon 300 g | Habeş biberli tavuk; bazı tariflerinde domuz eti içerir
- Injera (Ethiopian injera) | 1 adet 120 g | Habeş ekmeği
- Malva pudding (Malva pudding) | 1 porsiyon 150 g | Ekmek unu ve şekerli sütlü tatlı

## Fast food ve zincir restoran klasikleri

- Big Mac tarzı hamburger (Big Mac) | 1 adet 220 g | İki kat et, cheddar ve özel sos
- Double cheeseburger (Double cheeseburger) | 1 adet 200 g | Çift peynirli katlı burger
- Bacon burger (Bacon burger) | 1 adet 190 g | Bacon ve cheddar; domuz eti içerir
- Chicken burger (Chicken burger) | 1 adet 160 g | Fırında tavuk fileto
- Fish burger (Fish burger) | 1 adet 170 g | Tilapia veya levrek fileto
- Veggie burger (Veggie burger) | 1 adet 160 g | Fasulye ve yulaf köfte
- Slider (Slider) | 1 adet 60 g | Mini hamburger
- Chicken tenders (Chicken tenders) | 1 porsiyon 150 g | 5 parça paneli tavuk
- Onion rings (Onion rings) | 1 porsiyon 120 g | Halka hâlinde kızartılmış soğan
- Mozzarella sticks (Mozzarella sticks) | 1 porsiyon 110 g | Sosisli mozzarella
- Corn dog (Corn dog) | 1 adet 110 g | Sosislu mısır hamuru
- Calzone (Calzone) | 1 adet 250 g | Katlanmış pizza, mozzarella dolgulu
- Garlic bread (Garlic bread) | 1 porsiyon 120 g | Sarımsaklı ekmek
- Tater tots (Tater tots) | 1 porsiyon 120 g | Patates çubuk kızartma
- Vanilla milkshake (Vanilla milkshake) | 1 bardak 300 g | Vanilyalı, yüksek yağlı
- Lemonade (Lemonade) | 1 bardak 330 g | Gazlı limon içeceği
- Espresso (Espresso) | 1 fincan 30 g | Sade, koyu kahve
- Caffe latte (Caffe latte) | 1 fincan 240 g | Süt ve köpüklü espresso
- Cappuccino (Cappuccino) | 1 fincan 240 g | Köpüklü espresso
- Iced tea (Iced tea) | 1 bardak 400 g | Buzlu, şekerli siyah çay
- Hot chocolate (Hot chocolate) | 1 bardak 250 g | Sıcak çikolata
- Donut (Doughnut) | 1 adet 60 g | Şekerli halka

## Kahvaltı klasikleri

- Eggs Benedict (Eggs Benedict) | 1 porsiyon 200 g | Poşe yumurta, kuz hamu ve Hollandaise
- Eggs on toast (Eggs on toast) | 1 porsiyon 180 g | Kızartılmış yumurta ve ekmek
- Soft-boiled eggs with soldiers (Soft-boiled eggs) | 1 porsiyon 120 g | 2 haşlanmış yumurta, ekmek
- Scrambled eggs (Scrambled eggs) | 1 porsiyon 150 g | Yumuşak pişmiş yumurta
- Huevos rancheros (Huevos rancheros) | 1 porsiyon 250 g | Tortilla üstünde yumurta ve salsa
- Deviled eggs (Deviled eggs) | 1 adet 55 g | Mayonezli, hardal ve kaşar dolgulu yumurta
- Breakfast burrito (Breakfast burrito) | 1 adet 220 g | Yumurta, sosis ve patates; domuz eti içerir
- French toast (French toast) | 1 porsiyon 120 g | Yumurta ve şekerli ekmek
- Waffle (Buttermilk waffle) | 1 adet 90 g | Amerikan puf böreği
- Brussels waffle (Brussels waffle) | 1 adet 80 g | Belçika puf böreği
- Biscuits and gravy (Biscuits and gravy) | 1 porsiyon 220 g | Sıcak hamur işkence ve et sosu
- Bircher muesli (Bircher muesli) | 1 kase 200 g | Yulaf, elma ve yoğurt
- Chia pudding (Chia pudding) | 1 kase 200 g | Süt veya soyada chia tohumu
- Avocado toast (Avocado toast) | 1 adet 180 g | Ezilmiş avokado ve ekmek
- Lox bagel (Lox bagel) | 1 adet 150 g | Somon, krem peyniri ve soğan
- Peanut butter toast (Peanut butter toast) | 1 dilim 60 g | Yer fıstığı ezmesi sürülmüş
- Kaya toast (Kaya toast) | 1 adet 150 g | Hindistan cevizi reçeli ekmek

## Sandviç ve wrap çeşitleri

- Club sandwich (Club sandwich) | 1 adet 250 g | Tavuk, bacon, ekmek; domuz eti içerir
- BLT sandwich (BLT) | 1 adet 180 g | Bacon, marul ve domates; domuz eti içerir
- Turkey sandwich (Turkey sandwich) | 1 adet 200 g | Hindi, peynir ve marul
- Monte Cristo sandwich (Monte Cristo) | 1 adet 200 g | Kızartılmış ekmek arasında ham; domuz eti içerir
- Cuban sandwich (Cuban sandwich) | 1 adet 230 g | Domuz eti, tur, peynir; domuz eti içerir
- Torta sandwich (Italian torta sandwich) | 1 adet 220 g | Focaccia ve mozzarella
- Panini (Mozzarella panini) | 1 adet 220 g | Izgara mozzarella ve domates
- Grilled halloumi sandwich (Halloumi sandwich) | 1 adet 180 g | Izgara hellim ve domates
- Grilled vegetable sandwich (Grilled vegetable sandwich) | 1 adet 200 g | Kabak, biber ve portakal
- Gyro sandwich (Gyro pita) | 1 adet 250 g | Et, pitaya sarılmış; domuz eti içeren versiyonları var
- Chicken kebab dürüm (Chicken kebab wrap) | 1 adet 250 g | Tavuk şiş ve sarımsaklı sos
- Mediterranean vegetable wrap (Vegetable wrap) | 1 adet 230 g | Sebze, humus ve sos
- Chicken wrap (Chicken wrap) | 1 adet 230 g | Tavuk, sebze ve sos
- Falafel wrap (Falafel wrap) | 1 adet 220 g | Falafel ve tahini sos
- Caesar wrap (Caesar wrap) | 1 adet 230 g | Tavuk, parmesan ve krem sos
- Nutella sandwich (Nutella sandwich) | 1 adet 120 g | Fıstıklı çikolata ezmeli ekmek
- Tea sandwich (Cucumber cream cheese sandwich) | 1 adet 130 g | İngiliz çay sandviçi, ince dilimlenmiş

## Salatalar ve bowl çeşitleri

- Cobb salad (Cobb salad) | 1 porsiyon 300 g | Tavuk, bacon, yumurta ve avokado; domuz eti içerir
- Niçoise salad (Nicoise salad) | 1 porsiyon 300 g | Ton, zeytin, yumurta ve patates; domuz eti içerebilir
- Caprese salad (Caprese) | 1 porsiyon 200 g | Domates, mozzarella ve fesleğen
- Beetroot salad (Beetroot salad) | 1 porsiyon 200 g | Fırınlanmış pancar, keçi peyniri ve ceviz
- Quinoa salad (Quinoa salad) | 1 porsiyon 250 g | Kinoa, sebze ve limon
- Couscous salad (Couscous salad) | 1 porsiyon 250 g | Couscous, kuru üzüm ve sebze
- Lentil salad (Lentil salad) | 1 porsiyon 250 g | Mercimek, salatalık ve limon
- Bulgur salad (Bulgur salad) | 1 porsiyon 250 g | Bulgur, domates ve nar ekşisi
- Waldorf salad (Waldorf salad) | 1 porsiyon 220 g | Elma, kereviz ve ceviz
- Burrata salad (Burrata salad) | 1 porsiyon 200 g | Burrata, domates ve fesleğen
- Poke bowl (Poke bowl) | 1 kase 350 g | Çiğ ton, pirinç ve yosun
- Harvest grain bowl (Grain bowl) | 1 kase 350 g | Kinoa, nohut ve fırın sebzesi
- Açaí bowl (Acai bowl) | 1 kase 300 g | Brezilya açaî, granola ve meyve
- Smoothie bowl (Smoothie bowl) | 1 kase 300 g | Muz, yulaf ve granola
- Burrito bowl (Burrito bowl) | 1 kase 350 g | Pilav, fasulye, mısır ve salsa
- Falafel bowl (Falafel bowl) | 1 kase 320 g | Falafel, bulgur ve humus

## Çorbalar

- Minestrone (Minestrone) | 1 kase 300 g | İtalyan sebze çorbası
- Cream of mushroom soup (Cream of mushroom soup) | 1 kase 250 g | Mantar ve krem
- Chicken noodle soup (Chicken noodle soup) | 1 kase 300 g | Tavuk suyu, noodle ve sebze
- Sweet corn soup (Sweet corn soup) | 1 kase 250 g | Mısır ve krem
- Lobster bisque (Lobster bisque) | 1 kase 250 g | Köstebek ve krem
- Butternut squash soup (Butternut squash soup) | 1 kase 250 g | Bal kabağı ve krem
- Pumpkin soup (Pumpkin soup) | 1 kase 250 g | Kabak çekirdeği ve krem
- Celeriac soup (Celeriac soup) | 1 kase 250 g | Kereviz kökü ve krem
- Egg drop soup (Egg drop soup) | 1 kase 250 g | Yumurta iplikli Çin çorbası
- Fish soup (Fish soup) | 1 kase 300 g | Deniz ürünleri ve sebze
- Sopa de ajo (Spanish garlic soup) | 1 kase 250 g | Sarımsaklı, yumurta ile
- Sopa de fideo (Spanish noodle soup) | 1 kase 300 g | İspanyol noodle çorbası
- Mulligatawny (Mulligatawny soup) | 1 kase 300 g | Hint usulü, elma ve et
- Chickpea soup (Chickpea soup) | 1 kase 250 g | Nohut ve domates
- Avgolemono (Greek lemon chicken soup) | 1 kase 250 g | Tavuk, limon ve yumurta
- Tortilla soup (Tortilla soup) | 1 kase 300 g | Meksika usulü, tortilla ve limon

## Tatlılar ve pastalar

- New York cheesecake (New York cheesecake) | 1 dilim 120 g | Krem peynirli, cracker tabanlı
- Chocolate chip cookie (Chocolate chip cookie) | 1 adet 35 g | Damla çikolatalı
- Brownie (Brownie) | 1 dilim 80 g | Kakaolu, pekmezli
- Key lime pie (Key lime pie) | 1 dilim 110 g | Kireç ve krema
- Sweet potato pie (Sweet potato pie) | 1 dilim 120 g | Baharatlı tatlı patates
- Pumpkin pie (Pumpkin pie) | 1 dilim 115 g | Kabak, tarçın ve krema
- Pecan pie (Pecan pie) | 1 dilim 110 g | Cevizlu
- Apple pie (Apple pie) | 1 dilim 120 g | Tarçınlı elma
- Apple crumble (Apple crumble) | 1 porsiyon 180 g | Yulazı ve crumble hamuru
- Lemon meringue pie (Lemon meringue pie) | 1 dilim 110 g | Limon ve pişmiş badem
- Banoffee pie (Banoffee pie) | 1 dilim 110 g | Karamel, muz ve krema
- Cinnamon roll (Cinnamon roll) | 1 adet 100 g | Tarçınlı, krem peynirli
- Bread pudding (Bread pudding) | 1 porsiyon 150 g | Ekmek, süt ve vanilya
- Pavlova (Pavlova) | 1 porsiyon 100 g | Mereng, krem ve meyve
- Éclair (Eclair) | 1 adet 80 g | Kremalı çikolatalı hamur işkence
- Mille-feuille (Mille-feuille) | 1 dilim 100 g | Vanilyalı krema ve hamur katmanları
- Cannoli (Cannoli) | 1 adet 80 g | Sütlü ricotta dolgulu; domuz eti içeren versiyonları var
- Panna cotta (Panna cotta) | 1 kase 120 g | Vanilyalı krema jölesi
- Gulab jamun (Gulab jamun) | 1 adet 45 g | Kakule şurubunda bekletilmiş tatlı top
- Bingsu (Korean shaved ice) | 1 kase 300 g | Buz üzerine süt, meyve ve fasulye
- Mango sticky rice (Mango sticky rice) | 1 porsiyon 200 g | Mango ve kokos sütü
- Cendol (Cendol) | 1 kase 300 g | Gelli fasulye ve hindistancevizi sütü

---

## Özet (başlık başına kalem sayısı)

| Başlık | Kalem |
| --- | ---: |
| İtalyan | 23 |
| Fransız | 19 |
| İspanyol | 20 |
| Yunan ve Akdeniz | 18 |
| Alman ve Orta Avrupa | 19 |
| İngiliz ve İrlanda | 20 |
| İskandinav | 16 |
| Rus ve Doğu Avrupa | 18 |
| Amerikan | 20 |
| Meksika ve Tex-Mex | 20 |
| Güney Amerika | 18 |
| Çin | 25 |
| Japon | 25 |
| Kore | 17 |
| Tayland ve Vietnam | 18 |
| Hint ve Pakistan | 22 |
| Orta Doğu ve Levant | 17 |
| Kuzey Afrika | 15 |
| Afrika | 14 |
| Fast food ve zincir restoran klasikleri | 22 |
| Kahvaltı klasikleri | 17 |
| Sandviç ve wrap çeşitleri | 17 |
| Salatalar ve bowl çeşitleri | 16 |
| Çorbalar | 16 |
| Tatlılar ve pastalar | 22 |
| **Toplam** | **474** |
