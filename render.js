// ===== data.js içeriğini sayfalara yerleştirir =====
(() => {
  const S = window.SITE;
  if (!S) return;
  const P = S.person;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = id => document.getElementById(id);
  const isReal = url => url && url !== '#';

  const ICON = {
    external: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" /></svg>'
  };

  // ---------- Ortak alanlar ----------
  const binds = {
    name: P.name,
    email: P.email
  };
  document.querySelectorAll('[data-bind]').forEach(el => {
    const v = binds[el.dataset.bind];
    if (v) el.textContent = v;
  });
  const year = $('year');
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Ana sayfa ----------
  if ($('projectList')) {
    document.title = `${P.name} — ${P.title}`;


    // Projeler: kartlar dönen bir silindirin yüzeyindedir (showcase.js kurar ve döndürür).
    // Görseli olmayan proje için aynı oranda yer tutucu görsel üretilir.
    const placeholder = (p, i) => 'data:image/svg+xml,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1763" height="844" viewBox="0 0 1763 844">
        <rect width="1763" height="844" fill="#0E0D0B"/>
        <text x="881" y="420" text-anchor="middle" font-family="Outfit, sans-serif" font-size="118" font-weight="600" letter-spacing="-3" fill="#D9A548">${esc(p.name)}</text>
        <text x="881" y="500" text-anchor="middle" font-family="Outfit, sans-serif" font-size="30" letter-spacing="9" fill="rgba(245,235,220,.55)">${String(i + 1).padStart(2, '0')} · GÖRSEL YAKINDA</text>
      </svg>`);
    // Kart: üzerine gelince karartma + Poppins başlık + sağ altta "siteye git" butonu.
    // Butonun dışına tıklanınca showcase.js proje bilgilerini geçiş animasyonuyla açar.
    $('projectList').innerHTML = `<div class="cyl-stage"><div class="cyl-view"><div class="cyl" id="cyl">${S.projects.map((p, i) => `
      <div class="cyl-card" data-i="${i}" data-src="${esc(p.cover || placeholder(p, i))}">
        <button class="cyl-open" type="button" aria-label="${esc(p.name)} — proje bilgileri"></button>
        <span class="cyl-label" aria-hidden="true">${esc(p.name)}</span>
        <a class="cyl-visit" href="${esc(isReal(p.url) ? p.url : '#')}" ${isReal(p.url) ? 'target="_blank" rel="noopener"' : 'data-soon="1" title="Canlı bağlantı yakında"'}
           aria-label="${esc(p.name)} sitesini ziyaret et">Siteye git ${ICON.external}</a>
      </div>`).join('')}
    </div></div></div>`;

    // Kitabın metin hâli: ekran okuyucular için; 3D çalışmazsa herkese görünür (style.css html.no-3d)
    if ($('bookText') && S.book) {
      $('bookText').innerHTML = S.book.pages.map(p =>
        `<li><h3>${esc(p.role)} — ${esc(p.company)}</h3><p>${esc(p.years)}${p.place ? ` · ${esc(p.place)}` : ''}</p><p>${esc(p.summary)}</p>` +
        (p.highlights?.length ? `<ul>${p.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : '') + '</li>'
      ).join('');
    }

    // İletişim (sayfanın altı)
    if ($('emailBtn')) $('emailBtn').href = `mailto:${P.email}`;
    // Üzerine gelince: zemin marka rengine döner, yazı sola kayar, logo sağdan gelir
    if ($('socials')) $('socials').innerHTML = P.socials.map(s =>
      `<li><a class="social${s.icon ? ` social-${esc(s.icon)}` : ''}" href="${esc(s.url)}" ${isReal(s.url) ? 'target="_blank" rel="noopener"' : ''}>` +
      // Logo yazının hemen sağında durur; üzerine gelince yazı + logo birlikte ortalanır
      `<span class="social-label">${esc(s.label)}${s.icon ? '<span class="social-icon" aria-hidden="true"></span>' : ''}</span>` +
      `</a></li>`).join('');
  }
})();
