# Bakım Notları

Bu dosya, sitede **birbirine bağlı** yerleri listeler. Buradaki değerlerden
birini değiştirdiğinde eşi de değişmeli — yoksa site hata vermez, sessizce
yanlış davranır. En zor bulunan hatalar bu türdendir.

---

## 1. Renk paleti üç yerde tanımlı

Ana renkleri (`--bg`, `--accent`, `--text-primary` ...) değiştirirsen:

| Dosya | Yer | Ne yapmalı |
|---|---|---|
| `style.css` | `:root` ve `body[data-theme="light"]` | Asıl kaynak, önce burayı değiştir |
| `404.html` | `<style>` içindeki `:root` ve `html[data-theme="light"]` | Aynı değerleri elle kopyala |
| `script.js` | `TEMA_CUBUK_RENGI` | Yalnızca zemin rengi (`--bg`): koyu ve açık |

404 sayfası `style.css`'i bilerek yüklemiyor (164 KB'lık dosyayı yalnızca
renkler için indirmemek adına), bu yüzden kopya kaçınılmaz.

`TEMA_CUBUK_RENGI`, telefonda tarayıcı çubuğunun rengini belirliyor. Güncel
tutulmazsa açık temada beyaz sayfanın üstünde koyu bir şerit kalır.

---

## 2. Animasyon süreleri CSS ile JS arasında eşleşiyor

| JS (`script.js`) | CSS (`style.css`) |
|---|---|
| `VIEW_TRANSITION_MS = 720` | `.view` geçiş süresi (`0.72s`) |
| `GLOW_DURATION_MS.dark = 900` | `glowShrink` animasyonu (`0.9s`) |

JS, geçiş bittikten sonra temizlik yapıyor. Süreler ayrışırsa görünüm
ekranın ortasında takılı kalabilir ya da içerik erken sıfırlanır.

---

## 3. Logo iki yerde çizili

`index.html` içindeki satır içi `<svg>` (monogram) ile `favicon.svg`
**aynı koordinatları** kullanıyor. Logoyu değiştirirsen ikisini birden
güncelle, yoksa sekme ikonu ile sayfadaki işaret birbirini tutmaz.

---

## 4. Dışarıdan bir şey eklersen CSP'ye de yaz

`_headers` dosyasındaki `Content-Security-Policy` satırı, dışarıdan betik,
stil, yazı tipi ve görsel yüklenmesini engelliyor. Yeni bir analitik aracı,
gömülü video, harita veya yazı tipi servisi eklersen adresini bu satıra da
eklemen gerekiyor.

Eklemezsen: tarayıcı sessizce engeller, sayfada bir şey görünmez ve
konsolda `refused to load` yazar. Bir şey "sebepsiz çalışmıyorsa" önce
buraya bak.

---

## 5. Görseller

- Konum: `images/proje-N/` → `kapak` · `1` · `2` · `3`
- Boyut: kapak **1920×960 (2:1)**, galeri **1600×1200 (4:3)**
- Oranlar önemli: site `object-fit: cover` kullanıyor, oran tutmazsa kenarlar kırpılır
- Uzantı: `projeler.js` sonundaki `GORSEL_UZANTISI` ile eşleşmeli (şu an `webp`)
- Dosya adları **küçük harf** olmalı. Windows büyük/küçük harfe bakmaz ama
  Netlify bakar — yerelde çalışıp yayında kaybolan görsellerin sebebi budur.

---

## 6. Proje ve deneyim verisi tek yerde

`projeler.js` içindeki `PROJELER` ve `DENEYIM` listeleri; kartlar, modallar,
zaman çizelgesi ve sayaçlar buradan üretiliyor. `index.html`'e proje eklemek
için dokunmaya gerek yok. Sayaçlar liste uzunluğundan geliyor, kendiliğinden
düzelir.

İsteğe bağlı iki alan: `problemEtiket` ve `problemBaslik`. Yazılmazsa detay
sayfasının ilk bölümü "Problem / Çözülmesi gereken neydi?" olarak çıkar.

---

## 7. CV butonu şu an kapalı

`index.html` içinde CV butonu yorum satırına alınmış durumda. Açmak için:
`cv.pdf` dosyasını kök dizine koy, butonu saran `<!--` ve `-->` işaretlerini
kaldır, "CV (Eklenecek)" yazısını güncelle.

---

## 8. Yayına alma

Statik site, derleme adımı yok.

- Netlify → Build command: **boş**, Publish directory: **kök (`.`)**
- Bütün dosyalar aynı seviyede olmalı; `_headers` ve `404.html` kökte
  değilse Netlify onları tanımaz ve sessizce yok sayar
- Alan adı değişirse `index.html`'deki `og:url`, `og:image` ve
  `twitter:image` adreslerini güncelle — yoksa paylaşım kartı görselsiz çıkar
