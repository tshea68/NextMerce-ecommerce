import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { purchaseFromStripe, emitPurchaseOnce } from '../lib/purchase.ts';

const session = (overrides = {}) => ({
  payment_status: 'paid', payment_intent: { id: 'pi_test123', status: 'succeeded' },
  status: 'complete', currency: 'usd', amount_total: 2995,
  total_details: { amount_tax: 200, amount_shipping: 995 }, ...overrides,
});
const lines = (overrides = {}) => [{
  id: 'li_test', currency: 'usd', quantity: 2, description: 'Drain pump',
  amount_subtotal: 2000, amount_discount: 200, amount_total: 2000, amount_tax: 200,
  price: { product: { id: 'prod_test', name: 'Drain pump', metadata: { mpn: 'WP123' } } },
  ...overrides,
}];

test('real products, discounted merchandise, separate tax/shipping and stable PI', () => {
  assert.deepEqual(purchaseFromStripe(session(), lines()), {
    transaction_id: 'pi_test123', value: 18, currency: 'USD', tax: 2, shipping: 9.95,
    items: [{ item_id: 'WP123', item_name: 'Drain pump', price: 9, quantity: 2 }],
  });
  assert.equal(purchaseFromStripe(session({ payment_intent: 'pi_test123' }), lines()).transaction_id, 'pi_test123');
});

test('complete, redirect success, processing, failed and uncaptured are not payment confirmation', () => {
  for (const status of ['processing', 'requires_capture', 'requires_payment_method', 'canceled']) {
    assert.equal(purchaseFromStripe(session({ payment_status: 'unpaid',
      redirect_status: 'succeeded', payment_intent: { id: 'pi_test123', status } }), lines()), null);
  }
});

test('succeeded PaymentIntent is authoritative; no order-row or URL ID fallback', () => {
  assert.ok(purchaseFromStripe(session({ payment_status: 'unpaid' }), lines()));
  for (const payment_intent of [null, '', 'cs_test', 'pi_test_secret_sensitive']) {
    assert.equal(purchaseFromStripe(session({ payment_intent, id: 'order123' }), lines()), null);
  }
});

test('reject incomplete line lists, unknown currency/totals and invalid quantities', () => {
  assert.equal(purchaseFromStripe(session(), []), null);
  for (const override of [{ currency: 'jpy' }, { amount_total: null },
    { total_details: null }, { amount_total: 3995 }]) {
    assert.equal(purchaseFromStripe(session(override), lines()), null);
  }
  for (const override of [{ quantity: 0 }, { amount_total: NaN }, { amount_tax: 3000 }, { currency: 'eur' }]) {
    assert.equal(purchaseFromStripe(session(), lines(override)), null);
  }
});

test('tax-inclusive and exclusive totals normalize identically; product ID is a real fallback', () => {
  const result = purchaseFromStripe(session(), lines({ amount_subtotal: 2200,
    price: { product: 'prod_fallback' } }));
  assert.equal(result.value, 18);
  assert.equal(result.items[0].item_id, 'prod_fallback');
});

function storage() {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
}
function browser(localStorage = storage()) {
  return { localStorage, dataLayer: [], navigator: {},
    gtag: () => assert.fail('must not call gtag'),
    oaiq: () => assert.fail('must not call OpenAI directly') };
}

test('refresh/remount/back-forward and changing order rows emit once, distinct PI emits again', async () => {
  const old = globalThis.window;
  try {
    const persisted = storage();
    const purchase = purchaseFromStripe(session(), lines());
    globalThis.window = browser(persisted);
    await emitPurchaseOnce(purchase);
    await emitPurchaseOnce(purchase);
    assert.deepEqual(window.dataLayer, [{ event: 'purchase', ...purchase }]);
    globalThis.window = browser(persisted); // A new document, same persistent storage.
    await emitPurchaseOnce(purchaseFromStripe(session({ order_id: 999 }), lines()));
    assert.equal(window.dataLayer.length, 0);
    await emitPurchaseOnce({ ...purchase, transaction_id: 'pi_second' });
    assert.equal(window.dataLayer.length, 1);
  } finally { globalThis.window = old; }
});

test('concurrent emitters serialize via browser lock', async () => {
  const old = globalThis.window;
  try {
    globalThis.window = browser();
    let queue = Promise.resolve();
    let locks = 0;
    window.navigator.locks = { request: (_key, callback) => {
      locks++;
      queue = queue.then(callback);
      return queue;
    } };
    const purchase = purchaseFromStripe(session(), lines());
    await Promise.all([emitPurchaseOnce(purchase), emitPurchaseOnce(purchase)]);
    assert.equal(locks, 2);
    assert.equal(window.dataLayer.length, 1);
  } finally { globalThis.window = old; }
});

