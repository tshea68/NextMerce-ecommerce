import bindings from "./shopping-verified-images.json" with { type: "json" };

// The binding includes the original URL so later supplier image changes win.
// Only these five validated offers use their existing APG-hosted image copies.
export function shoppingOfferImage(row: {
  listing_id?: unknown;
  mpn?: unknown;
  image_url?: unknown;
}): string | null {
  const original = typeof row.image_url === "string" ? row.image_url.trim() : null;
  const mpn = String(row.mpn ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const binding = bindings.find((entry) =>
    entry.listing_id === String(row.listing_id ?? "") &&
    entry.mpn_norm === mpn && entry.original_url === original
  );
  return binding?.image_url ?? original;
}
