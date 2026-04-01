function isPartInStock(stock_status_canon: any, availability_rank: any) {
  const r = Number(availability_rank);
  if (Number.isFinite(r)) return r === 1 || r === 2;

  const s = String(stock_status_canon ?? "").toLowerCase();
  return s.includes("stock") || s.includes("available");
}

export async function enrichComparisonCounts(supabase: any, items: any[]) {
  if (!Array.isArray(items) || items.length === 0) return items;

  const mpns = Array.from(
    new Set(items.map((i) => String(i?.mpn ?? "").trim()).filter(Boolean))
  );

  if (!mpns.length) return items;

  const [offersRes, partsRes] = await Promise.all([
    supabase
      .from("offers")
      .select("mpn, price, inventory_total")
      .in("mpn", mpns),

    supabase
      .from("parts")
      .select("mpn, price, availability_rank, stock_status_canon")
      .in("mpn", mpns),
  ]);

  const offers = offersRes?.data || [];
  const parts = partsRes?.data || [];

  const refurbMap = new Map<string, any[]>();
  for (const o of offers) {
    const mpn = String(o.mpn || "").trim();
    if (!mpn) continue;
    if (!refurbMap.has(mpn)) refurbMap.set(mpn, []);
    refurbMap.get(mpn)!.push(o);
  }

  const partMap = new Map<string, any[]>();
  for (const p of parts) {
    const mpn = String(p.mpn || "").trim();
    if (!mpn) continue;
    if (!partMap.has(mpn)) partMap.set(mpn, []);
    partMap.get(mpn)!.push(p);
  }

  return items.map((item) => {
    const mpn = String(item?.mpn || "").trim();

    const refurb = refurbMap.get(mpn) || [];
    const part = partMap.get(mpn) || [];

    const validRefurb = refurb.filter(
      (r) => Number(r.price) > 0 && Number(r.inventory_total) > 0
    );

    const validParts = part.filter(
      (p) =>
        Number(p.price) > 0 &&
        isPartInStock(p.stock_status_canon, p.availability_rank)
    );

    return {
      ...item,
      refurb_count: validRefurb.length,
      best_refurb_price:
        validRefurb.length > 0
          ? Math.min(...validRefurb.map((r) => Number(r.price)))
          : null,
      has_new_part: validParts.length > 0,
      new_part_price:
        validParts.length > 0
          ? Math.min(...validParts.map((p) => Number(p.price)))
          : null,
    };
  });
}