test('blocked/quota-exhausted storage fails closed without emitting', async () => {
  const old = globalThis.window;
  try {
    for (const failAt of ['getItem', 'setItem']) {
      const persisted = storage();
      persisted[failAt] = () => { throw new Error('blocked'); };
      globalThis.window = browser(persisted);
      await emitPurchaseOnce(purchaseFromStripe(session(), lines()));
      assert.equal(window.dataLayer.length, 0);
    }
  } finally { globalThis.window = old; }
});

test('synchronous queue failure permits a subsequent retry', async () => {
  const old = globalThis.window;
  try {
    globalThis.window = browser();
    window.dataLayer = { push: () => { throw new Error('queue unavailable'); } };
    const purchase = purchaseFromStripe(session(), lines());
    await emitPurchaseOnce(purchase);
    window.dataLayer = [];
    await emitPurchaseOnce(purchase);
    assert.equal(window.dataLayer.length, 1);
  } finally { globalThis.window = old; }
});

test('diagnostics are development-only and contain no transaction or customer data', async () => {
  const oldWindow = globalThis.window;
  const oldEnvironment = process.env.NODE_ENV;
  const oldDebug = console.debug;
  const messages = [];
  console.debug = (...args) => messages.push(args);
  try {
    process.env.NODE_ENV = 'production';
    globalThis.window = browser();
    const purchase = purchaseFromStripe(session(), lines());
    await emitPurchaseOnce(purchase);
    await emitPurchaseOnce(purchase);
    assert.deepEqual(messages, []);
    process.env.NODE_ENV = 'development';
    globalThis.window = browser();
    await emitPurchaseOnce(purchase);
    await emitPurchaseOnce(purchase);
    assert.deepEqual(messages, [
      ['[purchase] purchase event emitted'],
      ['[purchase] duplicate purchase suppressed'],
    ]);
  } finally {
    globalThis.window = oldWindow;
    console.debug = oldDebug;
    if (oldEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = oldEnvironment;
  }
});

// Exercise the real route with a read-only Stripe stub, without contacting Stripe.
function statusRoute({ verified = session(), batches = [lines()], failLines = false } = {}) {
  const source = readFileSync(new URL('../app/api/checkout/session/status/route.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const calls = [];
  const exports = {};
  class Stripe {
    checkout = { sessions: {
      retrieve: async (id) => { calls.push(['retrieve', id]); return { id, ...verified }; },
      list: async (params) => { calls.push(['list', params]); return { data: [{ id: 'cs_legacy' }] }; },
      listLineItems: async function* () {
        calls.push(['lines']);
        if (failLines) throw new Error('unavailable');
        for (const batch of batches) yield* batch;
      },
    } };
  }
  const require = (name) => {
    if (name === 'stripe') return Stripe;
    if (name === '@/lib/purchase') return { purchaseFromStripe };
    if (name === 'next/server') return { NextResponse: {
      json: (body, options = {}) => ({ body, status: options.status ?? 200 }),
    } };
    throw new Error(`Unexpected dependency: ${name}`);
  };
  new Function('require', 'exports', compiled)(require, exports);
  return { get: (query) => exports.GET({ nextUrl: new URL(`https://example.test/api/status?${query}`) }), calls };
}

test('status route returns verified tracking payload and consumes all line-item pages', async () => {
  const old = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = 'test-only-not-a-real-key';
  try {
    const route = statusRoute({ verified: session({ amount_total: 4995,
      total_details: { amount_tax: 400, amount_shipping: 995 } }),
      batches: [lines(), lines({ id: 'li_second' })] });
    const response = await route.get('sid=cs_test');
    assert.equal(response.status, 200);
    assert.equal(response.body.purchase.items.length, 2);
    assert.equal(response.body.purchase.value, 36);
    assert.equal(response.body.purchase.transaction_id, 'pi_test123');
  } finally {
    if (old === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = old;
  }
});

test('tracking enrichment failure preserves status; unpaid never produces purchase', async () => {
  const old = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = 'test-only-not-a-real-key';
  try {
    const failed = await statusRoute({ failLines: true }).get('sid=cs_test');
    assert.equal(failed.status, 200);
    assert.equal(failed.body.payment_status, 'paid');
    assert.equal(failed.body.purchase, null);
    const unpaid = statusRoute({ verified: session({ payment_status: 'unpaid',
      payment_intent: { id: 'pi_test123', status: 'processing' } }) });
    assert.equal((await unpaid.get('sid=cs_test')).body.purchase, null);
    assert.deepEqual(unpaid.calls, [['retrieve', 'cs_test']]);
    const legacy = statusRoute();
    assert.equal((await legacy.get('pi=pi_test123')).body.purchase.transaction_id, 'pi_test123');
    assert.deepEqual(legacy.calls[0], ['list', { payment_intent: 'pi_test123', limit: 1 }]);
  } finally {
    if (old === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = old;
  }
});
