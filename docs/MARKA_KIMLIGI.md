# Starboard — Marka Kimliği

Bu dosya Starboard'un **bugünkü** görünümünü koddan okuyarak belgeler. Kaynaklar:
`starboard-site/css/{tokens,app,components}.css`, `starboard-site/index.html`, `starboard-site/js/*.js`,
`ios/App/App/Assets.xcassets`. Uygulama bu belgeyle değiştirilmez; görünüm kararı önce burada verilir.

Kısa özet: koyu lacivert zemin, ince çizgili kartlar, turuncu→pembe marka geçişi, tek aile (Saira),
yıldız motifi, sen dili.

---

## 1) Renk paleti

Değişkenler `tokens.css` içinde tanımlıdır. Aynı jetonlar üç kez yazılır: açık tema (`:root`, `.thm-light`),
telefon ayarını izleyen koyu tema (`prefers-color-scheme: dark`) ve elle seçilen koyu tema
(`[data-theme="dark"]`, `.thm-dark`). Elle seçim telefon ayarını ezer.

**Varsayılan tema: `auto`.** Profil `theme:"auto"` ile başlar (`js/onboarding.js`); telefonun açık/koyu
ayarı izlenir, kullanıcı Ayarlar'dan `light` / `dark` seçebilir. HTML `theme-color`: açık `#F3F4F9`,
koyu `#060A19`. tokens.css yorumuna göre **koyu tema ana tasarımdır**; açık tema aynı jetonların serin,
beyaz kartlı karşılığıdır.

### Yüzeyler, yazı ve marka

| Değişken | Açık tema | Koyu tema | Kullanım |
|---|---|---|---|
| `--bg` | `#F3F4F9` | `#060A19` | Sayfa arka planı (derin lacivert) |
| `--surface` | `#FFFFFF` | `#0E1430` | Kart/panel yüzeyi, alt sekme çubuğu |
| `--raise` | `#FFFFFF` | `#182042` | Yükselen yüzey (seçili segment, liste) |
| `--ink` | `#0D1230` | `#F2F4FF` | Ana yazı, başlık, rakam |
| `--muted` | `#586079` | `#A1A9CC` | Soluk yazı, etiket, ikincil bilgi |
| `--line` | `#E4E7F0` | `#1F2850` | İnce çizgi, kart kenarı, ayırıcı |
| `--shell` | `#ECEEF6` | `#121A38` | Girdi alanı, hap zemin, ikon kutusu |
| `--track` | `#E2E5EF` | `#222C55` | İlerleme çubuğu/halkası zemini, boş kutu |
| `--tint` | `#FFE7DF` | `#3A1630` | Marka tonlu yumuşak zemin (rozet, ghost düğme) |
| `--band` | `#C22A08` | `#FF7A4D` | Marka: **yazı ve ince çizgi** (beyazda AA) |
| `--band-vivid` | `#FF4A1C` | `#FF5A1F` | Marka: **grafik ve dolgu** |
| `--on-brand` | `#FFFFFF` | `#FFFFFF` | Marka zeminindeki yazı/simge |
| `--grad` | `135deg #FF6A13 → #FF2D72` | `135deg #FF7A1A → #FF3D86` | Hero, sekme hapı, FAB |
| `--grad-btn` | `135deg #CC3300 → #D4145A` | aynı | Beyaz yazılı birincil buton |
| `--g1` / `--g2` | `#FF6A13` / `#FF2D72` | `#FF7A1A` / `#FF3D86` | Geçişin uçları (gölge/parlama) |
| `--neon` / `--glow` | `#FF1F6E` / neon %34 | `#FF4D94` / neon %55 | Parlak vurgu ve ışıma |
| `--bg-glow` | turuncu %10 radyal | pembe %16 radyal | Sayfa üstünden vuran ışık |
| `--accent` / `--accent2` | `#FF4A1C` / `#FF2D72` | aynı | Başlık altı çizgi, seçili segment |

**Sekme renkleri** (`body[data-tab=...]` içinde `--accent`/`--accent2` değişir; ana marka rengi kalır):
`today` `#FF7A00`/`#FF2D72` · `plan` `#2F6BFF`/`#8A4DFF` · `meals` `#1FC24A`/`#B8E000` ·
`calendar` `#8A4DFF`/`#FF2D9B` · `settings` `#7B84A8`/`#A9B0CC`.

### Anlam, makro ve biyolojik renkler

