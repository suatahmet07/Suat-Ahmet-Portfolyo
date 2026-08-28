/* ============================================================
   PROJELERİN TAMAMI — TEK DOSYA
   ============================================================
   Sitedeki bütün proje bilgisi burada. Bir projeyi buradan
   değiştirdiğinde şu YEDİ yer birden güncellenir:
     • Projeler sekmesindeki klasör kartı (ad, kategori, sıra numarası)
     • Klasörün içinden açılan üç görsel
     • Ana sayfadaki "Seçilmiş İşler" satırı
     • O satırın üzerine gelince beliren önizleme görseli
     • Karta tıklayınca açılan detay modalının tamamı
     • Modaldaki galeri ve büyütülebilir görseller
     • Sayfanın üstündeki proje sayacı ("02 Proje" gibi)
   index.html'e ARTIK DOKUNMAN GEREKMİYOR.

   ------------------------------------------------------------
   YENİ PROJE EKLEMEK
   ------------------------------------------------------------
   Aşağıdaki listeye yeni bir { ... } bloğu ekle. Sıra neyse sitede de
   o sırayla görünür; başa almak istersen bloğu yukarı taşı. Silmek
   istersen bloğu sil — sayaç ve numaralar kendiliğinden düzelir.

   ------------------------------------------------------------
   GÖRSELLER
   ------------------------------------------------------------
   Her projenin görselleri KENDİ KLASÖRÜNDE ve sabit isimlerle durur:

       images/proje-1/kapak.jpg   → modaldeki geniş kapak görseli
       images/proje-1/1.jpg       → galeri 1  (ayrıca klasör kağıdı)
       images/proje-1/2.jpg       → galeri 2  (ayrıca klasör kağıdı)
       images/proje-1/3.jpg       → galeri 3  (ayrıca klasör kağıdı)

   Yani proje başına DÖRT dosya. Klasör kartındaki üç kağıt ile
   galerideki üç görsel aynı dosyaları kullanıyor; ayrıca kopya
   hazırlamana gerek yok.

   Klasör adını "klasor" alanından değiştirebilirsin. Görseli olmayan
   yerler boş kalmaz: renk geçişli bir yer tutucu görünür, site düzgün
   çalışmaya devam eder. Yani hepsini bir anda hazırlamak zorunda
   değilsin.

   UZANTI DERDİ YOK: dosyan .jpg de olsa .png de olsa .webp de olsa
   çalışır — site sırayla deneyip bulur. Biri jpg biri png olsa bile
   sorun değil. (Çoğunlukla png kullanıyorsan, en alttaki
   GORSEL_UZANTISI değerini "png" yapman yalnızca aramayı hızlandırır.)

   ------------------------------------------------------------
   BAĞLANTILAR
   ------------------------------------------------------------
   "canli" ve "github" alanlarını BOŞ bırakırsan o buton hiç
   basılmaz — çalışmayan bir buton, olmayan butondan kötüdür.

   ------------------------------------------------------------
   İLK BÖLÜMÜN BAŞLIĞINI PROJEYE GÖRE DEĞİŞTİRMEK
   ------------------------------------------------------------
   Detay modalındaki ilk bölüm varsayılan olarak şöyle çıkıyor:

       01 — Problem
       Çözülmesi gereken neydi?

   Bu, var olan bir aksaklığı düzeltmek için yapılan işlerde doğru
   soru. Ama sıfırdan kurduğun bir projede ortada bir "problem" yok;
   orada anlatılacak şey bir niyet. İki İSTEĞE BAĞLI alan bunun için:

       problemEtiket: "Neden Yaptım?",          → küçük italik etiket
       problemBaslik: "Bu projeye beni ne itti?" → altındaki büyük başlık

   Bir projeye bu alanları YAZMAZSAN varsayılan metinler çıkar; yani
   eski kayıtlara dokunmana gerek yok. İkisi birbirinden bağımsız —
   yalnızca etiketi değiştirip başlığı varsayılan bırakabilirsin.

   İkisini birlikte düşünmekte fayda var: etiketi "Neden Yaptım?"
   yapıp başlığı "Çözülmesi gereken neydi?" bırakırsan biri "neden",
   öteki "ne" sorar; okuyan iki farklı soruya bakar.
   ============================================================ */

