export const runtime = "edge";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function asBool(v: string | null) {
  if (!v) return false;
  const s = v.toLowerCase();
  return s === "1" || s === "true" || s === "yes";
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

export async function GET(req: Request) {
  const url = new URL(req.url);

  const dataset = ((url.searchParams.get("dataset") || "parts").toLowerCase() === "offers"
    ? "offers"
    : "parts") as "parts" | "offers";

  const page = Math.max(parseInt(url.searchParams.get("page") ?? "1", 10) || 1, 1);
  const perPage = Math.min(Math.max(parseInt(url.searchParams.get("per_page") ?? "30", 10) || 30, 1), 100);

  const q = (url.searchParams.get("q") || "").trim();
  const model = (url.searchParams.get("model") || "").trim(); // NEW
  const applianceType = (url.searchParams.get("appliance_type") || "").trim();

  const brands = url.searchParams.getAll("brands").filter(Boolean);
  const partTypes = url.searchParams.getAll("part_types").filter(Boolean);
  const inStockOnly = asBool(url.searchParams.get("in_stock_only"));

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

  const selectCols =
    dataset === "parts"
      ? "id,mpn,title,price,image_url,stock_status_canon,brand,part_type,appliance_type"
      : "id,listing_id,mpn,title,price,image_url,brand,part_type,appliance_type,inventory_total,marketplace,compatible_models";

  // IMPORTANT PERFORMANCE:
  // - no count
  // - fetch perPage+1 to compute has_more
  // - filter price > 0 so the price-desc order can use a partial index

  let query = supabase.from(dataset).select(selectCols);

  // base filters
  query = query.not("price", "is", null).gt("price", 0);

  if (q) {
    const like = `%${q}%`;
    // keep OR small: mpn/title/brand only (avoid wide scans)
    query = query.or([`mpn.ilike.${like}`, `title.ilike.${like}`, `brand.ilike.${like}`].join(","));
  }

  if (applianceType) query = query.eq("appliance_type", applianceType);
  if (brands.length) query = query.in("brand", brands);
  if (partTypes.length) query = query.in("part_type", partTypes);

  if (inStockOnly) {
    if (dataset === "parts") {
      query = query.in("stock_status_canon", ["in stock", "instock", "in_stock"]);
    } else {
      // offers
      query = query.gt("inventory_total", 0);
    }
  }

  // model filter applies to offers only (compatible_models)
  if (dataset === "offers" && model) {
    // compatible_models is json in your schema but indexed as (compatible_models::jsonb)
    // supabase .contains uses the @> operator, works best if compatible_models is jsonb.
    // If this ever errors for JSON type, change column to jsonb.
    query = query.contains("compatible_models", [model]);
  }

  // always price desc (no UI sort)
  query = query.order("price", { ascending: false, nullsFirst: false }).order("id", { ascending: false });

  const from = (page - 1) * perPage;
  const to = from + perPage; // fetch one extra
  query = query.range(from, to);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message, items: [], has_more: false },
      { status: 500 }
    );
  }

  const rows = Array.isArray(data) ? data : [];
  const has_more = rows.length > perPage;
  const items = has_more ? rows.slice(0, perPage) : rows;

  const facets = {
    brands: facet(items, "brand"),
    parts: facet(items, "part_type"),
    appliances: facet(items, "appliance_type"),
  };

  const page_inventory_total =
    dataset === "offers"
      ? items.reduce((sum, r) => sum + (Number(r?.inventory_total) || 0), 0)
      : null;

  return NextResponse.json({
    ok: true,
    dataset,
    items,
    has_more,
    page,
    per_page: perPage,
    facets,
    page_inventory_total,
  });
}
