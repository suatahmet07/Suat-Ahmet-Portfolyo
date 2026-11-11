// ===== Yenileyince konum =====
// Tarayıcı eski kaydırma konumunu geri yüklemesin. Adresteki #bölüm / #proje-... yükleme boyunca geçici
// olarak silinir ki sayfa yüklenirken oraya atlamasın; yükleme bitince ikisi de geri gelir:
// #proje-slug → showcase.js o projeyi açar · #bölüm → aşağıdaki restoreHash oraya iner.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.DEEP_PROJECT = (/^#proje-(.+)$/.exec(location.hash) || [])[1] || null;
const startHash = window.DEEP_PROJECT ? '' : location.hash;
if (location.hash) history.replaceState(null, '', location.pathname + location.search);
window.scrollTo(0, 0);
window.addEventListener('load', () => window.scrollTo(0, 0));

function restoreHash() {
  if (!startHash) return;
  let id = startHash.slice(1);
  try { id = decodeURIComponent(id); } catch (e) { /* bozuk adres: olduğu gibi aranır */ }
  const target = document.getElementById(id);
  if (!target) return;
  history.replaceState(null, '', location.pathname + location.search + startHash);
  target.scrollIntoView({ behavior: 'instant' });
}

// ===== 3D çalışmazsa düz görünüm =====
// WebGL yoksa, Three.js CDN'den gelmezse ya da model yüklenemezse çağrılır: boş sahneler kapanır,
// "Hakkımda" bilgileri düz metin olarak görünür (style.css html.no-3d) ve yükleme ekranı beklemez.
window.fail3D = reason => {
  console.warn('3D kapatıldı:', reason);
  document.documentElement.classList.add('no-3d');
  const hint = document.querySelector('.intro-hint');
  if (hint) hint.setAttribute('href', '#projeler');
  document.getElementById('laptopCanvas')?.dispatchEvent(new Event('ready'));
};

// ===== Yükleme ekranı =====
// Sayfa, yazı tipleri ve 3D bilgisayar modeli hazır olunca kaybolur (en fazla 8 sn bekler).
// Soluk logo beklerken dalgalanan siyah sıvıyla yavaşça %90'a kadar dolar, hazır olunca tamamen dolar;
// ardından "portfolyo" yazısı logonun arkasından kayarak çıkar ve site açılır.
(() => {
  const root = document.documentElement;
  const loader = document.getElementById('loader');
  // Yükleme bitince 'site-ready' olayı yayınlanır (paylaşılan proje bağlantısı bunu bekler)
  const done = () => { restoreHash(); window.siteReady = true; window.dispatchEvent(new Event('site-ready')); };
  const pageLoad = document.readyState === 'complete' ? Promise.resolve()
    : new Promise(r => window.addEventListener('load', r, { once: true }));
  // Bu oturumda daha önce gösterildiyse yükleme ekranı yok; yine de sayfa ölçüleri oturana kadar beklenir
  if (!loader || !root.classList.contains('is-loading')) { loader?.remove(); pageLoad.then(done); return; }
  const level = document.getElementById('ldLevel');
  // Yazının genişliği: yazı çıkarken logo bunun yarısı kadar sola kayar ki ikili ortada kalsın
  const logo = loader.querySelector('.loader-logo');
  const word = loader.querySelector('.loader-word > span');
  const measure = () => logo.style.setProperty('--ww', word.offsetWidth + 'px');
  const EMPTY = 154, FULL = 46;          // sıvı yüzeyinin y'si (logo 54–147.5 arasında; dalga payı dahil)
  const MIN_MS = 1800;                   // çok hızlı yüklense de dolum yavaş görünsün
  const start = performance.now();
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let ready = false, shown = 0, last = start, onFull;
  const full = new Promise(r => { onFull = r; });

  (function tick(now) {
    now = now || performance.now();
    const t = (now - start) / 1000;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // Beklerken hedef %90'a yavaşça yaklaşır; hazır olunca %100
    const target = ready ? 1 : 0.9 * (1 - Math.exp(-t * 0.7));
    shown += (target - shown) * (1 - Math.exp(-dt * (ready ? 3.2 : 6)));
    if (ready && shown > 0.995) shown = 1;
    level.setAttribute('transform', `translate(0 ${(EMPTY - shown * (EMPTY - FULL)).toFixed(2)})`);
    if (shown === 1) { onFull(); return; }
    requestAnimationFrame(tick);
  })();

  // Yüklenirken kaydırma yok (sayfa en baştan başlasın)
  const block = e => e.preventDefault();
  window.addEventListener('wheel', block, { passive: false });
  window.addEventListener('touchmove', block, { passive: false });

  const canvas = document.getElementById('laptopCanvas');
  const model = canvas ? new Promise(r => canvas.addEventListener('ready', r, { once: true })) : Promise.resolve();
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();

  Promise.race([Promise.all([pageLoad, model, fonts]), sleep(8000)]).then(async () => {
    const left = MIN_MS - (performance.now() - start);
    if (left > 0) await sleep(left);
    ready = true;
    await full;
    // Logo doldu: yazı arkasından kayarak çıkar, kısa bir an durur, sonra site açılır
    await sleep(200);
    measure();   // yazı tipi yüklenmiş hâliyle
    loader.classList.add('ld-show-word');
    await sleep(1500);
    window.scrollTo(0, 0);
    window.removeEventListener('wheel', block);
    window.removeEventListener('touchmove', block);
    loader.classList.add('leaving');
    root.classList.remove('is-loading');
    try { sessionStorage.setItem('sa-loader-seen', '1'); } catch (e) { /* gizli sekme: her seferinde gösterilir */ }
    done();
    setTimeout(() => loader.remove(), 900);
  });
})();

