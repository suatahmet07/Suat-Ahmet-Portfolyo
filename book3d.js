// ===== 3D kariyer kitabı (Three.js) =====
// Proje kartlarından sonra gelir. Bölüm ekrana yapışır ve kaydırdıkça:
//   1. Dev "DENEYİM/KARİYER" yazısı soldan sağa ve aynı anda yukarı doğru geçer
//   2. Yazı kaybolunca kitap aşağıdan dönerek gelir (bilgisayar sahnesindeki gibi)
//   3. Kitap düzleşir, ortasından açılır ve hafifçe ekrana yaklaşıp sabitlenir
// Sayfalar fareyle tutup sürükleyerek, dokunmatikte sağa sola kaydırarak, klavyede ok tuşlarıyla çevrilir.
// Model dosyası yok: kapak, sayfa blokları ve kavislenen yapraklar burada kodla kurulur.
// İçerik data.js → SITE.book
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const section = document.getElementById('kitap');
const canvas = document.getElementById('bookCanvas');
const titleEl = document.getElementById('bookTitle');
const hintEl = document.getElementById('bookHint');
const BOOK = window.SITE && window.SITE.book;

// Telefonda sayfalar büyük yazıyla yeniden dizilir (phoneSpreads). Satırlar gerçek harf genişliğiyle
// bölündüğü için kitap, yazı tipleri geldikten sonra kurulur (en fazla 3 sn beklenir).
const PHONE = window.innerWidth <= 640;
if (section && canvas && BOOK) {
  if (PHONE && document.fonts) {
    const sample = 'aAşğıİüöç';
    Promise.race([
      Promise.all(['400 64px Outfit', '500 42px Outfit', '500 58px Outfit', '600 72px Poppins', '900 230px Poppins'].map(f => document.fonts.load(f, sample))),
      new Promise(r => setTimeout(r, 3000))
    ]).catch(() => {}).then(init);
  } else init();
}

