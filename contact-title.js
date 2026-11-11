// ===== İletişim başlığı =====
// Kitap sahnesi bitip kitap ekrandan çıkınca dev "İLETİŞİM" yazısı ekrana yapışır:
//   1. Kaydırdıkça kendi yatay ekseninde (harflerin ortasından) dönerek çıkar: başta tam yatıktır,
//      kalınlığı olmadığı için görünmez; döndükçe yüzü bize döner (solma yok)
//   2. Düzleşince kısa bir süre sabit durur
//   3. Aynı yönde dönmeyi sürdürür ve yeniden yatık hâle gelip kendi içinde kaybolur (yukarı kaymaz)
//   4. Kaybolduktan sonra kaydırmaya devam edince iletişim bilgileri kaymadan, ekranda sabit
//      dururken belirir: bütün harfler sırayla kendi etrafında dönerek tek tek girer. Geri yukarı
//      kaydırınca solarak kaybolur. (Footer, style.css'te bu alanın sonuna yapışıktır.)
(() => {
  const section = document.getElementById('iletisimSahne');
  const title = document.getElementById('contactTitle');
  const footer = document.getElementById('footer');
  if (!section || !title) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Evreler: bölüm üstü ekranın üstüne geldikten sonraki kaydırma (ekran yüksekliği cinsinden).
  // Bölüm boyu style.css'te 370vh: sayfa 2.7'de biter, yazı ondan önce (2.35) tamamen kaybolur.
  // Baştaki 0.15 boşluk: yukarı kaydırırken yazı tamamen kaybolmadan kitap ekrana geri inmez.
  const TURN_IN = [0.15, 1.2];  // yatıktan (görünmez) yüzü bize dönük hâle
  const TURN_OUT = [1.45, 2.35]; // aradaki 0.25 sabit durur; sonra aynı yönde dönüp yeniden yatık olur
  const REVEAL = 2.45;     // yazı kaybolduktan sonra biraz daha kaydırınca iletişim bilgileri girer
  const FADE_MS = 450;     // geri kaydırınca solarak kaybolma süresi (style.css ile aynı)
  const SPIN_TOTAL = 1500; // tüm harflerin girişi en fazla bu kadar sürsün (ms); harf başına en fazla 28ms
  const START_DEG = 90;    // başlangıçta yazı X ekseninde yatık durur (üst kenarı bize bakar)
  const TITLE_MAX = 0.92;  // PROJELERİM ile aynı: sayfa genişliğinin bu kadarı (laptop3d.js TITLE_MAX)

  const clamp = v => Math.min(1, Math.max(0, v));
  const easeOut = t => 1 - (1 - t) * (1 - t);
  const easeIn = t => t * t;
  const span = (v, [a, b]) => clamp((v - a) / (b - a));
  const PERSPECTIVE = 1400; // px
  // Yumuşatma (gecikmeli takip) yok: yazı kaydırmaya birebir bağlı, böylece hızlı kaydırınca
  // kitap ya da iletişim bilgileri ekrandayken yazı geride kalıp görünmez
  let vw = 0, vh = 0, current = 0, raf = 0;
  let shiftY = 0; // harflerin ortasını ekranın ortasına getiren kayma

  // Boy: PROJELERİM ile aynı yazı boyu. Onun ölçüsü yoksa kendi genişliğini aynı orana oturtur
  function layout() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    const proj = document.getElementById('screenTitle');
    // laptop3d.js boyu ayarladıysa birebir onu kullan; yoksa aynı hesapla bul
    if (proj && proj.style.fontSize) title.style.fontSize = proj.style.fontSize;
    else {
      const w100 = (proj && measure(proj)) || measure(title) || 1;
      title.style.fontSize = (100 * vw * TITLE_MAX / w100).toFixed(1) + 'px';
    }
    centerOnLetters();
  }

  // Dönüş merkezi: harf gövdelerinin (noktalar ve çengeller hariç, büyük harf yüksekliği) ortası.
  // Kutunun dikey ortası satır yüksekliğine göre hesaplandığı için harflerin ortasıyla çakışmaz
  const ctx = document.createElement('canvas').getContext('2d');
  function centerOnLetters() {
    const cs = getComputedStyle(title);
    const fs = parseFloat(cs.fontSize);
    ctx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    const m = ctx.measureText('ILETISIM'); // aynı harfler, İ noktası ve Ş çengeli olmadan
    if (!m.fontBoundingBoxAscent) return;  // eski tarayıcı: kutunun ortası kalır
    const lineH = title.offsetHeight;
    const baseline = (lineH - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
    const mid = baseline - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
    title.style.transformOrigin = `50% ${mid.toFixed(1)}px`;
    shiftY = lineH / 2 - mid; // harflerin ortası ekranın ortasına gelsin
    apply(current);
  }
  // Öğenin 100px yazı boyundaki genişliği (dönüş ve ölçekten bağımsız)
  function measure(el) {
    const prev = { fs: el.style.fontSize, tr: el.style.transform };
    el.style.fontSize = '100px';
    el.style.transform = 'none';
    const w = el.offsetWidth;
    el.style.fontSize = prev.fs;
    el.style.transform = prev.tr;
    return w;
  }

  // Bölüm üstü ekranın üstüne geldikten sonra kaydırılan miktar (sınırsız)
  const rawProgress = () => -section.getBoundingClientRect().top / vh;
  // Başlık için 0 … TURN_OUT bitişi
  const progress = () => Math.min(TURN_OUT[1], Math.max(0, rawProgress()));

  function apply(s) {
    const deg = s < TURN_OUT[0]
      ? START_DEG * (1 - easeOut(span(s, TURN_IN)))   // 90° → 0°: belirir
      : -START_DEG * easeIn(span(s, TURN_OUT));       // 0° → −90°: kendi içinde kaybolur
    title.style.visibility = Math.abs(deg) > 89.9 ? 'hidden' : 'visible';
    title.style.transform = `translateY(${shiftY.toFixed(1)}px) perspective(${PERSPECTIVE}px) rotateX(${deg.toFixed(2)}deg)`;
  }

  function tick() {
    raf = 0;
    current = progress();
    // laptop3d.js başlık boyunu sonradan (model yüklenince) ayarlar: yazı görünmeden önce eşitle
    if (proj && proj.style.fontSize && proj.style.fontSize !== title.style.fontSize) layout();
    apply(current);
    reveal(rawProgress() >= REVEAL);
  }
  function onScroll() {
    if (!raf) raf = requestAnimationFrame(tick);
  }

  // ===== İletişim bilgileri: harf harf dönerek giriş, solarak çıkış =====
  // Footer'daki bütün yazılar harflere bölünür. Ekran okuyucu için her yazının tam hâli gizli bir
  // kopyada kalır, görünen harfler aria-hidden. Menüdeki gibi zaten harflere bölünmüş bağlantılarda
  // (hızlı ulaşım, script.js) o harf kutuları kullanılır.
  let shown = false, fadeTimer = 0;
  function splitFooter() {
    if (!footer) return;
    let n = 0;
    const walk = el => {
      [...el.childNodes].forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.classList.contains('roll')) {
            node.querySelectorAll('.roll-ch').forEach(box => { box.classList.add('ct-ch'); box.style.setProperty('--n', n++); });
          } else if (!node.classList.contains('social-icon')) walk(node);
          return;
        }
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return;
        const text = node.textContent;
        const frag = document.createDocumentFragment();
        const sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = text;
        const vis = document.createElement('span');
        vis.setAttribute('aria-hidden', 'true');
        // Kelimeler bölünmesin diye harfler kelime kutularında; aradaki boşluklar normal kalır
        text.split(/(\s+)/).forEach(w => {
          if (!w) return;
          if (/^\s+$/.test(w)) { vis.appendChild(document.createTextNode(' ')); return; }
          const word = document.createElement('span');
          word.className = 'ct-word';
          [...w].forEach(c => {
            const ch = document.createElement('span');
            ch.className = 'ct-ch';
            ch.style.setProperty('--n', n++);
            ch.textContent = c;
            word.appendChild(ch);
          });
          vis.appendChild(word);
        });
        frag.append(sr, vis);
        node.replaceWith(frag);
      });
    };
    walk(footer);
    footer.style.setProperty('--step', Math.min(28, SPIN_TOTAL / Math.max(1, n)).toFixed(2) + 'ms');
    footer.classList.add('ct-ready');
  }

  function reveal(on) {
    if (!footer || on === shown) return;
    shown = on;
    clearTimeout(fadeTimer);
    if (on) {
      // Solarken geri gelindiyse harfler baştan dönerek girsin
      footer.classList.remove('show', 'hiding');
      void footer.offsetWidth;
      footer.classList.add('show');
    } else {
      footer.classList.add('hiding');
      // Solma bitince harfler ve alt çizgiler başa sarılır; footer bu sırada görünmez kalır
      // (hiding bir sonraki girişe kadar durur). Aynı anda görünür yapılırsa alt çizgilerin
      // geri çekilmesi ekranda kendi kendine oynayan bir animasyon gibi görünür.
      fadeTimer = setTimeout(() => footer.classList.remove('show'), FADE_MS);
    }
  }
  // Klavyeyle footer'a gelinirse bilgiler hemen görünsün
  if (footer) footer.addEventListener('focusin', () => reveal(true));

  const proj = document.getElementById('screenTitle');
  splitFooter();
  layout();
  current = progress();
  apply(current);
  reveal(rawProgress() >= REVEAL);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { layout(); onScroll(); });
  // Fontlar yüklenince ölçü değişir
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
})();
