// ===== Canlı arka plan: kum zemin üzerinde süzülen alaca beyaz dumanlar (WebGL) =====
// Zemin her zaman #DCC196 kalır; üstünde yarı saydam, yavaşça akan ışık/duman katmanları dolaşır.
// WebGL yoksa body'nin düz kum rengi görünür; site bozulmaz.
(() => {
  const canvas = document.getElementById('light');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) { canvas.remove(); return; }

  // ---- Ayarlar: buradan oynayabilirsiniz ----
  const SPEED = 1.0;        // hareket hızı (0.5 = yarı hız, 2 = iki kat)
  const SMOKE = 1.0;     // dumanın yoğunluğu (0–1)
  // Çözünürlük (CSS pikseline göre; ekranın piksel yoğunluğu hesaba katılmaz — duman yumuşak, fark görünmez).
  // Kareler yavaşlarsa sıradaki basamağa iner. Zayıf cihaz bir basamak aşağıdan başlar.
  const SCALES = [0.5, 0.38, 0.28, 0.2];
  const MAX_PIXELS = 520000;  // büyük ekranda bile en fazla bu kadar piksel (≈ 960×540)
  const FPS = 30;             // duman çok yavaş aktığı için saniyede 30 kare yeterli; GPU yükü yarıya iner
  let level = window.LOW_END ? 1 : 0;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const vertexSrc = 'attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }';

  const fragmentSrc = `
    precision highp float;
    uniform vec2 r;
    uniform float t;
    uniform float k;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
                 mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }

    const mat2 R = mat2(0.8, 0.6, -0.6, 0.8);
    float fbm(vec2 p) {
      float s = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++) { s += a * noise(p); p = R * p * 2.02 + 0.13; a *= 0.5; }
      return s;
    }

    // Yoğunluk için düz dağılımlı fbm: en büyük ölçeğin ağırlığı düşük tutulur,
    // böylece duman tek bir bölgede kümelenmek yerine ekrana dengeli yayılır
    float fbmEven(vec2 p) {
      float s = 0.0;
      s += 0.28 * noise(p); p = R * p * 2.02 + 0.13;
      s += 0.26 * noise(p); p = R * p * 2.02 + 0.13;
      s += 0.20 * noise(p); p = R * p * 2.02 + 0.13;
      s += 0.15 * noise(p); p = R * p * 2.02 + 0.13;
      s += 0.11 * noise(p);
      return s;
    }

    // Bir duman katmanı: x = yoğunluk, y = ışık yönünde kaydırılmış yoğunluk, z = lif deseni
    vec3 layer(vec2 p, float T) {
      // Akış alanı: duman bu alan boyunca kıvrılır, kendi üzerine bükülür
      vec2 q = vec2(fbm(p + vec2(0.0, T * 0.8)),
                    fbm(p + vec2(5.2, 1.3) - vec2(T * 0.6, 0.0)));
      vec2 w = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + T * 0.45),
                    fbm(p + 3.0 * q + vec2(8.3, 2.8) - T * 0.35));
      vec2 warp = p + 2.2 * w;
      return vec3(fbmEven(warp),
                  fbmEven(warp + vec2(-0.045, 0.06)),
                  fbm(warp * 1.6 + w * 1.4 + 7.0));
    }

    // Bir duman alanının görünümü: x = duman miktarı, y = ışık, z = kuma düşen gölge
    vec3 look(vec3 a, float glow) {
      float f = a.x, fl = a.y, g = a.z;
      // Gövde: net ama yumuşak kenarlı duman kütleleri
      float body = smoothstep(0.55, 0.78, f);
      // İç doku: gövdenin içinde daha yoğun çekirdekler
      float core = smoothstep(0.66, 0.86, f);
      // Lifler: dumanın ucunda ve kenarında ince, parlak iplikler
      float strands = pow(1.0 - abs(2.0 * g - 1.0), 5.0) * smoothstep(0.44, 0.66, f);
      // Işık: ışığa bakan kenarlar parlar, karşı taraf hafif gölgede kalır
      float lit = clamp(0.55 + (f - fl) * 9.0, 0.0, 1.0);
      float amount = (body * 0.5 + core * 0.16 + strands * 0.3) * (0.85 + glow * 0.3);
      float shade = smoothstep(0.42, 0.7, fl) * (1.0 - lit) * 0.35;
      return vec3(amount, lit, shade);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / r;
      float ar = r.x / r.y;
      vec2 A = vec2(ar, 1.0);
      float T = t * 0.04;

      // Yavaşça gezinen yumuşak ışık
      vec2 c1 = vec2(0.64 + 0.16 * sin(T * 0.8), 0.66 + 0.10 * cos(T * 0.6));
      vec2 d1 = (uv - c1) * A;
      float glow = exp(-dot(d1, d1) * 2.4);

      // ---- Normal duman: yukarı ve hafif sağa doğru süzülür ----
      vec2 p = uv * A * 2.1 + vec2(-T * 0.18, -T * 0.42);
      // Birbirinden bağımsız iki katman: birinin boş bıraktığı yeri diğeri doldurur
      vec3 a = layer(p, T);
      vec3 b = layer(p * 0.92 + vec2(17.3, -9.1), T * 1.15 + 3.0);
      vec3 L = look(a.x >= b.x ? a : b, glow);

      vec3 sand   = vec3(0.863, 0.757, 0.588); // #DCC196 — zemin
      vec3 warm   = vec3(0.910, 0.816, 0.659); // #E8D0A8 — ışık tonu
      vec3 cream  = vec3(0.976, 0.949, 0.902); // alaca beyaz, ışık alan duman
      vec3 haze   = vec3(0.925, 0.867, 0.773); // gölgede kalan duman
      vec3 shadow = vec3(0.780, 0.665, 0.495); // dumanın kum üzerine düşen hafif gölgesi

      vec3 col = sand;
      col = mix(col, warm, glow * 0.28);
      // Dumanın gölge tarafı kumu çok hafif koyulaştırır — derinlik verir
      col = mix(col, shadow, L.z);
      col = mix(col, mix(haze, cream, L.y), min(L.x, 0.72) * k);

      // Renk bantlarını önleyen çok hafif titreşim
      col += (hash(gl_FragCoord.xy + fract(t) * 97.0) - 0.5) / 160.0;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSrc));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSrc));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (err) {
    console.warn('Arka plan shader hatası:', err);
    canvas.remove();
    return;
  }
  gl.useProgram(program);

  // Ekranı kaplayan tek üçgen
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const attr = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(attr);
  gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, 'r');
  const uTime = gl.getUniformLocation(program, 't');
  const uSmoke = gl.getUniformLocation(program, 'k');


  function resize() {
    let w = window.innerWidth * SCALES[level], h = window.innerHeight * SCALES[level];
    const over = Math.sqrt((w * h) / MAX_PIXELS);
    if (over > 1) { w /= over; h /= over; }
    canvas.width = Math.max(1, Math.round(w));
    canvas.height = Math.max(1, Math.round(h));
    gl.viewport(0, 0, canvas.width, canvas.height);
    draw(lastNow);
  }

  // Hareket azaltma tercihinde animasyon çok yavaşlar ama durmaz
  const speed = SPEED * (reduceMotion ? 0.25 : 1);
  const start = performance.now() - 40000;
  let lastNow = performance.now();

  function draw(now) {
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, ((now - start) / 1000) * speed);
    gl.uniform1f(uSmoke, SMOKE);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // Saniyede FPS kare çizilir. Ayrıca kareler arası süre izlenir: sayfa genel olarak takılıyorsa
  // (2 sn boyunca kareler ortalama 25 ms'den uzun) arka plan bir basamak daha düşük çözünürlüğe iner.
  const frameMs = 1000 / FPS;
  let rafId = null, lastDraw = -Infinity, prev = 0, slow = 0, total = 0;
  function loop(now) {
    rafId = requestAnimationFrame(loop);
    const dt = now - prev;
    prev = now;
    if (dt > 0 && dt < 250 && level < SCALES.length - 1) {   // sekme değişimi vb. uzun aralar sayılmaz
      total += dt;
      if (dt > 25) slow += dt;
      if (total > 2000) {
        if (slow / total > 0.6) { level++; resize(); }
        slow = total = 0;
      }
    }
    if (now - lastDraw < frameMs - 2) return;
    lastDraw = now;
    lastNow = now;
    draw(now);
  }

  resize();
  window.addEventListener('resize', resize);
  rafId = requestAnimationFrame(loop);

  // Sekme görünmezken çizmeyi durdur
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(rafId); rafId = null; }
    else if (rafId === null) rafId = requestAnimationFrame(loop);
  });
})();
