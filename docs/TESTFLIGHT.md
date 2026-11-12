# Starboard'u TestFlight ile iPhone'a kurmak

Bu belge, Apple Developer hesabı açıldıktan sonra Starboard'u kendi iPhone'una kurmak için yapılacakları anlatır. Mac gerekmez; her şey tarayıcıdan ve GitHub'dan yapılır. Uygulamayı GitHub'ın bulut makinesi derler ve TestFlight'a yükler (`.github/workflows/testflight.yml`).

Ekrandaki düğme ve menü adları İngilizce yazıldı, çünkü Apple ve GitHub sayfaları öyle görünür. Adının birebir aynı olduğundan emin olmadığım yerler **(emin değilim)** diye işaretli; Apple sayfalarını sık değiştiriyor, ad biraz farklıysa en yakın olanı seç.

Aşağıdaki bilgileri bir yere not et; birkaç adımda lazım olacak:

| Ne | Değer |
|---|---|
| Bundle ID (paket kimliği) | `app.starboard.health` |
| Uygulama adı | `Starboard` |
| SKU | `starboard-ios` (kendin uydurduğun, kimsenin görmediği bir kod; değiştirilemez) |

## Başlamadan önce

- Apple Developer hesabı açılmış ve ödemesi onaylanmış olmalı (yıllık 99 USD). Onay bazen 1–2 gün sürer.
- https://developer.apple.com/account adresine girince üstte "sözleşmeyi kabul et" gibi bir uyarı çıkarsa (ör. **Review Agreement**) önce onu kabul et; kabul edilmemiş sözleşme varken yükleme hata verir.
- iPhone'un yanında olsun.

## 1. App Store Connect'te uygulama kaydı

Önce paket kimliği kaydedilir, sonra uygulama oluşturulur.

**Paket kimliğini kaydet:**

1. https://developer.apple.com/account adresine gir.
2. **Certificates, IDs & Profiles** bölümünde **Identifiers**'a tıkla.
3. **Identifiers** başlığının yanındaki mavi **+** düğmesine bas.
4. **App IDs**'i seç, **Continue**.
5. **App**'i seç, **Continue**.
6. **Description**: `Starboard`. **Bundle ID**: **Explicit**'i seç ve `app.starboard.health` yaz.
7. Aşağıdaki **Capabilities** listesinde **HealthKit**'in kutusunu işaretle (2. adım bununla ilgili). Başka bir şeye dokunma.
8. **Continue**, sonra **Register**.

**Uygulamayı oluştur:**

1. https://appstoreconnect.apple.com adresine gir, **Apps**'e tıkla.
2. Sol üstteki mavi **+** düğmesine bas, **New App**'i seç.
3. Formu doldur:
   - **Platforms**: **iOS**
   - **Name**: `Starboard` (bu ad başkası tarafından alınmışsa hata verir; o zaman örneğin `Starboard: Beslenme ve Antrenman` gibi bir ad dene ve bana haber ver)
   - **Primary Language**: **Turkish**
   - **Bundle ID**: listeden `Starboard - app.starboard.health`'i seç
   - **SKU**: `starboard-ios`
   - **User Access**: **Full Access**
4. **Create**.

## 2. HealthKit yeteneği (Identifiers)

Starboard Apple Sağlık'tan adım, uyku ve kilo okur; bunun için paket kimliğinde HealthKit açık olmalı. 1. adımda işaretlediysen sadece kontrol et:

1. https://developer.apple.com/account → **Certificates, IDs & Profiles** → **Identifiers**.
2. Listede `app.starboard.health`'e tıkla.
3. **Capabilities** sekmesinde **HealthKit**'in işaretli olduğunu gör. Değilse işaretle ve sağ üstteki **Save**'e bas. Çıkan uyarıda **Confirm** de.

HealthKit'in altında "Clinical Health Records" gibi ek bir seçenek çıkarsa **işaretleme** (Starboard klinik kayıt okumaz) **(emin değilim: bu seçenek ayrı bir kutu olarak görünmeyebilir)**.

## 3. App Store Connect API anahtarı

GitHub'daki bulut makinesi bu anahtarla senin adına Apple'a bağlanır; imza sertifikasını ve profili kendisi oluşturur.

