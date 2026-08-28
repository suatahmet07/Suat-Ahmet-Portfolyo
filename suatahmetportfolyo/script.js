document.addEventListener('DOMContentLoaded', () => {
  const introScreen = document.getElementById('intro-screen');
  const ambientGlow = document.querySelector('.ambient-glow');
  const welcomeContainer = document.querySelector('.welcome-container');
  const monogram = document.querySelector('.monogram');
  const mainContent = document.getElementById('main-content');
  const themeToggles = document.querySelectorAll('.theme-toggle');

  // MOBİL TARAYICI ÇUBUĞUNUN RENGİ
  const TEMA_CUBUK_RENGI = { dark: '#0b0b0c', light: '#fbfaf7' };
  const themeColorMeta = document.getElementById('theme-color-meta');

  function temaRenginiGuncelle(tema) {
    if (!themeColorMeta) return;
    themeColorMeta.setAttribute('content', TEMA_CUBUK_RENGI[tema] || TEMA_CUBUK_RENGI.dark);
  }

  document.addEventListener('theme-selected', (e) => {
    if (e.detail && e.detail.theme) temaRenginiGuncelle(e.detail.theme);
  });

  // PROJELERİ ÜRET (projeler.js → HTML)
  const EXT_SIRASI = (() => {
    const tercih = typeof GORSEL_UZANTISI === 'string' ? GORSEL_UZANTISI : 'jpg';
    return [tercih].concat(
      ['jpg', 'jpeg', 'png', 'webp', 'avif'].filter((e) => e !== tercih)
    );
  })();

  renderProjects();

  renderDeneyim();

  // DAHA ÖNCE SEÇİLMİŞ TEMAYI HATIRLAMA
  const THEME_STORAGE_KEY = 'portfolyo-theme';

  function readStoredTheme() {
    try {
      const val = window.localStorage.getItem(THEME_STORAGE_KEY);
      return val === 'dark' || val === 'light' ? val : null;
    } catch (err) {
      return null;
    }
  }

  function persistTheme(theme) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (err) {
    }
  }

  const storedTheme = readStoredTheme();

  const isAppShell = !!document.getElementById('views');

  const introAtlandi = !!(storedTheme || !introScreen);

  if (storedTheme || !introScreen) {
    const systemLight =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const acilisTemasi = storedTheme || (systemLight ? 'light' : 'dark');
    document.body.dataset.theme = acilisTemasi;
    temaRenginiGuncelle(acilisTemasi);

    if (introScreen) introScreen.remove();
    document.body.classList.add('theme-transitions-ready');

    if (isAppShell) document.body.classList.add('scroll-unlocked');

    if (mainContent) {
      mainContent.hidden = false;
      void mainContent.offsetWidth;
      mainContent.classList.add('is-visible');
    }

    window.requestAnimationFrame(setNavIndicator);
  }

  const GLOW_START_MS = 280;

  const GLOW_DURATION_MS = { dark: 900, light: 1000 };

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const BASLANGIC_TEMA = 'dark';

  const INTRO_HOLD_MS = 2700;

  function temayiUygulaVeAc(tema) {
    document.body.dataset.theme = tema;
    persistTheme(tema);
    document.dispatchEvent(new CustomEvent('theme-selected', { detail: { theme: tema } }));
    revealMainContent();
  }

  function introyuBitir() {
    if (welcomeContainer) welcomeContainer.classList.add('content-leaving');
    if (monogram) monogram.classList.add('content-leaving');

    window.setTimeout(() => {
      if (ambientGlow) ambientGlow.classList.add('glow-shrink');

      window.setTimeout(() => temayiUygulaVeAc(BASLANGIC_TEMA), GLOW_DURATION_MS[BASLANGIC_TEMA]);
    }, GLOW_START_MS);
  }

  if (!introAtlandi) {
    if (prefersReducedMotion) {
      temayiUygulaVeAc(BASLANGIC_TEMA);
    } else {
      window.setTimeout(introyuBitir, INTRO_HOLD_MS);
    }
  }

  function revealMainContent() {
    document.body.classList.add('scroll-unlocked');

    mainContent.hidden = false;

    void mainContent.offsetWidth;

    introScreen.classList.add('intro-hidden');
    mainContent.classList.add('is-visible');

    // SEKME ÇUBUĞUNU BURADA ÖLÇ
    setNavIndicator();

    window.setTimeout(() => {
      introScreen.remove();
      document.body.classList.add('theme-transitions-ready');
    }, 900);
  }

  themeToggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      document.body.dataset.theme = nextTheme;
      persistTheme(nextTheme);

      document.body.classList.add('theme-transitions-ready');

      document.dispatchEvent(
        new CustomEvent('theme-selected', { detail: { theme: nextTheme } })
      );
    });
  });

  initScrollReveal();

  function initScrollReveal() {
    const revealEls = document.querySelectorAll('.section .reveal');
    if (!revealEls.length) return;

    if (!('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-revealed', 'was-seen'));
      return;
    }

    const observersByRoot = new Map();

    function observerFor(root) {
      if (observersByRoot.has(root)) return observersByRoot.get(root);
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const el = entry.target;
            if (entry.isIntersecting) {
              el.classList.add('is-revealed', 'was-seen');
            } else {
              el.classList.remove('is-revealed');
            }
          });
        },
        { root: root, threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
      );
      observersByRoot.set(root, obs);
      return obs;
    }

    revealEls.forEach((el) => {
      const root = el.closest('.view-scroll') || null;
      observerFor(root).observe(el);
    });
  }

  const viewMotion = new Map();

  const expView = document.getElementById('view-deneyim');
  const expScroll = expView ? expView.querySelector('.view-scroll') : null;
  const expProgressBar = expView ? expView.querySelector('.view-progress-bar') : null;
  const expFill = expView ? expView.querySelector('.exp-track-fill') : null;
  const expWrap = expView ? expView.querySelector('.exp-wrap') : null;
  const expTrack = expView ? expView.querySelector('.exp-track') : null;
  const expList = expView ? expView.querySelector('.exp-list') : null;

  // HAT NEREDE BİTİYOR
  function updateExpTrackEnd() {
    if (!expTrack || !expList) return;
    const sonKayit = expList.lastElementChild;
    const sonNokta = sonKayit ? sonKayit.querySelector('.exp-dot') : null;
    if (!sonNokta) return;

    const noktaMerkezi =
      expList.offsetTop + sonKayit.offsetTop + sonNokta.offsetTop + sonNokta.offsetHeight / 2;
    const yukseklik = noktaMerkezi - expTrack.offsetTop;

    if (!(yukseklik > 0)) return;

    expTrack.style.bottom = 'auto';
    expTrack.style.height = yukseklik.toFixed(1) + 'px';
  }

  let expMotionReady = false;

  function initExpMotion() {
    if (expMotionReady) return;
    expMotionReady = true;
    initViewMotion(expView);
    initCounters(expView);
  }

  function updateExp() {
    if (!expScroll) return;

    const maxScroll = expScroll.scrollHeight - expScroll.clientHeight;
    const kaydirmaOrani = maxScroll > 0 ? expScroll.scrollTop / maxScroll : 1;

    if (expProgressBar) {
      const ratio = maxScroll > 0 ? kaydirmaOrani : 0;
      expProgressBar.style.width = (ratio * 100).toFixed(2) + '%';
    }

    if (!expFill || !expTrack) return;

    const box = expScroll.getBoundingClientRect();
    const wrap = expTrack.getBoundingClientRect();
    if (wrap.height <= 0) return;

    // OKUMA ÇİZGİSİ SONA DOĞRU AŞAĞI İNER
    const KUYRUK_BASI = 0.5;
    const t = Math.max(0, Math.min(1, (kaydirmaOrani - KUYRUK_BASI) / (1 - KUYRUK_BASI)));
    const yumusak = t * t * (3 - 2 * t);
    const cizgiKonumu = 0.62 + (1 - 0.62) * yumusak;

    const okumaCizgisi = box.top + box.height * cizgiKonumu;
    const oran = Math.max(0, Math.min(1, (okumaCizgisi - wrap.top) / wrap.height));
    expFill.style.height = (oran * 100).toFixed(2) + '%';

    // DURAKLARI HATTIN UCU YAKIYOR
    updateExpDots(oran);
  }

  function updateExpDots(oran) {
    if (!expList || !expTrack) return;

    const hatUcu = expTrack.offsetTop + expTrack.offsetHeight * oran;
    const listeUst = expList.offsetTop;

    Array.from(expList.children).forEach((kayit) => {
      const nokta = kayit.querySelector('.exp-dot');
      if (!nokta) return;

      const merkez =
        listeUst + kayit.offsetTop + nokta.offsetTop + nokta.offsetHeight / 2;

      if (kayit.classList.contains('is-reached')) {
        if (merkez > hatUcu + 12) kayit.classList.remove('is-reached');
      } else if (merkez <= hatUcu + 2) {
        kayit.classList.add('is-reached');
      }
    });
  }

  if (expScroll) {
    let expTicking = false;
    expScroll.addEventListener(
      'scroll',
      () => {
        if (expTicking) return;
        expTicking = true;
        window.requestAnimationFrame(() => {
          updateExp();
          expTicking = false;
        });
      },
      { passive: true }
    );

    window.addEventListener('resize', () => {
      updateExpTrackEnd();
      updateExp();
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        updateExpTrackEnd();
        updateExp();
      });
    }

    window.requestAnimationFrame(() => {
      updateExpTrackEnd();
      updateExp();
    });
  }

  // GÖRÜNÜM GEÇİŞLERİ (yatay kayan sekmeler)
  const viewsRoot = document.getElementById('views');
  const views = viewsRoot ? Array.from(viewsRoot.querySelectorAll('.view')) : [];
  const viewLinks = Array.from(document.querySelectorAll('.js-view-link'));
  const navTabs = Array.from(document.querySelectorAll('.site-nav .nav-link'));
  const navIndicator = document.querySelector('.nav-indicator');
  const viewAnnouncer = document.getElementById('view-announcer');

  const VIEW_ORDER = views.map((v) => v.dataset.view);
  const VIEW_TRANSITION_MS = 720; // style.css'teki .view geçiş süresiyle BİREBİR

  let activeView = views.findIndex((v) => v.classList.contains('is-active'));
  if (activeView < 0) activeView = 0;

  let viewLocked = false;
  let pendingView = null;

  // ============================================
  // SEKME ÇUBUĞUNUN KENAR SOLMASI (yalnızca dar ekranda)
  // ============================================
  // Dar ekranda sekmeler çubuğa sığmıyor ve çubuk yanlamasına kayıyor;
  // kaydırma çubuğu ise sitenin geri kalanındaki gibi gizli (bkz.
  // style.css: "Kaydırılabilir olduğunu SÖYLEYEN işaret"). Kenardaki kısa
  // solma, "bu tarafta devamı var" demenin tek görsel yolu.
  //
  // NEDEN JS: bir öğenin kaydırma konumunu CSS okuyamıyor. Solmanın
  // SABİT olduğu eski sürümde iki sorun vardı — başlangıçta sağdaki solma
  // hiçbir yazıya denk gelmiyordu (yani ipucu görünmüyordu), sona
  // kaydırıldığında ise sol kenar çıplak kalıyor ve yazı ortasından
  // keskin kesiliyordu. Burada ölçülen tek şey şu: her iki yönde
  // kaydırılacak yer kaldı mı?
  const NAV_FADE_PX = 26;

  function navSolmaGuncelle() {
    const nav = document.querySelector('.site-nav');
    if (!nav) return;

    const tasma = nav.scrollWidth - nav.clientWidth;

    if (tasma <= 2) {
      nav.style.setProperty('--nav-fade-l', '0px');
      nav.style.setProperty('--nav-fade-r', '0px');
      return;
    }

    const sol = nav.scrollLeft;
    nav.style.setProperty('--nav-fade-l', sol > 2 ? NAV_FADE_PX + 'px' : '0px');
    nav.style.setProperty('--nav-fade-r', sol < tasma - 2 ? NAV_FADE_PX + 'px' : '0px');
  }

  (function navSolmaBagla() {
    const nav = document.querySelector('.site-nav');
    if (!nav) return;
    let bekliyor = false;
    nav.addEventListener(
      'scroll',
      () => {
        if (bekliyor) return;
        bekliyor = true;
        window.requestAnimationFrame(() => {
          navSolmaGuncelle();
          bekliyor = false;
        });
      },
      { passive: true }
    );
  })();

  function setNavIndicator() {
    if (!navIndicator || !navTabs.length) return;
    const tab = navTabs[activeView];
    if (!tab) return;
    navIndicator.style.width = tab.offsetWidth + 'px';
    navIndicator.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    navIndicator.classList.add('is-ready');

    navSolmaGuncelle();
  }

  function announceView(viewEl) {
    if (!viewAnnouncer) return;
    const tabId = viewEl.getAttribute('aria-labelledby');
    const tab = tabId ? document.getElementById(tabId) : null;
    if (!tab) return;
    const etiket = tab.querySelector('.nav-link-text') || tab;
    const ad = etiket.textContent.trim();
    if (!ad) return;
    viewAnnouncer.textContent = ad + ' sekmesi';
  }

  const skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.addEventListener('click', (event) => {
      event.preventDefault();
      const aktifGorunum = views[activeView];
      const kutu = aktifGorunum ? aktifGorunum.querySelector('.view-scroll') : null;
      if (!kutu) return;
      kutu.focus({ preventScroll: true });
    });
  }

  function goToView(nextIndex, options) {
    const opts = options || {};
    if (nextIndex < 0 || nextIndex >= views.length) return;
    if (nextIndex === activeView && !opts.force) return;
    if (viewLocked) {
      pendingView = { index: nextIndex, options: opts };
      return;
    }

    const current = views[activeView];
    const next = views[nextIndex];
    const dir = nextIndex > activeView ? 1 : -1;

    navTabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', i === nextIndex ? 'true' : 'false');
    });

    if (opts.instant) {
      views.forEach((v) => {
        v.classList.remove('is-active', 'is-leaving');
        v.style.translate = '';
      });
      next.classList.add('is-active');
      activeView = nextIndex;
      setNavIndicator();
      afterViewChange(next, opts);
      return;
    }

    viewLocked = true;

    next.classList.add('is-preparing');
    next.style.translate = (dir === 1 ? '100%' : '-100%') + ' 0';
    void next.offsetWidth;
    next.classList.remove('is-preparing');

    current.classList.remove('is-active');
    current.classList.add('is-leaving');
    current.style.translate = (dir === 1 ? '-100%' : '100%') + ' 0';

    next.classList.add('is-active');
    next.style.translate = '0 0';

    const leaving = current;
    window.setTimeout(() => {
      leaving.classList.remove('is-leaving');
      leaving.style.translate = '';
      const sc = leaving.querySelector('.view-scroll');
      if (sc) sc.scrollTop = 0;

      const motion = viewMotion.get(leaving);
      if (motion) motion.reset();

      viewLocked = false;

      if (pendingView) {
        const queued = pendingView;
        pendingView = null;
        goToView(queued.index, queued.options);
      }
    }, VIEW_TRANSITION_MS);

    activeView = nextIndex;
    setNavIndicator();
    afterViewChange(next, opts);
  }

  function afterViewChange(viewEl, opts) {
    const options = opts || {};
    const name = viewEl.dataset.view;

    if (window.history) {
      if (options.fromHistory) {
      } else if (options.replace && window.history.replaceState) {
        window.history.replaceState({ view: name }, '', '#' + name);
      } else if (window.history.pushState) {
        window.history.pushState({ view: name }, '', '#' + name);
      }
    }
    if (!options.instant) announceView(viewEl);

    if (name === 'projeler') {
      window.requestAnimationFrame(() => {
        initProjectsMotion();
        initCardReveal();
        updateParallax();
      });
    } else if (name === 'hakkimda') {
      window.requestAnimationFrame(() => {
        initAboutMotion();
      });
    } else if (name === 'deneyim') {
      window.requestAnimationFrame(() => {
        initExpMotion();
        updateExpTrackEnd();
        updateExp();
      });
    }

    // BELİRİŞİ YENİDEN OYNAT
    window.setTimeout(() => {
      if (!viewEl.classList.contains('is-active')) return;
      const motion = viewMotion.get(viewEl);
      if (motion) motion.replay();
    }, 180);
  }

  viewLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const target = VIEW_ORDER.indexOf(link.dataset.view);
      if (target >= 0) goToView(target);
    });
  });

  navTabs.forEach((tab, i) => {
    tab.addEventListener('keydown', (event) => {
      let target = null;
      if (event.key === 'ArrowRight') target = (i + 1) % navTabs.length;
      else if (event.key === 'ArrowLeft') target = (i - 1 + navTabs.length) % navTabs.length;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = navTabs.length - 1;
      if (target === null) return;
      event.preventDefault();
      goToView(target);
      navTabs[target].focus();
    });
  });

  function viewIndexFromHash() {
    const raw = (window.location.hash || '').replace('#', '');
    if (!raw) return 0;
    return VIEW_ORDER.indexOf(raw);
  }

  const hashView = viewIndexFromHash();
  if (hashView > 0) {
    goToView(hashView, { instant: true, replace: true });
  } else {
    setNavIndicator();
  }

  window.addEventListener('popstate', () => {
    const idx = viewIndexFromHash();
    if (idx >= 0) goToView(idx, { fromHistory: true });
  });

  window.addEventListener('hashchange', () => {
    const idx = viewIndexFromHash();
    if (idx >= 0 && idx !== activeView) goToView(idx, { fromHistory: true });
  });

  window.addEventListener('resize', setNavIndicator);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(setNavIndicator);
  }

  // SEKMELER ARASI PARMAK KAYDIRMASI (SWIPE)
  if (viewsRoot && views.length > 1) {
    const SWIPE_MIN_X = 60;     
    const SWIPE_RATIO = 0.8;    
    const SWIPE_LOCK_PX = 10;   // yön kararının verildiği mesafe
    const SWIPE_MAX_MS = 800;   

    let swipeId = null;
    let startX = 0;
    let startY = 0;
    let startT = 0;
    let swipeAxis = null; // null | 'x' | 'y'

    function swipeReset() {
      swipeId = null;
      swipeAxis = null;
    }

    viewsRoot.addEventListener(
      'pointerdown',
      (event) => {
        if (event.pointerType !== 'touch') return;

        if (
          document.body.classList.contains('case-open') ||
          document.body.classList.contains('gallery-open')
        ) {
          return;
        }
        if (event.target.closest && event.target.closest('[data-noswipe]')) return;

        swipeId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
        startT = event.timeStamp;
        swipeAxis = null;
      },
      { passive: true }
    );

    viewsRoot.addEventListener(
      'pointermove',
      (event) => {
        if (event.pointerId !== swipeId || swipeAxis) return;

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        if (Math.abs(dx) < SWIPE_LOCK_PX && Math.abs(dy) < SWIPE_LOCK_PX) return;

        swipeAxis = Math.abs(dy) > Math.abs(dx) * SWIPE_RATIO ? 'y' : 'x';
      },
      { passive: true }
    );

    viewsRoot.addEventListener(
      'pointerup',
      (event) => {
        if (event.pointerId !== swipeId) return;

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        const sure = event.timeStamp - startT;
        const yon = swipeAxis;
        swipeReset();

        if (yon !== 'x') return;
        if (sure > SWIPE_MAX_MS) return;
        if (Math.abs(dx) < SWIPE_MIN_X) return;
        if (Math.abs(dy) > Math.abs(dx) * SWIPE_RATIO) return;

        const hedef = activeView + (dx < 0 ? 1 : -1);
        if (hedef < 0 || hedef >= views.length) return;

        goToView(hedef);
      },
      { passive: true }
    );

    viewsRoot.addEventListener(
      'pointercancel',
      (event) => {
        if (event.pointerId === swipeId) swipeReset();
      },
      { passive: true }
    );
  }

  const projelerView = document.getElementById('view-projeler');
  const panelScroll = projelerView ? projelerView.querySelector('.view-scroll') : null;
  const panelProgressBar = projelerView ? projelerView.querySelector('.view-progress-bar') : null;
  const projectCards = projelerView
    ? Array.from(projelerView.querySelectorAll('.project-card'))
    : [];
  const reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // İlerleme çizgisi
  function updatePanelProgress() {
    if (!panelScroll || !panelProgressBar) return;
    const max = panelScroll.scrollHeight - panelScroll.clientHeight;
    const ratio = max > 0 ? panelScroll.scrollTop / max : 0;
    panelProgressBar.style.width = (ratio * 100).toFixed(2) + '%';
  }

  // Ekrana girince belirme
  let cardRevealReady = false;

  function initCardReveal() {
    if (cardRevealReady || !projectCards.length) return;
    cardRevealReady = true;

    if (!('IntersectionObserver' in window) || !panelScroll) {
      projectCards.forEach((card) => card.classList.add('is-inview'));
      return;
    }

    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-inview');
            cardObserver.unobserve(entry.target);
          }
        });
      },
      { root: panelScroll, threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
    );

    projectCards.forEach((card) => cardObserver.observe(card));
  }

  // Kaydırma paralaksı
  const PARALLAX_STRENGTH = [26, 40, 32];

  function updateParallax() {
    if (reduceMotion || !panelScroll) return;
    const mid = panelScroll.clientHeight / 2;

    const scrollRect = panelScroll.getBoundingClientRect();

    projectCards.forEach((card, i) => {
      const wrap = card.querySelector('.folder-wrap');
      if (!wrap) return;

      const rect = card.getBoundingClientRect();

      if (rect.bottom < scrollRect.top - 200 || rect.top > scrollRect.bottom + 200) return;

      const centerY = rect.top - scrollRect.top + rect.height / 2;
      const rel = Math.max(-1.2, Math.min(1.2, (centerY - mid) / mid));
      const strength = PARALLAX_STRENGTH[i % PARALLAX_STRENGTH.length];
      wrap.style.translate = '0 ' + (rel * strength).toFixed(1) + 'px';
    });
  }

  // İmlece göre 3B eğilme
  const TILT_X = 18;            // imleç yukarıdayken üst kenar geriye yatar
  const TILT_Y = 24;            // imleç sağdayken sağ kenar geriye yatar
  const TILT_PERSPECTIVE = 820; // küçüldükçe derinlik artar

  if (!reduceMotion) {
    projectCards.forEach((card) => {
      const folder = card.querySelector('.folder');
      if (!folder) return;

      card.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch') return;

        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;

        folder.style.transform =
          'perspective(' + TILT_PERSPECTIVE + 'px) rotateX(' +
          (-py * TILT_X).toFixed(2) + 'deg) rotateY(' +
          (px * TILT_Y).toFixed(2) + 'deg) translateY(-14px) scale(1.035)';
      });

      card.addEventListener('pointerleave', () => {
        folder.style.transform = '';
      });
    });
  }

  if (panelScroll) {
    let panelTicking = false;
    panelScroll.addEventListener(
      'scroll',
      () => {
        if (panelTicking) return;
        panelTicking = true;
        window.requestAnimationFrame(() => {
          updatePanelProgress();
          updateParallax();
          panelTicking = false;
        });
      },
      { passive: true }
    );

    window.addEventListener('resize', () => {
      updatePanelProgress();
      updateParallax();
    });
  }

  initViewMotion(document.getElementById('view-ana'));

  let aboutMotionReady = false;
  function initAboutMotion() {
    if (aboutMotionReady) return;
    aboutMotionReady = true;
    const gorunum = document.getElementById('view-hakkimda');
    initViewMotion(gorunum);
    initCounters(gorunum);
  }

  let projectsMotionReady = false;
  function initProjectsMotion() {
    if (projectsMotionReady) return;
    projectsMotionReady = true;
    const gorunum = document.getElementById('view-projeler');
    initViewMotion(gorunum);
    initCounters(gorunum);
  }

  function initViewMotion(homeView) {
    if (!homeView) return;
    const homeScrollBox = homeView.querySelector('.view-scroll');

    homeView.querySelectorAll('[data-split]').forEach((el) => {
      splitWords(el, parseInt(el.dataset.delay || '0', 10));
    });

    homeView.querySelectorAll('.rv[data-delay]').forEach((el) => {
      el.style.transitionDelay = el.dataset.delay + 'ms';
    });

    const items = Array.from(homeView.querySelectorAll('.rv, [data-split]'));
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }

    // KAYDIRMA YÖNÜ
    let lastScrollTop = homeScrollBox ? homeScrollBox.scrollTop : 0;
    let scrollDir = 'down';

    if (homeScrollBox) {
      homeScrollBox.addEventListener(
        'scroll',
        () => {
          const top = homeScrollBox.scrollTop;
          if (top > lastScrollTop) scrollDir = 'down';
          else if (top < lastScrollTop) scrollDir = 'up';
          lastScrollTop = top;
        },
        { passive: true }
      );
    }

    const IN_FRACTION = 0.6;
    const OUT_FRACTION = 0.45;
    const ROOT_IN_CAP = 0.3;
    const ROOT_OUT_CAP = 0.2;

    const ABS_IN = 120;
    const ABS_OUT = 80;

    const homeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target;
          const rect = entry.boundingClientRect;
          const root = entry.rootBounds ||
            (homeScrollBox ? homeScrollBox.getBoundingClientRect() : null);
          if (!root) return;

          const visible = Math.max(
            0,
            Math.min(rect.bottom, root.bottom) - Math.max(rect.top, root.top)
          );

          const isIn = el.classList.contains('is-in');

          if (!isIn) {
            const needed = Math.min(rect.height * IN_FRACTION, root.height * ROOT_IN_CAP, ABS_IN);
            if (visible > 0 && visible >= needed) {
              el.classList.remove('is-out-up', 'is-out-down');
              el.classList.add('is-in');
            }
            return;
          }

          const outLimit = Math.min(rect.height * OUT_FRACTION, root.height * ROOT_OUT_CAP, ABS_OUT);
          if (visible >= outLimit) return;

          const overTop = rect.top < root.top;
          const overBottom = rect.bottom > root.bottom;

          let dir = null;
          if (scrollDir === 'down' && overTop) dir = 'is-out-up';
          else if (scrollDir === 'up' && overBottom) dir = 'is-out-down';
          else if (visible === 0) {
            dir = overTop ? 'is-out-up' : 'is-out-down';
          }
          if (!dir) return;

          el.classList.remove('is-in');
          el.classList.add(dir);
        });
      },
      {
        root: homeScrollBox,
        threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5,
                    0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.9, 1]
      }
    );

    items.forEach((el) => homeObserver.observe(el));

    // SEKMEYE TEKRAR GELİŞ
    viewMotion.set(homeView, {
      reset() {
        homeView.classList.add('is-replay');

        items.forEach((el) => {
          el.classList.remove('is-in', 'is-out-up', 'is-out-down');

          if (el.dataset.delay) {
            const ms = parseInt(el.dataset.delay, 10);
            if (!isNaN(ms)) el.style.transitionDelay = Math.round(ms * 0.28) + 'ms';
          }
        });

        lastScrollTop = 0;
        scrollDir = 'down';
      },

      replay() {
        const root = homeScrollBox ? homeScrollBox.getBoundingClientRect() : null;
        if (!root || !root.height) return;

        items.forEach((el) => {
          const r = el.getBoundingClientRect();
          const visible = Math.max(0, Math.min(r.bottom, root.bottom) - Math.max(r.top, root.top));
          const needed = Math.min(r.height * IN_FRACTION, root.height * ROOT_IN_CAP, ABS_IN);
          if (visible > 0 && visible >= needed) {
            el.classList.remove('is-out-up', 'is-out-down');
            el.classList.add('is-in');
          }
        });
      }
    });
  }

  (function registerContactMotion() {
    const view = document.getElementById('view-iletisim');
    if (!view) return;
    const box = view.querySelector('.view-scroll');
    const els = Array.from(view.querySelectorAll('.reveal'));
    if (!els.length) return;

    viewMotion.set(view, {
      reset() {
        view.classList.add('is-replay');
        els.forEach((el) => el.classList.remove('is-revealed', 'was-seen'));
      },

      replay() {
        const root = box ? box.getBoundingClientRect() : null;
        if (!root || !root.height) return;
        els.forEach((el) => {
          const r = el.getBoundingClientRect();
          const visible = Math.max(0, Math.min(r.bottom, root.bottom) - Math.max(r.top, root.top));
          if (visible > 0) el.classList.add('is-revealed', 'was-seen');
        });
      }
    });
  })();

  // Bir başlığın içindeki HER KELİMEYİ <span class="w"><span class="w-in">
  // sarmalına alır ve sırayla artan bir gecikme verir.
  // İç içe etiketleri (ör. <span class="accent-serif">) koruyarak yürür:
  // sadece metin düğümleri parçalanır, kutular olduğu gibi kalır.
  function splitWords(el, baseDelay) {
    if (el.dataset.splitDone === '1') return;

    const STEP_MS = 62; // kelimeler arası gecikme
    let index = 0;

    const process = (parent) => {
      Array.from(parent.childNodes).forEach((node) => {
        if (node.nodeType === 3) {
          const text = node.textContent;
          if (!text.trim()) return;

          const frag = document.createDocumentFragment();
          text.split(/(\s+)/).forEach((chunk) => {
            if (!chunk) return;
            if (!chunk.trim()) {
              frag.appendChild(document.createTextNode(' '));
              return;
            }
            const mask = document.createElement('span');
            mask.className = 'w';
            const inner = document.createElement('span');
            inner.className = 'w-in';
            inner.textContent = chunk;
            inner.style.transitionDelay = ((baseDelay || 0) + index * STEP_MS) + 'ms';
            index += 1;
            mask.appendChild(inner);
            frag.appendChild(mask);
          });
          parent.replaceChild(frag, node);
        } else if (node.nodeType === 1) {
          process(node);
        }
      });
    };

    process(el);
    el.dataset.splitDone = '1';
  }

  initFeaturedPreview();

  function initFeaturedPreview() {
    const wrap = document.querySelector('.feat-wrap');
    if (!wrap) return;

    const preview = wrap.querySelector('.feat-preview');
    const inner = preview ? preview.querySelector('.feat-preview-inner') : null;
    const rows = Array.from(wrap.querySelectorAll('.feat-row'));
    if (!preview || !inner || !rows.length) return;

    const finePointer =
      window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!finePointer) return;

    // GÖRSELLER ARASI ÇAPRAZ GEÇİŞ (crossfade)
    const failed = new Set();
    let currentImg = null;

    const imgBySrc = new Map();

    rows.forEach((row) => {
      const base = row.dataset.previewBase || null;
      const key = base || row.dataset.preview;
      if (!key || imgBySrc.has(key)) return;

      const img = document.createElement('img');
      img.alt = '';
      img.decoding = 'async';

      let deneme = 0;
      const dene = () => {
        img.src = base ? base + '.' + EXT_SIRASI[deneme] : row.dataset.preview;
      };

      img.addEventListener('error', () => {
        deneme += 1;
        if (base && deneme < EXT_SIRASI.length) {
          dene();
          return;
        }
        failed.add(key);
        img.classList.remove('is-shown');
        if (currentImg === img) currentImg = null;
      });

      dene();
      imgBySrc.set(key, img);
      inner.appendChild(img);
    });

    function showFor(row) {
      const key = row.dataset.previewBase || row.dataset.preview;
      const next = key && !failed.has(key) ? imgBySrc.get(key) || null : null;

      if (next !== currentImg) {
        if (currentImg) currentImg.classList.remove('is-shown');
        if (next) next.classList.add('is-shown');
        currentImg = next;
      }

      preview.classList.add('is-on');
    }

    rows.forEach((row) => {
      row.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'touch') return;
        showFor(row);
      });
      row.addEventListener('focus', () => showFor(row));
    });

    wrap.addEventListener('pointerleave', () => preview.classList.remove('is-on'));
    wrap.addEventListener('focusout', (event) => {
      if (!wrap.contains(event.relatedTarget)) preview.classList.remove('is-on');
    });

    let previewTicking = false;
    let previewY = 0;

    wrap.addEventListener(
      'pointermove',
      (event) => {
        if (event.pointerType === 'touch') return;
        const rect = wrap.getBoundingClientRect();
        const h = preview.offsetHeight;
        previewY = Math.max(0, Math.min(rect.height - h, event.clientY - rect.top - h / 2));
        if (previewTicking) return;
        previewTicking = true;
        window.requestAnimationFrame(() => {
          preview.style.translate = '0 ' + previewY.toFixed(1) + 'px';
          previewTicking = false;
        });
      },
      { passive: true }
    );
  }

  initTextFlip();

  function initTextFlip() {
    const TFLIP_SELECTOR = [
      '.btn',              
      '.text-link',        // Tüm projeler
      '.closing-mail',     // ana sayfadaki e-posta
      '.closing-socials a',
      '.contact-link'      
    ].join(', ');

    document.querySelectorAll(TFLIP_SELECTOR).forEach((el) => {
      if (el.dataset.tflipDone === '1') return;

      let wrapped = false;

      Array.from(el.childNodes).forEach((node) => {
        if (node.nodeType !== 3) return; // yalnızca metin düğümleri
        const text = node.textContent.replace(/\s+/g, ' ').trim();
        if (!text) return;

        const mask = document.createElement('span');
        mask.className = 'tflip';

        const front = document.createElement('span');
        front.className = 'tflip-in';
        front.textContent = text;

        const clone = document.createElement('span');
        clone.className = 'tflip-in tflip-clone';
        clone.textContent = text;
        clone.setAttribute('aria-hidden', 'true');

        mask.appendChild(front);
        mask.appendChild(clone);
        el.replaceChild(mask, node);
        wrapped = true;
      });

      if (!wrapped) return;

      el.classList.add('has-tflip');
      el.dataset.tflipDone = '1';
    });
  }

  function initCounters(kapsam) {
    const kok = kapsam || document;
    const sayaclar = Array.from(kok.querySelectorAll('[data-count]'))
      .filter((el) => el.dataset.countInit !== '1');
    if (!sayaclar.length) return;
    sayaclar.forEach((el) => { el.dataset.countInit = '1'; });

    sayaclar.forEach((el) => {
      if (el.dataset.countSource === 'projeler' &&
          typeof PROJELER !== 'undefined' && Array.isArray(PROJELER)) {
        el.dataset.count = String(PROJELER.length);
      }
      if (el.dataset.countSource === 'deneyim' &&
          typeof DENEYIM !== 'undefined' && Array.isArray(DENEYIM)) {
        el.dataset.count = String(DENEYIM.length);
      }
    });

    const yaz = (el, deger) => {
      const govde = el.dataset.pad === '2' ? String(deger).padStart(2, '0') : String(deger);
      el.textContent = govde + (el.dataset.suffix || '');
    };

    const gecikme = (el) => {
      if (el.dataset.countDelay) return parseInt(el.dataset.countDelay, 10) || 0;
      const kutu = el.closest('[data-delay]');
      return kutu ? (parseInt(kutu.dataset.delay, 10) || 0) : 0;
    };

    const say = (el) => {
      if (el.dataset.counted === '1') return;
      el.dataset.counted = '1';

      const hedef = parseInt(el.dataset.count, 10) || 0;

      if (prefersReducedMotion) {
        yaz(el, hedef);
        return;
      }

      const SURE = 1100;
      const bekle = gecikme(el);
      const baslangic = performance.now() + bekle;

      const adim = (simdi) => {
        if (simdi < baslangic) { window.requestAnimationFrame(adim); return; }
        const t = Math.min(1, (simdi - baslangic) / SURE);
        const e = 1 - Math.pow(1 - t, 3);
        yaz(el, Math.round(hedef * e));
        if (t < 1) window.requestAnimationFrame(adim);
      };

      yaz(el, 0);
      window.requestAnimationFrame(adim);
    };

    if (!('IntersectionObserver' in window)) {
      sayaclar.forEach((el) => yaz(el, parseInt(el.dataset.count, 10) || 0));
      return;
    }

    const gozlemciler = new Map();

    sayaclar.forEach((el) => {
      const kok = el.closest('.view-scroll') || null;
      if (!gozlemciler.has(kok)) {
        gozlemciler.set(
          kok,
          new IntersectionObserver(
            (entries, obs) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                say(entry.target);
                obs.unobserve(entry.target);
              });
            },
            { root: kok, threshold: 0.5 }
          )
        );
      }
      gozlemciler.get(kok).observe(el);
    });
  }

  const homeScroll = document.querySelector('#view-ana .view-scroll');
  const homeProgressBar = document.querySelector('#view-ana .view-progress-bar');
  const scrollCue = document.querySelector('.scroll-cue');

  if (homeScroll) {
    const updateHomeScrollUI = () => {
      if (homeProgressBar) {
        const max = homeScroll.scrollHeight - homeScroll.clientHeight;
        const ratio = max > 0 ? homeScroll.scrollTop / max : 0;
        homeProgressBar.style.width = (ratio * 100).toFixed(2) + '%';
      }
      if (scrollCue) scrollCue.classList.toggle('is-gone', homeScroll.scrollTop > 40);
    };

    let homeTicking = false;
    homeScroll.addEventListener(
      'scroll',
      () => {
        if (homeTicking) return;
        homeTicking = true;
        window.requestAnimationFrame(() => {
          updateHomeScrollUI();
          homeTicking = false;
        });
      },
      { passive: true }
    );

    window.addEventListener('resize', updateHomeScrollUI);
  }

  // HAKKIMDA: İLERLEME ÇİZGİSİ
  const aboutScroll = document.querySelector('#view-hakkimda .view-scroll');
  const aboutProgressBar = document.querySelector('#view-hakkimda .view-progress-bar');

  if (aboutScroll && aboutProgressBar) {
    const updateAboutProgress = () => {
      const max = aboutScroll.scrollHeight - aboutScroll.clientHeight;
      const ratio = max > 0 ? aboutScroll.scrollTop / max : 0;
      aboutProgressBar.style.width = (ratio * 100).toFixed(2) + '%';
    };

    let aboutTicking = false;
    aboutScroll.addEventListener(
      'scroll',
      () => {
        if (aboutTicking) return;
        aboutTicking = true;
        window.requestAnimationFrame(() => {
          updateAboutProgress();
          aboutTicking = false;
        });
      },
      { passive: true }
    );

    window.addEventListener('resize', updateAboutProgress);
  }

  // PROJE DETAYI — MODAL
  initCaseModal();

  function initCaseModal() {
    const modal = document.getElementById('case-modal');
    if (!modal) return;

    const panel = modal.querySelector('.case-modal-panel');
    const scrollBox = modal.querySelector('.case-modal-scroll');
    const progressBar = modal.querySelector('.case-modal-progress-bar');
    const countEl = document.getElementById('case-modal-count');
    const prevBtn = document.getElementById('case-prev');
    const nextBtn = document.getElementById('case-next');
    const closeBtn = modal.querySelector('.case-close');
    const docs = Array.from(modal.querySelectorAll('.case-doc'));
    if (!docs.length) return;

    initViewMotion(modal);

    let openId = null;
    let lastFocused = null;
    let closeTimer = 0;

    const idOf = (el) => el.id.replace('case-', '');

    // Aç
    function openCase(id, options) {
      const opts = options || {};
      const target = docs.find((d) => idOf(d) === String(id));
      if (!target) return;

      if (!openId) lastFocused = document.activeElement;
      window.clearTimeout(closeTimer);

      docs.forEach((d) => {
        const isTarget = d === target;
        d.hidden = !isTarget;
        if (!isTarget) resetMotion(d);
      });

      openId = String(id);
      const index = docs.indexOf(target);

      if (countEl) {
        countEl.textContent =
          String(index + 1).padStart(2, '0') + ' / ' + String(docs.length).padStart(2, '0');
      }
      if (panel) {
        panel.setAttribute('aria-label', (target.dataset.caseName || 'Proje') + ' — detay');
      }
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === docs.length - 1;

      if (scrollBox) scrollBox.scrollTop = 0;
      updateProgress();

      if (modal.hidden) {
        modal.hidden = false;
        void modal.offsetWidth;
      }
      modal.classList.add('is-open');
      document.body.classList.add('case-open');

      if (!opts.fromHistory) {
        const hash = '#proje-' + openId;
        if (opts.replace && window.history.replaceState) {
          window.history.replaceState({ caseId: openId }, '', hash);
        } else if (window.history.pushState) {
          window.history.pushState({ caseId: openId }, '', hash);
        }
      }

      if (closeBtn) closeBtn.focus({ preventScroll: true });
    }

    // Kapat
    function closeCase(options) {
      const opts = options || {};
      if (!openId) return;

      const wasId = openId;
      openId = null;

      modal.classList.remove('is-open');
      document.body.classList.remove('case-open');

      closeTimer = window.setTimeout(() => {
        modal.hidden = true;
        docs.forEach((d) => {
          d.hidden = true;
          resetMotion(d);
        });
      }, 460);

      if (!opts.fromHistory && window.history) {
        const st = window.history.state;
        if (st && st.caseId && window.history.length > 1) {
          window.history.back();
        } else if (window.history.replaceState) {
          window.history.replaceState({ view: 'projeler' }, '', '#projeler');
        }
      }

      const back = lastFocused ||
        document.querySelector('.project-card[data-case="' + wasId + '"]');
      if (back && back.focus) back.focus({ preventScroll: true });
      lastFocused = null;
    }

    function resetMotion(docEl) {
      docEl.querySelectorAll('.is-in, .is-out-up, .is-out-down').forEach((el) => {
        el.classList.remove('is-in', 'is-out-up', 'is-out-down');
      });
    }

    function step(delta) {
      if (!openId) return;
      const index = docs.findIndex((d) => idOf(d) === openId);
      const next = docs[index + delta];
      if (next) openCase(idOf(next), { replace: true });
    }

    function updateProgress() {
      if (!scrollBox || !progressBar) return;
      const max = scrollBox.scrollHeight - scrollBox.clientHeight;
      const ratio = max > 0 ? scrollBox.scrollTop / max : 0;
      progressBar.style.width = (ratio * 100).toFixed(2) + '%';
    }

    // Açan tıklamalar
    document.querySelectorAll('[data-case]').forEach((el) => {
      el.addEventListener('click', (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        openCase(el.dataset.case);
      });
    });

    modal.querySelectorAll('[data-case-close]').forEach((el) => {
      el.addEventListener('click', () => closeCase());
    });

    if (prevBtn) prevBtn.addEventListener('click', () => step(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => step(1));

    if (scrollBox) {
      let ticking = false;
      scrollBox.addEventListener(
        'scroll',
        () => {
          if (ticking) return;
          ticking = true;
          window.requestAnimationFrame(() => {
            updateProgress();
            ticking = false;
          });
        },
        { passive: true }
      );
    }

    // Klavye
    document.addEventListener('keydown', (event) => {
      if (!openId) return;
      if (document.body.classList.contains('gallery-open')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeCase();
        return;
      }
      if (event.key === 'ArrowRight' && !event.target.closest('input, textarea')) step(1);
      if (event.key === 'ArrowLeft' && !event.target.closest('input, textarea')) step(-1);

      if (event.key !== 'Tab' || !panel) return;
      const focusables = panel.querySelectorAll(
        'a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    // Adres çubuğu ile eşleşme
    function caseIdFromHash() {
      const m = (window.location.hash || '').match(/^#proje-(\d+)$/);
      return m ? m[1] : null;
    }

    function syncFromHash() {
      const id = caseIdFromHash();
      if (id) openCase(id, { fromHistory: true });
      else closeCase({ fromHistory: true });
    }

    window.addEventListener('popstate', syncFromHash);
    window.addEventListener('hashchange', syncFromHash);

    const initialId = caseIdFromHash();
    if (initialId) {
      const projeler = VIEW_ORDER.indexOf('projeler');
      if (projeler >= 0) goToView(projeler, { instant: true, fromHistory: true });
      window.requestAnimationFrame(() => openCase(initialId, { fromHistory: true }));
    }
  }

  initGallery();

  function initGallery() {
    const box = document.getElementById('gallery-modal');
    const track = document.getElementById('gallery-track');
    const dotsWrap = document.getElementById('gallery-dots');
    const titleEl = document.getElementById('gallery-title');
    const prevBtn = document.getElementById('gal-prev');
    const nextBtn = document.getElementById('gal-next');
    if (!box || !track) return;

    const MIN_SCALE = 1;
    const MAX_SCALE = 4;
    const CLICK_SCALE = 2.5;

    let slides = [];
    let index = 0;
    let lastFocused = null;
    let closeTimer = 0;

    let scale = 1;
    let tx = 0;
    let ty = 0;
    let baseW = 0;
    let baseH = 0;
    let dragging = false;
    let dragX = 0;
    let dragY = 0;
    let moved = false;

    function activeSlide() {
      return slides[index] || null;
    }

    function applyZoom() {
      const slide = activeSlide();
      if (!slide || !slide.img) return;
      slide.img.style.scale = scale;
      slide.img.style.translate = tx.toFixed(1) + 'px ' + ty.toFixed(1) + 'px';
      const zoomed = scale > 1.01;
      slide.el.classList.toggle('is-zoomed', zoomed);
      track.classList.toggle('is-locked', zoomed);
    }

    function clampPan() {
      const slide = activeSlide();
      if (!slide || !slide.img) return;
      const stage = slide.el.getBoundingClientRect();
      const maxX = Math.max(0, (baseW * scale - stage.width) / 2);
      const maxY = Math.max(0, (baseH * scale - stage.height) / 2);
      tx = Math.min(maxX, Math.max(-maxX, tx));
      ty = Math.min(maxY, Math.max(-maxY, ty));
    }

    function resetZoom() {
      slides.forEach((s) => {
        if (s.img) {
          s.img.style.scale = '';
          s.img.style.translate = '';
        }
        s.el.classList.remove('is-zoomed', 'is-dragging');
      });
      track.classList.remove('is-locked');
      scale = 1;
      tx = 0;
      ty = 0;
    }

    function measure() {
      const slide = activeSlide();
      if (!slide || !slide.img) return;
      const r = slide.img.getBoundingClientRect();
      baseW = r.width / (scale || 1);
      baseH = r.height / (scale || 1);
    }

    function zoomAt(next, px, py) {
      const slide = activeSlide();
      if (!slide || !slide.img) return;
      if (!baseW) measure();
      const r = slide.el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const s2 = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
      tx = px - cx - (px - cx - tx) * (s2 / scale);
      ty = py - cy - (py - cy - ty) * (s2 / scale);
      scale = s2;
      if (scale === MIN_SCALE) {
        tx = 0;
        ty = 0;
      }
      clampPan();
      applyZoom();
    }

    // Şerit ve slaytların kurulumu
    function build(shots, title) {
      track.innerHTML = '';
      if (dotsWrap) dotsWrap.innerHTML = '';
      slides = shots.map((shot, i) => {
        const slide = document.createElement('figure');
        slide.className = 'gal-slide';

        let img = null;
        if (shot.src) {
          img = document.createElement('img');
          img.src = shot.src;
          img.alt = shot.alt || '';
          img.draggable = false;
          slide.appendChild(img);
        } else {
          const empty = document.createElement('div');
          empty.className = 'gal-empty';
          empty.textContent = 'Bu kutuya henüz görsel eklenmedi — ' +
            'images/ klasörüne koyduğunda burada görünecek.';
          slide.appendChild(empty);
        }
        track.appendChild(slide);

        if (dotsWrap) {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'gal-dot';
          dot.setAttribute('aria-label', i + 1 + '. görsel');
          dot.addEventListener('click', () => goTo(i));
          dotsWrap.appendChild(dot);
        }
        return { el: slide, img: img };
      });

      if (titleEl) titleEl.textContent = title || '';
    }

    function syncUi() {
      if (dotsWrap) {
        Array.from(dotsWrap.children).forEach((d, i) => {
          d.classList.toggle('is-active', i === index);
        });
      }
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === slides.length - 1;
    }

    function goTo(i, instant) {
      if (!slides.length) return;
      const next = Math.min(slides.length - 1, Math.max(0, i));
      if (next !== index) resetZoom();
      index = next;
      track.scrollTo({
        left: index * track.clientWidth,
        behavior: instant ? 'auto' : 'smooth'
      });
      syncUi();
      window.setTimeout(measure, instant ? 60 : 420);
    }

    let scrollTick = false;
    track.addEventListener(
      'scroll',
      () => {
        if (scrollTick) return;
        scrollTick = true;
        window.requestAnimationFrame(() => {
          const w = track.clientWidth || 1;
          const i = Math.round(track.scrollLeft / w);
          if (i !== index && i >= 0 && i < slides.length) {
            resetZoom();
            index = i;
            syncUi();
            measure();
          }
          scrollTick = false;
        });
      },
      { passive: true }
    );

    // Aç / kapat
    function open(shots, start, title) {
      lastFocused = document.activeElement;
      window.clearTimeout(closeTimer);
      build(shots, title);
      box.hidden = false;
      void box.offsetWidth;
      box.classList.add('is-open');
      document.body.classList.add('gallery-open');
      index = 0;
      goTo(start, true);
      const closeBtn = box.querySelector('.gallery-close');
      if (closeBtn) closeBtn.focus({ preventScroll: true });
    }

    function close() {
      if (box.hidden) return;
      box.classList.remove('is-open');
      document.body.classList.remove('gallery-open');
      closeTimer = window.setTimeout(() => {
        box.hidden = true;
        resetZoom();
        track.innerHTML = '';
        slides = [];
      }, 340);
      if (lastFocused && lastFocused.focus) lastFocused.focus({ preventScroll: true });
      lastFocused = null;
    }

    // Galeriden açılış
    document.addEventListener('click', (event) => {
      const shot = event.target.closest('.case-shot');
      if (!shot) return;
      const doc = shot.closest('.case-doc');
      if (!doc) return;

      const all = Array.from(doc.querySelectorAll('.case-shot')).map((s) => {
        const im = s.querySelector('img');
        return { el: s, src: im ? s.dataset.full || im.src : null, alt: im ? im.alt : '' };
      });
      const start = all.findIndex((s) => s.el === shot);
      if (start < 0) return;
      open(all, start, doc.dataset.caseName || '');
    });

    box.querySelectorAll('[data-gal-close]').forEach((el) => {
      el.addEventListener('click', close);
    });
    if (prevBtn) prevBtn.addEventListener('click', () => goTo(index - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo(index + 1));

    // Yakınlaştırma etkileşimleri
    track.addEventListener('click', (event) => {
      const img = event.target.closest('.gal-slide img');
      if (!img || moved) return;
      if (scale > 1.01) {
        resetZoom();
        applyZoom();
      } else {
        measure();
        zoomAt(CLICK_SCALE, event.clientX, event.clientY);
      }
    });

    track.addEventListener('pointerdown', (event) => {
      if (scale <= 1.01) return;
      const img = event.target.closest('.gal-slide img');
      if (!img) return;
      dragging = true;
      moved = false;
      dragX = event.clientX;
      dragY = event.clientY;
      const slide = activeSlide();
      if (slide) slide.el.classList.add('is-dragging');
      img.setPointerCapture(event.pointerId);
    });

    track.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const dx = event.clientX - dragX;
      const dy = event.clientY - dragY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      dragX = event.clientX;
      dragY = event.clientY;
      tx += dx;
      ty += dy;
      clampPan();
      applyZoom();
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      const slide = activeSlide();
      if (slide) slide.el.classList.remove('is-dragging');
      window.setTimeout(() => {
        moved = false;
      }, 0);
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

    track.addEventListener(
      'wheel',
      (event) => {
        if (box.hidden) return;
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
        const img = event.target.closest('.gal-slide img');
        if (!img) return;
        event.preventDefault();
        if (!baseW) measure();
        zoomAt(scale * (1 - event.deltaY * 0.0016), event.clientX, event.clientY);
      },
      { passive: false }
    );

    // Klavye
    document.addEventListener('keydown', (event) => {
      if (box.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(index + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(index - 1);
      } else if (event.key === '+' || event.key === '=') {
        const r = track.getBoundingClientRect();
        zoomAt(scale * 1.3, r.left + r.width / 2, r.top + r.height / 2);
      } else if (event.key === '-') {
        const r = track.getBoundingClientRect();
        zoomAt(scale / 1.3, r.left + r.width / 2, r.top + r.height / 2);
      }
    });

    window.addEventListener('resize', () => {
      if (box.hidden) return;
      resetZoom();
      goTo(index, true);
    });
  }

  // PROJELERİ ÜRET
  function renderProjects() {
    const grid = document.getElementById('project-grid');
    const featList = document.getElementById('feat-list');
    const docWrap = document.getElementById('case-doc-wrap');
    if (typeof PROJELER === 'undefined' || !Array.isArray(PROJELER)) {
      console.error('projeler.js yüklenmedi ya da PROJELER listesi bulunamadı.');
      return;
    }

    const esc = (v) =>
      String(v == null ? '' : v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const metin = (v) => esc(String(v || '').replace(/\s+/g, ' ').trim());

    const iki = (n) => String(n).padStart(2, '0');
    const gorsel = (p, ad) => esc(p.klasor || 'images') + '/' + ad;

    const OK_SVG =
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M12 5l7 7-7 7"></path></svg>';
    const OK_SVG_16 =
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M12 5l7 7-7 7"></path></svg>';
    const BUYUTEC_SVG =
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.6-3.6M11 8.5v5M8.5 11h5"></path></svg>';

    // Durum rozetinin TÜRÜ
    const sadelestir = (s) =>
      String(s || '')
        .toLocaleLowerCase('tr')
        .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
        .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');

    const durumTuru = (s) => {
      const t = sadelestir(s);
      if (!t) return '';
      if (t.includes('yayin') || t.includes('canli') || t.includes('tamam')) return 'live';
      if (t.includes('yapim') || t.includes('devam') || t.includes('gelistir')) return 'wip';
      if (t.includes('arsiv') || t.includes('durdu') || t.includes('iptal')) return 'past';
      return 'neutral';
    };

    // 1) Projeler sekmesi: klasör kartları
    if (grid) {
      grid.innerHTML = PROJELER.map((p, i) => {
        const n = i + 1;
        const durum = (p.kunye && p.kunye.durum) ? String(p.kunye.durum).trim() : '';
        const tur = durumTuru(durum);

        const rozet = durum
          ? '<span class="folder-status folder-status-' + tur + '">' +
              '<span class="folder-status-dot" aria-hidden="true"></span>' +
              '<span class="folder-status-text">' + esc(durum) + '</span>' +
            '</span>'
          : '';

        return (
          '<a class="project-card project-folder" href="#proje-' + n + '" data-case="' + n + '"' +
          ' aria-label="' + esc(p.ad) + ' — ' + esc(p.kategori) +
          (durum ? ', ' + esc(durum) : '') + ' projesini incele">' +
            '<span class="folder-wrap"><span class="folder">' +
              '<span class="folder-shape" aria-hidden="true"><span class="folder-body"></span><span class="folder-tab"></span></span>' +
              '<span class="folder-index" aria-hidden="true">' + iki(n) + '</span>' +
              rozet +
              '<span class="folder-stack" aria-hidden="true">' +
                '<span class="paper paper-left"><img data-base="' + gorsel(p, '2') + '" alt="" loading="lazy"></span>' +
                '<span class="paper paper-right"><img data-base="' + gorsel(p, '3') + '" alt="" loading="lazy"></span>' +
                '<span class="paper paper-main"><img data-base="' + gorsel(p, '1') + '" alt="" loading="lazy"></span>' +
              '</span>' +
              '<span class="folder-dot" aria-hidden="true"></span>' +
              '<span class="folder-front">' +
                '<span class="folder-front-text">' +
                  '<span class="project-title">' + esc(p.ad) + '</span>' +
                  '<span class="project-meta">' + esc(p.kategori) + '</span>' +
                '</span>' +
                '<span class="folder-arrow" aria-hidden="true">' + OK_SVG + '</span>' +
              '</span>' +
            '</span></span>' +
          '</a>'
        );
      }).join('');
    }

    // 2) Ana sayfa: seçilmiş işler
    if (featList) {
      let sira = 0;
      featList.innerHTML = PROJELER.map((p, i) => {
        if (!p.oneCikan) return '';
        sira += 1;
        const n = i + 1;
        return (
          '<li class="feat-item rv">' +
            '<a class="feat-row" href="#proje-' + n + '" data-case="' + n + '"' +
            ' data-preview-base="' + gorsel(p, 'kapak') + '">' +
              '<span class="feat-num">' + iki(sira) + '</span>' +
              '<span class="feat-name">' + esc(p.ad) + '</span>' +
              '<span class="feat-meta">' + esc(p.kategori) + '</span>' +
              '<span class="feat-year">' + esc(p.yil) + '</span>' +
              '<span class="feat-arrow" aria-hidden="true">' + OK_SVG_16 + '</span>' +
            '</a>' +
          '</li>'
        );
      }).join('');
    }

    // 3) Detay modalları
    if (docWrap) {
      docWrap.innerHTML = PROJELER.map((p, i) => {
        const n = i + 1;
        const k = p.kunye || {};
        const bag = p.baglantilar || {};

        const kunye = [
          ['Rol', k.rol], ['Süre', k.sure], ['Ekip', k.ekip], ['Durum', k.durum]
        ].filter((s) => s[1])
         .map((s) => '<div><dt>' + esc(s[0]) + '</dt><dd>' + esc(s[1]) + '</dd></div>')
         .join('');

        const butonlar = [
          bag.canli ? '<a class="btn btn-primary" href="' + esc(bag.canli) + '" target="_blank" rel="noopener">Canlı Siteyi Gör</a>' : '',
          bag.github ? '<a class="btn btn-ghost" href="' + esc(bag.github) + '" target="_blank" rel="noopener">GitHub</a>' : ''
        ].join('');

        const etiketler = (p.etiketler || [])
          .map((e) => '<li>' + esc(e) + '</li>')
          .join('');

        const galeri = [1, 2, 3].map((g) =>
          '<figure class="case-shot">' +
            '<img data-base="' + gorsel(p, String(g)) + '" alt="' + esc(p.ad) + ' — ' + g + '. ekran" loading="lazy">' +
            '<span class="case-zoom" aria-hidden="true">' + BUYUTEC_SVG + '</span>' +
          '</figure>'
        ).join('');

        const bolum = (no, etiket, baslik, govde) =>
          '<div class="case-part">' +
            '<p class="case-num rv">' + no + ' — ' + etiket + '</p>' +
            '<h3 class="case-heading" data-split>' + baslik + '</h3>' +
            '<p class="case-text rv" data-delay="260">' + govde + '</p>' +
          '</div>';

        return (
          '<article class="case-doc" id="case-' + n + '" data-case-name="' + esc(p.ad) + '" hidden>' +
            '<p class="case-eyebrow rv">' + esc(p.kategori) + ' · ' + esc(p.yil) + '</p>' +
            '<h2 class="case-title" data-split>' + esc(p.ad) + '</h2>' +
            '<p class="case-lead rv" data-delay="300">' + metin(p.ozet) + '</p>' +
            (kunye ? '<dl class="case-meta rv" data-delay="380">' + kunye + '</dl>' : '') +
            (butonlar ? '<div class="hero-actions case-actions rv" data-delay="450">' + butonlar + '</div>' : '') +
            '<figure class="case-cover rv" data-delay="520">' +
              '<img data-base="' + gorsel(p, 'kapak') + '" alt="' + esc(p.ad) + ' kapak görseli" loading="lazy">' +
            '</figure>' +
            bolum('01',
              p.problemEtiket || 'Problem',
              p.problemBaslik || 'Çözülmesi gereken neydi?',
              metin(p.problem)) +
            bolum('02', 'Ne Yaptım', 'Yaklaşımım ve kurduğum çözüm.', metin(p.cozum)) +
            (etiketler ? '<ul class="cap-tags case-tags rv" data-delay="340">' + etiketler + '</ul>' : '') +
            bolum('03', 'Sonuç', 'Ortaya ne çıktı?', metin(p.sonuc)) +
            '<div class="case-part">' +
              '<p class="case-num rv">Ekranlar</p>' +
              '<div class="case-gallery rv" data-delay="220">' + galeri + '</div>' +
            '</div>' +
          '</article>'
        );
      }).join('');
    }

    // Görselleri bağla
    const bagla = (img) => {
      const base = img.dataset.base;
      if (!base) return;
      let i = 0;
      const dene = () => {
        img.src = base + '.' + EXT_SIRASI[i];
      };
      img.addEventListener('error', () => {
        i += 1;
        if (i < EXT_SIRASI.length) dene();
        else img.remove();
      });
      img.addEventListener('load', () => {
        const shot = img.closest('.case-shot');
        if (shot) shot.dataset.full = img.currentSrc || img.src;
      });
      dene();
    };

    document.querySelectorAll('#project-grid img, #case-doc-wrap img').forEach(bagla);

  }

  // DENEYİMİ ÜRET (projeler.js → zaman çizelgesi)
  function renderDeneyim() {
    const list = document.getElementById('exp-list');
    const countEl = document.getElementById('exp-count');
    if (!list) return;

    if (typeof DENEYIM === 'undefined' || !Array.isArray(DENEYIM)) {
      console.error('projeler.js içinde DENEYIM listesi bulunamadı — Deneyim sekmesi boş kalacak.');
      if (countEl) countEl.dataset.count = '0';
      return;
    }

    const esc = (v) =>
      String(v == null ? '' : v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const metin = (v) => esc(String(v || '').replace(/\s+/g, ' ').trim());

    list.innerHTML = DENEYIM.map((d, i) => {
      // Tarih aralığı tek bir yerde kuruluyor:
      const bitis = d.devam ? 'Günümüz' : (d.bitis || '');
      const tarih = [d.baslangic, bitis].filter(Boolean).map(esc).join(' — ');

      const kurum = [d.kurum, d.yer].filter(Boolean).map(esc).join(' · ');

      const etiketler = (d.etiketler || []).length
        ? '<ul class="cap-tags exp-tags">' +
            d.etiketler.map((e) => '<li>' + esc(e) + '</li>').join('') +
          '</ul>'
        : '';

      return (
        '<li class="exp-item rv' + (d.devam ? ' is-current' : '') + '">' +
          '<span class="exp-dot" aria-hidden="true"></span>' +
          '<div class="exp-side">' +
            (tarih ? '<span class="exp-date">' + tarih + '</span>' : '') +
            (d.tur ? '<span class="exp-type">' + esc(d.tur) + '</span>' : '') +
          '</div>' +
          '<div class="exp-main">' +
            '<h3 class="exp-role">' + esc(d.rol) + '</h3>' +
            (kurum ? '<p class="exp-org">' + kurum + '</p>' : '') +
            (d.metin ? '<p class="exp-text">' + metin(d.metin) + '</p>' : '') +
            etiketler +
          '</div>' +
        '</li>'
      );
    }).join('');

  }

});