| Değişken | Açık | Koyu | Kullanım |
|---|---|---|---|
| `--good` / `--good-vivid` | `#0A7A42` / `#12C46E` | `#3EE08F` / `#2FD483` | Hedef tutuldu, olumlu |
| `--off` / `--bad` | `#A24F00` / `#C12834` | `#FFB23F` / `#FF6B6B` | Uyarı / olumsuz |
| `--kcal` / `-soft` | `#FF6A00` / `#FFE8D4` | `#FF8A1F` / `#3A2410` | Kalori |
| `--protein` / `-soft` | `#EC1F5C` / `#FDE0EA` | `#FF4D7E` / `#3C1428` | Protein |
| `--fat` / `-soft` | `#E8AA00` / `#FFF3C7` | `#FFD23F` / `#373012` | Yağ |
| `--carb` / `-soft` | `#5A55F0` / `#E5E4FF` | `#8C88FF` / `#1F2052` | Karbonhidrat |
| `--over` / `-soft` | `#D1142C` / `#FFE0E3` | `#FF4D4D` / `#3D1519` | Hedef aşımı |
| `--mp` / `--mc` / `--mf` | protein / carb / fat | aynı | Kısa takma adlar |
| `--ml` / `--sleep` / `--water` | `#2BB84F` / `#6E4DFF` / `#008FF5` | `#5EE07A` / `#9C86FF` / `#3DB2FF` | Lif / uyku / su |
| `--g-veg` `--g-fruit` `--g-meat` `--g-fish` | `#2FAE35` `#F0368A` `#E8323C` `#0A8FEA` | `#5EDB5A` `#FF5CA8` `#FF5A5A` `#3DB2FF` | Besin grupları |
| `--g-dairy` `--g-grain` `--g-nuts` `--g-egg` | `#4A6BFF` `#E88A00` `#A0612A` `#D9A300` | `#6F93FF` `#FFB23F` `#D9A06B` `#FFD23F` | Besin grupları |
| `--male` / `-t` | `#2F7BEA` / `#E6F0FF` | `#5AA7FF` / `#16264A` | Erkek vücut/avatar |
| `--female` / `-t` | `#E84A93` / `#FFE6F2` | `#FF7EB9` / `#3A1A3A` | Kadın vücut/avatar |
| `--neutral` / `-t` | `#7C4DFF` / `#EFE8FF` | `#A98BFF` / `#251F4A` | Belirtilmemiş |

### Takvim ve gökyüzü

| Değişken | Açık | Koyu | Kullanım |
|---|---|---|---|
| `--d1`…`--d5` | `#FFA894` `#FFC48A` `#FFE07A` `#A7E38A` `#10A95C` | `#8A3A2A` `#8A5A1E` `#836812` `#5FAE3C` `#2FD483` | Gün yoğunluğu (kırmızı→yeşil) |
| `--dnone` / `--dnone-ink` | `#F4695C` / `#3A120E` | `#B03225` / `#FFE7E3` | Kayıt yok |
| `--dtoday` / `--dtoday-ink` | `#35CBF0` / `#04303D` | `#3BD9F5` / `#062733` | Bugün |
| `--cal4-ink` / `--cal5-ink` | `--ink` / `#FFFFFF` | `#0E1419` / `#0E1419` | Yoğun günde yazı rengi |
| `--sky1` / `--sky2` | `#141048` / `#46289C` | `#080A26` / `#28195E` | Takımyıldız gece göğü |
| `--star` / `--star-off` | `#FFD36B` / beyaz %28 | `#FFD36B` / beyaz %22 | Yıldız / sönük yıldız |
| `--sky-ink` / `--sky-muted` | `#F6F2FF` / `#CFC6F2` | `#F3EEFF` / `#B9B0DA` | Gökyüzü yazısı |
| `--star-tile` | `#E8A33C` | `#FFC861` | Bento/seri kartındaki yıldız |

---

## 2) Yazı tipi

**Tek aile: Saira.** Başlık, rakam ve gövde aynı ailedir (`--font`, `--font-d` aynı). Google Fonts/CDN
**kullanılmaz**; dosyalar uygulamayla gelir: `starboard-site/fonts/saira-latin.woff2`,
`saira-latin-ext.woff2` (SIL OFL; lisans `Saira-OFL.txt`). Değişken yazı tipi, ağırlık ekseni `400–800`;
yedekler `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`. Rakamlarda `tabular-nums`.
Temel gövde `500 16px/1.5`.

Jetonlar (`components.css`): `--t-display 34px`, `--t-h1 27px`, `--t-h2 19px`, `--t-lead 15.5px`,
`--t-body 14.5px`, `--t-cap 12px`; harf aralıkları `--lt-display -1.4px`, `--lt-h1 -.9px`, `--lt-h2 -.35px`.

