function tryJson(v: any) {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (!s) return v;
  if (!(s.startsWith("{") || s.startsWith("["))) return v;
  try {
    return JSON.parse(s);
  } catch {
    return v;
  }
}

function stringVal(v: any) {
  return String(v ?? "").trim();
}

function isSubLikeUrl(v: any) {
  const s = String(v ?? "").toLowerCase();
  return s.includes("/sub-");
}

function scorePartRowForDisplay(row: any) {
  let score = 0;

  if (stringVal(row?.title_display)) score += 100;
  if (stringVal(row?.feed_title)) score += 60;
  if (stringVal(row?.specific_part_type)) score += 20;
  if (stringVal(row?.canonical_part_type)) score += 10;
  if (stringVal(row?.appliance_type)) score += 10;
  if (stringVal(row?.compatible_brands)) score += 5;
  if (row?.compatible_models != null) score += 5;
  if (stringVal(row?.replaced_by)) score += 5;

  const replaces = tryJson(row?.replaces_previous_parts);
  if (Array.isArray(replaces) && replaces.length > 0) score += 5;

  if (!isSubLikeUrl(row?.reliable_part_url)) score += 40;
  if (row?.image_url) score += 5;

  score += Number(row?.id ?? 0) / 1_000_000_000;

  return score;
}

function scoreOfferRowForDisplay(row: any) {
  let score = 0;

  if (stringVal(row?.title_display)) score += 100;
  if (stringVal(row?.feed_title)) score += 60;
  if (stringVal(row?.compatible_brands)) score += 10;
  if (row?.compatible_models != null) score += 10;
  if (row?.image_url) score += 5;
  if (Number(row?.inventory_total ?? 0) > 0) score += 5;

  score += Number(row?.id ?? 0) / 1_000_000_000;

  return score;
}

function bestRowsByMpn(rows: any[], scorer: (row: any) => number) {
  const out = new Map<string, any>();

  for (const row of rows || []) {
    const mpn = stringVal(row?.mpn);
    if (!mpn) continue;

    const prev = out.get(mpn);
    if (!prev || scorer(row) > scorer(prev)) {
      out.set(mpn, row);
    }
  }

  return out;
}

export async function enrichProductItemsFromTables(supabase: any, items: any[]) {
  if (!Array.isArray(items) || items.length === 0) return items;

  const mpns = Array.from(
    new Set(items.map((it) => stringVal(it?.mpn)).filter(Boolean))
  );

  if (!mpns.length) return items;

  const partsSelect = `
    id, mpn, title, title_display, feed_title, brand,
    part_type, canonical_part_type, specific_part_type,
    appliance_type, stock_status_canon, availability_rank,
    compatible_brands, compatible_models,
    replaced_by, replaces_previous_parts,
    image_url, reliable_part_url
  `;

  const offersSelect = `
    id, mpn, title, title_display, feed_title,
    brand, part_type, canonical_part_type,
    appliance_type, compatible_brands,
    compatible_models, image_url, inventory_total
  `;

  const [partsRes, offersRes] = await Promise.all([
    supabase.from("parts").select(partsSelect).in("mpn", mpns),
    supabase.from("offers").select(offersSelect).in("mpn", mpns),
  ]);

  const partsRows = partsRes?.data || [];
  const offersRows = offersRes?.data || [];

  const bestPartByMpn = bestRowsByMpn(partsRows, scorePartRowForDisplay);
  const bestOfferByMpn = bestRowsByMpn(offersRows, scoreOfferRowForDisplay);

  return items.map((item) => {
    const mpn = stringVal(item?.mpn);
    if (!mpn) return item;

    const part = bestPartByMpn.get(mpn);
    const offer = bestOfferByMpn.get(mpn);

    return {
      ...item,

      title_display:
        item?.title_display ??
        part?.title_display ??
        offer?.title_display ??
        null,

      feed_title:
        item?.feed_title ??
        part?.feed_title ??
        offer?.feed_title ??
        null,

      title:
        part?.title_display ||
        part?.feed_title ||
        part?.title ||
        item?.title ||
        offer?.title_display ||
        offer?.title ||
        null,

      compatible_models:
        item?.compatible_models ??
        part?.compatible_models ??
        offer?.compatible_models ??
        null,

      compatible_brands:
        item?.compatible_brands ??
        part?.compatible_brands ??
        offer?.compatible_brands ??
        null,

      replaced_by:
        item?.replaced_by ??
        part?.replaced_by ??
        null,

      replaces_previous_parts:
        item?.replaces_previous_parts ??
        part?.replaces_previous_parts ??
        null,

      specific_part_type:
        item?.specific_part_type ??
        part?.specific_part_type ??
        null,

      canonical_part_type:
        item?.canonical_part_type ??
        part?.canonical_part_type ??
        offer?.canonical_part_type ??
        null,

      brand:
        item?.brand ??
        part?.brand ??
        offer?.brand ??
        null,

      image_url:
        item?.image_url ??
        part?.image_url ??
        offer?.image_url ??
        null,
    };
  });
}