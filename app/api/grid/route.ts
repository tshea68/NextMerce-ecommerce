export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Condition = "both" | "new" | "refurb";
type FacetScope = "global" | "contextual";
type SortKey = "inventory_desc" | "price_desc" | "price_asc" | "newest" | "";

function asBool(v: string | null) {
  if (!v) return false;
  const s = v.toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

function clampInt(n: any, lo: number, hi: number, fallback: number) {
  const x = parseInt(String(n ?? ""), 10);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(lo, Math.min(hi, x));
}

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

function pickValue(obj: any, keys: string[]) {
  for (const k of keys) {
    if (obj?.[k] != null) return obj[k];
  }
  return null;
}

function normalizeFacetList(raw: any, valueKeys: string[]) {
  let v = tryJson(raw);

  if (Array.isArray(v)) {
    return v
      .map((row) => {
        const r = tryJson(row);
        if (r && typeof r === "object") {
          const value = pickValue(r, ["value", ...valueKeys, "name", "key", "label"]);
          const count = pickValue(r, ["count", "n", "total", "ct"]);
          if (value == null) return null;
          return { value: String(value), count: Number(count) || 0 };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => (b.count ?? 0) - (a.count ?? 0));
  }

  if (v && typeof v === "object") {
    return Object.entries(v)
      .map(([key, count]) => ({ value: String(key), count: Number(count) || 0 }))
      .sort((a, b) => b.count - a.count);
  }

  return [];
}

async function rpcFacets(supabase: any, params: any) {
  const r1 = await supabase.rpc("grid_facets_v1", params);
  if (!r1?.error && r1?.data) return { ...r1, rpc: "grid_facets_v1" as const };
  const r2 = await supabase.rpc("grid_facets", params);
  return { ...r2, rpc: "grid_facets" as const };
}

function normalizeFacetsAndTotal(raw: any) {
  const obj = Array.isArray(raw) ? raw[0] : raw;
  const root = tryJson(obj) ?? {};
  const froot = root?.facets && typeof root.facets === "object" ? root.facets : root;

  const brandsRaw =
    froot.brands ?? froot.brand ?? froot.brand_counts ?? froot.brand_facet ?? froot.brandFacet;
  const partsRaw =
    froot.parts ?? froot.part_types ?? froot.part_type ?? froot.partType ?? froot.part_counts;
  const appliancesRaw =
    froot.appliances ??
    froot.appliance_types ??
    froot.appliance_type ??
    froot.applianceType ??
    froot.appliance_counts;

  const totalRaw =
    root.total_count ?? root.total ?? root.count ?? froot.total_count ?? froot.total ?? froot.count;

  const total_count =
    typeof totalRaw === "number"
      ? totalRaw
      : totalRaw != null && String(totalRaw).trim() !== ""
        ? Number(totalRaw)
        : null;

  const facets = {
    brands: normalizeFacetList(brandsRaw, ["brand"]),
    parts: normalizeFacetList(partsRaw, ["part_type", "part", "type"]),
    appliances: normalizeFacetList(appliancesRaw, ["appliance_type", "appliance", "type"]),
  };

  return { facets, total_count: Number.isFinite(Number(total_count)) ? Number(total_count) : null };
}

function parseSort(v: string | null): SortKey {
  const s = (v || "").trim().toLowerCase();
  if (!s) return "";
  if (s === "inventory_desc" || s === "inventory") return "inventory_desc";
  if (s === "price_desc" || s === "price") return "price_desc";
  if (s === "price_asc") return "price_asc";
  if (s === "newest" || s === "rid_desc") return "newest";
  return "";
}

function looksLikeExactMpn(s: string) {
  const q = (s || "").trim();
  if (q.length < 5 || q.length > 50) return false;
  if (q.includes(" ")) return false;
  return /^[A-Za-z0-9._-]+$/.test(q);
}

function normMpn(s: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function GET(req: Request) {
  const t0 = Date.now();
  const url = new URL(req.url);

  const metaOnly = asBool(url.searchParams.get("meta_only"));
  const wantDbFacets = asBool(url.searchParams.get("facets"));
  const countOnly = asBool(url.searchParams.get("count_only"));
  const wantTotal = countOnly || metaOnly || asBool(url.searchParams.get("total"));

  const page = clampInt(url.searchParams.get("page"), 1, 1_000_000, 1);
  const perPage = clampInt(url.searchParams.get("per_page"), 1, 100, 30);

  const qTrim = (url.searchParams.get("q") ?? "").trim();
  const q: string | null = qTrim ? qTrim : null;

  const isExactMpn = !!qTrim && looksLikeExactMpn(qTrim);
  const mpnNorm = isExactMpn ? normMpn(qTrim) : null;

  const applianceTypeIn = (url.searchParams.get("appliance_type") || "").trim();
  const brandsIn = url.searchParams.getAll("brands").map((x) => x.trim()).filter(Boolean);
  const partTypesIn = url.searchParams.getAll("part_types").map((x) => x.trim()).filter(Boolean);
  const inStockOnly = asBool(url.searchParams.get("in_stock_only"));

  const conditionParam = url.searchParams.get("condition");
  const conditionRaw = (conditionParam || "").toLowerCase();
  const parsedCondition: Condition | null =
    conditionRaw === "new" || conditionRaw === "refurb" || conditionRaw === "both"
      ? (conditionRaw as Condition)
      : null;

  const parsedSort = parseSort(url.searchParams.get("sort"));

  // Optional: allow mixing on landing so "both" shows some offers + some parts
  const mixRefurbsParam = clampInt(url.searchParams.get("mix_refurbs"), 0, 100, 0);

  const noDefaults = asBool(url.searchParams.get("no_defaults"));
  const hasAnyFilter =
    !!q || !!applianceTypeIn || brandsIn.length > 0 || partTypesIn.length > 0 || inStockOnly;

  let defaultsApplied = false;

  // Default behavior when no filters: show BOTH pools (not refurb-only)
  let condition: Condition = parsedCondition ?? "both";
  let sort: SortKey = parsedSort;
  let mix_refurbs = mixRefurbsParam;

  if (!noDefaults && !hasAnyFilter) {
    if (!parsedSort) {
      sort = "inventory_desc";
      defaultsApplied = true;
    }
    // If they didn't pass mix_refurbs, default to a visible mix on page 1
    if (!mix_refurbs) {
      mix_refurbs = 10; // 10 offers + 20 parts on a 30/page landing
      defaultsApplied = true;
    }
  }

  const itemsBrands = brandsIn;
  const itemsPartTypes = partTypesIn;
  const itemsApplianceType = applianceTypeIn;

  const scopeRaw = (url.searchParams.get("facets_scope") || "").toLowerCase();
  const facets_scope: FacetScope =
    scopeRaw === "contextual" ? "contextual" : metaOnly ? "global" : "contextual";

  const facetLimit = clampInt(url.searchParams.get("facet_limit"), 1, 5000, 300);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY (or anon key)",
      },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ===== facets / meta =====
  let facets: any = null;
  let facets_source: "db" | "none" | "error" = "none";
  let facets_error: string | null = null;
  let facets_rpc: string | null = null;

  const facetsParams = {
    p_condition: condition,
    p_q: q,
    p_appliance_type: facets_scope === "contextual" ? (itemsApplianceType || null) : null,
    p_brands: facets_scope === "contextual" ? (itemsBrands.length ? itemsBrands : null) : null,
    p_part_types: facets_scope === "contextual" ? (itemsPartTypes.length ? itemsPartTypes : null) : null,
    p_in_stock_only: inStockOnly,
    p_limit: facetLimit,
  };

  let total_count: number | null = null;

  if (wantDbFacets || metaOnly) {
    try {
      const { data, error, rpc } = await rpcFacets(supabase, facetsParams);
      facets_rpc = rpc ?? null;

      if (!error && data) {
        const norm = normalizeFacetsAndTotal(data);
        facets = norm.facets;
        facets_source = "db";
      } else {
        facets = { brands: [], parts: [], appliances: [] };
        facets_source = "error";
        facets_error = String(error?.message || error || "RPC returned no data");
      }
    } catch (e: any) {
      facets = { brands: [], parts: [], appliances: [] };
      facets_source = "error";
      facets_error = String(e?.message || e || "RPC threw");
    }
  }

  // ===== count-only (cheap via grid_all) =====
  if (countOnly) {
    if (wantTotal) {
      const qb = supabase.from("grid_all").select("rid", { head: true, count: "estimated" as any });

      // Basic filters (keep count-only simple)
      let qCount: any = qb;
      if (condition === "new") qCount = qCount.eq("is_refurb", false);
      if (condition === "refurb") qCount = qCount.eq("is_refurb", true);
      if (itemsApplianceType) qCount = qCount.eq("appliance_type", itemsApplianceType);
      if (itemsBrands.length) qCount = qCount.in("brand", itemsBrands);
      if (itemsPartTypes.length) qCount = qCount.in("part_type", itemsPartTypes);
      if (inStockOnly) qCount = qCount.eq("in_stock", true);
      if (q && !isExactMpn) {
        const like = `%${q}%`;
        qCount = qCount.or(`mpn.ilike.${like},title.ilike.${like},brand.ilike.${like}`);
      }
      // Exact MPN count: don’t force heavy OR/ILIKE here; the UI doesn’t need it.

      const { count } = await qCount;
      if (typeof count === "number") total_count = count;
    }

    return NextResponse.json({
      ok: true,
      condition,
      total_count,
      defaults_applied: defaultsApplied,
      took_ms: Date.now() - t0,
    });
  }

  // ===== meta-only =====
  if (metaOnly) {
    if (wantTotal) {
      const qb = supabase.from("grid_all").select("rid", { head: true, count: "estimated" as any });
      let qCount: any = qb;

      if (condition === "new") qCount = qCount.eq("is_refurb", false);
      if (condition === "refurb") qCount = qCount.eq("is_refurb", true);
      if (itemsApplianceType) qCount = qCount.eq("appliance_type", itemsApplianceType);
      if (itemsBrands.length) qCount = qCount.in("brand", itemsBrands);
      if (itemsPartTypes.length) qCount = qCount.in("part_type", itemsPartTypes);
      if (inStockOnly) qCount = qCount.eq("in_stock", true);
      if (q && !isExactMpn) {
        const like = `%${q}%`;
        qCount = qCount.or(`mpn.ilike.${like},title.ilike.${like},brand.ilike.${like}`);
      }

      const { count } = await qCount;
      if (typeof count === "number") total_count = count;
    }

    return NextResponse.json(
      {
        ok: true,
        condition,
        total_count,
        facets,
        facets_source,
        facets_scope,
        facets_rpc,
        facets_error,
        defaults_applied: defaultsApplied,
        took_ms: Date.now() - t0,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=120, stale-while-revalidate=300",
        },
      }
    );
  }

  // ===== items (page) =====
  const from = (page - 1) * perPage;
  const to = from + perPage; // inclusive => perPage+1

  const isBroad =
    !q && !itemsApplianceType && itemsBrands.length === 0 && itemsPartTypes.length === 0 && !inStockOnly;

  function sortItems(arr: any[]) {
    const s = sort || "";
    const byRid = (x: any) => String(x?.rid || "");
    const byPrice = (x: any) => Number(x?.price ?? 0) || 0;
    const byInv = (x: any) => Number(x?.inventory_total ?? 0) || 0;

    if (s === "price_asc") {
      return arr.sort((a, b) => byPrice(a) - byPrice(b) || byRid(b).localeCompare(byRid(a)));
    }
    if (s === "price_desc") {
      return arr.sort((a, b) => byPrice(b) - byPrice(a) || byRid(b).localeCompare(byRid(a)));
    }
    if (s === "newest") {
      return arr.sort((a, b) => byRid(b).localeCompare(byRid(a)));
    }
    // inventory_desc default
    return arr.sort((a, b) => byInv(b) - byInv(a) || byPrice(b) - byPrice(a) || byRid(b).localeCompare(byRid(a)));
  }

  // --- Exact MPN path: use normalized equality (fast), return exact_part even if unavailable ---
  if (isExactMpn && mpnNorm) {
    // 1) “buyable” items (offers in stock + parts rank 1/2) for this MPN
    const wantsOffers = condition === "both" || condition === "refurb";
    const wantsParts = condition === "both" || condition === "new";

    const offerCols = "id,listing_id,mpn,title,price,image_url,brand,part_type,appliance_type,inventory_total,compatible_models";
    const partCols =
      "id,mpn,title,price,image_url,brand,part_type,appliance_type,stock_status_canon,availability_rank,replaced_by,replaces_previous_parts";

    const [offersRes, partsItemsRes, exactPartRes] = await Promise.all([
      wantsOffers
        ? (async () => {
            let qb: any = supabase
              .from("offers")
              .select(offerCols)
              .eq("mpn_norm", mpnNorm)
              .gt("price", 0)
              .gt("inventory_total", 0);

            if (itemsApplianceType) qb = qb.eq("appliance_type", itemsApplianceType);
            if (itemsBrands.length) qb = qb.in("brand", itemsBrands);
            if (itemsPartTypes.length) qb = qb.in("part_type", itemsPartTypes);

            // inStockOnly already implied by inventory_total>0
            return qb;
          })()
        : Promise.resolve({ data: [], error: null } as any),

      wantsParts
        ? (async () => {
            let qb: any = supabase
              .from("parts")
              .select(partCols)
              .eq("mpn_normalized", mpnNorm)
              .gt("price", 0)
              .in("availability_rank", [1, 2]);

            if (itemsApplianceType) qb = qb.eq("appliance_type", itemsApplianceType);
            if (itemsBrands.length) qb = qb.in("brand", itemsBrands);
            if (itemsPartTypes.length) qb = qb.in("part_type", itemsPartTypes);

            // inStockOnly is already enforced by availability_rank 1/2 in browse items
            return qb;
          })()
        : Promise.resolve({ data: [], error: null } as any),

      // exact catalog hit (may be unavailable): no price/rank filter
      supabase
        .from("parts")
        .select(partCols)
        .eq("mpn_normalized", mpnNorm)
        .maybeSingle(),
    ]);

    const offersRows = Array.isArray(offersRes?.data) ? offersRes.data : [];
    const partsRows = Array.isArray(partsItemsRes?.data) ? partsItemsRes.data : [];
    const exact_part = exactPartRes?.data ?? null;

    const mappedOffers = offersRows.map((o: any) => ({
      rid: `o:${o.id}`,
      source: "offers",
      is_refurb: true,
      listing_id: o?.listing_id != null ? String(o.listing_id) : null,
      mpn: o?.mpn ?? null,
      title: o?.title ?? null,
      price: o?.price ?? null,
      image_url: o?.image_url ?? null,
      brand: o?.brand ?? null,
      part_type: o?.part_type ?? null,
      appliance_type: o?.appliance_type ?? null,
      stock_status_canon: null,
      inventory_total: Number(o?.inventory_total ?? 0) || 0,
      in_stock: (Number(o?.inventory_total ?? 0) || 0) > 0,
      compatible_models: o?.compatible_models ?? null,
    }));

    const mappedParts = partsRows.map((p: any) => ({
      rid: `p:${p.id}`,
      source: "parts",
      is_refurb: false,
      listing_id: null,
      mpn: p?.mpn ?? null,
      title: p?.title ?? null,
      price: p?.price ?? null,
      image_url: p?.image_url ?? null,
      brand: p?.brand ?? null,
      part_type: p?.part_type ?? null,
      appliance_type: p?.appliance_type ?? null,
      stock_status_canon: p?.stock_status_canon ?? null,
      inventory_total: null,
      in_stock: true,
      availability_rank: p?.availability_rank ?? null,
      replaced_by: p?.replaced_by ?? null,
      replaces_previous_parts: p?.replaces_previous_parts ?? null,
    }));

    let combined = [...mappedOffers, ...mappedParts];
    combined = sortItems(combined);

    // pagination (normally tiny)
    const pageSlice = combined.slice(from, to + 1);
    const has_more = pageSlice.length > perPage;
    const items = has_more ? pageSlice.slice(0, perPage) : pageSlice;

    let page_inventory_total: number | null = null;
    try {
      let sum = 0;
      let any = false;
      for (const it of items) {
        if (it?.is_refurb === true) {
          const n = Number(it?.inventory_total);
          if (Number.isFinite(n)) {
            sum += n;
            any = true;
          }
        }
      }
      page_inventory_total = any ? sum : null;
    } catch {
      page_inventory_total = null;
    }

    // exact part availability (rank 1/2 => available)
    const exact_part_available =
      exact_part && Number(exact_part?.availability_rank) && [1, 2].includes(Number(exact_part?.availability_rank))
        ? true
        : false;

    return NextResponse.json({
      ok: true,
      condition,
      items,
      has_more,
      page,
      per_page: perPage,
      total_count: combined.length,
      facets,
      facets_source,
      facets_scope,
      facets_rpc,
      facets_error,
      defaults_applied: defaultsApplied,
      page_inventory_total,
      exact_mpn: qTrim,
      exact_part,
      exact_part_available,
      took_ms: Date.now() - t0,
    });
  }

  // --- Normal browse path (fast): query grid_all view ---
  const selectCols = [
    "rid",
    "source",
    "is_refurb",
    "listing_id",
    "mpn",
    "title",
    "price",
    "image_url",
    "brand",
    "part_type",
    "appliance_type",
    "stock_status_canon",
    "inventory_total",
    "in_stock",
  ].join(",");

  function applyCommonFilters(query: any) {
    query = query.gt("price", 0);

    if (condition === "new") query = query.eq("is_refurb", false);
    if (condition === "refurb") query = query.eq("is_refurb", true);

    if (itemsApplianceType) query = query.eq("appliance_type", itemsApplianceType);
    if (itemsBrands.length) query = query.in("brand", itemsBrands);
    if (itemsPartTypes.length) query = query.in("part_type", itemsPartTypes);
    if (inStockOnly) query = query.eq("in_stock", true);

    if (q) {
      const like = `%${q}%`;
      query = query.or(`mpn.ilike.${like},title.ilike.${like},brand.ilike.${like}`);
    }

    return query;
  }

  // If landing mix is enabled and we're broad + both + page 1, fetch offers + parts separately for a visible mix.
  if (mix_refurbs > 0 && condition === "both" && isBroad && page === 1) {
    const takeOffers = Math.min(mix_refurbs, perPage);
    const takeParts = Math.max(perPage - takeOffers, 0);

    const offerCols = "id,listing_id,mpn,title,price,image_url,brand,part_type,appliance_type,inventory_total,compatible_models";
    const partCols = "id,mpn,title,price,image_url,brand,part_type,appliance_type,stock_status_canon,availability_rank";

    const [offersRes, partsRes] = await Promise.all([
      (async () => {
        let qb: any = supabase
          .from("offers")
          .select(offerCols)
          .gt("price", 0)
          .gt("inventory_total", 0)
          .order("inventory_total", { ascending: false, nullsFirst: false })
          .order("price", { ascending: false, nullsFirst: false })
          .limit(takeOffers + 1);
        return qb;
      })(),
      (async () => {
        let qb: any = supabase
          .from("parts")
          .select(partCols)
          .gt("price", 0)
          .in("availability_rank", [1, 2])
          .order("price", { ascending: false, nullsFirst: false })
          .order("id", { ascending: false, nullsFirst: false })
          .limit(takeParts + 1);
        return qb;
      })(),
    ]);

    const offersRows = Array.isArray(offersRes?.data) ? offersRes.data : [];
    const partsRows = Array.isArray(partsRes?.data) ? partsRes.data : [];

    const offersHasMore = offersRows.length > takeOffers;
    const partsHasMore = partsRows.length > takeParts;

    const mappedOffers = offersRows.slice(0, takeOffers).map((o: any) => ({
      rid: `o:${o.id}`,
      source: "offers",
      is_refurb: true,
      listing_id: o?.listing_id != null ? String(o.listing_id) : null,
      mpn: o?.mpn ?? null,
      title: o?.title ?? null,
      price: o?.price ?? null,
      image_url: o?.image_url ?? null,
      brand: o?.brand ?? null,
      part_type: o?.part_type ?? null,
      appliance_type: o?.appliance_type ?? null,
      stock_status_canon: null,
      inventory_total: Number(o?.inventory_total ?? 0) || 0,
      in_stock: true,
    }));

    const mappedParts = partsRows.slice(0, takeParts).map((p: any) => ({
      rid: `p:${p.id}`,
      source: "parts",
      is_refurb: false,
      listing_id: null,
      mpn: p?.mpn ?? null,
      title: p?.title ?? null,
      price: p?.price ?? null,
      image_url: p?.image_url ?? null,
      brand: p?.brand ?? null,
      part_type: p?.part_type ?? null,
      appliance_type: p?.appliance_type ?? null,
      stock_status_canon: p?.stock_status_canon ?? null,
      inventory_total: null,
      in_stock: true,
    }));

    const items = sortItems([...mappedOffers, ...mappedParts]);
    const has_more = offersHasMore || partsHasMore;

    let page_inventory_total: number | null = null;
    try {
      let sum = 0;
      let any = false;
      for (const it of items) {
        if (it?.is_refurb === true) {
          const n = Number(it?.inventory_total);
          if (Number.isFinite(n)) {
            sum += n;
            any = true;
          }
        }
      }
      page_inventory_total = any ? sum : null;
    } catch {
      page_inventory_total = null;
    }

    return NextResponse.json({
      ok: true,
      condition,
      items,
      has_more,
      page,
      per_page: perPage,
      total_count: null,
      facets,
      facets_source,
      facets_scope,
      facets_rpc,
      facets_error,
      defaults_applied: defaultsApplied,
      page_inventory_total,
      took_ms: Date.now() - t0,
    });
  }

  // Default: query grid_all
  let itemsQ: any = applyCommonFilters(supabase.from("grid_all").select(selectCols));

  // sorting (server-side)
  const s = sort || "";
  if (s === "newest") {
    itemsQ = itemsQ.order("rid", { ascending: false, nullsFirst: false });
  } else if (s === "price_asc") {
    itemsQ = itemsQ.order("price", { ascending: true, nullsFirst: false }).order("rid", { ascending: false });
  } else if (s === "price_desc") {
    itemsQ = itemsQ.order("price", { ascending: false, nullsFirst: false }).order("rid", { ascending: false });
  } else if (s === "inventory_desc") {
    if (condition === "new") {
      itemsQ = itemsQ.order("price", { ascending: false, nullsFirst: false }).order("rid", { ascending: false });
    } else {
      itemsQ = itemsQ
        .order("inventory_total", { ascending: false, nullsFirst: false })
        .order("price", { ascending: false, nullsFirst: false })
        .order("rid", { ascending: false, nullsFirst: false });
    }
  } else if (isBroad) {
    if (condition === "refurb" || condition === "both") {
      itemsQ = itemsQ
        .order("inventory_total", { ascending: false, nullsFirst: false })
        .order("price", { ascending: false, nullsFirst: false })
        .order("rid", { ascending: false, nullsFirst: false });
    } else {
      itemsQ = itemsQ.order("price", { ascending: false, nullsFirst: false }).order("rid", { ascending: false });
    }
  } else {
    itemsQ = itemsQ.order("price", { ascending: false, nullsFirst: false }).order("rid", { ascending: false });
  }

  itemsQ = itemsQ.range(from, to);

  const { data, error } = await itemsQ;

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        items: [],
        has_more: false,
        page,
        per_page: perPage,
        total_count,
        facets,
        facets_source,
        facets_scope,
        facets_rpc,
        facets_error,
        defaults_applied: defaultsApplied,
        page_inventory_total: null,
        took_ms: Date.now() - t0,
      },
      { status: 500 }
    );
  }

  const rows = Array.isArray(data) ? data : [];
  const has_more = rows.length > perPage;
  const items = has_more ? rows.slice(0, perPage) : rows;

  let page_inventory_total: number | null = null;
  try {
    let sum = 0;
    let any = false;
    for (const p of items) {
      if (p?.is_refurb === true) {
        const n = Number(p?.inventory_total);
        if (Number.isFinite(n)) {
          sum += n;
          any = true;
        }
      }
    }
    page_inventory_total = any ? sum : null;
  } catch {
    page_inventory_total = null;
  }

  return NextResponse.json({
    ok: true,
    condition,
    items,
    has_more,
    page,
    per_page: perPage,
    total_count,
    facets,
    facets_source,
    facets_scope,
    facets_rpc,
    facets_error,
    defaults_applied: defaultsApplied,
    page_inventory_total,
    took_ms: Date.now() - t0,
  });
}
