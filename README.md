# Suat Ahmet — Kişisel Portfolyo Sitesi

Kendimi ve çalışmalarımı tanıtmak için sıfırdan yaptığım tek sayfalık portfolyo
sitesi. Tasarımından yayına alınmasına kadar her adımı tek başıma kurguladım.

**🔗 Canlı site:** [suatahmetportfolyo.netlify.app](https://suatahmetportfolyo.netlify.app)

---

## Neler var

**Dört görünümlü tek sayfa.** Ana Sayfa, Hakkımda, Deneyim, Projeler ve İletişim
ayrı sayfalar değil; sekmeye basınca yatay olarak kayan görünümler. Sayfa
yeniden yüklenmiyor, ama adres çubuğu yine de güncelleniyor (`#projeler` gibi) —
yani her sekme paylaşılabilir ve tarayıcının geri tuşu çalışıyor.

**Veri odaklı içerik.** Projeler ve deneyim kayıtları HTML'e elle yazılmıyor;
`projeler.js` içindeki iki listeden üretiliyor. Bir proje eklediğinde kartı,
detay sayfası, ana sayfadaki öne çıkan satırı ve üstteki sayaç birlikte
güncelleniyor.

**Açık / koyu tema.** Seçim `localStorage`'a yazılıyor, sonraki ziyarette
hatırlanıyor. Mobil tarayıcı çubuğunun rengi de temayla birlikte değişiyor.

**Karşılama animasyonu.** İlk girişte bir kez oynuyor; tema hatırlandığında
tekrar gösterilmiyor.

**Proje detayları modal olarak.** Kart tıklanınca sitenin üstünde açılıyor,
adres `#proje-1` oluyor, geri tuşu kapatıyor. İçindeki galeriden görseller tam
ekran büyütülebiliyor.

**JavaScript kapalıyken de çalışıyor.** Site tamamen JS'e bağlı olduğu için,
JS çalışmazsa devreye giren sade bir kartvizit sayfası var — ziyaretçi en
azından kim olduğumu öğrenip bana ulaşabiliyor.

---

## Erişilebilirlik ve performans

- Klavyeyle gezilebiliyor: Tab'a ilk basışta "ana içeriğe geç" bağlantısı çıkıyor
- Sekme değişimi ekran okuyuculara bildiriliyor (`aria-live`)
- Dokunma hedefleri mobilde en az 44×44 piksel
- `prefers-reduced-motion` açıkken animasyonlar devre dışı
- Yazı tipleri kendi sunucumuzdan (üçüncü tarafa istek yok), `unicode-range` ile
  Türkçe karakterler doğru kesimden geliyor
- Görseller WebP; eksik görseller yerine yer tutucu görünüyor, sayfa bozulmuyor
- Güvenlik başlıkları ve içerik güvenlik politikası (CSP) `_headers` dosyasında

---

## Kullanılan teknolojiler

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)

Kütüphane veya çatı (framework) kullanılmadı — hepsi düz HTML, CSS ve
JavaScript. Derleme adımı yok.

---

## Dosya düzeni

```
├── index.html          Sitenin tamamı (dört görünüm, modallar)
├── style.css           Bütün stiller, iki tema
├── script.js           Görünüm geçişleri, animasyonlar, modal, galeri
├── projeler.js         PROJELER ve DENEYIM listeleri — içerik burada
├── fonts.css           Yazı tipi tanımları
├── fonts/              woff2 dosyaları
├── images/proje-N/     Proje görselleri (kapak · 1 · 2 · 3)
├── 404.html            Kendi başına duran hata sayfası
├── _headers            Netlify: önbellek ve güvenlik başlıkları
├── robots.txt
├── site.webmanifest
└── NOTLAR.md           Bakım notları: birbirine bağlı yerler
```

---

## Çalıştırmak

Derleme gerekmiyor. Depoyu indirip `index.html` dosyasını tarayıcıda açman
yeterli. Yazı tiplerinin ve görsellerin doğru yüklenmesi için yerel bir sunucu
üzerinden açmak daha sağlıklı — VS Code kullanıyorsan **Live Server** eklentisi
işi görüyor.

Yayına almak için klasörün tamamını Netlify'a sürüklemek yeterli: derleme
komutu yok, yayın dizini kök.

---

## İçeriği değiştirmek

Proje ve deneyim eklemek için yalnızca `projeler.js` yeterli; `index.html`'e
dokunmaya gerek yok. Dosyanın içinde ikisi için de hazır şablon ve açıklama var.

Renk paleti, animasyon süreleri gibi birbirine bağlı yerler `NOTLAR.md`
dosyasında listeli — bir değeri değiştirmeden önce oraya bakmakta fayda var.

---

## Yapım süreci

18–28 Ağustos 2026 arasında, on günde yapıldı. Tasarım aracı kullanmadım;
hangi öğenin nerede duracağını ve nasıl hareket edeceğini önce zihnimde
kurgulayıp koda öyle geçtim.

---

**Suat Ahmet Avşar**
[suatahmetavsarofficial@gmail.com](mailto:suatahmetavsarofficial@gmail.com) ·
[LinkedIn](https://www.linkedin.com/in/suat-ahmet-avşar/) ·
[Bionluk](https://bionluk.com/suatahmetavsar)
