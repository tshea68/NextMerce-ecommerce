import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareSellers, delivered, normalizeRelationship, sellerHref } from '../components/product/seller-comparison.ts';

test('seller CTA supports live url and preserves cached product_url precedence', () => {
  assert.equal(sellerHref({ url: 'https://seller.example/live' }), 'https://seller.example/live');
  assert.equal(sellerHref({ product_url: 'https://seller.example/product', url: 'https://seller.example/live' }), 'https://seller.example/product');
  assert.equal(sellerHref({ destination_url: 'https://seller.example/destination' }), 'https://seller.example/destination');
  assert.equal(sellerHref({ source_url: 'https://seller.example/source' }), 'https://seller.example/source');
  assert.equal(sellerHref({ url: '/offers/example' }), '/offers/example');
});

test('seller CTA uses the first valid supplied destination and never invents links', () => {
  assert.equal(sellerHref({ product_url: 'javascript:alert(1)', url: 'https://seller.example/live', destination_url: 'https://seller.example/other' }), 'https://seller.example/live');
  for (const url of ['javascript:alert(1)', 'data:text/html,test', '//evil.example', '/\\evil.example', 'https://', 'https://seller.example/\npath']) {
    assert.equal(sellerHref({ url }), null, url);
  }
  assert.equal(sellerHref({}), null);
});

test('relationship normalization supports live and existing cached variants', () => {
  for (const value of ['exact', 'exact_match', ' EXACT ', 'exact-match']) assert.equal(normalizeRelationship(value), 'exact');
  for (const value of ['replacement', 'replacement_match']) assert.equal(normalizeRelationship(value), 'replacement');
  for (const value of ['alternate', 'alternate_match']) assert.equal(normalizeRelationship(value), 'alternate');
  assert.equal(normalizeRelationship('related'), 'related');
  assert.equal(normalizeRelationship(undefined), 'fallback');
});

const row = (id, relationship, price, shipping_cost) => ({ id, relationship, price, shipping_cost, currency: 'USD' });
const sorted = rows => rows.sort(compareSellers).map(r => r.id);

test('live exact and cached exact_match sort before cheaper replacements, alternates, related and fallback rows', () => {
  assert.deepEqual(sorted([
    row('replacement', 'replacement', 1, 0), row('alternate', 'alternate', 2, 0),
    row('related', 'related', 3, 0), row('fallback', 'other', 4, 0),
    row('cached-exact', 'exact_match', 300, 0), row('live-exact', 'exact', 200, 0),
  ]), ['live-exact', 'cached-exact', 'replacement', 'alternate', 'related', 'fallback']);
});

test('known totals sort by delivered cost rather than sticker price within match priority', () => {
  assert.deepEqual(sorted([
    row('low-sticker', 'exact', 10, 100), row('free-shipping', 'exact_match', 40, 0),
    row('lowest-total', 'exact', 20, 5),
  ]), ['lowest-total', 'free-shipping', 'low-sticker']);
});

test('unknown shipping stays separate, sorted by price, without fabricated delivered totals', () => {
  const unknown = row('unknown-low', 'exact', 1, undefined);
  assert.equal(delivered(unknown), null);
  assert.equal(delivered(row('null', 'exact', 1, null)), null);
  assert.equal(delivered(row('negative', 'exact', 1, -1)), null);
  assert.equal(delivered(row('nan', 'exact', 1, NaN)), null);
  assert.equal(delivered(row('free', 'exact', 1, 0)), 1);
  assert.deepEqual(sorted([row('unknown-high', 'exact', 2, null), unknown, row('known', 'exact', 100, 10)]), ['known', 'unknown-low', 'unknown-high']);
  assert.deepEqual(sorted([row('replacement-known', 'replacement', 1, 0), unknown]), ['unknown-low', 'replacement-known']);
});
