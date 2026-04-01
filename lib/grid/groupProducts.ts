function normMpn(s: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function groupItemsToCanonicalProducts(items: any[]) {
  if (!Array.isArray(items)) return items;

  const map = new Map<string, any[]>();

  for (const item of items) {
    const key = item?.mpn_norm || normMpn(item?.mpn || "");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }

  return Array.from(map.values()).map((rows) => {
    const part = rows.find((r) => r.source === "parts");
    const offer = rows.find((r) => r.source === "offers");

    const base = part || offer || rows[0];

    return {
      ...base,

      compatible_brands:
        part?.compatible_brands ??
        base?.compatible_brands ??
        offer?.compatible_brands ??
        null,

      compatible_models:
        part?.compatible_models ??
        base?.compatible_models ??
        offer?.compatible_models ??
        null,

      replaced_by:
        part?.replaced_by ?? base?.replaced_by ?? null,

      replaces_previous_parts:
        part?.replaces_previous_parts ??
        base?.replaces_previous_parts ??
        null,

      refurb_count: base?.refurb_count ?? 0,
      best_refurb_price: base?.best_refurb_price ?? null,
      has_new_part: base?.has_new_part ?? false,
      new_part_price: base?.new_part_price ?? null,
    };
  });
}