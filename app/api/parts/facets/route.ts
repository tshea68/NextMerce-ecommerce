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
  count: number;
  new_count?: number;
  refurb_count?: number;
};

function toNum(v: any) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function estimateTotal(rows: CacheRow[], availability: "all" | "in_stock") {
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

    const availabilityParam = u.searchParams.get("availability");
    const inStockOnly = asBool(u.searchParams.get("in_stock_only"));
    const availabilityRequested = normalizeAvailability(
      availabilityParam ?? (inStockOnly ? "in_stock" : "all")
    );

    // IMPORTANT:
    // Cache only supports "all" and "in_stock".
    // For now, collapse "orderable" -> "in_stock" for PARTS so we avoid live SQL timeouts.
    const effectiveAvailability: EffectiveAvailability =
      availabilityRequested === "all" ? "all" : "in_stock";

    const condition = normalizeCondition(u.searchParams.get("condition"));

    const facetLimit = clampInt(
      u.searchParams.get("facet_limit") ?? u.searchParams.get("limit") ?? 40,
      1,
      100,
      40
    );

    const sb = getSupabase();

    let partsRows: CacheRow[] = [];
    let offersRows: CacheRow[] = [];
    const sources: string[] = [];
    let warning: string | null = null;

    // NEW and BOTH now both read parts cache
    if (condition === "new" || condition === "both") {
      const r = await fetchCacheTable(sb, "parts_facets_cache");
      if (r.error) {
        return NextResponse.json(
          {
            ok: false,
            error: r.error,
            hint: "Could not read parts_facets_cache (RLS/policy/table missing?)",
          },
          { status: 500, headers: { "Cache-Control": "no-store" } }
        );
      }
      partsRows = r.data;
      sources.push("parts_facets_cache");
    }

    // REFURB and BOTH read offers cache
    if (condition === "refurb" || condition === "both") {
      const r = await fetchCacheTable(sb, "offers_facets_cache");
      if (r.error) {
        warning = `offers_facets_cache: ${r.error}`;
        offersRows = [];
      } else {
        offersRows = r.data;
        sources.push("offers_facets_cache");
      }
    }

    const partsTotals = {
      all: partsRows.length ? estimateTotal(partsRows, "all") : 0,
      in_stock: partsRows.length ? estimateTotal(partsRows, "in_stock") : 0,
    };

    const offersTotals = {
      all: offersRows.length ? estimateTotal(offersRows, "all") : 0,
      in_stock: offersRows.length ? estimateTotal(offersRows, "in_stock") : 0,
    };

    const partsEffective =
      effectiveAvailability === "in_stock" ? partsTotals.in_stock : partsTotals.all;

    const offersEffective =
      effectiveAvailability === "in_stock" ? offersTotals.in_stock : offersTotals.all;

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

    const brands = mergeFacet(partsRows, offersRows, effectiveAvailability, "brands", facetLimit, condition);
    const parts = mergeFacet(partsRows, offersRows, effectiveAvailability, "parts", facetLimit, condition);
    const appliances = mergeFacet(partsRows, offersRows, effectiveAvailability, "appliances", facetLimit, condition);

    const extraWarning =
      condition === "new" && availabilityRequested === "orderable"
        ? "Parts facets currently collapse orderable into in_stock cache."
        : null;

    return NextResponse.json(
      {
        ok: true,
        condition,
        availability: availabilityRequested,
        meta: {
          estimated_total,
          estimated_total_all,
          estimated_total_in_stock,
          breakdown: {
            parts_total: partsTotals.all,
            offers_total: offersTotals.all,
            parts_in_stock: partsTotals.in_stock,
            offers_in_stock: offersTotals.in_stock,
          },
          sources,
          warning: [warning, extraWarning].filter(Boolean).join(" | ") || null,
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