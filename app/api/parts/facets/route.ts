// app/api/parts/facets/route.ts
export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function asBool(v: string | null) {
  if (!v) return false;
  const s = v.toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

function clampInt(v: any, lo: number, hi: number, fallback: number) {
  const n = parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(lo, Math.min(hi, n));
}

type Availability = "all" | "in_stock" | "orderable";
type EffectiveAvailability = "all" | "in_stock";
type Condition = "both" | "new" | "refurb";

function normalizeAvailability(v: string | null): Availability {
  const s = (v ?? "").toLowerCase().trim();
  if (s === "in_stock" || s === "instock") return "in_stock";
  if (s === "orderable") return "orderable";
  return "all";
}

function normalizeCondition(v: string | null): Condition {
  const s = (v ?? "").toLowerCase().trim();
  if (s === "new") return "new";
  if (s === "refurb" || s === "refurbished" || s === "offers" || s === "offer") return "refurb";
  return "both";
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

type CacheRow = {
  availability: "all" | "in_stock";
  facet: "brands" | "parts" | "appliances" | string;
  value: string;
  cnt: number | string | null;
};

type FacetOutRow = {
  value: string;
  count: number; // total (new + refurb)
  new_count?: number; // parts count
  refurb_count?: number; // offers count
};

function toNum(v: any) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function estimateTotal(rows: CacheRow[], availability: "all" | "in_stock") {
  // Best-effort: sum counts of a facet that most likely covers the full set.
  const facets = ["brands", "parts", "appliances"];
  let best = 0;

  for (const f of facets) {
    const s = rows
      .filter((r) => r.availability === availability && r.facet === f)
      .reduce((acc, r) => acc + toNum((r as any).cnt ?? (r as any).count), 0);
    if (s > best) best = s;
  }
  return best;
}

function buildFacetMap(rows: CacheRow[], availability: EffectiveAvailability, facet: string) {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.availability !== availability) continue;
    if (r.facet !== facet) continue;
    if (!r.value) continue;
    map.set(r.value, (map.get(r.value) || 0) + toNum((r as any).cnt ?? (r as any).count));
  }
  return map;
}

function mergeFacet(
  partsRows: CacheRow[],
  offersRows: CacheRow[],
  availability: EffectiveAvailability,
  facet: string,
  limit: number,
  mode: Condition
): FacetOutRow[] {
  const partsMap =
    mode !== "refurb" ? buildFacetMap(partsRows, availability, facet) : new Map<string, number>();
  const offersMap =
    mode !== "new" ? buildFacetMap(offersRows, availability, facet) : new Map<string, number>();

  const keys = new Set<string>([...partsMap.keys(), ...offersMap.keys()]);

  const out: FacetOutRow[] = [];
  for (const k of keys) {
    const newCnt = partsMap.get(k) || 0;
    const refurbCnt = offersMap.get(k) || 0;
    const total = newCnt + refurbCnt;
    if (total <= 0) continue;

    // Keep total in `count` for backwards compat; add split counts for UI.
    out.push({
      value: k,
      count: total,
      new_count: newCnt,
      refurb_count: refurbCnt,
    });
  }

  out.sort((a, b) => (b.count || 0) - (a.count || 0));
  return out.slice(0, limit);
}

