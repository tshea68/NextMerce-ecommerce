type SellerFields = {
  relationship?: string | null;
  price?: number | null;
  currency?: string | null;
  shipping_cost?: number | null;
  product_url?: string | null;
  url?: string | null;
  destination_url?: string | null;
  source_url?: string | null;
};

export function normalizeRelationship(value: string | null | undefined) {
  const relationship = (value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  switch (relationship) {
    case "exact": case "exact_match": return "exact";
    case "replacement": case "replacement_match": return "replacement";
    case "alternate": case "alternate_match": return "alternate";
    case "related": case "related_match": return "related";
    default: return "fallback";
  }
}

export function amount(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

export function delivered(row: SellerFields) {
  const price = amount(row.price), shipping = amount(row.shipping_cost);
  return price !== null && shipping !== null ? price + shipping : null;
}

function rank(row: SellerFields) {
  const relationship = normalizeRelationship(row.relationship);
  return relationship === "exact" ? 0 : relationship === "replacement" ? 1 : 2;
}

export function compareSellers(a: SellerFields, b: SellerFields) {
  return rank(a) - rank(b)
    || (a.currency || "USD").localeCompare(b.currency || "USD")
    || Number(delivered(a) === null) - Number(delivered(b) === null)
    || (delivered(a) ?? amount(a.price) ?? Infinity) - (delivered(b) ?? amount(b.price) ?? Infinity);
}

export function sellerHref(row: SellerFields) {
  // Prefer seller destinations; retain source_url for existing cached results.
  for (const value of [row.product_url, row.url, row.destination_url, row.source_url]) {
    if (typeof value !== "string") continue;
    const url = value.trim();
    if (!url || /[\u0000-\u001f\u007f\\]/.test(url)) continue;
    if (/^\/(?!\/)/.test(url)) return url;
    if (!/^https?:\/\//i.test(url)) continue;
    try {
      const parsed = new URL(url);
      if (parsed.hostname) return url;
    } catch { /* Try the next supplied URL field. */ }
  }
  return null;
}
