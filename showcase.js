// ===== Projeler: etrafımızda dönen kartlar =====
// Bakış noktası (kamera) dikey eksenli bir silindirin tam merkezindedir; kartlar silindirin iç
// yüzeyinde, etrafımızda durur. Her kart ince dikey şeritlere bölünür, böylece yüzeyde kavislenir.
// Kaydırdıkça silindir döner: kart sağdan dönerek ortaya gelir, ortada kısa bir an bekler,
// sıradaki kartın ucu sağ kenarda görünür; sonra o kart da aynı şekilde ortaya döner.
//
// Kartın üzerine gelince: karartma + proje adı + sağ altta "Siteye git" butonu.
// Karta tıklayınca: diğer kartlar kaybolur, kavisli kart düzleşir ve ekranın ortasına sabitlenir;
// üstünde proje adı, altında yıl, rol ve "Siteye git" belirir.
(() => {
  const root = document.getElementById('projectList');
  const cyl = document.getElementById('cyl');
  if (!root || !cyl) return;
  const cards = [...cyl.querySelectorAll('.cyl-card')];
  if (!cards.length) return;
  const view = cyl.parentElement;
  const stage = view.parentElement;

  const RATIO = 1763 / 844;  // tüm kartlar ilk proje görselinin oranında
  const STRIPS = window.LOW_END ? 24 : 36; // kart başına şerit (fazlası daha pürüzsüz kavis; zayıf cihazda daha az katman)
  const WIDTH_K = 0.62;      // ortadaki kartın genişliği = ekran genişliği × bu değer
  const RADIUS_K = 1.1;      // silindir yarıçapı = kart genişliği × bu değer (küçük = daha kavisli)
  const GAP_DEG = 4;         // kartlar arası boşluk: küçüldükçe sıradaki kartın ucu daha çok görünür
  const EDGE_DEG = 2;        // ilk kart sağda, son kart solda ekranın hemen dışında: kenardan bu kadar öte
  const LEAD = 0;            // dönüş, bölüm ekranın üstüne yapışmadan bu kadar (ekran boyu) önce başlar (0 = yapışınca başlar: kart yalnızca yandan girer)
  const DWELL = 0.7;         // kartın ortada bekleme hissi (0 = yok, 1'e yakın = belirgin)
  const VH_PER_CARD = 110;   // kart başına kaydırma mesafesi (vh)
  const VISIT_PAD = 14;      // "Siteye git" butonunun kart kenarına uzaklığı (px)

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Telefonda kartlar parmakla yatay gezilir; bölüm tek ekran boyudur, dikey kaydırma siteyi ilerletir (touch-scroll.js)
  const swipeMode = window.matchMedia('(pointer: coarse) and (max-width: 768px)').matches && !reduce.matches;
  let swipeU = 0;            // telefonda ortadaki kartın sırası (ara değerler: geçiş anı)
  const clamp = v => Math.min(1, Math.max(0, v));
  const cssUrl = src => `url("${src.replace(/"/g, '%22')}")`;
  // Şeritlerin üstündeki karartma katmanı: --hov (0–1) CSS'te üzerine gelince yumuşakça artar
  const SHADE = 'linear-gradient(rgb(14 11 8 / calc(var(--hov, 0) * 0.66)), rgb(14 11 8 / calc(var(--hov, 0) * 0.66)))';

  // Şeritleri ve düz (hareket azaltma) görseli kur
  const strips = cards.map(card => {
    const src = card.dataset.src;
    const flat = document.createElement('img');
    flat.className = 'cyl-flat';
    flat.src = src; flat.alt = ''; flat.width = 1763; flat.height = 844; flat.decoding = 'async';
    card.prepend(flat);
    const list = [];
    for (let s = 0; s < STRIPS; s++) {
      const el = document.createElement('span');
      el.className = 'cyl-strip';
      el.setAttribute('aria-hidden', 'true');
      el.style.backgroundImage = `${SHADE}, ${cssUrl(src)}`;
      flat.after(el);
      list.push(el);
    }
    return list;
  });

  let R = 0, stepDeg = 0, W = 0, H = 0, arc = 0, rot = 0, u0 = 0, u1 = 0;

  function layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    W = Math.max(240, Math.min(vw * (vw < 860 ? 0.86 : WIDTH_K), (vh - 200) * RATIO));
    H = W / RATIO;
    R = W * RADIUS_K;
    arc = (W / R) * 180 / Math.PI;     // kartın silindirde kapladığı açı
    stepDeg = arc + GAP_DEG;
    // Kamera silindirin merkezinde: perspektif uzaklığı = yarıçap
    view.style.setProperty('--persp', R.toFixed(1) + 'px');

    // Kartın ekrandan tam çıktığı açı: ekranın yarı görüş açısı + kartın yarısı.
    // İlk kart bu açıda sağda başlar (hemen girer), son kart aynı açıda solda biter (tamamen çıkar)
    const outDeg = Math.atan((vw / 2) / R) * 180 / Math.PI + arc / 2 + EDGE_DEG;
    u0 = -outDeg / stepDeg;
    u1 = cards.length - 1 + outDeg / stepDeg;
    // Kaydırma mesafesi: dönüş süresi + sticky boyu, eksi dönüşün erken başladığı pay
    root.style.height = reduce.matches ? '' : swipeMode ? '100svh' :
      `calc(${((u1 - u0) * VH_PER_CARD).toFixed(1)}vh + ${(100 - LEAD * 100).toFixed(1)}vh)`;

    const sw = W / STRIPS, sDeg = arc / STRIPS;
    // Buton kartın sağ alt köşesinde, kavisli yüzeyin üstünde durur
    const visitDeg = arc / 2 - (VISIT_PAD / R) * 180 / Math.PI;
    cards.forEach((card, i) => {
      card.style.transform = `rotateY(${(-i * stepDeg).toFixed(3)}deg)`;
      card.style.setProperty('--card-w', W.toFixed(1) + 'px');
      strips[i].forEach((el, s) => {
        const a = (s + 0.5) * sDeg - arc / 2;  // şeridin ekrandaki açısı: sağa doğru artı
        el.style.left = (-sw / 2).toFixed(2) + 'px';
        el.style.top = (-H / 2).toFixed(2) + 'px';
        el.style.width = (sw + 2).toFixed(2) + 'px';     // komşu şeride hafif biner: aralarda çizgi oluşmaz
        el.style.height = H.toFixed(2) + 'px';
        el.style.backgroundSize = `100% 100%, ${W.toFixed(1)}px 100%`;
        el.style.backgroundPosition = `0 0, ${(-s * sw).toFixed(2)}px 0`;
        // İç yüzey: şerit merkezden R uzakta, yüzü merkeze (bize) dönük
        el.style.transform = `rotateY(${(-a).toFixed(3)}deg) translateZ(${(-R).toFixed(1)}px)`;
      });
      const label = card.querySelector('.cyl-label');
      const visit = card.querySelector('.cyl-visit');
      if (reduce.matches) {
        label.style.transform = visit.style.transform = '';
        return;
      }
      // Silindirin iç yüzeyi kenarlara doğru bize yaklaşır; düz başlık o kavsin önünde kalsın diye
      // biraz öne alınır (LABEL_Z) ve aynı oranda küçültülür ki ekranda boyu değişmesin.
      const LABEL_Z = 0.86;
      label.style.transform = `translateZ(${(-R * LABEL_Z).toFixed(1)}px) scale(${LABEL_Z}) translate(-50%, -50%)`;
      // Buton: ortası yüzeye teğet olacak şekilde sağ alt köşeye, kavsin hemen önüne
      const bw = visit.offsetWidth || 120;
      const vDeg = visitDeg - ((bw / 2) / R) * 180 / Math.PI;
      // Kamera silindirin merkezinde olduğu için öne alıp aynı oranda küçültmek ekrandaki yerini değiştirmez
      const VISIT_Z = 0.94;
      visit.style.transform = `rotateY(${(-vDeg).toFixed(3)}deg) translateZ(${(-R * VISIT_Z).toFixed(1)}px) scale(${VISIT_Z}) ` +
        `translateY(${(H / 2 - VISIT_PAD).toFixed(1)}px) translate(-50%, -100%)`;
    });
  }

  let ticking = false;
  function update() {
    ticking = false;
    if (reduce.matches) { cyl.style.transform = ''; return; }
    const vh = window.innerHeight;
    const r = root.getBoundingClientRect();
    // Dönüş, sahne ekranın üstüne yapışmadan LEAD kadar önce başlar ve son kart ekrandan çıktığında
    // biter; tam o anda sahnenin yapışması da çözülür ve sayfa kaymaya devam eder
    const lead = LEAD * vh;
    const p = clamp((lead - r.top) / Math.max(1, lead + r.height - vh));

    // Konum "kart birimi" cinsinden: tam sayılar kartın tam ortada olduğu anlar
    const u = swipeMode ? swipeU : u0 + (u1 - u0) * p;
    // Yalnızca kartlar ortadayken yavaşla; giriş ve çıkışta akış kesintisiz
    const ud = !swipeMode && u > 0 && u < cards.length - 1
      ? u - DWELL * Math.sin(2 * Math.PI * u) / (2 * Math.PI)
      : u;
    rot = ud * stepDeg;

    // Silindirin merkezi kameranın olduğu yere taşınır, sonra döndürülür
    cyl.style.transform = `translateZ(${R.toFixed(1)}px) rotateY(${rot.toFixed(3)}deg)`;
    // Arkamızda ya da yanımızda kalan kartlar çizilmesin
    cards.forEach((card, i) => {
      if (card.dataset.open) return;
      card.style.visibility = Math.abs(i * stepDeg - rot) < 85 ? '' : 'hidden';
    });
  }

  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  let rz;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { layout(); update(); }, 120); });
  window.addEventListener('scroll', request, { passive: true });
  reduce.addEventListener('change', () => { layout(); update(); });
  layout();
  update();

  // Telefonda parmakla kart gezme: touch-scroll.js yatay hareketi buraya iletir.
  // Bırakınca en yakın karta oturur; hızlı kaydırmada en fazla bir kart ilerler.
  if (swipeMode) {
    let startCard = 0, snapFrame = 0;
    const pxPerCard = () => W * stepDeg / arc;
    const last = cards.length - 1;
    window.CYL_SWIPE = {
      start() { cancelAnimationFrame(snapFrame); startCard = Math.round(swipeU); },
      move(dx) { swipeU = Math.min(last + 0.15, Math.max(-0.15, swipeU - dx / pxPerCard())); update(); },
      end(speed) {
        const projected = Math.round(swipeU - speed * 180 / pxPerCard());
        const target = Math.min(last, Math.max(0, Math.min(startCard + 1, Math.max(startCard - 1, projected))));
        const frame = () => {
          swipeU += (target - swipeU) * 0.16;
          if (Math.abs(target - swipeU) < 0.002) { swipeU = target; update(); return; }
          update();
          snapFrame = requestAnimationFrame(frame);
        };
        snapFrame = requestAnimationFrame(frame);
      },
    };
  }

  // =====================================================================
  //  Proje bilgileri: geçiş animasyonu + harf harf beliren metin
  // =====================================================================
  const S = window.SITE;
  if (!S || !S.projects) return;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isReal = url => url && url !== '#';
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const nextFrame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const ICON_EXT = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" /></svg>';
  const ICON_BACK = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>';

  // Butona basınca yalnızca site açılır; kartın açılması tetiklenmez
  cards.forEach(card => {
    const visit = card.querySelector('.cyl-visit');
    visit.addEventListener('click', e => {
      e.stopPropagation();
      // Bağlantısız butonda odak kalmasın (fareyle tıklayınca katmanı açık tutmasın)
      if (visit.dataset.soon) { e.preventDefault(); if (e.detail) visit.blur(); }
    });
    // Fareyle kartın her yeri açar; klavyede kartın içindeki gizli .cyl-open düğmesi (tıklaması buraya gelir)
    card.addEventListener('click', () => open(+card.dataset.i));
  });

  // Proje katmanı açıkken arkadaki sayfa klavye ve ekran okuyucu için kapalıdır
  const setBackgroundInert = on => document.querySelectorAll('.skip-link, #nav, main, .contact-end, .to-top')
    .forEach(el => { el.inert = on; });

  // Metni harflere böler: her harf kendi etrafında dönerek sırayla belirir.
  // Kelimeler bölünmesin diye harfler kelime kutularında durur; ekran okuyucu tam metni okur.
  let charIndex = 0;
  function spinChars(text) {
    return String(text ?? '').split(/(\s+)/).map(w => {
      if (!w) return '';
      if (/^\s+$/.test(w)) return ' ';
      return `<span class="pd-word">${[...w].map(ch => `<span class="pd-ch" style="--n:${charIndex++}">${esc(ch)}</span>`).join('')}</span>`;
    }).join('');
  }
  function spinText(text) {
    return `<span class="pd-sr">${esc(text)}</span><span aria-hidden="true">${spinChars(text)}</span>`;
  }

  const ICON_PREV = '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>';
  const ICON_NEXT = '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>';
  const SLIDE_MS = 1100;     // projeler arası geçişte görselin yana kayma süresi

  // Kartın üstünde ortada proje adı, altında yıl + rol ve "Siteye git" (menüdeki linklerle aynı animasyon).
  // Harflerin sırası (--n) başlıktan "Siteye git"e kadar devam eder; giriş ve çıkış bu sırayla olur.
  function fillText(p) {
    charIndex = 0;
    // Sağ üstte proje numarası (01 / 04): diğer yazılarla aynı harf harf dönüşle girip çıkar
    const pad = n => String(n).padStart(2, '0');
    const no = S.projects.indexOf(p) + 1;
    overlay.querySelector('.pd-count').innerHTML =
      `<span class="pd-sr">Proje ${no} / ${S.projects.length}</span><span aria-hidden="true">` +
      `${spinChars(pad(no))}<span class="pd-count-sep">${spinChars('/')}</span>${spinChars(pad(S.projects.length))}</span>`;
    overlay.querySelector('.pd-head').innerHTML = `<h2 class="pd-title" id="pdTitle">${spinText(p.name)}</h2>`;
    const facts = [['Yıl', p.year], ['Rol', p.role], ['Teknolojiler', (p.tags || []).join(', ')]].filter(f => f[1]);
    const real = isReal(p.url);
    overlay.querySelector('.pd-meta').innerHTML = `
      ${facts.length ? `<dl class="pd-facts">${facts.map(([k, v]) => `<div><dt>${spinText(k)}</dt><dd>${spinText(v)}</dd></div>`).join('')}</dl>` : ''}
      <div class="pd-links">
        ${isReal(p.repo) ? `<a class="pd-visit" href="${esc(p.repo)}" target="_blank" rel="noopener" aria-label="${esc(p.name)} kaynak kodu, GitHub">GitHub ${ICON_EXT}</a>` : ''}
        <a class="pd-visit" href="${esc(real ? p.url : '#')}" ${real ? 'target="_blank" rel="noopener"' : 'data-soon="1" title="Canlı bağlantı yakında"'}>Siteye git ${ICON_EXT}</a>
      </div>`;
    overlay.querySelectorAll('.pd-visit').forEach(link => {
      if (link.dataset.soon) link.addEventListener('click', e => e.preventDefault());
      // Menüdeki harf kayması; harf kutuları ayrıca dönerek girip çıkar (kayma içteki harfte, dönüş kutuda)
      if (window.rollText) window.rollText(link);
      link.querySelectorAll('.roll-ch').forEach(box => { box.classList.add('pd-ch'); box.style.setProperty('--n', charIndex++); });
      link.style.setProperty('--n', charIndex);
    });
    const total = Math.max(1, charIndex);
    overlay.style.setProperty('--step', Math.min(24, 2600 / total).toFixed(2) + 'ms');
    overlay.style.setProperty('--step-out', Math.min(14, 700 / total).toFixed(2) + 'ms');
    return total;
  }

  function makeFly(i) {
    const fly = document.createElement('div');
    fly.className = 'pd-card';
    fly.innerHTML = `<div class="pd-tilt"><div class="pd-breath"><img src="${esc(cards[i].dataset.src)}" alt="${esc(S.projects[i].name)} ekran görüntüsü" width="1763" height="844"></div></div>`;
    return fly;
  }

  let overlay = null, busy = false, current = -1, pushed = false, textCount = 0;
  let keepY = 0;   // kapatınca sayfanın duracağı yer (geri tuşu eski kaydırma konumunu geri yükleyebilir)

  async function open(i) {
    if (busy || current !== -1) return;
    const p = S.projects[i];
    const card = cards[i];
    if (!p || !card) return;
    busy = true;
    current = i;
    const motion = !reduce.matches;

    overlay = document.createElement('div');
    overlay.className = 'pd';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'pdTitle');
    overlay.innerHTML = `
      <div class="pd-bg" aria-hidden="true"></div>
      <div class="pd-scroll">
        <button class="pd-close" type="button" aria-label="Projelere dön">${ICON_BACK}<span>Projeler</span></button>
        <p class="pd-count"></p>
        <div class="pd-layout">
          <div class="pd-head"></div>
          <div class="pd-slot"><div class="pd-slot-in" style="aspect-ratio:${RATIO}"></div></div>
          <div class="pd-meta"></div>
        </div>
      </div>
      ${S.projects.length > 1 ? `
      <button class="pd-arrow pd-prev" type="button" aria-label="Önceki proje">${ICON_PREV}</button>
      <button class="pd-arrow pd-next" type="button" aria-label="Sonraki proje">${ICON_NEXT}</button>` : ''}`;
    textCount = fillText(p);
    // Geri butonunda menüdeki harf kayması (script.js); yazısı span içinde, tetikleyici butonun kendisi
    const closeBtn = overlay.querySelector('.pd-close');
    if (window.rollText) window.rollText(closeBtn.querySelector('span'), closeBtn);
    const sr = stage.getBoundingClientRect();   // kilitten önce ölç
    keepY = window.scrollY;
    document.body.appendChild(overlay);
    setBackgroundInert(true);
    // Kaydırma çubuğu kaybolunca sayfa kaymasın: yerine aynı genişlikte boşluk bırakılır
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    if (gutter > 0) document.body.style.paddingRight = gutter + 'px';
    document.body.classList.add('pd-lock');

    closeBtn.addEventListener('click', requestClose);
    overlay.querySelector('.pd-prev')?.addEventListener('click', () => step(-1));
    overlay.querySelector('.pd-next')?.addEventListener('click', () => step(1));
    if (!pushed) { history.pushState({ pd: p.slug }, '', '#proje-' + p.slug); pushed = true; }

    // Uçacak düz kart: düzleşen kartın yerinden büyüyerek ortaya gelir
    const fly = makeFly(i);
    const slot = overlay.querySelector('.pd-slot-in');

    if (!motion) {
      slot.appendChild(fly);
      overlay.classList.add('in', 'landed', 'go');
      busy = false;
      overlay.querySelector('.pd-close').focus({ preventScroll: true, focusVisible: false });
      return;
    }

    // 1) Kavisli kartın aynısı: aynı perspektif ve açıyla, sayfadaki kartın tam üstüne kurulur
    const bend = document.createElement('div');
    bend.className = 'pd-bend';
    bend.style.cssText = `left:${sr.left}px;top:${sr.top}px;width:${sr.width}px;height:${sr.height}px;perspective:${R.toFixed(1)}px`;
    const axis = document.createElement('div');
    axis.className = 'pd-axis';
    const rel = rot - current * stepDeg;
    axis.style.transform = `translateZ(${R.toFixed(1)}px) rotateY(${rel.toFixed(3)}deg)`;
    const sw = W / STRIPS;
    const clones = strips[i].map((src, s) => {
      const el = document.createElement('span');
      el.className = 'pd-strip';
      el.style.cssText = `left:${src.style.left};top:${src.style.top};width:${src.style.width};height:${src.style.height};` +
        `background-image:${cssUrl(card.dataset.src)};background-size:${W.toFixed(1)}px 100%;background-position:${(-s * sw).toFixed(2)}px 0;`;
      const a = (s + 0.5) * (arc / STRIPS) - arc / 2;
      el.style.transform = `translateX(0px) rotateY(${(-a).toFixed(3)}deg) translateZ(${(-R).toFixed(1)}px)`;
      el.dataset.flat = `translateX(${((s + 0.5) * sw - W / 2).toFixed(2)}px) rotateY(0deg) translateZ(${(-R).toFixed(1)}px)`;
      axis.appendChild(el);
      return el;
    });
    bend.appendChild(axis);
    overlay.appendChild(bend);
    card.dataset.open = '1';
    card.style.visibility = 'hidden';

    await nextFrame();
    // 2) Diğer kartlar kaybolur; bu kart düzleşip ekrana doğru döner
    stage.classList.add('pd-away');
    overlay.classList.add('in');
    axis.style.transform = `translateZ(${R.toFixed(1)}px) rotateY(0deg)`;
    clones.forEach(el => { el.style.transform = el.dataset.flat; });
    await wait(540);

    // 3) Düzleşen kart ekranın ortasındaki yerine kayar ve orada sabitlenir
    const from = { x: sr.left + sr.width / 2 - W / 2, y: sr.top + sr.height / 2 - H / 2, w: W };
    slot.appendChild(fly);
    const to = slot.getBoundingClientRect();
    bend.remove();
    const dx = from.x - to.left, dy = from.y - to.top, k = from.w / to.width;
    const anim = fly.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${k})` },
      { transform: 'none' }
    ], { duration: 580, easing: 'cubic-bezier(0.65, 0, 0.25, 1)' });
    await anim.finished.catch(() => {});

    // 4) Bilgiler harf harf dönerek belirir
    overlay.classList.add('landed', 'go');
    busy = false;
    overlay.querySelector('.pd-close').focus({ preventScroll: true, focusVisible: false });
  }

  // Proje bilgileri kaydırılamaz: tekerlek ve dokunmatik kaydırma arkadaki sayfaya da geçmez
  const noScroll = e => { if (overlay) e.preventDefault(); };
  window.addEventListener('wheel', noScroll, { passive: false });
  window.addEventListener('touchmove', noScroll, { passive: false });

  // Sayfadaki silindiri arka planda i. kart ortada duracak şekilde kaydırır: kapatınca o proje görünür
  function scrollToCard(i) {
    if (reduce.matches) return;
    const r = root.getBoundingClientRect();
    if (swipeMode) {
      swipeU = i;
      keepY = r.top + window.scrollY;
      window.scrollTo({ top: keepY, behavior: 'instant' });
      update();
      return;
    }
    const p = (i - u0) / (u1 - u0);
    keepY = r.top + window.scrollY + p * (r.height - window.innerHeight);
    window.scrollTo({ top: keepY, behavior: 'instant' });
    update();
  }

  // Projeler arası geçiş: yazılar harf harf dönerek kaybolur, görsel yana kayıp yerini
  // sıradakine bırakır, yeni projenin yazıları yine harf harf dönerek gelir
  async function step(dir) {
    if (busy || !overlay || !overlay.classList.contains('landed')) return;
    busy = true;
    const n = S.projects.length;
    const prev = current;
    const next = (current + dir + n) % n;
    const p = S.projects[next];
    const motion = !reduce.matches;
    const slot = overlay.querySelector('.pd-slot-in');
    const oldFly = slot.querySelector('.pd-card');
    const fly = makeFly(next);
    const img = fly.querySelector('img');

    // 1) Yazılar çıkar; bu sırada yeni görsel hazırlanır
    overlay.classList.remove('go');
    overlay.classList.add('leave');
    const outMs = motion ? 520 + textCount * parseFloat(overlay.style.getPropertyValue('--step-out')) : 0;
    const textOut = wait(outMs);
    await Promise.race([img.decode().catch(() => {}), wait(800)]);

    // 2) Görsel yana kayar, sıradaki aynı yönden gelir.
    // Yeni görsel sayfaya ancak kaymaya başlarken eklenir; önceden eklenirse bir an yerinde görünür.
    fly.classList.add('pd-card-in');
    if (motion) {
      await wait(Math.min(260, outMs / 3));
      const dist = window.innerWidth;
      const opts = { duration: SLIDE_MS, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both' };
      fly.style.transform = `translateX(${dir * dist}px)`;
      slot.appendChild(fly);
      const a = oldFly.animate([{ transform: 'none' }, { transform: `translateX(${-dir * dist}px)` }], opts);
      const b = fly.animate([{ transform: `translateX(${dir * dist}px)` }, { transform: 'none' }], opts);
      fly.style.transform = '';
      await Promise.all([a.finished, b.finished, textOut].map(x => Promise.resolve(x).catch(() => {})));
      b.cancel();
    } else {
      slot.appendChild(fly);
    }
    oldFly.remove();
    fly.classList.remove('pd-card-in');

    // Sayfadaki kart da değişir (kapatınca yeni proje ortada görünsün)
    delete cards[prev].dataset.open;
    cards[next].dataset.open = '1';
    current = next;
    scrollToCard(next);
    cards[next].style.visibility = 'hidden';
    history.replaceState({ pd: p.slug }, '', '#proje-' + p.slug);

    // 3) Yeni yazılar harf harf dönerek girer
    overlay.classList.remove('leave');
    textCount = fillText(p);
    await nextFrame();
    overlay.classList.add('go');
    busy = false;
  }

  function requestClose() {
    if (busy) return;
    if (pushed) history.back(); else close();
  }

  async function close() {
    if (!overlay || busy) return;
    busy = true;
    const card = cards[current];
    overlay.classList.add('out');
    const restore = () => { if (Math.abs(window.scrollY - keepY) > 1) { window.scrollTo({ top: keepY, behavior: 'instant' }); update(); } };
    restore();
    requestAnimationFrame(restore);
    stage.classList.remove('pd-away');
    if (card) { delete card.dataset.open; update(); }
    await wait(reduce.matches ? 0 : 450);
    restore();
    overlay.remove();
    overlay = null;
    document.body.classList.remove('pd-lock');
    document.body.style.paddingRight = '';
    current = -1;
    busy = false;
    setBackgroundInert(false);
    if (card) card.querySelector('.cyl-open').focus({ preventScroll: true });
  }

  window.addEventListener('popstate', () => {
    pushed = false;
    if (overlay) close();
  });
  document.addEventListener('keydown', e => {
    if (!overlay) return;
    if (e.key === 'Escape') requestClose();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  // Paylaşılan proje bağlantısı (index.html#proje-slug): yükleme bitince sayfa o kartın olduğu yere
  // iner ve proje bilgileri açılır. Geri tuşu / kapat, ziyaretçiyi projelerin arasında bırakır.
  const deep = S.projects.findIndex(p => p.slug === window.DEEP_PROJECT);
  if (deep !== -1) {
    const go = () => {
      if (reduce.matches) document.getElementById('projeler')?.scrollIntoView({ behavior: 'instant' });
      else scrollToCard(deep);
      requestAnimationFrame(() => requestAnimationFrame(() => open(deep)));
    };
    if (window.siteReady) go(); else window.addEventListener('site-ready', go, { once: true });
  }
})();
