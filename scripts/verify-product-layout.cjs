// Browser regression coverage for the shared product layout. Seller fixtures
// exercise complete attempted rosters without relying on a live search finishing.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.BASE_URL || 'http://localhost:3100';
const routes = ['/test-part-page', '/offers/WP8546219', '/parts/WE14X25091'];
const widths = [390, 1024, 1152, 1200, 1280, 1440, 1920];
const baseline = process.env.SEO_BASELINE ? JSON.parse(fs.readFileSync(process.env.SEO_BASELINE)) : null;
const results = [];
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const route of routes) for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      page.setDefaultTimeout(60000);
      await page.route('**/*googletagmanager.com/**', r => r.abort());
      await page.route('https://api.appliancepartgeeks.com/**', async r => {
        const url = r.request().url();
        const groupOffers = group => Array.from({ length: 12 }, (_, i) => ({
          seller: `${group} Seller ${i + 1}`, seller_key: `${group}${i + 1}`,
          mpn: route.split('/').at(-1), exact_mpn_match: true, price: 100 + i,
          shipping_cost: 0, shipping_text: 'Free Shipping', returns_text: '30 day returns',
          condition: group === 'New' ? 'New OEM' : 'Used',
          availability: i === 1 ? 'backorder' : i === 2 ? 'out of stock' : 'in stock',
          product_url: `https://seller.example/${group}/${i}`,
        }));
        let data = {};
        if (url.includes('/compare/new-market/')) data = {
          status: 'complete', selected_sellers: [...groupOffers('New').map(o => o.seller), 'Failed Seller', 'No Match Seller'],
          seller_dispositions: { 'Failed Seller': { status: 'failed' }, 'No Match Seller': { status: 'not_found' } },
          offers: groupOffers('New'),
        };
        else if (url.includes('/refurb/')) data = {
          used_seller_comparison: { seller_statuses: groupOffers('Used').map(o => ({ seller: o.seller, seller_key: o.seller_key, status: 'complete' })) },
          used_seller_competitors: groupOffers('Used'),
        };
        else if (url.includes('/live-part-search/')) data = { results: [groupOffers('New')[0]] };
        await r.fulfill({ json: data });
      });
      const response = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 120000 });
      assert.equal(response.status(), 200, route);
      const grid = page.locator('.nextmerce-product-grid');
      await grid.waitFor();
      await page.waitForFunction(() => document.querySelector('[data-sellers-attempted]')?.dataset.sellersAttempted === '26');
      const layout = await grid.evaluate(e => {
        const rect = selector => { const r = e.querySelector(selector).getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, height: r.height }; };
        return { columns: getComputedStyle(e).gridTemplateColumns.split(' ').length,
          product: rect('.nextmerce-product-image'), buy: rect('.nextmerce-product-buy'),
          market: rect('aside[aria-label="Compare Seller Options"]'),
          overflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert.equal(layout.columns, width >= 1120 ? 3 : width >= 768 ? 2 : 1);
      assert.equal(layout.overflow, false);
      if (width >= 1120) {
        assert(layout.product.right <= layout.buy.x && layout.buy.right <= layout.market.x);
        assert(Math.abs(layout.product.y - layout.buy.y) < 2 && Math.abs(layout.buy.y - layout.market.y) < 2);
        assert(layout.market.height <= 441);
      } else if (width < 768) assert(layout.product.y < layout.buy.y && layout.buy.y < layout.market.y);
      const banner = page.locator('.sherpa-market-banner');
      assert.deepEqual(await banner.locator('a').evaluateAll(a => a.map(e => e.href)), ['https://part-sherpa.com/', 'https://part-sherpa.com/']);
      assert.equal(await banner.locator('a').last().innerText(), 'Visit Part Sherpa →');
      const lists = page.locator('[aria-label$="seller results"]');
      assert.equal(await lists.count(), 2);
      assert.equal(await page.locator('[data-seller-key]').count(), 26);
      assert.equal(await page.locator('[data-availability="stock"]').count(), 20);
      assert.equal(await page.locator('[data-availability="backorder"]').count(), 2);
      assert.equal(await page.locator('[data-availability="unavailable"]').count(), 3);
      assert.equal(await page.locator('[data-availability="inconclusive"]').count(), 1);
      assert((await page.locator('.attempted-terms').first().innerText()).includes('Free Shipping'));
      assert((await page.locator('.attempted-terms').first().innerText()).includes('30'));
      const priceBubble = await page.locator('.attempted-price[data-known="true"]').first().evaluate(e => ({ background: getComputedStyle(e).backgroundColor, border: getComputedStyle(e).borderRadius }));
      assert.notEqual(priceBubble.background, 'rgba(0, 0, 0, 0)'); assert.notEqual(priceBubble.border, '0px');
      const scrolls = await lists.evaluateAll(elements => elements.map(e => ({ height: e.clientHeight, scrollHeight: e.scrollHeight })));
      assert(scrolls.every(e => e.scrollHeight > e.height));
      await lists.first().evaluate(e => { e.scrollTop = e.scrollHeight; });
      assert((await lists.first().evaluate(e => e.scrollTop)) > 0);
      assert.equal(await lists.last().evaluate(e => e.scrollTop), 0);
      await lists.last().evaluate(e => { e.scrollTop = e.scrollHeight; });
      assert((await lists.last().evaluate(e => e.scrollTop)) > 0);
      const seo = await page.evaluate(() => ({ title: document.title,
        canonical: document.querySelector('link[rel=canonical]')?.href,
        robots: document.querySelector('meta[name=robots]')?.content,
        jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(e => JSON.parse(e.textContent)) }));
      if (baseline) assert.deepEqual(JSON.parse(JSON.stringify(seo)), baseline[route]);
      if (route === '/test-part-page') assert.equal(seo.robots, 'noindex, nofollow');
      // Exercise the existing quantity, cart confirmation and Buy Now handlers.
      const buy = page.locator('.nextmerce-product-buy');
      await buy.getByRole('button', { name: '+', exact: true }).click();
      await buy.getByRole('button', { name: 'Add to Cart', exact: true }).click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('cartItems') || '[]').some(i => i.qty === 2));
      const cart = JSON.parse(await page.evaluate(() => localStorage.getItem('cartItems')));
      assert.equal(cart[0].qty, 2);
      const image = page.locator('.nextmerce-product-image [role="button"]');
      await image.click();
      await page.getByRole('button', { name: 'Close image preview', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Close image preview', exact: true }).click();
      await buy.getByRole('button', { name: 'Buy Now', exact: true }).click();
      await page.waitForURL('**/checkout', { waitUntil: 'domcontentloaded', timeout: 120000 });
      assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem('cartItems')))[0].qty, 4);
      results.push({ route, width, columns: layout.columns, noOverflow: true, independentScrollers: true, commerce: true, imageZoom: true, seo: baseline ? 'unchanged' : seo });
      console.log(`${route} ${width}: passed`);
      await context.close();
    }
    if (process.env.RESULTS_FILE) fs.writeFileSync(process.env.RESULTS_FILE, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
