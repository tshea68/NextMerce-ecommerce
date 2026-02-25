export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Condition = "both" | "new" | "refurb";
type FacetScope = "global" | "contextual";
type SortKey = "inventory_desc" | "price_desc" | "price_asc" | "newest" | "";
type Availability = "in_stock" | "orderable" | "all";

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
          const count = pickValue(r, ["count", "n", "total", "ct", "cnt"]);
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

function parseSort(v: string | null): SortKey {
  const s = (v || "").trim().toLowerCase();
  if (!s) return "";
  if (s === "inventory_desc" || s === "inventory") return "inventory_desc";
  if (s === "price_desc" || s === "price") return "price_desc";
  if (s === "price_asc") return "price_asc";
  if (s === "newest" || s === "rid_desc") return "newest";
  return "";
}

function parseAvailability(v: string | null, legacyInStockOnly: boolean): Availability {
  const s = (v ?? "").trim().toLowerCase();
  if (s === "in_stock" || s === "instock") return "in_stock";
  if (s === "orderable") return "orderable";
  if (s === "all") return "all";
  if (legacyInStockOnly) return "in_stock";
  return "all";
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

function isPartInStock(stock_status_canon: any, availability_rank: any) {
  const r = Number(availability_rank);
  if (Number.isFinite(r)) return r === 1 || r === 2;

  const s = String(stock_status_canon ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (!s) return true;
  return s === "in_stock" || s === "available" || s === "instock";
}

function applyPartsInStockOnly(qb: any) {
  return qb.or(
    "availability_rank.in.(1,2),stock_status_canon.eq.in_stock,stock_status_canon.eq.available"
  );
}

function applyPartsOrderableOnly(qb: any) {
  return qb.or(
    "stock_status_canon.is.null," +
      "and(" +
      "stock_status_canon.not.ilike.%nla%," +
      "stock_status_canon.not.ilike.%no%longer%," +
      "stock_status_canon.not.ilike.%discontinued%," +
      "stock_status_canon.not.ilike.%obsolete%," +
      "stock_status_canon.not.ilike.%not%available%" +
      ")"
  );
}

function applyGridAllOrderableOnly(qb: any) {
  return qb.or(
    "source.eq.offers," +
      "stock_status_canon.is.null," +
      "and(" +
      "stock_status_canon.not.ilike.%nla%," +
      "stock_status_canon.not.ilike.%no%longer%," +
      "stock_status_canon.not.ilike.%discontinued%," +
      "stock_status_canon.not.ilike.%obsolete%," +
      "stock_status_canon.not.ilike.%not%available%" +
      ")"
  );
}

/**
 * IMPORTANT FIX:
 * - grid_facets_v1 supports p_limit
 * - grid_facets does NOT support p_limit
 */
async function rpcFacets(supabase: any, params: any) {
  const paramsV1 = {
    p_condition: params.p_condition,
    p_q: params.p_q,
    p_appliance_type: params.p_appliance_type,
    p_brands: params.p_brands,
    p_part_types: params.p_part_types,
    p_in_stock_only: params.p_in_stock_only,
    p_model: params.p_model ?? null,
    p_limit: params.p_limit,
  };

  const r1 = await supabase.rpc("grid_facets_v1", paramsV1);
  if (!r1?.error && r1?.data) return { ...r1, rpc: "grid_facets_v1" as const };

  const paramsV0 = {
    p_condition: params.p_condition,
    p_q: params.p_q,
    p_appliance_type: params.p_appliance_type,
    p_brands: params.p_brands,
    p_part_types: params.p_part_types,
    p_in_stock_only: params.p_in_stock_only,
    p_model: params.p_model ?? null,
  };

  const r2 = await supabase.rpc("grid_facets", paramsV0);
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

function isMissingColumnError(err: any) {
  const msg = String(err?.message || err || "").toLowerCase();
  return msg.includes("column") && msg.includes("does not exist");
}

// ===== NEW: tolerant casing for facet filters =====
function titleCaseWords(s: string) {
  return String(s || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

function expandFilterValues(values: string[]) {
  const out = new Set<string>();

  for (const raw of values || []) {
    const v0 = String(raw ?? "").trim();
    if (!v0) continue;

    const vSpace = v0.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();

    const candidates = [
      v0,
      v0.toLowerCase(),
      v0.toUpperCase(),
      titleCaseWords(v0),
      vSpace,
      vSpace.toLowerCase(),
      vSpace.toUpperCase(),
      titleCaseWords(vSpace),
    ];

    for (const c of candidates) {
      const vv = String(c || "").trim();
      if (vv) out.add(vv);
    }
  }

  return Array.from(out);
}

function normalizeFacetScalar(v: string) {
  const s = String(v || "").trim();
  if (!s) return null;
  const spaced = s.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (/[A-Z]/.test(s)) return spaced;
  return titleCaseWords(spaced);
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

  // ✅ SEARCH OVERRIDE MODE (client contract):
  // any non-empty q puts page into search mode -> filters do not apply
  const searchMode = !!qTrim;

  const isExactMpn = !!qTrim && looksLikeExactMpn(qTrim);
  const mpnNorm = isExactMpn ? normMpn(qTrim) : null;

  const applianceTypeIn = (url.searchParams.get("appliance_type") || "").trim();
  const brandsIn = url.searchParams.getAll("brands").map((x) => x.trim()).filter(Boolean);
  const partTypesIn = url.searchParams.getAll("part_types").map((x) => x.trim()).filter(Boolean);

  const legacyInStockOnly = asBool(url.searchParams.get("in_stock_only"));
  let availability: Availability = parseAvailability(url.searchParams.get("availability"), legacyInStockOnly);

  const conditionParam = url.searchParams.get("condition");
  const conditionRaw = (conditionParam || "").toLowerCase();
  const parsedCondition: Condition | null =
    conditionRaw === "new" || conditionRaw === "refurb" || conditionRaw === "both"
      ? (conditionRaw as Condition)
      : null;

  const parsedSort = parseSort(url.searchParams.get("sort"));
  const mixRefurbsParam = clampInt(url.searchParams.get("mix_refurbs"), 0, 100, 0);

  const noDefaults = asBool(url.searchParams.get("no_defaults"));

  // defaults baseline
  let defaultsApplied = false;

  let condition: Condition = parsedCondition ?? "both";
  let sort: SortKey = parsedSort;
  let mix_refurbs = mixRefurbsParam;

  // ✅ apply search override immediately (FORCES: condition=both, availability=all, ignores filters)
  let itemsBrands = brandsIn;
  let itemsPartTypes = partTypesIn;
  let itemsApplianceType = applianceTypeIn;

  if (searchMode) {
    condition = "both";
    availability = "all";
    itemsBrands = [];
    itemsPartTypes = [];
    itemsApplianceType = "";
  }

  const inStockOnly = availability === "in_stock";

  const hasAnyFilter =
    !!q || !!itemsApplianceType || itemsBrands.length > 0 || itemsPartTypes.length > 0 || availability !== "all";

  const isUnboundedBrowse = !hasAnyFilter;

  const conditionWasProvided = parsedCondition != null;

  if (!noDefaults && isUnboundedBrowse && !conditionWasProvided) {
    condition = "refurb";
    defaultsApplied = true;
  }

  if (noDefaults && isUnboundedBrowse && condition !== "new") {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Refusing unbounded browse (no q / brands / part_types / appliance_type / availability filter). Remove no_defaults or supply filters.",
        items: [],
        page,
        per_page: perPage,
      },
      { status: 400 }
    );
  }

  if (!noDefaults && !hasAnyFilter) {
    if (!parsedSort) {
      sort = condition === "new" ? "price_desc" : "inventory_desc";
      defaultsApplied = true;
    }
    if (!mix_refurbs) {
      mix_refurbs = 10;
      defaultsApplied = true;
    }
  }

  const scopeRaw = (url.searchParams.get("facets_scope") || "").toLowerCase();
  const facets_scope: FacetScope = scopeRaw === "global" ? "global" : "contextual";

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

  const refusingGlobalFacets =
    (wantDbFacets || metaOnly) &&
    facets_scope === "global" &&
    isUnboundedBrowse &&
    condition === "both";

  // ✅ when searchMode, we ALWAYS compute facets globally from q only
  const facetsParams = {
    p_condition: condition, // already forced "both" in searchMode
    p_q: q,
    p_appliance_type:
      searchMode
        ? null
        : facets_scope === "contextual"
          ? normalizeFacetScalar(itemsApplianceType || "")
          : null,
    p_brands:
      searchMode
        ? null
        : facets_scope === "contextual"
          ? (itemsBrands.length ? expandFilterValues(itemsBrands) : null)
          : null,
    p_part_types:
      searchMode
        ? null
        : facets_scope === "contextual"
          ? (itemsPartTypes.length ? expandFilterValues(itemsPartTypes) : null)
          : null,
    p_in_stock_only: searchMode ? false : inStockOnly,
    p_model: null,
    p_limit: facetLimit,
  };

  let total_count: number | null = null;

  if ((wantDbFacets || metaOnly) && !refusingGlobalFacets) {
    try {
      const { data, error, rpc } = await rpcFacets(supabase, facetsParams);
      facets_rpc = rpc ?? null;

      if (!error && data) {
        const norm = normalizeFacetsAndTotal(data);
        facets = norm.facets;
        total_count = typeof norm.total_count === "number" ? norm.total_count : total_count;
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
  } else if (wantDbFacets || metaOnly) {
    facets = { brands: [], parts: [], appliances: [] };
    facets_source = "none";
    facets_error =
      "Refused global facets without filters for condition=both (use facets_scope=contextual or add filters).";
  }

  // ===== count-only =====
  if (countOnly) {
    if (wantTotal) {
      let qCount: any = supabase.from("grid_all").select("rid", { head: true, count: "estimated" as any });

      // ✅ in search mode, ignore filters and force both/all
      if (!searchMode) {
        if (condition === "new") qCount = qCount.eq("is_refurb", false);
        if (condition === "refurb") qCount = qCount.eq("is_refurb", true);

        if (itemsApplianceType) qCount = qCount.in("appliance_type", expandFilterValues([itemsApplianceType]));
        if (itemsBrands.length) qCount = qCount.in("brand", expandFilterValues(itemsBrands));
        if (itemsPartTypes.length) qCount = qCount.in("part_type", expandFilterValues(itemsPartTypes));

        if (availability === "in_stock") qCount = qCount.eq("in_stock", true);
        if (availability === "orderable") qCount = applyGridAllOrderableOnly(qCount);
      }

      if (q && !isExactMpn) {
        const like = `%${q}%`;
        qCount = qCount.or(`mpn.ilike.${like},compatible_models.ilike.${like}`);
      }

      const { count } = await qCount;
      if (typeof count === "number") total_count = count;
    }

    return NextResponse.json({
      ok: true,
      condition,
      availability,
      total_count,
      defaults_applied: defaultsApplied,
      took_ms: Date.now() - t0,
    });
  }

  // ===== meta-only =====
  if (metaOnly) {
    if (wantTotal) {
      let qCount: any = supabase.from("grid_all").select("rid", { head: true, count: "estimated" as any });

      // ✅ in search mode, ignore filters and force both/all
      if (!searchMode) {
        if (condition === "new") qCount = qCount.eq("is_refurb", false);
        if (condition === "refurb") qCount = qCount.eq("is_refurb", true);

        if (itemsApplianceType) qCount = qCount.in("appliance_type", expandFilterValues([itemsApplianceType]));
        if (itemsBrands.length) qCount = qCount.in("brand", expandFilterValues(itemsBrands));
        if (itemsPartTypes.length) qCount = qCount.in("part_type", expandFilterValues(itemsPartTypes));

        if (availability === "in_stock") qCount = qCount.eq("in_stock", true);
        if (availability === "orderable") qCount = applyGridAllOrderableOnly(qCount);
      }

      if (q && !isExactMpn) {
        const like = `%${q}%`;
        qCount = qCount.or(`mpn.ilike.${like},compatible_models.ilike.${like}`);
      }

      const { count } = await qCount;
      if (typeof count === "number") total_count = count;
    }

    return NextResponse.json(
      {
        ok: true,
        condition,
        availability,
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
  const to = from + perPage;

  const isBroad =
    !q && !itemsApplianceType && itemsBrands.length === 0 && itemsPartTypes.length === 0 && availability === "all";

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
    return arr.sort(
      (a, b) => byInv(b) - byInv(a) || byPrice(b) - byPrice(a) || byRid(b).localeCompare(byRid(a))
    );
  }

  // --- Exact MPN path ---
  if (isExactMpn && mpnNorm) {
    // ✅ search mode already forces these to true, but keep logic correct
    const wantsOffers = condition === "both" || condition === "refurb";
    const wantsParts = condition === "both" || condition === "new";

    const offerCols =
      "id,listing_id,mpn,title,price,image_url,brand,part_type,appliance_type,inventory_total,compatible_models";
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

            // ✅ search override: do NOT apply filters
            if (!searchMode) {
              if (itemsApplianceType) qb = qb.in("appliance_type", expandFilterValues([itemsApplianceType]));
              if (itemsBrands.length) qb = qb.in("brand", expandFilterValues(itemsBrands));
              if (itemsPartTypes.length) qb = qb.in("part_type", expandFilterValues(itemsPartTypes));
            }

            return qb;
          })()
        : Promise.resolve({ data: [], error: null } as any),

      wantsParts
        ? (async () => {
            let qb: any = supabase
              .from("parts")
              .select(partCols)
              .eq("mpn_normalized", mpnNorm)
              .gt("price", 0);

            // ✅ search override: do NOT apply filters (and availability forced all)
            if (!searchMode) {
              if (itemsApplianceType) qb = qb.in("appliance_type", expandFilterValues([itemsApplianceType]));
              if (itemsBrands.length) qb = qb.in("brand", expandFilterValues(itemsBrands));
              if (itemsPartTypes.length) qb = qb.in("part_type", expandFilterValues(itemsPartTypes));

              if (availability === "in_stock") qb = applyPartsInStockOnly(qb);
              if (availability === "orderable") qb = applyPartsOrderableOnly(qb);
            }

            return qb;
          })()
        : Promise.resolve({ data: [], error: null } as any),

      supabase.from("parts").select(partCols).eq("mpn_normalized", mpnNorm).maybeSingle(),
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
      in_stock: isPartInStock(p?.stock_status_canon, p?.availability_rank),
      availability_rank: p?.availability_rank ?? null,
      replaced_by: p?.replaced_by ?? null,
      replaces_previous_parts: p?.replaces_previous_parts ?? null,
    }));

    function isSellableNewPart(p: any) {
      const price = Number(p?.price ?? 0) || 0;
      const inStock = isPartInStock(p?.stock_status_canon, p?.availability_rank);
      return price > 0 && inStock;
    }

    const exactItem =
      exact_part
        ? {
            rid: `p:${exact_part.id}`,
            source: "parts",
            is_refurb: false,
            listing_id: null,
            mpn: exact_part?.mpn ?? qTrim ?? null,
            title: exact_part?.title ?? null,
            price: exact_part?.price ?? null,
            image_url: exact_part?.image_url ?? null,
            brand: exact_part?.brand ?? null,
            part_type: exact_part?.part_type ?? null,
            appliance_type: exact_part?.appliance_type ?? null,
            stock_status_canon: exact_part?.stock_status_canon ?? null,
            inventory_total: null,
            in_stock: isPartInStock(exact_part?.stock_status_canon, exact_part?.availability_rank),
            availability_rank: exact_part?.availability_rank ?? null,
            replaced_by: exact_part?.replaced_by ?? null,
            replaces_previous_parts: exact_part?.replaces_previous_parts ?? null,
            is_nla: !isSellableNewPart(exact_part),
          }
        : null;

    let combined = sortItems([...mappedOffers, ...mappedParts]);

    if (exactItem) {
      const alreadyIncluded = combined.some((x) => String(x?.rid) === String(exactItem.rid));
      if (!alreadyIncluded) combined = [exactItem, ...combined];
    }

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

    const exact_part_available = exact_part
      ? isPartInStock(exact_part?.stock_status_canon, exact_part?.availability_rank)
      : false;

    return NextResponse.json({
      ok: true,
      condition,
      availability,
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

  // --- Normal browse path (mix landing) ---
  if (mix_refurbs > 0 && condition === "both" && isUnboundedBrowse && page === 1) {
    const takeOffers = Math.min(mix_refurbs, perPage);
    const takeParts = Math.max(perPage - takeOffers, 0);

    const offerCols =
      "id,listing_id,mpn,title,price,image_url,brand,part_type,appliance_type,inventory_total,compatible_models";
    const partCols =
      "id,mpn,title,price,image_url,brand,part_type,appliance_type,stock_status_canon,availability_rank";

    const [offersRes, partsRes] = await Promise.all([
      (async () => {
        let qb: any = supabase
          .from("offers")
          .select(offerCols)
          .gt("price", 0)
          .gt("inventory_total", 0);

        if (itemsApplianceType) qb = qb.in("appliance_type", expandFilterValues([itemsApplianceType]));
        if (itemsBrands.length) qb = qb.in("brand", expandFilterValues(itemsBrands));
        if (itemsPartTypes.length) qb = qb.in("part_type", expandFilterValues(itemsPartTypes));

        qb = qb
          .order("inventory_total", { ascending: false, nullsFirst: false })
          .order("price", { ascending: false, nullsFirst: false })
          .limit(takeOffers + 1);

        return qb;
      })(),
      (async () => {
        let qb: any = supabase.from("parts").select(partCols).gt("price", 0);

        if (itemsApplianceType) qb = qb.in("appliance_type", expandFilterValues([itemsApplianceType]));
        if (itemsBrands.length) qb = qb.in("brand", expandFilterValues(itemsBrands));
        if (itemsPartTypes.length) qb = qb.in("part_type", expandFilterValues(itemsPartTypes));

        if (availability === "in_stock") qb = applyPartsInStockOnly(qb);
        if (availability === "orderable") qb = applyPartsOrderableOnly(qb);

        qb = qb
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
      in_stock: isPartInStock(p?.stock_status_canon, p?.availability_rank),
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
      availability,
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

  // NEW-only browse: hit parts directly
  if (condition === "new") {
    const partCols =
      "id,mpn,title,price,image_url,brand,part_type,appliance_type,stock_status_canon,availability_rank";

    let qb: any = supabase.from("parts").select(partCols).gt("price", 0);

    // ✅ search override already prevented reaching here with condition=new,
    // but keep it robust: only apply filters when not in search mode
    if (!searchMode) {
      if (itemsApplianceType) qb = qb.in("appliance_type", expandFilterValues([itemsApplianceType]));
      if (itemsBrands.length) qb = qb.in("brand", expandFilterValues(itemsBrands));
      if (itemsPartTypes.length) qb = qb.in("part_type", expandFilterValues(itemsPartTypes));

      if (availability === "in_stock") qb = applyPartsInStockOnly(qb);
      if (availability === "orderable") qb = applyPartsOrderableOnly(qb);
    }

    if (q) {
      const like = `%${q}%`;
      qb = qb.or(`mpn.ilike.${like}`);
    }

    const s = sort || "";
    if (s === "price_asc") {
      qb = qb.order("price", { ascending: true, nullsFirst: false }).order("id", { ascending: false });
    } else if (s === "newest") {
      qb = qb.order("id", { ascending: false, nullsFirst: false });
    } else {
      qb = qb.order("price", { ascending: false, nullsFirst: false }).order("id", { ascending: false });
    }

    qb = qb.range(from, to);

    const { data, error } = await qb;

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
    const slice = has_more ? rows.slice(0, perPage) : rows;

    const items = slice.map((p: any) => ({
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
      in_stock: isPartInStock(p?.stock_status_canon, p?.availability_rank),
    }));

    return NextResponse.json({
      ok: true,
      condition,
      availability,
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
      page_inventory_total: null,
      took_ms: Date.now() - t0,
    });
  }

  // --- Default: query grid_all view for refurb/both ---
  const selectColsBase = [
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
    "compatible_models",
    "in_stock",
  ].join(",");

  // Optional model-card fields (if present in your view). If missing, we auto-fallback.
  const selectColsExtended = [
    selectColsBase,
    "model_number",
    "brand_logo_url",
    "total_parts",
    "priced_parts",
  ].join(",");

  function applyCommonFilters(query: any) {
    query = query.gt("price", 0);

    // ✅ search mode: do NOT apply condition/availability/brands/part_types/appliance_type filters
    if (!searchMode) {
      if (condition === "new") query = query.eq("is_refurb", false);
      if (condition === "refurb") query = query.eq("is_refurb", true);

      if (condition === "refurb" && isUnboundedBrowse) {
        query = query.gt("inventory_total", 0);
      }

      if (itemsApplianceType) query = query.in("appliance_type", expandFilterValues([itemsApplianceType]));
      if (itemsBrands.length) query = query.in("brand", expandFilterValues(itemsBrands));
      if (itemsPartTypes.length) query = query.in("part_type", expandFilterValues(itemsPartTypes));

      if (availability === "in_stock") query = query.eq("in_stock", true);
      if (availability === "orderable") query = applyGridAllOrderableOnly(query);
    }

    if (q) {
      const like = `%${q}%`;
      query = query.or(`mpn.ilike.${like},compatible_models.ilike.${like}`);
    }

    return query;
  }

  function applyOrdering(qb: any) {
    const s = sort || "";
    if (s === "newest") {
      return qb.order("rid", { ascending: false, nullsFirst: false });
    } else if (s === "price_asc") {
      return qb.order("price", { ascending: true, nullsFirst: false }).order("rid", { ascending: false });
    } else if (s === "price_desc") {
      return qb.order("price", { ascending: false, nullsFirst: false }).order("rid", { ascending: false });
    } else if (s === "inventory_desc") {
      return qb
        .order("inventory_total", { ascending: false, nullsFirst: false })
        .order("price", { ascending: false, nullsFirst: false })
        .order("rid", { ascending: false, nullsFirst: false });
    } else if (isBroad) {
      return qb
        .order("inventory_total", { ascending: false, nullsFirst: false })
        .order("price", { ascending: false, nullsFirst: false })
        .order("rid", { ascending: false, nullsFirst: false });
    }
    return qb.order("price", { ascending: false, nullsFirst: false }).order("rid", { ascending: false });
  }

  async function runGridAll(selectCols: string) {
    let itemsQ: any = applyCommonFilters(supabase.from("grid_all").select(selectCols));
    itemsQ = applyOrdering(itemsQ);
    itemsQ = itemsQ.range(from, to);
    return await itemsQ;
  }

  let data: any[] = [];
  let error: any = null;

  // Try extended cols first (enables model cards), fallback to base if view lacks those columns.
  {
    const r1 = await runGridAll(selectColsExtended);
    if (!r1.error) {
      data = Array.isArray(r1.data) ? r1.data : [];
    } else if (isMissingColumnError(r1.error)) {
      const r2 = await runGridAll(selectColsBase);
      error = r2.error;
      data = Array.isArray(r2.data) ? r2.data : [];
    } else {
      error = r1.error;
    }
  }

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
    availability,
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