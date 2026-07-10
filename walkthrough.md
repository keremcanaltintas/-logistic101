# Kapıda Ödeme Sipariş Teyit ve Netgsm Arama Entegrasyonu - Walkthrough

Bu döküman, logistic101 CRM projenize yapılan Netgsm Click-to-Call (Tıkla Konuş) arama modülü entegrasyon çalışmalarını, yapılan değişiklikleri ve test yönergelerini özetler.

## Yapılan Değişiklikler

Müşteri teyit ve arama süreçlerinizi uçtan uca yönetebilmeniz için hem istemci (Frontend) hem de sunucu (Backend) katmanlarında Netgsm entegrasyonu tamamlanmıştır.

---

### 1. Frontend Arayüz ve Tasarım Güncellemeleri

* [index.html](file:///c:/Users/kerem/OneDrive/Desktop/yeni%20abi/index.html):
  * Sol menü (Sidebar) içerisine `"Kapıda Ödeme Teyit"` adında yeni bir navigasyon menüsü (`#nav-verification`) eklendi.
  * Ana ekran içerisine sipariş sorgulama barını, bakiye kartını, müşteri/teslimat bilgilerini (düzenlenebilir adres formu dahil), sipariş sepet detaylarını ve **Netgsm Arama Paneli** ile **Kendi Dahili / Cep Telefonu Giriş Alanını** barındıran `#verification-view` bölümü eklendi.
* [style.css](file:///c:/Users/kerem/OneDrive/Desktop/yeni%20abi/style.css):
  * Modülün CRM'in mevcut açık renkli, modern kart tasarımıyla tam uyumlu çalışması için gerekli stil kuralları dosyanın sonuna eklendi.
  * Aktif arama modunda yanıp sönen kırmızı arama göstergesi (`.call-pulse-dot` keyframes animasyonu) ve modern buton geçiş efektleri uygulandı.
* [script.js](file:///c:/Users/kerem/OneDrive/Desktop/yeni%20abi/script.js):
  * Navigasyon menüsünün tıklama dinleyicilerine yeni görünüm bağlandı.
  * `switchView()` mekanizmasına `verification` rotası tanımlandı ve geçişlerde sayfanın otomatik sıfırlanması sağlandı.
  * Sipariş sorgulama, inline adres düzenleme, **Netgsm Tıkla Konuş API tetikleme**, arama timer'ı ve teyit sonucunu kaydetme işlevleri yazıldı.

---

### 2. Backend API Rotaları (Vercel Serverless Functions)

Yeni backend işlevleri `api/` klasörü altına Node.js serverless fonksiyonları olarak oluşturuldu:

* [api/shopifyOrder.js](file:///c:/Users/kerem/OneDrive/Desktop/yeni%20abi/api/shopifyOrder.js):
  * İstek geldiğinde Turso veritabanında gerekli tablolar (`users`, `credit_logs`, `call_logs`) yoksa otomatik oluşturur ve `user_1` adında varsayılan bir demo kullanıcıyı (₺4250.00 bakiye ile) veri tabanına seed eder.
  * Sorgulama öncesi bakiye kontrolü yapar (En az ₺0.50 olmalı). Yeterliyse bakiyeyi düşer ve işlemi loglar.
  * Shopify API üzerinden siparişi aratır ve gerekli alanları filtreleyerek ön yüze döner.
* [api/netgsmCall.js](file:///c:/Users/kerem/OneDrive/Desktop/yeni%20abi/api/netgsmCall.js):
  * Arama başlatma bedelini (₺1.00 Kredi) bakiye sisteminden düşer.
  * Personelin cep telefonu/dahili numarasını ve müşterinin numarasını Netgsm Tıkla Konuş API'sine ileterek aramayı başlatır. Netgsm önce personeli, personel açtığında ise müşteriyi arayarak hatları birleştirir.
* [api/logCallOutcome.js](file:///c:/Users/kerem/OneDrive/Desktop/yeni%20abi/api/logCallOutcome.js):
  * Arama tamamlandığında arama sonuçlarını, Netgsm çağrı ID'sini ve görüşme detaylarını Turso'ya loglar.
  * Sonuç "Adres Güncellendi" ise yeni adresi Shopify'a göndererek siparişi günceller. Diğer durumlarda siparişe arama sonucunu tag (`Teyit_Basarili` vb.) ve not olarak ekler.

---

## Nasıl Test Edilir?

Geliştirme ortamınızda Shopify veya Netgsm anahtarları tanımlı olmasa bile sistemin **kesintisiz çalışabilmesi ve test edilebilmesi için akıllı demo fallback mekanizmaları kurgulanmıştır.**

### Adım 1: Arayüzü Açın ve Sorgulama Yapın
1. CRM paneline giriş yapın (Varsayılan şifre `123456`).
2. Menüden **"Kapıda Ödeme Teyit"** sekmesine tıklayın.
3. Arama çubuğuna projenizde tanımlı olan örnek bir sipariş kodunu girin (Örn: `1023` veya `1024`) ve **"Sorgula"** butonuna basın.
4. Sistem, cüzdan bakiyenizden `₺0.50` düşecek ve sipariş kartını ekrana getirecektir.

### Adım 2: Kendi Dahili / Cep Telefonunuzu Girin ve Netgsm ile Arayın
1. Ekrana gelen kartta, **"Kendi Dahili/Telefon Numaranız"** alanına çağrıyı karşılamak istediğiniz telefon numarasını girin (Örn: kendi cep telefonunuz).
2. **"Netgsm ile Ara"** butonuna basın.
3. Sağ alt köşede arama paneli açılacak ve durum `Bağlanıyor...` olacaktır. Bu süreçte Netgsm önce sizi arar, siz telefonunuzu açtığınızda ise müşteriyi arayıp köprüler.
4. Görüşme bağlandığında durum `Görüşme Aktif` olarak güncellenecek ve konuşma süresi sayacaktır (Bu sırada cüzdandan ₺1.00 arama başlatma ücreti düşecektir).
5. Görüşme bittiğinde **"Çağrıyı Sonlandır"** butonuna basın.
6. Görüşme Sonucu olarak teyit durumunu seçip notunuzu girin.
7. **"Doğrulamayı Tamamla ve Kaydet"** butonuna basarak işlemi bitirin.
8. Arayüz otomatik olarak sıfırlanacak ve üstte başarı bildirimi gösterilecektir.

---

## Üretim (Production) Dağıtımı İçin Yapılması Gerekenler

Uygulamanızı Vercel'e (production) dağıtırken aşağıdaki ortam değişkenlerini Vercel Dashboard üzerinden projenize eklemeyi unutmayın:

```env
# Shopify credentials
SHOPIFY_STORE_DOMAIN=magazaniz.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx

# Netgsm credentials
NETGSM_USERNAME=username_or_customercode
NETGSM_PASSWORD=your_netgsm_password
NETGSM_HEADER=your_approved_header

# Turso Database credentials
TURSO_DATABASE_URL=libsql://veritabani-adi.turso.io
TURSO_AUTH_TOKEN=ey...
```

---

## Yeni Arayüz Geliştirmeleri ve Mobil Uyum Çalışmaları

### 1. Premium Bildirim Merkezi & Destek (SSS) Modalı
- **Tasarım**: Navbar bell (çan) ikonuna basıldığında açılan, daha okunaklı ve opaklaştırılmış (`rgba(255, 255, 255, 0.94)`) frosted glass bildirim dropdown popup'ı.
- **Detaylar**: Mobil uyumlu (`max-width: calc(100vw - 32px)`), taşma yapmayan ve okundu olarak işaretleme / bildirim temizleme mantığı. Destek butonu için modern SSS modal kutusu.

### 2. Kapıda Ödeme Teyit Mobil Uyumluluğu
- **Tasarım**: Mobil genişliklerde (max-width: 768px) arama ve bakiye kartlarının alt alta (`flex-direction: column`) sıralanması.
- **Optimizasyon**: Bakiye kartı horizontal hizalaması ile küsuratlı para birimi değerlerinin tek satıra sığması sağlandı.

### 3. Ürünlerim Sayfası Mobil Düzenlemeleri
- **Tasarım**: Araç çubuğundaki ("Barkod Oluştur", "Excel İndir", "Rapor Oluştur") aksiyon butonlarının mobil görünümde tam ekran genişlikte alt alta düzenli listelenmesi.
- **Optimizasyon**: Pasif Ürünler ve Seçim Modu toggle switch'lerinin sol etiket, sağ buton şeklinde grid satırları olarak hizalanması ve tablonun yatayda kaydırılabilir hale getirilmesi (`max-width: 100% !important` table-responsive).

### 4. Hızlı Adres Yükleme Sistemi (Gönderici & Alıcı Adres Defteri)
- **Tasarım**: Depoya Ürün Gönder formundaki "Gönderici Bilgileri" ve "Alıcı Bilgileri" başlıklarının yanına **"Adres Defteri"** butonu entegre edildi.
- **Detaylar**: Buton tıklandığında açılan hızlı adres seçim modalı ve tek tıkla Ad, Telefon, İl, İlçe, Adres alanlarının otomatik doldurulması.

### 5. Yeni "Adres Defteri" Sidebar Yönetim Sayfası
- **Tasarım**: Sol sidebar menüsüne `"Adres Defteri"` adında yeni bir navigasyon menüsü (`#nav-address-book`) eklendi.
- **Özellikler**:
  - **"Depo Konumları"** ve **"Alıcı Konumları"** sekmeleri arası dinamik geçiş.
  - Adres başlığı, Adres No, Gönderici Adı, Telefonu, E-Postası, Ülkesi, İli, İlçesi ve açık adresi listesi içeren modern kart ızgarası (Grid).
  - Seçilen konumu **Ana Depo Yap** (Varsayılan adres olarak işaretleme) özelliği ile aktif vurgulu sınır çizgisi (`is-main`).
  - Sağ üstte **Toplu Adres Ekle** ve **Yeni Adres Ekle** aksiyon butonları ile yeni adres kaydetme formu.
  - Kartlarda adres silme (Trash can) işlevi.

---

## Detaylı Doğrulama Listesi (Verification Checklist)

1. **Sidebar Navigasyon**: Sidebar üzerindeki tüm sekmelerin (Dashboard, Siparişlerim, Kapıda Ödeme Teyit, Ürünlerim, Depoya Ürün Gönder, Adres Defteri vb.) sorunsuz yüklendiğini ve geçiş yaptığını doğrulayın.
2. **Hızlı Adres Doldurma**: "Depoya Ürün Gönder" sayfasında "Standart Teslimat"ı seçin. Gönderici ve Alıcı Adres Defteri butonlarına tıklayarak kayıtlı adreslerin alanları anında doldurduğunu gözlemleyin.
3. **Adres Defteri Yönetimi**: Sidebar'daki "Adres Defteri" sayfasına girin. Kart listelerini, "Depo / Alıcı Konumları" sekmelerini, arama çubuğunu, "Yeni Adres Ekle" formunu ve "Ana Depo Yap" tetikleyicilerini test edin.
4. **Mobil Responsive Kontroller**: Tarayıcıyı mobil boyutlara getirin. Navbar arama barının küçüldüğünü/kapandığını, durum kartlarının, sipariş listelerinin ve adres kartlarının taşma yapmadan alt alta hizalandığını doğrulayın.
5. **Bildirim Popup**: Navbar çan ikonuna tıklayıp bildirimleri görüntüleyin. Tümünü okundu olarak işaretleyip dışarı tıklayarak kapatın.
6. **Net Kâr Kartı Kenarlığı**: Raporlar sayfasındaki "Net Kâr" kartının kenarlığının kesikli (dashed) yerine düz (solid) çizgi şeklinde görüntülendiğini doğrulayın.
7. **Mobil Üst Panel Mağazam Butonu**: Mobil ekran boyutlarında navbar'ın sağındaki "Mağazam" butonunun kesilmeden/kaybolmadan ikon, metin ve aşağı ok işaretiyle birlikte bir bütün halinde kapsül şeklinde göründüğünü doğrulayın.
8. **Mobil Sidebar Arka Plan Kayma Önleyici (Scroll Lock)**: Mobil görünümde sol hamburger menüye tıklayarak sidebar'ı açın. Menü içerisinde aşağı yukarı kaydırma (scroll) yaptığınızda, arkadaki ana sayfa içeriğinin/arka planın sabit kaldığını ve oynamadığını doğrulayın.
