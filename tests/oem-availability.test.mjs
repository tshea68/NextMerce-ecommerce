import assert from 'node:assert/strict';
import { test } from 'node:test';
import { oemAvailability } from '../lib/oem-availability.ts';
test('explicit stock state wins over rank; missing and unknown states are conservative', () => {
  for (const status of ['in stock', 'in_stock', 'In Stock', 'available']) assert.equal(oemAvailability(status, 1), 'in_stock');
  for (const status of ['special order','backorder','pre-order']) assert.equal(oemAvailability(status, 1), 'special_order');
  for (const status of ['out of stock','discontinued','unavailable','unknown']) assert.equal(oemAvailability(status, 1), 'out_of_stock');
  assert.equal(oemAvailability(null, 1), 'in_stock');
  assert.equal(oemAvailability(null, 2), 'special_order');
  assert.equal(oemAvailability(null, null), 'out_of_stock');
});