1. https://appstoreconnect.apple.com → **Users and Access**.
2. Üstteki sekmelerden **Integrations**'a tıkla.
3. Soldan **App Store Connect API**'yi seç (sağ tarafta **Team Keys** sekmesi açık olmalı).
4. İlk kez giriyorsan **Request Access** düğmesi çıkar; bas, şartları kabul et ve gönder. Hesap sahibi sen olduğun için hemen açılır **(emin değilim: birkaç dakika sürebilir)**.
5. **Generate API Key** (ya da tablonun yanındaki **+**) düğmesine bas.
6. **Name**: `GitHub TestFlight`. **Access**: **App Manager**. **Generate**.
7. Tabloda yeni anahtarın satırında **Download** bağlantısına bas. `AuthKey_XXXXXXXXXX.p8` adlı bir dosya iner.
   - **Bu dosya yalnızca bir kez indirilebilir.** Kaybolursa anahtarı silip yenisini oluşturman gerekir.
   - Dosyayı kimseyle paylaşma, e-postayla gönderme, depoya yükleme.
8. Şu iki bilgiyi not et:
   - **Key ID**: tablodaki 10 karakterlik kod (dosya adındaki `XXXXXXXXXX` ile aynı).
   - **Issuer ID**: tablonun üstünde yazan, tirelerle ayrılmış uzun kod (ör. `12345678-abcd-…`). Yanında **Copy** düğmesi vardır.

## 4. Team ID'yi bulmak

1. https://developer.apple.com/account adresine gir.
2. Sayfayı aşağı kaydır, **Membership details** bölümünü bul **(emin değilim: bölüm adı "Membership" olarak da görünebilir; soldaki menüde **Membership details** bağlantısı da olabilir)**.
3. **Team ID** satırındaki 10 karakterlik kodu (büyük harf ve rakam) not et.

## 5. GitHub'a dört gizli anahtarı eklemek

1. https://github.com/efekaratosun/starboard adresine gir.
2. Üstteki **Settings** sekmesine tıkla.
3. Soldaki menüde **Secrets and variables**'ı aç, altında **Actions**'a tıkla.
4. **Secrets** sekmesinde yeşil **New repository secret** düğmesine bas.
5. **Name** kutusuna adı, **Secret** kutusuna değeri yapıştır, **Add secret**'a bas. Bunu dört kez yap:

| Name | Secret |
|---|---|
| `ASC_KEY_ID` | 3. adımdaki **Key ID** |
| `ASC_ISSUER_ID` | 3. adımdaki **Issuer ID** |
| `ASC_KEY_P8` | `.p8` dosyasının **içeriğinin tamamı** (aşağıya bak) |
| `APPLE_TEAM_ID` | 4. adımdaki **Team ID** |

`.p8` dosyasının içeriğini kopyalamak için: dosyaya sağ tıkla → **Open with** (Birlikte aç) → **Notepad** (Not Defteri). `-----BEGIN PRIVATE KEY-----` satırından `-----END PRIVATE KEY-----` satırına kadar hepsini seç (Ctrl+A), kopyala (Ctrl+C), **Secret** kutusuna yapıştır (Ctrl+V). Not Defteri'ni kaydetmeden kapat.

Adları büyük harfle, tam yukarıdaki gibi yaz. Eklenen değerler bir daha görünmez; yanlış girdiysen satırdaki kalem simgesiyle yeniden yazabilirsin.

## 6. İş akışını çalıştırmak

TestFlight iş akışı yalnızca `main` dalına alındıktan sonra listede görünür.

1. Depoda üstteki **Actions** sekmesine tıkla.
2. Soldaki listede **TestFlight**'ı seç.
3. Sağda **Run workflow** düğmesine bas; açılan kutuda **Branch: main** seçili kalsın, yeşil **Run workflow**'a bas.
4. Birkaç saniye sonra listede yeni bir satır belirir; üstüne tıklarsan ilerlemeyi görürsün. Yaklaşık 15–30 dakika sürer.
   - Yeşil tik: uygulama TestFlight'a yüklendi. Apple'ın işlemesi 5–30 dakika daha sürer.
   - Gri (atlandı) ve "TestFlight atlandi: su gizli anahtarlar eksik" notu: 5. adımdaki dört anahtardan biri eksik ya da adı yanlış yazılmış.
   - Kırmızı çarpı: bir şey ters gitti. Çalışmanın sayfasındaki kırmızı adımı açıp ilk "error" satırını bana gönder; sayfanın altındaki **Artifacts** bölümünde `testflight-gunlukleri` dosyası da olur.

