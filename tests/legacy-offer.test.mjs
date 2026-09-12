import assert from 'node:assert/strict';
import { test } from 'node:test';
import { listingIdFromToken, resolveLegacyOffer } from '../lib/legacy-offer.ts';

function database({ offers = [], parts = [], listings = [], error = false } = {}) {
  return { from(table) {
    let column;
    return { select() { return this; }, eq(name) { column = name; return this; },
      async limit() {
        return { error: error ? { message: 'unavailable' } : null,
          data: column === 'listing_id' ? listings : table === 'parts' ? parts : offers };
      } };
  } };
}
const listing = (mpn) => ({ mpn, mpn_norm: mpn, listing_id: '233520' });

test('accepts short IDs and legacy tokens, rejects malformed tokens', () => {
  assert.equal(listingIdFromToken('233520'), '233520');
  assert.equal(listingIdFromToken('v1%7C233520%7C0'), '233520');
  for (const token of ['x|233520|0', 'v1|abc|233520', 'v1|233520|0|extra', '1e5'])
    assert.equal(listingIdFromToken(token), null);
});
test('known historical listing resolves with offer preserved', async () => {
  assert.equal(await resolveLegacyOffer('233520', '', database({ listings: [listing('z01001kb')] })), '/offers/z01001kb?offer=233520');
  assert.equal(await resolveLegacyOffer('Z01001KB', 'v1|233520|0', database({ offers: [{}], listings: [listing('z01001kb')] })), '/offers/z01001kb?offer=233520');
});
for (const slug of ['10030','144001','205609','207362','209998','59422']) {
  test(`numeric MPN ${slug} takes precedence over a different listing`, async () => {
    const db = database({ offers: [{}], listings: [listing('different')] });
    assert.equal(await resolveLegacyOffer(slug, '', db), `/offers/${slug}`);
    assert.equal(await resolveLegacyOffer(slug, `v1|${slug}|0`, db), `/offers/${slug}`);
  });
}
test('OEM numeric MPN is also protected', async () => {
  assert.equal(await resolveLegacyOffer('100656', '', database({ parts: [{}], listings: [listing('different')] })), null);
});
test('absent, ambiguous, failed, and mismatched mappings fail safely', async () => {
  for (const db of [database(), database({ listings: [listing('a'), listing('b')] }), database({ error: true }), null])
    assert.equal(await resolveLegacyOffer('233520', '', db), null);
  assert.equal(await resolveLegacyOffer('another-mpn', '233520', database({ listings: [listing('z01001kb')] })), null);
});

if (process.env.APG_LIVE_READ_TEST === '1') {
  test('production mappings: historical example and all six numeric collisions', async () => {
    assert.equal(await resolveLegacyOffer('233520'), '/offers/z01001kb?offer=233520');
    for (const slug of ['10030','144001','205609','207362','209998','59422']) {
      assert.equal(await resolveLegacyOffer(slug), `/offers/${slug}`);
      assert.equal(await resolveLegacyOffer(slug, `v1|${slug}|0`), `/offers/${slug}`);
    }
  });
}
