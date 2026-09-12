import { test } from 'node:test';
import assert from 'node:assert/strict';
import bindings from '../lib/shopping-verified-images.json' with { type: 'json' };
import { shoppingOfferImage } from '../lib/shopping-offer-image.ts';
test('verified image bindings require exact listing, MPN and unchanged source URL', () => {
  for (const b of bindings) {
    const row = {listing_id:b.listing_id,mpn:b.mpn_norm,image_url:b.original_url};
    assert.equal(shoppingOfferImage(row),b.image_url);
    for (const key of ['listing_id','mpn','image_url']) {
      const changed = {...row,[key]:'changed'};
      assert.equal(shoppingOfferImage(changed),changed.image_url);
    }
  }
});
