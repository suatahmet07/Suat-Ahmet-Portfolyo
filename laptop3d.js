// ===== 3D bilgisayar sahnesi (Three.js) =====
// Sahne sayfanın en üstünden başlar ve giriş yazısının üstüne biner (tuval saydam):
//   1. Kaydırma başlayınca giriş yazısı kaybolur; bilgisayar aşağıdan büyüyerek gelir
//      ve bu sırada kendi etrafında yavaşça dönüp tam karşıya oturur
//   2. Kamera ekranın karşısına geçip ekrana yaklaşır
//   3. Ekran sitenin devamına açılan bir pencereye dönüşür (ekran pikselleri saydamlaşır)
// Model: "Modern Slim Laptop" — Blaž Mraz, CC BY 4.0 (atıf sayfanın altında).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const section = document.getElementById('sahne');
const canvas = document.getElementById('laptopCanvas');
const intro = document.getElementById('giris');

if (section && canvas) init();

function init() {
  // ---- Ayarlar: sahnenin kaydırma ilerlemesine (0–1) göre evreler ----
  // Sıkıştırılmış model (KHR_mesh_quantization, 16-bit): 2.08 MB → 1.25 MB, görüntü aynı.
  // Orijinali media/laptop-original.glb (sorun çıkmazsa silinebilir)
  const MODEL = 'media/laptop.glb';
  const INTRO_OUT = [0, 0.17];   // giriş yazısı kaybolur
  const ENTER = [0.05, 0.3];     // bilgisayar ekrana gelir (yükselir, büyür, belirir)
  const ROTATE = [0.05, 0.66];   // bilgisayar kendi etrafında döner ve karşıya oturur
  const ZOOM = [0.66, 1];        // ekrana yaklaşılır, ekran açılır
  const TURN = Math.PI * 1.5;    // toplam dönüş (270°)
  const FOLLOW = 0.12;           // kaydırmayı takip yumuşaklığı (0–1; küçük = daha yumuşak)
  const FOV = 28;
  const HOLD = 0.25;             // sahne sonunda başlığın sabit durduğu kaydırma (ekran yüksekliği cinsinden)
  const TITLE_IN = [0.38, 0.52];  // ekran tamamen saydamlaşınca içindeki "PROJELERİM" belirir (yakınlaşma ilerlemesi)
  const TITLE_FILL = 0.84;       // başlık büyürken ekranın genişliğinin bu kadarını kaplar
  const TITLE_MAX = 0.92;        // en son boyu: sayfa genişliğinin bu kadarı (burada büyümeyi bırakıp sabitlenir)
  const WORDS = [0.05, 0.66];    // yandan geçen yazılar (FULL · STACK · WEB · DEVELOPER): dönüşle birlikte biter
  const WORD_FILL = 0.88;        // en geniş harf, bilgisayar ile sayfa kenarı arasının bu kadarını doldurur
  const WORD_OVERLAP = 0.4;      // sonraki yazı, öncekinin sonu ekranın bu kadar altındayken girmeye başlar

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp = (x, a = 0, b = 1) => Math.min(Math.max(x, a), b);
  const span = (x, [a, b]) => clamp((x - a) / (b - a));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const easeOut = x => 1 - Math.pow(1 - x, 3);
  const easeInOut = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const easeSine = x => 0.5 - Math.cos(Math.PI * x) / 2;

  // ---- Çizici, sahne, ışık ----
  // Tam ekran tuval: piksel yoğunluğu 1.5'te (zayıf cihazda 1'de) sınırlanır; zayıf cihazda kenar yumuşatma kapalı
  const LOW = !!window.LOW_END;
  const DPR = () => Math.min(window.devicePixelRatio || 1, LOW ? 1 : 1.5);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !LOW, powerPreference: 'high-performance' });
  } catch (err) {
    window.fail3D('WebGL açılamadı');
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; // gerçekçi metal yansıması
  const key = new THREE.DirectionalLight(0xfff0dc, 1.6);
  key.position.set(1.5, 2.5, 2);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 50);
  const pivot = new THREE.Group(); // dönüş ve giriş hareketi bu grupla yapılır
  scene.add(pivot);

  // Yumuşak zemin gölgesi: bilgisayarın altında, onunla birlikte döner
  const shadow = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(70,48,24,0.55)');
    g.addColorStop(0.5, 'rgba(70,48,24,0.22)');
    g.addColorStop(1, 'rgba(70,48,24,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = -1;
    return m;
  })();
  pivot.add(shadow);

  // Ekranı "pencere" yapan malzeme: ekran piksellerini tuvalde saydam yazar → arkadaki site görünür.
  // a = 1: siyah ekran · a = 0: tamamen açık pencere
  const holeMat = new THREE.ShaderMaterial({
    uniforms: { a: { value: 1 } },
    vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float a; void main(){ gl_FragColor = vec4(vec3(0.015) * a, a); }',
    blending: THREE.NoBlending,
    toneMapped: false,
  });

  let model = null, screenMesh = null, screenMat = null;
  const look = new THREE.Vector3();      // bilgisayarın merkezi (kameranın baktığı nokta)
  const screenC = new THREE.Vector3();   // ekranın merkezi (karşıdan, dönüş bitince)
  const screenN = new THREE.Vector3();   // ekranın normali (ekrandan dışarı)
  let screenW = 0, screenH = 0, fitW = 1, fitH = 1;

  let target = 0, current = 0, raf = null;
  let vw = 1, vh = 1;

  // ---- Yandan geçen yazılar: her harf alt alta, kaydırdıkça aşağıdan yukarı geçer ----
  const words = [...document.querySelectorAll('#sideWords .side-word')].map(el => {
    const text = el.textContent.trim();
    el.textContent = '';
    for (const ch of text) { const s = document.createElement('span'); s.textContent = ch; el.appendChild(s); }
    return { el, text, h: 0, start: 0 };
  });
  let wordsTotal = 1, wordsReady = false;

  // ---- Ekranın içindeki başlık: ekranla birlikte büyür, yakınlaşma bitince ekrana sabitlenir ----
  const title = document.getElementById('screenTitle');
  const projects = document.getElementById('projeler');
  const tv = new THREE.Vector3();
  let zoomEnd = 1, titleK = 0, titleS = 1, titleX = 0, titleY = 0;

  function layoutTitle() {
    if (!title || !model) return;
    title.style.fontSize = '100px'; // gerçek genişliği (harf aralığıyla) 100px'te ölç, sonra ölçekle
    const w100 = title.offsetWidth || 1;
    title.style.fontSize = (100 * vw * TITLE_MAX / w100).toFixed(1) + 'px';
    zoomEnd = findZoomEnd();
  }

  // Ekranın sayfadaki genişliği (px), kamera o anki konumundayken
  function screenPx() {
    tv.copy(screenC); tv.x -= screenW / 2; tv.project(camera); const l = tv.x;
    tv.copy(screenC); tv.x += screenW / 2; tv.project(camera);
    return (tv.x - l) * vw / 2;
  }
  // Başlığın en büyük boyuna ulaştığı yakınlaşma değeri (ikili arama)
  function findZoomEnd() {
    const need = vw * TITLE_MAX / TITLE_FILL;
    let a = TITLE_IN[1], b = 1;
    placeCamera(b);
    if (screenPx() < need) return 1;
    for (let i = 0; i < 24; i++) { const m = (a + b) / 2; placeCamera(m); if (screenPx() >= need) b = m; else a = m; }
    return b;
  }

  // Ekranın o anki ekran-üstü konumu ve genişliği (kamera ayarlandıktan sonra çağrılır)
  function trackScreen(zoom) {
    titleK = smooth(TITLE_IN[0], TITLE_IN[1], zoom);
    if (!titleK) return;
    tv.copy(screenC).project(camera);
    titleX = tv.x * vw / 2;
    titleY = -tv.y * vh / 2;
    // ekranla birlikte büyür; en büyük haline yakınlaşmanın sonunda ulaşır
    titleS = Math.min(1, screenPx() * TITLE_FILL / (vw * TITLE_MAX));
  }

  function placeTitle() {
    if (!title) return;
    // Sahne bitince başlık sayfayla birlikte yukarı kayar; kartlar altından gelir
    const out = Math.min(0, section.getBoundingClientRect().bottom - vh);
    const show = titleK > 0 && out > -vh;
    title.style.visibility = show ? 'visible' : 'hidden';
    if (!show) return;
    const k = titleK;
    title.style.opacity = k.toFixed(3);
    title.style.transform = `translate(${titleX.toFixed(1)}px, ${(titleY + out).toFixed(1)}px) translate(-50%, -50%) scale(${(titleS * (0.92 + 0.08 * k)).toFixed(4)})`;
  }

  // Harf boyu ve sıralama: bilgisayarın dönerken en geniş halinin kenarı ile sayfa kenarı arası
  function layoutWords() {
    if (!words.length || !model) return;
    const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const share = Math.min(fitW / (2 * t * camera.aspect * baseDistance()), 1);
    const gap = Math.max(vw * (1 - share) / 2, vw * 0.2); // dar ekranda bilgisayarın arkasına biraz biner
    const c = document.createElement('canvas').getContext('2d');
    c.font = "900 100px Poppins";
    let widest = 1;
    for (const w of words) for (const ch of w.text) widest = Math.max(widest, c.measureText(ch).width);
    const size = 100 * gap * WORD_FILL / widest;
    let at = 0, prevH = 0;
    words.forEach((w, i) => {
      w.el.style.fontSize = size.toFixed(1) + 'px';
      w.el.style.width = gap.toFixed(1) + 'px';
      w.h = w.el.offsetHeight;
      // sabit hız: sonraki yazı, önceki ekranın altından tamamen çıkmadan girer
      if (i) at += prevH + vh * WORD_OVERLAP;
      w.start = at;
      prevH = w.h;
    });
    const last = words[words.length - 1];
    wordsTotal = last.start + last.h + vh; // son yazının sonu ekranın üstünden çıkana kadar
    wordsReady = true;
  }

  function moveWords(p) {
    if (!wordsReady) return;
    const d = reduceMotion ? -1 : span(p, WORDS) * wordsTotal; // kat edilen yol (px)
    for (const w of words) {
      const y = vh - (d - w.start);                // yazının üst kenarı
      const on = d > w.start && y + w.h > 0;
      w.el.style.visibility = on ? 'visible' : 'hidden';
      if (on) w.el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    }
  }

  function progress() {
    if (reduceMotion) return ROTATE[1]; // hareket azaltma: bilgisayar karşıdan, sabit
    const r = section.getBoundingClientRect();
    // sondaki HOLD kadar kaydırma animasyona katılmaz: büyümüş PROJELERİM orada kısa bir süre sabit durur
    const total = r.height - window.innerHeight * (1 + HOLD);
    return total > 0 ? clamp(-r.top / total) : 0;
  }

  // Giriş yazısı: yukarı kayar, bulanıklaşır, kaybolur (kaydırmaya anında bağlı)
  function fadeIntro(p) {
    if (!intro || reduceMotion) return;
    const k = easeOut(span(p, INTRO_OUT));
    intro.style.opacity = (1 - k).toFixed(3);
    intro.style.transform = k ? `translateY(${(-k * 70).toFixed(1)}px) scale(${(1 - k * 0.05).toFixed(4)})` : '';
    // Bulanıklık her karede büyük yazıyı yeniden işler: zayıf cihazda yalnızca solma kalır
    if (!LOW) intro.style.filter = k ? `blur(${(k * 8).toFixed(2)}px)` : '';
    intro.style.visibility = k >= 1 ? 'hidden' : '';
  }

  function resize() {
    vw = canvas.clientWidth || window.innerWidth;
    vh = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(DPR());
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
    layoutWords();
    layoutTitle();
    render();
  }

  // Kameranın bilgisayara uzaklığı: dönerken bilgisayarın en geniş hali masaüstünde ekran
  // genişliğinin ~%58'i, mobilde ~%90'ı olsun; yüksekliği ekranın %60'ını geçmesin
  function baseDistance() {
    const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const share = vw < 700 ? 0.9 : 0.58;
    const byW = fitW / share / (2 * t * camera.aspect);
    const byH = fitH / 0.6 / (2 * t);
    return Math.max(byW, byH);
  }

  const camDir = new THREE.Vector3(0, 0.3, 1).normalize(); // hafif yukarıdan bakış
  const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), aimV = new THREE.Vector3();

  // Kamera: temel konumdan ekranın tam karşısına ve ekrana doğru
  function placeCamera(zoom) {
    const d0 = baseDistance();
    p0.copy(look).addScaledVector(camDir, d0);
    const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const d1 = Math.min(screenH * 0.86 / (2 * t), screenW * 0.86 / (2 * t * camera.aspect));
    p1.copy(screenC).addScaledVector(screenN, d1);
    camera.position.lerpVectors(p0, p1, easeInOut(zoom));
    aimV.lerpVectors(look, screenC, smooth(0, 0.5, zoom));
    camera.lookAt(aimV);
    camera.updateMatrixWorld();
  }

  function render() {
    if (!model) { renderer.clear(); return; }
    const p = current;
    const enter = reduceMotion ? 1 : easeOut(span(p, ENTER));
    const rot = reduceMotion ? 1 : easeSine(span(p, ROTATE));
    // Yakınlaşma, başlığın en büyük haline ulaştığı yerde biter; sahne orada çözülür ve
    // başlık (ardından da proje kartları) sayfayla birlikte yukarı kaymaya devam eder
    const zoom = reduceMotion ? 0 : span(p, ZOOM) * zoomEnd;

    // Giriş: aşağıdan yükselir, küçükten büyür, belirir · Dönüş: yavaşça karşıya oturur
    pivot.position.y = -(1 - enter) * 0.55;
    pivot.scale.setScalar(0.7 + 0.3 * enter);
    pivot.rotation.y = -TURN * (1 - rot);
    pivot.rotation.x = 0.2 * (1 - rot);   // dönerken hafif eğik, karşıya gelince düzleşir
    // Başlık en büyük boyuna ulaştığı anda bilgisayar tamamen kaybolmuş olur
    const gone = reduceMotion ? 0 : smooth(zoomEnd * 0.86, zoomEnd, zoom);
    canvas.style.opacity = (enter * (1 - gone)).toFixed(3);

    placeCamera(zoom);

    // Ekran pencereye dönüşür
    const open = smooth(0.08, 0.38, zoom); // başlık laptop hâlâ görünürken belirebilsin diye erken açılır
    if (open > 0) { screenMesh.material = holeMat; holeMat.uniforms.a.value = 1 - open; }
    else screenMesh.material = screenMat;
    shadow.material.opacity = 1 - smooth(0, 0.3, zoom);

    moveWords(p);
    trackScreen(zoom);
    placeTitle();
    renderer.render(scene, camera);
  }

  function tick() {
    const diff = target - current;
    current = Math.abs(diff) < 0.0004 ? target : current + diff * FOLLOW;
    render();
    raf = current === target ? null : requestAnimationFrame(tick);
  }
  function onScroll() {
    target = progress();
    fadeIntro(target);
    placeTitle();
    if (raf === null) raf = requestAnimationFrame(tick);
  }

  fadeIntro(progress());
  resize();
  window.addEventListener('resize', () => { resize(); onScroll(); });
  window.addEventListener('scroll', onScroll, { passive: true });

  new GLTFLoader().load(MODEL, gltf => {
    model = gltf.scene;

    // Boyutlandır: genişlik 1 birim, taban y = 0, yatayda ortada
    let box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    model.scale.setScalar(1 / size.x);
    box = new THREE.Box3().setFromObject(model);
    const c = box.getCenter(new THREE.Vector3());
    model.position.set(-c.x, -box.min.y, -c.z);
    pivot.add(model);
    pivot.updateMatrixWorld(true);

    box = new THREE.Box3().setFromObject(model);
    const s2 = box.getSize(new THREE.Vector3());
    look.set(0, s2.y * 0.5, 0);
    fitW = Math.hypot(s2.x, s2.z);   // dönerken yatayda kapladığı en geniş alan
    fitH = s2.y;
    shadow.scale.set(s2.x * 1.25, s2.z * 1.6 + 0.2, 1);
    shadow.position.y = 0.002;

    // Ekran parçası: konumu, boyutu ve yönü (dönüş bitince, karşıdan bakarken)
    screenMesh = model.getObjectByName('Screen_Screen_0');
    if (!screenMesh) model.traverse(o => { if (!screenMesh && o.isMesh && /screen/i.test(o.material?.name || '') && !/frame|border/i.test(o.material.name)) screenMesh = o; });
    screenMat = screenMesh.material;
    screenMesh.renderOrder = 10;
    screenMesh.geometry.computeBoundingBox();
    const gb = screenMesh.geometry.boundingBox;
    const ws = screenMesh.getWorldScale(new THREE.Vector3());
    screenW = (gb.max.x - gb.min.x) * ws.x;
    screenH = (gb.max.y - gb.min.y) * ws.y;
    gb.getCenter(screenC);
    screenMesh.localToWorld(screenC);
    const nAttr = screenMesh.geometry.attributes.normal;
    screenN.set(nAttr.getX(0), nAttr.getY(0), nAttr.getZ(0))
      .applyMatrix3(new THREE.Matrix3().getNormalMatrix(screenMesh.matrixWorld)).normalize();
    if (screenN.z < 0) screenN.negate(); // kameraya bakan yön

    target = current = progress();
    layoutWords();
    layoutTitle();
    document.fonts?.load('900 100px Poppins').then(() => { layoutWords(); layoutTitle(); render(); });
    render();
    canvas.dispatchEvent(new Event('ready'));
  }, undefined, () => window.fail3D('3D model yüklenemedi'));
}