| Rol | Boyut / ağırlık | Not |
|---|---|---|
| Display / hero rakam | `34px` / 900 | `-1.4px`, bazı ekranlarda 38–68px |
| H1 / H2 | `27px` / `19px`, 900 | `-0.9px` / `-0.35px`; H2 BÜYÜK HARF |
| Gövde / giriş | `14.5–15.5px` / 500–800 | Alt bilgi `12px`, rozet `11px` |
| Sekme etiketi | `11–11.5px` / 700 | `--font-d`, `text-transform:none` |

Kural: başlık ve rakam sıkı/kalın, gövde sakin; ölçüm her yerde hizalı.

---

## 3) Biçim dili

**Yuvarlaklık.** `--r:20px` (kart). Gözlenen diğerleri: bento `22px` (app.css'te `18px`), girdi `14px`,
buton `16px`, ikon kutusu `14px`, küçük uyarı `12–14px`, hap/rozet/çip `999px`, logo karosu `30px`
(onboarding SVG'sinde `rx=40/180`).

**Gölge ve ışık.** `--sh1` kart, `--sh2` yükselen katman (toast, sayfa), `--edge` üstten 1px iç ışık
(açıkta beyaz %70, koyuda %7), `--lift` kartın üstünden geçen çok hafif gradyan. Koyu temada app.css
kartları `inset 0 0 0 1px var(--line)` ince çizgiyle çizer; marka öğeleri `--glow` ile ışıtılır.
Alt sekme çubuğu cam efekti: `backdrop-filter: saturate(180%) blur(16px)`, yüzey %92 saydam.

**Boşluk ölçeği.** Ayrı jeton **henüz tanımlı değil**; kodda yaygın değerler: sayfa yatay `20px`,
kart içi `18px`, kart altı `14px`, öğe arası `11–12px`, küçük `8–10px`, bento `11px`. Dokunma hedefi
en az **44×44px** (görünmez katmanla).

**Kart.** `--surface` + `1px --line` + `--sh1` + `20px` radius, iç boşluk ~18px. Kalori kutusu sayfanın
tek dolu renk bloğudur (`--grad`); diğerleri sessiz kalır (bento hiyerarşisi).

**Düğme.** Birincil: tam genişlik, `--grad-btn`, beyaz yazı, `16px` radius, 800 ağırlık, `14px 16px`
boşluk, hafif pembe gölge (sınıfsız tüm butonlar). `ghost`: `--tint` + `--band` yazı. `link`: altı çizili,
`--muted`. Basınca `scale(.955)` ve parlaklık düşer. **Çip/hap:** `999px`, `--tint`/`--shell`, seçilince
marka dolgusu. **Sekme çubuğu:** altta sabit; seçili sekmenin simgesi arkasında `--tint` hap, simge
`--band-vivid`; ortada geçişli yuvarlak FAB.

---

## 4) Animasyon kuralları

Jetonlar (`components.css`): `--e-out: cubic-bezier(.22, 1, .36, 1)` (yumuşak çıkış),
`--e-spring: cubic-bezier(.34, 1.45, .64, 1)` (yay); süreler `--d-fast:.16s`, `--d-mid:.3s`,
`--d-slow:.55s`. Kural: **yaylı eğri yalnız parmağın altındaki şeylere**, ölçüm/geçişlerde yumuşak çıkış.
Dört katman:

1. **Dokunma:** düğme/çip `scale(.955)`, takvim `.9`, onay `.86`, FAB `.9`, sekme `.92`;
   `transform .34s var(--e-spring)`, renk `--d-fast`.
2. **Değer değişimi:** halka `stroke-dashoffset` ve çubuk genişliği `--d-slow`/`--e-out`; su bardağı
   `cupFill .42s` (26ms arayla); sekme simgesi `tabPop .38s` yay.
3. **Sayfa geçişi:** `pageIn .38s` (bazı ekranlarda `.5s`), `translateY(12px)`, kartlar 40–130ms
   kademeli; yönlü onboarding `pageInX .5s` (±72px); sekme değişiminde eski içerik `obOut .2s` ile solar.
4. **Ödül anı:** yıldız `starPop .42s` (`.2 → 1.25 → 1`), `sparkOut .62s`, seri kutlaması.
   Yıldız yalnız gerçek tamamlanmada kullanılır.

Ek süreler: onboarding ışığı `1.3s`, nefes `9–11s`, parıltı `4.2s`, logo `0.7–0.8s`.
`prefers-reduced-motion: reduce` açıkken tüm geçiş/animasyonlar kapanır, parıltı gizlenir.

---

## 5) Logo ve ikon

**Web / PWA.** `starboard-site/icon.svg` (ayrıca `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`):
`180×180` karo, `rx=40`, turuncu→pembe geçiş (`#FF7A2F → #FF3D6E`), içinde beyaz dört yükselen çubuk
ve sağ üstte dört uçlu yıldız. Aynı SVG onboarding açılışında `BRAND_SVG` olarak gömülüdür.

**iOS.** `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (1024×1024) ve
`Splash.imageset/splash-2732x2732*.png`. **Bugünkü durum:** ikisi de hâlâ Capacitor şablonudur
(beyaz zemin, mavi çarpı); Starboard markasını taşımaz. WebView arka planı `capacitor.config.json`
içinde `#F3F4F9`, splash PNG'leri beyaz şablon zeminindedir.

**Arayüz ikonları.** `index.html` içindeki satır içi SVG sprite (`<symbol>`), `24×24` görünüm kutusu.
Stil: **çizgi** — `fill:none`, `stroke:currentColor`, `stroke-width:1.8`, yuvarlak uç/birleşim.
Besin ikonlarında okunabilirlik için aynı yol `%22` dolguyla da çizilir. Ekranda `22px`, sekmede `23px`.
Tamamlanma işareti tik değil dört uçlu yıldızdır (`--star-mask`); navigasyon ikonları (Bugün, Program,
Beslenme, Takvim, FAB `+`) aynı çizgi dilini izler.

**İkon kuralları.** İkonlar **yazı içermez**. Yeni uygulama ikonu taslağı: **koyu lacivert zemin**,
vurgu **turuncu→pembe geçiş**; çubuk + yıldız motifi korunur, küçük boyutta okunur, köşeler yumuşak.
(Bugünkü iOS ikonu bu kurala uymuyor; değişiklik yapılmadı.)

---

## 6) Konuşma tonu

**Sen dili, kısa, samimi, sakin.** Cümleler yönlendirir ama zorlamaz; günlük dil; sayıda birim;
başarı "yıldız" metaforuyla anlatılır. Koddan örnekler:

- “Sağlığın için tek bir pano.” — açılış sloganı (`js/onboarding.js`)
- “Cetveli sürükle ya da rakama dokun.” — iki seçenek sunan yumuşak yönlendirme
- “Cinsiyet seç; istemiyorsan “Belirtmem” de.” — seçimi zorunlu kılmayan dil
- “Ağrın varsa önce bir hekime görün.” — sağlık sınırını net çizen kısa uyarı
- “Bu öğüne henüz bir şey eklemedin.” — suçlamayan boş durum (`js/meals.js`)
- “Satıra dokun, olduğu yerde gir.” / “Bugünün yıldızı yandı.” — kısa, ritmik, ödül dili (`js/today.js`)

Kaçınılır: “siz”, resmî/teknik üslup, korkutucu sağlık iddiaları, uzun paragraf, ünlem yığını.

---

## 7) Kullanım kuralları

1. **Tek kaynak sırası:** “Yeni renk ya da yazı tipi önce bu dosyada değişir, sonra `tokens.css`'e
   uygulanır.” Koda doğrudan yeni renk/kod yazılmaz; gerekirse `components.css` de aynı sırayla güncellenir.
2. **Renk seçimi:** metin/çizgi `--band`, grafik/dolgu `--band-vivid`, marka geçişi `--grad`, beyaz yazılı
   butonda `--grad-btn`. Açık temada yazı renkleri en az 4,5:1 (WCAG AA) kontrastı korur.
3. **Yazı tipi:** yalnız **ücretsiz ve ticari kullanıma açık** aileler (bugün: Saira, SIL OFL); lisans
   dosyası `fonts/` altında tutulur, CDN bağımlılığı kurulmaz.
4. **İkon:** yazı içermez; çizgi kalınlığı `1.8`, yuvarlak uç; tek görsel dil. Uygulama ikonunda koyu
   lacivert zemin + turuncu→pembe vurgu esastır.
5. **Sosyal medya:** varsayılan **dikey 9:16, 1080×1920**; güvenli alan üst/alt ~250px, logo ve metin
   bu alanda kalır. Yatay (16:9) ya da kare (1:1) yalnız açıkça istendiğinde.
6. **Ton ve erişilebilirlik:** sen dili, kısa cümle, yıldız metaforu; sağlık tavsiyesi hekim
   yönlendirmesiyle sınırlı. Dokunma hedefi ≥44px, `focus-visible` çerçevesi `2px --band`.

---

### Henüz tanımlı değil

- Boşluk (spacing) ölçeği jetonları — kodda yalnız yaygın px değerleri var.
- Amblem kilidi, serbest alan, minimum boyut; ses, hareketli logo ve mağaza görselleri.
- iOS uygulama ikonu ve açılış ekranının marka sürümü (bugün Capacitor şablonu).
