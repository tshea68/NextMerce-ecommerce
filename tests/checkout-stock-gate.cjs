// Inert Stripe/fetch sinks exercise the actual Next.js route after transpilation.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../app/api/checkout/session-cart/route.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
}, reportDiagnostics: true });
assert.equal(compiled.diagnostics.length, 0);

async function run(proof, { status = 200, failure = false, refurb = false, mixed = false } = {}) {
  let creates = 0, checks = 0;
  const stripe = function () { this.checkout = { sessions: { create: async () => {
    creates++; return { id: 'cs_inert', client_secret: 'inert' };
  } } }; };
  const context = { exports: {}, process: { env: { STRIPE_SECRET_KEY: 'sk_test_inert' } },
    URL, AbortSignal,
    require: (name) => name === 'stripe' ? stripe : { NextResponse: {
      json: (body, options = {}) => ({ body, status: options.status || 200 }),
    } },
    fetch: async (_url, options) => {
      checks++;
      assert.equal(creates, 0);
      assert.equal(options.cache, 'no-store');
      const payload = JSON.parse(options.body);
      assert.equal(payload.items[0].price, 287.58);
      assert.equal(payload.items.length, mixed ? 2 : 1);
      if (failure) throw new Error('Timeout');
      return { ok: status === 200, status, json: async () => proof };
    },
  };
  vm.runInNewContext(compiled.outputText, context);
  const result = await context.exports.POST({ nextUrl: { origin: 'https://example.invalid' },
    json: async () => ({ items: [{ mpn: 'WPW10207861', quantity: 1, price: 287.58, is_refurb: refurb },
      ...(mixed ? [{ mpn: 'USED', quantity: 1, price: 10, is_refurb: true }] : [])],
      ship_to: { country: 'US', state: 'NM', postal: '87508' } }),
  });
  return { result, creates, checks };
}

(async () => {
  for (const cart of [{refurb:false},{refurb:true},{mixed:true}]) for (const [proof, options] of [
    [{ detail: 'No stock' }, { status: 409 }],
    [null, { status: 502 }], [{ verified: false }, {}],
    [null, { failure: true }], [{ verified: true }, { status: 503 }],
    [{ verified: true }, {}],
  ]) {
    const { result, creates, checks } = await run(proof, { ...options, ...cart });
    assert.equal(creates, 0);
    assert.equal(checks, 1);
    assert.ok([409, 503].includes(result.status));
  }
  const good = await run({ verified: true, stock_verification: 'all_conditions_v1' });
  assert.equal(good.creates, 1); assert.equal(good.checks, 1); assert.equal(good.result.status, 200);
  const used = await run({ verified: true, stock_verification: 'all_conditions_v1' }, { refurb: true });
  assert.equal(used.checks, 1); assert.equal(used.creates, 1);
  const mixed = await run({ verified: true, stock_verification: 'all_conditions_v1' }, { mixed: true });
  assert.equal(mixed.checks, 1); assert.equal(mixed.creates, 1);
  console.log('21 checkout stock gate cases passed; no live payment calls');
})().catch(error => { console.error(error); process.exitCode = 1; });

