// ===== Telefonda kaydırma =====
// Parmak sayfayı normalden daha çok ilerletir; bırakınca sayfa kendi kendine süzülür ve yavaşlayarak durur.
// Süzülme, proje kartlarında ve kitabın açıldığı yerde durur: oradan devam etmek için yeniden kaydırmak gerekir.
// Proje kartlarının üstünde yatay kaydırma kartları gezdirir (showcase.js CYL_SWIPE); dikey kaydırma siteyi ilerletir.
// Yalnızca telefon boyutundaki dokunmatik ekranlarda ve "hareketi azalt" kapalıyken çalışır.
(() => {
  const phone = window.matchMedia('(pointer: coarse) and (max-width: 768px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!phone.matches || reduce.matches) return;

  const DRAG_GAIN = 1.6;    // parmağın 1 px'i sayfayı bu kadar ilerletir
  const GLIDE_MS = 650;     // süzülme süresi hissi: büyüdükçe daha uzağa ve daha uzun süzülür
  const MAX_SPEED = 6;      // en yüksek süzülme hızı (px/ms)
  const MAGNET = 0.35;      // süzülme bir durağa bu kadar (ekran boyu) yakın biterse durağa oturur
  const LOCK_PX = 8;        // yön (yatay/dikey) bu kadar hareketten sonra belirlenir
  const SAMPLE_MS = 100;    // bırakma hızı son bu kadar milisaniyeden ölçülür

  const landscape = window.matchMedia('(orientation: landscape)');
  const blocked = () => document.body.classList.contains('pd-lock')
    || document.documentElement.classList.contains('is-loading')
    || landscape.matches;
  const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
  const pageY = el => el.getBoundingClientRect().top + window.scrollY;

  // Duraklar: proje kartlarının ekrana oturduğu yer ve kitabın açıldığı yer
  function stops() {
    const list = [];
    const cards = document.getElementById('projectList');
    const book = document.getElementById('hakkimda');
    if (cards) list.push(pageY(cards));
    if (book) list.push(pageY(book) - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop || 0));
    return list;
  }

  // Bir hareket, başladığı yerin iki yanındaki ilk durağı geçemez; durağın üstünden başlayan hareket serbesttir
  function limits(start, list) {
    let low = 0, high = maxY();
    for (const s of list) {
      if (s > start + 2) high = Math.min(high, s);
      if (s < start - 2) low = Math.max(low, s);
    }
    return { low, high };
  }

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const place = y => window.scrollTo({ top: y, behavior: 'instant' });

  let touch = null, glideFrame = 0;
  const stopGlide = () => { cancelAnimationFrame(glideFrame); glideFrame = 0; };

  function glide(from, speed, t) {
    if (Math.abs(speed) < 0.05) return;
    let target = from + clamp(speed, -MAX_SPEED, MAX_SPEED) * GLIDE_MS;
    // Durağın yakınında biten süzülme durağa oturur
    for (const s of t.stops) {
      if ((s - from) * speed > 0 && Math.abs(target - s) < window.innerHeight * MAGNET) target = s;
    }
    target = clamp(target, t.low, t.high);
    let y = from, last = performance.now();
    const frame = now => {
      const dt = Math.min(50, now - last);
      last = now;
      y += (target - y) * (1 - Math.exp(-dt / GLIDE_MS));
      if (Math.abs(target - y) < 1.5) { place(target); glideFrame = 0; return; }
      place(y);
      glideFrame = requestAnimationFrame(frame);
    };
    glideFrame = requestAnimationFrame(frame);
  }

  window.addEventListener('touchstart', e => {
    stopGlide();
    if (e.touches.length !== 1 || blocked()) { touch = null; return; }
    const p = e.touches[0];
    const start = window.scrollY;
    const list = stops();
    touch = {
      x0: p.clientX, y0: p.clientY, lastX: p.clientX, lastY: p.clientY,
      y: start, axis: null, samples: [], stops: list, ...limits(start, list),
      cards: !!(e.target.closest && e.target.closest('#projectList')),
    };
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (!touch) return;
    if (e.touches.length !== 1) { touch = null; return; }
    const p = e.touches[0];
    const dx = p.clientX - touch.x0, dy = p.clientY - touch.y0;

    if (!touch.axis) {
      const dist = Math.hypot(dx, dy);
      if (dist < 4) return;                 // küçük titreme dokunma sayılsın
      if (window.scrollY <= 0 && dy > Math.abs(dx)) { touch = null; return; } // en üstte aşağı çekmek: sayfayı yenileme
      if (e.cancelable) e.preventDefault();
      if (dist < LOCK_PX) return;
      touch.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      touch.lastX = p.clientX;
      touch.lastY = p.clientY;
      if (touch.axis === 'y') window.dispatchEvent(new Event('page-scroll-start'));
      else if (touch.cards) window.CYL_SWIPE?.start();
      return;
    }

    if (e.cancelable) e.preventDefault();
    const now = performance.now();
    touch.samples.push({ t: now, x: p.clientX, y: p.clientY });
    while (touch.samples.length > 2 && now - touch.samples[0].t > SAMPLE_MS) touch.samples.shift();
    if (touch.axis === 'y') {
      touch.y = clamp(touch.y - (p.clientY - touch.lastY) * DRAG_GAIN, touch.low, touch.high);
      place(touch.y);
    } else if (touch.cards) {
      window.CYL_SWIPE?.move(p.clientX - touch.lastX);
    }
    touch.lastX = p.clientX;
    touch.lastY = p.clientY;
  }, { passive: false });

  function finish() {
    const t = touch;
    touch = null;
    if (!t || !t.axis) return;
    const a = t.samples[0], b = t.samples[t.samples.length - 1];
    // Parmak durup sonra kalkarsa süzülme yok. Eşik, yavaş cihazlarda olayların seyrek gelmesine göre uzar
    const gap = a && b !== a ? (b.t - a.t) / (t.samples.length - 1) : 0;
    const fresh = a && b !== a && performance.now() - b.t < Math.max(120, gap * 1.5);
    const dt = fresh ? Math.max(1, b.t - a.t) : 1;
    if (t.axis === 'y') glide(t.y, fresh ? -(b.y - a.y) / dt * DRAG_GAIN : 0, t);
    else if (t.cards) window.CYL_SWIPE?.end(fresh ? (b.x - a.x) / dt : 0);
  }
  window.addEventListener('touchend', e => { if (!e.touches.length) finish(); }, { passive: true });
  window.addEventListener('touchcancel', finish, { passive: true });
})();