const links = document.getElementById('navLinks');

// ===== Buton yazıları: harf harf yukarı kayma için her harf ayrı kutuya bölünür =====
// Menüdeki ve sitedeki tüm butonlarda aynı animasyon (footer'da yalnızca hızlı ulaşım). Yalnızca yazı bölünür,
// simgeler (svg) yerinde kalır. Ekran okuyucu tek parça adı duysun diye ad aria-label'da, harfler gizli.
// host: üzerine gelinince animasyonu başlatan ve adı taşıyan öğe (varsayılan: yazının kendisi)
function rollText(el, host = el) {
  if (!el || el.classList.contains('roll-host') || el.querySelector('.roll')) return;
  const nodes = [...el.childNodes].filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  if (!nodes.length) return;
  const text = nodes.map(n => n.textContent.trim()).join(' ');
  if (!host.hasAttribute('aria-label')) host.setAttribute('aria-label', text);
  host.classList.add('roll-host');
  let i = 0;
  nodes.forEach(node => {
    const roll = document.createElement('span');
    roll.className = 'roll';
    roll.setAttribute('aria-hidden', 'true');
    [...node.textContent.trim()].forEach(c => {
      // Boşluk tek başına bir kutuda genişliksiz kalır: bölünmez boşluk kullanılır
      const glyph = c === ' ' ? ' ' : c;
      const box = document.createElement('span');
      box.className = 'roll-ch';
      const ch = document.createElement('span');
      ch.style.setProperty('--i', i++);
      ch.dataset.c = glyph;
      ch.textContent = glyph;
      box.appendChild(ch);
      roll.appendChild(box);
    });
    node.replaceWith(roll);
  });
}
window.rollText = rollText;

const ROLL_SELECTOR = '.nav-links a, .footer-nav a, .scroll-hint, .cyl-visit, .pd-close';
document.querySelectorAll(ROLL_SELECTOR).forEach(el => rollText(el));
// Footer'daki logolu sosyal butonlar: yazı aynı şekilde kayar, alt çizgi yerine renkli zemin açılır
document.querySelectorAll('.social .social-label').forEach(label => rollText(label, label.closest('.social')));

// ===== Başa dön oku =====
// Bir buçuk ekran kaydırınca belirir; sayfa sonunda footer'daki logo aynı işi yaptığı için gizlenir.
// Uzun animasyonlu sahnelerden geçmemek için yumuşak kayma yerine doğrudan en üste atar.
(() => {
  const btn = document.getElementById('toTop');
  if (!btn) return;
  const update = () => {
    const vh = window.innerHeight;
    const nearEnd = window.scrollY + vh >= document.documentElement.scrollHeight - vh * 0.5;
    btn.classList.toggle('show', window.scrollY > vh * 1.5 && !nearEnd);
  };
  btn.addEventListener('click', e => {
    e.preventDefault();
    history.replaceState(null, '', location.pathname + location.search);
    window.scrollTo({ top: 0, behavior: 'instant' });
    btn.blur();
  });
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// ===== Kaydırınca belirme =====
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealEls = document.querySelectorAll('.reveal');

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach(el => el.classList.add('visible'));
} else {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  // Aynı gruptaki öğeler sırayla belirsin
  revealEls.forEach(el => {
    const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 4) * 60}ms`;
    observer.observe(el);
  });
}

// ===== Ana sayfada aktif menü öğesi =====
const navAnchors = [...links.querySelectorAll('a[href^="#"]')];
if (navAnchors.length) {
  // Menüde olmayan bölümler (giriş, bilgisayar sahnesi) da izlenir ki vurgu temizlensin.
  // Bağlantının hedefi bölümün içindeki bir işaret olabilir (Hakkımda → kitabın açıldığı nokta)
  // İletişim alanı (dönen başlık + footer) main'in dışında, tek parça izlenir
  const sections = [...document.querySelectorAll('main > section[id], .contact-end')];
  const ownerOf = a => {
    const t = document.querySelector(a.getAttribute('href'));
    return t && (t.closest('main > section, .contact-end') || t);
  };
  const mark = el => navAnchors.forEach(a => {
    const active = ownerOf(a) === el;
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
  });
  // İletişim kısa olduğu için ekranın ortasına hiç gelmez: sayfanın en altındayken onu işaretle
  const footer = document.querySelector('.contact-end');
  const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  let current = null;
  const update = () => mark(footer && atBottom() ? footer : current);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) current = entry.target; });
    update();
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));
  if (footer) window.addEventListener('scroll', update, { passive: true });
}
