// =====================================================================
//  SİTE İÇERİĞİ — Tüm metinleri buradan düzenleyin.
//  Ana sayfa (index.html) bu dosyayı okur.
//  Görseller için: media/ klasörüne koyup yolunu yazın, yoksa null bırakın.
// =====================================================================

window.SITE = {
  // ---------- Kişisel bilgiler ----------
  person: {
    name: 'Suat Ahmet Avşar',
    initials: 'SA',
    title: 'Web Geliştirici',
    lead: 'Markalar ve şirketler için fikirleri sade, hızlı ve kullanışlı web deneyimlerine dönüştürüyorum.',
    photo: null, // örn. 'media/profil.webp'
    about: [
      'Merakla kod yazıyor, detaylara özen gösteriyorum. Hem kullanıcı arayüzü hem de arka uç tarafında kendimi geliştirmeye devam ediyorum.',
      'Sade, hızlı ve sürdürülebilir kod yazmayı; bir problemi en anlaşılır şekilde çözmeyi önemsiyorum. Yeni araçlar denemekten ve öğrendiklerimi küçük projelere dönüştürmekten keyif alıyorum.'
    ],
    location: 'İstanbul, Türkiye',
    education: 'Bilgisayar Programcılığı (Önlisans)',
    email: 'suatahmetavsarofficial@gmail.com',
    // icon: icons/ klasöründeki logo + üzerine gelince açılan marka rengi (style.css .social-*)
    socials: [
      { label: 'GitHub', url: 'https://github.com/suatahmet07', icon: 'github' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/suat-ahmet-av%C5%9Far-77b844431/', icon: 'linkedin' },
      { label: 'Bionluk', url: 'https://bionluk.com/suatahmetavsar', icon: 'bionluk' }
    ]
  },

  // ---------- Hakkımda kitabı (projelerden sonra gelen 3D kitap) ----------
  // Her sayfa bir yaprak: sol sayfada başlık (yıl, şirket), sağ sayfada ayrıntı.
  // Yaprak sayısı = sayfa sayısı; eklediğiniz her öğe kitaba bir yaprak ekler.
  book: {
    cover: { title: 'HAKKIMDA', note: 'Suat Ahmet Avşar' },
    // Sıra: eskiden yeniye — en yeni durak en sonda, "Devamı yazılıyor…" sayfasından hemen önce.
    // İsteğe bağlı: label ("POZİSYON" yerine) ve listLabel ("ÖNE ÇIKANLAR" yerine) sayfanın küçük başlıklarını değiştirir.
    pages: [
      {
        years: 'Diller ve araçlar', company: 'Becerilerim', place: '',
        label: 'BECERİLER', listLabel: 'KULLANDIKLARIM',
        role: 'Yazılım ve veri tabanı',
        summary: '',
        highlights: [
          'HTML', 'CSS', 'JavaScript', 'Three.js', 'Responsive tasarım',
          'Python', 'MySQL', 'SQL',
          'Git ve GitHub', 'Netlify', 'VS Code', 'Yapay zeka araçları (Claude)'
        ]
      },
      {
        years: '2025 — Günümüz', company: 'Atatürk Üniversitesi', place: 'Açıköğretim · Önlisans',
        role: 'Bilgisayar Programcılığı',
        summary: 'İki yıllık önlisans programında ikinci sınıftayım. Web geliştirmeyi ise bu programdan bağımsız olarak, kendi başıma öğreniyorum.',
        highlights: []
      },
      {
        years: 'Haz 2026 — Eki 2026', company: 'Önder Bilgisayar Kursu', place: 'İstanbul · Sertifika',
        role: 'Yazılım ve Veri Tabanı Uzmanlığı',
        summary: 'MEB onaylı, dört aylık eğitimi tamamlayıp sertifikamı aldım. Ön yüzden veri tabanına kadar web yazılımının temel araçlarında yetkinlik kazandım.',
        highlights: ['MEB onaylı sertifika', '100 saat: 50 teorik, 50 uygulama', 'Ön yüz, arka uç ve veri tabanı']
      },
      {
        years: 'Ağu 2026 — Günümüz', company: 'Kişisel Projeler', place: '',
        role: 'Web Geliştirici',
        summary: 'Kursta öğrendiklerimi projeye dönüştürüyorum. İlki portfolyo sitem oldu: tasarımından yayına alınmasına kadar on günde tek başıma yaptım. Birçok araştırma yaparak kendimi yazılım ve web dünyasında geliştiriyorum. Şimdi de yapay zeka araçlarını kullanarak siteler tasarlamaya, geliştirmeye ve yayınlamaya devam ediyorum.',
        highlights: []
      }
    ],
    end: { title: 'Devamı yazılıyor…' }
  },

  // ---------- Projeler (karta tıklanınca proje bilgileri açılır) ----------
  // slug: adres çubuğunda görünen kısa ad → index.html#proje-slug
  projects: [
    {
      slug: 'portfolyo',
      name: 'Eski Portfolyo Sitem',
      client: 'Kişisel proje',
      year: '2026',
      role: 'Kurgu, Tasarım, Geliştirme ve Yayınlama',
      category: 'Kişisel Site',
      url: 'https://suatahmetportfolyoold.netlify.app/', // canlı site linki (eski site; yeni site suatahmetportfolyo adresinde)
      repo: 'https://github.com/suatahmet07/Suat-Ahmet-Portfolyo', // kaynak kod linki (varsa)
      cover: 'media/proje-1.jpg', // proje kartı görseli (tüm kartlar bu orana sabit: 1763×844)
      tags: ['HTML', 'CSS', 'JavaScript', 'Netlify'],
      summary: 'Web yazılımı sürecinde araştırıp öğrendiklerimle sıfırdan yaptığım ilk portfolyo sitem. Tasarımından yayına alınmasına kadar on günde, tek başıma yaptım.',
      problem: 'Web yazılımı kursunda birçok araştırma, çalışma ve denemeden sonra kendi portfolyo sitemi yapmaya ve yaptığım işleri burada toplamaya karar verdim.',
      solution: [
        'Başlamadan önce araştırma ve gözlem yaptım; her öğenin yerini ve hareketini önce zihnimde kurguladım',
        'Ana Sayfa, Hakkımda, Deneyim, Projeler ve İletişim: sayfa yenilenmeden yatay kayan görünümler',
        'Açık / koyu tema, tek seferlik karşılama animasyonu ve veriden üretilen proje listesi'
      ],
      results: [
        { value: '10 gün', label: 'tasarımdan yayına' },
        { value: 'Tek kişi', label: 'kurgu, tasarım, kod' },
        { value: 'Yayında', label: 'Netlify üzerinde' }
      ],
      gallery: []
    },
    {
      slug: 'biyoportfolyo',
      name: 'Biyoportfolyo',
      client: 'Yakında',
      year: 'Yakında',
      role: 'Ayrıntılar yakında',
      category: 'Yakında',
      url: '#', // canlı bağlantı yayına alınınca buraya
      repo: null,
      cover: 'media/proje-2.jpg',
      tags: [],
      summary: 'Üzerinde çalıştığım yeni bir proje. Ayrıntılar çok yakında burada olacak.',
      problem: 'Yakında',
      solution: [],
      results: [],
      gallery: []
    },
    {
      slug: 'proje-uc',
      name: 'Proje Üç',
      client: 'Müşteri Adı',
      year: '2024',
      role: 'Tasarım & Geliştirme',
      category: 'Landing Page',
      url: '#',
      repo: null,
      cover: null, // görsel eklenene kadar yer tutucu gösterilir
      tags: [],
      summary: 'Projenin ne yaptığını ve hangi sorunu çözdüğünü anlatan kısa bir açıklama.',
      problem: 'Müşterinin yaşadığı sorun neydi?',
      solution: [],
      results: [],
      gallery: []
    },
    {
      slug: 'proje-dort',
      name: 'Proje Dört',
      client: 'Müşteri Adı',
      year: '2023',
      role: 'Tasarım & Geliştirme',
      category: 'Web Uygulaması',
      url: '#',
      repo: null,
      cover: null, // görsel eklenene kadar yer tutucu gösterilir
      tags: [],
      summary: 'Projenin ne yaptığını ve hangi sorunu çözdüğünü anlatan kısa bir açıklama.',
      problem: 'Müşterinin yaşadığı sorun neydi?',
      solution: [],
      results: [],
      gallery: []
    },
    {
      slug: 'proje-bes',
      name: 'Proje Beş',
      client: 'Müşteri Adı',
      year: '2023',
      role: 'Tasarım & Geliştirme',
      category: 'Kurumsal Web Sitesi',
      url: '#',
      repo: null,
      cover: null, // görsel eklenene kadar yer tutucu gösterilir
      tags: [],
      summary: 'Projenin ne yaptığını ve hangi sorunu çözdüğünü anlatan kısa bir açıklama.',
      problem: 'Müşterinin yaşadığı sorun neydi?',
      solution: [],
      results: [],
      gallery: []
    }
  ]
};
