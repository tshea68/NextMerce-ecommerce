// Record the deployed UI against real APIs: no seller-response mocking.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BASE_URL || 'https://www.appliancepartgeeks.com';
const output = process.env.CAPTURE_DIR || '/tmp/market-check-live-capture';
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const { route, width } of [{ route: '/parts/WR55X11033', width: 390 }, { route: '/offers/WP8546219', width: 1440 }]) {
      const name = route.split('/').at(-1);
      const context = await browser.newContext({ viewport: { width, height: 900 }, recordVideo: { dir: output } });
      const page = await context.newPage();
      await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 120000 });
      const panel = page.locator('aside[aria-label="Compare Seller Options"]');
      await page.locator('.market-check-status').waitFor();
      await panel.scrollIntoViewIfNeeded();
      const samples = [];
      const snapshot = () => page.evaluate(() => ({
        at: Date.now(), status: document.querySelector('.market-check-message').textContent,
        elapsed: document.querySelector('.market-check-elapsed')?.textContent || null,
        progress: document.querySelector('.market-check-progress').textContent.trim(),
        pending: document.querySelectorAll('[data-availability="checking"]').length,
        rows: [...document.querySelectorAll('[data-seller-key]')].map(e => ({ key: e.dataset.sellerKey, state: e.dataset.availability })),
        pulse: !!document.querySelector('.market-check-pulse'),
        inBanner: !!document.querySelector('.market-check-status').closest('.sherpa-market-banner'),
        fontSize: getComputedStyle(document.querySelector('.market-check-status')).fontSize,
        height: document.querySelector('aside[aria-label="Compare Seller Options"]').getBoundingClientRect().height,
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      async function capture(phase) {
        const captured = new Set();
        const limit = Date.now() + 110000;
        while (Date.now() < limit) {
          const sample = await snapshot(); samples.push({ phase, ...sample });
          const stage = !sample.elapsed ? 'finished' : parseFloat(sample.elapsed) >= 0.2 ? 'advancing' : 'starting';
          if (!captured.has(stage)) {
            captured.add(stage);
            await panel.screenshot({ path: path.join(output, `${name}-${phase}-${stage}.png`) });
          }
          if (!sample.elapsed) return sample;
          await page.waitForTimeout(100);
        }
        throw Error(`${route}: seller checks never terminated`);
      }
      await capture('initial');
      const oldRows = await page.locator('[data-seller-key]').count();
      await panel.getByRole('button', { name: 'Refresh', exact: true }).click();
      const reset = await snapshot();
      assert.equal(reset.elapsed, '0.0s');
      assert.equal(reset.rows.length, oldRows);
      assert.equal(reset.status, 'Checking sellers…');
      assert(reset.pulse && reset.inBanner);
      const terminal = await capture('refresh');
      assert(samples.some(s => s.elapsed && parseFloat(s.elapsed) >= 0.2));
      assert(new Set(samples.filter(s => s.elapsed).map(s => s.progress)).size >= 2);
      assert(samples.some(s => s.pending > 0));
      assert(samples.every(s => !s.overflow));
      assert(samples.every(s => s.fontSize === '12px'));
      assert.equal(terminal.pulse, false);
      assert.equal(terminal.pending, 0);
      assert.match(terminal.status, /in stock · .*backorder · .*not available · .*inconclusive/);
      assert(!/checked|Starting/.test(terminal.progress));
      assert.equal(new Set(samples.map(s => s.height)).size, 1);
      await page.waitForTimeout(1200);
      const stable = await snapshot();
      assert.equal(stable.elapsed, null);
      assert.equal(stable.status, terminal.status);
      const video = await page.video().path();
      await context.close();
      results.push({ route, width, video, reset, terminal, samples });
      fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
      console.log(`${route}: visible loading, advancing timer, changing progress, pending rows, refresh, final summary and stable layout passed`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
