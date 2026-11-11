// =====================================================================
//  YAYIN KLASÖRÜ — Sitenin yalnızca yayında gereken dosyalarını yayin/ klasörüne kopyalar.
//  Çalıştırma:  npm run yayin    (ya da: node yayin-hazirla.js)
//  Sonra yayin/ klasörünü Netlify'a (app.netlify.com → Deploys) sürükleyip bırakın.
//  Siteyi her değiştirdiğinizde yeniden çalıştırın; klasör baştan oluşturulur.
// =====================================================================
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'yayin');

// Yayına giden dosya ve klasörler
const FILES = [
  'index.html', 'style.css',
  'light.js', 'data.js', 'render.js', 'script.js', 'showcase.js', 'contact-title.js', 'touch-scroll.js',
  'laptop3d.js', 'book3d.js',
  'robots.txt', 'sitemap.xml',
  '404.html', '_headers', 'manifest.webmanifest'
];
const DIRS = ['icons', 'media'];
// Klasörlerin içinden yayına gitmeyecekler
const SKIP = new Set(['laptop-original.glb']);

// Klasörün kendisi değil içi boşaltılır: klasör açık bir pencerede/terminalde olsa da çalışır
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) fs.rmSync(path.join(OUT, f), { recursive: true, force: true });

let count = 0, bytes = 0;
const copy = (from, to) => {
  fs.copyFileSync(from, to);
  count++;
  bytes += fs.statSync(from).size;
};

for (const f of FILES) copy(path.join(ROOT, f), path.join(OUT, f));
for (const d of DIRS) {
  fs.mkdirSync(path.join(OUT, d));
  for (const f of fs.readdirSync(path.join(ROOT, d))) {
    if (SKIP.has(f)) continue;
    const src = path.join(ROOT, d, f);
    if (fs.statSync(src).isFile()) copy(src, path.join(OUT, d, f));
  }
}

console.log(`yayin/ hazır: ${count} dosya, ${(bytes / 1024 / 1024).toFixed(2)} MB`);
