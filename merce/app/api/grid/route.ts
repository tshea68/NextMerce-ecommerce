export const runtime = 'edge';

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

export async function GET(req: Request) {
  const url = new URL(req.url);

  // Your component sends these
  const page = Math.max(parseInt(url.searchParams.get("page") ?? "1", 10) || 1, 1);
  const perPage = Math.min(Math.max(parseInt(url.searchParams.get("per_page") ?? "30", 10) || 30, 1), 100);

  const q = (url.searchParams.get("q") || url.searchParams.get("search") || "").trim();
  const applianceType = (url.searchParams.get("appliance_type") || "").trim();
  const brands = url.searchParams.getAll("brands").filter(Boolean);
  const partTypes = url.searchParams.getAll("part_types").filter(Boolean);
  const inStockOnly = asBool(url.searchParams.get("in_stock_only"));

  // Avoid timeouts by default: planned counts are usually much faster than exact
  const countMode = parseCountMode(url.searchParams.get("count"), "planned");

  const sort = (url.searchParams.get("sort") || "price_desc").trim();

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
    "id,mpn,title,price,image_url,stock_status_canon,brand,part_type,appliance_type";

  let query =
    countMode === "none"
      ? supabase.from("parts").select(selectCols)
      : supabase.from("parts").select(selectCols, { count: countMode });

  if (q) {
    const like = `%${q}%`;
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

  if (applianceType) query = query.eq("appliance_type", applianceType);
  if (brands.length) query = query.in("brand", brands);
  if (partTypes.length) query = query.in("part_type", partTypes);

  if (inStockOnly) {
    query = query.in("stock_status_canon", ["in stock", "instock", "in_stock"]);
  }

  // Sorting
  if (sort === "price_asc") query = query.order("price", { ascending: true, nullsFirst: false });
  else query = query.order("price", { ascending: false, nullsFirst: false });

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message, items: [], total_count: null },
      { status: 500 }
    );
  }

  const items = Array.isArray(data) ? data : [];

  // Facets are computed from returned page for now (fast).
  // If you want full-dataset facets later, we’ll add RPC / SQL views.
  const facets = {
    brands: facet(items, "brand"),
    parts: facet(items, "part_type"),
    appliances: facet(items, "appliance_type"),
  };

  return NextResponse.json({
    ok: true,
    items,
    total_count: countMode === "none" ? items.length : (count ?? items.length),
    totals: {
      new: countMode === "none" ? items.length : (count ?? items.length),
      refurb: 0,
      refurb_only_total: 0,
      new_only_total: countMode === "none" ? items.length : (count ?? items.length),
    },
    facets,
    count_mode: countMode,
  });
}