function init() {
  // ---- Evreler: bölümün üstü ekranın altına geldiği andan itibaren kaydırılan mesafe (ekran boyu) ----
  // Bölüm boyu style.css'te 470vh: sahne s = 1'de yapışır, s = 4.7'de çözülür
  const TITLE = [0, 1.5];      // dev yazı geçer
  const ENTER = [1.5, 2.6];    // kitap ekranın altından yükselir
  const ROTATE = [1.5, 3.2];   // kitap çapraz eğik eksende döner, eğim düzelerek karşıya oturur
  const TILT_X = 0.38;         // dönüş başındaki öne eğim (radyan)
  const TILT_Z = 0.42;         // dönüş başındaki yana eğim: çapraz dönüş hissi verir
  const OPEN = [3.2, 4.1];     // kitap açılır, kamera hafifçe yaklaşır (sonrası: sabit, sayfalar çevrilebilir)
  // Bölüm boyu style.css'te 470vh: sahne s = 4.7'de çözülür (açık kitap 4.1–4.7 arası sabit durur)
  const EXIT = [4.6, 5.5];     // sahne yukarı kayarken kitap dönmeden kapanır; ardından iletişim gelir
  const TURN = Math.PI * 1.5;  // girişteki toplam dönüş (270°)
  const FOLLOW = 0.12;         // kaydırmayı takip yumuşaklığı
  const FOV = 28;

  // ---- Kitap ölçüleri (birim: sayfa yüksekliği = 1) ----
  const PW = 0.72, PH = 1;     // sayfa
  const M = 0.025;             // kapağın sayfalardan taşma payı
  const C = 0.022;             // kapak kalınlığı
  const PB = 0.11;             // sayfa bloğunun toplam kalınlığı (kalın kitap)
  const T = 2 * C + PB;        // kapalı kitabın kalınlığı
  const ZT = C + PB / 2;       // açıkken sayfa yüzeyinin yüksekliği (ve kapağın menteşesi)
  const E = 0.0022;            // üst üste yatan yaprakların arası
  const SEG = 40;              // yaprak başına dilim (fazlası daha yumuşak kavis)
  const CURL = 0.9;            // çevrilirken yaprağın kavislenme miktarı (radyan)

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  const clamp = (x, a = 0, b = 1) => Math.min(Math.max(x, a), b);
  const span = (x, [a, b]) => clamp((x - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = x => 1 - Math.pow(1 - x, 3);
  const easeInOut = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const easeSine = x => 0.5 - Math.cos(Math.PI * x) / 2;

  // ---- Çizici, sahne, ışık ----
  // Piksel yoğunluğu 1.5'te (zayıf cihazda 1'de) sınırlanır; zayıf cihazda kenar yumuşatma ve
  // derinin pahalı parlaklık katmanları (sheen, clearcoat) kapalı
  const LOW = !!window.LOW_END;
  const DPR = () => Math.min(window.devicePixelRatio || 1, LOW ? 1 : 1.5);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !LOW });
  } catch (err) {
    window.fail3D('WebGL açılamadı');
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.75;
  const key = new THREE.DirectionalLight(0xfff0dc, 1.5);
  key.position.set(-1.2, 2, 3);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 50);
  const tilt = new THREE.Group();   // yükselme ve çapraz eğim (dönüş ekseni bununla eğilir)
  const root = new THREE.Group();   // kendi etrafında dönüş
  const book = new THREE.Group();   // kitabın kendisi; açılınca ortası (sırt) merkeze kayar
  root.add(book);
  tilt.add(root);
  scene.add(tilt);

  // =====================================================================
  //  Dokular: kapak ve sayfalar tuvale çizilir
  // =====================================================================
  const INK = '#201810', INK_SOFT = '#4A3524', WOOD = '#A07848', GOLD = '#D2AC66';
  const PAGE_W = 900, PAGE_H = Math.round(900 * PH / PW);
  const COVER_W = 900, COVER_H = Math.round(900 * (PH + 2 * M) / (PW + M));

  // Tuvalden doku. linear: renk değil veri (kabartma, pürüzlülük) · repeat: döşenen doku · flip: ayna
  function makeTex(w, h, draw, { flip = false, linear = false, repeat = null } = {}) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    tex.anisotropy = aniso;
    if (flip) { tex.repeat.x = -1; tex.offset.x = 1; } // arka yüz: ayna görüntüsünü düzelt
    if (repeat) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(repeat[0], repeat[1]); }
    tex.userData.draw = () => { const x = c.getContext('2d'); x.clearRect(0, 0, w, h); draw(x, w, h); tex.needsUpdate = true; };
    tex.userData.draw();
    return tex;
  }

  // Tekrarlanabilir rastgele sayı (her yüklemede aynı doku)
  const seeded = s => () => (s = (s * 16807) % 2147483647) / 2147483647;

  // Basit tekrarlanabilir gürültü
  function grain(x, w, h, alpha, n) {
    const rnd = seeded(7);
    for (let i = 0; i < n; i++) {
      x.fillStyle = rnd() > 0.5 ? `rgba(255,255,255,${alpha * rnd()})` : `rgba(0,0,0,${alpha * rnd()})`;
      x.fillRect(rnd() * w, rnd() * h, 2, 2);
    }
  }

  // ---- Deri: kabarcıklı (pebble) yüzey. Bir kez yükseklik haritası olarak çizilir, hem rengin
  //      tonlamasında hem kabartma haritasında dikişsiz döşenir ----
  const LEATHER_TILE = (() => {
    const S = 512, c = document.createElement('canvas');
    c.width = c.height = S;
    const x = c.getContext('2d');
    // Koyu zemin = kabarcıklar arasındaki çizgiler; sık, küçük, yumuşak kabarcıklar üstüne gelir
    x.fillStyle = '#5E5E5E';
    x.fillRect(0, 0, S, S);
    const r = seeded(11);
    for (let i = 0; i < 9000; i++) {
      const px = r() * S, py = r() * S, rad = 2.6 + r() * 4.2, b = 128 + Math.round(r() * 60);
      const sq = 0.65 + r() * 0.5, ang = r() * Math.PI;
      // kenardan taşan kabarcık karşı kenara da çizilir: doku dikişsiz döşenir
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        const cx = px + ox, cy = py + oy;
        if (cx < -rad || cx > S + rad || cy < -rad || cy > S + rad) continue;
        const g = x.createRadialGradient(cx - rad * 0.25, cy - rad * 0.25, 0, cx, cy, rad);
        g.addColorStop(0, `rgba(${b},${b},${b},0.95)`);
        g.addColorStop(1, 'rgba(70,70,70,0)');
        x.fillStyle = g;
        x.beginPath(); x.ellipse(cx, cy, rad, rad * sq, ang, 0, Math.PI * 2); x.fill();
      }
    }
    // ince kırışıklar
    x.lineCap = 'round';
    for (let i = 0; i < 220; i++) {
      const px = r() * S, py = r() * S, a = r() * Math.PI * 2, l = 10 + r() * 34;
      x.strokeStyle = `rgba(30,30,30,${0.18 + r() * 0.22})`;
      x.lineWidth = 0.6 + r() * 0.9;
      x.beginPath();
      x.moveTo(px, py);
      x.quadraticCurveTo(px + Math.cos(a + 0.6) * l * 0.5, py + Math.sin(a + 0.6) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l);
      x.stroke();
    }
    return c;
  })();

  // Deri rengi: kahve zemin, büyük yumuşak lekeler, kabarcık tonlaması, aşınmış açık kenarlar
  function leather(x, w, h, scale = 1) {
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#6B4327');
    g.addColorStop(0.55, '#5A361F');
    g.addColorStop(1, '#472A17');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    const r = seeded(5);
    for (let i = 0; i < 36; i++) {
      const cx = r() * w, cy = r() * h, rad = (0.08 + r() * 0.22) * Math.max(w, h);
      const lg = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
      lg.addColorStop(0, r() > 0.5 ? 'rgba(20,10,4,0.13)' : 'rgba(150,100,62,0.1)');
      lg.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = lg;
      x.fillRect(0, 0, w, h);
    }
    pattern(x, w, h, scale, 'overlay', 0.42);
    // Kenarlar sürtünmeyle açılmış
    const wear = Math.min(w, h) * 0.05;
    [[0, 0, wear, 0], [w, 0, w - wear, 0], [0, 0, 0, wear], [0, h, 0, h - wear]].forEach(([x0, y0, x1, y1]) => {
      const eg = x.createLinearGradient(x0, y0, x1, y1);
      eg.addColorStop(0, 'rgba(176,126,84,0.28)');
      eg.addColorStop(1, 'rgba(176,126,84,0)');
      x.fillStyle = eg;
      x.fillRect(0, 0, w, h);
    });
  }
  // Kabarcık deseniyle doldur (renk tonlaması ya da kabartma için)
  function pattern(x, w, h, scale, op = 'source-over', alpha = 1) {
    const p = x.createPattern(LEATHER_TILE, 'repeat');
    p.setTransform(new DOMMatrix().scale(scale));
    x.save();
    x.globalCompositeOperation = op;
    x.globalAlpha = alpha;
    x.fillStyle = p;
    x.fillRect(0, 0, w, h);
    x.restore();
  }

  // Kapaktaki yaldız (altın varak): renk, metal maskesi ve kabartma aynı çizimden üretilir
  function coverArt(x, w, h, color) {
    x.strokeStyle = color;
    x.fillStyle = color;
    x.lineWidth = 5;
    x.strokeRect(54, 54, w - 108, h - 108);
    x.lineWidth = 2;
    x.strokeRect(74, 74, w - 148, h - 148);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    // Başlık ortada, üstünde ve altında kısa yaldız çizgiler
    x.font = `900 ${fitFont(x, BOOK.cover.title, 900, 132, w - 240)}px Poppins`;
    x.fillText(BOOK.cover.title, w / 2, h * 0.47);
    x.fillRect(w / 2 - 90, h * 0.47 - 130, 180, 4);
    x.fillRect(w / 2 - 90, h * 0.47 + 120, 180, 4);
    x.font = '500 30px Outfit';
    spaced(x, BOOK.cover.note.toLocaleUpperCase('tr'), w / 2, h - 150, 6);
  }
  function drawCover(x, w, h) {
    leather(x, w, h, 1.6);
    coverArt(x, w, h, GOLD);
  }
  // Pürüzlülük (yeşil kanal) + metallik (mavi kanal): deri mat, yaldız parlak metal
  function coverRM(art) {
    return (x, w, h) => {
      x.fillStyle = 'rgb(0,196,0)';
      x.fillRect(0, 0, w, h);
      if (art) art(x, w, h, 'rgb(0,84,255)');
    };
  }
  // Kabartma: kabarcıklı deri; yaldız preslenmiş gibi içeride
  function coverBump(art) {
    return (x, w, h) => {
      pattern(x, w, h, 1.6);
      if (art) art(x, w, h, 'rgb(40,40,40)');
    };
  }
  // Arka kapak: yaldızsız, sadece çerçeve preslenmiş (kör baskı)
  const blindFrame = (x, w, h, color) => {
    x.strokeStyle = color;
    x.lineWidth = 6;
    x.strokeRect(54, 54, w - 108, h - 108);
  };

  // Sırt: yaldız bantlar ve dikine başlık
  const SPINE_W = 320;
  function spineArt(x, w, h, color) {
    x.fillStyle = color;
    for (const y of [0.07, 0.085, 0.915, 0.93]) x.fillRect(0, h * y, w, 5);
    x.save();
    x.translate(w / 2, h / 2);
    x.rotate(Math.PI / 2);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.font = '900 86px Poppins';
    x.fillText(BOOK.cover.title, 0, 0);
    x.restore();
  }

  // Metin sığana kadar yazı boyunu küçült
  function fitFont(x, text, weight, size, maxW) {
    for (; size > 20; size -= 4) { x.font = `${weight} ${size}px Poppins`; if (x.measureText(text).width <= maxW) break; }
    return size;
  }
  // Harf aralıklı tek satır (ortalı)
  function spaced(x, text, cx, y, gap) {
    const chars = [...text];
    const total = chars.reduce((s, c) => s + x.measureText(c).width, 0) + gap * (chars.length - 1);
    let px = cx - total / 2;
    const align = x.textAlign;
    x.textAlign = 'left';
    chars.forEach(c => { x.fillText(c, px, y); px += x.measureText(c).width + gap; });
    x.textAlign = align;
  }
  // Satır kaydırmalı paragraf; son satırın altını döndürür
  function para(x, text, px, y, maxW, lh) {
    let line = '';
    for (const word of String(text).split(' ')) {
      const test = line ? line + ' ' + word : word;
      if (x.measureText(test).width > maxW && line) { x.fillText(line, px, y); y += lh; line = word; }
      else line = test;
    }
    if (line) { x.fillText(line, px, y); y += lh; }
    return y;
  }

  // Kâğıt zemini: sırta doğru gölge, kenarda hafif ışık
  // Kâğıt: sıcak kırık beyaz, ince lifler, hafif lekeler, kenarlarda sararma, sırta doğru gölge
  // Bütün sayfalarda aynı kâğıt: her boyut ve sırt yönü için bir kez çizilir, sonra kopyalanır
  // (her sayfa için yeniden çizmek yüklenirken ana iş parçacığını yarım saniye kilitliyordu)
  const paperCache = new Map();
  function paper(x, w, h, spineLeft) {
    const key = `${w}x${h}${spineLeft ? 'L' : 'R'}`;
    let c = paperCache.get(key);
    if (!c) {
      c = document.createElement('canvas');
      c.width = w; c.height = h;
      paperDraw(c.getContext('2d'), w, h, spineLeft);
      paperCache.set(key, c);
    }
    x.drawImage(c, 0, 0);
  }
  function paperDraw(x, w, h, spineLeft) {
    x.fillStyle = '#F3EADA';
    x.fillRect(0, 0, w, h);
    const r = seeded(3);
    for (let i = 0; i < 12; i++) {
      const cx = r() * w, cy = r() * h, rad = (0.15 + r() * 0.3) * w;
      const lg = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
      lg.addColorStop(0, r() > 0.4 ? 'rgba(196,160,110,0.06)' : 'rgba(255,252,244,0.12)');
      lg.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = lg;
      x.fillRect(0, 0, w, h);
    }
    x.lineCap = 'round';
    for (let i = 0; i < 1600; i++) {
      const px = r() * w, py = r() * h, a = r() * Math.PI, l = 4 + r() * 16;
      x.strokeStyle = r() > 0.45 ? `rgba(130,100,60,${0.04 + r() * 0.06})` : `rgba(255,255,255,${0.1 + r() * 0.15})`;
      x.lineWidth = 0.5 + r() * 0.8;
      x.beginPath();
      x.moveTo(px, py);
      x.quadraticCurveTo(px + Math.cos(a) * l / 2 + (r() - 0.5) * 5, py + Math.sin(a) * l / 2 + (r() - 0.5) * 5, px + Math.cos(a) * l, py + Math.sin(a) * l);
      x.stroke();
    }
    grain(x, w, h, 0.03, 9000);
    // Dış kenarlarda hafif sararma
    const v = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(184,140,80,0.16)');
    x.fillStyle = v;
    x.fillRect(0, 0, w, h);
    // Sırta doğru, sayfanın kavislenip içeri kıvrıldığı yerde gölge
    const g = spineLeft ? x.createLinearGradient(0, 0, w * 0.2, 0) : x.createLinearGradient(w, 0, w * 0.8, 0);
    g.addColorStop(0, 'rgba(70,45,20,0.34)');
    g.addColorStop(0.25, 'rgba(90,60,30,0.12)');
    g.addColorStop(1, 'rgba(90,60,30,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
  }

  const PAD = 96;
  function pageNo(x, w, h, n, spineLeft) {
    x.font = `400 ${PHONE ? 40 : 26}px Outfit`;
    x.fillStyle = WOOD;
    x.textBaseline = 'alphabetic';
    x.textAlign = spineLeft ? 'right' : 'left';
    x.fillText(String(n), spineLeft ? w - PAD : PAD, h - 70);
  }

  // Sol sayfa: yıl, şirket, yer
  function drawHeader(i) {
    return (x, w, h) => {
      const p = BOOK.pages[i];
      paper(x, w, h, false);
      x.textBaseline = 'alphabetic';
      x.textAlign = 'left';
      x.fillStyle = 'rgba(160,120,72,0.22)';
      x.font = '900 300px Poppins';
      x.fillText(String(i + 1).padStart(2, '0'), PAD - 12, 470);
      x.fillStyle = INK_SOFT;
      x.font = '500 40px Outfit';
      x.fillText(p.years, PAD, 600);
      x.fillStyle = INK;
      x.font = '600 78px Poppins';
      let y = para(x, p.company, PAD, 710, w - PAD * 2, 88);
      x.fillStyle = WOOD;
      x.fillRect(PAD, y - 20, 90, 4);
      x.fillStyle = INK_SOFT;
      x.font = '400 34px Outfit';
      x.fillText(p.place, PAD, y + 50);
      pageNo(x, w, h, i * 2 + 1, false);
    };
  }

  // Sağ sayfa: pozisyon, açıklama, öne çıkanlar, etiketler
  function drawDetail(i) {
    return (x, w, h) => {
      const p = BOOK.pages[i];
      paper(x, w, h, true);
      const L = PAD + 10, maxW = w - L - PAD;
      x.textBaseline = 'alphabetic';
      x.textAlign = 'left';
      x.fillStyle = WOOD;
      x.font = '500 24px Outfit';
      x.fillText(p.label || 'POZİSYON', L, 150);
      x.fillStyle = INK;
      x.font = '600 54px Poppins';
      let y = para(x, p.role, L, 220, maxW, 64) + 20;
      x.fillStyle = INK_SOFT;
      x.font = '400 33px Outfit';
      y = para(x, p.summary, L, y + 10, maxW, 48) + 40;
      if (p.highlights?.length) {
        x.fillStyle = WOOD;
        x.font = '500 24px Outfit';
        x.fillText(p.listLabel || 'ÖNE ÇIKANLAR', L, y);
        y += 62;
        x.font = '400 33px Outfit';
        for (const hl of p.highlights) {
          x.fillStyle = WOOD;
          x.beginPath(); x.arc(L + 8, y - 11, 6, 0, Math.PI * 2); x.fill();
          x.fillStyle = INK;
          y = para(x, hl, L + 34, y, maxW - 34, 46) + 12;
        }
        y += 24;
      }
      if (p.tags?.length) {
        x.font = '500 28px Outfit';
        let tx = L;
        for (const t of p.tags) {
          const tw = x.measureText(t).width + 44;
          if (tx + tw > L + maxW) { tx = L; y += 66; }
          x.strokeStyle = 'rgba(160,120,72,0.6)';
          x.lineWidth = 2;
          x.beginPath(); x.roundRect(tx, y - 38, tw, 54, 27); x.stroke();
          x.fillStyle = INK_SOFT;
          x.fillText(t, tx + 22, y - 2);
          tx += tw + 14;
        }
      }
      pageNo(x, w, h, i * 2 + 2, true);
    };
  }

  // Son yaprağın arkası: kapanış sayfası
  function drawEnd(x, w, h) {
    paper(x, w, h, false);
    // Sayfanın tam ortasında: küçük etiket + başlık
    x.textAlign = 'center';
    x.textBaseline = 'alphabetic';
    x.fillStyle = WOOD;
    x.font = '500 24px Outfit';
    x.fillText('SON SÖZ', w / 2, h / 2 - 70);
    x.fillStyle = INK;
    x.font = '600 66px Poppins';
    para(x, BOOK.end.title, w / 2, h / 2 + 24, w - PAD * 2, 78);
    if (BOOK.end.text) {
      x.fillStyle = INK_SOFT;
      x.font = '400 34px Outfit';
      para(x, BOOK.end.text, w / 2, h / 2 + 110, w - PAD * 2, 50);
    }
    x.textAlign = 'left';
    pageNo(x, w, h, N * 2 + 1, false);
  }
  // Kitabın en son sağ sayfası
  function drawLast(x, w, h) {
    paper(x, w, h, true);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillStyle = 'rgba(160,120,72,0.5)';
    x.font = '500 30px Outfit';
    spaced(x, '— SON —', w / 2, h / 2, 8);
  }

  // =====================================================================
  //  Telefon düzeni: bir sayfa ekranda ~180 px olduğu için yazılar yaklaşık iki kat büyütülür.
  //  Sığmayan metin sonraki sayfalara akar, kitap gerektiği kadar yaprak kazanır.
  // =====================================================================
  const PH_X = 70, PH_W = PAGE_W - PH_X * 2, PH_TOP = 120, PH_BOTTOM = PAGE_H - 130;
  const PH_STYLE = {
    label: { font: '500 42px Outfit', color: WOOD, lh: 62 },
    role: { font: '600 72px Poppins', color: INK, lh: 86 },
    body: { font: '400 64px Outfit', color: INK_SOFT, lh: 86 },
    item: { font: '400 64px Outfit', color: INK, lh: 86 },
  };

  // Bir bölümün metnini satırlara böler, satırları sayfalara dağıtır
  function phonePages(p) {
    const m = document.createElement('canvas').getContext('2d');
    const rows = [];
    const add = (text, style, { indent = 0, bullet = false, gap = 0, keep = false } = {}) => {
      m.font = style.font;
      const lines = [];
      let line = '';
      for (const word of String(text).split(' ')) {
        const test = line ? line + ' ' + word : word;
        if (m.measureText(test).width > PH_W - indent && line) { lines.push(line); line = word; }
        else line = test;
      }
      if (line) lines.push(line);
      lines.forEach((t, j) => rows.push({ t, ...style, indent, bullet: bullet && j === 0, gap: j === 0 ? gap : 0, keep }));
    };
    add(p.label || 'POZİSYON', PH_STYLE.label, { keep: true });
    add(p.role, PH_STYLE.role, { keep: true });
    add(p.summary, PH_STYLE.body, { gap: 24 });
    if (p.highlights?.length) {
      add(p.listLabel || 'ÖNE ÇIKANLAR', PH_STYLE.label, { gap: 40, keep: true });
      p.highlights.forEach(h => add(h, PH_STYLE.item, { indent: 48, bullet: true, gap: 12 }));
    }
    const pages = [[]];
    const limit = PH_BOTTOM - PH_TOP;
    let y = 0;
    rows.forEach((r, i) => {
      // Başlık satırı sayfa sonunda tek başına kalmasın
      const need = r.gap + r.lh + (r.keep && rows[i + 1] ? rows[i + 1].lh : 0);
      if (y && y + need > limit) { pages.push([]); y = 0; }
      const gap = y ? r.gap : 0;
      pages[pages.length - 1].push({ ...r, y: y + gap });
      y += gap + r.lh;
    });
    return pages;
  }

  function phoneHeader(i, no) {
    return (x, w, h) => {
      const p = BOOK.pages[i];
      paper(x, w, h, false);
      x.textBaseline = 'alphabetic';
      x.textAlign = 'left';
      x.fillStyle = 'rgba(160,120,72,0.22)';
      x.font = '900 230px Poppins';
      x.fillText(String(i + 1).padStart(2, '0'), PH_X - 10, 320);
      x.fillStyle = INK_SOFT;
      x.font = '500 58px Outfit';
      let y = para(x, p.years, PH_X, 440, PH_W, 72) + 34;
      x.fillStyle = INK;
      x.font = '600 72px Poppins';
      y = para(x, p.company, PH_X, y + 40, PH_W, 88);
      x.fillStyle = WOOD;
      x.fillRect(PH_X, y - 20, 90, 4);
      x.fillStyle = INK_SOFT;
      x.font = '400 54px Outfit';
      para(x, p.place, PH_X, y + 60, PH_W, 68);
      pageNo(x, w, h, no, false);
    };
  }
  function phoneText(rows, no, right) {
    return (x, w, h) => {
      paper(x, w, h, right);
      x.textBaseline = 'alphabetic';
      x.textAlign = 'left';
      for (const r of rows) {
        const base = PH_TOP + r.y + r.lh * 0.76;
        x.fillStyle = r.color;
        if (r.bullet) {
          x.fillStyle = WOOD;
          x.beginPath(); x.arc(PH_X + 12, base - 20, 9, 0, Math.PI * 2); x.fill();
          x.fillStyle = r.color;
        }
        x.font = r.font;
        x.fillText(r.t, PH_X + r.indent, base);
      }
      pageNo(x, w, h, no, right);
    };
  }
  function phoneBlank(no, right) {
    return (x, w, h) => {
      paper(x, w, h, right);
      pageNo(x, w, h, no, right);
    };
  }
  // Her bölüm sol sayfada başlar; tek sayıda sayfa kalırsa son sağ sayfa boş bırakılır
  function phoneSpreads() {
    const out = [];
    BOOK.pages.forEach((p, i) => {
      const faces = [null, ...phonePages(p)];
      if (faces.length % 2) faces.push(undefined);
      for (let f = 0; f < faces.length; f += 2) {
        const no = out.length * 2 + 1;
        out.push({
          left: faces[f] === null ? phoneHeader(i, no) : phoneText(faces[f], no, false),
          right: faces[f + 1] === undefined ? phoneBlank(no + 1, true) : phoneText(faces[f + 1], no + 1, true),
        });
      }
    });
    return out;
  }

  // Her açık sayfa çifti: sol + sağ yüz. Masaüstünde data.js'teki her öğe bir çifttir
  const SPREADS = PHONE ? phoneSpreads() : BOOK.pages.map((_, i) => ({ left: drawHeader(i), right: drawDetail(i) }));
  const N = SPREADS.length;

  // Sayfa kenarlarındaki ince kâğıt çizgileri. Çizgiler sayfa yüzeyine paralel olmalı:
  // vertical = doku u ekseninde değişen çizgiler (ön kenar), değilse v ekseninde (üst/alt kenar)
  function edgeTex(vertical, rep) {
    return makeTex(256, 256, (x, w, h) => {
      x.fillStyle = '#EADFC8';
      x.fillRect(0, 0, w, h);
      const r = seeded(vertical ? 21 : 22);
      for (let i = 0; i < 256; i += 2) {
        const dark = r();
        x.fillStyle = dark > 0.6 ? `rgba(110,80,45,${0.1 + r() * 0.16})` : `rgba(255,250,238,${0.15 + r() * 0.2})`;
        if (vertical) x.fillRect(i, 0, 1, h); else x.fillRect(0, i, w, 1);
      }
      // hafif sararma ve kir lekeleri
      grain(x, w, h, 0.05, 1500);
    }, { repeat: rep });
  }

  // Sayfa yüzeyinin sırta doğru kavislenip içeri kıvrılması (d: sırttan uzaklık)
  const GD = 0.03, GW = 0.15;
  const gutter = d => d < GW ? -GD * Math.pow(1 - d / GW, 2) : 0;

  // =====================================================================
  //  Kitabın parçaları
  // =====================================================================
  const BUMP = 2.2;
  const leatherPhys = (map, bump, rm, extra = {}) => {
    const base = {
      map, bumpMap: bump, bumpScale: BUMP,
      roughness: rm ? 1 : 0.76, roughnessMap: rm || null,
      metalness: rm ? 1 : 0, metalnessMap: rm || null,
      ...extra,
    };
    if (LOW) return new THREE.MeshStandardMaterial(base);
    return new THREE.MeshPhysicalMaterial({
      ...base,
      sheen: 0.6, sheenRoughness: 0.5, sheenColor: new THREE.Color(0x9C6B45),
      clearcoat: 0.12, clearcoatRoughness: 0.55,
    });
  };
  // Küçük parçalar (kapak kenarları, sırt kapakları): döşenen deri
  const leatherMat = leatherPhys(
    makeTex(512, 512, (x, w, h) => leather(x, w, h, 1), { repeat: [3, 3] }),
    makeTex(512, 512, (x, w, h) => pattern(x, w, h, 1), { linear: true, repeat: [3, 3] }),
  );
  const coverFrontMat = leatherPhys(
    makeTex(COVER_W, COVER_H, drawCover),
    makeTex(COVER_W, COVER_H, coverBump(coverArt), { linear: true }),
    makeTex(COVER_W, COVER_H, coverRM(coverArt), { linear: true }),
  );
  const coverBackMat = leatherPhys(
    makeTex(COVER_W, COVER_H, (x, w, h) => leather(x, w, h, 1.6)),
    makeTex(COVER_W, COVER_H, coverBump(blindFrame), { linear: true }),
  );
  const spineMat = leatherPhys(
    makeTex(SPINE_W, COVER_H, (x, w, h) => { leather(x, w, h, 1.6); spineArt(x, w, h, GOLD); }),
    makeTex(SPINE_W, COVER_H, coverBump(spineArt), { linear: true }),
    makeTex(SPINE_W, COVER_H, coverRM(spineArt), { linear: true }),
  );
  // Sayfa bloğu: uç yüzler (üst/alt kenar) ve yan duvarlar (ön kenar) ayrı yönde çizgili
  // Kenarlar beyaza patlamasın diye krem tonla karartılır; çizgi sıklığı ekranda seçilecek kadar
  const edgeCap = new THREE.MeshStandardMaterial({ map: edgeTex(false, [1, 0.5]), color: 0xD9CFBE, roughness: 0.95 });
  const edgeWall = new THREE.MeshStandardMaterial({ map: edgeTex(true, [0.5, 1]), color: 0xD9CFBE, roughness: 0.95 });

  // Kapak: köşeleri hafif yuvarlatılmış kutu. Sırt tarafında OV kadar sırtın içine uzanır ki
  // yuvarlatılmış kenar ile sırt arasında ince bir yarık kalmasın
  const OV = 0.008;
  const coverGeo = () => new RoundedBoxGeometry(PW + M + OV, PH + 2 * M, C, 3, C * 0.35);
  const coverMats = face => [leatherMat, leatherMat, leatherMat, leatherMat, leatherMat, face];

  // Sayfa bloğu: kesiti çizilip yükseklik boyunca uzatılır. Üst yüzey sırta yaklaşınca aşağı kıvrılır,
  // ön kenar hafif yuvarlak. side: +1 sağ blok, -1 sol blok
  function blockGeo(side) {
    const s = new THREE.Shape();
    // Ön kenar köşesi keskin: kapalıyken iki blok tek parça sayfa yığını gibi birleşir
    const top = ZT;
    s.moveTo(0, C);
    s.lineTo(side * PW, C);
    s.lineTo(side * PW, top);
    s.lineTo(side * GW, top);
    for (let i = 1; i <= 16; i++) { const d = GW * (1 - i / 16); s.lineTo(side * d, top + gutter(d)); }
    s.lineTo(0, C);
    const g = new THREE.ExtrudeGeometry(s, { depth: PH, bevelEnabled: false, curveSegments: 4 });
    g.rotateX(Math.PI / 2);      // kesitin y'si → kitabın z'si, uzatma → kitabın y'si
    g.translate(0, PH / 2, 0);
    return g;
  }

  // Sağ yarı: arka kapak + sağ sayfa bloğu (yerinde durur)
  const backCover = new THREE.Mesh(coverGeo(), coverMats(coverBackMat));
  backCover.position.set((PW + M + OV) / 2 - OV, 0, C / 2);
  const rightBlock = new THREE.Mesh(blockGeo(1), [edgeCap, edgeWall]);
  book.add(backCover, rightBlock);

  // Sayfalar tonlamadan muaf: yazının kontrastı korunur, kâğıt beyaza patlamaz
  const PAGE_TINT = 0xC2BFB9; // ışık toplamı 1'i aştığı için doku hafif karartılır
  const paperBump = makeTex(256, 256, (x, w, h) => {
    x.fillStyle = '#808080';
    x.fillRect(0, 0, w, h);
    grain(x, w, h, 0.5, 6000);
  }, { linear: true, repeat: [4, 5] });
  const pageMat = (tex, side = THREE.FrontSide) => new THREE.MeshStandardMaterial({
    map: tex, color: PAGE_TINT, roughness: 1, envMapIntensity: 0.6, toneMapped: false, side,
    bumpMap: paperBump, bumpScale: 0.25,
  });
  // Düz sayfa (sırta doğru kavisli). side: +1 sağda, -1 solda; sırt x = 0'da
  function flatPage(tex, side) {
    const geo = new THREE.PlaneGeometry(PW, PH, SEG, 1);
    geo.translate(side * PW / 2, 0, 0);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, gutter(Math.abs(pos.getX(i))));
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, pageMat(tex));
  }

  // En sondaki sağ sayfa (bütün yapraklar çevrilince görünür)
  const lastPage = flatPage(makeTex(PAGE_W, PAGE_H, drawLast), 1);
  lastPage.position.set(0, 0, ZT + E * 0.3);
  book.add(lastPage);

  // Sol yarı: ön kapak + sol sayfa bloğu; sırt çizgisinde (menteşe) döner
  const left = new THREE.Group();
  left.position.set(0, 0, ZT);
  const frontCover = new THREE.Mesh(coverGeo(), coverMats(coverFrontMat));
  frontCover.position.set(-(PW + M + OV) / 2 + OV, 0, C / 2 - ZT);
  const leftBlock = new THREE.Mesh(blockGeo(-1), [edgeCap, edgeWall]);
  leftBlock.position.z = -ZT;
  const firstPage = flatPage(makeTex(PAGE_W, PAGE_H, SPREADS[0].left), -1);
  firstPage.position.set(0, 0, E * 0.3);
  left.add(frontCover, leftBlock, firstPage);
  book.add(left);

  // ---- Sırt ve yuvarlak sayfa sırtı ----
  // Menteşe ekseni (x = 0, z = ZT) etrafında açı α (x = cos α, z = sin α). Sağ yarı α ∈ [270°, 360°],
  // sol yarı açıyken [180°, 270°]; kapanırken sol yarı φ kadar döner. İki yarının arasında kalan dilim
  // α ∈ [270° − φ, 270°]: kapalıyken (φ = 180°) tam sırttaki yarım daire, açıkken (φ = 0) yok.
  // Bu dilim dışta deriyle (sırt), içte kâğıtla (sayfaların yuvarlak sırtı) doldurulur:
  // kapak sayfaları sarar, açılırken de ortada boşluk kalmaz.
  const R_OUT = ZT, R_IN = ZT - C;
  const HS = PH + 2 * M;
  const spineG = new THREE.Group();
  spineG.position.set(0, 0, ZT);
  book.add(spineG);
  const paperEndMat = new THREE.MeshStandardMaterial({ map: edgeTex(false, [1, 2]), color: 0xD9CFBE, roughness: 0.95 });
  // Dilim içi boş bir kabuk: kitap yarı açıkken sayfaların arasından içine bakılır. İç yüzler de
  // çizilmezse arkadaki zemin görünür → kâğıt ve deri kabuk iki yüzlü
  const paperCoreMat = paperEndMat.clone();
  paperCoreMat.side = THREE.DoubleSide;
  spineMat.side = THREE.DoubleSide;
  const spineSide = new THREE.Mesh(new THREE.BufferGeometry(), spineMat);
  const spineTop = new THREE.Mesh(new THREE.BufferGeometry(), leatherMat);
  const spineBot = new THREE.Mesh(new THREE.BufferGeometry(), leatherMat);
  const paperTop = new THREE.Mesh(new THREE.BufferGeometry(), paperEndMat);
  const paperBot = new THREE.Mesh(new THREE.BufferGeometry(), paperEndMat);
  const paperCore = new THREE.Mesh(new THREE.BufferGeometry(), paperCoreMat);
  spineG.add(spineSide, spineTop, spineBot, paperTop, paperBot, paperCore);
  let spinePhi = -1;
  function setSpine(phi) {
    if (Math.abs(phi - spinePhi) < 1e-4) return;
    spinePhi = phi;
    spineG.visible = phi > 0.002;
    if (!spineG.visible) return;
    const seg = Math.max(2, Math.ceil(48 * phi / Math.PI));
    const swap = (mesh, geo) => { mesh.geometry.dispose(); mesh.geometry = geo; };
    // Silindirde x = r·sin θ, z = r·cos θ → θ = 90° − α: dilim θ ∈ [−180°, −180° + φ]
    swap(spineSide, new THREE.CylinderGeometry(R_OUT, R_OUT, HS, seg, 1, true, -Math.PI, phi));
    // Halka/daire xy düzleminde; üst kapak için −90°, alt kapak için +90° x ekseninde çevrilir
    const top = g => g.rotateX(-Math.PI / 2);
    const bot = g => g.rotateX(Math.PI / 2);
    swap(spineTop, top(new THREE.RingGeometry(R_IN, R_OUT, seg, 1, Math.PI / 2, phi)).translate(0, HS / 2, 0));
    swap(spineBot, bot(new THREE.RingGeometry(R_IN, R_OUT, seg, 1, 1.5 * Math.PI - phi, phi)).translate(0, -HS / 2, 0));
    // Kâğıt: sayfa yüksekliğinde (kapak taşma payı kadar içeride), sayfa kenarı görünümünde
    swap(paperTop, top(new THREE.CircleGeometry(R_IN, seg, Math.PI / 2, phi)).translate(0, PH / 2, 0));
    swap(paperBot, bot(new THREE.CircleGeometry(R_IN, seg, 1.5 * Math.PI - phi, phi)).translate(0, -PH / 2, 0));
    // Deri ile kâğıt arasında kalan ince boşluk dışarıdan görünmesin
    swap(paperCore, new THREE.CylinderGeometry(R_IN, R_IN, PH, seg, 1, true, -Math.PI, phi));
  }

  // ---- Sırta doğru kıvrılma yalnızca kitap açıkken: kapalıyken iki blok arasında boşluk kalmaz ----
  let gutK = -1;
  const gutterVerts = geo => {
    const pos = geo.attributes.position, list = [];
    for (let i = 0; i < pos.count; i++) {
      const d = Math.abs(pos.getX(i)), z = pos.getZ(i);
      if (d < GW && z < ZT - 1e-6 && Math.abs(z - (ZT + gutter(d))) < 1e-5) list.push([i, d]);
    }
    return list;
  };
  const curved = [rightBlock, leftBlock].map(m => ({ geo: m.geometry, list: gutterVerts(m.geometry), base: ZT }))
    .concat([lastPage, firstPage].map(m => ({ geo: m.geometry, list: [...Array(m.geometry.attributes.position.count).keys()].map(i => [i, Math.abs(m.geometry.attributes.position.getX(i))]), base: 0 })));
  function setGutter(k) {
    if (Math.abs(k - gutK) < 1e-4) return;
    gutK = k;
    curved.forEach(({ geo, list, base }) => {
      const pos = geo.attributes.position;
      list.forEach(([i, d]) => pos.setZ(i, base + gutter(d) * k));
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    });
    sheets.forEach(s => { s.last = -1; bend(s); });
  }

  // Yapraklar: önde ayrıntı (sağ sayfa), arkada sonraki bölümün başlığı (sol sayfa)
  const sheets = SPREADS.map((spread, k) => {
    const geo = new THREE.PlaneGeometry(PW, PH, SEG, 1);
    const front = new THREE.Mesh(geo, pageMat(makeTex(PAGE_W, PAGE_H, spread.right)));
    const backTex = makeTex(PAGE_W, PAGE_H, k < N - 1 ? SPREADS[k + 1].left : drawEnd, { flip: true });
    const back = new THREE.Mesh(geo, pageMat(backTex, THREE.BackSide));
    // Grup menteşe çizgisinde (x = 0, z = ZT): kitap kapanırken çevrilmiş yaprak sol yarıyla birlikte döner
    const g = new THREE.Group();
    g.add(front, back);
    g.position.z = ZT;
    book.add(g);
    const s = { k, geo, g, t: 0, goal: 0, last: -1 };
    bend(s);
    return s;
  });

  // Yaprağı t (0 = sağda düz, 1 = solda düz) kadar çevir. Uç kısım önden gider, yaprak kavislenir
  function bend(s) {
    const t = s.t;
    if (t === s.last) return;
    s.last = t;
    const pos = s.geo.attributes.position;
    const lift = Math.sin(Math.PI * t);
    const z0 = lerp(E * (N - s.k), E * (s.k + 1), t); // yaprak yığındaki sırasını korur
    let px = 0, pz = 0;
    const step = PW / SEG;
    for (let i = 0; i <= SEG; i++) {
      if (i > 0) {
        const u = (i - 0.5) / SEG;
        const a = Math.min(Math.PI, Math.PI * t + CURL * lift * u);
        px += Math.cos(a) * step;
        pz += Math.sin(a) * step;
      }
      // Yatarken sırta doğru kavislenir (bloğun üst yüzeyi gibi); havadayken düzleşir
      const gz = gutter(i * step) * (1 - lift) * Math.max(gutK, 0);
      for (let row = 0; row < 2; row++) {
        const idx = row * (SEG + 1) + i;
        pos.setXYZ(idx, px, row === 0 ? PH / 2 : -PH / 2, z0 + pz + gz);
      }
    }
    pos.needsUpdate = true;
    s.geo.computeVertexNormals();
    s.geo.computeBoundingSphere();
  }

  // Yumuşak gölge: kitabın arkasında, açılınca genişler
  const shadow = (() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const x = c.getContext('2d');
    x.filter = 'blur(22px)';
    x.fillStyle = 'rgba(60,40,20,0.55)';
    x.fillRect(48, 48, 160, 160);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
    m.renderOrder = -1;
    return m;
  })();
  root.add(shadow);

  // Sürükleme için görünmez dokunma yüzeyleri (sol ve sağ sayfa)
  const hitMat = new THREE.MeshBasicMaterial();
  const hitR = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), hitMat);
  hitR.position.set(PW / 2, 0, ZT + 0.02);
  const hitL = hitR.clone();
  hitL.position.x = -PW / 2;
  hitR.visible = hitL.visible = false;
  book.add(hitR, hitL);

  // Yazı tipleri yüklenince dokuları yeniden çiz
  // (kurulumda zaten yüklüyse yeniden çizmeye gerek yok)
  const FONTS = ['900 100px Poppins', '600 100px Poppins', '400 30px Outfit', '500 30px Outfit'];
  if (document.fonts && !FONTS.every(f => document.fonts.check(f))) {
    Promise.all(FONTS.map(f => document.fonts.load(f)))
      .then(() => {
        scene.traverse(o => {
          const mats = o.material ? [].concat(o.material) : [];
          mats.forEach(m => m.map?.userData.draw?.());
        });
        requestRender();
      });
  }

  // =====================================================================
  //  Kaydırma: yazı, giriş, dönüş, açılış
  // =====================================================================
  let vw = 1, vh = 1, target = 0, current = 0, raf = null;
  let openP = 0;

  function scrollS() {
    const r = section.getBoundingClientRect();
    return (vh - r.top) / vh;
  }

  function placeTitle() {
    if (reduceMotion || !titleEl) return;
    const r = section.getBoundingClientRect();
    const k = span((vh - r.top) / vh, TITLE);
    const show = k > 0 && k < 1;
    titleEl.style.visibility = show ? 'visible' : 'hidden';
    if (!show) return;
    const tw = titleEl.offsetWidth, th = titleEl.offsetHeight;
    // Sahnenin ekrandaki üst kenarı: yapışmadan önce aşağıda, çözüldükten sonra yukarıda
    const stageTop = r.top > 0 ? r.top : Math.min(0, r.bottom - vh);
    const x = -tw + (vw + tw) * k;          // soldan sağa
    const y = vh - (vh + th) * k;           // aşağıdan yukarı
    titleEl.style.transform = `translate3d(${x.toFixed(1)}px, ${(y - stageTop).toFixed(1)}px, 0)`;
  }

  // Kamera uzaklığı: verilen genişlik/yükseklik ekranın verilen payını kaplasın
  function fitDist(w, h, shareW, shareH) {
    const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    return Math.max(w / shareW / (2 * t * camera.aspect), h / shareH / (2 * t));
  }

  function render() {
    const s = current;
    const enter = reduceMotion ? 1 : easeOut(span(s, ENTER));
    const rot = reduceMotion ? 1 : easeSine(span(s, ROTATE));
    // Çıkış: sahne çözülüp yukarı kaymaya başlayınca kitap (dönmeden) kapanır ve sayfayla yukarı gider
    const exit = reduceMotion ? 0 : easeInOut(span(s, EXIT));
    const open = reduceMotion ? 1 : easeInOut(span(s, OPEN)) * (1 - exit);
    openP = open;
    const started = reduceMotion || current > ENTER[0];
    canvas.style.opacity = started ? '1' : '0';
    if (!started) return;

    // Açılış: sol yarı sırt çizgisinde döner; kitabın ortası sırta kayar
    left.rotation.y = Math.PI * (1 - open);
    book.position.x = -(PW + M) / 2 * (1 - open);
    book.position.z = -lerp(T / 2, ZT, open);
    // Sırt, iki yarının arasındaki dilimi doldurur; sayfalar yalnızca açıldıkça ortaya doğru kıvrılır
    setSpine(Math.PI * (1 - open));
    setGutter(open);
    // Çevrilmiş (solda yatan) yapraklar kapanırken sol kapakla birlikte döner; yarı çevrilmiş olan yarısı kadar
    // Kapalıyken yapraklar ve iç sayfalar iki bloğun tam birleşim çizgisinde durur; kenarları ön
    // kenarda ince bir çizgi gibi görünmesin diye gizlenir
    const inside = open > 0.02;
    sheets.forEach(sh => {
      sh.g.rotation.y = left.rotation.y * sh.t;
      sh.g.visible = inside;
    });
    firstPage.visible = lastPage.visible = inside;

    shadow.material.opacity = 0.9 * span(rot, [0.75, 1]);
    shadow.scale.set(lerp(PW + M, 2 * (PW + M), open) * 1.25, (PH + 2 * M) * 1.25, 1);
    shadow.position.set(0, -0.03, -lerp(T / 2, ZT, open) - 0.04);

    // Kamera: kapalı kitabın tamamı rahat sığar; açılınca açık kitaba göre hafifçe yaklaşır
    const narrow = vw < 700;
    const dClosed = fitDist(Math.hypot(PW + M, T), PH + 2 * M, narrow ? 0.62 : 0.42, 0.6);
    const dOpen = fitDist(2 * (PW + M), PH + 2 * M, narrow ? 0.96 : 0.8, 0.8);
    const d = lerp(dClosed, dOpen, open);
    camera.position.set(0, d * 0.1, d);
    camera.lookAt(0, 0, 0);

    // Giriş: ekranın altının dışından yükselir (belirme yok). Dönüş ekseni çapraz eğik başlar,
    // kitap karşıya oturdukça eğim düzelir. Açılınca hafifçe geriye yatar
    const below = d * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) + (PH + 2 * M) * 0.75;
    tilt.position.y = -(1 - enter) * below;
    tilt.rotation.set(TILT_X * (1 - rot) - 0.1 * open, 0, TILT_Z * (1 - rot));
    root.rotation.y = -TURN * (1 - rot);

    renderer.render(scene, camera);
    updateHint();
  }

  // ---- Döngü: kaydırma takibi + yaprak animasyonları ----
  function animating() {
    return current !== target || sheets.some(s => s.t !== s.goal && !(drag && drag.s === s));
  }
  function tick() {
    const diff = target - current;
    current = Math.abs(diff) < 0.0005 ? target : current + diff * FOLLOW;
    sheets.forEach(s => {
      if (drag && drag.s === s) return;
      const d = s.goal - s.t;
      s.t = Math.abs(d) < 0.002 ? s.goal : s.t + d * 0.13;
    });
    sheets.forEach(bend);
    render();
    raf = animating() ? requestAnimationFrame(tick) : null;
  }
  function requestRender() { if (raf === null) raf = requestAnimationFrame(tick); }

  function inView() {
    const r = section.getBoundingClientRect();
    return r.bottom > -50 && r.top < vh + 50;
  }
  function onScroll() {
    placeTitle();
    if (!inView()) return;
    target = scrollS();
    requestRender();
  }

  function resize() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    const box = canvas.parentElement;
    renderer.setPixelRatio(DPR());
    renderer.setSize(box.clientWidth, box.clientHeight, false);
    camera.aspect = box.clientWidth / Math.max(1, box.clientHeight);
    camera.updateProjectionMatrix();
    placeTitle();
    render();
  }

  // =====================================================================
  //  Sayfa çevirme: tut-sürükle, dokunmatikte kaydır, klavye
  // =====================================================================
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let drag = null, turned = 0;
  const ready = () => openP > 0.98;
  const count = () => sheets.filter(s => s.goal === 1).length; // çevrilmiş (ya da çevrilmekte olan) yaprak

  function sideAt(e) {
    if (!ready()) return null;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects([hitR, hitL], false)[0];
    if (!hit) return null;
    const n = count();
    if (hit.object === hitR && n < N) return 'next';
    if (hit.object === hitL && n > 0) return 'prev';
    return null;
  }

  // Bir sayfanın ekrandaki genişliği (sürükleme mesafesini buna göre ölçeriz)
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  function pagePx() {
    tmpA.set(0, 0, ZT); tmpB.set(PW, 0, ZT);
    book.localToWorld(tmpA); book.localToWorld(tmpB);
    tmpA.project(camera); tmpB.project(camera);
    return Math.max(60, Math.abs(tmpB.x - tmpA.x) / 2 * canvas.clientWidth);
  }

  function setCursor(c) {
    canvas.classList.toggle('is-grab', c === 'grab');
    canvas.classList.toggle('is-grabbing', c === 'grabbing');
  }

  function turn(dir) {
    const n = count();
    if (dir > 0 && n < N) sheets[n].goal = 1;
    else if (dir < 0 && n > 0) sheets[n - 1].goal = 0;
    else return;
    turned++;
    requestRender();
  }

  canvas.addEventListener('pointermove', e => {
    if (drag) {
      if (e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0;
      const now = performance.now();
      drag.v = (e.clientX - drag.lx) / Math.max(1, now - drag.lt);
      drag.lx = e.clientX; drag.lt = now;
      if (Math.abs(dx) > 6) drag.moved = true;
      const k = clamp(Math.abs(dx) / (drag.w * 1.5));
      drag.s.t = drag.side === 'next' ? clamp(dx < 0 ? k : 0) : 1 - clamp(dx > 0 ? k : 0);
      bend(drag.s);
      render();
      return;
    }
    if (e.pointerType === 'mouse') setCursor(sideAt(e) ? 'grab' : '');
  });

  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0 || drag) return;
    const side = sideAt(e);
    if (!side) return;
    const n = count();
    const s = side === 'next' ? sheets[n] : sheets[n - 1];
    drag = { id: e.pointerId, side, s, x0: e.clientX, lx: e.clientX, lt: performance.now(), v: 0, w: pagePx(), moved: false };
    canvas.setPointerCapture(e.pointerId);
    setCursor('grabbing');
    if (e.pointerType === 'mouse') e.preventDefault();
  });

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const { s, side, v, moved } = drag;
    if (!moved) s.goal = side === 'next' ? 1 : 0;                 // tıklama/dokunma: doğrudan çevir
    else if (side === 'next') s.goal = (s.t > 0.3 || v < -0.45) && v < 0.45 ? 1 : 0;
    else s.goal = (s.t < 0.7 || v > 0.45) && v > -0.45 ? 0 : 1;
    if (s.goal !== (side === 'next' ? 0 : 1)) turned++;
    drag = null;
    setCursor(e.pointerType === 'mouse' && sideAt(e) ? 'grab' : '');
    requestRender();
  }
  // Sürükleme sayfa kaydırmasına dönüştüyse yaprak yerine döner, sayfa çevrilmez
  function cancelDrag() {
    if (!drag) return;
    drag.s.goal = drag.side === 'next' ? 0 : 1;
    drag = null;
    setCursor('');
    requestRender();
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', cancelDrag);
  window.addEventListener('page-scroll-start', cancelDrag);
  canvas.addEventListener('pointerleave', () => { if (!drag) setCursor(''); });

  canvas.addEventListener('keydown', e => {
    if (!ready()) return;
    if (e.key === 'ArrowRight') { turn(1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { turn(-1); e.preventDefault(); }
  });

  // İpucu: kitap açılınca belirir, ilk sayfa çevrilince kaybolur
  if (hintEl) hintEl.textContent = coarse ? 'Sayfa çevirmek için sağa sola kaydır' : 'Sayfayı tut ve sürükle';
  function updateHint() {
    if (!hintEl) return;
    const r = section.getBoundingClientRect();
    hintEl.classList.toggle('show', ready() && turned === 0 && r.bottom > vh * 0.6);
  }

  // ---- Başlat ----
  resize();
  target = current = scrollS();
  render();
  window.addEventListener('resize', () => { resize(); onScroll(); });
  window.addEventListener('scroll', onScroll, { passive: true });

  // Otomatik testler kitabın durumunu buradan okur
  canvas._state = () =>({ s: current, open: openP, turned: count(), t: sheets.map(s => +s.t.toFixed(3)) });
}
