// Controlled backend responses and browser time verify intermediate states,
// refresh, deadline cleanup and reduced motion without running a real 90s check.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.BASE_URL || 'http://localhost:3102';
const cases = [
  { route: '/offers/WP8546219', width: 1440, scenario: 'fast' },
  { route: '/parts/WE14X25091', width: 390, scenario: 'slow' },
  { route: '/offers/WP8546219', width: 390, scenario: 'partial failure' },
  { route: '/parts/WE14X25091', width: 1440, scenario: 'deadline' },
  { route: '/parts/WE14X25091', width: 390, scenario: 'source failure' },
];
const results = [];
let activePage;
async function waitUntil(predicate) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) { if (await predicate()) return; await activePage.clock.runFor(1); await new Promise(resolve => setTimeout(resolve, 25)); }
  throw new Error('Browser state did not settle');
}
(async () => {
  const browser = await chromium.launch();
  try {
    for (const test of cases) {
      const context = await browser.newContext({ viewport: { width: test.width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      activePage = page;
      await page.clock.install();
      await page.clock.pauseAt(new Date("2100-01-01T00:00:00Z"));
      await page.addInitScript(() => {
        const create = window.setInterval.bind(window), clear = window.clearInterval.bind(window);
        window.__marketTimers = new Set(); window.__marketTimerMax = 0;
        window.__marketVisibilityListeners = new Set(); window.__marketVisibilityMax = 0;
        const add = document.addEventListener.bind(document), remove = document.removeEventListener.bind(document);
        document.addEventListener = (type, fn, options) => {
          if (type === "visibilitychange") { window.__marketVisibilityListeners.add(fn); window.__marketVisibilityMax = Math.max(window.__marketVisibilityMax, window.__marketVisibilityListeners.size); }
          return add(type, fn, options);
        };
        document.removeEventListener = (type, fn, options) => { if (type === "visibilitychange") window.__marketVisibilityListeners.delete(fn); return remove(type, fn, options); };
        window.setInterval = (fn, delay, ...args) => {
          const id = create(fn, delay, ...args);
          if (delay === 200) { window.__marketTimers.add(id); window.__marketTimerMax = Math.max(window.__marketTimerMax, window.__marketTimers.size); }
          return id;
        };
        window.clearInterval = id => { window.__marketTimers.delete(id); return clear(id); };
      });
      await page.route('**/*googletagmanager.com/**', r => r.abort());
      let phase = 'initial', firstRosterReleased = false;
      const held = [];
      const delayedMetadata = [];
      const mpn = test.route.split('/').at(-1);
      const offer = (seller, condition = 'New OEM', price = 100) => ({ seller, seller_key: seller, mpn, exact_mpn_match: true, price, shipping_cost: 0, condition, availability: 'in stock', product_url: 'https://seller.example/' + seller });
      const catalog = { results: [offer('New A')] };
      const used = { used_seller_comparison: { status: 'complete', seller_statuses: [{ seller: 'Used A', status: 'complete', offer_count: 1 }] }, used_seller_competitors: [offer('Used A', 'Used')] };
      const searching = { ...(test.scenario === 'slow' ? {} : { status: 'searching' }), selected_sellers: ['New A', 'New B', 'New C'], progress: { completed_groups: ['New A'], pending_groups: ['New B', 'New C'] }, seller_dispositions: { 'New A': { search_status: 'found', availability: 'in_stock' } }, offers: [offer('New A')] };
      const finished = { status: 'complete', selected_sellers: ['New A', 'New B', 'New C'], seller_dispositions: { 'New A': { search_status: 'found', availability: 'in_stock' }, 'New B': { search_status: 'found', availability: 'backorder' }, 'New C': { search_status: test.scenario === 'partial failure' ? 'failed' : 'not_found' } }, offers: [offer('New A'), { ...offer('New B'), availability: 'backorder' }] };
      const release = async () => { const pending = held.splice(0); for (const { route, data } of pending) await route.fulfill({ json: data }).catch(() => {}); };
      await page.route('https://api.appliancepartgeeks.com/**', async route => {
        const url = route.request().url();
        if (url.includes('/compare/new-market/')) assert.equal(new URL(url).searchParams.get('background'), 'true');
        let data = {};
        if (url.includes('/compare/new-market/')) {
          if (phase === 'initial' && firstRosterReleased && test.scenario === 'source failure') { await route.fulfill({ status: 503, json: {} }); return; }
          data = phase === 'initial' ? searching : phase === 'refresh' ? { ...searching, status: 'refreshing', offers: finished.offers, seller_dispositions: finished.seller_dispositions } : finished;
          if (phase === 'initial' || phase.startsWith('refresh')) {
            held.push({ route, data: phase === 'initial' && firstRosterReleased && test.scenario !== 'deadline' ? finished : data }); return;
          }
        } else if (url.includes('/refurb/')) {
          data = used;
          if (phase === 'initial' || phase.startsWith('refresh')) { held.push({ route, data }); return; }
        } else if (url.includes('/live-part-search/')) {
          data = catalog;
          if (phase === 'initial' || phase.startsWith('refresh')) { held.push({ route, data }); return; }
        } else if (url.includes('/parts-agent/')) data = { allowed_to_answer: true, result: { live: catalog } };
        else if (url.includes('/market-sellers/metadata') && test.scenario === 'fast' && phase === 'initial') { delayedMetadata.push(route); return; }
        else if (url.includes('/market-sellers/metadata') && test.scenario === 'partial failure') { await route.fulfill({ status: 503, json: {} }); return; }
        await route.fulfill({ json: data });
      });
      await page.goto(base + test.route, { waitUntil: 'domcontentloaded', timeout: 120000 });
      const status = page.locator('.market-check-status'), timer = page.locator('.market-check-elapsed');
      await status.waitFor();
      await waitUntil(() => page.evaluate(() => window.__marketTimers?.size === 1));
      assert((await status.innerText()).includes('Checking sellers…'));
      assert.equal(await timer.innerText(), '0.0s');
      assert.equal((await page.locator('.market-check-progress').innerText()).trim(), 'Starting seller checks…');
      assert.equal(await timer.getAttribute('aria-hidden'), 'true');
      assert.equal(await page.locator('.market-check-message').getAttribute('aria-live'), 'polite');
      assert.equal(await status.evaluate(e => !!e.closest('.sherpa-market-banner')), true);
      assert.equal(await status.evaluate(e => getComputedStyle(e).fontSize), '12px');
      assert.equal(await page.locator('.market-check-pulse').evaluate(e => getComputedStyle(e).animationName), 'none');
      const bounds = async () => page.locator('aside[aria-label="Compare Seller Options"]').evaluate(e => {
        const r = e.getBoundingClientRect(); return { height: r.height, width: r.width, statusHeight: e.querySelector('.market-check-status').getBoundingClientRect().height };
      });
      const initialBounds = await bounds();
      await page.clock.runFor(200);
      await waitUntil(async () => await timer.innerText() === '0.2s');
      await page.clock.runFor(200);
      await waitUntil(async () => await timer.innerText() === "0.4s");
      await page.clock.runFor(600);
      await waitUntil(async () => await timer.innerText() === '1.0s');
      assert.equal(await timer.innerText(), '1.0s');
      assert.equal(await page.evaluate(() => window.__marketTimers.size), 1);
      // Release only the new-market roster. A completed seller is useful while
      // both other requests remain pending, and selected unfinished rows stay neutral.
      const firstRequests = held.filter(item => item.route.request().url().includes('/compare/new-market/'));
      assert(firstRequests.length > 0);
      for (const item of firstRequests) {
        held.splice(held.indexOf(item), 1);
        await item.route.fulfill({ json: item.data }).catch(() => {});
      }
      firstRosterReleased = true;
      await waitUntil(async () => await page.locator('[data-seller-key]').count() === 3);
      assert.equal(await page.locator('[data-seller-key="newa"]').getAttribute('data-availability'), 'stock');
      assert.equal(await page.locator('[data-seller-key="newb"]').getAttribute('data-availability'), 'checking');
      assert.equal(await page.locator('[data-seller-key="newc"] .seller-availability').innerText(), 'Checking…');
      assert.equal(await page.locator('[data-availability="unavailable"]').count(), 0);
      assert.equal(await page.locator('.market-check-progress').innerText(), '1 of 3 sellers checked · waiting for seller lists');
      assert.deepEqual(await bounds(), initialBounds);
      await page.clock.runFor(test.scenario === 'fast' ? 1500 : 4500);
      if (test.scenario === 'source failure') {
        await waitUntil(async () => await page.locator('[data-seller-key="newb"]').getAttribute('data-availability') === 'inconclusive');
        assert((await status.innerText()).includes('Checking sellers…'));
      }
      if (test.scenario === 'deadline') {
        await page.clock.fastForward(90000);
      } else {
        phase = 'complete';
        await release();
      }
      const refresh = page.locator('.sherpa-market-banner').getByRole('button', { name: 'Refresh', exact: true });
      await refresh.waitFor();
      assert.equal(await timer.count(), 0); assert.equal(await page.locator('.market-check-pulse').count(), 0);
      assert(!(await status.innerText()).includes('Checking sellers…'));
      assert((await status.innerText()).includes('in stock'));
      assert.equal(await page.locator('[data-availability="checking"]').count(), 0);
      if (test.scenario === 'deadline') {
        for (const item of held.splice(0)) await item.route.abort().catch(() => {});
        assert.equal(await page.locator('[data-seller-key="newb"]').getAttribute('data-availability'), 'inconclusive');
        assert.equal(await page.locator('[data-seller-key="newc"]').getAttribute('data-availability'), 'inconclusive');
      }
      if (test.scenario === 'partial failure') {
        assert.equal(await page.locator('[data-seller-key="newc"]').getAttribute('data-availability'), 'inconclusive');
        assert((await status.innerText()).includes('Some checks could not be completed.'));
      }
      assert.deepEqual(await bounds(), initialBounds);
      if (test.scenario === 'fast') {
        assert(delayedMetadata.length > 0);
        for (const route of delayedMetadata) await route.fulfill({ json: { NewA: { display_name: 'New A', return_policy: { days: 30 } } } }).catch(() => {});
        await waitUntil(async () => (await page.locator('[data-seller-key="newa"] .attempted-terms').innerText()).includes('Returns 30 days'));
      }
      const finalText = await status.innerText();
      await page.clock.runFor(3000);
      assert.equal(await status.innerText(), finalText);
      assert.equal(await page.evaluate(() => window.__marketTimers.size), 0);
      // Refresh must keep rows/prices, reset time immediately and create one timer.
      const rows = await page.locator('[data-seller-key]').count();
      phase = 'refresh';
      await refresh.click();
      await waitUntil(() => page.evaluate(() => window.__marketTimers?.size === 1));
      assert.equal(await timer.innerText(), '0.0s');
      assert.equal(await page.locator('[data-seller-key]').count(), rows);
      assert.equal(await page.locator('[data-seller-key="newa"] .attempted-price').innerText(), '$100.00');
      await page.clock.runFor(400);
      await waitUntil(async () => await timer.innerText() === "0.4s");
      await page.clock.runFor(600);
      await waitUntil(async () => await timer.innerText() === '1.0s');
      assert.equal(await timer.innerText(), '1.0s');
      assert.equal(await page.evaluate(() => window.__marketTimers.size), 1);
      // Replace one source with a pending roster; preserve its previous price.
      const fresh = held.findIndex(x => x.route.request().url().includes('/compare/new-market/'));
      assert(fresh >= 0);
      const [replacement] = held.splice(fresh, 1);
      await replacement.route.fulfill({ json: replacement.data });
      await waitUntil(async () => await page.locator('[data-seller-key="newb"]').getAttribute('data-availability') === 'checking');
      assert((await page.locator('[data-seller-key="newb"] .attempted-footer').innerText()).includes('Previous result'));
      phase = 'refresh-pending';
      if (test.scenario === 'slow') {
        const usedIndex = held.findIndex(item => item.route.request().url().includes('/refurb/'));
        assert(usedIndex >= 0);
        const [pendingUsed] = held.splice(usedIndex, 1);
        await pendingUsed.route.fulfill({ json: { used_seller_comparison: { status: 'searching', seller_statuses: [] }, used_seller_competitors: [] } });
        await waitUntil(async () => await page.locator('[data-seller-key="useda"]').getAttribute('data-availability') === 'checking');
        assert.equal(await page.locator('[data-seller-key="useda"] .attempted-price').innerText(), '$100.00');
      }
      assert.equal(await page.locator('[data-seller-key="newa"] .attempted-price').innerText(), '$100.00');
      await page.clock.runFor(1500);
      phase = 'complete'; await release();
      await refresh.waitFor();
      assert.equal(await timer.count(), 0);
      assert.equal(await page.evaluate(() => window.__marketTimers.size), 0);
      assert.equal(await page.evaluate(() => window.__marketTimerMax), 1);
      assert.equal(await page.evaluate(() => window.__marketVisibilityMax), 1);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      // The next refresh restores the subtle animation in normal motion mode.
      phase = "refresh"; await refresh.click();
      assert.equal(await page.locator(".market-check-pulse").evaluate(e => getComputedStyle(e).animationName), "market-check-pulse");
      await waitUntil(() => page.evaluate(() => window.__marketTimers?.size === 1));
      phase = "complete"; await release();
      await page.clock.runFor(1500); await release(); await refresh.waitFor();
      assert.equal(await page.evaluate(() => window.__marketTimers.size), 0);
      assert.equal(await page.evaluate(() => window.__marketTimerMax), 1);
      assert.equal(await page.evaluate(() => window.__marketVisibilityMax), 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.deepEqual(await bounds(), initialBounds);
      results.push({ ...test, immediateStatus: true, progressiveRows: true, neutralPending: true, stops: true, refreshPreservesRows: true, oneTimer: true, noDuplicateListeners: true, stableLayout: true, noOverflow: true, reducedMotion: true });
      console.log(`${test.route} ${test.width} ${test.scenario}: passed`);
      await context.close();
    }
    if (process.env.RESULTS_FILE) fs.writeFileSync(process.env.RESULTS_FILE, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
