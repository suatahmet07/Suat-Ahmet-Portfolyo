// @ts-check
// Sitenin temel davranışları. Çalıştırma: npm test
import { test, expect } from '@playwright/test';

const ready = page => page.waitForFunction(() => window.siteReady === true, null, { timeout: 30000 });

test('sayfa hatasız açılır, temel öğeler yerindedir', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await ready(page);
  await expect(page).toHaveTitle(/Suat Ahmet/);
  await expect(page.locator('.cyl-card')).toHaveCount(5);
  await expect(page.locator('[role="link"] a')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('aynı oturumda yükleme ekranı tekrar gösterilmez', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await page.reload();
  await expect(page.locator('#loader')).toHaveCount(0);
  await ready(page);
});

test('adresteki bölüm yenilemede korunur', async ({ page }) => {
  await page.goto('/#projeler');
  await ready(page);
  await expect(page).toHaveURL(/#projeler$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  await page.reload();
  await ready(page);
  await expect(page).toHaveURL(/#projeler$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
});

test('proje katmanı açıkken arka plan kapalıdır, kapanınca açılır', async ({ page }) => {
  await page.goto('/#proje-portfolyo');
  await ready(page);
  await expect(page.locator('.pd.landed')).toBeVisible({ timeout: 15000 });
  expect(await page.locator('main').evaluate(el => el.inert)).toBe(true);
  await expect(page.locator('.pd-facts')).toContainText('JavaScript');
  await expect(page.locator('.pd-links a[href*="github.com"]')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('.pd')).toHaveCount(0);
  expect(await page.locator('main').evaluate(el => el.inert)).toBe(false);
});

test('başa dön oku kaydırınca belirir, sayfa sonunda gizlenir, en üste atar', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const arrow = page.locator('#toTop');
  await expect(arrow).toBeHidden();
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect(arrow).toBeHidden();
  await page.evaluate(() => window.scrollTo({ top: 4000, behavior: 'instant' }));
  await expect(arrow).toBeVisible();
  await arrow.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(arrow).toBeHidden();
});

test('WebGL yoksa düz görünüme geçilir', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      return /webgl/.test(type) ? null : original.call(this, type, ...rest);
    };
  });
  await page.goto('/');
  await ready(page);
  await expect(page.locator('html')).toHaveClass(/no-3d/);
  await expect(page.locator('#bookText')).toContainText('Atatürk Üniversitesi');
  await expect(page.locator('#bookText')).toBeVisible();
});

test('Three.js CDN gelmezse düz görünüme geçilir', async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/**', route => route.abort());
  await page.goto('/');
  await ready(page);
  await expect(page.locator('html')).toHaveClass(/no-3d/);
  await expect(page.locator('#bookText')).toBeVisible();
});

test.describe('yatay telefon', () => {
  test.use({ viewport: { width: 667, height: 375 }, hasTouch: true, isMobile: true });
  test('dikey çevir uyarısı görünür', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.rotate-lock')).toBeVisible();
  });
});

test.describe('dikey telefon', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  test('menü tek satırda sığar, kitap ek yaprak kazanır', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    await expect(page.locator('.nav-links a')).toHaveCount(3);
    await expect(page.locator('.nav-links a').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect.poll(() => page.evaluate(() => document.getElementById('bookCanvas')._state?.().t.length ?? 0)).toBeGreaterThan(3);
  });
});

test.describe('dokunmatik kaydırma', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

  // Parmağı (x1,y1)'den (x2,y2)'ye hızlıca sürükleyip bırakır
  async function swipe(page, x1, y1, x2, y2) {
    const cdp = await page.context().newCDPSession(page);
    const send = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    await send('touchStart', [{ x: x1, y: y1 }]);
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      await send('touchMove', [{ x: x1 + (x2 - x1) * i / steps, y: y1 + (y2 - y1) * i / steps }]);
      await page.waitForTimeout(16);
    }
    await send('touchEnd', []);
  }
  const y = page => page.evaluate(() => window.scrollY);
  const settled = async page => {
    let prev = -1;
    await expect.poll(async () => { const now = await y(page); const same = Math.abs(now - prev) < 1; prev = now; return same; }, { timeout: 25000, intervals: [700] }).toBe(true);
  };
  const stopOf = (page, sel, pad) => page.evaluate(([s, p]) => document.querySelector(s).getBoundingClientRect().top + scrollY - p, [sel, pad]);
  const goTo = (page, top) => page.evaluate(t => scrollTo({ top: t, behavior: 'instant' }), top);

  test('bırakınca süzülür', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    await goTo(page, 100);
    await swipe(page, 180, 600, 180, 250);
    await settled(page);
    expect(await y(page)).toBeGreaterThan(100 + 350 * 1.6 + 100);
  });

  test('süzülme durakta biter, yeni kaydırma devam eder; kartlar yatay gezilir', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    const cards = await stopOf(page, '#projectList', 0);
    await goTo(page, cards - 300);
    await swipe(page, 180, 700, 180, 200);
    await settled(page);
    expect(Math.abs(await y(page) - cards)).toBeLessThan(3);

    const before = await page.locator('#cyl').evaluate(el => el.style.transform);
    await swipe(page, 320, 400, 60, 400);
    await page.waitForTimeout(1500);
    expect(await page.locator('#cyl').evaluate(el => el.style.transform)).not.toBe(before);
    expect(Math.abs(await y(page) - cards)).toBeLessThan(3);

    await swipe(page, 180, 700, 180, 200);
    await settled(page);
    expect(await y(page)).toBeGreaterThan(cards + 300);

    const book = await stopOf(page, '#hakkimda', 88);
    await goTo(page, book - 300);
    await swipe(page, 180, 700, 180, 200);
    await settled(page);
    expect(Math.abs(await y(page) - book)).toBeLessThan(3);
    await swipe(page, 20, 790, 20, 300);
    await settled(page);
    expect(await y(page)).toBeGreaterThan(book + 100);
  });
});

test.describe('JavaScript kapalı', () => {
  test.use({ javaScriptEnabled: false });
  test('iletişim bilgileri görünür', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#emailBtn')).toHaveAttribute('href', /^mailto:/);
    await expect(page.locator('#emailBtn')).toBeVisible();
    await expect(page.locator('#socials a')).toHaveCount(3);
  });
});