Her çalıştırma yeni bir derleme numarası alır. Başarısız bir çalışmayı **Re-run jobs** ile değil, yeniden **Run workflow** ile dene; aynı numara ikinci kez yüklenemez.

## 7. TestFlight uygulamasıyla iPhone'a kurmak

**App Store Connect'te kendini test edici yap (yalnızca ilk sefer):**

1. https://appstoreconnect.apple.com → **Apps** → **Starboard** → üstteki **TestFlight** sekmesi.
2. Derleme listede **Processing** yazıyorsa bekle; **Ready to Submit** ya da **Ready to Test** olunca devam et **(emin değilim: durum metni farklı olabilir)**.
3. Soldaki **Internal Testing** başlığının yanındaki **+** düğmesine bas, gruba bir ad ver (ör. `Ben`), **Create**.
4. Grubun sayfasında **Testers** yanındaki **+** düğmesine bas, kendi adını işaretle, **Add**.
5. Aynı sayfada **Builds** bölümüne derlemeyi ekle **(emin değilim: grup oluşturulurken "Enable automatic distribution" kutusu işaretliyse yeni derlemeler kendiliğinden eklenir)**.

**iPhone'da:**

1. App Store'dan **TestFlight** uygulamasını kur (Apple'ın kendi uygulaması, ücretsiz).
2. Apple hesabına gelen "Starboard is ready to test" e-postasını iPhone'da aç ve **View in TestFlight**'a dokun. E-posta gelmezse TestFlight uygulamasını açman yeterli; Starboard listede görünür (TestFlight'ta oturum açtığın Apple hesabı, geliştirici hesabıyla aynı olmalı).
3. **Install**'a dokun. Starboard ana ekrana gelir.
4. TestFlight derlemeleri 90 gün geçerlidir; yeni bir sürüm yüklediğinde TestFlight **Update** der.

Kurduktan sonra denenecekler ROADMAP Faz 3'teki "gerçek iPhone'da dene" maddelerinde.

## Sorun çıkarsa

- **"Your team has no devices from which to generate a provisioning profile"**: Xcode'un otomatik imzalaması bazen ekipte en az bir kayıtlı iPhone ister. iPhone'un UDID'sini (cihaz kimliği) https://developer.apple.com/account → **Certificates, IDs & Profiles** → **Devices** → **+** ile ekle, sonra iş akışını yeniden çalıştır. UDID'yi Windows'ta bulmanın yolu: iPhone'u kabloyla bağlayıp **Apple Devices** (ya da iTunes) uygulamasında **Serial Number** yazısına tıklamak, yazı UDID'ye döner **(emin değilim: Apple Devices uygulamasında da aynı şekilde çalıştığını deneyemedim)**. Takılırsan bana sor.
- **Sertifika oluşturulamadı / izin hatası** (ör. "Cloud signing permission error", "not allowed to create certificates"): API anahtarının rolü yetmiyor olabilir. 3. adımı **Access: Admin** ile tekrarla, `ASC_KEY_ID` ve `ASC_KEY_P8`'i yenisiyle değiştir. Eski anahtarı **Revoke** ile iptal et.
- **"No suitable application records were found"**: 1. adımdaki uygulama kaydı yok ya da Bundle ID farklı.
- **HealthKit ile ilgili imza hatası**: 2. adımı kontrol et.
- **Derleme yüklendi ama TestFlight'ta "Missing Compliance" yazıyor**: olmamalı (uygulama şifreleme beyanını kendisi yapıyor). Olursa derlemeye tıkla, şifreleme sorusuna **None of the algorithms mentioned above** benzeri "özel şifreleme yok" seçeneğini işaretle **(emin değilim: seçeneğin metni)**.