const PROJELER = [
  {
    ad: "Kişisel Portfolyo Sitem",
    kategori: "Kişisel Site",
    yil: "2026",

    oneCikan: true,

    ozet:
      `Web yazılımı sürecinde araştırıp öğrendiğim bir çok şey ile kendi
      portfolyo sitemi yaptım. Sonuç: "Birçok araştırma ve harcanan günler
      sonunda şuanda gördüğünüz site ilk projemdir."`,

    kunye: {
      rol: "Kurgu & Tasarım & Geliştirme & Yayınlama",
      sure: "10 Gün",
      ekip: "Tek kişi",
      durum: "Yayınlandı"
    },

    baglantilar: {
      canli: "https://suatahmetportfolyo.netlify.app/",
      github: "https://github.com/suatahmet07/Suat-Ahmet-Portfolyo"
    },

    problemEtiket: "Başlangıç",
    problemBaslik: "Her şeyin başlangıcı.",

    problem:
      `Web yazılımı kursunda eğitime başladıktan sonra birçok araştırma,
       çalışma, test etme ve gelişimden sonra artık kendi portfolyo web
       sitemi yapmaya ve yaptığım işleri buraya eklemeye karar verdim.`,

    cozum:
      `Siteyi yapmaya başlamadan önce bir çok araştırma ve gözlem yaptım.
       Her şeyi fikir süzgecimden geçirdikten sonra sitemi yapmaya başladım.
       Sitemin şık, göze hoş gelen ve kullanıcı deneyimini iyi bir şekilde
       hissettiren bir proje olmasını istedim.`,

    sonuc:
      `Girişte gayet şık bir animasyon sizleri karşılıyor ve bu tek seferlik çalışıyor.
       Ardından her öge animasyonlu şekilde gelerek "Basit bir proje"den "Uğraşılmış bir çalışma!"
       olduğunu bizlere anlatıyor.`,

    etiketler: ["HTML", "CSS", "JavaScript"],

    klasor: "images/proje-1"
  },
];

/* ============================================================
   YENİ PROJE EKLEMEK — HAZIR ŞABLON
   ============================================================
   Aşağıdaki blok BİLEREK yorum içinde: sitede hiçbir etkisi yok, orada
   yalnızca kopyalanmak için duruyor. (Silinen yedi örnek projeden
   geriye kalan tek işe yarar şey buydu.)

   NASIL KULLANILIR
   1. Aşağıdaki { ... } bloğunu, süslü parantezleri dahil kopyala.
   2. Yukarıdaki PROJELER listesinde son projenin kapanış "}" işaretinden
      SONRA bir virgül koy ve bloğu yapıştır. Yani liste şöyle olmalı:

          const PROJELER = [
            { ...birinci proje... },
            { ...ikinci proje... },
            { ...yeni proje... }
          ];

      Son öğeden sonra virgül olmaz.
   3. "klasor" alanındaki numarayı yeni bir klasöre çevir
      (images/proje-3) ve o klasöre şu dört dosyayı koy:
      kapak.jpg · 1.jpg · 2.jpg · 3.jpg
      Görseller hazır değilse sorun değil — yer tutucu görünür, site
      çalışmaya devam eder.

   Sayaçlar ("02 Proje" gibi) listenin uzunluğundan geldiği için
   kendiliğinden düzelir; index.html'e dokunman gerekmiyor.

  {
    ad: "Projenin adı",
    kategori: "Kısa tür etiketi",
    yil: "2026",

    // Ana sayfadaki "Seçilmiş İşler" listesinde görünsün mü?
    oneCikan: false,

    ozet:
      `Bir cümleyle: bu proje ne yapıyor ve kimin işine yarıyor?`,

    kunye: {
      rol: "Tasarım & Geliştirme",
      sure: "3 hafta",
      ekip: "Tek kişi",
      durum: "Yayında"
    },

    // Boş bırakılan buton hiç basılmaz.
    baglantilar: {
      canli: "",
      github: ""
    },

    // İSTEĞE BAĞLI — sıfırdan kurulan projeler için. Bir sorunu
    // düzeltmek için yapılan projede bu iki satırı sil; varsayılan
    // "01 — Problem / Çözülmesi gereken neydi?" başlığı çıkar.
    problemEtiket: "Neden Yaptım?",
    problemBaslik: "Bu projeye beni ne itti?",

    problem:
      `Başlamadan önceki durum: ne eksikti, neden yaptın?`,

    cozum:
      `Attığın adımlar ve verdiğin kararlar — "şunu seçtim çünkü ..."`,

    sonuc:
      `Mümkünse bir sayı; yoksa ne öğrendiğin.`,

    etiketler: ["HTML", "CSS"],

    klasor: "images/proje-3"
  }

   ============================================================ */

const GORSEL_UZANTISI = "webp";


// DENEYİM / KARİYER — ZAMAN ÇİZELGESİ

