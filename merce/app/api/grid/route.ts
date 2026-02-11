export const runtime = "edge";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Mode = "parts" | "offers";

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

  // mode: parts (new) or offers (refurb)
  const mode = ((url.searchParams.get("mode") || "parts").toLowerCase().trim() as Mode);
  const page = Math.max(parseInt(url.searchParams.get("page") ?? "1", 10) || 1, 1);
  const perPage = Math.min(Math.max(parseInt(url.searchParams.get("per_page") ?? "30", 10) || 30, 1), 100);

  const q = (url.searchParams.get("q") || url.searchParams.get("search") || "").trim();
  const applianceType = (url.searchParams.get("appliance_type") || "").trim();
  const brands = url.searchParams.getAll("brands").filter(Boolean);
  const partTypes = url.searchParams.getAll("part_types").filter(Boolean);
  const inStockOnly = asBool(url.searchParams.get("in_stock_only"));
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

  // Index-friendly paging: fetch one extra row to compute has_more
  const from = (page - 1) * perPage;
  const toPlusOne = from + perPage; // <-- +1 row

  let query: any;

  if (mode === "offers") {
    // Canonical refurb offers table: inventory_total exists here; no need to “count inventory” on FE.
    const selectCols =
      "id,listing_id,price,mpn,title,image_url,brand,part_type,appliance_type,inventory_total,mpn_norm,ebay_url,marketplace";

    query = supabase.from("offers").select(selectCols);

    if (q) {
      const like = q.length < 4 ? `${q}%` : `%${q}%`;
      query = query.or(
        [
          `mpn.ilike.${like}`,
          `title.ilike.%${q}%`,
          `brand.ilike.%${q}%`,
          `part_type.ilike.%${q}%`,
          `appliance_type.ilike.%${q}%`,
        ].join(",")
      );
    }

    if (applianceType) query = query.eq("appliance_type", applianceType);
    if (brands.length) query = query.in("brand", brands);
    if (partTypes.length) query = query.in("part_type", partTypes);

    // Optional “in stock” meaning for offers: inventory_total > 0 (if you populate it that way)
    if (inStockOnly) query = query.gt("inventory_total", 0);

    if (sort === "price_asc") query = query.order("price", { ascending: true, nullsFirst: false });
    else query = query.order("price", { ascending: false, nullsFirst: false });

    query = query.range(from, toPlusOne);
  } else {
    // parts
    const selectCols =
      "id,mpn,title,price,image_url,stock_status_canon,brand,part_type,appliance_type";

    query = supabase.from("parts").select(selectCols);

    if (q) {
      const like = q.length < 4 ? `${q}%` : `%${q}%`;
      query = query.or(
        [
          `mpn.ilike.${like}`,
          `title.ilike.%${q}%`,
          `brand.ilike.%${q}%`,
          `part_type.ilike.%${q}%`,
          `appliance_type.ilike.%${q}%`,
        ].join(",")
      );
    }

    if (applianceType) query = query.eq("appliance_type", applianceType);
    if (brands.length) query = query.in("brand", brands);
    if (partTypes.length) query = query.in("part_type", partTypes);

    if (inStockOnly) {
      query = query.in("stock_status_canon", ["in stock", "instock", "in_stock"]);
    }

    if (sort === "price_asc") query = query.order("price", { ascending: true, nullsFirst: false });
    else query = query.order("price", { ascending: false, nullsFirst: false });

    query = query.range(from, toPlusOne);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message, items: [], total_count: null, has_more: false },
      { status: 500 }
    );
  }

  const raw = Array.isArray(data) ? data : [];
  const has_more = raw.length > perPage;
  const items = has_more ? raw.slice(0, perPage) : raw;

  const facets = {
    brands: facet(items, "brand"),
    parts: facet(items, "part_type"),
    appliances: facet(items, "appliance_type"),
  };

  return NextResponse.json({
    ok: true,
    mode,
    items,
    // IMPORTANT: we are NOT doing expensive dataset counts here anymore
    total_count: null,
    has_more,
    facets,
  });
}