async function fetchCacheTable(sb: any, tableName: string) {
  const wanted = ["all", "in_stock"];
  const { data, error } = await sb
    .from(tableName)
    .select("availability, facet, value, cnt")
    .in("availability", wanted)
    .limit(8000);

  return { data: (data ?? []) as CacheRow[], error: error?.message || null };
}

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);

    // availability=all|in_stock|orderable
    // back-compat in_stock_only=1
    const availabilityParam = u.searchParams.get("availability");
    const inStockOnly = asBool(u.searchParams.get("in_stock_only"));

    // "orderable" should behave like a non-"all" bucket for cache purposes.
    const availabilityRequested = normalizeAvailability(
      availabilityParam ?? (inStockOnly ? "in_stock" : "all")
    );

    // Cache only has: all | in_stock
    const effectiveAvailability: EffectiveAvailability =
      availabilityRequested === "all" ? "all" : "in_stock";

    // condition=both|new|refurb
    const condition = normalizeCondition(u.searchParams.get("condition"));

    const facetLimit = clampInt(
      u.searchParams.get("facet_limit") ?? u.searchParams.get("limit") ?? 200,
      1,
      500,
      200
    );

    const sb = getSupabase();

    // Pull cache tables as needed
    let partsRows: CacheRow[] = [];
    let offersRows: CacheRow[] = [];
    const sources: string[] = [];
    let warning: string | null = null;

    if (condition === "new" || condition === "both") {
      const r = await fetchCacheTable(sb, "parts_facets_cache");
      if (r.error) {
        // parts cache is foundational; if missing, hard fail
        return NextResponse.json(
          { ok: false, error: r.error, hint: "Could not read parts_facets_cache (RLS/policy/table missing?)" },
          { status: 500, headers: { "Cache-Control": "no-store" } }
        );
      }
      partsRows = r.data;
      sources.push("parts_facets_cache");
    }

    if (condition === "refurb" || condition === "both") {
      const r = await fetchCacheTable(sb, "offers_facets_cache");
      if (r.error) {
        // Do not 500 the whole UI; return warning + empty offers facets
        warning = `offers_facets_cache: ${r.error}`;
        offersRows = [];
      } else {
        offersRows = r.data;
        sources.push("offers_facets_cache");
      }
    }

    // Totals per source (best-effort from cache)
    const partsTotals = {
      all: partsRows.length ? estimateTotal(partsRows, "all") : 0,
      in_stock: partsRows.length ? estimateTotal(partsRows, "in_stock") : 0,
    };
    const offersTotals = {
      all: offersRows.length ? estimateTotal(offersRows, "all") : 0,
      in_stock: offersRows.length ? estimateTotal(offersRows, "in_stock") : 0,
    };

    // Effective totals for this request
    const partsEffective = effectiveAvailability === "in_stock" ? partsTotals.in_stock : partsTotals.all;
    const offersEffective = effectiveAvailability === "in_stock" ? offersTotals.in_stock : offersTotals.all;

    const estimated_total =
      condition === "new"
        ? partsEffective
        : condition === "refurb"
        ? offersEffective
        : partsEffective + offersEffective;

    const estimated_total_all =
      condition === "new"
        ? partsTotals.all
        : condition === "refurb"
        ? offersTotals.all
        : partsTotals.all + offersTotals.all;

    const estimated_total_in_stock =
      condition === "new"
        ? partsTotals.in_stock
        : condition === "refurb"
        ? offersTotals.in_stock
        : partsTotals.in_stock + offersTotals.in_stock;

    // Facets
    const brands = mergeFacet(partsRows, offersRows, effectiveAvailability, "brands", facetLimit, condition);
    const parts = mergeFacet(partsRows, offersRows, effectiveAvailability, "parts", facetLimit, condition);
    const appliances = mergeFacet(partsRows, offersRows, effectiveAvailability, "appliances", facetLimit, condition);

    return NextResponse.json(
      {
        ok: true,
        condition,
        availability: availabilityRequested, // keep what caller asked for
        meta: {
          // Estimated totals for current mode
          estimated_total,
          estimated_total_all,
          estimated_total_in_stock,

          // Split breakdown (you asked for this)
          breakdown: {
            parts_total: partsTotals.all,
            offers_total: offersTotals.all,
            parts_in_stock: partsTotals.in_stock,
            offers_in_stock: offersTotals.in_stock,
          },

          // Trace/debug
          sources,
          warning,
          source: sources[0] || null,
          availability_requested: availabilityRequested,
          effective_availability: effectiveAvailability,
          facet_limit: facetLimit,
        },
        brands,
        parts,
        appliances,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e || "unknown error") },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}