const DENEYIM = [
  {
    tur: "Kişisel",
    baslangic: "Ağu 2026",
    bitis: "",
    devam: true,
    rol: "Kişisel Projeler",
    kurum: "Kendi çalışmalarım",
    yer: "",
    metin:
      `Kursta öğrendiklerimi projeye dönüştürüyorum. İlki, şu an okuduğun
       portfolyo sitesi: tasarımından yayına alınmasına kadar tek başıma
       yaptım — tema geçişi, sekme animasyonları ve veriden üretilen proje
       listesi dahil.`,
    etiketler: ["HTML", "CSS", "JavaScript", "Netlify"]
  },

  {
    tur: "Eğitim",
    baslangic: "Haz 2026",
    bitis: "",
    devam: true,
    rol: "Web Yazılımı Kursu",
    kurum: "Önder Bilgisayar Kursu",
    yer: "İstanbul",
    metin:
      `Ön uç ve arka ucu birlikte kapsayan (full stack) 16 haftalık bir
       programa devam ediyorum. HTML, CSS ve JavaScript bölümlerini
       tamamladım; Python ve MySQL sırada.`,
    etiketler: ["HTML", "CSS", "JavaScript"]
  },

  {
    tur: "Eğitim",
    baslangic: "2025",
    bitis: "",
    devam: true,
    rol: "Bilgisayar Programcılığı (Önlisans)",
    kurum: "Atatürk Üniversitesi — Açıköğretim",
    yer: "Uzaktan",
    metin:
      `İki yıllık önlisans programında ikinci sınıftayım. Web geliştirmeyi
       ise bu programdan bağımsız olarak, kendi başıma öğreniyorum.`,
    etiketler: []
  }
];

/* ============================================================
   YENİ DURAK EKLEMEK — HAZIR ŞABLON
   ============================================================
   Aşağıdaki blok yorum içinde: sitede hiçbir etkisi yok, yalnızca
   kopyalamak için duruyor.

   ------------------------------------------------------------
   EKLEMEK
   ------------------------------------------------------------
   1. Aşağıdaki { ... } bloğunu, süslü parantezleri dahil kopyala.
   2. Yukarıdaki DENEYIM listesinde, olmasını istediğin yere yapıştır.
      Liste EN YENİDEN EN ESKİYE doğru sıralı: en yeni işin en üstte.
   3. VİRGÜLLERE DİKKAT — en sık yapılan hata burada:
      kayıtlar arasında virgül VAR, en sonuncudan sonra YOK.

          const DENEYIM = [
            { ...en yeni... },
            { ...ortadaki... },
            { ...en eski... }
          ];

   ------------------------------------------------------------
   SİLMEK
   ------------------------------------------------------------
   Kaydın { ile } arasındaki bloğunu sil. Silinen kayıt sondaki ise,
   ondan bir önceki kaydın } işaretinden sonraki virgülü de kaldır.

   ------------------------------------------------------------
   ELLE YAPMAN GEREKMEYEN ŞEYLER
   ------------------------------------------------------------
   Soldaki dikey hat, hattın dolan kısmı, durakların yanması, beliriş
   animasyonları ve üstteki "04 Durak" sayacı — hepsi kayıt sayısına
   göre kendiliğinden hesaplanıyor. index.html'e ya da style.css'e
   dokunman gerekmiyor.

   ------------------------------------------------------------
   ALANLAR
   ------------------------------------------------------------
   tur        Solda görünen küçük etiket. Serbest metin:
              "İş", "Serbest", "Eğitim", "Staj", "Gönüllü" ...
   baslangic  "2024" ya da "Oca 2024" — nasıl yazarsan öyle görünür.
   bitis      Bitmiş kayıtta bitiş tarihi. Devam ediyorsa boş bırak.
   devam      true ise tarihin sonuna otomatik "Günümüz" yazılır.
   rol        Kalın başlık: unvanın ya da yaptığın işin adı.
   kurum      Altındaki satır: şirket / platform / okul.
   yer        İsteğe bağlı. Boş bırakırsan kurumun yanına bir şey eklenmez.
   metin      Bir-iki cümle. "Çalıştım" değil, "şunu yaptım" yaz.
   etiketler  Yuvarlak rozetler. [] bırakırsan hiç basılmaz.

  {
    tur: "İş",
    baslangic: "2026",
    bitis: "",
    devam: true,
    rol: "Yaptığın işin adı",
    kurum: "Şirket / okul / platform",
    yer: "Şehir ya da Uzaktan",
    metin:
      `Orada tam olarak ne yaptın, ne öğrendin? Bir-iki cümle yeter.`,
    etiketler: ["HTML", "CSS"]
  }

   ============================================================ */
