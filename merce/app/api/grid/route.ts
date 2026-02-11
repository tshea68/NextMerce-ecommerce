export const runtime = "edge";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type CountMode = "none" | "exact" | "planned" | "estimated";

function asBool(v: string | null) {
  if (!v) return false;
  const s = v.toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

function parseCountMode(v: string | null, d: CountMode): CountMode {
  if (!v) return d;
  const s = v.toLowerCase().trim();
  if (s === "none" || s === "0" || s === "false") return "none";
  if (s === "exact") return "exact";
  if (s === "planned") return "planned";
  if (s === "estimated") return "estimated";
  return d;
}

function facet(items: any[], key: string) {
  const m = new Map<string, number>();
  for (const it of items) {
    const v = (it?.[key] ?? "").toString().trim();
    if (!v) continue;
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return Array.from(m.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

function pickDataset(url: URL) {
  const explicit = (url.searchParams.get("dataset") || "").toLowerCase().trim();
  if (explicit === "offers" || explicit === "refurb") return "offers";
  if (explicit === "parts" || explicit === "new") return "parts";

  const inv = (url.searchParams.get("inv_mode") || url.searchParams.get("inv") || "")
    .toLowerCase()
    .trim();
  if (inv === "offers" || inv === "refurb" || inv === "refurbs") return "offers";

  // default: parts (safe)
  return "parts";
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const page = Math.max(parseInt(url.searchParams.get("page") ?? "1", 10) || 1, 1);
  const perPage = Math.min(Math.max(parseInt(url.searchParams.get("per_page") ?? "30", 10) || 30, 1), 100);

  const q = (url.searchParams.get("q") || url.searchParams.get("search") || "").trim();
  const applianceType = (url.searchParams.get("appliance_type") || "").trim();
  const brands = url.searchParams.getAll("brands").filter(Boolean);
  const partTypes = url.searchParams.getAll("part_types").filter(Boolean);
  const inStockOnly = asBool(url.searchParams.get("in_stock_only"));

  // ✅ default NONE: you said you don't need frontend counting anymore
  const countMode = parseCountMode(url.searchParams.get("count"), "none");

  const sort = (url.searchParams.get("sort") || "price_desc").trim();
  const dataset = pickDataset(url);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { ok: false, error: "Missing NEXT_PUBLIC_SUPABASE_URL and a Supabase key" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // limit+1 paging so we can return has_more without COUNT(*)
  const from = (page - 1) * perPage;
  const to = from + perPage; // ✅ one extra row

  // build select + query per dataset
  let selectCols: string;

  if (dataset === "offers") {
    selectCols =
      "id,listing_id,price,mpn,title,image_url,brand,part_type,appliance_type,inventory_total,inventory_sellers,mpn_norm,ebay_url,marketplace";
  } else {
    selectCols =
      "id,mpn,title,price,image_url,stock_status_canon,brand,part_type,appliance_type";
  }

  let query =
    countMode === "none"
      ? supabase.from(dataset).select(selectCols)
      : supabase.from(dataset).select(selectCols, { count: countMode as any });

  // ✅ Force price conditions so your partial price indexes can be used
  // (This is a big deal for avoiding timeouts on ORDER BY price)
  query = query.not("price", "is", null).gt("price", 0);

  // search
  if (q) {
    // Keep it reasonable: wide OR searches can be expensive.
    // For now we keep the behavior but you can tighten later.
    const like = `%${q}%`;

    if (dataset === "offers") {
      query = query.or([`mpn.ilike.${like}`, `title.ilike.${like}`, `brand.ilike.${like}`].join(","));
    } else {
      query = query.or(
        [
          `mpn.ilike.${like}`,
          `title.ilike.${like}`,
          `brand.ilike.${like}`,
          `part_type.ilike.${like}`,
          `appliance_type.ilike.${like}`,
        ].join(",")
      );
    }
  }

  if (applianceType) query = query.eq("appliance_type", applianceType);
  if (brands.length) query = query.in("brand", brands);
  if (partTypes.length) query = query.in("part_type", partTypes);

  if (inStockOnly) {
    if (dataset === "offers") {
      // netted offers: treat "in stock" as inventory_total > 0
      query = query.gt("inventory_total", 0);
    } else {
      query = query.in("stock_status_canon", ["in stock", "instock", "in_stock"]);
    }
  }

  // sorting
  if (sort === "price_asc") query = query.order("price", { ascending: true, nullsFirst: false });
  else query = query.order("price", { ascending: false, nullsFirst: false });

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message, items: [], total_count: null, dataset },
      { status: 500 }
    );
  }

  const rows = Array.isArray(data) ? data : [];
  const has_more = rows.length > perPage;
  const items = has_more ? rows.slice(0, perPage) : rows;

  // normalize offers rows a bit for the UI
  const normalizedItems =
    dataset === "offers"
      ? items.map((r: any) => ({
          ...r,
          is_refurb: true, // ✅ lets your PartRow treat these as refurb
        }))
      : items;

  // facets computed from current page only (fast)
  const facets = {
    brands: facet(normalizedItems, "brand"),
    parts: facet(normalizedItems, "part_type"),
    appliances: facet(normalizedItems, "appliance_type"),
  };

  // inventory sum (page-level) - cheap, and aligns with your new model
  const page_inventory_total =
    dataset === "offers"
      ? normalizedItems.reduce((acc: number, it: any) => acc + (Number(it?.inventory_total) || 0), 0)
      : null;

  return NextResponse.json({
    ok: true,
    dataset,
    page,
    per_page: perPage,
    has_more,
    items: normalizedItems,

    // only present if countMode requested; otherwise null
    total_count: countMode === "none" ? null : count ?? null,
    count_mode: countMode,

    // don't “count for inventory” anymore — surface the new canonical numbers instead
    page_inventory_total,

    facets,
  });
}
